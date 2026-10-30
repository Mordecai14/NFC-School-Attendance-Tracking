# Registro de validación: lectura de pulseras NFC

## Preparación y estado base

- Fecha: 2026-10-29.
- Node.js: `v24.21.0`.
- pnpm: `12.11.2`.
- Java: Zulu OpenJDK `17.0.20.1`.
- `adb`: disponible en
  `~/Library/Android/sdk/platform-tools/adb`, aunque no está en el `PATH`.
- SDK Android: `~/Library/Android/sdk`; se usaron `ANDROID_HOME`,
  `ANDROID_SDK_ROOT` y `PATH` temporales para la compilación.
- Dispositivo conectado: modelo reportado `25078PC3EG`, Android 16.
- Pulseras de prueba A y B: el operador confirmó que son distintas y ambas
  fueron reconocidas durante las aproximaciones reportadas.
- Estado inicial: ESLint no estaba configurado. Después de la aprobación del
  operador, se instaló ESLint y se agregó la configuración flat de Expo; los
  resultados finales se registran abajo.

### TypeScript antes de la feature

Comando: `pnpm exec tsc --noEmit`.

Resultado: falla con errores preexistentes en `src/components/animated-icon.web.tsx`
(declaración CSS ausente), `src/components/app-tabs.web.tsx` (tipo de `ref`) y
`src/constants/theme.ts` (declaración CSS ausente). No se modificaron esos
archivos. Durante la ejecución pnpm informó retirar paquetes de `node_modules`;
`package.json` y `pnpm-lock.yaml` no quedaron modificados.

## Progreso de implementación

- T003: instalados `react-native-nfc-manager@4.2.0`, plugin Expo y
  `expo.android.package` `com.nfcschoolattendancetracking`. `expo config --type
  public` incluye el permiso `android.permission.NFC`.
- T004: las pruebas iniciales fallaron porque aún no existía el módulo de estado;
  después de T005, `node --test tests/nfc-reader-state.test.mjs` pasó 6/6.
- T005–T007: implementados estado transitorio, hook inicial y pantalla mínima.
  La compilación de dispositivo posterior se registra en T008.
- T008: `pnpm exec expo prebuild --platform android` terminó correctamente y el
  manifiesto generado contiene `android.permission.NFC`. La compilación Android
  terminó con `BUILD SUCCESSFUL` y la app se instaló en el teléfono conectado;
  la app está en primer plano y Android reporta NFC activo. El operador confirmó
  que una pulsera de prueba fue detectada y mostró su UUID; no se copia el valor
  al repositorio. En el ensayo inicial, la secuencia reportada fue
  `1A, 2B 2B, 4A, 5B, 6B, 6B`, donde una coma indica que la pulsera se retiró.
  La repetición contigua `2B 2B` confirma una lectura duplicada durante una
  exposición sostenida; las lecturas separadas `6B, 6B` confirman que retirar y
  volver a acercar B permite reintentar y conserva el mismo identificador. En
  dos ensayos posteriores de exposición sostenida, el operador confirmó que no
  volvió a ocurrir la doble detección. A pedido del operador, se cierra el gate
  T008; se conserva el primer resultado como anomalía observada. No se introduce
  debounce temporal para ocultar la repetición.
- T009–T010: se reemplazó el navegador de pestañas por una sola ruta, se retiró
  la animación Expo, se conserva el ocultamiento del splash al layout y se agregó
  recuperación por `StateChanged`/regreso a foreground con limpieza del reader.
- T011: la pantalla muestra por separado estado actual, detección/UUID, errores
  sin UUID e historial exitoso etiquetado; el historial se conserva cuando cambia
  el resultado actual.
- T012: verificación controlada temporal en desarrollo mostró en la UI el mensaje
  de error y el historial anterior, sin identificar una lectura fallida. Luego se
  retiró la sustitución; `uiautomator` confirmó que el código restaurado presenta
  espera y el historial vacío. No se considera prueba RF de errores.
