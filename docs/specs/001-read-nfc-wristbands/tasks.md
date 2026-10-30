---
description: "Tareas para validar identificación de pulseras NFC en Android"
---

# Tasks: Lectura de pulseras NFC

**Input**: Documentos de `specs/001-read-nfc-wristbands/`.

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`,
`contracts/scan-screen.md` y `quickstart.md`.

**Tests**: Incluir las comprobaciones de estado del plan corregido y aprobado;
no añadir un framework de pruebas NFC. La validación física es obligatoria.

**Organization**: Una única historia, US1 (P1), con validación temprana de
viabilidad antes de terminar la pantalla. Este archivo no implementa la feature.

## Format: `[ID] [P?] [Story] Description`

- `[P]`: trabajo simultáneo solo tras completar sus dependencias explícitas.
- `[US1]`: historia «Identificar una pulsera» de la spec.
- Las rutas son relativas a la raíz del repositorio.

## Path Conventions

Código en `src/app/` y `src/hooks/`; pruebas puras en `tests/` y documentación
en `specs/001-read-nfc-wristbands/`. `android/` es generado e ignorado por Git.
No crear servidores, repositorios, modelos de alumnos ni almacenamiento.

## Phase 1: Setup (Shared Infrastructure)

**Propósito**: Confirmar que el ensayo es realizable y registrar el estado base.

- [ ] T001 Comprobar Node 24, JDK/SDK Android, autorización `adb devices`, teléfono físico con NFC y al menos dos pulseras reales; crear `specs/001-read-nfc-wristbands/validation.md` con entorno, muestras A/B y prerrequisitos pendientes, siguiendo `quickstart.md`, sin copiar identificadores.
- [ ] T002 Registrar en `specs/001-read-nfc-wristbands/validation.md` la validación base de `pnpm exec tsc --noEmit` y disponibilidad de configuración ESLint; ejecutar `pnpm lint` solo si configuración y dependencias ya están aprobadas, sin autoinstalar ni corregir fallos ajenos al alcance.

**Checkpoint**: Si faltan hardware o muestras, indicar el bloqueo: no simular
la viabilidad física. Los fallos previos de calidad no autorizan una reparación
automática ni bloquean redactar código, pero sí declarar la implementación terminada.

## Phase 2: Foundational (Blocking Prerequisites)

**Propósito**: Preparar únicamente el acceso nativo necesario para US1.

- [ ] T003 Instalar `react-native-nfc-manager` 4.2.0 en `package.json` y `pnpm-lock.yaml`, declarar su plugin y un `expo.android.package` válido en `app.json`; añadir `@expo/config-plugins` solo si se confirma que falta para resolver el plugin y documentar esa necesidad en `specs/001-read-nfc-wristbands/validation.md`. No añadir otras dependencias funcionales.

**Checkpoint**: Dependencias y configuración declaradas; aún no se afirma
compatibilidad de compilación ni lectura física.

## Phase 3: User Story 1 - Identificar una pulsera (Priority: P1)

**Goal**: Mostrar ID actual y cinco éxitos recientes, distinguir espera/error/
indisponibilidad y probar estabilidad real sin registrar alumnos ni asistencias.

**Independent Test**: Ejecutar `quickstart.md` en un Android físico con A y B:
cinco lecturas por pulsera separadas por retirada, incluida una tras reabrir;
comparar IDs, tiempo máximo de cinco segundos, lista, error y recuperación NFC.

### Tests for User Story 1

- [ ] T004 [US1] Crear `tests/nfc-reader-state.test.mjs` usando `node:test` y `node:assert/strict`, con import del futuro `src/hooks/nfc-reader-state.ts`; cubrir estado inicial vacío, ID no vacío, cinco éxitos recientes al superar cinco, relecturas válidas del mismo ID, ID ausente, fallo notificado que quita solo el ID actual, éxito tras error y ausencia de evento sin nuevo resultado. Ejecutar `node --test tests/nfc-reader-state.test.mjs` y registrar el resultado inicial antes de implementar el estado.

### Implementation for User Story 1

- [ ] T005 [US1] Implementar en `src/hooks/nfc-reader-state.ts` solo las transiciones puras que consume la pantalla y hacen pasar T004; respetar «identificador no vacío», «los errores no se agregan y no eliminan el historial» y «al cerrar la aplicación, no persisten ni los identificadores ni la lista» de `data-model.md`. Conservar las cinco lecturas exitosas más recientes, incluidos IDs iguales de acercamientos distintos, sin imports nativos, persistencia ni deduplicación permanente por ID.
- [ ] T006 [US1] Crear `src/hooks/use-nfc-reader.ts` para comprobar soporte/habilitación e inicializar `react-native-nfc-manager`; registrar `DiscoverTag` con `isReaderModeEnabled: true` y flags NFC-A/B/F/V más `FLAG_READER_SKIP_NDEF_CHECK` de `research.md`, entregar ID no vacío o fallo/ID ausente al estado de T005 y liberar registro/listeners al desmontar. No inferir acercamientos sin evento ni añadir timeout o debounce arbitrario.
- [ ] T007 [US1] Sustituir el contenido de ejemplo de `src/app/index.tsx` por una primera vista funcional que consuma T006 y muestre estado, ID actual y cinco lecturas exitosas recientes; usarla para ensayar el modo lector sin invertir aún en completar la UI o el diseño visual.
- [ ] T008 [US1] Ejecutar `pnpm exec expo prebuild --platform android` y `pnpm exec expo run:android --device`, verificar permiso NFC en `android/app/src/main/AndroidManifest.xml` y manifiesto fusionado, y registrar en `specs/001-read-nfc-wristbands/validation.md` compilación, recepción de IDs, pulsera sostenida sin entradas extra y relectura tras retirada. Detener el avance si hay bloqueo, ID ausente/variable o duplicación de una sola exposición; no parchear nativo ni sustituir la biblioteca sin revisar el alcance.
- [ ] T009 [P] [US1] Tras T008, dejar una sola pantalla en `src/app/_layout.tsx` y retirar `src/app/explore.tsx` de las rutas; eliminar la dependencia del layout de las pestañas y animación de ejemplo, conservando el cierre correcto del splash. No hacer limpieza masiva de componentes o dependencias no utilizados.
- [ ] T010 [P] [US1] Tras T008, completar en `src/hooks/use-nfc-reader.ts` la recuperación con `StateChanged` y comprobación al volver a primer plano, registro solo mientras la pantalla esté activa, limpieza sin listeners simultáneos y protección frente a resultados tardíos; la indisponibilidad no puede mostrarse como espera y su recuperación no requiere reiniciar.
- [ ] T011 [US1] Tras T009 y T010, completar `src/app/index.tsx` conforme a `contracts/scan-screen.md`: espera, detección/ID actual, indisponibilidad y error sin ID actual; historial visible y etiquetado de cinco éxitos recientes incluso tras un fallo. No añadir simulador visible, datos de alumnos, autenticación ni diseño final.
- [ ] T012 [US1] Ejecutar los tests de `tests/nfc-reader-state.test.mjs` y verificar la presentación de error e historial en `src/app/index.tsx`; registrar evidencia de SC-004 en `specs/001-read-nfc-wristbands/validation.md`. Si no hay fallo físico reproducible, usar entradas controladas mediante sustitución temporal del hook en desarrollo, retirar esa sustitución y comprobar que no quede en el código entregable; no llamar a esa evidencia una prueba RF ni crear una pantalla de simulación.
- [ ] T013 [US1] Ejecutar el recorrido completo de `specs/001-read-nfc-wristbands/quickstart.md` y registrar SC-001–SC-005 en `specs/001-read-nfc-wristbands/validation.md`: cuatro lecturas A/B antes y una de cada una tras reabrir, IDs iguales por pulsera y distintos entre pulseras, cinco entradas visibles antes de cerrar, tiempo por lectura, exposición sostenida y recuperación al desactivar/activar NFC. Separar errores controlados de RF y marcar falta de detección, colisiones, cambios de ID o escenarios pendientes sin ocultarlos.

**Checkpoint**: US1 funciona por sí sola únicamente si su evidencia satisface
los criterios; escribir código o pasar tests de estado no demuestra viabilidad NFC.

## Phase 4: Polish & Cross-Cutting Concerns

**Propósito**: Cerrar con evidencia y sin ampliar el spike.

- [ ] T014 Revisar `src/app/index.tsx`, `src/hooks/use-nfc-reader.ts` y `src/hooks/nfc-reader-state.ts` para confirmar ausencia de logs con IDs, transmisiones, almacenamiento e integración de asistencia; comprobar que las sustituciones de T012 se retiraron y documentarlo en `specs/001-read-nfc-wristbands/validation.md`.
- [ ] T015 Ejecutar `node --test tests/nfc-reader-state.test.mjs`, `pnpm exec tsc --noEmit` y lint cuando su configuración/dependencias estén aprobadas; registrar en `specs/001-read-nfc-wristbands/validation.md` resultados y errores nuevos frente a T002. Si siguen fallos base, dejarlos como bloqueo y solicitar alcance aparte, sin ampliar esta tarea para repararlos.
- [ ] T016 Completar `specs/001-read-nfc-wristbands/validation.md` con conclusiones separadas de viabilidad física, manejo de errores y calidad de implementación; actualizar `specs/001-read-nfc-wristbands/quickstart.md` con versiones realmente usadas y el comando de tests, sin afirmar éxito con escenarios pendientes ni publicar UIDs. No hacer commit ni push.

## Dependencies & Execution Order

### Phase Dependencies

`T001 → T002 → T003 → T004 → T005 → T006 → T007 → T008`

Tras validar T008: `T009 || T010 → T011 → T012 → T013 → T014 → T015 → T016`.

T004 escribe pruebas antes del estado, según la estructura de esta lista;
los fallos iniciales no son un criterio de calidad aprobado. El bloqueo físico
de T008 se resuelve con evidencia o revisión explícita, no marcándolo completo.

### User Story Dependencies

US1 es la única historia y el MVP completo de esta feature. No depende de
alumnos, asistencias, backend, persistencia, sincronización ni otra historia.

### Parallel Opportunities

Solo T009 y T010 se marcan `[P]`: después de T008 modifican archivos distintos
y no dependen entre sí. T011 integra ambos resultados. Las tareas de evidencia
se ejecutan secuencialmente porque escriben el mismo `validation.md`.

## Parallel Example: User Story 1

Tras completar la validación temprana T008:

```text
T009: Simplificar src/app/_layout.tsx y retirar src/app/explore.tsx.
T010: Completar ciclo de vida NFC en src/hooks/use-nfc-reader.ts.
```

No ejecutar T011 hasta integrar ambas; esto describe oportunidades de trabajo,
no autoriza lanzar agentes ni realizar commits.

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Confirmar entorno y registrar bloqueos base sin corregirlos silenciosamente.
2. Configurar NFC y construir el acceso mínimo necesario para la prueba temprana.
3. **Parar y validar físicamente en T008** antes de completar la interfaz.
4. Completar la única pantalla, los estados de recuperación y sus pruebas.
5. Ejecutar aceptación completa y separar viabilidad de calidad de implementación.

### Incremental Delivery

Entregar primero evidencia de viabilidad, luego la pantalla funcional y por
último el informe de validación. No inventar US2/US3 ni introducir arquitectura
para futuras asistencias. No declarar terminada la implementación mientras
fallen validaciones de calidad o falte evidencia obligatoria.

## Notes

Los únicos archivos auxiliares nuevos de código son el hook NFC y un módulo
puro de estado para las pruebas ya previstas en el plan. La tabla de tareas no
autoriza instalar dependencias de lint, modificar políticas de scripts pnpm,
reparar el ejemplo web ni añadir un puente nativo propio. Cualquier desviación
requiere reportar el bloqueo y aprobar el nuevo alcance.
