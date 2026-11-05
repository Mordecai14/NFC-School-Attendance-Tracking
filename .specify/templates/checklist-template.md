# [CHECKLIST TYPE] Checklist: [FEATURE NAME]

<!-- Idioma: redactar el contenido generado en español profesional y natural según AGENTS.md, conservando el vocabulario habitual de desarrollo en inglés, los campos estructurales, los IDs y los estados de checkboxes. Al regenerar esta plantilla, conservar esta indicación y revisar el diff. -->

**Purpose**: [Descripción breve del alcance de esta checklist]
**Created**: [DATE]
**Feature**: [Enlace a spec.md o a la documentación pertinente]

**Note**: El comando `/speckit.checklist` genera esta checklist personalizada según el contexto y los requisitos de la feature.
**Review Ownership**: Esta checklist es un artefacto de revisión de calidad de requisitos a cargo de quien revisa. Marcar un ítem con `[x]` solo cuando esa persona determine que se cumple el criterio de calidad de requisitos.
**Marker Semantics**: `[x]` indica que se revisó y se cumplió el criterio de calidad de requisitos. No significa que la implementación esté terminada.

<!--
  ============================================================================
  IMPORTANT: The checklist items below are SAMPLE ITEMS for illustration only.

  The /speckit.checklist command MUST replace these with actual items based on:
  - User's specific checklist request
  - Feature requirements from spec.md
  - Technical context from plan.md
  - Implementation details from tasks.md

  DO NOT keep these sample items in the generated checklist file.
  ============================================================================
-->

## [Category 1]

- [ ] CHK001 Primer ítem de la checklist con una acción clara
- [ ] CHK002 Segundo ítem de la checklist
- [ ] CHK003 Tercer ítem de la checklist

## [Category 2]

- [ ] CHK004 Ítem de otra categoría
- [ ] CHK005 Ítem con criterios específicos
- [ ] CHK006 Último ítem de esta categoría

## Notes

- Marcar ítems con `[x]` solo después de que la revisión confirme que se cumple el criterio de calidad de requisitos
- Dejar sin marcar los ítems que requieran aclaración, corrección o evaluación de quien revisa
- `/speckit.implement` usa el estado de los checkboxes como control de paso y no debe modificar sus marcadores
- `checklists/requirements.md` tiene un ciclo de vida integrado independiente, mantenido por `/speckit.specify` y `/speckit.clarify`
- Agregar comentarios o hallazgos junto al ítem correspondiente
- Incluir enlaces a recursos o documentación pertinentes
- Numerar los ítems de forma secuencial para facilitar las referencias
