# Datos transitorios: prueba de lectura NFC

Esta feature no crea entidades de alumno, pulsera asignada ni asistencia.
No tiene base de datos ni intercambio de datos con servicios externos.

## Pulsera de prueba

Elemento físico provisto por la escuela. Para esta prueba solo interesa si
entrega un identificador legible. La comparación entre pulseras A y B se hace
durante la validación manual; no se almacena una asignación ni se presupone
que toda pulsera NFC tiene un UID fijo.

## Intento de lectura

Resultado actual transitorio: `identificador` no vacío en caso de éxito, o
`error` sin identificador en caso de fallo. El identificador se muestra tal
como lo entrega la lectura, manteniendo un formato visual consistente para
compararlo en el mismo dispositivo. Una pulsera sostenida cerca del lector
es un solo intento; retirarla y volverla a acercar habilita otro.

Solo un fallo notificado o una detección sin identificador produce un resultado
de error. Un acercamiento que no genera evento no crea un resultado: su falta
de detección se documenta en la prueba física, no se infiere mediante un plazo.

## Historial visible

Secuencia en memoria de por lo menos las cinco últimas lecturas exitosas de
la sesión activa. Incluye lecturas repetidas de la misma pulsera si se hicieron
con acercamientos distintos. Los errores no se agregan y no eliminan el
historial. Al cerrar la aplicación, no persisten ni los identificadores ni la
lista.

## Estados observables

| Estado | Resultado actual | Historial |
|--------|------------------|-----------|
| NFC no disponible | Indica imposibilidad de lectura; no finge espera | Puede conservarse durante la sesión |
| Esperando pulsera | Indica que puede leerse una pulsera | Lecturas exitosas previas, si existen |
| Pulsera detectada | Identificador del último intento exitoso | Incluye la nueva lectura |
| Error de lectura | Mensaje de error, sin identificador actual | Sigue visible, marcado como anterior |

Al volver a estar disponible NFC, la pantalla pasa a espera sin cerrar la
aplicación. No hay transición que genere una asistencia o guarde datos.
