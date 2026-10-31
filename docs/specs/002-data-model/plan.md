# Plan de implementación: Modelo de datos del MVP

**Rama**: `[002-data-model]` | **Fecha**: 2026-10-29 | **Especificación**: [spec.md](spec.md)

**Entrada**: Especificación de la funcionalidad en `docs/specs/002-data-model/spec.md`

## Resumen

Documentar un modelo conceptual para escuela, alumno, pulsera, tutor y evento de asistencia, con las cardinalidades y reglas confirmadas en la especificación. El resultado son documentos de diseño y una guía de revisión; no se implementan entidades TypeScript, pantallas, almacenamiento, sincronización ni esquema de Supabase.

## Contexto técnico

**Lenguaje/versión**: No aplica al entregable documental. La plataforma existente usa TypeScript con React Native y Expo.

**Dependencias principales**: Ninguna dependencia nueva.

**Almacenamiento**: No aplica a esta funcionalidad. La persistencia sin conexión y Supabase pertenecen a etapas posteriores.

**Pruebas**: Revisión documental contra la especificación y escenarios manuales de la guía `quickstart.md`; `git diff --check` para verificar el cambio. No se agrega un marco de trabajo ni código de pruebas.

**Plataforma de destino**: Documentación del producto móvil; no hay cambios ejecutables específicos de una plataforma.

**Tipo de proyecto**: Aplicación móvil con React Native y Expo; el entregable de esta funcionalidad es exclusivamente documental.

**Objetivos de rendimiento**: No aplica; no se introduce comportamiento ejecutable.

**Restricciones**: Mantener el alcance conceptual; respetar la privacidad, el historial inmutable y los requisitos futuros de funcionamiento sin conexión; no inventar atributos, permisos ni políticas operativas.

**Escala/alcance**: Las cinco entidades y relaciones del MVP definidas en la especificación. No hay volúmenes de datos ni métricas de capacidad aprobados o necesarios para este modelo conceptual.

## Revisión de la constitución

### Verificación previa al diseño

- **Especificación y aceptación**: Cumple — la especificación delimita entidades, relaciones, privacidad y resultados verificables.
- **Simplicidad y alcance**: Cumple — solo se crean documentos; no se agregan abstracciones, servicios ni infraestructura.
- **Tipos y verificación**: Cumple — no cambia TypeScript ni se añaden dependencias; la validación se limita a los artefactos documentales.
- **Asistencias confiables sin conexión**: Cumple — se documentan identidad y momento del evento, conservación histórica y reintentos; la captura y sincronización se reservan para fases posteriores.
- **Seguridad y privacidad de alumnos**: Cumple — se documentan los datos aprobados y el límite de visibilidad para personal autorizado de la escuela del alumno; la autorización técnica queda fuera de alcance.

No se identifican excepciones a la constitución.

## Enfoque técnico

1. Traducir los requisitos confirmados de la especificación a un diagrama o tabla conceptual en `data-model.md`.
2. Separar cardinalidades, estados de pulsera y reglas de inmutabilidad de asistencias de cualquier mecanismo de persistencia.
3. Registrar como no definidos los atributos o procesos que la especificación no aprueba, sin completar vacíos con supuestos de implementación.
4. Verificar el modelo con los escenarios de escuela/alumno, tutor compartido, reemplazo de pulsera y evento sin conexión con reintento.

## Dependencias y configuración

- Dependencias nuevas: ninguna.
- Configuración de Expo, Android, TypeScript o Supabase: ninguna.
- Interfaces externas: ninguna; no se crean contratos API.
- Investigación técnica externa: no necesaria. No hay decisiones sobre tecnologías o integración que resolver para una entrega documental.

## Archivos y áreas

```text
docs/specs/002-data-model/
├── plan.md          # enfoque, restricciones, validación y riesgos
├── research.md      # decisiones de diseño y alternativas descartadas
├── data-model.md    # entidades, relaciones e invariantes conceptuales
├── quickstart.md    # guía reproducible de revisión documental
└── tasks.md         # trabajo ejecutable agrupado por historia
```

No se prevén cambios en `src/`, `tests/`, `android/`, configuración o dependencias. No se genera `contracts/`: esta funcionalidad no expone interfaces de programación de aplicaciones ni interfaces externas.

### Discrepancia documental resuelta al cierre

