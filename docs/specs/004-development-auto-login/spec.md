# Login escolar automático de desarrollo

Al arrancar la app en desarrollo, autenticar la cuenta escolar configurada localmente y mostrar una alerta de éxito únicamente después de comprobar su acceso escolar. No crear pantalla de login ni solicitar credenciales en la UI.

## Alcance y límites

- Reutilizar la cuenta escolar existente mediante la API de Auth con clave pública; nunca incluir una clave administrativa en la app.
- Mantener la sesión solo en memoria, sin almacenamiento persistente de tokens. Al reiniciar o solicitar un token próximo a vencer, volver a autenticar y comprobar acceso escolar.
- Ante fallos de red, credenciales o permisos, informar el error y ofrecer reintento; nunca anunciar éxito sin acceso escolar confirmado.
- Deduplicar intentos simultáneos y mostrar la alerta de éxito una sola vez por arranque.
- Excluir las credenciales de la configuración de producción y desactivar el hook fuera de `__DEV__`.
- No cambiar la lectura NFC existente, la consulta anónima temporal ni implementar registro de asistencias, login de producción u operación offline en este incremento.

## Configuración local

En `.env.local`, ignorado por Git, configurar:

```dotenv
NFC_DEV_AUTO_LOGIN=true
NFC_DEV_LOGIN_EMAIL=<correo-de-la-cuenta-escolar>
NFC_DEV_LOGIN_PASSWORD=<contraseña-de-pruebas>
```

Se reutilizan `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Reiniciar Metro con `npx expo start --dev-client --clear` después de cambiar las variables.

**Solo para datos ficticios y builds de desarrollo:** ignorar el archivo en Git no cifra las credenciales. Expo las incluye en la configuración accesible de desarrollo; no compartir ese bundle ni usar una cuenta con datos reales. Este mecanismo no reemplaza el aprovisionamiento seguro del dispositivo en producción.

## Criterios verificables

1. El arranque con configuración válida muestra «Sesión iniciada» después de autenticar y consultar `school_access` con el JWT de esa cuenta.
2. Un error, una respuesta inválida o una cuenta sin acceso escolar nunca produce confirmación de éxito y permite reintentar.
3. La configuración de producción no contiene credenciales, incluso si las variables locales están definidas.
4. La búsqueda existente por pulsera conserva su comportamiento. La sesión queda disponible en el runtime de desarrollo para integraciones posteriores; este cambio no conecta aún esa sesión al lookup anónimo.

El avance y las validaciones están en [tasks.md](tasks.md).
