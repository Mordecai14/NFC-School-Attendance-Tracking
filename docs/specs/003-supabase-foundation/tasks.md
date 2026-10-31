---
description: "Grafo de tareas para implementar la base Supabase y el acceso escolar"
---

# Tareas: Base de Supabase y acceso escolar

**Entrada**: Documentos de diseño en `docs/specs/003-supabase-foundation/`

**Prerequisitos**: `plan.md`, `spec.md`, `research.md`, `data-model.md` y `contracts/`

**Pruebas**: Incluidas porque la especificación define pruebas independientes y criterios medibles; las pruebas de base preceden a la implementación de cada historia.

**Organización**: Tareas agrupadas por historia. Las tres son P1; el orden de ejecución respeta dependencias técnicas: esquema antes de aislamiento RLS. El login puede avanzarse tras la fundación en paralelo con las historias de datos.

## Convención de tareas

- Todas las tareas tienen checkbox, ID secuencial y ruta concreta.
- `[P]` indica archivos distintos y ausencia de dependencias pendientes.
- `[USn]` identifica la historia correspondiente a `spec.md`.

## Fase 1: Setup compartido

**Objetivo**: Preparar herramientas locales, configuración segura y estructura de Supabase.

- [ ] T001 Fijar Supabase CLI 2.x como dependencia de desarrollo en `package.json` y `pnpm-lock.yaml`, sin instalarlo globalmente.
- [ ] T002 [P] Crear el archivo de ejemplo con `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` en `.env.example`; no incluir valores reales ni claves secret/service-role.
- [ ] T003 [P] Incorporar `.env.local` y archivos `.env` no destinados a Git en `.gitignore`, preservando las reglas existentes.
- [ ] T004 Crear la estructura local de Supabase y fijar configuración inicial en `supabase/config.toml` usando `pnpm exec supabase init`.

**Checkpoint**: CLI fijado en lockfile; variables locales fuera de Git; estructura local reproducible.

---

## Fase 2: Fundacional (bloqueante)

**Objetivo**: Establecer los cimientos compartidos de base, roles y validación; debe completarse antes de las historias.

- [ ] T005 Crear la migración inicial versionada en `supabase/migrations/<timestamp>_enable_required_extensions.sql` para habilitar únicamente las extensiones requeridas por UUID y pgTAP local, sin modificar datos de aplicación.
- [ ] T006 Desactivar signup público con `[auth].enable_signup = false` en `supabase/config.toml`, manteniendo habilitado el proveedor de correo/contraseña para login.
- [ ] T007 Documentar cómo aplicar y verificar la desactivación de signup público en el proyecto remoto, sin deshabilitar el login, en `docs/specs/003-supabase-foundation/quickstart.md`.
- [ ] T008 Agregar instrucciones de arranque, reset y pruebas locales de Supabase a `docs/specs/003-supabase-foundation/quickstart.md`, incluyendo guardas para no ejecutar reset contra proyectos remotos y variables locales fuera de Git.

**Checkpoint**: signup público queda desactivado en local y su configuración remota está documentada; `supabase start` y `supabase db reset` operan solo en local. Los fixtures se agregan después de crear el esquema. Las historias pueden comenzar.

---

## Fase 3: Historia 1 — Ingresar como personal escolar (Prioridad: P1)

**Objetivo**: Login correo/contraseña, restauración de sesión, rutas protegidas y logout; sin registro público.

**Prueba independiente**: Con una cuenta escolar local habilitada, verificar login válido e inválido, ausencia de signup, persistencia al reiniciar, logout, sesión expirada y fallo de conexión sin mostrar datos protegidos.

### Pruebas de la historia 1

- [ ] T009 [P] [US1] Agregar pruebas unitarias del estado de autenticación (restaurando, autenticado, anónimo, error) en `tests/auth-state.test.mjs`.
- [ ] T010 [P] [US1] Agregar pruebas de la configuración del cliente para restauración/persistencia, logout y refresco de sesión según `contracts/login-session.md` en `tests/supabase-auth.test.mjs`.

### Implementación de la historia 1

