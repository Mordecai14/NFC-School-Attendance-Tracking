# Roadmap de desarrollo — Asistencia Escolar NFC

## 1. Qué estamos construyendo

Una aplicación para que el personal de una escuela registre **entradas y salidas** de alumnos al acercar sus pulseras NFC a un teléfono Android. Debe seguir funcionando durante una jornada completa sin internet y sincronizar los registros cuando vuelva la conexión.

Posteriormente, una aplicación para tutores permitirá consultar los movimientos de sus hijos y recibir avisos.

**Meta de la primera entrega:** una escuela puede operar una jornada real de asistencia con un Android, sin perder registros por fallas de conexión.

**Leyenda:** `[x]` terminado y comprobado · `[~]` implementado pero con validación pendiente o alcance parcial · `[ ]` pendiente. Estados contrastados con el código y la evidencia de [la bitácora](bitacora.md); no implican que se hayan repetido todas las pruebas al actualizar este documento.

## Estado actual y siguiente incremento

**El recorrido online está validado en Android:** seleccionar Entrada/Salida → escanear → identificar al alumno → guardar y confirmar en Supabase. La prueba física de entrada y salida quedó registrada en la bitácora. Hay consulta autenticada, aislamiento por escuela e historial inmutable con reintentos idempotentes.

**Siguiente incremento acordado: registro de alumnos y asignación de pulseras desde la app (02).** Dar de alta un alumno con nombre, grado y grupo, escanear una pulsera y vincularla sin asignaciones activas contradictorias. Comprobar después el recorrido de entrada y salida con varios alumnos y pulseras, usando datos ficticios y conexión a Supabase.

**Orden inmediato:** completar el flujo de alumnos/pulseras (02) y su validación con varios alumnos (03 y 05); después abordar el inicio y cierre de sesión para operación real (04). Se prioriza preparar los datos desde la app para dejar de depender de su carga manual en Supabase.

**Offline y sincronización automática (06 y 07) se posponen por decisión del responsable**, sin eliminarlos como requisitos del MVP. La protección actual conserva un solo intento pendiente y exige reintento manual antes de aceptar otro; no es una cola offline. La identificación, la obtención del dispositivo y el inicio de sesión de desarrollo dependen de la red. Al retomar offline habrá que resolver también el acceso autorizado durante la jornada sin conexión.

Antes de un piloto siguen pendientes el acceso operativo del personal, el aprovisionamiento del dispositivo, la gestión de alumnos/pulseras y la prueba de una jornada completa. Esta actualización orienta el trabajo; no inicia la implementación.

## 2. Mapa completo del producto

```text
APLICACIÓN ESCOLAR (MVP)

01. Leer pulseras NFC
         ↓
02. Preparar alumnos, pulseras y base de datos
         ↓
03. Identificar al alumno al escanear
         ↓
04. Proteger el acceso del personal
         ↓
05. Registrar entradas y salidas
         ↓
06. Registrar sin internet
         ↓
07. Sincronizar y evitar duplicados
         ↓
08. Preparar y probar la operación escolar
         ↓
    ★ MVP ESCUELA LISTO ★
         ↓
APLICACIÓN PARA TUTORES (SEGUNDA ENTREGA)

09. Acceso y vinculación de tutores
         ↓
10. Consulta de asistencia e historial
         ↓
11. Notificaciones de entrada y salida
```

El mapa conserva los identificadores de las capacidades, no representa una secuencia rígida. La prioridad vigente es completar el bloque 02, validar varios alumnos y continuar con el acceso operativo del bloque 04; offline queda para después. **No son sprints ni equivalen necesariamente a una sola spec.**

---

## 3. Desarrollo de la aplicación escolar

### 01. Lectura de pulseras NFC

**Para qué sirve:** comprobar que el dispositivo puede leer las pulseras reales antes de desarrollar la lógica escolar.

**Qué debe existir al terminar:** pantalla sencilla que detecte pulseras, muestre su identificador y permita seguir escaneando.

- [x] Lectura NFC implementada y utilizada en el recorrido físico de entrada y salida.
- [x] Confirmar pruebas con Android físico y las pulseras que se usarán.
- [x] Confirmar que una misma pulsera conserva el identificador y que distintas pulseras se distinguen.
- [x] Confirmar manejo de NFC apagado y errores de lectura.

**Se considera terminada cuando:** las pruebas físicas funcionan, no sólo cuando compila.

### 02. Datos de alumnos, pulseras y escuela

**Para qué sirve:** tener información realista para que el sistema sepa quién es cada alumno.

**Qué debe existir al terminar:** registrar alumnos desde la app y vincular sus pulseras NFC en la escuela autorizada, sobre la base existente y usando inicialmente datos ficticios.

