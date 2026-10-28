# Producto

## Propósito

Aplicación móvil para registrar la asistencia de alumnos en una escuela mediante pulseras NFC.

La primera aplicación está destinada al personal de la escuela y será utilizada en un dispositivo Android capaz de leer etiquetas NFC.

## Flujo principal

1. El personal de la escuela escanea una pulsera NFC.
2. La aplicación identifica la pulsera.
3. Se muestra el alumno asociado.
4. El personal registra una entrada o salida.
5. La aplicación proporciona confirmación visual, sonora y háptica.
6. El evento se almacena.
7. Si el dispositivo está offline, el evento deberá sincronizarse posteriormente.

## Alcance del MVP

El MVP debe permitir:

- registrar alumnos;
- asignar una pulsera NFC a un alumno;
- leer pulseras NFC desde Android;
- registrar eventos de entrada;
- registrar eventos de salida;
- evitar escaneos duplicados accidentales;
- operar sin conexión a Internet durante la jornada escolar;
- sincronizar automáticamente asistencias pendientes cuando vuelva la conexión.

## Modelo de dominio

Una pulsera pertenece a un alumno.

Un alumno no es un usuario autenticado de la aplicación.

La relación conceptual es:

Pulsera NFC  
→ Alumno  
→ Padre, madre o tutor  
→ Usuario autenticado

## Restricciones importantes del producto

- Los eventos de asistencia son registros históricos y no deben sobrescribirse.
- El funcionamiento offline es un requisito central.
- La pérdida temporal de conexión no debe impedir registrar asistencias.
- La prevención de duplicados no debe depender exclusivamente del cliente.
- La aplicación utilizada por la escuela tiene prioridad sobre la aplicación para tutores.

## Fuera del alcance inicial del MVP

- panel administrativo complejo;
- API backend propia;
- microservicios;
- Redis;
- Kubernetes;
- infraestructura compleja;
- implementación de la aplicación para tutores.
