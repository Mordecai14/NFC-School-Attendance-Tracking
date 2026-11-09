# Tareas: Acceso escolar con Supabase

Alcance y criterios en [spec.md](spec.md). Esta lista sigue el avance, no impone fases ni aprobaciones por task. Se pueden combinar o ajustar pasos técnicos dentro del alcance; los checks se hacen al cerrar un incremento, según su riesgo.

## Completado

- [x] Instalar Supabase CLI 2.122.0 en desarrollo y fijarlo en el lockfile. (T001)
- [x] Crear `.env.example` con variables públicas y sin valores reales. (T002)
- [x] Ignorar `.env*`, salvo el ejemplo. (T003)
- [x] Inicializar `supabase/config.toml`. (T004)

## Por hacer

- [ ] Preparar la base local reproducible y desactivar signup público; documentar y comprobar la configuración equivalente en remoto sin deshabilitar login. (Antes T005–T008)
- [ ] Crear el schema, restricciones e inmutabilidad de eventos; cargar fixtures ficticios de dos escuelas después de las tablas y comprobar las reglas de integridad. (Antes T019–T026)
- [ ] Aplicar grants/RLS y probar acceso propio, cruzado, anónimo, sin asociación y tutor compartido. (Antes T027–T034)
- [ ] Implementar login, sesión persistente, guard de asociación escolar y logout; comprobar el recorrido en Android y sus errores. (Antes T009–T018)
- [ ] Revisar secrets, ejecutar los checks relevantes y registrar resultados o limitaciones; mantener datos reales bloqueados hasta definir retención. (Antes T035–T038)

**Dependencias reales**: tablas antes de fixtures y RLS; el login puede avanzar mientras se prepara la base. El guard de asociación requiere la política de lectura de la propia escuela. No habilitar acceso a datos escolares antes de validar RLS.

**Siguiente resultado demostrable**: entrar con una cuenta escolar de prueba, reabrir con la sesión conservada y cerrar sesión, sin acceso a datos de otra escuela. No requiere CRUD ni registro de asistencias.
