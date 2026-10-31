# Especificación de la funcionalidad: Modelo de datos del MVP

**Rama de la funcionalidad**: `[002-data-model]`
**Creada**: 2026-10-29
**Estado**: Completada el 2026-10-30. El entregable es el modelo conceptual documentado; no incluye implementación de código, almacenamiento ni sincronización.
**Entrada**: Descripción del usuario: "Comprender y planifica lo necesario para poder realizar el desarrollo del paso 002 — Modelo de datos de la hoja de ruta."

## Aclaraciones

### Sesión 2026-10-29

- **Pregunta**: ¿Qué datos personales debe incluir el modelo conceptual para alumnos y tutores? → **Respuesta**: Nombre, grado y grupo visibles para la escuela; los datos completos, incluido el tutor, se documentan para una sección de detalle, sin implementar una pantalla en 002.
- **Pregunta**: Al reemplazar una pulsera, ¿el modelo debe conservar la anterior como registro histórico además de asignar la nueva? → **Respuesta**: Sí; conservar la pulsera anterior como histórica y marcar la nueva como activa.
- **Pregunta**: ¿El identificador leído de cada pulsera debe ser único en todo el sistema? → **Respuesta**: Sí, único en todo el sistema.
- **Pregunta**: ¿Qué datos del tutor debe incluir el perfil completo? → **Respuesta**: Nombre y vínculo únicamente.
- **Pregunta**: ¿Qué límite de visibilidad debe documentar el modelo para los datos personales? → **Respuesta**: Solo el personal autorizado de la escuela del alumno; 002 documenta el límite, no implementa autorización.
- **Pregunta**: ¿Qué dato mínimo identifica conceptualmente a una escuela? → **Respuesta**: Su nombre; no se agregan otros datos escolares en 002.
- **Pregunta**: ¿Qué unicidad requiere la identidad de un evento de asistencia? → **Respuesta**: Identidad única en todo el sistema y estable entre reintentos sin conexión.

## Escenarios de usuario y pruebas

### Historia de usuario 1 - Comprender las entidades del MVP (Prioridad: P1)

El responsable del producto y quienes desarrollen las siguientes capacidades necesitan una descripción compartida de los datos principales y de cómo se relacionan, para que las funciones posteriores usen un modelo coherente.

**Por qué tiene esta prioridad**: Las relaciones entre escuela, alumno, pulsera, tutor y asistencia condicionan las siguientes capacidades de la hoja de ruta.

**Prueba independiente**: Revisar el modelo junto con ejemplos ficticios y comprobar que cada entidad y relación se interpreta sin contradicciones.

**Escenarios de aceptación**:

1. **Dado** un alumno matriculado y una pulsera activa, **Cuando** se consulta el modelo, **Entonces** se puede identificar a qué escuela pertenece el alumno y qué pulsera tiene asignada.
2. **Dado** hermanos vinculados a un mismo tutor, **Cuando** se representa el caso, **Entonces** el modelo permite varios alumnos por tutor y varios tutores por alumno.
3. **Dado** el detalle de un alumno que incluye información de su tutor, **Cuando** se documentan los límites de visibilidad, **Entonces** el modelo indica que solo puede consultarlo personal autorizado de la escuela del alumno y que no debe exponerse a personas no autorizadas ni a otra escuela.

---

### Historia de usuario 2 - Preservar el historial de asistencias (Prioridad: P1)

El personal de la escuela necesita que cada entrada y salida quede representada como un registro histórico del alumno, incluso si después se reemplaza su pulsera o el dispositivo opera sin conexión.

**Por qué tiene esta prioridad**: El producto exige conservar los eventos y poder registrarlos durante interrupciones de conectividad.

**Prueba independiente**: Seguir ejemplos de entrada, salida, reemplazo de pulsera y registro sin conexión; verificar que ningún evento previo se modifica o desaparece y que un reintento de envío puede reconocerse como el mismo evento.

**Escenarios de aceptación**:

1. **Dado** que ya hay eventos de entrada y salida de un alumno, **Cuando** se reemplaza su pulsera, **Entonces** los eventos históricos permanecen asociados al alumno y no se sobrescriben.
2. **Dado** eventos creados sin conexión en distintos dispositivos, **Cuando** se representan para su posterior sincronización, **Entonces** cada evento tiene una identidad única en todo el sistema y conserva su identidad y momento de ocurrencia en cada reintento.

### Casos límite

- Intentar asignar una segunda pulsera activa al mismo alumno.
- Reemplazar una pulsera por daño o extravío sin perder eventos históricos.
- Consultar la asignación vigente del alumno sin borrar el registro de la pulsera reemplazada.
- Registrar eventos repetidos de entrada o salida: el modelo conserva cada evento y no define por sí solo una política para decidir si representan una duplicación accidental.
- Representar un evento sin conexión cuyo envío se reintenta más de una vez.
- Un alumno sin tutor vinculado o sin pulsera activa; el modelo debe permitir expresar la ausencia sin inventar datos.

## Requisitos

### Requisitos funcionales

