# Implementation Plan: Lectura de pulseras NFC

**Branch**: `main` | **Date**: 2026-10-27 | **Spec**: [spec.md](spec.md)

**Input**: Especificación en `docs/specs/001-read-nfc-wristbands/spec.md`.
El identificador de feature de Spec Kit es `001-read-nfc-wristbands`;
`001-nfc-reading` en la solicitud se refiere a esta misma feature.

## Summary

Sustituir las dos pantallas de ejemplo de Expo por una sola pantalla Android
que muestre disponibilidad del lector, resultado actual, errores y al menos
cinco lecturas exitosas recientes. Leer identificadores de pulseras NFC reales
mediante `react-native-nfc-manager`, sin asociarlos a alumnos ni persistirlos.
La estabilidad y distinción de identificadores se determinan por prueba física,
no por una suposición sobre el tipo de pulsera.

## Technical Context

**Language/Version**: TypeScript estricto; React Native 0.88.0 y Expo ~58.0.20.

**Primary Dependencies**: Dependencias existentes de Expo/React Native y
`react-native-nfc-manager` (evaluar 4.2.0). Plugin Expo incluido en la biblioteca;
solo añadir su peer `@expo/config-plugins` si la instalación lo exige.

**Storage**: Ninguno. Historial en memoria durante la sesión de la pantalla;
no almacenar identificadores al cerrar la aplicación.

**Testing**: ESLint, `tsc --noEmit`, pruebas controladas del estado transitorio y
validación obligatoria en un Android físico con pulseras de muestra. No existe
runner configurado: para lógica pura se puede usar el runner integrado de Node
24 disponible en el entorno, sin añadir un framework para simular NFC.

**Target Platform**: Android físico con NFC; compilación local nativa con Expo.
No se exige funcionamiento en iOS ni web para esta feature.

**Project Type**: Aplicación móvil Expo Router existente.

**Performance Goals**: Identificador visible antes de cinco segundos desde
cada acercamiento exitoso (SC-003).

**Constraints**: Misma pulsera, mismo identificador en el mismo dispositivo
también tras reabrir; pulseras distintas, identificadores distintos; una nueva
lectura requiere retirada y nuevo acercamiento; NFC puede dejar de estar
disponible y recuperarse sin cerrar la aplicación. Historial de al menos cinco
lecturas exitosas visibles, etiquetado separadamente del resultado y del error.

**Scale/Scope**: Una pantalla y al menos dos pulseras reales; cinco lecturas
independientes por pulsera. Sin alumnos, asistencia, autenticación, red,
persistencia ni infraestructura adicional.

## Constitution Check

*GATE: Aprobado antes de la investigación; revisado de nuevo después del diseño.*

| Principio | Comprobación inicial y posterior |
|-----------|----------------------------------|
| Especificación y aceptación | La spec tiene escenarios y SC-001–SC-005; la prueba real está documentada en `quickstart.md`. |
| Simplicidad y alcance | Una pantalla, un acceso nativo acotado y sin servicios ajenos; no introducir modelos de alumnos ni capas futuras. |
| Tipos y verificación | `tsconfig.json` ya usa `strict: true`; ejecutar lint, tipos y prueba física antes de declarar éxito. |
| Asistencias confiables sin conexión | No aplica al registro: esta feature no genera eventos de asistencia ni promete persistencia offline. |
| Seguridad y privacidad | No leer datos de alumnos, registrar UIDs en logs, transmitir ni persistir identificadores. |
| Dependencias y decisiones | Solo biblioteca NFC justificada por lectura física; si aparece una solución nativa propia o un cambio arquitectónico material, detener y documentar ADR antes de ampliar el alcance. |

**Resultado posterior al diseño:** Sin violaciones identificadas. Los riesgos
de compatibilidad, UID variable y distinción de acercamientos permanecen como
validaciones físicas pendientes, no como requisitos a eludir.

## Enfoque técnico y estados

1. Añadir la biblioteca NFC y su plugin a la configuración Expo Android.
   Instalar un binario de desarrollo en dispositivo físico; Expo Go no contiene
   este módulo nativo. Definir `android.package` en la implementación y comprobar
   JDK/SDK y autorización ADB según `quickstart.md`. Generar o actualizar Android
   mediante prebuild y verificar `android.permission.NFC` en el manifiesto
   resultante; no solicitarlo como permiso runtime. No mantener código nativo
   a mano. Después de cambios de plugin, regenerar antes de recompilar.
2. En la pantalla única, inicializar el lector solo cuando está activa,
   comprobar soporte y estado habilitado, escuchar descubrimientos y cambios
   de estado y limpiar registros al salir. Al regresar desde ajustes o segundo
   plano, volver a comprobar disponibilidad. Evitar lectores/listeners
   simultáneos y que una lectura tardía modifique una pantalla inactiva.
3. Mostrar estados distinguibles: no disponible, esperando, detectada con
   identificador actual y error sin identificador actual. Mantener un historial
   en memoria de al menos cinco lecturas exitosas; un error no lo borra ni
   aparece como lectura exitosa. Tras una nueva lectura válida, actualizar
   resultado e historial. No guardar UIDs en logs ni almacenamiento.
4. Usar reader mode Android y los flags NFC-A, NFC-B, NFC-F y NFC-V más
   `FLAG_READER_SKIP_NDEF_CHECK`, como se detalla en `research.md`. Aceptar
   únicamente el identificador no vacío de la etiqueta leída, sin inventar otro.
   Antes de completar la UI, compilar y comprobar en
   el dispositivo que mantener una pulsera junto al lector no incrementa el
   historial; retirarla y reaproximarla sí. Si el módulo no permite cumplir
   esta condición para las muestras, registrar el bloqueo en el spike, no
   disimularlo con una ventana temporal arbitraria.