- [ ] T011 [P] [US1] Instalar `@supabase/supabase-js`, `expo-secure-store` y `react-native-url-polyfill` en versiones compatibles con Expo SDK 58 usando `pnpm exec expo install` y actualizar `package.json` y `pnpm-lock.yaml`.
- [ ] T012 [US1] Crear el cliente Supabase único con URL y publishable key públicas, almacenamiento de sesión en SecureStore para Android, `persistSession: true`, `autoRefreshToken: true` y `detectSessionInUrl: false` en `src/lib/supabase.ts`.
- [ ] T013 [US1] Implementar provider y estado de sesión inicial/restaurada/error, login correo/contraseña y logout sin signup en `src/auth/AuthProvider.tsx`.
- [ ] T014 [US1] Centralizar listener de `AppState` para iniciar auto-refresh en foreground y detenerlo en background, sin registrar listeners duplicados, en `src/auth/AuthProvider.tsx`.
- [ ] T015 [US1] Añadir pantalla `/login` con validación, estado de envío, errores de credenciales/conexión y sin controles de registro en `src/app/login.tsx`.
- [ ] T016 [US1] Después de T031, proteger rutas, esperar la restauración de sesión y comprobar mediante consulta RLS que la cuenta tiene una asociación escolar antes de mostrar contenido; si falta, bloquear rutas y mostrar acceso no configurado en `src/app/_layout.tsx`.
- [ ] T017 [US1] Integrar logout en el área autenticada y asegurar que al cerrar sesión desaparezca el acceso protegido en `src/app/index.tsx`.
- [ ] T018 [US1] Después de T016 y T031, validar login, signup rechazado, cuenta sin escuela asociada, reinicio, logout, vencimiento y offline en Android y actualizar resultados verificables en `docs/specs/003-supabase-foundation/quickstart.md`.

**Checkpoint**: Login y sesión funcionan independientemente de las consultas a datos escolares; no existe registro público.

---

## Fase 4: Historia 3 — Conservar el modelo escolar (Prioridad: P1)

**Objetivo**: Crear el esquema relacional y restricciones que preservan entidades, relaciones, identidades e historial aprobados.

**Dependencia**: La migración del esquema precede a los fixtures y a US2, porque las políticas requieren las tablas y relaciones creadas aquí. US3 puede desarrollarse tras T005 y en paralelo con US1.

**Prueba independiente**: Con fixtures ficticios, comprobar pertenencia única a escuela, relaciones muchos-a-muchos, UID NFC global único, una pulsera activa, historial de reemplazo, integridad referencial e inmutabilidad/idempotencia por identidad del evento. Confirmar además que el uso de datos reales queda bloqueado documentalmente hasta aprobar retención.

### Pruebas de la historia 3

- [ ] T019 [P] [US3] Crear pruebas pgTAP para FKs, campos requeridos, relaciones alumno-tutor y unicidad de UID NFC en `supabase/tests/database/003_school_model.test.sql`.
- [ ] T020 [US3] Crear pruebas pgTAP para máximo una pulsera activa, conservación de pulsera reemplazada e imposibilidad de alterar/eliminar eventos en `supabase/tests/database/004_history_invariants.test.sql`.
- [ ] T021 [US3] Crear prueba pgTAP de repetición de `attendance_events.id` que demuestre rechazo sin modificar `student_id`, tipo ni momento originales en `supabase/tests/database/004_history_invariants.test.sql`.

### Implementación de la historia 3

- [ ] T022 [US3] Crear tablas `schools` (nombre y `auth_user_id` requeridos, FK a `auth.users`, `UNIQUE`, `ON DELETE RESTRICT`), `students` (FK `school_id` requerida), `bracelets` (UID requerido/no vacío, estado `active`/`replaced`), `tutors` (solo nombre), `student_tutors` (PK `(student_id, tutor_id)`, ambas FKs y relación requerida) y `attendance_events` (ID, alumno, tipo `entry`/`exit` y momento requeridos) conforme a `docs/specs/003-supabase-foundation/data-model.md`, en `supabase/migrations/<timestamp>_create_school_schema.sql`.
- [ ] T023 [US3] Añadir la regla “UID requerido, no vacío y `UNIQUE` global, incluso para reemplazadas” para `bracelets.nfc_uid` y el índice único parcial “sobre `student_id` donde `status = 'active'`” en `supabase/migrations/<timestamp>_create_school_schema.sql`.
- [ ] T024 [US3] Añadir trigger de inmutabilidad de `attendance_events` que rechace `UPDATE` y `DELETE`, y restricción “tipo limitado a `entry`/`exit`”; preservar ID, alumno, tipo y momento ante reintentos en `supabase/migrations/<timestamp>_create_school_schema.sql`.
- [ ] T025 [US3] Cargar después de crear el esquema datos sintéticos de dos escuelas, identidades Auth de prueba, alumnos, pulseras y un tutor enlazado a ambas escuelas en `supabase/seed.sql`; no incluir datos personales reales ni credenciales de login.
- [ ] T026 [US3] Aplicar `supabase db reset` y `supabase test db`; corregir migraciones/modelo hasta que pasen las pruebas de `supabase/tests/database/003_school_model.test.sql` y `supabase/tests/database/004_history_invariants.test.sql`.

