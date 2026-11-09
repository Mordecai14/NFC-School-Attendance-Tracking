# Feature: Base de Supabase y acceso escolar

**Status**: En curso; están preparados la CLI y el ejemplo de variables. El desarrollo se realiza directamente con Supabase en la nube, sin Docker ni base Supabase local. No se ha seleccionado ni validado un proyecto remoto en esta tarea; todavía no hay schema escolar, RLS ni login implementados. El avance se sigue en [tasks.md](tasks.md).

**Entregable**: el personal ingresa con la cuenta de su escuela, conserva la sesión al reabrir y puede cerrarla; la base conserva el modelo escolar y aísla los datos entre escuelas.

**Límite**: la app solo consulta datos en 003. La carga inicial es administrativa; no hay CRUD escolar, registro de asistencias, identificación del alumno desde NFC, persistencia offline ni sincronización. Usar exclusivamente datos ficticios hasta definir retención y eliminación.

## Requirements

- **FR-001**: Login por correo y contraseña con la cuenta compartida de la escuela.
- **FR-002**: Exactamente una cuenta por escuela, compartida por su personal; sin cuentas individuales ni roles de personal.
- **FR-003**: Cuentas creadas manualmente por una persona administradora fuera de la app; sin registro público ni creación de escuelas desde la app.
- **FR-004**: Conservar la sesión válida al reabrir hasta logout o vencimiento; permitir cerrar sesión y retirar el acceso protegido.
- **FR-005**: Informar credenciales inválidas, cuenta deshabilitada, sesión vencida y falta de conexión sin revelar datos ni afirmar éxitos remotos no confirmados.
- **FR-006**: Asociar cada cuenta a exactamente una escuela y limitar el acceso a sus datos. Una cuenta sin escuela no abre rutas protegidas.
- **FR-007**: Personas no autenticadas y cuentas de otras escuelas no pueden consultar ni modificar datos personales ajenos.
- **FR-008**: Conservar y consultar escuelas, alumnos, pulseras, tutores, vínculos y eventos según [002](../002-data-model/spec.md). La carga inicial usa migraciones y aprovisionamiento administrativo confiable; las escrituras de datos desde la app quedan para otra feature aprobada.
- **FR-009**: Un alumno pertenece a una escuela y admite cero o más tutores y cero o una pulsera activa.
- **FR-010**: UID NFC globalmente único; reemplazar una pulsera conserva la anterior como histórica y no altera las asistencias del alumno.
- **FR-011**: Cada evento distingue entrada/salida, alumno, identidad global única y momento; no se sobrescribe ni descarta silenciosamente un evento previo.
- **FR-012**: Repetir la identidad de un evento no crea otro registro ni cambia el original. La deduplicación de eventos con identidades distintas queda fuera de 003.
- **FR-013**: Rechazar relaciones inexistentes y estados contrarios a cardinalidades e invariantes.
- **FR-014**: Definir y documentar plazo y regla de conservación/eliminación antes de usar datos reales; 003 no fija el plazo.
- **FR-015**: Un tutor puede vincularse con alumnos de distintas escuelas. Cada escuela ve su identidad/nombre mediante sus propios vínculos, nunca alumnos ni vínculos ajenos.

También quedan fuera recuperación/cambio de contraseña, distribución de credenciales, auditoría por integrante, acceso para tutores, notificaciones y administración avanzada. Compartir cuenta no permite identificar al integrante que actúa. No se agregan datos de contacto, SLO, volúmenes ni infraestructura sin una necesidad aprobada.

## Diseño acordado

Expo/React Native y TypeScript estricto; acceso directo a Supabase Auth y PostgreSQL, sin API propia ni repositorio genérico. Las migraciones SQL versionadas son la fuente del schema. Ver [la decisión arquitectónica](../../decisions/supabase-auth-and-school-isolation.md).

### Entorno de desarrollo

1. Crear o seleccionar un proyecto de desarrollo en Supabase Cloud, usando únicamente cuentas y datos ficticios. No reutilizar un proyecto con datos reales para estas pruebas.
2. Copiar la Project URL y la publishable key del Dashboard a `.env.local`, con los nombres de `.env.example`. Ese archivo vive en la computadora, pero apunta a Supabase en la nube; no representa una base local. No incluir claves secret/service-role, contraseña de base ni tokens de la CLI en variables públicas o en Git.
3. En Authentication del Dashboard, desactivar **Allow new users to sign up**, mantener el proveedor Email habilitado y crear una cuenta de prueba administrativamente. Verificar que signup público sea rechazado y que la cuenta creada pueda iniciar sesión. `supabase/config.toml` no aplica ajustes de Auth al proyecto hospedado.
4. Vincular el workspace al proyecto elegido con la CLI instalada, sin levantar contenedores:

   ```sh
   pnpm exec supabase login
   pnpm exec supabase link --project-ref <project-ref>
   ```

   Introducir credenciales por el flujo de la CLI; no pegarlas en comandos versionados ni en el chat. Revisar el destino vinculado antes de cambios remotos.
