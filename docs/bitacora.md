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

## Lectura NFC según la pestaña visible

El lector dependía del montaje de Escaneo y del estado de la app, pero no del foco de navegación. Ahora se activa al entrar en Escaneo o Registro y se libera al salir; Historial no mantiene un lector activo. Se conserva la pausa al pasar la app a segundo plano.

Un coordinador compartido serializa el registro y la liberación nativos. Solo la pantalla propietaria puede recibir lecturas; los callbacks anteriores se invalidan inmediatamente, sin esperar el cierre nativo. Los cambios rápidos de pestaña y un cierre tardío no pueden desactivar el nuevo consumidor. Un fallo de cierre bloquea la nueva activación hasta que pueda completarse, sin superponer lectores. Esto no cancela un registro de asistencia ya aceptado ni descarta sus pendientes.

Registro captura el identificador en el formulario y permite limpiarlo junto con los demás campos. Esa lectura no llama al registro de asistencia, no vincula todavía la pulsera ni guarda alumnos en Supabase. Se conservó el diseño existente.

Validación: 42 tests y TypeScript pasaron; lint conserva únicamente el error preexistente en `src/hooks/use-color-scheme.web.ts:11`. Los tests nuevos cubren transferencia entre consumidores, callbacks tardíos, cambios rápidos, registro/cierre nativo demorado, segundo plano, NFC deshabilitado y recuperación tras fallo de cierre. En Android se abrió Registro mediante deep link y se revisó visualmente la tarjeta de captura. Al navegar a Historial y volver a Escaneo, `dumpsys nfc` confirmó la desactivación (`flags: 0`) y reactivación (`flags: 143`) del modo lector. Falta probar la captura con pulsera física en Registro y los cambios de pestaña mediante toques. No hubo cambios de backend, dependencias ni rebuild del APK.

## Verificación de pulsera antes de mostrar el formulario

Registro mantiene oculto el formulario hasta que Supabase confirma que el identificador leído no existe. Durante la consulta, si ya existe o si ocurre un error, el formulario permanece oculto. Los fallos permiten volver a escanear para reintentar; una respuesta anterior no puede habilitar otra pulsera ni una pantalla que ya perdió el foco. La pulsera confirmada queda fijada mientras se completa el formulario; «Limpiar y usar otra pulsera» permite iniciar otra verificación. Al salir de la pestaña se invalida la verificación y se requiere escanear de nuevo.

Con confirmación explícita del responsable para `tjaofzevroceamukxsze`, se aplicó `20261110080000_bracelet_exists.sql`. La nueva RPC exige una identidad con acceso escolar y solo devuelve un booleano de existencia global: incluye pulseras inactivas, sin alumno y de otras escuelas, sin revelar escuela, alumno ni otros datos. No se reutiliza `student_by_bracelet`, porque su respuesta vacía también puede significar que la pulsera existe pero no está disponible para asistencia.

Esto habilita completar el formulario, no guardar alumnos: el botón de guardado continúa deshabilitado hasta implementar el alta. La verificación tampoco reserva el identificador; el futuro guardado debe rechazar conflictos en el backend aunque otra operación lo haya registrado después de consultar.

Validación: 47 tests del cliente, TypeScript y `git diff --check` pasaron. La migración y sus tests se probaron primero en una transacción revertida; después de aplicar, pasaron las suites SQL de existencia, consulta autenticada de alumnos y asistencia, con fixtures revertidas. Cubren pulseras existentes/inactivas/de otra escuela, UID desconocido, UID inválido, acceso sin escuela, identidad ausente y acceso anónimo. Una prueba HTTP real confirmó `true` para la pulsera existente, `false` para un UID desconocido y `401` sin sesión; se cerró la sesión de prueba y no se insertaron datos. Lint mantiene únicamente el error preexistente del hook web. Se revisó en Android el estado inicial sin formulario. No hubo nuevas dependencias ni rebuild del APK.

Validación física posterior: el responsable confirmó que la pulsera ya asociada se reconoce correctamente y que una pulsera nueva abre el formulario. Esta prueba valida la detección y la apertura condicional, no el guardado del alumno ni la vinculación persistente, que siguen pendientes.

