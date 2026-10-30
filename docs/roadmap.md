# Roadmap

Este roadmap define el orden aproximado de las capacidades necesarias para completar el MVP.

No es un contrato rígido.

Puede cambiar conforme aparezcan nuevos aprendizajes técnicos o de producto.

## Now

### 001 — Lectura NFC

Objetivo:

Validar que un dispositivo Android pueda leer de forma confiable las pulseras NFC que utilizará la escuela y obtener un identificador estable.

Estado:

En implementación.

Criterio de salida:

- distintas pulseras pueden distinguirse;
- la misma pulsera mantiene el mismo identificador;
- los errores de lectura son manejados;
- la lectura funciona en un dispositivo Android real.

---

## Next

### 002 — Modelo de datos

Objetivo:

Definir cómo representar:

- escuelas;
- alumnos;
- pulseras;
- tutores;
- eventos de asistencia.

Resultado esperado:

Un modelo consistente que pueda soportar el flujo completo del MVP.

### 003 — Base de Supabase

Objetivo:

Crear la infraestructura mínima necesaria para almacenar y consultar los datos principales del sistema.

Incluye inicialmente:

- PostgreSQL;
- estructura de tablas;
- relaciones;
- restricciones;
- configuración básica de seguridad.

### 004 — Identificación de alumno mediante pulsera

Objetivo:

Permitir que una pulsera NFC conocida identifique al alumno asociado.

Flujo esperado:

Pulsera NFC  
→ identificador  
→ búsqueda  
→ alumno

### 005 — Registro de entrada y salida

Objetivo:

Permitir registrar eventos de entrada y salida para un alumno identificado.

Los eventos deben conservar historial y no sobrescribirse.

### 006 — Persistencia offline

Objetivo:

Permitir registrar asistencias aunque el dispositivo no tenga conexión a Internet.

Los eventos deben almacenarse localmente hasta poder sincronizarse.

### 007 — Sincronización

Objetivo:

Sincronizar automáticamente con el backend los eventos pendientes cuando vuelva la conexión.

La sincronización debe evitar pérdida silenciosa de registros.

### 008 — Protección contra duplicados y conflictos

Objetivo:

Evitar registros accidentales causados por:

- múltiples lecturas consecutivas;
- reintentos;
- sincronización repetida;
- eventos duplicados.

### 009 — Validación en escenario real

Objetivo:

Probar el sistema en condiciones similares a una jornada escolar.

Validar especialmente:

- múltiples alumnos;
- lecturas consecutivas;
- funcionamiento offline;
- recuperación de conexión;
- sincronización;
- errores;
- reapertura de la aplicación.

---

## Later

Capacidades posteriores al MVP inicial:

- aplicación para tutores;
- notificaciones;
- administración avanzada de alumnos;
- administración de dispositivos;
- panel administrativo;
- reportes;
- métricas de asistencia.

## Regla de evolución

Antes de comenzar una nueva feature:

1. cerrar y validar la feature actual;
2. revisar aprendizajes obtenidos;
3. confirmar que la siguiente feature sigue siendo la prioridad correcta;
4. actualizar este roadmap si cambió alguna dependencia o riesgo;
5. crear la nueva especificación.
