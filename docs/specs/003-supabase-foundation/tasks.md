# Tareas: Acceso escolar con Supabase

Alcance y criterios en [spec.md](spec.md). Esta lista sigue el avance, no impone fases ni aprobaciones por task. Se pueden combinar o ajustar pasos técnicos dentro del alcance; los checks se hacen al cerrar un incremento, según su riesgo.

## Completado

- [x] Instalar Supabase CLI 2.122.0 en desarrollo y fijarlo en el lockfile. (T001)
- [x] Crear `.env.example` con variables públicas y sin valores reales. (T002)
- [x] Ignorar `.env*`, salvo el ejemplo. (T003)
- [x] Preparar `supabase/config.toml` como identificador del workspace de la CLI, sin configuración de stack local. No implica que exista un proyecto remoto vinculado. (T004, adaptada al entorno en la nube)

## Por hacer

- [ ] Seleccionar o crear el proyecto de desarrollo en Supabase Cloud, vincular la CLI, configurar URL/publishable key en `.env.local` y desactivar signup en el Dashboard; comprobar rechazo de signup y login administrativo existente permitido. Sin Docker. (Antes T005–T008, adaptadas a la nube)
- [ ] Crear y aplicar las migraciones del schema, restricciones e inmutabilidad de eventos; con sus protecciones activas, cargar datos ficticios de dos escuelas y comprobar las reglas de integridad en el proyecto de desarrollo. (Antes T019–T026)
- [ ] Aplicar grants/RLS y probar acceso propio, cruzado, anónimo, sin asociación y tutor compartido. (Antes T027–T034)
- [ ] Implementar login, sesión persistente, guard de asociación escolar y logout; comprobar el recorrido en Android y sus errores. (Antes T009–T018)
- [ ] Revisar secrets, ejecutar los checks relevantes y registrar resultados o limitaciones; mantener datos reales bloqueados hasta definir retención. (Antes T035–T038)

**Dependencias reales**: tablas antes de RLS y datos de prueba. Publicar las tablas con grants mínimos y RLS desde su creación, sin dejar datos expuestos entre pasos; después completar/probar las políticas. El login puede avanzar mientras se prepara la base. El guard de asociación requiere la política de lectura de la propia escuela. No habilitar consultas de la app antes de validar RLS.

**Pendiente externo**: todavía no hay un proyecto de Supabase Cloud seleccionado ni configuración remota comprobada en esta tarea. La adaptación del repositorio no completa ese setup. No ejecutar resets contra la nube.

**Siguiente resultado demostrable**: entrar con una cuenta escolar de prueba, reabrir con la sesión conservada y cerrar sesión, sin acceso a datos de otra escuela. No requiere CRUD ni registro de asistencias.
