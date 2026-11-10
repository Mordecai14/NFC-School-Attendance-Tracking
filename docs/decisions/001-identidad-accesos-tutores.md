# Separar identidad, acceso escolar y vínculos familiares

## Decisión

Conservar una identidad común en `profiles`, representar los accesos del personal en `school_access` y los vínculos familiares en `student_tutors`. No duplicar alumnos, pulseras ni asistencias según la aplicación que los consulta.

Esto permite que una persona sea personal y tutor a la vez, que un alumno tenga varios tutores y que un tutor tenga alumnos en distintas escuelas. No se crea una tabla `tutors` sin atributos propios que justifiquen separarla de la identidad.

## Permisos

- El acceso escolar deriva de `school_access`, no de `user_metadata` ni de un rol exclusivo en el perfil.
- La lectura de tutores deriva de `student_tutors`; no habilita administración escolar.
- Solo operaciones privilegiadas administran ambas relaciones. Ninguna cuenta puede concederse acceso desde la app.
- El nombre común solo lo actualiza la propia identidad. Una escuela puede leer los perfiles relacionados, pero no modificar una identidad compartida.
- La consulta NFC anónima temporal permanece como excepción de desarrollo; no debe usarse con datos reales ni en producción.

## Migración y recuperación

`20261110040000_separate_school_access_tutors.sql` conserva todos los IDs y datos no sustituidos. Primero realiza el backfill y comprueba igualdad de vínculos; después reemplaza las policies y elimina `profiles.school_id`, `profiles.role` y `students.tutor_id`. No usa `DROP ... CASCADE` ni borra registros. Incluye `BEGIN/COMMIT` explícitos porque el runner remoto ejecuta los statements individualmente.

Antes de aplicar, ensamblar el test `supabase/tests/school_access_migration.sql` reemplazando su marcador `-- MIGRATION_UNDER_TEST` por el contenido de la migración **sin su `BEGIN/COMMIT` exterior**, para conservar la transacción del test. Ejecutarlo mediante `supabase db query --linked --project-ref <proyecto-confirmado>`: termina en `ROLLBACK`. Los demás tests SQL también revierten sus fixtures y se ejecutan contra el schema nuevo.

Un fallo dentro de la transacción revierte la migración. Una vez aplicada, no volver al modelo anterior automáticamente: varios accesos o tutores ya no cabrían en las columnas únicas. Cualquier recuperación posterior necesita una migración nueva revisada que preserve esas relaciones. No usar `db reset` remoto ni modificar el historial aplicado.

## Fuera de alcance

No se implementan login, app de tutores, administración de vínculos en UI ni un baseline completo del schema. Tampoco se resuelven en este cambio la integridad e inmutabilidad pendientes de asistencias ni el almacenamiento offline.