5. Diferenciar fallos notificados y detecciones sin ID de un acercamiento
   completamente indetectable. Solo los primeros generan un error actual;
   sin evento no se inventa un nuevo resultado ni se añade un timeout. La
   ausencia de detección se registra manualmente como fallo del ensayo.

## Project Structure

### Documentation (this feature)

```text
docs/specs/001-read-nfc-wristbands/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/
    └── scan-screen.md
```

`tasks.md` corresponde a `/speckit.tasks` y no se crea en esta fase.

### Source Code (repository root)

```text
app.json                        # Plugin y permiso Android mediante configuración
package.json                    # Única dependencia NFC necesaria
pnpm-lock.yaml                  # Resolución de esa dependencia
src/app/_layout.tsx             # Dejar una sola pantalla en Expo Router
src/app/index.tsx               # Reemplazar UI de ejemplo por lector y resultados
src/app/explore.tsx             # Eliminar ruta de ejemplo visible
src/hooks/use-nfc-reader.ts     # Acceso NFC y ciclo de vida, separado de la UI
```

**Structure Decision**: Usar las rutas y el esquema del proyecto; no crear
servicios genéricos, repositorios, navegación adicional ni nuevos dominios.
Los componentes de ejemplo que queden sin uso no requieren limpieza masiva
para que desaparezca la UI de muestra.

## Pruebas y criterio de salida del spike

- Ejecutar `pnpm lint` solo con su configuración y dependencias ya aprobadas,
  y `pnpm exec tsc --noEmit`. Registrar por separado los errores base y los
  nuevos; no ejecutar la autoinstalación de lint como si fuera solo lectura.
- Probar de forma automatizada la actualización del estado transitorio:
  conservar cinco éxitos recientes, incluir relecturas válidas del mismo ID,
  error sin identificador actual y con historial intacto, lectura válida tras
  error y nuevo estado inicial sin historial. Usar entradas controladas para
  éxito, ID ausente y fallo notificado; no crear una pantalla de simulación.
  El runner integrado de Node sirve si esa lógica queda en un módulo TypeScript
  puro sin imports nativos. Estas pruebas no demuestran detección ni retirada
  física y no sustituyen los ensayos de hardware.
- Aplicar la guía [quickstart.md](quickstart.md) en Android físico con al menos
  dos pulseras reales de la escuela: cinco aproximaciones separadas de cada
  una, incluida una tras cerrar y reabrir la aplicación; comparar exactitud y
  unicidad de sus identificadores y tiempo de lectura.
- Verificar lista de cinco, error sin identificador actual pero con historial
  visible, reintento, estado NFC no disponible y recuperación sin reinicio.
- **Viabilidad NFC demostrada:** SC-001–SC-003 y SC-005 pasan físicamente y una
  exposición sostenida no añade lecturas. Un ID ausente, aleatorio, colisionado
  o eventos repetidos impiden validar esa pulsera/escenario.
- **Manejo de errores verificado:** SC-004 pasa con un fallo reproducible o con
  entradas controladas en pruebas de estado y comprobación de su presentación;
  indicar cuál se utilizó. Si no hubo fallo RF reproducible, no afirmar que se
  ensayó físicamente. Una falta de detección no satisface esta prueba de error.
- **Implementación terminada:** además de lo anterior, pasan las pruebas y
  validaciones de calidad. Los fallos previos de lint/tipos deben resolverse
  con alcance aprobado o quedar como bloqueo explícito; no constituyen una
  aprobación implícita ni permiten declarar toda la implementación validada.
- Registrar modelo de dispositivo, resultados y escenarios pendientes sin
  copiar UIDs al repositorio ni a telemetría. Un spike con resultado negativo
  puede aportar una conclusión útil, pero no valida la feature como exitosa.

## Resultados de implementación

- La build Android y la aceptación manual en el dispositivo con dos pulseras
  están documentadas en [validation.md](validation.md). Los UUID no se
  reproducen en la documentación.
- Las seis pruebas de estado pasan y `pnpm exec tsc --noEmit` termina sin errores.
- ESLint 9 y la configuración flat de Expo quedaron instalados tras aprobación
  posterior del operador. `pnpm lint` encuentra un issue preexistente en
  `src/hooks/use-color-scheme.web.ts`; no pertenece al alcance NFC.
- Se observó una lectura duplicada en una exposición sostenida inicial; no volvió
  a ocurrir en dos ensayos posteriores. El comportamiento sigue registrado como
  anomalía conocida, sin debounce temporal.

## Riesgos técnicos

- El identificador de Android puede ser aleatorio o inexistente según la
  pulsera; solo el ensayo con modelos reales prueba estabilidad.
- El evento de descubrimiento no documenta por sí solo una señal fiable de
  retirada; los eventos repetidos con la pulsera sostenida deben ensayarse.
- La compilación nativa, el plugin y el peer opcional pueden requerir ajustes
  de compatibilidad con Expo 58; reconstruir tras cambios nativos y reportar
  cualquier bloqueo, sin añadir dependencias no justificadas.
- La validación base reportó errores de TypeScript en archivos de ejemplo;
  actualmente `pnpm exec tsc --noEmit` pasa tras retirar la ruta de ejemplo y
  corregir el tipo `ref`. El lint completo conserva un hallazgo en un hook web
  preexistente; se registra como deuda separada, no como defecto de lectura NFC.
- El simulador y Expo Go no sustituyen la prueba física; si no hay dispositivo
  o muestras, el estado del spike es «pendiente de validación», no «exitoso».

## Complexity Tracking

No hay violaciones de la constitución ni capas adicionales que justificar.
