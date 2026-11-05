# Feature Specification: Base de Supabase y acceso escolar

**Feature Branch**: `[003-supabase-foundation]`

**Created**: 2026-10-30

**Status**: Borrador

**Input**: Descripción del usuario: "Comenzar a trabajar sobre el paso 003 — Base de Supabase, analizando los documentos necesarios para realizar la implementación". El alcance acordado incluye una cuenta compartida por escuela, login en la aplicación y creación manual de las cuentas, sin registro público.

## Clarifications

### Session 2026-10-30

- Q: ¿Qué credenciales debe usar el personal para iniciar sesión con la cuenta compartida de su escuela? → A: Correo electrónico y contraseña.
- Q: ¿La aplicación debe conservar la sesión al cerrarse y abrirse de nuevo, o pedir las credenciales cada vez? → A: Conservar la sesión hasta que el usuario cierre sesión o esta venza.
- Q: ¿Qué regla de conservación debemos aplicar a los datos personales de alumnos y tutores? → A: Dejar el plazo pendiente y resolverlo antes de usar datos reales.
- Q: ¿Un mismo tutor puede estar asociado a alumnos de escuelas distintas? → A: Sí, se comparte el registro del tutor y cada escuela solo ve sus propios vínculos.

## User Scenarios & Testing

### User Story 1 — Ingresar a la aplicación como personal escolar (Priority: P1)

El personal de una escuela necesita ingresar con la cuenta compartida de su escuela para utilizar la aplicación.

**Why this priority**: El acceso autenticado es el punto de entrada a las capacidades protegidas y permite comprobar que la cuenta corresponde a una escuela.

**Independent Test**: Con una cuenta escolar previamente habilitada, iniciar sesión, cerrar la sesión y volver a intentarlo; comprobar también que credenciales inválidas no habilitan el acceso.

**Acceptance Scenarios**:

1. **Given** que la escuela tiene una cuenta habilitada, **When** un integrante del personal ingresa el correo electrónico y la contraseña válidos, **Then** accede al espacio protegido de esa escuela.
2. **Given** que las credenciales son incorrectas, **When** se intenta iniciar sesión, **Then** la aplicación informa que no pudo autenticar y no muestra datos protegidos.
3. **Given** una sesión iniciada, **When** el usuario cierra sesión, **Then** deja de acceder a las funciones y datos protegidos.
4. **Given** un dispositivo con una sesión válida, **When** se cierra y vuelve a abrir la aplicación, **Then** la sesión continúa disponible hasta que se cierre o expire.
5. **Given** que una persona no tiene una cuenta escolar habilitada, **When** abre la aplicación, **Then** no encuentra una opción para registrarse o crear una escuela.
6. **Given** una cuenta deshabilitada, una sesión vencida o falta de conexión, **When** se intenta autenticar o solicitar datos protegidos, **Then** la aplicación informa que no pudo completar la operación y no presenta datos como si se hubieran recibido correctamente.

---

### User Story 2 — Mantener los datos de cada escuela aislados (Priority: P1)

El personal necesita que el acceso compartido de su escuela permita consultar sus datos sin exponer los de otras escuelas.

**Why this priority**: Los datos de alumnos y tutores son personales y la privacidad escolar es una restricción central del producto.

**Independent Test**: Preparar datos ficticios de dos escuelas y comprobar, con cada cuenta, que sus consultas solo revelan información de su propia escuela y que no puede modificar datos de la otra.

**Acceptance Scenarios**:

1. **Given** una cuenta de la escuela A y datos de las escuelas A y B, **When** el personal consulta alumnos, tutores, pulseras o asistencias, **Then** solo recibe los datos asociados a A.
2. **Given** una cuenta de la escuela A, **When** intenta acceder o modificar datos de B, **Then** la operación es denegada y los datos de B permanecen sin cambios.
3. **Given** un intento de usar una cuenta no autenticada, **When** solicita datos escolares protegidos, **Then** no recibe información personal ni puede modificarla.
4. **Given** un tutor compartido que tiene vínculos con alumnos de las escuelas A y B, **When** cada escuela consulta sus datos, **Then** ambas pueden ver el tutor por su propio vínculo, pero ninguna puede ver el alumno ni el vínculo de la otra.

---

### User Story 3 — Conservar los datos principales del modelo escolar (Priority: P1)

El sistema necesita guardar y consultar las escuelas, alumnos, pulseras, tutores y eventos de asistencia de acuerdo con el modelo conceptual aprobado.

En 003, el almacenamiento se prepara en la base y la carga inicial se realiza mediante migraciones y aprovisionamiento administrativo confiable; esta historia no incluye pantallas ni escrituras de datos desde la aplicación.