- Build tras T009–T011: `pnpm exec expo run:android --device` compiló con éxito
  (`BUILD SUCCESSFUL`), instaló el APK actualizado y abrió la app en el teléfono.
- Validación automatizada final: `node --test
  tests/nfc-reader-state.test.mjs` pasa 6/6 y `pnpm exec tsc --noEmit` pasa sin
  errores. El error web de `ref` del estado base se resolvió preservando el
  reenvío de la referencia en `TabButton`; los errores de ruta de ejemplo se
  resolvieron al retirar `/explore`.

## Validación física

El recorrido con dos pulseras de prueba se completó según los resultados
reportados abajo. No se guardaron sus UUID en el repositorio. La exposición
sostenida tuvo resultados mixtos: una duplicación inicial y dos ensayos
posteriores sin repetición.

### Evidencia reportada durante T013

- El operador confirma que las pulseras conservan sus UUID entre lecturas.
- El operador confirma que A y B tienen UUID distintos, que cada pulsera
  conserva el mismo UUID y que completó cinco lecturas por pulsera incluyendo
  lecturas después de cerrar y reabrir la aplicación.
- Tras desactivar y reactivar NFC desde ajustes, la aplicación detectó la
  disponibilidad nuevamente de inmediato, sin reiniciarla.
- El operador confirma que el historial muestra solo las últimas cinco lecturas
  y que la más reciente aparece también como resultado actual. Al superar cinco,
  el estado implementado descarta la entrada más antigua, según FR-003/SC-002.
- El operador respondió que cada lectura apareció dentro del umbral de cinco
  segundos; no se capturaron tiempos instrumentados.
- La duplicación inicial y las dos pruebas sostenidas posteriores sin repetición
  quedan como resultados mixtos reportados. El operador solicitó considerar
  cerrado ese ensayo y se continúa sin debounce; el riesgo observado no se borra.

## Conclusiones

- **Viabilidad física en las dos pulseras probadas:** detección y UUID distintos
  y estables, incluidos reescaneos después de reabrir; recuperación de NFC
  reportada inmediata. Se completaron cinco lecturas por pulsera. La detección
  duplicada inicial durante una exposición sostenida no se reprodujo en dos
  ensayos posteriores y queda como anomalía conocida para estas muestras.
- **Manejo de errores:** verificado con estado controlado en UI e historial
  anterior visible; no se reprodujo un fallo RF. La verificación controlada no
  demuestra el comportamiento de radio ante fallos físicos.
- **Calidad de implementación:** seis pruebas de estado pasan; prebuild, build
  Android y `pnpm exec tsc --noEmit` pasan. ESLint 9 con `eslint-config-expo`
  está configurado; el lint enfocado de `src/components/app-tabs.web.tsx` y
  `eslint.config.js` pasa. `pnpm lint` encuentra un error preexistente ajeno a
  esta feature en `src/hooks/use-color-scheme.web.ts:11`
  (`react-hooks/set-state-in-effect`); se deja registrado para resolver aparte.
  La instalación de ESLint mostró `ERR_PNPM_IGNORED_BUILDS` para el script de
  `unrs-resolver`, aunque los paquetes quedaron instalados y ejecutables.
- **Historial:** muestra cinco resultados como ventana móvil y el resultado más
  reciente también en la sección de estado actual. El operador reportó que al
  seguir escaneando “se sobreponen”; esta descripción no especifica aún si se
  refiere a la rotación esperada de entradas o a un solapamiento visual real. No
  se cambió el comportamiento: la ventana móvil está definida por FR-003/SC-002;
  cualquier ajuste de presentación puede priorizarse como una mejora separada.

## Estado de cierre

La Spec se cierra con la viabilidad observada en las dos muestras probadas y
con las limitaciones anteriores explícitas. La anomalía de exposición sostenida
no se ocultó ni se corrigió con debounce; el lint pendiente pertenece a un hook
existente fuera del alcance. No se registraron identificadores de pulseras.
