# Arquitectura

## Estado actual

El proyecto actualmente es una aplicación React Native construida con Expo y TypeScript.

Todavía no se ha implementado integración con backend.

Todavía no se ha implementado integración NFC.

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
