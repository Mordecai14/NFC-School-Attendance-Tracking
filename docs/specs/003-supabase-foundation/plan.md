# Plan técnico: Base de Supabase y acceso escolar

**Rama**: `docs/003-supabase-foundation` | **Fecha**: 2026-10-30 | **Especificación**: [spec.md](spec.md)

**Entrada**: `docs/specs/003-supabase-foundation/spec.md`

## Resumen

Agregar una base PostgreSQL administrada por Supabase, login con correo y contraseña para una cuenta compartida por escuela y aislamiento de datos mediante políticas de Row Level Security (RLS). El esquema se mantendrá mediante migraciones SQL versionadas; las cuentas se crearán manualmente fuera de la app. La aplicación no incluirá alta pública, administración de alumnos ni registro de asistencias en esta fase.

## Contexto técnico

**Lenguaje/versiones**: TypeScript 6.0, React Native 0.88, Expo SDK 58 y SQL de PostgreSQL.

**Dependencias principales**:

- `@supabase/supabase-js` para Auth y acceso a datos desde la aplicación;
- `expo-secure-store` en versión compatible con SDK 58 para conservar de forma cifrada la sesión nativa;
- `react-native-url-polyfill` para el entorno React Native;
- Supabase CLI 2.x como dependencia de desarrollo para migraciones y pruebas locales.

Las dependencias móviles se instalarán con `pnpm exec expo install` cuando corresponda; el CLI quedará fijado en `pnpm-lock.yaml`.

**Almacenamiento**: Supabase PostgreSQL. El esquema, las restricciones, permisos y políticas se definirán en migraciones SQL bajo `supabase/migrations/`.

**Pruebas**: pgTAP mediante `supabase test db` para restricciones y RLS; `node --test` para lógica TypeScript testeable siguiendo el patrón existente; ESLint, `tsc --noEmit`, Expo dependency checks y una comprobación de login en Android.

**Plataforma objetivo**: Android. Se conserva la compilación Expo existente; autenticación web no es criterio de aceptación de 003.

**Tipo de proyecto**: Aplicación móvil Expo con acceso directo y autenticado a Supabase; no se agrega una API propia.

**Rendimiento**: No hay umbrales de latencia o concurrencia aprobados para el MVP. No se establecen SLO de disponibilidad en esta fase.

**Restricciones**:

- exactamente una cuenta compartida por escuela, creada manualmente; sin registro público ni cuentas individuales;
- los datos de alumnos, pulseras, relaciones y asistencias quedan aislados por escuela en la base; la identidad global del tutor se comparte según FR-015 y solo se expone a través de vínculos con alumnos propios;
- el cliente solo recibe URL y publishable key; ninguna clave `service_role`/secret se incluye en la app;
- eventos de asistencia son inmutables y conservan identidad única;
- usar exclusivamente datos ficticios hasta que se apruebe la política de conservación y eliminación;
- la captura offline, sincronización, pantallas de administración y operaciones de asistencia quedan fuera de 003.

**Escala/alcance**: MVP escolar, sin número de escuelas, alumnos ni volumen transaccional aprobado. Registrar la necesidad de dimensionamiento antes de producción, sin anticipar optimización o infraestructura adicional.

## Verificación de la constitución

### Gate antes de investigación

- **Especificación y aceptación**: Cumple. La spec define login, sesión, cuenta por escuela, aislamiento, entidades e invariantes.
- **Simplicidad y alcance**: Cumple. Un cliente Supabase y una base PostgreSQL; no se agrega API propia ni panel administrativo.
- **Tipos y verificación**: Cumple. TypeScript estricto; se planifican lint, validación de tipos, pruebas de base y verificación Android.
- **Asistencias confiables sin conexión**: Cumple dentro del límite de 003. No se captura asistencia offline; el esquema preserva identidad y no permite mutar o eliminar eventos desde el cliente.
- **Seguridad y privacidad**: Cumple. RLS por escuela, privilegios mínimos y pruebas negativas con dos escuelas y datos sintéticos.

### Gate después del diseño

Cumple. La cuenta se vincula a una escuela mediante una relación única en la base; las políticas aplican también a tablas de relación y a tutores compartidos. No se almacena información real mientras la retención siga pendiente. No se identifican violaciones que requieran excepción.

