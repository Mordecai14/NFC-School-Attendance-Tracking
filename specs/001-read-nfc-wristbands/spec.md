# Feature Specification: Lectura de pulseras NFC

**Feature Branch**: `main` (no se creó una rama para esta especificación)

**Created**: 2026-10-27

**Status**: Draft

**Input**: Validar en un dispositivo Android que las pulseras NFC de la escuela
pueden leerse y distinguirse por un identificador estable, mediante una pantalla
funcional mínima que sustituya la interfaz de ejemplo.

## Clarifications

### Session 2026-10-27

- Q: ¿Durante cuánto tiempo debe conservarse el mismo identificador al volver a leer una pulsera? → A: En el mismo dispositivo, incluso tras cerrar y reabrir la aplicación.
- Q: Si falla una lectura después de una exitosa, ¿debe seguir visible el identificador anterior? → A: El resultado actual no muestra un identificador anterior; el historial de lecturas exitosas permanece visible y claramente diferenciado del error actual.
- Q: Si NFC no está disponible al abrir la pantalla y luego vuelve a estarlo, ¿cuándo debe indicar la aplicación que ya puede esperar una pulsera? → A: Sin cerrar la aplicación, al volver a estar disponible.
- Q: Al escanear varias pulseras, ¿debe la pantalla mostrar solo el resultado del último intento o también identificadores anteriores para compararlos? → A: Mantener una lista visible de al menos las últimas cinco lecturas exitosas, incluso tras un error, identificada claramente como historial y separada del resultado actual.
- Q: Para contar un nuevo escaneo de la misma pulsera, ¿debe el operador retirarla y volver a acercarla? → A: Sí; cada nueva lectura requiere retirar la pulsera y volverla a acercar.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Identificar una pulsera (Priority: P1)

Como operador, quiero acercar una pulsera compatible al dispositivo y ver su
identificador para comprobar que puede reconocerse.

**Why this priority**: La lectura visible de una pulsera es la prueba básica de
viabilidad antes de construir el sistema de asistencia.

**Independent Test**: Abrir la aplicación en un dispositivo Android con lectura
NFC, acercar una pulsera de prueba y observar el identificador sin registrar
alumnos ni asistencias.

**Acceptance Scenarios**:

1. **Given** la pantalla abierta y ninguna pulsera detectada, **When** el lector
   está listo, **Then** se indica claramente que espera una pulsera.
2. **Given** el lector listo y una pulsera compatible, **When** el operador la
   acerca, **Then** se indica la detección y se muestra su identificador.
3. **Given** un identificador mostrado, **When** el operador acerca otra pulsera
   compatible, **Then** se muestra el identificador de la nueva lectura y se
   puede distinguir del anterior en un historial de al menos cinco lecturas
   exitosas recientes.
4. **Given** una pulsera leída previamente, **When** el operador cierra y
   reabre la aplicación en el mismo dispositivo, retira la pulsera y vuelve
   a acercarla,
   **Then** se muestra exactamente el mismo identificador.
5. **Given** una lectura fallida o una pulsera sin identificador legible,
   **When** termina el intento, **Then** se informa el error sin identificador
   para ese intento, el historial anterior sigue visible y diferenciado del
   resultado actual, y se puede intentar de nuevo.
6. **Given** un dispositivo sin lectura disponible, **When** se abre la pantalla,
   **Then** se muestra que no es posible escanear en lugar de indicar que está
   esperando una pulsera; **When** vuelve a estar disponible, **Then** se
   indica que espera una pulsera sin cerrar la aplicación.
7. **Given** cualquier lectura exitosa, **When** se muestra el resultado,
   **Then** no se solicitan datos de alumnos ni se registra una asistencia y
   el identificador no queda guardado al cerrar la aplicación.

### Edge Cases

- Si se acerca una pulsera que el dispositivo no puede leer, se muestra un
  error comprensible y se permite otro intento.
- Si un intento falla después de una lectura exitosa, se muestra el error
  actual sin identificador para ese intento; el historial de lecturas
  exitosas sigue visible, identificado como información anterior.
- Si dos pulseras distintas producen el mismo identificador, la prueba no
  permite considerarlas distinguibles y debe reportarse como fallo de validación.
- Si la lectura no está disponible en el dispositivo, la pantalla no indica
  falsamente que está preparada para escanear; al recuperarse la disponibilidad
  muestra que está lista sin requerir cerrar la aplicación.
- Mantener una pulsera cerca del dispositivo no genera nuevas lecturas en el
  historial; cada nuevo intento requiere retirarla y volverla a acercar.

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
- **FR-005**: Ante una lectura fallida o sin identificador, la aplicación DEBE
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
- **SC-004**: Ante una lectura fallida después de un éxito durante la prueba,
  el operador ve el error sin identificador para el intento fallido y el
  historial anterior permanece visible con una indicación clara de que
  corresponde a lecturas exitosas previas; puede reintentar sin reiniciar.
- **SC-005**: Si la lectura deja de estar disponible y luego vuelve a estarlo
  durante la prueba, el operador ve el estado de espera y puede leer una
  pulsera sin cerrar la aplicación.

## Assumptions

- La validación se realiza en un dispositivo Android con capacidad de lectura
  NFC y con acceso a por lo menos dos pulseras de muestra de las que usará la
  escuela; sin esas muestras no se puede concluir que sean aptas.
- «Compatible» significa que el dispositivo de prueba puede leer la pulsera y
  obtener un identificador; no se presupone compatibilidad con todas las
  pulseras NFC existentes.
- Cinco lecturas por pulsera y cinco segundos por lectura son umbrales de
  validación iniciales para esta prueba, no garantías para un sistema futuro.
- El historial reúne lecturas exitosas de la sesión actual; no se requiere
  persistencia entre aperturas de la aplicación. El diseño visual definitivo,
  alumnos, asistencias, entrada o salida, Supabase, funcionamiento offline,
  sincronización, autenticación y asignación de pulseras quedan fuera de alcance.
