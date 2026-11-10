# Asistencia escolar con NFC

App Android con React Native, Expo y TypeScript. Lee pulseras NFC y consulta alumnos en Supabase mediante un acceso anónimo temporal de desarrollo. El responsable confirmó el recorrido con una pulsera real en Android; faltan validar los demás casos, el acceso escolar, el registro de asistencias y la sincronización.

## Desarrollo

```sh
pnpm install
pnpm exec expo run:android --device
```

La lectura física requiere un Android con NFC, SDK/JDK configurados y un build nativo; no se prueba con Expo Go. El [roadmap](docs/roadmap.md#01--lectura-nfc) resume lo comprobado y sus límites.

```sh
pnpm lint
pnpm exec tsc --noEmit
node --test tests/*.test.mjs
```

El último resultado registrado tiene un fallo de lint preexistente en `src/hooks/use-color-scheme.web.ts:11`; no implica que los checks actuales hayan sido ejecutados.

## Supabase en la nube

Se trabaja directamente con un proyecto hospedado, sin Docker ni base Supabase local. La app usa `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` del archivo `.env` existente mediante `app.config.js`. Reiniciar Expo después de cambiar esos valores. Solo se acepta una publishable key o la clave `anon` anterior; no agregar claves secret/service-role a la app ni al repositorio.

**Acceso temporal:** `development_student_by_bracelet` permite consultar nombre, grado y grupo sin sesión a quien conozca un UID. No hay aislamiento por escuela en esta consulta. Usar únicamente datos ficticios y eliminar esta función antes de usar datos reales o llevar la app a producción.

La CLI está vinculada al proyecto de desarrollo confirmado y aplica migraciones SQL versionadas. El schema remoto ya existía antes de la primera migración del repositorio; esta es incremental y no permite reconstruir por sí sola una base vacía. El setup, los ajustes de Auth y las validaciones pendientes están en el [roadmap](docs/roadmap.md#03--supabase-y-acceso-escolar). No ejecutar `supabase db reset` contra la nube ni cargar datos personales reales hasta definir retención.

## Dónde mirar

- [Roadmap](docs/roadmap.md): estado y siguiente entregable.
- [Producto](docs/product.md): propósito y límites del MVP.
- [Arquitectura](docs/architecture.md): qué existe y qué está previsto.
- [Decisión de Supabase](docs/decisions/supabase-auth-and-school-isolation.md): acceso y aislamiento propuestos.

El roadmap concentra el avance y los próximos resultados; no se crean specs, planes ni archivos de tareas por rutina. Las instrucciones de colaboración están en [AGENTS.md](AGENTS.md).
