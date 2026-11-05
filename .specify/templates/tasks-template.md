---

description: "Plantilla de tasks para implementar una feature"
---

# Tasks: [FEATURE NAME]

<!-- Idioma: redactar el contenido generado en español profesional y natural según AGENTS.md, conservando el vocabulario habitual de desarrollo en inglés, los encabezados y campos estructurales de Spec Kit, los IDs, [P], [USn], las rutas y los estados de checkboxes. Al regenerar esta plantilla, conservar esta indicación y revisar el diff. -->

**Input**: Documentos de diseño de `/docs/specs/[###-feature-name]/`

**Prerequisites**: plan.md (obligatorio), spec.md (obligatorio para las user stories), research.md, data-model.md, contracts/

**Tests**: Los ejemplos siguientes incluyen tasks de tests. Los tests son OPCIONALES: incluirlos solo si la especificación de la feature los solicita explícitamente.

**Organization**: Las tasks se agrupan por user story para permitir su implementación y testing independientes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias)
- **[Story]**: User story a la que pertenece esta task (por ejemplo, US1, US2, US3)
- Incluir las rutas exactas de archivos en las descripciones

## Path Conventions

- **Single project**: `src/`, `tests/` en la raíz del repositorio
- **Web app**: `backend/src/`, `frontend/src/`
- **Mobile**: `api/src/`, `ios/src/` o `android/src/`
- Las rutas siguientes suponen un proyecto único; ajustarlas según la estructura de plan.md

<!--
  ============================================================================
  IMPORTANT: The tasks below are SAMPLE TASKS for illustration purposes only.

  The /speckit.tasks command MUST replace these with actual tasks based on:
  - User stories from spec.md (with their priorities P1, P2, P3...)
  - Feature requirements from plan.md
  - Entities from data-model.md
  - Endpoints from contracts/

  Tasks MUST be organized by user story so each story can be:
  - Implemented independently
  - Tested independently
  - Delivered as an MVP increment

  DO NOT keep these sample tasks in the generated tasks.md file.
  ============================================================================
-->

## Phase 1: Setup (Infraestructura compartida)

**Purpose**: Inicialización del proyecto y estructura básica

- [ ] T001 Crear la estructura del proyecto según el plan de implementación
- [ ] T002 Inicializar el proyecto en [language] con las dependencias de [framework]
- [ ] T003 [P] Configurar las herramientas de lint y formato

---

## Phase 2: Fundamentos (Prerrequisitos bloqueantes)

**Purpose**: Infraestructura central que DEBE completarse antes de implementar CUALQUIER user story

**⚠️ CRITICAL**: No se puede comenzar ninguna user story hasta completar esta fase

Ejemplos de tasks de fundamentos (ajustar según el proyecto):

- [ ] T004 Configurar el schema de base de datos y el framework de migraciones
- [ ] T005 [P] Implementar el framework de autenticación y autorización
- [ ] T006 [P] Configurar el enrutamiento de la API y la estructura del middleware
- [ ] T007 Crear los modelos o entidades base de los que dependen todas las user stories
- [ ] T008 Configurar el manejo de errores y la infraestructura de logs
- [ ] T009 Configurar la gestión de la configuración del entorno

**Checkpoint**: Fundamentos listos; puede comenzar la implementación de user stories en paralelo

---

## Phase 3: User Story 1 - [Title] (Priority: P1) 🎯 MVP

**Goal**: [Descripción breve del valor que entrega esta user story]

**Independent Test**: [Cómo verificar que esta user story funciona de forma independiente]

### Tests for User Story 1 (OPTIONAL - only if tests requested) ⚠️

> **NOTE: Escribir estos tests PRIMERO y comprobar que FALLEN antes de implementar**

- [ ] T010 [P] [US1] Test de contrato de [endpoint] en tests/contract/test_[name].py
- [ ] T011 [P] [US1] Test de integración de [user journey] en tests/integration/test_[name].py

### Implementation for User Story 1

- [ ] T012 [P] [US1] Crear el modelo [Entity1] en src/models/[entity1].py
- [ ] T013 [P] [US1] Crear el modelo [Entity2] en src/models/[entity2].py
- [ ] T014 [US1] Implementar [Service] en src/services/[service].py (depende de T012, T013)
- [ ] T015 [US1] Implementar [endpoint/feature] en src/[location]/[file].py
- [ ] T016 [US1] Agregar validación y manejo de errores
- [ ] T017 [US1] Agregar logs para las operaciones de la user story 1

**Checkpoint**: La user story 1 debe ser completamente funcional y verificable de forma independiente

---

## Phase 4: User Story 2 - [Title] (Priority: P2)

**Goal**: [Descripción breve del valor que entrega esta user story]

**Independent Test**: [Cómo verificar que esta user story funciona de forma independiente]

### Tests for User Story 2 (OPTIONAL - only if tests requested) ⚠️

- [ ] T018 [P] [US2] Test de contrato de [endpoint] en tests/contract/test_[name].py
- [ ] T019 [P] [US2] Test de integración de [user journey] en tests/integration/test_[name].py

### Implementation for User Story 2

- [ ] T020 [P] [US2] Crear el modelo [Entity] en src/models/[entity].py
- [ ] T021 [US2] Implementar [Service] en src/services/[service].py
- [ ] T022 [US2] Implementar [endpoint/feature] en src/[location]/[file].py
- [ ] T023 [US2] Integrar con los componentes de la user story 1 (si corresponde)

