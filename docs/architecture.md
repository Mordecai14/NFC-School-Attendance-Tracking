# Arquitectura

## Estado actual

El proyecto actualmente es una aplicación React Native construida con Expo y TypeScript.

La CLI de Supabase está vinculada al proyecto de desarrollo confirmado en la nube, sin Docker ni stack local. La base ya tenía tablas escolares y RLS antes de vincularla; una migración incremental corrigió permisos de perfil y restricciones de pulseras. La app consulta el alumno por UID mediante una función anónima temporal; el responsable confirmó el recorrido con una pulsera real en Android. Hay un [login automático solo de desarrollo](specs/004-development-auto-login/spec.md), sin pantalla: autentica al arrancar, comprueba `school_access` y muestra una alerta. Requiere variables locales explícitas; su activación y comprobación visual siguen pendientes. El login de producción no está implementado. El avance general está en el [roadmap](roadmap.md).

La lectura NFC en Android está implementada y validada con dos pulseras de muestra. El [roadmap](roadmap.md) resume la anomalía observada durante exposición sostenida y los límites de esa validación.

Todavía no se ha implementado una capa de persistencia offline.

## Schema actual de Supabase

Modelo de la migración `20261110040000_separate_school_access_tutors.sql`, aplicada y registrada en el proyecto de desarrollo confirmado el 10 de noviembre de 2026. Se validaron la preservación de datos y los permisos mediante tests SQL antes y después de aplicarla. La existencia del modelo no significa que el login, la app de tutores ni todas las políticas del sistema estén validados. No contiene registros ni credenciales.

### Tablas y relaciones

Todas las tablas siguientes están en `public`. Los campos `id` son UUID; salvo `profiles.id`, se generan por defecto. Las tablas de relaciones usan una PK compuesta, sin `id` adicional. `created_at`, donde existe, tiene por defecto la hora de inserción; las tablas con `updated_at` lo actualizan mediante un trigger.

| Tabla | Contenido y relaciones | Campos adicionales |
|---|---|---|
| `schools` | Escuela; `id` es la PK y `slug` es único. | `name`, `slug`, `created_at`, `updated_at`. |
| `profiles` | Identidad común; `id` referencia `auth.users.id`. No contiene escuela ni rol exclusivo. | `full_name`, `created_at`, `updated_at`. |
| `school_access` | Acceso del personal; PK (`profile_id`, `school_id`), con FK a `profiles` y `schools`. Una identidad puede tener varios accesos. | Sin datos de identidad duplicados. |
| `student_tutors` | Vínculos familiares; PK (`student_id`, `tutor_id`), con FK a `students` y `profiles`. Permite varios tutores por alumno y alumnos de distintas escuelas por tutor. | Sin escuela propia: se deriva del alumno. |
| `students` | Alumno; `school_id` es obligatorio y referencia `schools`. Los tutores se relacionan mediante `student_tutors`. | `first_name`, `last_name`, `grade`, `group_name`, `student_number`, `active`, `created_at`, `updated_at`. Los tres campos de grado, grupo y número son opcionales. |
| `bracelets` | Pulsera; `school_id` es obligatorio y `student_id` es opcional. Una FK compuesta exige que el alumno asignado pertenezca a la misma escuela. | `uid` único, `active`, `assigned_at` opcional, `created_at`, `updated_at`. |
| `devices` | Dispositivo asociado a una escuela mediante `school_id`. | `name`, `platform`, `device_identifier` opcional, `active`, `created_at`, `updated_at`. La pareja `school_id`/`device_identifier` es única cuando se informa el identificador. |
| `attendance` | Evento con `school_id` y `student_id` obligatorios; `bracelet_id` y `device_id` son opcionales. Cada uno referencia su tabla correspondiente. | `type` (`entry` o `exit`), `occurred_at`, `created_at`. |

`active` es obligatorio y por defecto es `true` en alumnos, pulseras y dispositivos. El índice parcial de `bracelets` permite varias pulseras históricas para un alumno, pero solo una activa asignada. La unicidad del UID se aplica también a las históricas.

### Acceso y límites conocidos

