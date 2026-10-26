# Research: Sincronización con cuenta de Google sin credenciales técnicas



**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Fecha**: 2026-10-26

Este documento resuelve las decisiones técnicas de la feature. Los prerrequisitos técnicos generales (Angular, Signals, zoneless, Material, SQLite WASM, Vitest, arquitectura en capas y despliegue) son los de [la investigación de la feature 001](../001-gestion-ejercicios-fisicos/research.md) y no se repiten aquí. Las decisiones transversales se han trasladado a ese documento (secciones 22 a 24), con referencia a esta feature.

La spec no deja ningún `NEEDS CLARIFICATION`. Las incógnitas técnicas son las del enfoque 100 % cliente con Google; cada hecho indica su estado:

- **Verificado**: contrastado con la documentación oficial de Google el 2026-10-26.
- **Por validar**: no consta en la documentación consultada. Se comprueba en las verificaciones técnicas previas (V1–V4) de [quickstart.md](./quickstart.md) para confirmar los adaptadores y aplicar las alternativas previstas.

## 1. Mecanismo de autorización sin backend

- **Decision**: Usar el modelo de tokens de *Google Identity Services* (`google.accounts.oauth2.initTokenClient`). La persona elige cuenta y concede el permiso en la ventana de Google; la aplicación recibe un token de acceso de vida corta y llama directamente a la API de Drive desde el navegador. El token vive solo en memoria, nunca se persiste ni se sincroniza. En el código solo existe el identificador público de cliente.
- **Rationale**: Es el único flujo de Google que no necesita servidor ni `client_secret` (constitución, sección "Sincronización de datos"). **Verificado**: el modelo de tokens se basa en la concesión implícita, no requiere guardar tokens de refresco y está pensado para llamar a las API de Google por REST/CORS directamente desde el navegador. Un token nuevo se solicita con `requestAccessToken()` desde un evento de usuario cuando caduca; como la sincronización es siempre manual (FR-006), la renovación siempre cuelga de la pulsación de "Sincronizar ahora", que es un gesto de usuario y evita el bloqueo de ventanas emergentes.
- **Alternatives considered**: Flujo de código de autorización (`initCodeClient`) — rechazado: el código se intercambia por tokens en un servidor, lo que exige backend y secreto de cliente, prohibidos por la constitución. Guardar el token de acceso en SQLite — rechazado: caduca en torno a una hora, lo guardaría sin cifrar sin beneficio y complicaría FR-018 (eliminarlo al desconectar). Librería `gapi.client` de Google — rechazada: añade una dependencia de terceros mayor que el pequeño cliente HTTP necesario.
- **Por validar (V1)**: que la renovación con `prompt: ''` y `login_hint` de la cuenta ya conectada se complete sin intervención o con una ventana que se cierra sola. Si Google exigiera interacción, FR-013 ya lo cubre con el estado "Volver a conectar".

## 2. Permiso solicitado y cuenta mostrada

- **Decision**: Solicitar únicamente `https://www.googleapis.com/auth/drive.appdata`. Mostrar la cuenta conectada con `GET /drive/v3/about?fields=user(displayName,emailAddress)`.
- **Rationale**: **Verificado**: `drive.appdata` figura en la lista de permisos *no sensibles* de Drive ("ver y gestionar los datos de configuración de la propia aplicación") y `about.get` acepta ese mismo permiso, de modo que FR-004 (permiso mínimo) se cumple sin pedir `openid` ni `email`. Tras la respuesta se comprueba con `hasGrantedAllScopes` que el permiso se concedió realmente (permisos granulares).
- **Alternatives considered**: Añadir `openid email` y consultar el endpoint de información de usuario — rechazado: un permiso más y otro endpoint sin necesidad. `drive.file` — rechazado: exige el selector de ficheros de Google y no es una carpeta oculta de la app.
- **Por validar (V4)**: el aspecto real de la pantalla de consentimiento y si aparece aviso de "aplicación no verificada" con el estado de publicación elegido. Al ser un permiso no sensible no debería requerir verificación, pero depende de la configuración del proyecto en Google Cloud (ver sección 12). FR-024 cubre el caso con un texto informativo.

## 3. Espacio privado y disposición de ficheros

