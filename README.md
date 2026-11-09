# Asistencia escolar con NFC

App Android con React Native, Expo y TypeScript. Hoy lee pulseras NFC; el acceso escolar con Supabase está en desarrollo. El registro de asistencias y la sincronización todavía no están implementados.

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

Se trabaja directamente con un proyecto hospedado, sin Docker ni base Supabase local. Crear o seleccionar un proyecto de desarrollo con datos ficticios; copiar su URL y publishable key del Dashboard a `.env.local` usando `.env.example` como referencia. No agregar claves secret/service-role a la app ni al repositorio.

La CLI se conserva para aplicar migraciones SQL versionadas al proyecto vinculado. El setup, los ajustes de Auth y las validaciones pendientes están en el [roadmap](docs/roadmap.md#03--acceso-escolar-y-datos-con-supabase). No ejecutar `supabase db reset` contra la nube ni cargar datos personales reales hasta definir retención. La creación/configuración del proyecto remoto sigue pendiente, no está hecha por actualizar estos archivos.

## Dónde mirar

- [Roadmap](docs/roadmap.md): estado y siguiente entregable.
- [Producto](docs/product.md): propósito y límites del MVP.
- [Arquitectura](docs/architecture.md): qué existe y qué está previsto.
- [Decisión de Supabase](docs/decisions/supabase-auth-and-school-isolation.md): acceso y aislamiento propuestos.

El roadmap concentra el avance y los próximos resultados; no se crean specs, planes ni archivos de tareas por rutina. Las instrucciones de colaboración están en [AGENTS.md](AGENTS.md).
