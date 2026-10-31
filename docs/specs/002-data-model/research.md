# Investigación: Modelo de datos del MVP

## Decisiones

### Mantener 002 como modelo conceptual documental

- **Decisión**: describir entidades, relaciones, datos mínimos e invariantes sin implementar tipos, tablas o persistencia.
- **Motivo**: la especificación delimita 002 a documentación; Supabase, el almacenamiento sin conexión y la sincronización se encuentran en pasos posteriores de la hoja de ruta.
- **Alternativas consideradas**: crear tipos TypeScript o un esquema de Supabase en esta funcionalidad. Se descartan porque anticiparían trabajo de 003 o etapas posteriores y mezclarían responsabilidades.

### Documentar visibilidad de datos personales sin implementar autorización

- **Decisión**: el detalle del alumno y del tutor solo se expone conceptualmente a personal autorizado de la escuela del alumno; los ejemplos excluyen accesos no autorizados o desde otra escuela.
- **Motivo**: cumplir el principio de privacidad y la especificación sin incorporar autenticación o controles técnicos de acceso en 002.
- **Alternativas consideradas**: dejar la visibilidad implícita o implementar autorización ahora. Se descartan, respectivamente, por no contemplar el riesgo de divulgación y por exceder el alcance documental.

### Identificar escuela por nombre

- **Decisión**: incluir el nombre de la escuela como dato conceptual mínimo; no prescribir identificadores técnicos u otros datos escolares.
- **Motivo**: hacer representable la entidad Escuela sin añadir datos no solicitados.
- **Alternativas consideradas**: dejar su identidad sin dato descriptivo o agregar dirección/contacto. Se descartan por ser insuficiente para identificar conceptualmente la escuela o por no estar aprobadas.

### Exigir identidad globalmente única para eventos

- **Decisión**: cada evento de asistencia tiene identidad única en el sistema y conserva esa identidad entre reintentos, incluidos eventos creados sin conexión en dispositivos distintos.
- **Motivo**: permitir distinguir eventos diferentes y reconocer reenvíos del mismo evento al sincronizar en el futuro.
- **Alternativas consideradas**: unicidad limitada al dispositivo o al alumno. Se descartan porque no garantizan identidad sin colisiones entre dispositivos.
- **Límite**: el mecanismo de generación y sincronización permanece fuera de 002.

### Relacionar asistencias con alumnos, no con pulseras

- **Decisión**: cada evento identifica al alumno y conserva identidad propia y momento de ocurrencia; la pulsera sirve para identificar al alumno, pero no define la identidad histórica de la asistencia.
- **Motivo**: reemplazar una pulsera no debe modificar ni fragmentar el historial del alumno.
- **Alternativas consideradas**: usar el identificador de pulsera como vínculo principal del evento. Se descarta porque una sustitución cambiaría esa referencia operativa.

### Conservar pulseras reemplazadas y exigir identificador NFC globalmente único

- **Decisión**: documentar identificador NFC único en el sistema, máximo una pulsera activa por alumno y conservar el registro de la pulsera reemplazada.
- **Motivo**: son reglas confirmadas por el usuario y permiten representar asignación actual e historial de reemplazos sin borrar información.
- **Alternativas consideradas**: sobrescribir la asignación previa. Se descarta porque elimina la trazabilidad aprobada.

### Limitar atributos personales a los aprobados

- **Decisión**: incluir nombre, grado y grupo para la información del alumno visible a la escuela; incluir nombre del tutor y su vínculo con el alumno en el detalle conceptual. No añadir datos de contacto.
- **Motivo**: responder al alcance solicitado y al principio de privacidad sin inventar una necesidad de contacto.
- **Alternativas consideradas**: incorporar teléfono, correo u otros datos de perfil. Se descartan por no estar aprobados.

## Revisión de tecnologías y dependencias

React Native, Expo y TypeScript siguen siendo la plataforma existente, pero no son tecnologías necesarias para generar el entregable documental. No se requieren bibliotecas, servicios, almacenamiento, configuración ni contratos de integración. No se realizó investigación técnica externa porque no hay una decisión de implementación pendiente dentro del alcance.

## Límites conocidos

Quedan fuera de decisión: reutilización de pulseras retiradas, transferencia de alumnos entre escuelas, política de deduplicación de eventos, autorización, retención legal, detalles de sincronización y escala operativa. Deben resolverse solo si una funcionalidad posterior los necesita.