**Checkpoint**: El esquema puede reconstruirse desde cero y las invariantes de modelo pasan en local antes de aplicar aislamiento.

---

## Fase 5: Historia 2 — Aislar datos por escuela (Prioridad: P1)

**Objetivo**: Hacer cumplir autenticación, aislamiento por escuela y denegación de accesos cruzados en PostgreSQL.

**Dependencia**: Requiere que T022–T026 hayan creado, sembrado y validado las tablas. La prueba de US2 es independiente de US1: usa roles/JWT simulados en pgTAP; la comprobación de login integrado se hace en US1.

**Prueba independiente**: Con dos escuelas, ejecutar lecturas y mutaciones como `anon` y como usuarios de A/B. Cada cuenta solo ve filas propias; intentos cruzados no cambian datos. El tutor compartido aparece por vínculo local sin revelar al otro alumno ni vínculo.

### Pruebas de la historia 2

- [ ] T027 [US2] Crear pruebas pgTAP de lectura propia y denegación de escuelas/alumnos/pulseras/eventos ajenos y del rol no autenticado en `supabase/tests/database/005_school_rls.test.sql`.
- [ ] T028 [US2] Crear pruebas pgTAP del tutor compartido que verifiquen visibilidad del tutor por vínculo propio y ocultamiento de alumnos/vínculos de la otra escuela en `supabase/tests/database/005_school_rls.test.sql`.
- [ ] T029 [US2] Crear pruebas pgTAP de grants mínimos y de intentos de escritura/eliminación cruzada, verificando que las filas originales permanecen iguales en `supabase/tests/database/005_school_rls.test.sql`.

### Implementación de la historia 2

- [ ] T030 [US2] Definir función SQL estable para resolver la escuela desde `auth.uid()` y `schools.auth_user_id`, devolviendo ausencia de acceso para cuentas sin vínculo, en `supabase/migrations/<timestamp>_school_rls.sql`.
- [ ] T031 [US2] Habilitar RLS en las seis tablas, revocar grants de `anon`, conceder a `authenticated` solo `SELECT` y crear políticas de lectura escolar para `schools`, `students`, `bracelets` y `attendance_events` en `supabase/migrations/<timestamp>_school_rls.sql`.
- [ ] T032 [US2] Crear políticas para `student_tutors` basadas en la escuela del alumno y para `tutors` basadas en existencia de vínculo visible, sin habilitar mutaciones de tutor/vínculo desde el cliente, en `supabase/migrations/<timestamp>_school_rls.sql`.
- [ ] T033 [US2] Ejecutar y ajustar pruebas RLS con `supabase test db`; demostrar denegación cruzada y que escrituras filtradas o no autorizadas no modifican filas en `supabase/tests/database/005_school_rls.test.sql`.
- [ ] T034 [US2] Documentar la frontera de grants/RLS, la cuenta sin escuela asociada y el manejo del tutor compartido en `docs/specs/003-supabase-foundation/contracts/school-data-access.md`.

**Checkpoint**: Dos escuelas aisladas en el límite de base; consultas del cliente no sustituyen las políticas.

---

## Fase 6: Pulido y validación transversal

**Objetivo**: Ejecutar la validación completa y cerrar riesgos documentales sin agregar alcance de producto.