- Las ocho tablas tienen RLS habilitado. Los helpers privados `has_school_access`, `is_student_tutor` y `can_view_profile` comprueban vínculos de la identidad autenticada, sin aceptar una identidad arbitraria del cliente. El personal accede a sus escuelas; los tutores solo leen alumnos y asistencias vinculados. Tener ambos vínculos no concede escritura escolar sobre los hijos de otra escuela.
- **Excepción temporal de desarrollo:** `public.development_student_by_bracelet` usa `SECURITY DEFINER` y permite a `anon` obtener nombre, grado y grupo de cualquier alumno activo mediante el UID de su pulsera activa, sin aislamiento escolar. No concede lectura directa de las tablas. Debe eliminarse antes de producción o de usar datos reales; las claves públicas no restringen quién puede llamar la función.
- La actualización propia de `profiles` sigue limitada a `full_name`. La escuela no puede editar el perfil compartido de un tutor. El personal puede leer perfiles de colegas de sus escuelas y tutores de sus alumnos; el tutor solo lee su propio perfil.
- `school_access` y `student_tutors` se administran mediante operaciones privilegiadas; el cliente no puede insertar, actualizar ni borrar vínculos. Esto evita autoasignarse acceso escolar o vincularse con otros alumnos. La administración de vínculos en UI no forma parte de este incremento.
- `supabase/tests/school_bracelets.sql` comprueba, con fixtures revertidas, el aislamiento de lectura de alumnos y pulseras entre dos escuelas, el usuario sin escuela, la ausencia del permiso de lectura anónima, los cambios de perfil y las restricciones de pulseras. No cubre todas las políticas ni los demás recursos.
- `supabase/tests/temporary_public_bracelet_lookup.sql` comprueba la consulta anónima temporal, pulseras desconocidas o inactivas y la ausencia de lectura directa de tablas. Estas pruebas no demuestran aislamiento escolar para la función temporal: no lo tiene.
- `supabase/tests/school_access_tutors.sql` comprueba tutores compartidos entre escuelas, varios tutores por alumno, identidad simultáneamente escolar y tutor, aislamiento de lectura y escritura, perfiles compartidos y prevención de autoasignación. `school_access_migration.sql` compara filas y vínculos antes y después, además de la definición y los permisos de la RPC NFC.
- `supabase/tests/school_access_independent.sql` conserva los probes adicionales de rechazo de escrituras y hashes de datos invariantes. Por instrucción del responsable, la aplicación y los cuatro conjuntos de tests SQL se ejecutaron desde la sesión principal autorizada. No se presenta esta validación como ejecución de un verificador independiente.
- La migración traslada los accesos `role = 'school'` y todos los `students.tutor_id` existentes antes de retirar esas columnas. El enum anterior permanece sin usarse como fuente de autorización. La [decisión arquitectónica](decisions/001-identidad-accesos-tutores.md) explica el alcance y la recuperación.
- Las FK de `attendance` hacia escuela, alumno, pulsera y dispositivo son independientes: no se ha establecido con ellas que todos pertenezcan a la misma escuela. La FK de escuela usa `ON DELETE CASCADE`, por lo que no garantiza por sí sola la preservación histórica requerida. La integridad e inmutabilidad de asistencias siguen pendientes.
- El schema remoto preexistía a las migraciones del repositorio. La migración actual es **incremental**, no un baseline reproducible desde una base vacía. Falta versionar una referencia inicial revisada sin reemplazar datos ni alterar por rutina el historial remoto.

Para el acceso escolar se prevé autenticar al personal y derivar la escuela de la identidad verificada en la base, no de filtros de interfaz ni de `user_metadata`. El alta de cuentas sería administrativa, sin signup público; se propuso Expo SecureStore para la sesión nativa. La clave service-role no debe estar en la app. La consulta anónima temporal debe retirarse antes de producción o de usar datos reales.

El modelo permite tutores compartibles entre escuelas, con acceso escolar a los vínculos filtrado por la escuela del alumno. Esto no implementa una app de tutores. Se configuraron contraseñas para las seis identidades de prueba y se verificó el login de la cuenta escolar original; no se debe asumir que los cuatro fixtures, sin correo confirmado ni identidades de proveedor, puedan iniciar sesión. Las escrituras de asistencia desde la app y la recuperación de contraseña siguen pendientes.

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
