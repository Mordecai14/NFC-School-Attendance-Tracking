# Roadmap de desarrollo — Asistencia Escolar NFC

## 1. Qué estamos construyendo

Una aplicación para que el personal de una escuela registre **entradas y salidas** de alumnos al acercar sus pulseras NFC a un teléfono Android. Debe seguir funcionando durante una jornada completa sin internet y sincronizar los registros cuando vuelva la conexión.

Posteriormente, una aplicación para tutores permitirá consultar los movimientos de sus hijos y recibir avisos.

**Meta de la primera entrega:** una escuela puede operar una jornada real de asistencia con un Android, sin perder registros por fallas de conexión.

**Leyenda:** `[x]` terminado y comprobado · `[~]` implementado pero pendiente de comprobar · `[ ]` pendiente. Los estados reflejan lo conversado, no una inspección del repositorio.

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

Las etapas siguen el orden recomendado, pero se pueden ajustar si una prueba revela dependencias nuevas. **No son sprints ni equivalen necesariamente a una sola spec.**

---

## 3. Desarrollo de la aplicación escolar

### 01. Lectura de pulseras NFC

**Para qué sirve:** comprobar que el dispositivo puede leer las pulseras reales antes de desarrollar la lógica escolar.

**Qué debe existir al terminar:** pantalla sencilla que detecte pulseras, muestre su identificador y permita seguir escaneando.

- [~] Implementación de `001-nfc-reading` terminada, según lo reportado.
- [x] Confirmar pruebas con Android físico y las pulseras que se usarán.
- [x] Confirmar que una misma pulsera conserva el identificador y que distintas pulseras se distinguen.
- [x] Confirmar manejo de NFC apagado y errores de lectura.

**Se considera terminada cuando:** las pruebas físicas funcionan, no sólo cuando compila.

### 02. Datos de alumnos, pulseras y escuela

**Para qué sirve:** tener información realista para que el sistema sepa quién es cada alumno.

**Qué debe existir al terminar:** base de datos funcional con alumnos y pulseras relacionadas, usando inicialmente datos ficticios.

- [x] Definir las entidades mínimas: escuela, alumno, pulsera, tutor y evento de asistencia.
- [x] Crear y versionar el esquema en Supabase (tablas, relaciones y restricciones).
- [ ] Proteger el acceso a datos mediante políticas y permisos adecuados.
- [x] Cargar alumnos de prueba, por ejemplo mediante CSV.
- [ ] Poder asignar una pulsera a un alumno y evitar asignaciones activas contradictorias.

**Se considera terminada cuando:** existen alumnos de prueba con pulseras asignadas y los datos pueden consultarse de forma autorizada.

### 03. Identificación del alumno

**Para qué sirve:** convertir una lectura NFC en información útil para el operador.

**Qué debe existir al terminar:** escanear una pulsera registrada y ver el alumno asociado.

- [x] Buscar al alumno a partir del identificador de la pulsera.
- [ ] Mostrar nombre, grado y grupo.
- [ ] Mostrar un aviso claro si la pulsera no está registrada o está inactiva.
- [ ] Permitir continuar con la siguiente pulsera sin reiniciar la aplicación.

**Se considera terminada cuando:** varias pulseras distintas muestran al alumno correcto y las desconocidas no producen falsos registros.

### 04. Acceso del personal escolar

**Para qué sirve:** impedir que cualquiera con el dispositivo acceda a información o registre asistencias.

**Qué debe existir al terminar:** acceso autenticado para personal autorizado.

- [ ] Iniciar y cerrar sesión.
- [ ] Limitar acciones y consultas a la escuela y rol autorizados.
- [ ] Definir cómo conservar una sesión operativa ante pérdida temporal de internet.

**Se considera terminada cuando:** un operador autorizado puede trabajar y un usuario no autorizado no puede consultar alumnos ni registrar eventos.

### 05. Entrada y salida de alumnos

**Para qué sirve:** completar el flujo principal que usará el personal todos los días.

**Qué debe existir al terminar:** escanear → identificar alumno → registrar entrada/salida → confirmar → siguiente alumno.

- [ ] Registrar entrada o salida con hora y alumno correcto.
- [ ] Conservar cada evento como parte del historial, sin sobrescribirlo.
- [ ] Mostrar confirmación visible, sonora y/o háptica.
- [ ] Distinguir claramente éxito, error y pulsera no registrada.
- [ ] Tener una pantalla cómoda para registrar alumnos consecutivamente.

**Se considera terminada cuando:** se puede completar una secuencia de entradas y salidas con conexión y verificar cada evento en la base de datos.

### 06. Operación sin internet

**Para qué sirve:** mantener el registro durante una caída de Wi-Fi o datos.

**Qué debe existir al terminar:** la escuela sigue registrando y sabe qué movimientos están pendientes.

- [ ] Mantener en el dispositivo la información mínima autorizada para identificar alumnos sin conexión.
- [ ] Guardar eventos localmente (SQLite) de manera persistente.
- [ ] Conservar pendientes al cerrar y reabrir la app.
- [ ] Indicar al operador cuando los registros todavía no se sincronizan.
- [ ] Evitar pérdida silenciosa de registros.

**Se considera terminada cuando:** con el dispositivo sin conexión se registran varias asistencias y todas siguen guardadas tras reiniciar la aplicación.

### 07. Sincronización y control de duplicados

**Para qué sirve:** entregar correctamente los eventos pendientes y evitar asistencias repetidas.

**Qué debe existir al terminar:** al recuperar conexión, los registros llegan a Supabase una sola vez en términos de efecto, incluso con reintentos.

- [ ] Sincronizar automáticamente cuando sea posible.
- [ ] Reintentar fallos sin perder eventos.
- [ ] Utilizar identificadores únicos e inserciones idempotentes.
- [ ] Ignorar escaneos accidentales repetidos dentro de una ventana definida.
- [ ] Validar duplicados y conflictos también del lado del backend.
- [ ] Mostrar pendientes o errores de sincronización que requieran atención.

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
2. **Pedir al agente un plan corto**: qué tocará, riesgos y cómo verificarlo. Reservar una spec formal para funcionalidades con reglas o riesgos que lo ameriten.
3. **Implementar y comprobar** con lint, TypeScript, pruebas relevantes y validación manual cuando corresponda.
4. **Revisar cambios y cerrar**: commit, actualizar documentación importante y marcar casillas sólo si se comprobaron.

No es necesario generar `spec.md`, `plan.md` y `tasks.md` para cada ajuste visual, cambio pequeño o mejora aislada. Tampoco se deben saltar verificaciones de integridad, privacidad u operación offline por ahorrar pasos.

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