- [x] Definir las entidades mínimas: escuela, alumno, pulsera, tutor y evento de asistencia.
- [x] Crear y versionar el esquema en Supabase (tablas, relaciones y restricciones).
- [x] Proteger el acceso a datos mediante políticas y permisos adecuados para las consultas y el registro implementados.
- [x] Cargar alumnos de prueba, por ejemplo mediante CSV.
- [x] Dar de alta un alumno desde la app con nombre, grado y grupo, dentro de la escuela autorizada.
- [x] Leer una pulsera NFC para vincularla al alumno y confirmar el guardado.
- [ ] Evitar asignaciones activas contradictorias sin sobrescribir silenciosamente un vínculo existente.
- [ ] Proteger el alta y la asignación mediante permisos y aislamiento por escuela en el backend.
- [ ] Comprobar con varios alumnos y pulseras que cada vínculo permite registrar la entrada y salida del alumno correcto.

Existen datos ficticios y una pulsera asignada para las pruebas; esto no equivale a disponer de un flujo de gestión de asignaciones en la app.

**Se considera terminada cuando:** el personal puede crear alumnos ficticios y vincular pulseras desde la app, sin preparar esos registros manualmente en Supabase; las asignaciones contradictorias se rechazan y las entradas/salidas quedan asociadas al alumno y escuela correctos.

### 03. Identificación del alumno

**Para qué sirve:** convertir una lectura NFC en información útil para el operador.

**Qué debe existir al terminar:** escanear una pulsera registrada y ver el alumno asociado.

- [x] Buscar al alumno a partir del identificador de la pulsera.
- [x] Mostrar nombre, grado y grupo.
- [~] Mostrar un aviso claro si la pulsera no está registrada o está inactiva: implementado y cubierto por tests; falta comprobar ese caso físicamente.
- [x] Permitir continuar escaneando sin reiniciar la aplicación cuando no hay un registro pendiente.

La prueba física del recorrido escolar usó una pulsera registrada. Sigue pendiente validar una secuencia de varios alumnos con distintas pulseras.

**Se considera terminada cuando:** varias pulseras distintas muestran al alumno correcto y las desconocidas no producen falsos registros.

### 04. Acceso del personal escolar

**Para qué sirve:** impedir que cualquiera con el dispositivo acceda a información o registre asistencias.

**Qué debe existir al terminar:** acceso autenticado para personal autorizado.

- [~] Autenticar al personal: existe login automático solo de desarrollo; faltan el inicio y cierre de sesión para operación real.
- [x] Limitar las consultas de alumnos y el registro de asistencias a la escuela y los permisos autorizados, con tests de aislamiento y rechazo de acceso no autorizado.
- [ ] Definir cómo conservar una sesión operativa ante pérdida temporal de internet.

**Se considera terminada cuando:** un operador autorizado puede trabajar y un usuario no autorizado no puede consultar alumnos ni registrar eventos.

### 05. Entrada y salida de alumnos

**Para qué sirve:** completar el flujo principal que usará el personal todos los días.

**Qué debe existir al terminar:** seleccionar Entrada/Salida → escanear → identificar alumno → registrar automáticamente → confirmar → siguiente alumno.

- [x] Registrar entrada o salida con hora y alumno correcto, usando el modo seleccionado antes del escaneo.
- [x] Conservar cada evento como parte del historial, sin sobrescribirlo.
- [x] Mostrar confirmación visible del alumno y movimiento guardado en Supabase.
- [~] Distinguir claramente éxito, error y pulsera no registrada: implementado; faltan pruebas físicas de los casos de error y pulsera desconocida.
- [~] Tener una pantalla para registrar alumnos consecutivamente: selector y registro automático comprobados; falta una secuencia representativa con varios alumnos.

**Evidencia:** entrada y salida físicas exitosas confirmadas por el responsable y verificadas en Supabase. Las pruebas HTTP comprobaron recuperación de respuesta perdida y reintentos concurrentes sin duplicar efectos. No se ha validado todavía una jornada escolar completa.

**Se considera terminada cuando:** se puede completar una secuencia de entradas y salidas con conexión y verificar cada evento en la base de datos.

### 06. Operación sin internet

**Prioridad:** pospuesta; se conserva como requisito pendiente del MVP.

**Para qué sirve:** mantener el registro durante una caída de Wi-Fi o datos.

**Qué debe existir al terminar:** la escuela sigue registrando y sabe qué movimientos están pendientes.

- [ ] Mantener en el dispositivo la información mínima autorizada para identificar alumnos sin conexión.
- [ ] Guardar eventos localmente (SQLite) de manera persistente.
- [~] Conservar pendientes al cerrar y reabrir la app: existe recuperación de un intento y tests del controlador; faltan cola de múltiples eventos y prueba de cierre físico en Android.
- [~] Indicar al operador cuando los registros todavía no se sincronizan: visible para un intento; falta el estado de la cola offline.
- [ ] Evitar pérdida silenciosa de registros.

**Se considera terminada cuando:** con el dispositivo sin conexión se registran varias asistencias y todas siguen guardadas tras reiniciar la aplicación.

### 07. Sincronización y control de duplicados

**Prioridad:** se pospone la sincronización automática hasta retomar la operación offline. Se conservan las protecciones de idempotencia y callbacks ya implementadas.

**Para qué sirve:** entregar correctamente los eventos pendientes y evitar asistencias repetidas.

