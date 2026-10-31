# Contrato de acceso a datos escolares

## Frontera

La aplicación se conecta directamente a Supabase Auth y a la API de datos generada por Supabase. No se añade una API backend propia. La autorización de filas se aplica en PostgreSQL mediante grants y RLS.

## Identidad y permisos

- Cada JWT autenticado corresponde a un `auth.users.id` vinculado a una sola fila de `schools`.
- `schools.auth_user_id` es la fuente confiable de asociación. No se autoriza usando `user_metadata` ni valores `school_id` enviados por el cliente sin comprobarlos en RLS.
- Los usuarios no autenticados no leen datos escolares.
- La cuenta de una escuela solo obtiene filas de esa escuela. Los filtros de UI no sustituyen RLS.
- La identidad/nombre del tutor global puede ser visible para cada escuela que tenga un vínculo propio con él; el cliente solo obtiene esos vínculos y nunca los alumnos ni relaciones de otras escuelas.

## Operaciones de 003

- Auth: login por correo/contraseña, restauración/consulta de sesión y logout; sin signup.
- Datos: la base conserva y permite consultar escuelas, alumnos, pulseras, tutores, vínculos y eventos. La app realiza consultas autenticadas limitadas por escuela; en 003 no escribe estos datos.
- Mutaciones iniciales del esquema y datos: migraciones, fixtures y aprovisionamiento administrativo confiable. La app no gestiona escuelas, alumnos, tutores ni pulseras en esta fase; escrituras desde el cliente requieren una feature aprobada posterior.
- Eventos: la base impone identidad única e inmutabilidad; no se habilita escritura de asistencias desde la app hasta las features de registro/sincronización.

## Manejo de errores y secretos

- La denegación RLS no debe presentarse como una consulta exitosa con datos de otra escuela.
- Una identidad de evento repetida se rechaza por unicidad y no modifica la fila existente; la feature de sincronización decidirá cómo tratar ese conflicto como reintento.
- La app contiene solo `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. La publishable key no es un secreto y requiere RLS.
- Claves secret/service-role y credenciales de administración no se empaquetan ni exponen al cliente.
