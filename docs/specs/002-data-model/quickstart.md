# Guía de validación: Modelo de datos del MVP

Esta guía valida el artefacto conceptual; no requiere instalar ni ejecutar la aplicación.

## Prerrequisitos

- Leer [spec.md](spec.md), [data-model.md](data-model.md) y [checklists/requirements.md](checklists/requirements.md).
- Usar únicamente ejemplos ficticios; no introducir nombres o identificadores reales de alumnos, tutores o pulseras.

## Revisión

1. Ejecutar `git diff --check` desde la raíz del repositorio. **Resultado esperado**: sin errores relacionados con espacios en blanco.
2. Revisar el ejemplo de escuela/alumno y verificar una escuela por alumno.
3. Revisar el ejemplo de tutor compartido y verificar varios tutores por alumno y varios alumnos por tutor.
4. Revisar el reemplazo de pulsera y verificar que queda una activa como máximo, el identificador NFC es globalmente único, la anterior permanece histórica y las asistencias no se alteran.
5. Revisar eventos creados sin conexión en dispositivos distintos: cada uno debe tener identidad globalmente única; los reintentos del mismo evento conservan identidad y momento de ocurrencia.
6. Revisar los datos personales: escuela identificada por nombre; alumno con nombre, grado y grupo; tutor con nombre y vínculo; sin datos de contacto.
7. Revisar el límite de visibilidad: solo personal autorizado de la escuela correspondiente consulta el detalle; los ejemplos no exponen información a personas no autorizadas ni a otra escuela. Esto valida la regla documental, no una autorización implementada.
8. Comprobar cada ítem de `checklists/requirements.md` y registrar cualquier contradicción antes de avanzar.

## Resultado esperado

La revisión puede seguir todos los escenarios sin contradicciones, campos personales no aprobados, exposición indebida, políticas inventadas ni dependencia de decisiones de almacenamiento o sincronización. No se ejecutan lint, TypeScript ni pruebas de la aplicación porque esta funcionalidad no modifica código.