## Diseño de implementación

1. Inicializar Supabase CLI y un entorno local reproducible; mantener toda modificación de esquema en migraciones.
2. Crear las tablas y restricciones derivadas del modelo 002; habilitar RLS y grants explícitos en cada tabla expuesta.
3. Probar accesos permitidos y denegados, incluyendo un tutor vinculado a alumnos de dos escuelas y ausencia de visibilidad de sus relaciones ajenas.
4. Crear un único cliente Supabase. Restaurar la sesión antes de mostrar rutas protegidas; usar SecureStore en Android y configurar el refresco de sesión según el ciclo de vida de la app.
5. Agregar pantalla de login, protección de rutas y acción de cierre de sesión. No agregar alta pública ni gestión CRUD de alumnos/tutores/pulseras.
6. Desactivar el registro público mediante `[auth].enable_signup = false` en `supabase/config.toml` y replicar esa configuración en el proyecto remoto, manteniendo habilitado el proveedor de correo para login. Configurar cuentas de prueba y su asociación escolar en local, sin exponer claves privilegiadas.

La interfaz autenticada consulta únicamente datos de su escuela. En 003, “guardar y consultar” significa que el esquema persiste las entidades y permite consultas; la carga inicial se limita a migraciones, fixtures sintéticos y aprovisionamiento administrativo confiable. El cliente recibe solo permisos de lectura; los flujos de alta/cambio desde la app se definirán en sus features correspondientes. No se conceden permisos genéricos de borrado. El evento de asistencia no se actualiza ni elimina.

## Estructura del proyecto

### Documentación de esta funcionalidad

```text
docs/specs/003-supabase-foundation/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/
    ├── login-session.md
    └── school-data-access.md
```

Decisión arquitectónica relacionada: `docs/decisions/supabase-auth-and-school-isolation.md`.

### Código fuente previsto

```text
src/
├── app/
│   ├── _layout.tsx          # restauración de sesión y protección de rutas
│   ├── index.tsx            # lectura NFC existente, protegida
│   └── login.tsx            # login, estados de carga y error
├── auth/
│   └── AuthProvider.tsx     # estado de sesión y acciones de autenticación
└── lib/
    └── supabase.ts          # cliente y almacenamiento seguro de sesión

supabase/
├── config.toml
├── migrations/              # esquema, constraints, grants y RLS
├── seed.sql                 # solo fixtures sintéticos locales
└── tests/                   # pruebas pgTAP de integridad y aislamiento

tests/                       # node:test existente y nuevas pruebas puras si hacen falta
.env.example                # nombres de variables públicas requeridas
```

No se crea backend independiente ni pantalla de gestión de datos. El contrato de acceso queda documentado en [school-data-access.md](contracts/school-data-access.md).

## Riesgos y decisiones

- **Cuenta sin escuela asociada**: el usuario Auth puede crearse antes de la fila escolar. Hasta asociarse a una escuela, RLS no debe permitirle leer datos.
- **Tutor compartido entre escuelas**: se conserva una entidad Tutor global; la visibilidad de la entidad se deriva de vínculos con alumnos de la escuela actual. Las relaciones de otras escuelas no deben ser consultables. La escritura/edición de tutores compartidos queda en el entorno administrativo confiable, no en el cliente 003.
- **Clave privilegiada**: `service_role` omite RLS; se reserva para entornos administrativos protegidos y nunca se incorpora a variables `EXPO_PUBLIC_*`.
- **Retención legal pendiente**: no cargar datos reales hasta aprobar el plazo y la regla de eliminación.
- **Sesiones persistentes**: el cierre de sesión debe borrar la sesión local; verificar restauración y vencimiento en un dispositivo Android real.
- **Sin SLO ni volumen aprobado**: las métricas de escala, disponibilidad y monitoreo quedan para una revisión operativa previa a producción.

## Complejidad

No se agrega un proyecto backend ni una abstracción de repositorio. RLS, migraciones y pruebas pgTAP son complejidad necesaria para cumplir aislamiento y reproducibilidad, no opciones intercambiables con filtros de UI.
