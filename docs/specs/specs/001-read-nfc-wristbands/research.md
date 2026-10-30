# Investigación: lectura NFC en Android

## Biblioteca NFC

**Decisión:** Evaluar `react-native-nfc-manager` como única dependencia funcional
nueva para acceder al lector NFC. La versión publicada consultada es 4.2.0; sus
peer dependencies admiten React Native >=0.76, mientras el proyecto usa 0.88.0.
La compatibilidad real con Expo 58 y el dispositivo debe comprobarse al compilar
y ejecutar; la compatibilidad declarada no sustituye la prueba física.

**Motivo:** Ofrece un módulo nativo, plugin de configuración Expo y eventos de
descubrimiento y cambio de estado NFC. Evita escribir código Android propio para
una prueba de viabilidad.

**Alternativas:** Integración nativa propia (mayor superficie de mantenimiento);
otras bibliotecas NFC (sin ventaja demostrada para este alcance). Si el plugin
requiere `@expo/config-plugins` como peer directo con pnpm, agregarlo únicamente
si se confirma el error de resolución, y dejar constancia de la causa.

Fuentes: [paquete y peer dependencies](https://github.com/revtel/react-native-nfc-manager/blob/main/package.json),
[configuración Expo](https://github.com/revtel/react-native-nfc-manager/blob/main/_autodocs/configuration.md).

## Compilación y configuración Android

**Decisión:** Declarar el plugin de la biblioteca en `app.json` para incorporar
`android.permission.NFC` y compilar una aplicación Android local con
`pnpm exec expo run:android --device`. No usar Expo Go para probar un módulo
nativo que no forma parte de sus módulos integrados. No crear ni mantener código
nativo manual; el proyecto ignora los directorios generados `android/` e `ios/`.

**Motivo:** La configuración nativa y la lectura física deben probarse en el
binario instalado. Los cambios de plugin o módulo exigen una nueva compilación;
el servidor JavaScript por sí solo no aplica cambios nativos.

**Alternativas:** Expo Go (no incorpora este módulo); añadir infraestructura de
compilación remota (innecesaria para validar un dispositivo disponible localmente).

Fuentes: [plugin NFC](https://github.com/revtel/react-native-nfc-manager/blob/main/app.plugin.js),
[desarrollo local Expo](https://docs.expo.dev/guides/local-app-development/),
[config plugins Expo](https://docs.expo.dev/config-plugins/introduction/).

## Lectura, identificador y ciclo de vida

**Decisión:** Usar `registerTagEvent` con `isReaderModeEnabled: true` y los flags
`FLAG_READER_NFC_A | FLAG_READER_NFC_B | FLAG_READER_NFC_F | FLAG_READER_NFC_V |
FLAG_READER_SKIP_NDEF_CHECK`. Se busca el identificador, no contenido NDEF;
estas familias cubren la búsqueda inicial sin presuponer el modelo de pulsera.
No dejar flags en cero ni prometer compatibilidad con todas las etiquetas.
Usar el evento de descubrimiento de etiquetas de la biblioteca y
mostrar el identificador no vacío recibido en cada lectura; los fallos y la
ausencia de identificador no son éxitos. Consultar disponibilidad al iniciar y
al regresar a la aplicación, y escuchar cambios de estado del adaptador para
recuperarse sin reinicio. Registrar el lector solo mientras la pantalla esté
activa y liberarlo al salir; mantener únicamente el historial de la sesión.

**Motivo:** `TagEvent.id` es opcional. `NfcEvents.DiscoverTag` y
`NfcEvents.StateChanged` permiten lecturas sucesivas y actualización de
disponibilidad sin imponer una tecnología de pulsera específica. Para contar
una nueva lectura, la pulsera se retira y se vuelve a acercar; comprobar en el
dispositivo que una exposición sostenida no cree nuevas entradas. No sustituir
esa comprobación por un plazo arbitrario de debounce que podría descartar un
reescaneo válido.

**Alternativas:** `requestTechnology` fija una tecnología concreta antes de
conocer las pulseras; inventar un identificador derivado o almacenar una
correspondencia ocultaría la inestabilidad real de la prueba.

**Límite de observabilidad:** Sin evento de descubrimiento ni error notificado,
no se puede saber que el operador acercó una pulsera. Esa falta de detección es
un fallo del ensayo físico, no un error que la UI pueda deducir. Las pruebas
controladas de errores cubren el estado de pantalla, no simulan viabilidad RF.

**Validación temprana:** Antes de terminar la UI, compilar y comprobar con las
muestras que este modo entrega IDs, no repite una exposición sostenida y permite
reescaneo tras retirar la pulsera. Si falla, registrar el bloqueo antes de
continuar; no ocultarlo con debounce ni crear una integración nativa alternativa.

Fuentes: [API de eventos](https://github.com/revtel/react-native-nfc-manager/blob/main/_autodocs/api-reference/nfc-manager-base.md),
[tipo de etiqueta](https://github.com/revtel/react-native-nfc-manager/blob/main/_autodocs/types.md).

## Riesgo de estabilidad: resultado del spike, no garantía

**Decisión:** Tratar identificadores ausentes, cambiantes o iguales entre dos
pulseras de muestra como resultado no satisfactorio. No prometer unicidad para
otras pulseras ni seleccionar una tecnología de lectura alternativa sin nueva
evidencia y alcance aprobado.

**Motivo:** Android advierte que algunas etiquetas devuelven un identificador
aleatorio cada vez que se descubren y otras no tienen identificador. Tampoco
hay garantía documentada aquí de recibir una notificación de retirada para
distinguir automáticamente eventos repetidos mientras se mantiene la pulsera
en el campo. Si ocurre en las muestras, documentar el fallo y revisar el
enfoque antes de extender esta feature.

**Alternativas:** Usar datos almacenados en la pulsera, escribir etiquetas o
crear asignaciones a alumnos implicaría nuevos requisitos no aprobados.

Fuente: [Android `Tag.getId()`](https://developer.android.com/reference/android/nfc/Tag#getId()).
