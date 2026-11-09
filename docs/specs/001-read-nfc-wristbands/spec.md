# Feature Specification: Lectura de pulseras NFC

**Status**: Completada el 2026-10-29 con límites explícitos en [validation.md](validation.md).

Validar en Android físico que dos pulseras pueden distinguirse mediante un identificador estable. Este documento reúne el alcance, el enfoque y la comprobación; no requiere planes ni checklists separados.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Identificar una pulsera (Priority: P1)

Como operador, quiero acercar una pulsera compatible al dispositivo y ver su
identificador para comprobar que puede reconocerse.

**Acceptance Scenarios**: Los casos verificables se concentran en SC-001–SC-005, sin repetirlos como una segunda lista.

**Límite de observabilidad**: sin evento de descubrimiento ni fallo notificado no se inventa un resultado ni un timeout. Una falta de detección se registra como fallo del ensayo físico. Una colisión de identificadores no valida las muestras.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: La aplicación DEBE sustituir la interfaz de ejemplo por una
  pantalla mínima de validación de lectura de pulseras en Android.
- **FR-002**: La pantalla DEBE indicar cuando está preparada para esperar una
  pulsera y cuando se ha detectado una; si la lectura no está disponible, DEBE
  indicar la imposibilidad de escanear y, al volver a estar disponible, DEBE
  volver a indicar que espera una pulsera sin cerrar la aplicación.
- **FR-003**: Para cada lectura exitosa, la aplicación DEBE mostrar un
  identificador de la pulsera que permita compararlo visualmente con otras
  lecturas y con lecturas anteriores de la misma pulsera. DEBE mantener visible
  un historial de al menos las últimas cinco lecturas exitosas, separado del
  resultado del intento actual.
- **FR-004**: La aplicación DEBE permitir escanear pulseras sucesivamente sin
  reiniciarla y actualizar claramente el resultado de cada intento. DEBE
  contar como nueva lectura de una misma pulsera solo su retirada y posterior
  acercamiento, no su permanencia junto al dispositivo.
- **FR-005**: Ante un fallo de lectura notificado o una detección sin identificador, la aplicación DEBE
  mostrar un error sin atribuirle ningún identificador anterior y permitir
  reintentar. El historial de lecturas exitosas DEBE permanecer visible y
  claramente identificado como anterior.
- **FR-006**: La validación DEBE permitir comprobar que dos pulseras de prueba
  diferentes tienen identificadores distintos y que los reescaneos de cada una
  devuelven el mismo identificador en el mismo dispositivo, incluso después de
  cerrar y reabrir la aplicación; una colisión o variación DEBE registrarse
  como resultado no satisfactorio, no ocultarse.
- **FR-007**: Esta pantalla NO DEBE registrar alumnos ni asistencias, asignar
  pulseras, autenticar usuarios, conservar identificadores tras cerrar la
  aplicación ni enviarlos a un servicio externo.

### Key Entities

- **Pulsera de prueba**: Objeto físico compatible que se aproxima al lector;
  se compara con otras pulseras y consigo misma en lecturas sucesivas.
- **Resultado de lectura**: Detección exitosa con identificador visible, o
  fallo con mensaje de error; corresponde a un intento concreto.
- **Historial visible**: Lista de al menos cinco lecturas exitosas recientes
  de la sesión, diferenciada del resultado actual; no incluye los errores.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En una prueba con al menos dos pulseras diferentes destinadas
  a la escuela, cada una obtiene un identificador visible en cinco lecturas
  separadas por retirada y nuevo acercamiento en el mismo dispositivo,
  incluida al menos una después de cerrar y reabrir la aplicación; las cinco
  lecturas de una misma pulsera coinciden exactamente.
- **SC-002**: En esa prueba, los identificadores de las dos pulseras son
  diferentes; después de cinco lecturas exitosas, sus cinco identificadores
  más recientes permanecen visibles en el historial y el operador puede
  distinguir cuál corresponde al intento actual.
- **SC-003**: En cada lectura exitosa de la prueba, el resultado es visible
  en un máximo de cinco segundos desde que se acerca la pulsera al dispositivo.
- **SC-004**: Ante un fallo notificado o una detección sin identificador después de un éxito,
  el operador ve el error sin identificador para el intento fallido y el
  historial anterior permanece visible con una indicación clara de que
  corresponde a lecturas exitosas previas; puede reintentar sin reiniciar.
- **SC-005**: Si la lectura deja de estar disponible y luego vuelve a estarlo
  durante la prueba, el operador ve el estado de espera y puede leer una
  pulsera sin cerrar la aplicación.

## Implementación y límites

- `react-native-nfc-manager@4.2.0`, plugin Expo y permiso `android.permission.NFC`; no se mantiene un puente nativo propio.
- `src/hooks/use-nfc-reader.ts` controla disponibilidad, reader mode y limpieza al salir. Usa NFC-A/B/F/V y `FLAG_READER_SKIP_NDEF_CHECK`; se busca el UID, no contenido NDEF.
- `src/hooks/nfc-reader-state.ts` conserva en memoria el resultado actual y las cinco lecturas exitosas más recientes. Los errores no entran al historial ni lo borran. `src/app/index.tsx` presenta ambos por separado.
- No hay alumnos, asistencias, autenticación, red ni almacenamiento de identificadores. Sin logs de UIDs, simulador visible, timeout o debounce arbitrario.
- Los IDs pueden ser ausentes o variables según la etiqueta; el éxito con dos muestras no demuestra compatibilidad universal ni autenticación resistente a clonación.

## Cómo comprobarlo

Requiere Android físico con NFC, SDK/JDK y dos pulseras A/B. Expo Go y un emulador no validan NFC físico.

```sh
pnpm exec expo prebuild --platform android
pnpm exec expo run:android --device
node --test tests/nfc-reader-state.test.mjs
```

Tras cambiar plugins o configuración nativa, repetir prebuild sin regeneración destructiva rutinaria. Comprobar el permiso NFC en el manifiesto generado.

1. Hacer cuatro lecturas separadas de cada pulsera; cerrar y reabrir, y hacer una más por pulsera. Comparar IDs iguales por muestra y distintos entre A/B, con el historial anterior vacío tras reabrir.
2. Comprobar cinco éxitos recientes, resultado actual separado y cada lectura dentro de cinco segundos. Son umbrales iniciales, no garantías futuras.
3. Mantener una pulsera cerca y luego retirarla/reacercarla; registrar cualquier detección duplicada sin ocultarla.
4. Verificar error sin ID actual y con historial anterior, reintento y recuperación al desactivar/reactivar NFC. Distinguir un error controlado de un fallo RF real.

**Evidencia conservada**: [validation.md](validation.md), sin cambios en sus resultados ni limitaciones. Las antiguas T001–T016 estaban completadas; se retira su desglose operativo, no la evidencia. Se conserva la anomalía de exposición sostenida y el fallo de lint ajeno al lector.