**Qué debe existir al terminar:** al recuperar conexión, los registros llegan a Supabase una sola vez en términos de efecto, incluso con reintentos.

- [ ] Sincronizar automáticamente cuando sea posible.
- [~] Reintentar fallos sin perder eventos: reintento manual del mismo intento implementado y probado; falta aplicarlo a una cola offline.
- [x] Utilizar identificadores únicos e inserciones idempotentes, conservando ID, hora y contenido en los reintentos.
- [x] Ignorar callbacks repetidos del último alumno/pulsera/escuela/tipo confirmado; una selección explícita del modo rearma una nueva lectura intencional.
- [x] Validar reintentos y conflictos de ID/contenido también del lado del backend, junto con la integridad de las relaciones escolares.
- [~] Mostrar pendientes o errores de sincronización que requieran atención: disponible para un intento; falta seguimiento de múltiples eventos.

No se ha definido una ventana temporal ni una regla de asistencia diaria. La protección actual de callbacks no sustituye la idempotencia del backend ni establece esas reglas de producto.

**Se considera terminada cuando:** una conexión intermitente, reintentos y reinicios no provocan pérdidas ni registros duplicados.

### 08. Preparación y prueba escolar

**Para qué sirve:** pasar de una demo funcional a una herramienta que realmente se puede usar en la escuela.

**Qué debe existir al terminar:** un flujo probado con una jornada simulada y los datos iniciales preparados.

- [ ] Validar una secuencia representativa de alumnos y pulseras.
- [ ] Probar entrada y salida, escaneo rápido, pulseras desconocidas y lectura doble.
- [ ] Probar internet normal, sin internet y conexión intermitente.
- [ ] Verificar el historial final contra los escaneos realizados.
- [ ] Documentar un procedimiento simple de operación y recuperación ante errores.
- [ ] Corregir errores que impidan la operación.

**Se considera terminada cuando:** el personal puede realizar una jornada de prueba completa sin perder datos y sin depender de asistencia técnica continua.

**Hito: MVP de la aplicación escolar listo para piloto.**

---

## 4. Segunda entrega — Aplicación para tutores

Esta aplicación aprovecha los mismos alumnos y eventos registrados por la escuela. No es necesaria para validar el MVP operativo inicial.

### 09. Acceso y vinculación de tutores

- [ ] Autenticar al tutor.
- [ ] Asociarlo exclusivamente con sus hijos autorizados.
- [ ] Permitir que un tutor consulte a más de un hijo, cuando aplique.

**Resultado:** el tutor inicia sesión y ve únicamente sus alumnos vinculados.

### 10. Estado e historial de asistencia

- [ ] Mostrar última entrada o salida registrada de cada hijo.
- [ ] Consultar historial por fecha.
- [ ] Diferenciar un evento sincronizado de uno todavía no disponible en el servidor.

**Resultado:** el tutor puede comprobar cuándo quedó registrada la llegada o salida de su hijo.

### 11. Notificaciones

- [ ] Enviar aviso cuando el servidor confirme una entrada o salida.
- [ ] Evitar avisos duplicados por reintentos de sincronización.
- [ ] Permitir configurar permisos de notificación en el teléfono.

**Resultado:** el tutor recibe avisos confiables sin asumir que un registro local pendiente ya llegó al servidor.

**Hito: experiencia básica de tutores lista para piloto.**

---

## 5. Cómo usar este roadmap al desarrollar con IA

Este documento responde **qué falta por construir**; `docs/product.md` describe el producto y `docs/architecture.md` explica cómo funciona el código actual.

Para cada bloque:

1. **Elegir un resultado concreto** del bloque, no necesariamente desarrollar toda la etapa en una sola sesión.
2. **Pedir al agente un plan corto**: qué tocará, riesgos y cómo verificarlo.
3. **Implementar y comprobar** con lint, TypeScript, pruebas relevantes y validación manual cuando corresponda.
4. **Revisar cambios y cerrar**: actualizar la bitácora y los estados pertinentes. No crear specs ni tasks por rutina; hacer commit únicamente si se solicita explícitamente.


### Prompt breve para OpenCode

```text
Vamos a trabajar en la etapa [NÚMERO] de docs/roadmap.md, específicamente en [RESULTADO O CHECKBOX].

Lee AGENTS.md, docs/product.md, docs/architecture.md y esa sección del roadmap.
Revisa primero el código existente y propón un plan breve con los cambios necesarios,
riesgos y forma de comprobar el resultado. No agregues alcance ni documentación innecesaria.
Espera mi aprobación antes de modificar código.
Después implementa, ejecuta las validaciones pertinentes y reporta qué quedó
comprobado y qué requiere prueba manual. No hagas commit.
```

## 6. Reglas para mantenerlo útil

- Este roadmap es **del producto**, no un registro de comandos de Spec Kit.
- Una etapa puede requerir varias sesiones o pequeñas implementaciones.
- El orden puede cambiar por dependencias o resultados de pruebas: registra el motivo si ocurre.
- Una casilla sólo se marca terminada si hay evidencia de que funciona.
- No usar datos reales de menores en entornos de prueba ni exponerlos en registros.
