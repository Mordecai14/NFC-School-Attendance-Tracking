# Contrato de login y sesión

## Alcance

Define el comportamiento observable del login escolar de 003. No define alta, recuperación de contraseña ni administración de cuentas.

## Interfaz

- Campos requeridos: correo electrónico y contraseña.
- Acciones: iniciar sesión y, desde el área autenticada, cerrar sesión.
- No existe enlace ni acción de registro público.
- El formulario informa validación, envío en curso y resultado; evita envíos repetidos mientras procesa una solicitud.
- Errores de credenciales, cuenta inhabilitada y falta de conexión muestran un mensaje comprensible sin mostrar datos protegidos ni credenciales.

## Ciclo de sesión

1. Al abrir la app, restaurar la sesión antes de mostrar una ruta protegida.
2. Sin sesión válida, mostrar `/login`. Con sesión válida, comprobar que la cuenta tiene una asociación escolar; solo entonces dirigir a la pantalla principal. Si no tiene asociación, mantener bloqueadas las rutas protegidas y mostrar un estado de acceso aún no configurado.
3. Tras login correcto, ingresar a la aplicación protegida.
4. Al cerrar sesión, borrar la sesión local y volver al login.
5. Una sesión vencida vuelve al login y no deja visible la pantalla protegida.

La sesión se conserva entre aperturas de la app hasta logout o vencimiento. Los tokens nativos se almacenan con SecureStore; el refresco se detiene en background y se reanuda al volver a foreground.

## Criterios de contrato

- Correo/contraseña válidos abren una sesión asociada a exactamente una escuela.
- Credenciales inválidas o un usuario Auth sin escuela asociada no conceden acceso.
- Una sesión Auth válida sin asociación escolar no habilita la ruta principal ni consultas de datos; muestra el estado de acceso no configurado.
- No se invoca signup desde la app.
- El logout elimina el acceso local; no borra la cuenta ni sus datos.