## Alta de alumno y vinculación de pulsera

Tras verificar una pulsera nueva, Registro permite guardar nombres y apellidos del alumno, con matrícula, grado y grupo opcionales. Se ocultaron temporalmente los campos de tutores y la fotografía, según el alcance acordado: no se crean cuentas de Auth, contactos ni vínculos de tutores. El formulario conserva su apariencia y solo confirma el éxito después de recibir la respuesta de Supabase y completar la limpieza del intento local. «Registrar otro alumno» inicia una nueva lectura.

Se aplicó `20261110090000_register_student.sql` en el proyecto de pruebas confirmado. La RPC `register_student` comprueba acceso a la escuela y guarda alumno, pulsera y recibo de solicitud en una sola transacción. Una pulsera que ya existe, incluso si se registró después de la verificación inicial, provoca rollback sin dejar un alumno huérfano. Los recibos privados vinculan el UUID con el operador, la escuela, los datos y el resultado; un reintento idéntico devuelve los mismos IDs y un contenido diferente se rechaza. No se agregó una regla de unicidad de matrícula que no existía en el modelo.

Antes de enviar, la app conserva el intento con UUID y datos estables en un journal de SecureStore, independiente del pendiente de asistencia. Una respuesta perdida, un fallo de almacenamiento o la pérdida de permisos no permiten descartarlo ni reemplazarlo silenciosamente; se puede reintentar el mismo intento y recuperarlo después de reiniciar. Cambiar de pestaña no cancela un guardado aceptado. Los rechazos explícitos por conflicto o datos inválidos permiten iniciar otra alta o corregir datos. El preview web usa localStorage con datos ficticios. Esto protege un alta pendiente, no implementa registro offline ni sincronización automática.

Validación:

- 57 tests del cliente y TypeScript pasaron; se agregaron tests de validación, doble envío, pérdida de respuesta, recuperación, fallos de almacenamiento y confirmaciones inválidas. `git diff --check` pasó.
- La migración y sus tests pasaron primero en una transacción revertida. Tras aplicar, pasaron las suites SQL de alta, existencia de pulseras, consulta autenticada de alumnos y asistencia. Cubren aislamiento, autorización, integridad del vínculo, rollback ante conflicto, recibos privados e idempotencia; las fixtures SQL se revirtieron.
- Una prueba HTTP real verificó reintentos concurrentes, respuesta perdida y recuperación desde un journal de archivo sin duplicar alumno ni pulsera. También comprobó conflictos, consulta del nuevo alumno desde el flujo de asistencia y rechazo anónimo `401`. Se eliminaron únicamente el alumno, la pulsera y el recibo de esa fixture mediante sus IDs exactos; se cerró la sesión de prueba y no se modificaron asistencias.
- Lint conserva el fallo preexistente en `src/hooks/use-color-scheme.web.ts:11`. No se agregaron dependencias ni se requiere rebuild del APK.
- El Android dejó de estar conectado al intentar la revisión visual final del agente. Posteriormente, el responsable confirmó que el registro funciona y que también funcionan la entrada y salida del alumno nuevo. Queda validado por el responsable el recorrido de alta del alumno, vinculación de pulsera y registro de ambos movimientos. Sigue pendiente comprobar la recuperación de un alta tras cierre físico en Android.

## Regla de asistencia diaria

Un alumno tenía dos entradas en la base al escanear dos veces con ENTRADA. Se definió y aplicó la regla de un par entrada/salida por alumno y día, con la excepción confirmada de salida y reingreso; el razonamiento, los supuestos y las alternativas están en la [decisión 002](decisions/002-regla-asistencia-diaria.md).

Con confirmación del responsable de que el proyecto Supabase vinculado (`tjaofzevroceamukxsze`) es de pruebas y no productivo, se aplicó `20261112080000_daily_attendance_rule.sql` con `supabase db push`, tras un `--dry-run` que listaba solo esa migración. Agrega `schools.timezone`, `attendance.confirmed_repeat`, un índice por alumno y fecha, el trigger `attendance_validate_rule` y la nueva firma de `record_attendance`. No se usó `db reset`: el esquema remoto es anterior a las migraciones y no hay baseline que lo recree.

