# Guía de validación local: Base de Supabase y acceso escolar

Usar exclusivamente cuentas y datos sintéticos. No conectarse a un proyecto con datos reales mientras la política de retención siga pendiente.

## Requisitos previos

- Node.js y pnpm según el entorno del repositorio;
- Docker en ejecución para el stack local de Supabase;
- Android SDK y un dispositivo/emulador para verificar el login;
- variables locales `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

## Preparar y validar la base

```sh
pnpm install
pnpm exec supabase start
pnpm exec supabase db reset
pnpm exec supabase test db
```

`db reset` debe ejecutarse solo contra el entorno local: reconstruye la base y vuelve a aplicar migraciones y fixtures. No agregar `--linked` ni apuntar a un proyecto remoto para esta guía.

La suite pgTAP debe cubrir:

- restricciones de UID NFC, pulsera activa, relaciones y tipo/identidad de eventos;
- lectura de datos de la propia escuela y denegación para escuela distinta y rol no autenticado;
- tutor vinculado a alumnos de dos escuelas: cada cuenta ve el tutor por su propia relación, pero no los otros alumnos ni vínculos;
- ausencia de actualización/eliminación de eventos e imposibilidad de mutar tutores compartidos desde la app.

## Verificar el login en Android

1. Obtener URL y publishable key del entorno local con `pnpm exec supabase status` y copiarlas a `.env.local` (ignorado por Git).
2. Crear desde el Dashboard local una cuenta de prueba con correo y contraseña; no usar signup desde la app.
3. Asociar la cuenta a una escuela sintética desde el SQL Editor local sustituyendo el UUID por el ID de Auth creado:

   ```sql
   insert into public.schools (name, auth_user_id)
   values ('Escuela de prueba A', '<auth-user-uuid>');
   ```

   Repetir para una segunda escuela y preparar alumnos y un tutor compartido con fixtures sintéticos. Este SQL se ejecuta solo en el entorno local y nunca con una clave privilegiada empaquetada en la app.
4. Ejecutar `pnpm exec expo run:android --device` y comprobar login válido, credenciales incorrectas, restauración de sesión, logout y aislamiento de lecturas.
5. Confirmar que una cuenta Auth sin asociación escolar queda sin datos y que cerrar sesión vuelve a `/login`.

## Validación del proyecto

```sh
pnpm lint
pnpm exec tsc --noEmit
node --test tests/*.test.mjs
pnpm exec expo install --check
```

Registrar por separado los fallos preexistentes de lint/tipos si los hubiera; no corregirlos como parte de esta feature sin alcance aprobado. No se valida SLO de producción ni cumplimiento de retención legal en este quickstart.
