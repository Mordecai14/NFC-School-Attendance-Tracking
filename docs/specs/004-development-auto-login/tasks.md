# Seguimiento

- [x] Implementar autenticación y comprobación de acceso escolar, sesión en memoria, reintentos y deduplicación.
- [x] Conectar el arranque a la alerta, sin pantalla nueva ni cambios a NFC.
- [x] Proteger configuración de producción y agregar tests enfocados.
- [ ] Activar las variables de `.env.local`: la edición fue bloqueada por los permisos del entorno; debe completarla el responsable.
- [ ] Comprobar visualmente éxito y error en Android.

## Validación

- `node --test tests/*.test.mjs`: 16/16 tests pasaron.
- `npx tsc --noEmit`: pasó.
- El servicio nuevo se ejecutó contra el proyecto de desarrollo confirmado: autenticación real, acceso a una escuela y reutilización de sesión verificados. Se cerró la sesión de prueba mediante Auth; no se guardaron tokens ni contraseñas en el repositorio.
- `git diff --check`: pasó.
- `npm run lint`: falla únicamente en `src/hooks/use-color-scheme.web.ts:11`, por `react-hooks/set-state-in-effect`, ya existente y fuera de alcance.
- No se agregaron dependencias. El intento de instalar el SDK falló sin modificar `package.json` ni el lockfile; se conservó el patrón HTTP existente de la app.
