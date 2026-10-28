## Contexto

Aplicación Android para que los docentes de una escuela registren entradas y salidas de alumnos mediante pulseras NFC.

**Stack:** React Native, `react-native-nfc-manager` y Supabase para autenticación y datos.
**Decisiones de alcance:** conexión obligatoria, cuenta compartida de la escuela, sin roles, alumnos precargados y vinculación de pulseras protegida por código.

## Backlog

1. Como docente, quiero iniciar sesión con la cuenta de la escuela y escanear una pulsera vinculada en modo «Entrada», para registrar el ingreso del alumno.
2. Como docente, quiero seleccionar el modo «Salida» y escanear una pulsera vinculada, para registrar el egreso del alumno. Requires: #1
3. Como docente, quiero ver dónde acercar la pulsera y los escaneos más recientes en la pantalla principal, para realizar y consultar los registros sin cambiar de sección. Requires: #1
4. Como docente, quiero consultar las entradas y salidas del día en una sección dedicada, para revisar la asistencia diaria. Requires: #1
5. Como desarrollador, quiero acceder a «Vincular Pulsera» mediante un código, seleccionar un alumno existente y escanear su pulsera, para dejarla asociada y lista para registrar asistencia.
