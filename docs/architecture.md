# Arquitectura

## Estado actual

El proyecto actualmente es una aplicación React Native construida con Expo y TypeScript.

La CLI de Supabase está vinculada al proyecto de desarrollo confirmado en la nube, sin Docker ni stack local. La base ya tenía tablas escolares y RLS antes de vincularla; una migración incremental corrigió permisos de perfil y restricciones de pulseras. La app consulta el alumno por UID mediante una función anónima temporal; el responsable confirmó el recorrido con una pulsera real en Android. El login aún no está implementado. El avance está en el [roadmap](roadmap.md).

La lectura NFC en Android está implementada y validada con dos pulseras de muestra. El [roadmap](roadmap.md) resume la anomalía observada durante exposición sostenida y los límites de esa validación.

Todavía no se ha implementado una capa de persistencia offline.

## Schema actual de Supabase

Estado observado en el proyecto de desarrollo el 9 de noviembre de 2026, mediante consultas de metadatos. Es una descripción de lo que existe, no una garantía de que el modelo completo o todas las políticas estén aprobados o validados. No contiene registros ni credenciales.

### Tablas y relaciones

Todas las tablas siguientes están en `public`. Los campos `id` son UUID; salvo `profiles.id`, se generan por defecto. `created_at` tiene por defecto la hora de inserción; las tablas con `updated_at` lo actualizan mediante un trigger.

| Tabla | Contenido y relaciones | Campos adicionales |
|---|---|---|
| `schools` | Escuela; `id` es la PK y `slug` es único. | `name`, `slug`, `created_at`, `updated_at`. |
| `profiles` | Perfil autenticado: `id` referencia `auth.users.id` y `school_id` referencia `schools.id`. Ambos son obligatorios. | `full_name`, `role` (`school` o `tutor`), `created_at`, `updated_at`. |
| `students` | Alumno; `school_id` es obligatorio y referencia `schools`. `tutor_id` es opcional y referencia `profiles`. | `first_name`, `last_name`, `grade`, `group_name`, `student_number`, `active`, `created_at`, `updated_at`. Los tres campos de grado, grupo y número son opcionales. |
| `bracelets` | Pulsera; `school_id` es obligatorio y `student_id` es opcional. Una FK compuesta exige que el alumno asignado pertenezca a la misma escuela. | `uid` único, `active`, `assigned_at` opcional, `created_at`, `updated_at`. |
| `devices` | Dispositivo asociado a una escuela mediante `school_id`. | `name`, `platform`, `device_identifier` opcional, `active`, `created_at`, `updated_at`. La pareja `school_id`/`device_identifier` es única cuando se informa el identificador. |
| `attendance` | Evento con `school_id` y `student_id` obligatorios; `bracelet_id` y `device_id` son opcionales. Cada uno referencia su tabla correspondiente. | `type` (`entry` o `exit`), `occurred_at`, `created_at`. |

`active` es obligatorio y por defecto es `true` en alumnos, pulseras y dispositivos. El índice parcial de `bracelets` permite varias pulseras históricas para un alumno, pero solo una activa asignada. La unicidad del UID se aplica también a las históricas.

### Acceso y límites conocidos

- Las seis tablas tienen RLS habilitado. Las políticas usan funciones en el schema `private` que obtienen la escuela y el rol desde `profiles` para la identidad autenticada. La existencia de RLS **no demuestra por sí sola** que todas las operaciones sean seguras.
- **Excepción temporal de desarrollo:** `public.development_student_by_bracelet` usa `SECURITY DEFINER` y permite a `anon` obtener nombre, grado y grupo de cualquier alumno activo mediante el UID de su pulsera activa, sin aislamiento escolar. No concede lectura directa de las tablas. Debe eliminarse antes de producción o de usar datos reales; las claves públicas no restringen quién puede llamar la función.
- La migración `20261109054000_secure_school_bracelets.sql` limita la actualización de `profiles` por `authenticated` al campo `full_name`; la escuela y el rol no se pueden modificar mediante ese permiso.
- `supabase/tests/school_bracelets.sql` comprueba, con fixtures revertidas, el aislamiento de lectura de alumnos y pulseras entre dos escuelas, el usuario sin escuela, la ausencia del permiso de lectura anónima, los cambios de perfil y las restricciones de pulseras. No cubre todas las políticas ni los demás recursos.
- `supabase/tests/temporary_public_bracelet_lookup.sql` comprueba la consulta anónima temporal, pulseras desconocidas o inactivas y la ausencia de lectura directa de tablas. Estas pruebas no demuestran aislamiento escolar para la función temporal: no lo tiene.
- El schema actual asocia como máximo un `tutor_id` a cada alumno y lo referencia a `profiles`; esto difiere del modelo previsto de varios tutores por alumno y tutor compartido entre escuelas. No se debe asumir que el acceso de tutores está listo.
- Las FK de `attendance` hacia escuela, alumno, pulsera y dispositivo son independientes: no se ha establecido con ellas que todos pertenezcan a la misma escuela. La FK de escuela usa `ON DELETE CASCADE`, por lo que no garantiza por sí sola la preservación histórica requerida. La integridad e inmutabilidad de asistencias siguen pendientes.
- El schema remoto preexistía a las migraciones del repositorio. La migración actual es **incremental**, no un baseline reproducible desde una base vacía. Falta versionar una referencia inicial revisada sin reemplazar datos ni alterar por rutina el historial remoto.

Para el acceso escolar se prevé autenticar al personal y derivar la escuela de la identidad verificada en la base, no de filtros de interfaz ni de `user_metadata`. El alta de cuentas sería administrativa, sin signup público; se propuso Expo SecureStore para la sesión nativa. La clave service-role no debe estar en la app. La consulta anónima temporal debe retirarse antes de producción o de usar datos reales.

El modelo previsto contempla tutores compartibles entre escuelas, con acceso a vínculos filtrado por la escuela del alumno. El schema actual todavía no implementa ese modelo; su acceso, las escrituras de asistencia y la recuperación de contraseña quedan para desarrollos posteriores.

## Dirección planeada

La arquitectura prevista actualmente para el MVP incluye:

- React Native con Expo;
- lectura NFC en Android;
- persistencia local para asistencias offline;
- sincronización con Supabase hospedado.

El [modelo conceptual resumido](roadmap.md#02--modelo-conceptual) es una referencia de producto; el schema remoto existente difiere parcialmente de él.

## Prioridades arquitectónicas

1. Confiabilidad del registro de asistencias.
2. Capacidad de funcionamiento offline.
3. Arquitectura simple.
4. Límites claros entre dominios y responsabilidades.
5. Lógica de negocio fácil de probar.

## Restricciones

No introducir servicios backend ni infraestructura de forma prematura.

Para nuevos datos de desarrollo usar únicamente datos ficticios; la naturaleza de los registros que ya existían no se ha comprobado. La elección de Supabase en la nube no reemplaza la persistencia local futura de asistencias en el dispositivo; son responsabilidades distintas.
