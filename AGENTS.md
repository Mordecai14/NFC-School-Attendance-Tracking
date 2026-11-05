# Aplicación de Asistencia Escolar

Aplicación móvil para registrar la entrada y salida de alumnos mediante pulseras NFC.

## Tecnologías

- React Native
- Expo
- TypeScript

Las dependencias adicionales deben incorporarse únicamente cuando sean necesarias para una funcionalidad aprobada.

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

- Escribir y actualizar la documentación del proyecto en español profesional y natural, conservando en inglés el vocabulario habitual de desarrollo. Esta regla también aplica a README, specs, planes, tasks, checklists y documentación generada por Spec Kit.
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
- `docs/specs/` para requisitos y planes específicos de cada funcionalidad.

No asumir que documentación desactualizada sigue siendo correcta.

Si la implementación y la documentación se contradicen, reportar el conflicto.

## Antes de implementar

1. Leer la especificación correspondiente.
2. Leer el plan de implementación si existe.
3. Inspeccionar el código existente relacionado.
4. Identificar supuestos o requisitos faltantes.
5. No ampliar el alcance solicitado sin una justificación clara.

## Validación

Antes de considerar terminado un cambio:

- ejecutar lint;
- ejecutar validación de TypeScript;
- ejecutar las pruebas relevantes;
- reportar fallos de validación;
- reportar desviaciones respecto al plan aprobado.

## Git

No hacer commit, push, rebase ni modificar el historial de Git a menos que se solicite explícitamente.