5. Cuando existan migraciones en `supabase/migrations/`, revisar lo que se aplicaría y luego aplicar al proyecto de desarrollo confirmado:

   ```sh
   pnpm exec supabase db push --linked --dry-run --skip-vault
   pnpm exec supabase db push --linked --skip-vault
   ```

   No forzar confirmaciones ni incluir fixtures automáticamente. Publicar tablas con RLS y grants mínimos desde su creación para que no haya exposición temporal de datos. Registrar cambios del schema en SQL versionado, no solo con ediciones manuales del Dashboard.

No se usan `supabase start`, `supabase status` local ni `supabase db reset` en este workflow. Los resets de la base hospedada están prohibidos como paso de desarrollo. La CLI se conserva para migraciones; no se requiere Docker. Los comandos anteriores son instrucciones pendientes, no operaciones ya realizadas.

### Schema previsto

| Tabla | Campos principales | Restricciones |
|---|---|---|
| `schools` | `id uuid`, `name text`, `auth_user_id uuid` | PK; nombre y cuenta requeridos; FK única a `auth.users(id)`, `ON DELETE RESTRICT`. |
| `students` | `id uuid`, `school_id uuid`, `name text`, `grade text`, `group_name text` | PK; escuela requerida; solo atributos personales aprobados. |
| `bracelets` | `id uuid`, `student_id uuid`, `nfc_uid text`, `status text` | PK y FK al alumno; UID requerido, no vacío y único global, incluso si está reemplazada; estado `active`/`replaced`. Índice único parcial por `student_id` donde `status = 'active'`. |
| `tutors` | `id uuid`, `name text` | PK; identidad global compartible; solo nombre, sin datos de contacto. |
| `student_tutors` | `student_id uuid`, `tutor_id uuid`, `relationship text` | PK compuesta; ambas FKs y vínculo requeridos. |
| `attendance_events` | `id uuid`, `student_id uuid`, `event_type text`, `occurred_at timestamptz` | PK global; alumno, tipo `entry`/`exit` y momento requeridos; trigger que rechaza `UPDATE` y `DELETE`. |

FKs en todas las relaciones, identidades y relaciones no nulas, sin cascadas que borren historial. Los eventos futuros offline aceptan IDs generados en el dispositivo y conservan identidad y momento en cada reintento; repetir la PK se rechaza sin alterar la fila original. La sincronización decidirá cómo tratar ese conflicto. Una obligación legal de borrado necesitará una decisión específica compatible con el historial; por ahora no se cargan datos reales. No se define reutilización de pulseras reemplazadas.

### Acceso escolar