**Checkpoint**: Las user stories 1 Y 2 deben funcionar de forma independiente

---

## Phase 5: User Story 3 - [Title] (Priority: P3)

**Goal**: [Descripción breve del valor que entrega esta user story]

**Independent Test**: [Cómo verificar que esta user story funciona de forma independiente]

### Tests for User Story 3 (OPTIONAL - only if tests requested) ⚠️

- [ ] T024 [P] [US3] Test de contrato de [endpoint] en tests/contract/test_[name].py
- [ ] T025 [P] [US3] Test de integración de [user journey] en tests/integration/test_[name].py

### Implementation for User Story 3

- [ ] T026 [P] [US3] Crear el modelo [Entity] en src/models/[entity].py
- [ ] T027 [US3] Implementar [Service] en src/services/[service].py
- [ ] T028 [US3] Implementar [endpoint/feature] en src/[location]/[file].py

**Checkpoint**: Todas las user stories deben funcionar de forma independiente

---

[Agregar las fases de user stories necesarias siguiendo el mismo patrón]

---

## Phase N: Pulido y aspectos transversales

**Purpose**: Mejoras que afectan a varias user stories

- [ ] TXXX [P] Actualizar la documentación en docs/
- [ ] TXXX Limpiar el código y realizar refactor
- [ ] TXXX Optimizar el rendimiento de todas las user stories
- [ ] TXXX [P] Agregar tests unitarios (si se solicitan) en tests/unit/
- [ ] TXXX Reforzar la seguridad
- [ ] TXXX Ejecutar la validación de quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sin dependencias; puede comenzar de inmediato
- **Fundamentos (Phase 2)**: Depende de completar Setup; BLOQUEA todas las user stories
- **User Stories (Phase 3+)**: Todas dependen de completar la fase de fundamentos
  - Luego pueden avanzar en paralelo si hay personal disponible
  - O secuencialmente por prioridad (P1 → P2 → P3)
- **Pulido (fase final)**: Depende de completar todas las user stories previstas

### User Story Dependencies

- **User Story 1 (P1)**: Puede comenzar después de Fundamentos (Phase 2); no depende de otras user stories
- **User Story 2 (P2)**: Puede comenzar después de Fundamentos (Phase 2); puede integrarse con US1, pero debe poder verificarse de forma independiente
- **User Story 3 (P3)**: Puede comenzar después de Fundamentos (Phase 2); puede integrarse con US1/US2, pero debe poder verificarse de forma independiente

### Within Each User Story

- Los tests (si se incluyen) DEBEN escribirse y FALLAR antes de implementar
- Modelos antes que servicios
- Servicios antes que endpoints
- Implementación principal antes que integración
- Completar la user story antes de avanzar a la siguiente prioridad

### Parallel Opportunities

- Todas las tasks de Setup marcadas con [P] pueden ejecutarse en paralelo
- Todas las tasks de Fundamentos marcadas con [P] pueden ejecutarse en paralelo dentro de Phase 2
- Tras completar Fundamentos, todas las user stories pueden comenzar en paralelo si la capacidad del equipo lo permite
- Todos los tests de una user story marcados con [P] pueden ejecutarse en paralelo
- Los modelos de una user story marcados con [P] pueden desarrollarse en paralelo
- Distintos integrantes del equipo pueden trabajar en distintas user stories en paralelo

---

## Parallel Example: User Story 1

```bash
# Ejecutar juntos todos los tests de la user story 1 (si se solicitan):
Task: "Test de contrato de [endpoint] en tests/contract/test_[name].py"
Task: "Test de integración de [user journey] en tests/integration/test_[name].py"

# Desarrollar juntos todos los modelos de la user story 1:
Task: "Crear el modelo [Entity1] en src/models/[entity1].py"
Task: "Crear el modelo [Entity2] en src/models/[entity2].py"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar Phase 1: Setup
2. Completar Phase 2: Fundamentos (CRÍTICO: bloquea todas las user stories)
3. Completar Phase 3: User Story 1
4. **DETENERSE y VALIDAR**: Verificar la user story 1 de forma independiente
5. Realizar deploy o demostración si está lista

### Incremental Delivery

1. Completar Setup + Fundamentos → Base lista
2. Agregar User Story 1 → Verificar de forma independiente → Deploy/demostración (MVP)
3. Agregar User Story 2 → Verificar de forma independiente → Deploy/demostración
4. Agregar User Story 3 → Verificar de forma independiente → Deploy/demostración
5. Cada user story aporta valor sin romper las anteriores

### Parallel Team Strategy

Con varios desarrolladores:

1. El equipo completa Setup + Fundamentos en conjunto
2. Una vez completos los fundamentos:
   - Desarrollador A: User Story 1
   - Desarrollador B: User Story 2
   - Desarrollador C: User Story 3
3. Las user stories se completan e integran de forma independiente

---

## Notes

- Tasks con [P] = archivos distintos, sin dependencias
- La etiqueta [Story] vincula la task con una user story específica para mantener la trazabilidad
- Cada user story debe poder completarse y verificarse de forma independiente
- Verificar que los tests fallen antes de implementar
- Hacer commit después de cada task o grupo lógico
- Detenerse en cualquier punto de control para validar la user story de forma independiente
- Evitar tasks vagas, conflictos en el mismo archivo y dependencias entre user stories que impidan su independencia
