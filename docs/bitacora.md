# Bitácora de desarrollo

## Consulta de alumnos con sesión escolar

La app ahora obtiene el JWT de la sesión antes de buscar al alumno por pulsera. Si la autenticación falla, no intenta consultar anónimamente. La lectura NFC y la presentación del alumno conservan su funcionamiento.

En Supabase se aplicó `20261110060000_authenticated_student_lookup.sql`: la función `student_by_bracelet` usa los permisos del usuario y RLS, exige acceso escolar y solo devuelve alumnos y pulseras activos. Se eliminó `development_student_by_bracelet`; las referencias anteriores a esa consulta anónima en la documentación describen un comportamiento retirado.

Comprobaciones realizadas:

- 18 tests de la app y TypeScript: pasaron.
- Cuatro conjuntos de tests SQL: pasaron antes y después de aplicar, con fixtures revertidas. Cubren aislamiento entre escuelas, rechazo de acceso anónimo, tutores sin acceso escolar, cuentas sin asignación y pulseras/alumnos inactivos.
- Comparación con el comportamiento anterior: la cuenta escolar sigue recibiendo el mismo alumno autorizado.
- Prueba HTTP real: consulta autenticada correcta, consulta anónima `401` y endpoint retirado `404`. Se cerró la sesión de prueba.
- Datos conservados: dos escuelas, diez alumnos, seis perfiles, diez vínculos de tutores y una pulsera; cero asistencias.
- `git diff --check`: pasó. Lint sigue fallando en `src/hooks/use-color-scheme.web.ts:11`, un problema preexistente fuera de este cambio.

Falta comprobar este cambio visualmente en Android: recargar la app, esperar la alerta de sesión iniciada y escanear la pulsera. No se implementó registro de entradas/salidas ni se crearon specs o tasks.