Al iniciar este plan, `docs/architecture.md` indicaba que NFC no estaba implementado, aunque el código incluía `useNfcReader` y la validación de 001 registraba lectura física confirmada. Al cerrar 002, se actualizó la arquitectura para reflejar que la lectura NFC en Android fue validada con dos pulseras de muestra; la anomalía y los límites de esa validación permanecen documentados en `docs/specs/001-read-nfc-wristbands/validation.md`. La integración con backend y la persistencia offline siguen pendientes.

## Manejo de estados y errores

- El estado de pulsera se limita a activa o reemplazada; una nueva asignación reemplaza la activa y conserva el registro anterior.
- El evento de asistencia es histórico e inmutable, distingue entrada y salida, y conserva identidad y momento de ocurrencia para un envío posterior sin conexión.
- Repetir la entrega de un evento no debe cambiar su identidad ni borrar el original; la política para determinar si dos eventos distintos son duplicados no se define aquí.
- Los errores de lectura NFC, fallos de almacenamiento y conflictos de sincronización no se implementan en 002. Se documenta ese límite para evitar confundir el modelo con los comportamientos de funcionalidades posteriores.
- No se define reutilización de una pulsera reemplazada, transferencia entre escuelas, implementación de roles/autorización ni retención legal; solo se establece el límite conceptual de visibilidad escolar.

## Estrategia de pruebas

- Revisar cada entidad, atributo aprobado, relación y restricción contra FR-001–FR-010.
- Seguir ejemplos ficticios: alumno con pulsera activa; tutor compartido entre hermanos; reemplazo de pulsera con historial previo; evento sin conexión cuyo envío se reintenta.
- Comprobar que no aparecen datos personales no aprobados, cardinalidades contradictorias ni decisiones explícitamente diferidas; verificar que el modelo delimita la visibilidad del detalle a personal autorizado de la escuela correspondiente.
- Seguir `quickstart.md` y ejecutar `git diff --check`.
- No ejecutar lint, TypeScript ni pruebas de aplicación: no hay cambios de código. Si el alcance se amplía a código, crear primero una actualización aprobada del plan y aplicar las validaciones del proyecto.

## Riesgos técnicos

- **Confundir el UID NFC con la identidad completa de la pulsera**: el modelo registra el UID como identificador único aprobado, pero no presupone un mecanismo de autenticación criptográfica ni resistencia a clonación.
- **Vincular eventos a pulseras en vez de alumnos**: podría fragmentar el historial al reemplazar una pulsera; los eventos se relacionan con el alumno.
- **Inventar datos de tutor o permisos**: se limita la ficha a nombre y vínculo y se define solo el límite conceptual de visibilidad; no se implementan roles ni controles de autorización.
- **Tratar los reintentos como eventos nuevos**: la identidad estable del evento se conserva conceptualmente; el protocolo de sincronización queda fuera de esta funcionalidad.
- **Colisión de identidades de eventos sin conexión**: el modelo exige unicidad global entre dispositivos; el mecanismo que la garantiza debe definirse al implementar la captura y sincronización en fases posteriores.
- **Describir el comportamiento NFC ya resuelto como parte del modelo**: la lectura física corresponde a 001 y no se modifica aquí.

## Criterios de éxito del análisis/modelo

- Las cinco entidades y sus relaciones aparecen sin contradicciones y con solo los datos aprobados.
- Cada alumno pertenece a una escuela, puede tener varios tutores y como máximo una pulsera activa.
- Un identificador NFC globalmente único identifica una pulsera; reemplazarla conserva el registro anterior.
- Las asistencias permanecen asociadas al alumno, distinguen entrada y salida y conservan su identidad y momento aunque se registren sin conexión o se reintente su envío.
- Los escenarios de `quickstart.md` se pueden seguir sin requerir decisión implícita de implementación.
- La revisión no revela cambios de código, configuración, dependencias o infraestructura.

## Revisión de la constitución tras el diseño

Cumple — el diseño permanece documental, no añade dependencias ni infraestructura, define conceptualmente la visibilidad de datos personales y conserva los requisitos de identidad global de eventos e historial sin conexión. Los controles técnicos de autorización y sincronización quedan para fases posteriores. No se detectan violaciones que requieran justificación.

## Estructura del proyecto

### Documentación de esta funcionalidad

```text
docs/specs/002-data-model/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── tasks.md
```

### Código fuente

No se modifica código fuente ni pruebas automatizadas en esta funcionalidad.

**Decisión de estructura**: Los artefactos se mantienen en el directorio de la especificación. El repositorio continúa siendo una única aplicación Expo; no se crean módulos de dominio ni proyectos adicionales para un modelo exclusivamente documental.

## Seguimiento de complejidad

No hay violaciones de la constitución ni complejidad adicional que justificar.
