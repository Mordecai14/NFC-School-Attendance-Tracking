# Decisión: Supabase Auth y aislamiento de datos por escuela

**Estado**: Propuesta para implementar en 003 | **Fecha**: 2026-10-30

## Contexto

La aplicación necesita almacenar el modelo conceptual escolar y permitir acceso a personal mediante una única cuenta compartida por escuela. Los datos personales no deben cruzar escuelas. La aplicación es Expo/React Native y no debe incorporar una API backend o infraestructura compleja sin necesidad aprobada.

## Decisión propuesta

- Usar Supabase Auth con correo/contraseña; crear cuentas manualmente fuera de la app y no ofrecer signup público.
- Vincular cada cuenta a una escuela mediante una FK única y requerida desde `schools.auth_user_id` a `auth.users.id`.
- Usar migraciones SQL versionadas como fuente de verdad del esquema.
- Habilitar grants mínimos y RLS en todas las tablas expuestas. La escuela se deriva de la identidad autenticada en la base, nunca de un filtro de interfaz o `user_metadata`.
- Guardar sesión nativa con Expo SecureStore; mantener la clave service-role fuera de la aplicación.
- Mantener tutores como entidades globales compartibles, con sus vínculos alumno-tutor filtrados por RLS según la escuela del alumno. La app no modifica esas entidades compartidas en 003.

## Consecuencias

- Las pruebas deben demostrar lectura permitida y denegada entre al menos dos escuelas, incluyendo un tutor compartido.
- Crear una cuenta requiere además asociarla a una escuela; un usuario sin vínculo no accede a datos.
- Los datos y el esquema se reproducen desde migraciones y fixtures sintéticos locales.
- Las escrituras de asistencia desde la app, gestión de datos escolares, alta pública y recuperación de contraseña quedan para features futuras o requisitos aprobados.
- Antes de usar datos reales debe definirse la política de retención/eliminación.

## Alternativas descartadas

- RLS sustituida por filtros de cliente: no protege frente a consultas manipuladas.
- Clave service-role en la app: omite RLS y expondría privilegios administrativos.
- Identidad escolar en `user_metadata`: el propio usuario puede cambiarla.
- Backend propio o microservicios: agregan complejidad sin requisito de producto.
