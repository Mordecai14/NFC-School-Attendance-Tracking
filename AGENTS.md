# Aplicación de Asistencia Escolar

Aplicación móvil para registrar la entrada y salida de alumnos mediante pulseras NFC.

## Tecnologías

- React Native
- Expo
- TypeScript

Las dependencias adicionales deben incorporarse únicamente cuando sean necesarias para una funcionalidad aprobada.

## Supabase

- Desarrollar directamente contra un proyecto de Supabase en la nube con datos ficticios; no exigir Docker ni levantar una base Supabase local.
- Conservar migraciones SQL versionadas en `supabase/migrations/`; usar la CLI para vincular el proyecto y revisar/aplicar migraciones remotas, no para iniciar servicios locales.
- Configurar Auth en el Dashboard del proyecto remoto; `supabase/config.toml` no aplica esos ajustes al servicio hospedado.
- Confirmar el proyecto destino antes de cualquier cambio remoto. No ejecutar `supabase db reset` en el proyecto en la nube ni usar datos reales antes de definir retención.
- Esta elección de entorno no elimina la futura persistencia offline de asistencias en el dispositivo.

## Principios de ingeniería

- Preferir soluciones simples antes que abstracciones prematuras.
- Mantener TypeScript en modo estricto.
- No agregar dependencias sin una necesidad concreta.
- No inventar requisitos de producto.
- Mantener la lógica de negocio separada de la interfaz de usuario (UI) cuando sea razonable.
- El registro de asistencias debe funcionar sin conexión.
- Los eventos de asistencia nunca deben descartarse silenciosamente.
- Preferir cambios pequeños y fáciles de revisar.

## Documentación

- Escribir y actualizar la documentación del proyecto en español profesional y natural, conservando en inglés el vocabulario habitual de desarrollo. Esta regla también aplica a README, specs, planes, tasks, checklists y documentación generada.
- Mantener términos como feature, roadmap, bug/bugs, backlog, user story, sprint, stack, frontend, backend, layout, responsive, assets, schema/schemas, query/queries, dataset, build, deploy, preview, release, workflow, pipeline, job, CI/CD, setup, runtime, package manager, workspace, lockfile, script, test/tests, testing, check/checks, lint, fixture, mockup, refactor, rollback, handoff, commit, branch, push, pull request, hook, token, secrets y logs. Usarlos cuando aporten precisión, sin convertir la prosa completa al inglés ni forzar anglicismos en palabras comunes.
- Traducir las explicaciones, los títulos descriptivos y las instrucciones; por ejemplo: «Feature: Foundation reproducible», «Validación del build» y «Bugs pendientes».
- No traducir ni renombrar comandos, flags, rutas, archivos, identificadores, variables de entorno, valores de configuración, URLs, nombres de productos, IDs de requisitos/tasks ni marcadores de herramientas. Conservar los estados de los checkboxes y el significado de requisitos, decisiones y evidencias.
- En Spec Kit, conservar los encabezados y campos estructurales que sus comandos usan como referencia (por ejemplo, `User Scenarios & Testing`, `Requirements`, `Success Criteria`, `Technical Context` y `Constitution Check`), los marcadores `NEEDS CLARIFICATION` y las palabras `Given`, `When`, `Then`. Redactar su contenido en español con los términos técnicos anteriores.
- Las instrucciones internas de herramientas pueden conservar su inglés original por compatibilidad; sus documentos generados deben respetar esta convención. Al actualizar o regenerar las plantillas de Spec Kit, conservar la indicación de idioma y revisar el diff.
- Esta convención se refiere a documentación, no cambia automáticamente el idioma del código, los mensajes de UI ni el contenido público del sitio. Una traducción no autoriza cambios de alcance, arquitectura, estados de validación ni enmiendas a la constitución.

Usar:

