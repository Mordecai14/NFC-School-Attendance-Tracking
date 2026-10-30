# Validación física: lectura de pulseras NFC

## Preparación

- Android Studio, Android SDK y JDK compatibles con la versión de Gradle/Android
  generada por Expo 58. Confirmar `java -version`, `JAVA_HOME` y la ruta del SDK
  (`ANDROID_HOME` o configuración local equivalente); no fijar una versión de
  JDK por intuición si la compilación indica otro requisito.
- Dispositivo Android físico con lector NFC y depuración USB habilitada.
  Ejecutar `adb devices` y aceptar la autorización en el teléfono: debe aparecer
  como `device`, no `unauthorized`. Habilitar NFC y mantener el teléfono
  desbloqueado con la aplicación en primer plano para la prueba.
- Al menos dos pulseras de muestra de las que usará la escuela, distinguibles
  físicamente como A y B. Sin ellas no se puede declarar exitoso el spike.
- Dependencia NFC y plugin Android incorporados según [plan.md](plan.md);
  este documento no indica que la implementación ya exista.
- Definir un identificador Android válido en `expo.android.package` de
  `app.json` durante la implementación, en lugar de depender de una pregunta
  interactiva de la primera compilación. No cambiar el identificador entre
  ensayos de reapertura.

## Compilar y verificar

Tras implementar la feature, desde la raíz del repositorio:

```sh
pnpm install
pnpm exec expo prebuild --platform android
pnpm exec expo run:android --device
pnpm exec tsc --noEmit
```

Ejecutar `pnpm lint` y `pnpm exec tsc --noEmit`. Este repositorio usa ESLint 9
con la configuración flat de Expo en `eslint.config.js`. Registrar los errores
que queden y distinguir los hallazgos preexistentes de los introducidos por la
feature; no aceptar una instalación automática o silenciosa de dependencias.

Prebuild genera o actualiza la configuración nativa local. Comprobar en
`android/app/src/main/AndroidManifest.xml` y en el manifiesto fusionado de la
compilación que figura `android.permission.NFC`; no requiere solicitud runtime.
Si se modifica el plugin o la configuración nativa, repetir prebuild antes de
compilar e instalar: `run:android` reutiliza el directorio `android/` existente.
No usar regeneración destructiva ni modificar archivos nativos a mano como
paso rutinario. Expo Go y un emulador no validan la lectura física.

Antes de completar la UI, comprobar que reader mode con los flags de
[research.md](research.md) entrega IDs y distingue retirada/nuevo acercamiento
sin repetir una exposición sostenida. Si falla, registrar el bloqueo antes de
continuar con la pantalla completa.

## Recorrido de aceptación

1. Con NFC activo, abrir la pantalla única: debe indicar espera y no mostrar
   la interfaz de ejemplo de Expo.
2. Acercar A, anotar fuera de la aplicación su identificador para la prueba,
   retirarla y volverla a acercar hasta completar cuatro lecturas de A. Repetir
   cuatro lecturas separadas con B, alternando pulseras para verificar que el
   resultado actual cambia y el historial muestra al menos las últimas cinco.
3. Cerrar y reabrir la aplicación en el mismo dispositivo. Verificar que el
   historial anterior desapareció y que una nueva lectura de A y otra de B
   reproducen exactamente sus respectivos identificadores anteriores.
   Así se completan cinco lecturas por pulsera, incluida una de cada una
   después de reabrir la aplicación.
4. Sostener una pulsera junto al lector sin retirarla: no debe crear varias
   lecturas. Retirarla y volverla a acercar sí debe generar una nueva entrada.
5. Ante un fallo notificado o una pulsera detectada sin identificador legible:
   debe aparecer un error sin identificador actual, el historial anterior
   debe seguir visible y rotulado, y se debe poder reintentar. Si no se dispone
   de un fallo físico reproducible, verificar la transición con entradas
   controladas en pruebas y su presentación en pantalla, identificando esa
   evidencia como controlada, no como fallo RF real. Si no se verifica por
   ninguna vía, el escenario queda pendiente.
   Una pulsera indetectable no genera por sí sola un error: registrar la falta
   de detección como fallo del ensayo, sin inventar un nuevo resultado.
6. Desactivar NFC mientras la aplicación está abierta: debe indicar que no
   puede leer. Volver a activarlo: debe mostrar espera y permitir otra lectura
   sin cerrar la aplicación. Probar también un dispositivo sin lector NFC si
   se dispone de él; no es requisito conseguir un segundo dispositivo.
7. Medir cada acercamiento exitoso: el identificador debe aparecer antes de
   cinco segundos. Confirmar que no aparece registro de alumnos, asistencia,
   autenticación ni envío de datos.

**Resultado esperado:** Se cumplen SC-001–SC-005 de [spec.md](spec.md).
Registrar modelo de dispositivo, tipo de pulseras probado y resultado de cada
escenario sin publicar los identificadores en el repositorio o logs. Si los
IDs cambian, coinciden entre A y B o no se pueden obtener, reportar el fallo
como conclusión técnica del spike. Si faltan hardware o pulseras, marcar los
ensayos físicos como pendientes; si falta un error físico reproducible, dejar
constancia y distinguirlo de la verificación controlada del manejo de errores.

## Pruebas controladas y cierre

Comprobar la lógica pura de historial y resultado con el runner integrado de
Node 24, si se extrae un módulo sin dependencias nativas: cinco éxitos recientes,
relecturas válidas del mismo ID, error que borra solo el identificador actual,
éxito después de error y estado inicial vacío. Ejecutar:

```sh
node --test tests/nfc-reader-state.test.mjs
```

No añadir un framework ni una UI de simulación para este spike. La ausencia de
eventos no debe crear resultados.

### Entorno usado para esta validación

| Componente | Versión/valor |
|------------|---------------|
| Node.js | 24.21.0 |
| pnpm | 12.11.2 |
| Expo | ~58.0.20 |
| React Native | 0.88.0 |
| `react-native-nfc-manager` | 4.2.0 |
| ESLint | 9.39.5 |
| `eslint-config-expo` | 58.0.4 |
| Java | Zulu OpenJDK 17.0.20.1 |
| Dispositivo | 25078PC3EG, Android 16 |

Registrar tres conclusiones distintas: viabilidad NFC física, manejo de errores
verificado (evidencia física o controlada) y calidad de implementación. Dejar
explícitos los bloqueos de lint/tipos que sean ajenos al alcance. Los ensayos
controlados no demuestran compatibilidad, estabilidad del UID ni retirada física
de las pulseras.