- [ ] T035 [P] Revisar que no haya claves secret/service-role en `src/`, `app.json`, `.env.example` ni archivos versionados; mantener solo URL y publishable key en `.env.example`.
- [ ] T036 [P] Verificar enlaces y que plan, modelo, contratos, decisiones y quickstart describan el mismo esquema y alcance en `docs/specs/003-supabase-foundation/` y `docs/decisions/supabase-auth-and-school-isolation.md`.
- [ ] T037 Ejecutar `pnpm lint`, `pnpm exec tsc --noEmit`, `node --test tests/*.test.mjs`, `pnpm exec expo install --check` y `pnpm exec supabase test db`; registrar resultados y fallos preexistentes en `docs/specs/003-supabase-foundation/quickstart.md`.
- [ ] T038 Confirmar en `docs/specs/003-supabase-foundation/quickstart.md` que el uso de datos reales permanece bloqueado hasta documentar retención/eliminación, sin introducir datos reales en fixtures.

---

## Grafo de dependencias y orden de ejecución

```text
T001 ─┐
T002 ─┼─> T004 ─> T005 ─> T006 ─> T007 ─> T008 ─┬─> US1 auth/UI: T009–T015
T003 ─┘                                           └─> US3: T019–T026 ─> US2: T027–T034
                                                                US2/T031 ─> US1 guard/integration: T016–T018
                                                                US1 + US2 + US3 ─> Polish: T035–T038
```

T002 y T003 pueden completarse en paralelo con T001. Tras T004, la configuración de signup y la documentación de quickstart se completan secuencialmente porque comparten configuración/documentación. US1 y US3 pueden avanzar en paralelo una vez lista la fundación; US2 empieza únicamente después del esquema, fixtures y pruebas de US3. Todas las fases requeridas preceden a Polish.

### Dependencias entre historias

- **US1 (P1)**: autenticación y UI pueden empezar tras Setup/Fundacional en paralelo con US3. La protección completa de rutas para cuentas sin asociación escolar (T016) y su prueba integrada (T018) dependen de la política de lectura de la propia escuela de T031.
- **US3 (P1)**: depende de Setup y Fundacional; no depende del login. Su esquema es prerequisito de US2.
- **US2 (P1)**: depende de Setup, Fundacional y del esquema/fixtures de US3 (T022–T025). No es seguro entregarla antes del modelo que debe proteger.
- **Polish**: depende de las historias que se vayan a entregar; T037 requiere las validaciones completas.

## Oportunidades paralelas

- **Setup**: T002 y T003 son archivos distintos y paralelos; T001 instala CLI y puede avanzar en paralelo con ambos. T004 requiere CLI y configuración base.
- **Fundacional**: T006 debe seguir a T004; T007 y T008 editan el mismo quickstart y se completan secuencialmente. Los fixtures no son fundacionales: T025 depende del esquema de US3.
- **US1**: T009 y T010 pueden crearse juntos antes de implementar; T011 instala dependencias mientras se preparan pruebas. No paralelizar cambios concurrentes a `src/auth/AuthProvider.tsx` (T013–T014).
- **US3**: T019–T021 son pruebas pgTAP independientes por intención; T022–T024 se serializan porque modifican la misma migración. T025 puede prepararse después de T022 y antes de completar pruebas.
- **US2**: T027–T029 son pruebas independientes en el mismo archivo; pueden planificarse en paralelo pero integrar sus cambios al archivo secuencialmente. T030–T032 se serializan porque comparten migración y dependen de resolución de escuela.
- **Entre historias**: el login/UI de US1 y US3 pueden avanzar en paralelo tras Setup/Fundacional. US2 queda bloqueada por el esquema de US3; el guard escolar y la validación end-to-end de US1 esperan a T031 para consultar la asociación bajo RLS.

## Estrategia de implementación

### MVP

Las tres historias son P1 y necesarias para completar 003. Para una demostración incremental del formulario/login se puede avanzar con Setup + Fundacional + núcleo de US1, usando una cuenta sintética y sin consultar datos escolares. El guard que confirma la asociación y la prueba end-to-end requieren T031. **Esto no constituye la entrega segura de 003** hasta completar US3 y US2; no conectar pantallas de datos antes de que RLS esté activo.

### Entrega completa incremental

1. Setup y Fundacional: CLI, configuración y base local reproducible.
2. US1: login y sesión verificables en Android.
3. US3: esquema e invariantes validados con pgTAP.
4. US2: aislamiento y denegaciones cruzadas validadas con pgTAP.
5. Pulido: lint, TypeScript, pruebas existentes, dependencia Expo y quickstart.

La historia US2 puede implementarse inmediatamente después de US3; no habilitar acceso remoto a datos escolares antes de superar las pruebas RLS. Datos reales siguen fuera de alcance hasta aprobar retención y eliminación.
