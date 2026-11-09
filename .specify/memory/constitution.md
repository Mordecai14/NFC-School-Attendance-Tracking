<!--
Sync Impact Report
- Version change: 1.0.0 -> 2.0.0 (flexibilización de obligaciones del workflow).
- Motivo: reducir ceremonia en un proyecto personal y priorizar incrementos observables.
- Aprobación: el responsable aprobó el flujo propuesto en la conversación del 2026-11-08.
- Modified principles: I. Especificación y aceptación; III. Tipos y verificación;
  Flujo de desarrollo. Se permiten specs breves y validación proporcional al cambio.
- Sin cambios: alcance explícito, privacidad, aislamiento y preservación de asistencias.
- Sincronizado: AGENTS.md. Spec Kit queda opcional; sus comandos explícitos conservan sus gates.
- Aclaración 2.0.0 -> 2.0.1: a pedido del responsable, se consolidan los documentos de
  001–003 en una spec por feature, conservando requisitos, decisiones y estado real.
  No se marca trabajo pendiente como completado ni se cambian requisitos de producto.
  La evidencia física NFC permanece separada; no se regeneran plantillas.
-->
# Aplicación de Asistencia Escolar Constitution

## Core Principles

### I. Especificación y aceptación
Toda feature nueva DEBE tener una especificación en `docs/specs/` con resultado esperado,
alcance y criterios de aceptación explícitos antes de implementarse; puede ser breve y
evolucionar por incrementos. No se exige un plan, research, contratos ni tasks separados
para cada cambio. Los bugs y refactors dentro del comportamiento aprobado no requieren
una spec nueva. Las ambigüedades que alteren el comportamiento de producto DEBEN aclararse;
no se DEBEN inventar reglas de producto.

### II. Simplicidad y alcance
Cada cambio DEBE limitarse al alcance aprobado y mantenerse pequeño y revisable. Las
abstracciones, servicios e infraestructura adicionales DEBEN justificarse por una
necesidad concreta; no se DEBE anticipar funcionalidad no especificada.

### III. Tipos y verificación
TypeScript DEBE permanecer en modo estricto. Antes de dar por terminado un incremento
de código o dependencias, se DEBEN ejecutar lint, validación de tipos y tests relevantes.
Los cambios solo documentales requieren revisión del diff, referencias afectadas y formato,
no checks de la app sin relación con el cambio. La validación DEBE ser proporcional al riesgo:
comprobación visual de UI y tests enfocados para lógica relevante, sin TDD ni porcentajes
de cobertura obligatorios. Los cambios en autorización, aislamiento por escuela, preservación
de eventos o sincronización DEBEN contar con tests automatizados de sus reglas críticas.
Los fallos, checks no ejecutados y desviaciones del alcance aprobado DEBEN reportarse.

### IV. Asistencias confiables sin conexión
El registro de entradas y salidas DEBE funcionar sin Internet. Los eventos de
asistencia son históricos: no se DEBEN sobrescribir ni descartar silenciosamente.
Las especificaciones que afecten captura, duplicados o sincronización DEBEN definir
cómo se preservan los eventos ante fallos; la pérdida de conexión no puede impedir
el registro.

### V. Seguridad y privacidad de alumnos
Todo cambio que trate datos de alumnos DEBE limitar su acceso y exposición a lo
necesario para el caso de uso aprobado. Sus criterios de aceptación DEBEN contemplar
riesgos de acceso no autorizado y divulgación de datos; no se DEBEN introducir datos
sensibles, accesos o transmisiones sin una necesidad especificada.

## Restricciones del proyecto

El stack actual es React Native, Expo y TypeScript. Toda dependencia adicional DEBE
justificarse por una funcionalidad aprobada. Las decisiones que alteren materialmente
la arquitectura DEBEN registrarse en `docs/decisions/`; una dirección planificada en
`docs/architecture.md` no autoriza por sí sola su implementación.

## Flujo de desarrollo

El desarrollo DEBE organizarse en incrementos pequeños con resultados observables, usando
el roadmap como dirección y la arquitectura como referencia, no como fases rígidas.
Antes de implementar, se DEBEN consultar la spec y el plan existentes cuando sean pertinentes,
contrastar el código relacionado y resolver decisiones de producto faltantes.
Una vez acordado el alcance, se avanza sin aprobaciones por cada task o detalle técnico
reversible. Se DEBE consultar ante cambios de producto, ampliaciones de alcance, cambios
materiales de arquitectura u operaciones con riesgo de pérdida o exposición de datos.
Las acciones de Git siguen requiriendo autorización explícita según AGENTS.md.
Spec Kit es opcional; invocar explícitamente un comando exige respetar sus instrucciones.
Se DEBEN actualizar solo los documentos afectados por cambios reales, sin regenerar un
conjunto de artefactos por rutina. Cada cierre DEBE indicar el resultado, cómo comprobarlo
y las validaciones o limitaciones pendientes. Las discrepancias entre documentación e
implementación DEBEN reportarse, no asumirse resueltas.

## Governance

Esta constitución prevalece sobre guías y planes de menor alcance cuando haya un
conflicto; el conflicto DEBE hacerse explícito antes de continuar. Toda enmienda
DEBE documentar el motivo, el impacto en principios y la aprobación del responsable
del proyecto. La versión sigue SemVer: MAJOR para cambios incompatibles en obligaciones,
MINOR para principios o secciones nuevos o ampliaciones sustanciales y PATCH para
aclaraciones sin cambio normativo. Toda revisión de cambios DEBE verificar el
cumplimiento de esta constitución o señalar la excepción para aprobación explícita.

**Version**: 2.0.1 | **Ratified**: 2026-10-27 | **Last Amended**: 2026-11-08
