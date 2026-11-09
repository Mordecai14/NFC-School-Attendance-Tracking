# Roadmap — Asistencia escolar NFC

**Meta del MVP:** registrar entradas y salidas con pulseras NFC desde Android, incluso sin Internet, y sincronizarlas después sin perder eventos.

Este es el mapa de trabajo del proyecto, no una secuencia rígida. Cada bloque explica qué se busca, qué falta y cómo reconocer el resultado. Una casilla marcada indica que se comprobó, no solamente que se escribió código.

Las tareas usan identificadores como `03-01`: el primer número indica el bloque y el segundo identifica la tarea. Conservar los identificadores existentes al actualizar el roadmap y asignar uno nuevo a cada tarea agregada.

## Vista general

| Bloque | Resultado | Estado |
|---|---|---|
| 01 — Lectura NFC | Leer y distinguir pulseras en Android. | Completado con límites conocidos. |
| 02 — Modelo conceptual | Definir entidades y reglas principales. | Completado; no implica tablas creadas. |
| 03 — Acceso escolar y datos | Autenticarse y acceder solo a los datos autorizados de una escuela. | En curso; solo setup básico. |
| 04 — Identificación | Mostrar el alumno asociado a una pulsera. | Pendiente. |
| 05 — Asistencia offline | Registrar entradas y salidas aunque no haya conexión. | Pendiente. |
| 06 — Sincronización y duplicados | Enviar pendientes sin perderlos ni duplicarlos. | Pendiente. |
| 07 — Jornada de prueba | Comprobar el recorrido completo en condiciones reales. | Pendiente. |

**Siguiente paso:** avanzar en el bloque 03, confirmando primero el proyecto de Supabase Cloud que se usará para desarrollo. El orden puede ajustarse si se mantienen la seguridad y la confiabilidad.

## Lo que existe hoy

### 01 — Lectura NFC

La app detecta pulseras y muestra su identificador, el estado del lector y un historial reciente. Se probó en un Android real con dos pulseras: el operador confirmó identificadores distintos y estables en lecturas repetidas, incluso después de reabrir la app. También confirmó la recuperación después de desactivar y reactivar NFC.

**Límites de esa prueba:** una exposición sostenida produjo una lectura duplicada; no se repitió en dos ensayos posteriores. El manejo de errores se comprobó con un estado controlado, no con una falla física de radio. La prevención de duplicados sigue pendiente y no debe confiarse solo al lector NFC.

### 02 — Modelo conceptual

Ya se definieron las entidades principales: escuela, alumno, pulsera, tutor y evento de asistencia. Un alumno pertenece a una escuela y no es un usuario autenticado; puede tener varios tutores y como máximo una pulsera activa. Una pulsera reemplazada se conserva en el historial. Los eventos pertenecen al alumno, son históricos y no deben sobrescribirse.

El identificador de una pulsera debe ser único; el UID NFC por sí solo no garantiza protección contra clonación. Los eventos necesitan una identidad global estable entre reintentos. Esto es diseño conceptual: **todavía no hay tablas, restricciones ni políticas implementadas**.

## Ahora

### 03 — Acceso escolar y datos con Supabase

**Resultado:** entrar con una cuenta escolar de prueba, conservar la sesión al reabrir, cerrar sesión y acceder únicamente a los datos de esa escuela. La base contiene datos ficticios suficientes para probar el aislamiento.

**Por qué sigue esto:** antes de mostrar alumnos en la app necesitamos una identidad autenticada y protección en la base, no solo filtros en la pantalla.

**Ya preparado:** CLI de Supabase, ejemplo de variables de entorno y configuración básica del workspace. Eso no confirma que haya un proyecto remoto seleccionado, vinculado o validado.

**Pendiente:**

- [ ] **03-01** Confirmar o crear el proyecto de desarrollo en Supabase Cloud y verificar que es el destino correcto antes de cualquier cambio remoto.
- [ ] **03-02** Vincular la CLI y configurar localmente la URL y la publishable key; no incluir claves secretas en la app ni en Git.
- [ ] **03-03** Configurar Auth en el Dashboard: cuentas creadas administrativamente, sin signup público; comprobar que signup se rechaza y que una cuenta autorizada puede iniciar sesión.
- [ ] **03-04** Crear migraciones versionadas para las entidades, relaciones y restricciones necesarias, incluido el historial inmutable de eventos.
- [ ] **03-05** Activar grants mínimos y RLS desde la creación de las tablas expuestas; cargar datos ficticios de al menos dos escuelas con las protecciones activas.
- [ ] **03-06** Comprobar acceso propio y rechazo de acceso cruzado, anónimo y de usuarios sin escuela; incluir el caso de un tutor compartido sin exponer vínculos de otra escuela.
- [ ] **03-07** Implementar login, sesión persistente, comprobación de asociación escolar y logout en la app, con errores comprensibles.
- [ ] **03-08** Probar el recorrido en Android y ejecutar los checks pertinentes. No habilitar consultas escolares en la app antes de validar RLS.

**Cómo saber que terminó:** una cuenta de prueba entra, reabre la app conservando la sesión y sale; las pruebas de base demuestran que no puede consultar datos de otra escuela. La [decisión de Supabase](decisions/supabase-auth-and-school-isolation.md) reúne el enfoque propuesto y sus límites.

