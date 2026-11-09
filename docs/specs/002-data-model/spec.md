# Feature: Modelo de datos del MVP

**Status**: Completada el 2026-10-30 como entregable conceptual. No implementa código, tablas, almacenamiento, autorización ni sincronización. El resultado se reúne aquí y el resumen de tareas en [tasks.md](tasks.md).

## Modelo conceptual

| Entidad | Datos aprobados | Reglas |
|---|---|---|
| Escuela | Nombre como dato conceptual mínimo. | Tiene cero o más alumnos. |
| Alumno | Identidad conceptual, nombre, grado y grupo. | Pertenece a una escuela; no es usuario autenticado. Puede tener cero o más tutores y cero o una pulsera activa. |
| Pulsera | Identificador NFC único en todo el sistema. | Pertenece a un alumno; estado activo o reemplazado. La anterior se conserva al reemplazarla. |
| Tutor | Identidad conceptual y nombre; vínculo con cada alumno. | Muchos a muchos con alumnos. No implica cuenta ni acceso a una app. Sin datos de contacto. |
| Evento de asistencia | Identidad global, alumno, entrada/salida y momento de ocurrencia. | Histórico e inmutable; identidad y momento estables entre reintentos, también desde dispositivos distintos. |

```text
Escuela 1 ─── 0..* Alumno
Alumno  * ─── *     Tutor
Alumno  1 ─── 0..1 Pulsera activa
Alumno  1 ─── 0..* Pulseras históricas
Alumno  1 ─── 0..* Eventos de asistencia
```

Los eventos se asocian al alumno, no a la pulsera: reemplazarla no cambia su historial. El UID identifica una pulsera; no garantiza resistencia a clonación.

## Requirements

- **FR-001**: Definir las cinco entidades y sus datos mínimos: escuela con nombre; alumno con nombre, grado y grupo; detalle con nombre y vínculo del tutor.
- **FR-002**: Cada alumno pertenece a una sola escuela; una escuela puede tener varios alumnos.
- **FR-003**: Alumnos y tutores se relacionan muchos a muchos.
- **FR-004**: El UID NFC es único globalmente, incluso para pulseras históricas. Cada alumno tiene como máximo una activa; al reemplazarla por daño o extravío se conserva la anterior y la nueva queda activa.
- **FR-005**: Las asistencias son eventos inmutables del alumno; reemplazar la pulsera no los modifica ni elimina.
- **FR-006**: Cada evento distingue entrada/salida, momento e identidad global única y estable en reintentos offline, sin definir aquí cómo generarla.
- **FR-007**: El modelo incluye relaciones, restricciones y ejemplos ficticios que permiten recorrer el MVP.
- **FR-008**: Separar reglas confirmadas de decisiones pendientes y exclusiones.
- **FR-009**: Solo personal autorizado de la escuela del alumno puede consultar su detalle y el nombre/vínculo del tutor. No exponer datos ajenos ni agregar datos personales no aprobados. Es un límite conceptual, no un control implementado. La identidad de tutor compartida entre escuelas se precisa posteriormente en [003](../003-supabase-foundation/spec.md), sin compartir alumnos ni vínculos ajenos.
- **FR-010**: El modelo permanece conceptual y agnóstico a tecnologías, sin tipos, tablas, políticas, persistencia ni sincronización implementados en 002.

## User Scenarios & Testing

Revisión documental con ejemplos ficticios, sin ejecutar la aplicación:

1. **Asignación inicial**: A pertenece a una escuela y tiene P1 activa; no se permite una segunda activa. Puede estar temporalmente sin pulsera o sin tutor, sin inventar datos.
2. **Tutor compartido**: dos hermanos pueden compartir un tutor y tener además otros tutores; una persona ajena o de otra escuela no recibe sus detalles.
3. **Reemplazo**: P1 pasa a histórica y P2 a activa. La entrada previa E1 sigue asociada a A, sin alteración ni reasignación a P2.
4. **Offline**: D1 crea E1 en T1 y D2 crea E2 en T2 con identidades globales distintas. Reenviar E1 conserva E1 y T1. Otra entrada real es otro evento; determinar si fue accidentalmente duplicada corresponde a otra feature.

## Success Criteria

- **SC-001**: Asignación inicial, tutor entre hermanos y reemplazo con historial se interpretan sin contradicciones.
- **SC-002**: Las cinco entidades tienen propósito, relaciones y datos mínimos descritos.
- **SC-003**: Todas las cardinalidades confirmadas aparecen y coinciden con los ejemplos.
- **SC-004**: Los ejemplos de reemplazo y reintento preservan los eventos previos identificables, sin sobrescribirlos ni descartarlos.
- **SC-005**: La visibilidad de alumno/tutor queda explícita y los ejemplos no permiten exposición a personas no autorizadas ni a otra escuela.

## Decisiones pendientes

Reutilización de pulseras retiradas, transferencias entre escuelas, acceso de tutores, datos de contacto, retención/eliminación legal, generación de IDs, almacenamiento, deduplicación, sincronización y escala operativa. No se definen por inferencia; se resolverán cuando una feature los necesite.
