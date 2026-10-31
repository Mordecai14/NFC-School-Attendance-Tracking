# Investigación técnica: Base de Supabase y acceso escolar

## Decisiones

### Usar migraciones SQL como fuente de verdad

- **Decisión**: versionar esquema, restricciones, grants, RLS y políticas en `supabase/migrations/`; ejecutar y probar localmente antes de aplicar cambios a un proyecto remoto.
- **Motivo**: las migraciones son revisables, reproducibles y permiten reconstruir la base desde cero.
- **Alternativa descartada**: mantener el esquema únicamente con cambios manuales en Dashboard; provoca diferencias no registradas entre entornos.
- **Fuentes**: [Database migrations](https://supabase.com/docs/guides/deployment/database-migrations), [Supabase CLI](https://supabase.com/docs/guides/cli).

### Vincular cada cuenta a una escuela en datos confiables

- **Decisión**: guardar `auth_user_id` como FK única y no nula en `schools`. Una fila escolar corresponde a una sola cuenta Auth y una cuenta no puede pertenecer a dos escuelas. Los usuarios Auth aún no asociados no obtienen acceso a datos.
- **Motivo**: cumple una cuenta por escuela, es simple y evita confiar en información editable desde el cliente.
- **Alternativas descartadas**: `user_metadata` como fuente de autorización (el usuario puede cambiarla); una clave privilegiada en la aplicación (omite RLS); y una API backend propia (fuera del alcance aprobado).
- **Provisionamiento**: crear la cuenta por un flujo administrativo de Supabase y después asociarla a una escuela en un contexto confiable. Mantener desactivado el registro público, sin deshabilitar el proveedor de correo/contraseña usado para iniciar sesión.
- **Fuentes**: [Auth users](https://supabase.com/docs/guides/auth/users), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [API keys](https://supabase.com/docs/guides/getting-started/api-keys).

### Aplicar aislamiento mediante grants y RLS

- **Decisión**: habilitar RLS en cada tabla expuesta, otorgar solo operaciones requeridas a `authenticated` y denegar acceso de datos a `anon`. Las políticas derivan la escuela desde `auth.uid()` y la relación de cuenta en `schools`.
- **Motivo**: la autorización se aplica en la base aunque una consulta del cliente omita filtros o manipule identificadores. Los grants son una barrera distinta de las políticas RLS y también deben revisarse.
- **Alternativas descartadas**: filtrar únicamente desde React Native (no es una frontera de seguridad) y conceder privilegios amplios suponiendo que RLS los revoca (RLS no reemplaza grants).
- **Advertencia**: `service_role`/secret tiene `BYPASSRLS`; no debe estar en el cliente ni en variables públicas.
- **Fuentes**: [Securing your API](https://supabase.com/docs/guides/api/securing-your-api), [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security).

### Representar tutores compartidos con relaciones visibles por escuela

- **Decisión**: conservar una fila global por Tutor y una tabla de vínculo `student_tutors`. RLS muestra una fila de tutor solo si existe un vínculo con un alumno de la escuela autenticada; la tabla de vínculo solo muestra vínculos cuyo alumno pertenece a esa escuela.
- **Motivo**: el usuario confirmó que un tutor puede vincularse con alumnos de escuelas distintas y 002 define una relación muchos-a-muchos.
- **Protección adicional**: en 003 el cliente no actualiza ni crea tutores o vínculos globales; esas operaciones requieren el contexto administrativo confiable hasta que una feature defina el flujo de gestión. Así una escuela no altera la ficha compartida ni agrega vínculos a otra escuela.
- **Alternativa descartada**: duplicar la identidad del tutor por escuela, pues contradice el vínculo compartido confirmado y puede divergir el nombre.
- **Prueba requerida**: el mismo tutor vinculado a alumnos de A y B aparece para ambas cuentas solo a través de sus propios vínculos; ninguna cuenta ve el alumno ni el vínculo de la otra.

### Persistir la sesión nativa con SecureStore

- **Decisión**: usar `expo-secure-store` para guardar la sesión Supabase en Android; centralizar inicio/detención de auto-refresh con `AppState`. Mantener un adaptador de almacenamiento compatible con la plataforma si el proyecto requiere inicializar la app web, sin convertir login web en criterio de aceptación de 003.
- **Motivo**: la sesión persiste según FR-004 y contiene tokens; el almacenamiento cifrado nativo reduce exposición frente a almacenamiento plano.
- **Alternativa considerada**: AsyncStorage, utilizado por algunos ejemplos de Supabase; es más simple pero no cifra el contenido. Se elige SecureStore por tratar datos de alumnos.
- **Compatibilidad**: instalar módulos nativos con `expo install`. La matriz oficial de Expo consultada vincula SDK 58 con React Native 0.88 y lista `expo-secure-store ~58.0.2`; comprobar dependencias finales con `expo install --check`.
- **Fuentes**: [Supabase React Native quickstart](https://supabase.com/docs/guides/auth/quickstarts/react-native), [Expo SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/), [Expo SDK mappings](https://github.com/expo/expo/blob/main/packages/install-expo-modules/src/utils/expoVersionMappings.ts).

### Probar RLS y restricciones con fixtures sintéticos

- **Decisión**: usar pgTAP en `supabase/tests/` y ejecutar `supabase test db`. Preparar dos escuelas, sus usuarios, alumnos, una pulsera duplicada inválida y un tutor compartido.
- **Motivo**: las pruebas evalúan las reglas con roles y subjects Auth distintos, incluidas denegaciones de lectura y escritura, sin usar datos reales.
- **Fuentes**: [Testing Row Level Security](https://supabase.com/docs/guides/database/postgres/testing-row-level-security), [Database testing](https://supabase.com/docs/guides/database/testing).

## Restricciones conocidas

- No se definió escala, SLO de disponibilidad, latencia, retención ni observabilidad adicional. No inventarlos para esta fase; revisar antes de uso productivo.
- El plazo legal de retención debe acordarse antes de cargar datos reales.
- No se incorporan importaciones, exportaciones, API propia, CRUD de escuela ni flujos de captura offline.
- El repositorio no tiene actualmente Supabase CLI instalado; se propone incluirlo como dependencia de desarrollo y fijarlo mediante pnpm.
