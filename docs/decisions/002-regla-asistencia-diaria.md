# 002. Regla de asistencia diaria

- **Estado:** aceptada y aplicada en el proyecto de desarrollo (12 de noviembre de 2026).
- **Migración:** `supabase/migrations/20261112080000_daily_attendance_rule.sql`.

## Contexto

`record_attendance` solo era idempotente por `event_id`: no validaba secuencia ni duplicados por día. Escanear dos veces con ENTRADA generaba dos entradas en la base. La única protección era un filtro del cliente contra callbacks repetidos del último evento confirmado, que además dependía de la memoria de la app y se podía «rearmar» cambiando de modo. Esto contradecía la restricción de producto de que la prevención de duplicados no dependa exclusivamente del cliente.

El producto necesita **un solo par entrada/salida por alumno y día**, con una excepción real: un alumno puede salir y volver a entrar el mismo día (por ejemplo, un tutor lo recoge para una cita médica y regresa). En ese caso el personal debe aceptar explícitamente el movimiento adicional.

## Decisión

### Día escolar

El día es la **fecha local de `occurred_at` en la zona horaria de la escuela**. Se agrega `schools.timezone` (obligatoria, con valor por defecto `America/Mexico_City`, validada contra `pg_timezone_names`). `occurred_at` sigue guardándose en UTC.

### Reglas

Se compara el movimiento nuevo con el **último movimiento del mismo alumno ese día**:

| Último movimiento hoy | Nuevo | Resultado |
|---|---|---|
| ninguno | entrada | se registra |
| ninguno | salida | se registra (ver supuesto 1) |
| entrada | salida | se registra si es la primera salida del día; si ya hubo una salida, requiere confirmación |
| salida | entrada | requiere confirmación (reingreso) |
| entrada | entrada | rechazado como duplicado (`AT001`), sin opción de aceptar |
| salida | salida | rechazado como duplicado (`AT001`) |

Un movimiento que requiere confirmación se rechaza con `AT002` hasta que el cliente reenvíe **el mismo `event_id`** con `event_confirmed = true`. Los eventos aceptados como excepción quedan marcados con `attendance.confirmed_repeat = true`; los demás siempre quedan en `false`.

### Dónde se aplica

- **En la base de datos**, mediante el trigger `attendance_validate_rule` (`BEFORE INSERT` sobre `attendance`). Así la regla alcanza también a los `insert` directos permitidos por RLS y no solo a la RPC. Se ejecuta después de `attendance_validate_insert`, de modo que los errores de relaciones (`23514`) conservan su precedencia.
- **Concurrencia:** un `pg_advisory_xact_lock` por alumno y día local serializa las escrituras de varios dispositivos. La RPC toma el lock antes de buscar el evento, para que el reintento concurrente de un mismo evento siga siendo idempotente.
- **Idempotencia:** un `event_id` ya guardado devuelve su recibo sin evaluar la regla, de modo que un reintento tras una respuesta perdida nunca se rechaza ni se duplica.
- **En el cliente:** el filtro local de duplicados se eliminó; el servidor es la única fuente de la regla. El cliente traduce `AT001`/`AT002` en estados propios (`duplicate`, `confirm`) y muestra la alerta al personal.

### Contrato de la RPC

`record_attendance` pasa a recibir un octavo parámetro `event_confirmed boolean default false`. Se eliminó la firma anterior de siete parámetros para evitar sobrecargas ambiguas en PostgREST. El cliente solo envía `event_confirmed` cuando vale `true`, por lo que sigue siendo compatible con la firma previa.

## Comportamiento del cliente

- `AT001`: no se guardó nada; el journal local se limpia y el maestro ve un aviso destacado («Entrada ya registrada» o «Salida ya registrada», con el nombre del alumno y qué hacer a continuación). El aviso aparece venga de un escaneo, de un reintento o de una confirmación, para que el rechazo nunca sea silencioso, y desaparece al cambiar de modo. Solo los movimientos confirmados por el servidor se agregan a la lista de lecturas recientes.
- `AT002`: el recorder pasa a `confirm` y **conserva el journal**. Si la app se cierra, al reabrir se vuelve a preguntar. «Confirmar» reenvía el mismo evento con la confirmación; «Cancelar» limpia el journal por decisión explícita del maestro y no se guarda nada. El botón Atrás de Android no cierra la alerta: el maestro debe elegir una de las dos opciones.

## Supuestos

1. Una salida sin entrada previa ese día se permite (el personal puede haber olvidado escanear la llegada).
2. No se guarda el motivo de la excepción (médico, familiar, etc.), solo que fue confirmada. Registrar el motivo sería un requisito nuevo.
3. La regla aplica a eventos nuevos. Los datos de prueba existentes no se modifican y no se agrega ninguna restricción de unicidad: los reingresos legítimos la violarían.
4. Se compara contra el último evento por `occurred_at` (desempate por `id`). Los eventos que lleguen fuera de orden por una sincronización tardía no se reordenan. Hoy la app no tiene cola offline, por lo que esta limitación no se manifiesta; debe revisarse al implementarla.

## Alternativas descartadas

- **Índice único por alumno, tipo y día:** impide los reingresos legítimos y no puede expresar la confirmación.
- **Control solo en el cliente:** contradice la restricción de producto y no protege contra varios dispositivos ni escrituras directas.
- **Validar solo dentro de la RPC:** RLS permite `insert` directo en `attendance` al personal; la regla se podría saltar.

## Consecuencias

- Una app anterior contra la base nueva vería los rechazos como un fallo genérico de red y dejaría el evento en reintento. Es aceptable mientras exista un único proyecto de desarrollo con datos ficticios; con más dispositivos habría que coordinar el despliegue (migración primero, app después).
- La cola offline futura debe respetar la regla: un evento diferido puede recibir `AT001`/`AT002` al sincronizarse y necesitará un flujo de revisión; no debe descartarse en silencio.
- Cualquier cambio de zona horaria de una escuela modifica la frontera del día para los eventos nuevos, no para los ya guardados.

## Pruebas

- `supabase/tests/attendance.sql`: cada fila de la tabla, la confirmación y su auditoría, la idempotencia de reintentos, la frontera de día en `America/Mexico_City` (UTC-6), la imposibilidad de saltar la regla con un `insert` directo y la no alteración del historial por eventos rechazados.
- `tests/attendance.test.mjs`, `tests/attendance-scanner.test.mjs` y `tests/scan-screen.test.mjs`: errores tipados, estados `confirm` y `duplicate`, journal conservado o limpio, y alerta de confirmación.
- La concurrencia entre dispositivos (advisory lock) no se prueba de forma automatizada: no hay un runner que abra sesiones paralelas.