- **Decision**: Guardar los ficheros en la carpeta de datos de la aplicación (`appDataFolder`), con la misma estructura lógica que en GitHub: `datos.json` e `imagenes/<id>.json`. La carpeta de Drive es plana, así que el adaptador traduce la ruta lógica a un nombre de fichero (`imagenes/<id>.json` → `imagenes__<id>.json`; `datos.json` no cambia). El listado de ficheros (`files.list` con `spaces=appDataFolder`, `fields=files(id,name,size,version,createdTime)`, ordenado por `createdTime`) se hace una sola vez por sincronización y se reutiliza para localizar ids de fichero. Si por una carrera aparece más de un `datos.json`, se usa el más antiguo, para que todos los dispositivos elijan el mismo.
- **Rationale**: **Verificado**: la carpeta de datos de la aplicación es oculta, solo accesible por la aplicación que la creó y no desde la interfaz de Drive, se crea sola al crear el primer fichero, y la persona puede borrarla manualmente o al desinstalar la aplicación (caso límite de la spec: se trata como "sin datos remotos"). Reutilizar el formato `ExportacionJSON` y los documentos de imagen conserva el mandato de la constitución de que todo se sincroniza en JSON y minimiza el cambio.
- **Alternatives considered**: Carpeta visible en "Mi unidad" — rechazada: contradice FR-003 (espacio privado, no mezclado con ficheros personales) y exigiría un permiso más amplio. Un único fichero con todo incrustado — rechazado por el mismo motivo que en GitHub (crecimiento, tiempos de subida). Subcarpeta real `imagenes` — rechazada: obliga a buscarla y a gestionar su id sin beneficio.

## 4. Versión remota y control de concurrencia

- **Decision**: La "versión remota" de Google es el campo `version` de `datos.json`, tratado como texto opaco. Protocolo de escritura: (1) subir las imágenes nuevas, (2) releer `version` de `datos.json` inmediatamente antes de escribirlo y, si no coincide con la esperada, lanzar `ErrorConflictoRemoto` sin escribir, (3) actualizar `datos.json` en último lugar y guardar la `version` que devuelve. Como `datos.json` es lo último que se escribe, una sincronización interrumpida deja el estado remoto consistente (a lo sumo, imágenes huérfanas inofensivas).
- **Rationale**: **Verificado**: `version` es un número creciente que refleja cada cambio del fichero en el servidor, así que sirve para detectar que otro dispositivo escribió. **No consta** en la documentación consultada ninguna escritura condicional (`If-Match`/ETag) en Drive v3, por lo que no puede garantizarse atomicidad; queda una ventana de milisegundos entre la comprobación y la escritura. Es aceptable porque cada cuenta es de una sola persona (FR-005) y la sincronización es manual; se documenta como limitación conocida y FR-009 se cumple "en la medida en que el servicio lo permite": la comprobación previa convierte en conflicto la inmensa mayoría de los casos.
- **Alternatives considered**: Comparar `modifiedTime` — rechazada: no es monótona de forma fiable entre dispositivos. Comparar el contenido completo — rechazada: obliga a descargar siempre `datos.json`. Un fichero "candado" — rechazado: complejidad y estados atascados si un dispositivo se cierra a medias.
- **Por validar (V3)**: si Drive acepta `If-Match` con el ETag en `files.update`. Si lo hace, el paso (2) se sustituye por la escritura condicional sin cambiar el contrato del puerto.

## 5. Subida de ficheros

- **Decision**: Usar siempre subida reanudable (`uploadType=resumable`, dos peticiones por fichero) para crear y actualizar, con el mismo código para `datos.json` y las imágenes. Las imágenes se suben antes que `datos.json` y solo si no existen ya en el listado o si su tamaño remoto difiere del que se va a subir.
- **Rationale**: **Verificado**: la documentación recomienda la subida simple o multiparte para ficheros de hasta 5 MB y la reanudable para el resto o con riesgo de cortes. Un documento de imagen puede llegar a unos 6,7 MB en base64 (límite de 5 MB por imagen, FR-008), por lo que un único mecanismo reanudable evita ramificar. Omitir imágenes ya presentes mantiene SC-006 (menos de 10 s con una biblioteca habitual) sin releer ni resubir lo que no cambia.
- **Alternatives considered**: Subida multiparte para todo — rechazada por la recomendación de 5 MB. Subir siempre todas las imágenes (como hace el adaptador de GitHub) — rechazado por tiempo, ya que una subida son dos peticiones.
- **Por validar (V2)**: que el navegador puede leer la cabecera `Location` de la sesión reanudable (CORS). Alternativa si no puede: subida multiparte también para los documentos de más de 5 MB (permitida técnicamente aunque no recomendada), manteniendo el mismo puerto.

