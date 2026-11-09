# Roadmap

Dirección del MVP, no una secuencia rígida de fases. Cada incremento debe dejar un resultado observable; el orden puede ajustarse sin perder los requisitos de privacidad y confiabilidad.

## Estado y siguiente resultado

| Paso | Resultado | Estado |
|---|---|---|
| [001 — Lectura NFC](specs/001-read-nfc-wristbands/spec.md) | Leer y distinguir dos pulseras reales en Android. | Completado con [límites conocidos](specs/001-read-nfc-wristbands/validation.md). |
| [002 — Modelo de datos](specs/002-data-model/spec.md) | Entidades, relaciones e historial definidos. | Completado; solo documental. |
| [003 — Acceso escolar](specs/003-supabase-foundation/spec.md) | Login, sesión y base con aislamiento entre escuelas. | En curso; solo setup completado. |
| 004 — Identificación | Escanear una pulsera conocida y mostrar su alumno. | Pendiente. |
| 005 — Entrada y salida | Registrar eventos históricos sin sobrescribirlos. | Pendiente; no entregar captura dependiente de Internet. |
| 006 — Persistencia offline | Guardar asistencias localmente durante cortes de conexión. | Pendiente; desarrollar junto con la captura si hace falta para cumplir el requisito offline. |
| 007 — Sincronización | Enviar pendientes al recuperar conexión sin perder eventos. | Pendiente. |
| 008 — Duplicados y conflictos | Evitar duplicados por lecturas, reintentos y sincronización repetida. | Pendiente. |
| 009 — Jornada de prueba | Probar múltiples alumnos, offline, reconexión, errores y reapertura. | Pendiente. |

**Ahora**: completar 003 directamente con Supabase en la nube, sin Docker y con cuentas y datos ficticios. El detalle técnico está en su spec y el avance en [tasks.md](specs/003-supabase-foundation/tasks.md).

**Antes de datos reales**: definir retención y eliminación. La carga inicial es administrativa; los flujos de alta/asignación desde la app necesitan su alcance antes de implementarse.

## Más adelante

Aplicación para tutores, notificaciones, administración avanzada de alumnos/dispositivos, panel administrativo, reportes y métricas. No anticipar esta infraestructura en el MVP.