- `docs/roadmap.md` para prioridades y orden aproximado de capacidades.
- `docs/product.md` para el contexto estable del producto.
- `docs/architecture.md` para la arquitectura actual del sistema.
- `docs/decisions/` para decisiones arquitectónicas.
- `docs/specs/<feature>/spec.md` para requisitos, enfoque y validación, y `tasks.md` en el mismo directorio para el seguimiento del trabajo. Conservar evidencia separada solo cuando aporte información que no convenga resumir.

No asumir que documentación desactualizada sigue siendo correcta.

Si la implementación y la documentación se contradicen, reportar el conflicto.

## Flujo de desarrollo personal

- Trabajar en incrementos pequeños que produzcan un resultado observable; usar el roadmap como dirección, no como una secuencia rígida de fases.
- Acordar el alcance del incremento una vez y avanzar hasta su validación sin pedir aprobación por cada task, archivo, función o decisión técnica reversible.
- Consultar únicamente si falta una decisión de producto que afecta el resultado, cambia materialmente la arquitectura, se amplía el alcance o hay una operación con riesgo de pérdida o exposición de datos. Las acciones de Git mantienen su autorización independiente.
- Usar la spec existente. Para una feature nueva, registrar en `docs/specs/` una descripción breve del resultado, los límites y unos pocos criterios verificables; no exigir un conjunto completo de artefactos.
- Para bugs y refactors dentro del comportamiento aprobado, usar la descripción del problema y su comprobación sin crear una spec nueva por rutina.
- Leer el plan existente y el código relacionado cuando sean pertinentes. Resolver ambigüedades de producto reales; los detalles técnicos reversibles pueden decidirse y comunicarse al cierre.
- Spec Kit es opcional: usar sus comandos cuando aporten valor o se soliciten, no como una cadena obligatoria. Si se invoca un comando explícitamente, respetar sus instrucciones y gates.
- Mantener una sola fuente por tema; consolidar duplicados conservando requisitos, decisiones y evidencia. Registrar decisiones arquitectónicas materiales, no cada detalle de implementación.
- Mantener `tasks.md` como una lista corta de entregables con checkboxes; actualizar el avance sin duplicarlo en la spec. Ajustar o combinar pasos técnicos dentro del alcance sin pedir aprobación por cada task ni imponer gates, TDD o fases rígidas. Respetar dependencias técnicas y validaciones de seguridad reales.
- Las specs 001–003 están simplificadas: no recrear `plan.md`, research, contratos ni checklists por rutina. Los comandos opcionales de Spec Kit que exijan esos archivos o un formato de tasks más detallado requieren adaptar el flujo o una solicitud explícita, no ejecutarlos como prerequisito del desarrollo.
- No imponer TDD, porcentajes de cobertura, capas ni patrones por rutina. Preferir la solución directa que cumpla el alcance.

## Validación

Antes de considerar terminado un incremento:

- Para cambios de código o dependencias, ejecutar lint, validación de TypeScript y los tests relevantes; no repetir toda la suite por cada edición intermedia.
- Para cambios solo documentales, revisar el diff, los enlaces o referencias afectados y el formato; no ejecutar checks de la app sin relación con el cambio.
- Validar visualmente los cambios de UI; agregar tests enfocados cuando haya lógica relevante. Si no se puede comprobar en dispositivo o emulador, indicarlo.
- Mantener tests automatizados de las reglas críticas de autorización, aislamiento por escuela, preservación de eventos y sincronización cuando se modifiquen esas capacidades.
- No exigir suites amplias ni cobertura artificial para cambios triviales. Reportar los checks ejecutados, fallos, validaciones pendientes y desviaciones de alcance; no corregir bugs ajenos sin autorización.
- Cerrar con un resumen breve: qué funciona ahora, cómo comprobarlo y qué quedó pendiente. No presentar como validado lo que no se ejecutó.

## Git

No hacer commit, push, rebase ni modificar el historial de Git a menos que se solicite explícitamente.
