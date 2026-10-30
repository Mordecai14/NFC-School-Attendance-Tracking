# Contrato observable: pantalla de lectura

El único contrato externo de esta feature es la interfaz que ve el operador
en un dispositivo Android. No se exponen APIs ni se envían identificadores.

| Situación | Pantalla esperada |
|-----------|-------------------|
| Lector listo sin pulsera | Indicación visible de espera. |
| Lectura exitosa | Detección e identificador del intento actual; historial etiquetado de al menos cinco lecturas exitosas recientes cuando existen. |
| Otra pulsera o reescaneo tras retirarla | Nuevo resultado actual y una entrada nueva en el historial; los identificadores de pulseras distintas deben poder compararse. |
| Pulsera sostenida junto al lector | No crea entradas adicionales en el historial por el mismo acercamiento. |
| Fallo notificado o detección sin identificador | Error visible, sin identificador del intento actual; historial anterior visible y distinguible. Se permite reintentar. |
| Acercamiento sin ninguna detección | No hay nuevo resultado ni entrada en el historial; la aplicación no puede inferir ese acercamiento. El operador registra la falta de detección en la prueba. |
| NFC no disponible | Indicación de que no puede escanear; nunca señal de espera engañosa. |
| NFC vuelve a estar disponible | Vuelve a indicar espera y acepta una pulsera sin cerrar la aplicación. |
| Cierre y nueva apertura | Historial de sesión anterior ausente; la misma pulsera en el mismo dispositivo vuelve a mostrar el mismo identificador al leerla. |

La pantalla reemplaza las pantallas de demostración de Expo. No incluye
alumnos, asistencias, asignaciones, autenticación ni diseño visual final.