**Why this priority**: El almacenamiento coherente es la base de las funciones posteriores de identificación, registro y sincronización.

**Independent Test**: Con datos ficticios de una escuela, comprobar las relaciones aprobadas y que las reglas de integridad impiden combinaciones inválidas sin alterar el historial existente.

**Acceptance Scenarios**:

1. **Given** un alumno, una escuela y uno o más tutores, **When** se guardan sus relaciones, **Then** el alumno pertenece a una sola escuela y se pueden representar varios tutores por alumno y varios alumnos por tutor.
2. **Given** una pulsera asignada, **When** se intenta repetir su identificador NFC en otra pulsera, **Then** el sistema rechaza la duplicación.
3. **Given** un alumno con una pulsera activa, **When** se le asigna un reemplazo, **Then** la anterior queda conservada como histórica y no hay más de una pulsera activa para ese alumno.
4. **Given** un evento de asistencia guardado, **When** se consulta o se reintenta registrar la misma identidad, **Then** el evento original conserva su identidad, alumno, tipo y momento, sin sobrescribirse ni duplicarse.
5. **Given** que aún no se aprobó una regla de conservación y eliminación, **When** se prepara el uso del sistema con datos reales de alumnos o tutores, **Then** ese uso espera hasta que la regla quede definida y documentada.

### Edge Cases

- Credenciales incorrectas, cuenta deshabilitada o cuenta que aún no fue creada.
- Sesión vencida al abrir la aplicación o al solicitar datos protegidos.
- Pérdida de conexión durante el inicio de sesión o una consulta remota; no se debe presentar un resultado remoto como confirmado si no se recibió.
- Intento de acceder a un registro de otra escuela mediante una referencia conocida o manipulada.
- Alumno sin tutor o sin pulsera activa.
- Identificador NFC ya usado, segunda pulsera activa para un alumno o relación con una entidad inexistente.
- Reemplazo de pulsera con eventos de asistencia previos.
- Reintento de un evento con identidad ya existente y evento distinto con identidad propia.

## Requirements

### Functional Requirements

- **FR-001**: La aplicación DEBE permitir que el personal inicie sesión con el correo electrónico y la contraseña de la cuenta compartida de su escuela.
- **FR-002**: DEBE existir exactamente una cuenta escolar compartida por el personal de cada escuela; no DEBEN crearse cuentas individuales ni roles de personal dentro del alcance de esta funcionalidad.
- **FR-003**: Las cuentas escolares DEBEN ser creadas manualmente por una persona administradora fuera de la aplicación. La aplicación NO DEBE ofrecer registro público ni creación de cuentas escolares.
- **FR-004**: La aplicación DEBE permitir cerrar sesión y conservar una sesión válida al cerrar y volver a abrir la aplicación, hasta que el usuario cierre sesión o la sesión venza.
- **FR-005**: Ante credenciales inválidas, cuenta deshabilitada, sesión vencida o falta de conexión, la aplicación DEBE comunicar el resultado sin revelar datos protegidos ni afirmar que una operación remota tuvo éxito cuando no fue confirmado.
- **FR-006**: El acceso autenticado DEBE quedar asociado a exactamente una escuela y limitar las consultas y modificaciones a los datos de esa escuela.
- **FR-007**: Las personas no autenticadas y las cuentas de otras escuelas NO DEBEN poder consultar ni modificar datos personales de alumnos o tutores.
- **FR-008**: La base DEBE permitir conservar y consultar escuelas, alumnos, pulseras, tutores, relaciones alumno-tutor y eventos de asistencia conforme a `docs/specs/002-data-model/data-model.md`. En 003, la carga y asociación inicial se realiza mediante migraciones y aprovisionamiento administrativo confiable; la aplicación solo consulta estos datos. Las escrituras de datos desde la aplicación requieren una funcionalidad posterior aprobada.
- **FR-009**: Cada alumno DEBE pertenecer a una sola escuela; un alumno DEBE poder tener cero o más tutores y cero o una pulsera activa.
- **FR-010**: El identificador NFC de cada pulsera DEBE ser único en todo el sistema. El reemplazo DEBE conservar la pulsera anterior como histórica y no alterar los eventos asociados al alumno.
- **FR-011**: Cada evento de asistencia DEBE distinguir entrada o salida, referirse al alumno, conservar identidad única y momento de ocurrencia, y no sobrescribir ni descartar silenciosamente un evento previo.
- **FR-012**: Una repetición de la identidad de un mismo evento DEBE poder reconocerse como el mismo evento, sin crear un segundo registro. La política para decidir si dos eventos con identidades distintas son duplicados accidentales queda fuera de esta funcionalidad.
- **FR-013**: El sistema DEBE rechazar relaciones a entidades inexistentes y estados que contradigan las cardinalidades e invariantes aprobadas.
- **FR-014**: Antes de usar datos reales de alumnos o tutores, DEBE definirse y documentarse el plazo y la regla de conservación y eliminación aplicables. Esta funcionalidad no fija por sí misma ese plazo.
- **FR-015**: Un mismo tutor DEBE poder vincularse con alumnos de distintas escuelas. Cada escuela solo DEBE poder consultar los vínculos y alumnos que le pertenecen; compartir la entidad Tutor no autoriza acceso a datos de otra escuela.

