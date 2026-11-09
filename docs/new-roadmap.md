# Roadmap — Asistencia Escolar NFC

> **Meta del MVP:** registrar entradas y salidas de alumnos con pulseras NFC desde Android, incluso sin internet, y sincronizar los eventos al recuperar la conexión.
>
> **Cómo trabajamos:** una funcionalidad pequeña a la vez. No es obligatorio generar `spec.md`, `plan.md` y `tasks.md` para cada cambio. La calidad se comprueba con resultados, pruebas y revisión del código.

## Vista rápida

```text
[✅ 01 NFC] → [🔜 02 Datos + Supabase] → [03 Pulsera → alumno]
                                          ↓
[08 Prueba real] ← [07 Sync y duplicados] ← [06 Offline] ← [05 Entrada/salida] ← [04 Acceso operador]
                                          ↓
                                   [MVP ESCUELA]
                                          ↓
                                [App para tutores]
```

**Leyenda:** ✅ validado · 🔄 en desarrollo · ⬜ pendiente · 🔜 siguiente sugerido · ⏳ posterior.

**Estado de referencia:** `01` fue reportada como terminada; marca ✅ sólo cuando la prueba con Android y pulseras reales haya pasado. Las demás actividades son pendientes hasta confirmación en el repo.

## 🟢 Ahora

### 01 — Lectura NFC · ✅ Implementada (validación física por confirmar)
**Resultado visible:** acercar una pulsera al Android y ver su identificador.

- [ ] El mismo brazalete entrega el mismo identificador en lecturas repetidas.
- [ ] Brazaletes diferentes se distinguen.
- [ ] Se muestra el estado del lector y errores recuperables.
- [ ] Probado en dispositivo Android real con pulseras reales.

**Nota:** Ya se trabajó como `001-nfc-reading` con Spec Kit. Conserva sus documentos; no los rehagas.

### 02 — Datos y Supabase · 🔜 Siguiente
**Resultado verificable:** contar con datos de prueba de alumnos y pulseras vinculadas en una base segura, listos para consultarse desde la app.

- [ ] Definir entidades mínimas: escuela, alumno, pulsera, tutor y evento de asistencia.
- [ ] Crear tablas, relaciones y restricciones en Supabase mediante migraciones versionadas.
- [ ] Definir separación entre alumnos y usuarios autenticados.
- [ ] Establecer políticas de acceso (RLS) para las tablas expuestas.
- [ ] Cargar datos de prueba **ficticios**.

**Evitar:** panel administrativo, API propia y automatizaciones sin necesidad.

## 🟡 Después

### 03 — Identificar alumno · ⬜
**Resultado visible:** escanear una pulsera registrada y mostrar el alumno correspondiente.

- [ ] Consultar alumno por pulsera.
- [ ] Mostrar nombre, grado y grupo.
- [ ] Informar cuando la pulsera no está asignada.
- [ ] Resolver el flujo mínimo de asignación de pulseras sin crear un panel complejo.

### 04 — Acceso del operador · ⬜
**Resultado visible:** sólo personal autorizado puede utilizar las funciones de registro.

- [ ] Inicio y cierre de sesión.
- [ ] Permisos mínimos por escuela o rol.
- [ ] No exponer datos de alumnos sin autorización.

### 05 — Registrar entrada y salida · ⬜
**Resultado visible:** escanear, identificar alumno, registrar entrada/salida, confirmar visual y sonoramente, y seguir con el siguiente.

- [ ] Registrar eventos históricos de entrada y salida sin sobrescribirlos.
- [ ] Mostrar hora y resultado de la operación.
- [ ] Distinguir errores y acciones no válidas.
- [ ] Agregar feedback sonoro/háptico discreto.

### 06 — Registro sin internet · ⬜
**Resultado visible:** poder registrar eventos durante la jornada escolar aunque falle el Wi-Fi.

- [ ] Guardar localmente eventos en SQLite.
- [ ] Mantener cola persistente de eventos pendientes.
- [ ] Conservar los pendientes al cerrar y abrir la app.
- [ ] Mostrar si un evento está pendiente de sincronizar.
- [ ] Resolver cómo identificar alumnos offline con datos locales previamente autorizados.

### 07 — Sincronización y duplicados · ⬜
**Resultado verificable:** enviar eventos pendientes sin perderlos ni duplicarlos.

- [ ] Reintentar al recuperar conexión.
- [ ] Usar identificadores únicos de evento e inserciones idempotentes.
- [ ] Prevenir doble escaneo accidental en la app.
- [ ] Aplicar protección también en backend.
- [ ] Probar desconexión durante sincronización y reintentos.

### 08 — Prueba de jornada escolar · ⬜
**Resultado verificable:** operación continua con un solo Android y varias pulseras.

- [ ] Probar secuencia rápida de entradas y salidas.
- [ ] Probar pulseras desconocidas y lecturas repetidas.
- [ ] Probar internet estable, intermitente y ausente.
- [ ] Comprobar que los registros locales llegan a Supabase sin pérdidas ni duplicados.
- [ ] Corregir los problemas bloqueantes descubiertos.

## 🔵 Más adelante — App del tutor

- [ ] Asociar uno o varios alumnos con sus tutores.
- [ ] Mostrar la última entrada/salida y el historial autorizado.
- [ ] Enviar notificaciones cuando se confirme un evento sincronizado.
- [ ] Diseñar una experiencia simple para los tutores.

**No bloquea el MVP operativo de la escuela.**

---

## Cómo desarrollar cada bloque con IA (flujo ligero)

**Para una funcionalidad normal:**

1. **Define el resultado** en 5–10 líneas: qué debe hacer, qué no debe hacer y cómo verificarlo.
2. **Pide un plan corto al agente:** archivos por tocar, decisiones importantes, riesgos. Apruébalo o corrígelo.
3. **Implementa** por cambios pequeños; el agente puede escribir el código.
4. **Verifica**: lint/typecheck, pruebas necesarias y test manual del flujo.
5. **Revisa el diff y haz commit**. Actualiza este roadmap y `docs/architecture.md` sólo si cambió algo relevante.

**Usa Spec Kit completo únicamente cuando haya alto riesgo o muchas incógnitas**, por ejemplo: diseño de sincronización, reglas de seguridad o una decisión de arquitectura difícil de revertir.

### Prompt reutilizable para OpenCode

```text
Vamos a implementar el bloque [NÚMERO — NOMBRE] de docs/roadmap.md.

Lee AGENTS.md, docs/product.md, docs/architecture.md y sólo la sección correspondiente del roadmap.

Antes de escribir código, dame un plan breve (máximo 8 puntos) con:
- resultado observable;
- archivos a modificar;
- decisiones o riesgos relevantes;
- cómo comprobaremos que funciona.

No generes specs, planes ni tareas Markdown adicionales salvo que detectes un riesgo importante y lo justifiques.
No agregues librerías ni abstracciones por adelantado.
Espera mi aprobación del plan antes de implementar.
Después implementa, ejecuta las validaciones disponibles y resume resultados, pendientes y archivos modificados.
No hagas commit por tu cuenta.
```

## Reglas del roadmap

- **Una casilla marcada = comprobada**, no sólo código generado.
- Las etapas pueden dividirse o reagruparse si simplifica la entrega; no son contratos.
- La seguridad de acceso y la integridad de los eventos **no se posponen por conveniencia** cuando una funcionalidad ya maneja datos reales.
- Los datos reales de menores no deben usarse en desarrollo ni exponerse en logs.
- Evita documentación duplicada: este archivo indica *qué sigue*; `architecture.md` describe *cómo está construido hoy*.