- RLS en las seis tablas; `anon` sin acceso y `authenticated` con solo `SELECT`. No conceder mutaciones de datos al cliente en 003.
- Derivar la escuela de `auth.uid()` y `schools.auth_user_id`, no de `user_metadata` editable ni de filtros de UI. Una cuenta sin asociación no recibe filas.
- Escuelas, alumnos, pulseras y eventos visibles solo para la propia escuela. `student_tutors` se filtra por la escuela del alumno; `tutors` por la existencia de un vínculo visible.
- Crear y editar tutores globales y vínculos solo en el entorno administrativo confiable. Compartir tutor no comparte sus otras relaciones.
- En la app solo `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. La publishable key requiere RLS; ninguna clave secret/service-role ni credencial administrativa se empaqueta en el cliente.
- Desactivar signup en el Dashboard del proyecto hospedado, manteniendo el proveedor Email y el login por correo/contraseña. Ocultar el botón no alcanza; comprobar el rechazo en la API pública.

### Login y sesión

- Cliente único en `src/lib/supabase.ts`, con `@supabase/supabase-js`, `expo-secure-store` y `react-native-url-polyfill` cuando se implementen; instalar versiones compatibles con Expo mediante `pnpm exec expo install`.
- SecureStore para tokens Android por su almacenamiento cifrado, en lugar de AsyncStorage plano; `persistSession: true`, `autoRefreshToken: true`, `detectSessionInUrl: false`. Centralizar `AppState` para refrescar en foreground y detener en background, sin listeners duplicados. Web no es criterio de aceptación; no romper su inicialización si requiere un adaptador.
- `src/auth/AuthProvider.tsx` concentra restauración, login, logout y errores. `/login` valida campos, muestra envío/errores y evita envíos repetidos; no ofrece signup.
- `src/app/_layout.tsx` espera restauración y asociación escolar antes de mostrar contenido protegido. Sin sesión: `/login`; sin escuela: acceso no configurado, sin abrir el área protegida. Comprobar la asociación requiere la política RLS de lectura de la propia escuela.
- Logout elimina la sesión local y vuelve a `/login`, sin borrar la cuenta ni sus datos. Vencimiento retira el acceso; los fallos de conexión nunca se presentan como consultas remotas confirmadas.

## Seguimiento

Las tareas y sus dependencias técnicas mínimas están en [tasks.md](tasks.md), sin repetir aquí la lista de avance.

## User Scenarios & Testing

### Base y seguridad

Validar contra el proyecto de desarrollo hospedado, después de aplicar las migraciones y sin reconstruir la base. Conservar tests SQL de integridad y RLS en `supabase/tests/`, ejecutables en el SQL Editor del Dashboard mediante transacciones que reviertan sus datos de prueba. Si se usa pgTAP, habilitarlo en ese proyecto antes de ejecutar sus scripts; no exigir `supabase test db` ni un runner con Docker. No hacer borrados generales para limpiar tests.

Los tests automatizados deben cubrir relaciones/campos, UID único, una pulsera activa, historial, tipo/identidad de eventos, inmutabilidad y permisos. En el SQL Editor, que opera con privilegios administrativos, simular explícitamente roles `anon`/`authenticated` e identidades JWT para probar RLS; consultar solo como administrador no demuestra aislamiento. Las pruebas por API usan la publishable key y sesiones de prueba, nunca service-role para verificar permisos de usuario.

Con dos escuelas sintéticas A/B, comprobar lecturas propias y que los accesos cruzados —incluyendo referencias manipuladas—, anónimos y sin asociación no exponen datos ni modifican filas. Ambas ven el tutor compartido solo por su relación; no pueden mutarlo ni ver vínculos ajenos. Verificar signup rechazado y login existente permitido.

### Android

1. Usar URL y publishable key del proyecto hospedado desde `.env.local`, no desde una instancia Supabase local.
2. Crear cuentas de prueba desde el Dashboard del proyecto de desarrollo y asociarlas administrativamente a escuelas sintéticas cuando exista el schema: `insert into public.schools (name, auth_user_id) values ('Escuela de prueba A', '<auth-user-uuid>');`. Preparar además una cuenta sin escuela; no versionar credenciales.
3. Con SDK y dispositivo/emulador, ejecutar `pnpm exec expo run:android --device`. Comprobar login válido/inválido, cuenta deshabilitada, ausencia de signup, cuenta sin escuela, restauración al reabrir, logout, vencimiento y fallo de conexión sin contenido protegido indebido.
4. Ejecutar los checks de código: `pnpm lint`, `pnpm exec tsc --noEmit`, `node --test tests/*.test.mjs` y `pnpm exec expo install --check`; registrar fallos propios y preexistentes por separado. No ampliar el alcance para reparar bugs ajenos.

## Success Criteria

- **SC-001**: Credenciales válidas permiten acceder; todos los intentos inválidos permanecen sin acceso protegido.
- **SC-002**: Con al menos dos escuelas, todas las consultas muestran solo datos autorizados y todos los intentos cruzados de lectura/modificación son denegados.
- **SC-003**: Casos válidos e inválidos verifican todas las restricciones confirmadas: pertenencia escolar, relaciones, UID, pulsera activa e identidad del evento.
- **SC-004**: Reabrir con sesión vigente recupera acceso sin credenciales; tras logout no hay acceso hasta un nuevo login.
- **SC-005**: Reemplazos y reintentos dejan los eventos previos identificables y sin cambios.

### Evidencia disponible

Solo se validó el setup del repositorio: CLI ejecutable, variables locales ignoradas y `git diff --check` correcto. TypeScript y las seis pruebas existentes pasaron previamente; lint reportó un fallo preexistente en `src/hooks/use-color-scheme.web.ts:11`. `pnpm add` informó `ERR_PNPM_IGNORED_BUILDS` por `unrs-resolver`, aunque la CLI quedó instalada y ejecutable. Estos son resultados históricos, no una validación remota. Proyecto hospedado, configuración de Auth, schema, RLS y login siguen sin comprobar.
