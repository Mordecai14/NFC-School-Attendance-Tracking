# Arquitectura

## Estado actual

El proyecto actualmente es una aplicación React Native construida con Expo y TypeScript.

Todavía no se ha implementado integración con backend.

La lectura NFC en Android está implementada y validada con dos pulseras de muestra. La anomalía observada durante exposición sostenida y los límites de esa validación están documentados en [el registro de validación de 001](specs/001-read-nfc-wristbands/validation.md).

Todavía no se ha implementado una capa de persistencia offline.

## Dirección planeada

La arquitectura prevista actualmente para el MVP incluye:

- React Native con Expo;
- lectura NFC en Android;
- persistencia local para asistencias offline;
- sincronización con Supabase.

Estos componentes deben incorporarse progresivamente mediante features previamente especificadas y aprobadas.

## Prioridades arquitectónicas

1. Confiabilidad del registro de asistencias.
2. Capacidad de funcionamiento offline.
3. Arquitectura simple.
4. Límites claros entre dominios y responsabilidades.
5. Lógica de negocio fácil de probar.

## Restricciones

No introducir servicios backend ni infraestructura de forma prematura.

Las decisiones que afecten materialmente la arquitectura del sistema deben documentarse mediante ADRs dentro de `docs/decisions/`.
