# Contrato: Adaptador de Google (autorización y Drive)



**Capa**: Infrastructure · **Implementa**: `GoogleAutorizacionPort` (`GoogleIdentityAutorizacion`) y `ProveedorSincronizacionPort` (`ProveedorGoogleDriveSync`) · **Decisiones**: [research.md](../research.md), secciones 1 a 5, 9 y 10

Los Observables de `HttpClient` quedan confinados al adaptador; hacia Application se exponen `Promise`, como en el adaptador de GitHub. Este contrato describe lo que el adaptador hace con servicios externos; la spec describe lo que ve la persona.

## Configuración

| Elemento | Valor |
|---|---|
| Identificador de cliente | Constante pública `GOOGLE_CLIENT_ID` en `google-drive.config.ts` (nunca un secreto) |
| Permiso solicitado | `https://www.googleapis.com/auth/drive.appdata` (único) |
| Script de autorización | `https://accounts.google.com/gsi/client`, insertado dinámicamente solo al conectar o sincronizar con Google |
| Base de la API | `https://www.googleapis.com/drive/v3` y `https://www.googleapis.com/upload/drive/v3` |
| Cabecera | `Authorization: Bearer <token en memoria>` en cada petición |

Si `GOOGLE_CLIENT_ID` está vacío, `conectar()` falla con `ErrorAutorizacionGoogle` y se muestra como un error de conexión normal.

## Autorización (`GoogleIdentityAutorizacion`)

| Operación | Comportamiento |
|---|---|
| `conectar()` | Carga el script si falta, solicita el token (cuenta y permiso), comprueba con `hasGrantedAllScopes` que se concedió `drive.appdata` y lee la cuenta con `GET /about?fields=user(displayName,emailAddress)`. Guarda token y caducidad solo en memoria |
| `obtenerTokenAcceso()` | Devuelve el token si le queda más de un margen de seguridad; si no, solicita uno nuevo con `prompt: ''` y `login_hint` de la cuenta conectada. Se invoca siempre desde la pulsación de "Sincronizar ahora" (gesto de usuario) |
| `desconectar()` | Descarta el token en memoria y llama a `google.accounts.oauth2.revoke` como mejor esfuerzo; un fallo de red no impide desconectar |

Traducción de los resultados de la ventana de Google:

| Resultado de Google | Error de dominio |
|---|---|
| `popup_closed`, o el permiso se deniega o no se concede por completo | `ErrorConexionCancelada` |
| `popup_failed_to_open` | `ErrorVentanaBloqueada` |
| No se puede cargar el script de Google | `ErrorRedSincronizacion` |
| Cualquier otro error de autorización | `ErrorAutorizacionGoogle` |

El script de Google se envuelve en una función propia y reemplazable (acceso a `window.google`) para poder sustituirlo por un doble en las pruebas de Vitest.

## Disposición en la carpeta de datos de la aplicación

| Ruta lógica | Nombre en Drive | Contenido |
|---|---|---|
| `datos.json` | `datos.json` | `ExportacionJSON` |
| `imagenes/<id>.json` | `imagenes__<id>.json` | `ImagenArchivoJSON` |

Todos los ficheros llevan `parents: ["appDataFolder"]` al crearse y `mimeType: application/json`.

## Llamadas a Drive

| Operación del puerto | Peticiones |
|---|---|
| Listado (una vez por sincronización) | `GET /files?spaces=appDataFolder&orderBy=createdTime&pageSize=1000&fields=files(id,name,size,version)`; con `nextPageToken` si hay más de una página |
| `leerRemoto()` | Listado; si no hay `datos.json` → `{ existe: false }`; si existe, `GET /files/{id}?alt=media` y se devuelve `version` del listado |
| `leerImagen(ruta)` | Listado; `GET /files/{id}?alt=media` del nombre traducido |
| `escribirRemoto(...)` | 1) Para cada imagen que no exista en el listado o con tamaño distinto: subida reanudable (creación o actualización). 2) `GET /files/{id}?fields=version` de `datos.json` y comparación con `versionEsperada`; si no coincide, `ErrorConflictoRemoto`. 3) Subida reanudable de `datos.json` pidiendo `fields=version` en la respuesta, que se devuelve como `versionNueva` |

La subida reanudable usa `POST` con `uploadType=resumable` para abrir la sesión tanto al crear como al actualizar; al actualizar incluye `X-HTTP-Method-Override: PATCH` para evitar que el preflight CORS del navegador bloquee el método `PATCH`. La URL de la cabecera `Location` recibe el contenido mediante `PUT`. Si `versionEsperada` es nula y ya existe `datos.json` (otro dispositivo lo creó entre medias), se lanza `ErrorConflictoRemoto`.

Cuando exista más de un fichero con el mismo nombre, se usa el más antiguo (listado ordenado por `createdTime`).

## Traducción de errores HTTP

| Respuesta | Error de dominio |
|---|---|
| Sin respuesta (estado 0), 429 o 5xx | `ErrorRedSincronizacion` |
| 401 | `ErrorAutorizacionGoogle` |
| 403 por permiso insuficiente | `ErrorAutorizacionGoogle` |
| 403 por límite de uso | `ErrorRedSincronizacion` |
| 404 al leer `datos.json` | Se interpreta como "no existe" |
| Versión remota distinta de la esperada | `ErrorConflictoRemoto` |

Ningún error modifica datos locales.

## Seguridad

- El token de acceso nunca se registra en consola ni en mensajes de error, y no se incluye en ningún documento sincronizado.
- El documento sincronizado no contiene el correo ni los ajustes.
- La aplicación solo puede leer y escribir en su propia carpeta de datos; no consulta ni lista ningún otro fichero de la cuenta.

## Verificaciones técnicas previas

Este contrato se confirma con V1 a V3 de [quickstart.md](../quickstart.md). Los resultados pueden cambiar solo el detalle de la renovación (V1), la subida de documentos grandes (V2) o la comprobación de versión (V3), no el contrato del puerto.
