---
description: "Tareas para completar y validar el modelo conceptual de datos del MVP"
---

# Tasks: Modelo de datos del MVP

**Input**: Documentos de diseño de `docs/specs/002-data-model/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `quickstart.md`

**Tests**: No se solicitan tests automatizados de código. Validar cada user story con sus criterios de revisión independientes y `quickstart.md`.

**Organization**: Las tasks se agrupan según las dos user stories de `spec.md`. Esta feature es exclusivamente documental; no incluye cambios en el código fuente ni en la infraestructura.

## Format: `[ID] [P?] [US?] Descripción`

- **[P]**: Puede ejecutarse en paralelo si no modifica el mismo archivo ni depende de trabajo incompleto.
- **[US]**: Vincula una tarea con una historia de usuario de `spec.md`.
- Cada tarea indica las rutas exactas de los archivos que consulta o actualiza.

## Path Conventions

Todos los entregables están en `docs/specs/002-data-model/`. No se esperan cambios en `src/`, `tests/`, `android/` ni en la configuración del proyecto.

## Phase 1: Preparación

**Purpose**: Confirmar el alcance aprobado y los documentos de diseño antes de completar el modelo.

Esta funcionalidad es exclusivamente documental; no requiere inicializar el proyecto, instalar dependencias ni modificar la configuración.

---

## Phase 2: Fundamentos

**Purpose**: Establecer el vocabulario común y los límites que utilizarán ambas user stories.

- [X] T001 Unificar la terminología de las entidades y señalar explícitamente las reglas no definidas, contrastando `docs/specs/002-data-model/research.md` con `docs/specs/002-data-model/data-model.md`, antes de revisar cada historia.

**Checkpoint**: La terminología y los límites de alcance coinciden con la especificación; no se necesita una base de código.

---

## Phase 3: User Story 1 - Comprender las entidades del MVP (Priority: P1) 🎯 MVP

**Goal**: Definir de forma comprensible las entidades conceptuales escuela, alumno, pulsera y tutor, con los datos y relaciones aprobados.

**Independent Test**: Revisar `docs/specs/002-data-model/data-model.md` y verificar una sola escuela por alumno, relaciones de varios a varios entre alumnos y tutores, únicamente los campos de perfil aprobados y como máximo una pulsera activa con identificador global por alumno.

### Implementation for User Story 1

- [X] T002 [US1] Definir los propósitos y atributos aprobados de escuela, alumno, pulsera y tutor en `docs/specs/002-data-model/data-model.md`, incluido el nombre de la escuela y el límite de visibilidad para personal escolar autorizado establecido en FR-001 y FR-009 de `docs/specs/002-data-model/spec.md`.
- [X] T003 [US1] Documentar las cardinalidades escuela/alumno y alumno/tutor, el ciclo de vida de las pulseras activas y reemplazadas, y las reglas no definidas de reutilización o transferencia en `docs/specs/002-data-model/data-model.md`.

**Checkpoint**: La parte de entidades puede revisarse por separado, sin depender de la implementación del almacenamiento de asistencias o de la sincronización.

---

## Phase 4: User Story 2 - Preservar el historial de asistencias (Priority: P1)

**Goal**: Definir los eventos de asistencia de modo que el reemplazo de pulseras y los reintentos sin conexión no alteren ni pierdan el historial del alumno.

**Independent Test**: Seguir los ejemplos de reemplazo y reintento sin conexión de `docs/specs/002-data-model/data-model.md`; confirmar que los eventos siguen asociados al alumno y conservan su identidad y momento de ocurrencia.

### Implementation for User Story 2

- [X] T004 [US2] Definir en `docs/specs/002-data-model/data-model.md` la identidad globalmente única del evento de asistencia, su relación con el alumno, el tipo de entrada o salida, el momento de ocurrencia, su inmutabilidad y las reglas de reintento, de acuerdo con FR-005 y FR-006 de `docs/specs/002-data-model/spec.md`.
- [X] T005 [US2] Agregar a `docs/specs/002-data-model/data-model.md` ejemplos ficticios de reemplazo de pulseras y de eventos distintos creados sin conexión en dispositivos separados; indicar que la generación de identificadores, la política de duplicados y el mecanismo de sincronización quedan fuera del alcance.

**Checkpoint**: Los ejemplos de asistencia preservan el historial sin especificar una base de datos, almacenamiento local, sincronización ni implementación de prevención de duplicados.

---

## Phase 5: Revisión final y validación transversal

**Purpose**: Verificar el conjunto completo de documentos respecto del alcance aprobado.

- [X] T006 Revisar el límite de visibilidad de datos y todos los escenarios de `docs/specs/002-data-model/quickstart.md` frente a `docs/specs/002-data-model/data-model.md` y `docs/specs/002-data-model/spec.md`; resolver cualquier contradicción en el modelo.
- [X] T007 Validar `docs/specs/002-data-model/checklists/requirements.md`, completar la revisión documental de `docs/specs/002-data-model/quickstart.md` y confirmar que `git diff --check` pasa sin cambios en código fuente, configuración ni dependencias.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Preparación (Fase 1)**: No se requiere; las dependencias y la configuración no cambian.
- **Fundamentos (Fase 2)**: T001 bloquea los cambios específicos de cada historia en la terminología común del modelo.
- **Historia de usuario 1 (Fase 3)**: Depende de T001; establece la base de entidades y relaciones.
- **Historia de usuario 2 (Fase 4)**: Depende de T001 y de la entidad alumno de HU1 (T002); agrega el modelo del historial de eventos.
- **Revisión final (Fase 5)**: Depende de ambas historias; valida todos los documentos.

### User Story Dependencies

- **Historia de usuario 1 (P1)**: Primer incremento revisable; depende de la terminología y el alcance comunes.
- **Historia de usuario 2 (P1)**: Depende de la definición del alumno en HU1 porque los eventos se asocian con alumnos; por lo demás, puede revisarse sin depender de funcionalidades ejecutables.

### Parallel Opportunities

- Ninguna tarea de desarrollo de historias lleva la marca `[P]`: ambas historias actualizan el mismo modelo conceptual, por lo que los cambios paralelos entrarían en conflicto.
- No hay tareas de preparación del proyecto. Las tareas de las historias son secuenciales porque modifican el `data-model.md` compartido.

## Parallel Example: User Story 1

No se identificó trabajo paralelo seguro para HU1: las definiciones de entidades y sus cardinalidades se mantienen juntas en `data-model.md`.

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Confirmar el alcance documental acotado y la terminología común.
2. Completar y revisar de forma independiente las entidades y relaciones de HU1.
3. Agregar las reglas del historial de asistencias y los ejemplos de reintento sin conexión de HU2.
4. Completar la lista de verificación documental y la revisión de `quickstart.md`.

### Incremental Delivery

HU1 proporciona el modelo conceptual inicial de entidades. HU2 lo completa al agregar el comportamiento del historial de asistencias. El resultado es exclusivamente documental; no habilita funciones de la aplicación ni almacenamiento en una base de datos.

## Notes

- Las tareas usan el formato `[ ] T### [US#]` e incluyen las rutas pertinentes relativas al repositorio; no se incluyen tareas de preparación porque no hay trabajo que realizar en esa fase.
- No hay tareas de pruebas automatizadas de código porque la especificación no las solicita y esta funcionalidad no modifica código.
- Lint, TypeScript, configuración de Expo, Supabase, persistencia local, API, autenticación y comportamiento del lector NFC quedan fuera de este conjunto de tareas.