## 6. Puerto neutro y selección del proveedor

- **Decision**: Introducir en Application el puerto `ProveedorSincronizacionPort` (leer remoto, escribir remoto y leer imagen, sin credenciales como parámetro y con una `version` opaca en lugar de un SHA). Dos adaptadores en Infrastructure: `ProveedorGithubSync`, una capa fina sobre el `GithubSyncAdapter` y el `GitHubSyncPort` actuales (lee token y repositorio de los ajustes y traduce SHA ↔ versión), y `ProveedorGoogleDriveSync`. Un delegado registrado como implementación del puerto elige el adaptador según el método activo guardado en ajustes. El caso de uso `SincronizarGithubUseCase` pasa a ser `SincronizarUseCase` y no conoce ningún proveedor. El caso de uso puro `decidir-accion-sincronizacion` se mantiene con su tabla de decisión; solo cambia el nombre del campo `sha` por `version` en sus tipos.
- **Rationale**: Cumple SOLID (abierto a nuevos proveedores, cerrado a la modificación del caso de uso) y el principio de capas de la constitución: Application define el puerto y Infrastructure lo implementa. Conserva intacto el adaptador y el contrato de GitHub, de modo que FR-017 y SC-009 (GitHub sigue igual) se comprueban con las pruebas existentes.
- **Alternatives considered**: Un segundo caso de uso `SincronizarGoogleUseCase` copiando la orquestación — rechazado por duplicar lógica (subir, descargar, conflicto, marcas de ajustes). Modificar el contrato `GitHubSyncPort` para que sirva a ambos — rechazado: arrastra conceptos de GitHub (`tokenPAT`, `repositorio`) a Google. Un registro de proveedores configurable por plugin — rechazado por excesivo para dos destinos.

## 7. Cambio de método o de cuenta

- **Decision**: Guardar en ajustes el método activo (`github`, `google` o ninguno), la cuenta de Google mostrada y el **destino de la última sincronización** (`github` o `google:<correo>`). Una función pura de Domain compara el destino actual con el guardado: si difieren, la versión sincronizada se trata como nula y se aplica la regla de primera sincronización (FR-016). Solo hay un método activo: conectar Google con GitHub configurado, o al revés, se rechaza con un mensaje que pide desconectar antes.
- **Rationale**: Implementa FR-016 sin borrar nada del destino anterior ni cambiar el comportamiento de GitHub con el mismo destino. Una migración marca `github` como método y destino en las instalaciones existentes que ya tengan token y versión sincronizada.
- **Alternatives considered**: Poner a nulo la versión al conectar cualquier método — rechazado: cambiaría el comportamiento de GitHub al reconfigurar el mismo repositorio. Guardar una versión por destino — rechazado: la spec exige que cambiar de destino se comporte como una primera sincronización.

## 8. Copia manual como ZIP con estructura de sincronización

- **Decision**: "Exportar copia de seguridad" genera un único `.zip` con `datos.json` en la raíz y una carpeta hermana `imagenes/` con un JSON por imagen (`imagenes/<id>.json`). "Importar copia de seguridad" abre el ZIP en memoria, valida `datos.json`, las rutas y cada imagen con una función pura de Domain (`validar-copia-seguridad`), pide confirmación y reemplaza los datos locales reutilizando la importación existente. `ExportarImportarDatosUseCase.importar` recibe un resolvedor de imágenes (función ruta → imagen): el proveedor remoto aporta `leerImagen` y la copia manual resuelve desde los archivos ZIP. Tras importar se marcan cambios locales pendientes. El ZIP no incluye ajustes, tokens ni la cuenta (FR-018, escenario 5 de la historia 4).
- **Rationale**: La usuaria pidió conservar `datos.json` y las imágenes como archivos hermanos en `imagenes/`. Un ZIP mantiene esa estructura y sigue siendo un único archivo portable; los selectores y descargas web normales no pueden leer ni crear carpetas hermanas de forma interoperable. El empaquetado ZIP vive en Presentation, Application solo intercambia nombres de archivo y texto JSON.
- **Alternatives considered**: JSON único con imágenes incrustadas — sustituido porque no conserva la carpeta solicitada. APIs de acceso a carpetas del navegador — descartadas por diferencias de soporte, permisos y experiencia entre navegadores. ZIP manual sin librería — descartado por añadir complejidad al tratamiento de cabeceras y compresión; se usa `fflate`.