- **FR-001**: La documentación DEBE definir escuela, alumno, pulsera, tutor y evento de asistencia, indicando qué representa cada entidad y sus datos mínimos de negocio. La escuela se identifica conceptualmente por su nombre. Para el alumno, debe incluir nombre, grado y grupo como datos visibles para la escuela; el perfil completo debe contemplar nombre del tutor y su vínculo con el alumno.
- **FR-002**: La documentación DEBE definir que cada alumno pertenece a una sola escuela en el MVP y que una escuela puede tener varios alumnos.
- **FR-003**: La documentación DEBE definir una relación de varios a varios entre alumnos y tutores.
- **FR-004**: La documentación DEBE definir que cada pulsera tiene un identificador NFC único en todo el sistema; cada alumno puede tener como máximo una pulsera activa a la vez y una pulsera puede reemplazarse por daño o extravío. La pulsera reemplazada se conserva como registro histórico y la nueva pasa a ser la activa.
- **FR-005**: La documentación DEBE definir que las asistencias son eventos históricos inmutables asociados al alumno; reemplazar una pulsera no modifica ni elimina esos eventos.
- **FR-006**: La documentación DEBE distinguir los eventos de entrada y salida, registrar el momento del evento y asignar a cada evento una identidad única en todo el sistema, estable durante la entrega sin conexión y sus reintentos. La documentación no fija el mecanismo para generarla.
- **FR-007**: La documentación DEBE incluir relaciones, restricciones de integridad y ejemplos ficticios suficientes para revisar el flujo del MVP de extremo a extremo.
- **FR-008**: La documentación DEBE separar las reglas confirmadas de los aspectos que quedan fuera del alcance o pendientes de una decisión de producto.
- **FR-009**: La documentación DEBE limitar los datos personales a los aprobados y establecer que el detalle del alumno, incluido el nombre y vínculo del tutor, solo es visible para personal autorizado de la escuela a la que pertenece. La documentación DEBE contemplar que esos datos no se expongan a personas no autorizadas ni a otra escuela. Este límite es conceptual: 002 no implementa pantallas ni controles de autorización.
- **FR-010**: El resultado DEBE ser conceptual y agnóstico a tecnologías; no debe incluir implementación de tipos, tablas, políticas de base de datos, persistencia local ni sincronización.

### Entidades principales

- **Escuela**: organización identificada conceptualmente por su nombre, a la que pertenece el alumno durante el MVP.
- **Alumno**: persona cuya asistencia registra la escuela; no es un usuario autenticado de la aplicación. El modelo incluye nombre, grado y grupo en los datos visibles para la escuela y contempla la información del tutor vinculado en el detalle completo.
- **Pulsera**: medio de identificación NFC con identificador único en todo el sistema, asignado al alumno; puede dejar de estar activa por daño o extravío y ser reemplazada. Las pulseras reemplazadas se conservan como registros históricos.
- **Tutor**: persona relacionada con uno o más alumnos; el dato personal incluido es su nombre y su vínculo con el alumno. No implica por sí mismo una cuenta autenticada ni acceso a una aplicación.
- **Evento de asistencia**: hecho histórico de entrada o salida de un alumno, ocurrido en un momento determinado y con identidad única en todo el sistema, estable para soportar registro sin conexión y reintentos posteriores.

## Criterios de éxito

### Resultados medibles

- **SC-001**: Una revisión con al menos tres escenarios ficticios (asignación inicial, tutor compartido entre hermanos y reemplazo de pulsera con asistencias previas) puede determinar para cada registro su entidad y relaciones sin reglas contradictorias.
- **SC-002**: El 100% de las cinco entidades del alcance tiene propósito, relaciones y datos mínimos descritos en el documento del modelo.
- **SC-003**: El 100% de las reglas de cardinalidad confirmadas —escuela/alumno, alumno/pulsera activa y alumno/tutor— aparece explícitamente y coincide con los ejemplos.
- **SC-004**: En todos los ejemplos de reemplazo y reintento sin conexión, los eventos de asistencia previos permanecen identificables y no se sobrescriben ni se descartan.
- **SC-005**: El modelo define explícitamente quién puede consultar los datos del alumno y tutor, y sus ejemplos no permiten exposición a personas no autorizadas ni a otra escuela.

## Supuestos

- El alcance de 002 es especificar y documentar el modelo conceptual; la implementación de dominio y la base de Supabase corresponden a pasos posteriores.
- La distinción entre datos visibles para la escuela y el detalle completo orienta la documentación del modelo; no implica implementar una interfaz. No se agregan datos de contacto del tutor sin una necesidad aprobada.
- Una escuela puede tener varios alumnos; cada alumno pertenece a una sola escuela en el MVP.
- Al reemplazar una pulsera, se conserva su registro histórico y se marca la nueva como activa; la reutilización de la anterior no queda definida.
- Las relaciones alumno-tutor son de varios a varios; se define el límite de visibilidad escolar, pero no un modelo de roles/permisos ni acceso de tutores a una aplicación.
- Para el tutor, el modelo incluye nombre y vínculo con el alumno; no incluye datos de contacto.
- La identidad estable y el momento del evento se describen como necesidades del modelo; el mecanismo de almacenamiento, generación y sincronización queda para pasos posteriores.
- No se especifican transferencias de alumnos entre escuelas ni retención o eliminación legal de datos.