### Key Entities

- **Escuela**: organización a la que pertenece cada alumno y a la que corresponde una cuenta escolar.
- **Cuenta escolar**: correo electrónico y contraseña compartidos por el personal de exactamente una escuela; su creación es manual y no está disponible mediante registro público.
- **Alumno**: persona cuya asistencia registra la escuela; incluye únicamente los atributos aprobados en el modelo conceptual.
- **Pulsera**: identificador NFC asociado al alumno, con asignación activa o histórica.
- **Tutor**: persona relacionada con uno o más alumnos, incluso de distintas escuelas; su registro puede compartirse, pero cada escuela solo consulta sus propios vínculos y alumnos. Solo contempla los datos personales aprobados.
- **Evento de asistencia**: registro histórico de entrada o salida, asociado a un alumno y con identidad y momento de ocurrencia estables.

## Success Criteria

### Measurable Outcomes

- **SC-001**: El personal con credenciales válidas puede completar el inicio de sesión y acceder a la aplicación; el 100% de los intentos con credenciales inválidas permanece sin acceso protegido.
- **SC-002**: En pruebas con al menos dos escuelas, el 100% de las consultas autenticadas devuelve únicamente datos de la escuela correspondiente y el 100% de los intentos cruzados de lectura o modificación es denegado.
- **SC-003**: El 100% de las restricciones confirmadas del modelo —pertenencia escolar, relaciones alumno-tutor, unicidad NFC, una pulsera activa por alumno e identidad de asistencia— se verifica con casos válidos e inválidos.
- **SC-004**: Después de cerrar y reabrir la aplicación con una sesión vigente, el usuario recupera el acceso sin volver a ingresar credenciales; después de cerrar sesión, no puede acceder a datos protegidos hasta iniciar sesión nuevamente.
- **SC-005**: En todos los escenarios de reemplazo y reintento, los eventos previamente guardados permanecen identificables y sin cambios.

## Assumptions

- Una cuenta escolar puede ser utilizada por varios integrantes del personal de esa escuela; el producto no identifica cuál integrante realizó cada operación.
- La creación manual de cuentas se realiza fuera de la aplicación por una persona administradora con acceso a la consola de Supabase; no se desarrolla un panel administrativo en esta funcionalidad.
- La escuela y su cuenta deben quedar vinculadas de forma no controlable por el usuario final para aplicar el aislamiento entre escuelas.
- Un tutor puede estar relacionado con alumnos de escuelas distintas; compartir la identidad del tutor no comparte los datos de esos alumnos ni sus vínculos escolares.
- Las credenciales se distribuyen al personal por un proceso externo a la aplicación; recuperación o cambio de credenciales no se incluye hasta contar con un requisito aprobado.
- La retención de sesión habilita el acceso autenticado, pero no implica captura de asistencias ni almacenamiento offline; esos comportamientos pertenecen a etapas posteriores.
- El plazo legal de conservación de datos queda sin definir en 003; debe resolverse y documentarse antes de usar datos reales de alumnos o tutores.
- Se aplican únicamente los atributos personales aprobados en el modelo conceptual; no se agregan datos de contacto.
- La funcionalidad prepara el almacenamiento de eventos de asistencia, pero no incorpora el flujo de lectura NFC para identificar alumnos ni pantallas para registrar entradas o salidas.
- En 003, conservar datos no implica habilitar altas o modificaciones desde la app: el esquema se prepara y los datos iniciales se aprovisionan de forma administrativa; las operaciones de escritura del cliente se especificarán en sus funcionalidades correspondientes.

## Fuera de alcance

- Registro público de escuelas, alta de usuarios o panel de administración.
- Cuentas individuales, roles y auditoría de acciones por integrante del personal.
- Recuperación de contraseña y políticas operativas de rotación de credenciales.
- Identificación del alumno desde una lectura NFC y registro de entrada o salida desde la interfaz.
- Captura offline, cola local, sincronización y resolución de conflictos.
- Detección de eventos distintos que representen una duplicación accidental.
- Aplicación o acceso para tutores, notificaciones y administración avanzada.
