# Modelo de datos físico propuesto para 003

Este esquema traduce las entidades aprobadas en [el modelo conceptual de 002](../002-data-model/data-model.md) a PostgreSQL. No incorpora datos de contacto ni se deben cargar datos reales hasta aprobar la política de retención.

## Entidades y campos

| Tabla | Campos principales | Reglas |
|---|---|---|
| `schools` | `id uuid`, `name text`, `auth_user_id uuid` | `id` PK; nombre requerido; `auth_user_id` requerido, FK a `auth.users(id)`, `UNIQUE` y `ON DELETE RESTRICT`. Una cuenta por escuela y una escuela por cuenta. |
| `students` | `id uuid`, `school_id uuid`, `name text`, `grade text`, `group_name text` | `school_id` FK requerida a `schools`; solo atributos aprobados; admite cero tutores y cero pulseras activas. |
| `bracelets` | `id uuid`, `student_id uuid`, `nfc_uid text`, `status text` | UID requerido, no vacío y `UNIQUE` global, incluso para reemplazadas; estado limitado a `active` o `replaced`; FK a alumno. Índice único parcial sobre `student_id` donde `status = 'active'`. |
| `tutors` | `id uuid`, `name text` | Identidad global compartible entre escuelas. Solo nombre; sin teléfono, correo ni otros datos personales. |
| `student_tutors` | `student_id uuid`, `tutor_id uuid`, `relationship text` | Tabla puente muchos-a-muchos; PK compuesta `(student_id, tutor_id)`; FKs requeridas; relación requerida. |
| `attendance_events` | `id uuid`, `student_id uuid`, `event_type text`, `occurred_at timestamptz` | Identidad global PK; FK al alumno; tipo limitado a `entry`/`exit`; momento requerido. El id enviado en reintentos debe conservarse. |

Los UUID pueden generarse por defecto en registros creados en línea, pero los eventos futuros generados sin conexión deben aceptar una identidad ya creada por el dispositivo. Ninguna repetición del mismo ID puede producir una segunda fila o cambiar el evento original.

## Relaciones

```text
schools 1 ─── 0..* students
students * ─── * tutors       (mediante student_tutors; el tutor puede abarcar escuelas)
students 1 ─── 0..* bracelets (máximo una activa; las reemplazadas permanecen)
students 1 ─── 0..* attendance_events
schools 1 ─── 1 auth.users     (mediante schools.auth_user_id)
```

## Integridad e invariantes

- FKs en toda relación; campos de identidad y relaciones no nulos.
- `schools.auth_user_id` único y requerido; la provisión debe crear Auth user y escuela asociada. Un usuario sin asociación no obtiene filas.
- `bracelets.nfc_uid` tiene unicidad global y no puede ser vacío.
- Un índice único parcial impide más de una pulsera activa por alumno. Cambiar a `replaced` conserva el registro anterior.
- `attendance_events.id` es globalmente único. Una restricción limita el tipo de evento; un trigger rechaza `UPDATE` y `DELETE` para preservar la inmutabilidad incluso ante errores administrativos. Una obligación legal futura de borrado requerirá una decisión específica; por ahora no se cargan datos reales.
- La relación alumno-tutor admite varios tutores por alumno, varios alumnos por tutor y un mismo tutor vinculado a alumnos de escuelas diferentes.
- No se agregan cascadas de borrado que puedan eliminar historial o datos relacionados accidentalmente.

## Acceso y privacidad

- Habilitar RLS para todas las tablas expuestas por la API; revisar grants explícitos para `anon` y `authenticated`.
- `anon` no recibe acceso a tablas. `authenticated` recibe solo `SELECT` con políticas por escuela; 003 no expone mutaciones de datos desde la app porque aún no hay flujos de alta/cambio aprobados. Las migraciones, fixtures locales y la provisión inicial usan el contexto administrativo confiable.
- La cuenta autenticada se identifica mediante `auth.uid()` y `schools.auth_user_id`. RLS limita escuelas, alumnos, pulseras, relaciones y asistencias a esa escuela.
- `student_tutors` solo revela vínculos cuyos alumnos pertenecen a la escuela actual.
- `tutors` solo revela tutores con al menos un vínculo visible a alumnos de esa escuela. La consulta no expone los otros alumnos ni los otros vínculos de un tutor compartido.
- En 003, la app no recibe permisos de mutación global para `tutors` o `student_tutors`. La provisión y asociación inicial se hace en entorno administrativo confiable; no se incluye UI para gestión de esos datos.
- `service_role` omite RLS y queda fuera de la app y de cualquier variable `EXPO_PUBLIC_*`.

## Estados y borrado

La pulsera transiciona de `active` a `replaced`; no se define reutilización. El evento de asistencia es inmutable. No se habilita borrado general desde la app. No se define todavía una regla legal de conservación: aprobarla es una condición previa al uso de datos reales y cualquier requisito de borrado debe reconciliarse con la inmutabilidad del historial.
