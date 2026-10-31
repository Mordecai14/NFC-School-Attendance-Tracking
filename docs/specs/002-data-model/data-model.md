# Modelo de datos conceptual — MVP

Este documento define el dominio acordado para 002. No es un esquema de base de datos ni prescribe tipos, tablas o almacenamiento.

## Entidades

| Entidad | Identidad y datos aprobados | Reglas y estado |
|---|---|---|
| Escuela | Nombre como identificador conceptual mínimo. No se fijan otros atributos en esta funcionalidad. | Una escuela puede tener varios alumnos. |
| Alumno | Identidad conceptual; nombre, grado y grupo como datos visibles para la escuela. | Pertenece a una sola escuela en el MVP. No es usuario autenticado. Puede tener cero o más tutores y cero o una pulsera activa. |
| Pulsera | Identificador NFC único en todo el sistema. | Se asigna a un alumno. Puede estar activa o reemplazada. Un alumno tiene como máximo una activa. Se conserva el registro anterior al reemplazarla por daño o extravío. |
| Tutor | Identidad conceptual y nombre; se registra el vínculo con el alumno. | Relación muchos a muchos con alumnos. No implica una cuenta autenticada ni acceso a una aplicación. |
| Evento de asistencia | Identidad única en todo el sistema, alumno, tipo (entrada o salida) y momento en que ocurrió. | Es histórico e inmutable. Su identidad y hora no cambian durante reintentos de envío sin conexión, incluso si participan dispositivos distintos. |

## Relaciones y cardinalidades

```text
Escuela 1 ─── 0..* Alumno
Alumno  * ─── *     Tutor       (muchos a muchos)
Alumno  1 ─── 0..1 Pulsera activa
Alumno  1 ─── 0..* Pulseras históricas
Alumno  1 ─── 0..* Eventos de asistencia
```

La pulsera reemplazada conserva su registro histórico y deja de ser la activa. La reutilización posterior de una pulsera retirada no está definida. El evento se asocia al alumno, no a la pulsera, para preservar el historial a través de reemplazos.

## Invariantes

1. Un alumno pertenece a una sola escuela durante el alcance del MVP.
2. Un alumno tiene como máximo una pulsera activa en cualquier momento.
3. Cada identificador NFC de pulsera es único en todo el sistema, incluidas pulseras históricas.
4. Reemplazar una pulsera conserva el registro anterior y no altera eventos de asistencia.
5. Un evento representa una entrada o una salida, tiene identidad única en todo el sistema, conserva esa identidad y el momento de ocurrencia durante los reintentos, y no se sobrescribe ni descarta silenciosamente.
6. Un tutor puede estar relacionado con varios alumnos y un alumno con varios tutores. Se permite representar temporalmente un alumno sin tutor o sin pulsera activa.
7. El perfil contempla únicamente los datos personales aprobados: nombre, grado y grupo del alumno; nombre del tutor y vínculo con el alumno. No se incluyen datos de contacto.
8. El detalle personal del alumno y del tutor solo es visible para personal autorizado de la escuela del alumno; no se expone a personas no autorizadas ni a otras escuelas. Esta regla es conceptual y no implementa autorización en 002.

## Ejemplos de validación

- **Tutor compartido**: dos alumnos de la misma escuela pueden estar relacionados con el mismo tutor; cada uno puede tener además otro tutor.
- **Reemplazo**: el alumno conserva la pulsera anterior como histórica y recibe una nueva pulsera activa con identificador NFC único. Los eventos existentes siguen asociados al alumno.
- **Reintento sin conexión**: un evento creado sin conexión mantiene la misma identidad y momento de ocurrencia al reenviarse. Una segunda entrada real es otro evento; la política para decidir si fue accidentalmente duplicada pertenece a otra funcionalidad.
- **Eventos desde dispositivos distintos**: dos eventos creados sin conexión en dispositivos distintos conservan identidades globalmente únicas; un reintento del mismo evento conserva la identidad original.
- **Privacidad**: personal autorizado de la escuela puede consultar el detalle del alumno y del tutor vinculado; una persona no autorizada o personal de otra escuela no debe recibir esos datos.

## No definido en 002

Reutilización de pulseras retiradas, transferencias entre escuelas, roles de tutores, campos de contacto, retención legal, mecanismo y formato de generación del identificador de evento, almacenamiento físico, protocolo de sincronización, política de deduplicación y escala operativa. La regla conceptual de visibilidad no implementa controles de autorización.
