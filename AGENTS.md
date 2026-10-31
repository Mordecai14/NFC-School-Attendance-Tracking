# Aplicación de Asistencia Escolar

Aplicación móvil para registrar la entrada y salida de alumnos mediante pulseras NFC.

## Tecnologías

- React Native
- Expo
- TypeScript

Las dependencias adicionales deben incorporarse únicamente cuando sean necesarias para una funcionalidad aprobada.

## Principios de ingeniería

- Preferir soluciones simples antes que abstracciones prematuras.
- Mantener TypeScript en modo estricto.
- No agregar dependencias sin una necesidad concreta.
- No inventar requisitos de producto.
- Mantener la lógica de negocio separada de la interfaz de usuario (UI) cuando sea razonable.
- El registro de asistencias debe funcionar sin conexión.
- Los eventos de asistencia nunca deben descartarse silenciosamente.
- Preferir cambios pequeños y fáciles de revisar.

## Documentación

Toda la documentación del proyecto debe estar escrita en español (con excepción de palabras clave como feature(s), palabras genericas como offline, Must, etc. O palabras y frases de terminal y desarrollo como build, run, etc). Se puede redactar

Usar:

- `docs/roadmap.md` para prioridades y orden aproximado de capacidades.
- `docs/product.md` para el contexto estable del producto.
- `docs/architecture.md` para la arquitectura actual del sistema.
- `docs/decisions/` para decisiones arquitectónicas.
- `docs/specs/` para requisitos y planes específicos de cada funcionalidad.

No asumir que documentación desactualizada sigue siendo correcta.

Si la implementación y la documentación se contradicen, reportar el conflicto.

## Antes de implementar

1. Leer la especificación correspondiente.
2. Leer el plan de implementación si existe.
3. Inspeccionar el código existente relacionado.
4. Identificar supuestos o requisitos faltantes.
5. No ampliar el alcance solicitado sin una justificación clara.

## Validación

Antes de considerar terminado un cambio:

- ejecutar lint;
- ejecutar validación de TypeScript;
- ejecutar las pruebas relevantes;
- reportar fallos de validación;
- reportar desviaciones respecto al plan aprobado.

## Git

No hacer commit, push, rebase ni modificar el historial de Git a menos que se solicite explícitamente.
