# Asistencia escolar con NFC

App Android con React Native, Expo y TypeScript. Hoy lee pulseras NFC; el acceso escolar con Supabase está en desarrollo. El registro de asistencias y la sincronización todavía no están implementados.

## Desarrollo

```sh
pnpm install
pnpm exec expo run:android --device
```

La lectura física requiere un Android con NFC, SDK/JDK configurados y un build nativo; no se prueba con Expo Go. Para repetir el ensayo, ver [001](docs/specs/001-read-nfc-wristbands/spec.md#cómo-comprobarlo).

```sh
pnpm lint
pnpm exec tsc --noEmit
node --test tests/*.test.mjs
```

El último resultado registrado tiene un fallo de lint preexistente en `src/hooks/use-color-scheme.web.ts:11`; no implica que los checks actuales hayan sido ejecutados. La [spec 003](docs/specs/003-supabase-foundation/spec.md) explica el setup y la validación previstos para Supabase. Usar datos ficticios; no cargar datos personales reales hasta definir retención.

## Dónde mirar

- [Roadmap](docs/roadmap.md): estado y siguiente entregable.
- [Producto](docs/product.md): propósito y límites del MVP.
- [Arquitectura](docs/architecture.md): qué existe y qué está previsto.
- Specs: [001 — NFC](docs/specs/001-read-nfc-wristbands/spec.md), [002 — Modelo](docs/specs/002-data-model/spec.md), [003 — Acceso escolar](docs/specs/003-supabase-foundation/spec.md).

Cada feature tiene `spec.md` para requisitos, enfoque y validación, y `tasks.md` para una lista corta de trabajo. El avance actual está en [las tareas de 003](docs/specs/003-supabase-foundation/tasks.md). Se conserva aparte la [evidencia física de NFC](docs/specs/001-read-nfc-wristbands/validation.md) y la [decisión de Supabase](docs/decisions/supabase-auth-and-school-isolation.md). No hace falta recorrer planes, research, contratos y checklists para desarrollar.

Las instrucciones de colaboración están en [AGENTS.md](AGENTS.md). Spec Kit sigue disponible como herramienta opcional; sus comandos que exigen `plan.md` o un formato de tasks más detallado no aplican directamente a este flujo ligero. No regenerar artefactos por rutina.
