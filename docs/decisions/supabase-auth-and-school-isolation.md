# Decisión: Supabase Auth y aislamiento de datos por escuela

**Estado**: Propuesta para implementar en 003 | **Fecha**: 2026-10-30

**Actualización 2026-11-08**: el responsable eligió desarrollar directamente con Supabase en la nube, sin Docker ni stack local. Esta decisión de entorno está aprobada; el schema, RLS y login siguen pendientes de implementación.

**Estado posterior:** el proyecto confirmado ya tenía un schema con `profiles.school_id` vinculado a `auth.users`, en lugar de la FK desde `schools` propuesta abajo. Una migración incremental restringe los cambios del propio perfil y corrige restricciones de pulseras; el conjunto de políticas y el modelo completo siguen pendientes de revisión. La migración no es una referencia inicial reproducible del schema existente.

**Excepción temporal aprobada:** para desarrollar la lectura NFC sin login, `development_student_by_bracelet` permite consultas anónimas por UID sin aislamiento escolar. Solo se permite con datos ficticios y debe eliminarse antes de producción o datos reales. La decisión de acceso autenticado permanece como objetivo para esa etapa.

## Contexto

La aplicación necesita almacenar el modelo conceptual escolar y permitir acceso a personal mediante una única cuenta compartida por escuela. Los datos personales no deben cruzar escuelas. La aplicación es Expo/React Native y no debe incorporar una API backend o infraestructura compleja sin necesidad aprobada.

## Decisión propuesta

- Usar Supabase Auth con correo/contraseña; crear cuentas manualmente fuera de la app y no ofrecer signup público.
- Vincular cada cuenta a una escuela mediante una FK única y requerida desde `schools.auth_user_id` a `auth.users.id`.
- Usar migraciones SQL versionadas como fuente de verdad del esquema.
- Usar un proyecto hospedado con datos ficticios para desarrollo. La CLI vincula el destino y aplica migraciones; Auth se configura en el Dashboard. `config.toml` no modifica Auth remoto.
- Habilitar grants mínimos y RLS en todas las tablas expuestas. La escuela se deriva de la identidad autenticada en la base, nunca de un filtro de interfaz o `user_metadata`.
- Guardar sesión nativa con Expo SecureStore; mantener la clave service-role fuera de la aplicación.
- Mantener tutores como entidades globales compartibles, con sus vínculos alumno-tutor filtrados por RLS según la escuela del alumno. La app no modifica esas entidades compartidas en 003.

## Consecuencias

- Las pruebas deben demostrar lectura permitida y denegada entre al menos dos escuelas, incluyendo un tutor compartido.
- Crear una cuenta requiere además asociarla a una escuela; un usuario sin vínculo no accede a datos.
- El schema se mantiene en migraciones versionadas; los datos sintéticos se cargan de forma controlada después del schema y sus protecciones. No hay reconstrucción rutinaria de la base remota mediante reset.
- Los tests de integridad y RLS se ejecutan contra el proyecto de desarrollo, con datos ficticios y limpieza controlada. No se exige un runner basado en Docker.
- Las escrituras de asistencia desde la app, gestión de datos escolares, alta pública y recuperación de contraseña quedan para features futuras o requisitos aprobados.
- Antes de usar datos reales debe definirse la política de retención/eliminación.

## Alternativas descartadas

- RLS sustituida por filtros de cliente: no protege frente a consultas manipuladas.
- Clave service-role en la app: omite RLS y expondría privilegios administrativos.
- Identidad escolar en `user_metadata`: el propio usuario puede cambiarla.
- Backend propio o microservicios: agregan complejidad sin requisito de producto.
- Stack Supabase local con Docker: descartado por preferencia del responsable para reducir setup y mantenimiento. Se acepta depender de Internet para desarrollar y verificar el backend; la futura captura offline sigue siendo requisito de producto.