**No incluye:** panel administrativo, API propia, registro de asistencias ni uso de datos reales. La configuración de Auth se realiza en el Dashboard remoto; `supabase/config.toml` no modifica el servicio hospedado. No ejecutar `supabase db reset` en la nube.

## Después

### 04 — Identificar al alumno

**Resultado:** acercar una pulsera registrada y ver el nombre, grado y grupo del alumno autorizado; una pulsera desconocida muestra un mensaje claro.

- [ ] **04-01** Consultar la pulsera activa y su alumno dentro de la escuela autorizada.
- [ ] **04-02** Mostrar el resultado y distinguir una pulsera desconocida, inactiva o un error de consulta.
- [ ] **04-03** Definir el alcance mínimo de alta y asignación antes de crear un flujo en la app; inicialmente los datos pueden cargarse administrativamente.
- [ ] **04-04** Preparar la identificación offline con datos locales previamente autorizados cuando se desarrolle la captura sin conexión.

**Comprobar:** una pulsera conocida identifica al alumno correcto, una desconocida no lo inventa y una cuenta de otra escuela no accede a sus datos. Depende del acceso y aislamiento del bloque 03.

### 05 — Registrar entrada y salida sin Internet

**Resultado:** el personal identifica a un alumno, registra una entrada o salida y recibe confirmación, aunque la conexión falle.

- [ ] **05-01** Definir el flujo de entrada/salida y mostrar hora, resultado y errores recuperables.
- [ ] **05-02** Guardar cada evento histórico con identidad y hora de ocurrencia estables, sin sobrescribir eventos anteriores.
- [ ] **05-03** Persistir los eventos en el dispositivo, mantener una cola de pendientes y conservarla al cerrar y reabrir la app.
- [ ] **05-04** Mostrar cuándo un evento está pendiente de sincronización y no descartarlo silenciosamente ante errores.
- [ ] **05-05** Incorporar confirmación visual y feedback sonoro/háptico discreto.
- [ ] **05-06** Permitir identificar offline con datos locales autorizados; resolver su actualización y protección antes de usar datos reales.

**Comprobar:** sin Internet se registran entradas y salidas, se confirma el resultado y los pendientes sobreviven al reinicio. La captura y la persistencia offline se entregan juntas si es necesario: no dar por terminado un registro que dependa de Internet.

### 06 — Sincronización y duplicados

**Resultado:** los eventos pendientes llegan a Supabase al recuperar conexión, incluso después de interrupciones o reintentos, sin pérdidas ni duplicados por sincronización.

- [ ] **06-01** Enviar pendientes y reintentar de forma segura al volver la conexión.
- [ ] **06-02** Usar la identidad estable del evento y operaciones idempotentes en backend.
- [ ] **06-03** Distinguir eventos pendientes, confirmados y errores que requieran atención; conservar los que no se hayan confirmado.
- [ ] **06-04** Prevenir lecturas accidentales repetidas en la app y aplicar protección adecuada también en backend, sin confundirlas con eventos reales distintos.
- [ ] **06-05** Probar cortes durante el envío, respuestas inciertas, reintentos y sincronizaciones repetidas.

**Comprobar:** después de desconectar durante un envío y reintentar, cada evento confirmado aparece una sola vez y ningún pendiente desaparece silenciosamente. Depende de la persistencia del bloque 05.

### 07 — Prueba de jornada escolar

**Resultado:** operar el recorrido completo con un Android y varias pulseras, sin pérdidas de asistencia.

- [ ] **07-01** Probar una secuencia rápida de entradas y salidas, pulseras desconocidas y lecturas repetidas.
- [ ] **07-02** Repetir el recorrido con Internet estable, intermitente y ausente, y cerrar y reabrir la app con pendientes.
- [ ] **07-03** Verificar que los eventos locales llegan a Supabase sin pérdidas ni duplicados y que el aislamiento escolar se mantiene.
- [ ] **07-04** Registrar y corregir los problemas bloqueantes descubiertos; repetir las comprobaciones afectadas.

**Comprobar:** una jornada de prueba con datos ficticios completa el recorrido y los registros esperados coinciden con los sincronizados.

## Riesgos y decisiones pendientes

- **Privacidad:** no usar datos reales de menores en desarrollo ni exponerlos en logs. Antes de datos reales hay que definir retención y eliminación.
- **Sin conexión:** resolver cómo almacenar, actualizar y proteger los datos mínimos autorizados para identificar alumnos offline.
- **Duplicados:** una lectura repetida puede ser accidental, pero dos eventos distintos también pueden ser legítimos. Definir la regla cuando se implemente, sin descartar eventos silenciosamente.
- **Pulseras:** faltan decisiones sobre reutilización de pulseras retiradas y transferencias entre escuelas.
- **Acceso:** la propuesta actual usa una cuenta compartida por escuela; el acceso de tutores queda fuera del MVP escolar.

## Más adelante

App para tutores con asociación a uno o varios alumnos, consulta del historial autorizado y notificaciones de eventos sincronizados. También quedan para después la administración avanzada de alumnos y dispositivos, los reportes, las métricas y un panel administrativo complejo. Nada de esto bloquea el MVP operativo de la escuela.