## 9. Estado de la conexión, renovación y desconexión

- **Decision**: `GoogleAutorizacionPort` (Application) con `conectar`, `obtenerTokenAcceso` y `desconectar`; implementación en Infrastructure que carga el script de Google bajo demanda, guarda token y caducidad en memoria y traduce los errores de la ventana (`popup_closed`, `popup_failed_to_open`, permiso denegado) a errores de dominio. `desconectar` olvida el token local, borra el método y la cuenta de los ajustes y revoca el permiso en Google como mejor esfuerzo; nunca borra ficheros de la carpeta de datos de la app (FR-012). Un 401 de Drive o una renovación fallida produce `ErrorAutorizacionGoogle`, que la interfaz traduce en "Volver a conectar" (FR-013).
- **Rationale**: Aísla la API del navegador y de Google detrás de un puerto (probable con dobles en Vitest) y deja los mensajes en español de España en la capa de presentación. Revocar al desconectar evita dejar un permiso vivo que la persona cree retirado.
- **Alternatives considered**: Mantener el permiso concedido al desconectar — rechazado: la acción "Desconectar cuenta" debe poder entenderse como retirar el acceso. Detectar la caducidad con un temporizador — rechazado: se comprueba al sincronizar, que es cuando hace falta.

## 10. Carga bajo demanda del script de Google

- **Decision**: El script `https://accounts.google.com/gsi/client` se inserta dinámicamente solo cuando la persona pulsa "Conectar con Google" o sincroniza con Google; nunca en `index.html`. Si falla la carga (sin conexión o bloqueado), se informa en la propia pantalla como error de conexión.
- **Rationale**: Google exige servir ese script desde su dominio (no se puede incluir en el paquete). Cargarlo bajo demanda mantiene el resto de la aplicación disponible sin conexión y sin solicitudes a terceros, coherente con la decisión de no depender de CDN para la interfaz (feature 001, sección 16).
- **Alternatives considered**: Cargarlo siempre desde `index.html` — rechazado: solicitudes a Google en cada arranque, incluso para quien no usa la sincronización.

## 11. Prototipo y aprobación previos en Storybook

- **Decision**: La nueva pantalla de sincronización (varios métodos, estados de la conexión, copia manual y confirmaciones) es un **cambio grande de presentación**. Antes de implementar los componentes, el agente `ux-ui-expert` crea las historias de Storybook descritas en [contracts/interfaz-usuario.md](./contracts/interfaz-usuario.md), las presenta y espera la aprobación explícita del propietario (principio V de la constitución).
- **Rationale**: Es obligatorio por constitución para un rediseño de pantalla existente y para un flujo nuevo. Las historias de la pantalla de sincronización existentes se amplían en lugar de crear un sistema paralelo.
- **Alternatives considered**: Implementar directamente y revisar después — rechazado por constitución (principio V).

## 12. Registro de la aplicación en Google Cloud (acciones del propietario)

Pasos únicos que hace el propietario del producto, no la persona usuaria, antes de la validación manual de [quickstart.md](./quickstart.md):

1. Crear un proyecto en Google Cloud y activar la API de Google Drive.
2. Configurar la pantalla de consentimiento con el permiso `drive.appdata` y los textos en español.
3. Crear un identificador de cliente de tipo *aplicación web* y añadir como origen JavaScript autorizado el origen de GitHub Pages (solo esquema y dominio, sin ruta) y el de desarrollo local.
4. Copiar el identificador de cliente, que es público, en el fichero de configuración del adaptador (`google-drive.config.ts`).
5. Mientras la aplicación esté en modo de prueba, añadir como usuarios de prueba los correos que vayan a validar; para abrirla a cualquiera, publicarla en producción.

Los pasos 4 y 5 dependen de su configuración real y no constan como verificados: se confirman en V4.

## Verificaciones técnicas previas pendientes

| Id | Qué se valida | Si falla |
|---|---|---|
| V1 | La renovación del token con la cuenta ya conectada no exige interacción visible | Se muestra "Volver a conectar" (FR-013); sin cambio de diseño |
| V2 | La subida reanudable funciona desde el navegador (cabecera `Location` legible) | Subida multiparte también para documentos grandes |
| V3 | Drive admite escritura condicional con ETag (`If-Match`) | Se mantiene la comprobación previa de `version` |
| V4 | La pantalla de consentimiento y el estado de publicación no muestran avisos inesperados | Ajustar el texto de FR-024 y la configuración del proyecto |
