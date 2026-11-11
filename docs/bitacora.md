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

## Entradas y salidas sobre el nuevo diseño

Se conservaron la paleta violeta, las tarjetas, el indicador NFC animado y las lecturas recientes. La tarjeta del alumno incorpora «Registrar entrada» y «Registrar salida», con una confirmación separada que identifica al alumno y el movimiento guardado. Después de confirmar, hay que retirar y volver a acercar la pulsera para otro movimiento.

Cada intento usa un UUID y una hora estables. Se guarda localmente antes de enviarlo; si falla la red o se pierde la respuesta, queda visible y bloquea nuevos movimientos hasta reintentarlo. Al reiniciar se recupera ese mismo intento. Un almacenamiento inválido no se borra silenciosamente. Esto protege un intento pendiente, pero no implementa todavía una jornada offline ni sincronización automática.

En Supabase se aplicó `20261110070000_record_attendance.sql`. La base comprueba que escuela, alumno, pulsera y dispositivo correspondan y estén activos al insertar; protege las referencias históricas y rechaza modificar o borrar eventos. `record_attendance` confirma el mismo evento al repetir su ID y contenido, y rechaza reutilizar ese ID con otro contenido. La consulta del alumno ahora incluye sus identificadores para congelar el evento correcto.

Para estas pruebas se usa el único dispositivo activo del catálogo de la escuela. Si no hay exactamente uno, no se elige arbitrariamente ni se envía el evento; el aprovisionamiento físico de dispositivos de producción sigue pendiente.

Validación: 27 tests del cliente, TypeScript, cinco suites SQL antes/después de aplicar y export web de producción pasaron. La prueba HTTP real conservó exactamente dos eventos ficticios, una entrada y una salida, aunque se simuló pérdida de respuesta y se hicieron reintentos concurrentes. Los IDs son `3f57b986-5065-4500-a6f9-da6631243a26` y `95f996d2-434a-4c73-b240-ec59a323c067`; se mantienen como historial de pruebas. La recuperación del controlador se verificó con un journal persistente de prueba, no con un cierre físico en Android.

Se agregaron `expo-crypto` y `expo-secure-store`, con su configuración nativa y lockfile. Se recompiló e instaló el development client en el Android conectado mediante `npx expo run:android --device <dispositivo> --no-install --no-bundler`, sin desinstalar ni borrar datos. Ambos módulos aparecen enlazados en el build. Para incorporar estos módulos a otros dispositivos también hay que recompilar; no alcanza con recargar Metro. El preview web usa almacenamiento local y datos ficticios. La exportación de producción no contiene la contraseña de desarrollo.

Comprobación Android: ADB estaba fuera del PATH, pero se encontró el teléfono mediante la ruta del SDK. El build terminó correctamente y se verificó por captura la pantalla de espera, conservando el diseño y sin errores visibles de almacenamiento. El manifest de Metro mantiene habilitado el login de desarrollo. Falta acercar físicamente la pulsera para comprobar botones, confirmación y recuperación nativa de un evento en el teléfono.

Pendientes de entorno: lint conserva el fallo anterior en `use-color-scheme.web.ts:11`. pnpm agregó los dos módulos, pero sus comandos de instalación terminaron con `ERR_PNPM_IGNORED_BUILDS` por el script no aprobado de `unrs-resolver`; no se autorizó ni ejecutó ese script ajeno al incremento, ni se cambió la política de builds. Esto no impidió compilar e instalar el APK.

## Selección del modo antes del escaneo

Se revisaron `design/stitch/control-escolar-nfc/nfc-scan.png` y su HTML. El selector Entrada/Salida ahora está encima del sensor: Entrada aparece seleccionada por defecto en verde y Salida se distingue en ámbar. Sustituye los botones posteriores a la lectura; al identificar una pulsera válida se registra automáticamente el movimiento seleccionado. No se agregaron los contadores ficticios ni el ingreso manual del mockup.

El modo se captura al recibir el evento NFC, no al terminar la consulta del alumno. Cambiarlo por sí solo nunca vuelve a procesar la pulsera anterior. Mientras se identifica o resuelve un registro se pausan las nuevas lecturas aceptadas y la selección de modo; los pendientes conservan su tipo y el mismo ID para reintentar.

Se bloquean callbacks repetidos de la última pulsera confirmada con el mismo alumno y tipo. Para repetir intencionalmente ese movimiento hay que seleccionar de nuevo el modo y volver a acercar la pulsera. Otra selección, por sí sola, no escribe eventos. No se introdujo una ventana temporal ni una regla de asistencia diaria.

Validación: 34 tests y TypeScript pasaron; lint mantiene únicamente el fallo preexistente. Se comprobó por captura en Android el selector superior con Entrada activa y el diseño conservado. La interacción remota no pudo completarse porque Android rechazó `INJECT_EVENTS`; no se cambiaron permisos ni ajustes del teléfono. No se requieren migraciones, dependencias nuevas ni reconstruir el APK; basta recargar JavaScript si Metro no actualizó la pantalla.

Validación física posterior: el responsable confirmó que las pruebas de entrada y salida fueron exitosas. Una consulta de solo lectura a Supabase verificó una entrada y una salida nuevas: hay cuatro eventos en total, dos de cada tipo, incluyendo los dos eventos de prueba anteriores. No se encontraron eventos con relaciones entre escuelas distintas. Queda comprobado el recorrido online de selección de modo, escaneo y guardado en el dispositivo; la operación offline completa sigue pendiente.
