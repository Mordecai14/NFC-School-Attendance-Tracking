# Arquitectura

## Estado actual

El proyecto actualmente es una aplicación React Native construida con Expo y TypeScript.

La CLI de Supabase está instalada y `supabase/config.toml` conserva solo el identificador del workspace. El desarrollo usará directamente un proyecto de Supabase en la nube, sin Docker ni stack local. Todavía no se ha validado un proyecto remoto ni hay integración de la app con backend, schema escolar, RLS o login; el avance está en el [roadmap](roadmap.md).

La lectura NFC en Android está implementada y validada con dos pulseras de muestra. El [roadmap](roadmap.md) resume la anomalía observada durante exposición sostenida y los límites de esa validación.

Todavía no se ha implementado una capa de persistencia offline.

## Dirección planeada

La arquitectura prevista actualmente para el MVP incluye:

- React Native con Expo;
- lectura NFC en Android;
- persistencia local para asistencias offline;
- sincronización con Supabase hospedado.

Estos componentes se incorporan progresivamente en incrementos observables dentro del alcance acordado. El [modelo conceptual resumido](roadmap.md#02--modelo-conceptual) y la [decisión de Supabase](decisions/supabase-auth-and-school-isolation.md) son referencias de diseño; no describen capacidades ya implementadas.

## Prioridades arquitectónicas

1. Confiabilidad del registro de asistencias.
2. Capacidad de funcionamiento offline.
3. Arquitectura simple.
4. Límites claros entre dominios y responsabilidades.
5. Lógica de negocio fácil de probar.

## Restricciones

No introducir servicios backend ni infraestructura de forma prematura.

La base remota de desarrollo usa únicamente datos ficticios. La elección de Supabase en la nube no reemplaza la persistencia local futura de asistencias en el dispositivo; son responsabilidades distintas.

Las decisiones que afecten materialmente la arquitectura del sistema deben documentarse mediante ADRs dentro de `docs/decisions/`.
