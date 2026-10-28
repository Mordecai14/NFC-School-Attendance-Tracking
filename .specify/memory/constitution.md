<!--
Sync Impact Report
- Version change: unversioned scaffold -> 1.0.0 (initial constitution).
- Modified principles: template placeholders I-V -> I. Specification and acceptance;
  II. Simplicity and scope; III. Strict types and verification;
  IV. Reliable offline attendance; V. Student security and privacy.
- Added sections: Project constraints; Development workflow.
- Removed sections: none; placeholder sections replaced.
- Follow-up TODOs: none.
-->
# Aplicación de Asistencia Escolar Constitution

## Core Principles

### I. Especificación y aceptación
Toda funcionalidad DEBE tener una especificación en `specs/` con alcance y criterios de
aceptación explícitos antes de implementarse. Los requisitos ambiguos DEBEN aclararse
antes de escribir código; no se DEBEN inventar reglas de producto.

### II. Simplicidad y alcance
Cada cambio DEBE limitarse al alcance aprobado y mantenerse pequeño y revisable. Las
abstracciones, servicios e infraestructura adicionales DEBEN justificarse por una
necesidad concreta; no se DEBE anticipar funcionalidad no especificada.

### III. Tipos y verificación
TypeScript DEBE permanecer en modo estricto. Antes de dar un cambio por terminado,
se DEBEN ejecutar lint, validación de tipos y pruebas relevantes; los fallos y las
desviaciones del plan aprobado DEBEN reportarse. Las reglas críticas DEBEN contar
con validación automatizada cuando sea razonable.

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

Antes de implementar, se DEBEN leer la especificación y el plan existente, contrastar
el código relacionado y resolver los requisitos faltantes. Cada revisión DEBE
comprobar los criterios de aceptación, el alcance y el resultado de las validaciones.
Las discrepancias entre documentación e implementación DEBEN reportarse, no asumirse
resueltas.

## Governance

Esta constitución prevalece sobre guías y planes de menor alcance cuando haya un
conflicto; el conflicto DEBE hacerse explícito antes de continuar. Toda enmienda
DEBE documentar el motivo, el impacto en principios y la aprobación del responsable
del proyecto. La versión sigue SemVer: MAJOR para cambios incompatibles en obligaciones,
MINOR para principios o secciones nuevos o ampliaciones sustanciales y PATCH para
aclaraciones sin cambio normativo. Toda revisión de cambios DEBE verificar el
cumplimiento de esta constitución o señalar la excepción para aprobación explícita.

**Version**: 1.0.0 | **Ratified**: 2026-10-27 | **Last Amended**: 2026-10-27
