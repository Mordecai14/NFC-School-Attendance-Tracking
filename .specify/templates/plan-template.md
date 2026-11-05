# Implementation Plan: [FEATURE]

<!-- Idioma: redactar el contenido generado en español profesional y natural según AGENTS.md, conservando el vocabulario habitual de desarrollo en inglés, los encabezados y campos estructurales de Spec Kit, los identificadores y NEEDS CLARIFICATION. Al regenerar esta plantilla, conservar esta indicación y revisar el diff. -->

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]

**Input**: Especificación de la feature en `/docs/specs/[###-feature-name]/spec.md`

**Note**: El comando `/speckit.plan` completa esta plantilla; su definición describe el workflow de ejecución.

## Summary

[Extraer de la spec de la feature: requisito principal y enfoque técnico de la investigación]

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: [Por ejemplo, Python 3.11, Swift 5.9, Rust 1.75 o NEEDS CLARIFICATION]

**Primary Dependencies**: [Por ejemplo, FastAPI, UIKit, LLVM o NEEDS CLARIFICATION]

**Storage**: [Si corresponde; por ejemplo, PostgreSQL, CoreData, archivos o N/A]

**Testing**: [Por ejemplo, pytest, XCTest, cargo test o NEEDS CLARIFICATION]

**Target Platform**: [Por ejemplo, servidor Linux, iOS 15+, WASM o NEEDS CLARIFICATION]

**Project Type**: [Por ejemplo, biblioteca/CLI/servicio web/aplicación móvil/compilador/aplicación de escritorio o NEEDS CLARIFICATION]

**Performance Goals**: [Específicos del dominio; por ejemplo, 1000 solicitudes/s, 10 mil líneas/s, 60 fps o NEEDS CLARIFICATION]

**Constraints**: [Específicas del dominio; por ejemplo, <200 ms p95, <100 MB de memoria, funcionamiento offline o NEEDS CLARIFICATION]

**Scale/Scope**: [Específicos del dominio; por ejemplo, 10 mil usuarios, 1 millón de líneas de código, 50 pantallas o NEEDS CLARIFICATION]

## Constitution Check

*GATE: Debe aprobarse antes de la investigación de Phase 0. Repetir el check después del diseño de Phase 1.*

[Controles definidos según el archivo de la constitución]

## Project Structure

### Documentation (this feature)

```text
docs/specs/[###-feature]/
├── plan.md              # Este archivo (salida del comando /speckit.plan)
├── research.md          # Salida de Phase 0 (comando /speckit.plan)
├── data-model.md        # Salida de Phase 1 (comando /speckit.plan)
├── quickstart.md        # Salida de Phase 1 (comando /speckit.plan)
├── contracts/           # Salida de Phase 1 (comando /speckit.plan)
└── tasks.md             # Salida de Phase 2 (comando /speckit.tasks; NO lo crea /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
# [REMOVE IF UNUSED] Opción 1: Proyecto único (PREDETERMINADA)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# [REMOVE IF UNUSED] Opción 2: Aplicación web (cuando se detectan "frontend" + "backend")
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# [REMOVE IF UNUSED] Opción 3: Aplicación móvil + API (cuando se detecta "iOS/Android")
api/
└── [La misma estructura del backend anterior]

ios/ o android/
└── [Estructura específica de la plataforma: módulos de feature, flujos de UI y tests de plataforma]
```

**Structure Decision**: [Documentar la estructura seleccionada y hacer referencia a los
directorios reales indicados arriba]

## Complexity Tracking

> **Completar SOLO si Constitution Check identifica incumplimientos que deban justificarse**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [Por ejemplo, cuarto proyecto] | [Necesidad actual] | [Por qué tres proyectos no son suficientes] |
| [Por ejemplo, patrón Repository] | [Problema específico] | [Por qué el acceso directo a la base no es suficiente] |