En la app, el servidor es ahora la única fuente de la regla. Un duplicado se informa al personal sin guardar nada; un movimiento adicional abre una alerta con Confirmar y Cancelar y conserva el journal local mientras espera la respuesta.

Validación:

- 76 tests del cliente, TypeScript y ESLint de los archivos modificados pasaron. Se agregaron tests de errores tipados, estados `confirm` y `duplicate`, journal conservado o limpio, y alerta de confirmación.
- `supabase/tests/attendance.sql` pasó contra el proyecto de pruebas (transacción revertida) con los casos nuevos: secuencias, confirmación y su auditoría, idempotencia, frontera de día en `America/Mexico_City` y `insert` directo. Las demás suites SQL se ejecutaron sin errores, salvo `school_access_migration.sql`, que ya fallaba antes de este cambio porque consulta `profiles.role`, una columna retirada por una migración anterior.
- Una verificación independiente de solo lectura confirmó la regla SQL (borde de medianoche local, `insert` directo, `confirmed_repeat` falsificado, códigos de error previos) y encontró tres defectos del cliente: un `AT001` recibido tras reintentar o confirmar se descartaba sin aviso y la lista reciente podía mostrar un movimiento no guardado. Se corrigieron y se cubrieron con tests que usan el recorder real. El botón Atrás ya no cancela la alerta en silencio.
- `npm run lint` completo conserva el fallo preexistente en `src/hooks/use-color-scheme.web.ts:11`.

Para probar desde cero se vació `attendance` en el proyecto de pruebas (15 eventos ficticios) con `TRUNCATE`, porque el trigger de inmutabilidad bloquea `DELETE`; alumnos y pulseras no se modificaron y los triggers siguieron activos. Con la primera prueba física se hizo más visible el rechazo por duplicado: ahora es una tarjeta de alerta destacada («Entrada ya registrada» / «Salida ya registrada») en lugar de texto pequeño dentro de otras tarjetas.

Validación física: el responsable confirmó en el dispositivo que la implementación funciona como se espera, incluido el rechazo del reintento del mismo tipo y su aviso.

Pendiente: la concurrencia entre dos dispositivos (sin prueba automatizada) y el tratamiento de estos rechazos en la futura cola offline. El enlace de `architecture.md` a `decisions/001-identidad-accesos-tutores.md` sigue roto porque ese archivo no existe; no se corrigió en este cambio.

## Pantalla de Historial

Se recreó el diseño `design/stitch/control-escolar-nfc/attendance-history.png` con los datos existentes: resumen de entradas y salidas del día, búsqueda por nombre, filtros Todos/Entradas/Salidas, selector Hoy/Ayer y lista con avatar de iniciales, hora y badge. Lee `attendance` con `students` embebido bajo RLS (sin migraciones ni dependencias) mediante `src/services/attendance-history.ts`; el día se calcula en `America/Mexico_City`, igual que la regla diaria.

Validación: tests nuevos en `tests/attendance-history.test.mjs`, suite completa (80 tests) y TypeScript pasaron; lint conserva únicamente el error preexistente en `src/hooks/use-color-scheme.web.ts:11`. No se validó visualmente en dispositivo ni emulador.

Pendiente (el diseño lo muestra, pero no hay datos que lo respalden): estado Retardo, porcentaje de asistencia (falta el total de alumnos), fotos, matrícula y «Descargar Reporte del Día». Tampoco distingue eventos aún pendientes de sincronizar.

Verificación contra Supabase (solo lectura, login de desarrollo): la primera consulta falló con `PGRST201` porque `attendance` tiene dos FK hacia `students` y el embed era ambiguo. Se corrigió con `students!attendance_student_id_fkey(...)`; la consulta real devolvió 6 registros de hoy y 0 de ayer. La validación visual en dispositivo sigue pendiente.
