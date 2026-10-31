# Research: Importación y exportación de ejercicios con el repositorio común

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Fecha**: 2026-10-28

Este documento no parte de ningún `NEEDS CLARIFICATION` pendiente en el Technical Context (la especificación ya resolvió las ambigüedades funcionales con el usuario). Documenta las decisiones técnicas necesarias para pasar de la especificación al diseño, reutilizando al máximo los prerrequisitos técnicos ya fijados en [specs/001-gestion-ejercicios-fisicos/research.md](../001-gestion-ejercicios-fisicos/research.md) (Angular 22, Signals/zoneless, Signal Forms, RxJS confinado a Infrastructure, Vitest, SQLite WASM, arquitectura en capas).

## 1. Lectura pública del repositorio común mediante el índice de categorías

- **Decision**: `categorias.json` es el índice de los ids de ejercicios por categoría. La aplicación lo descarga de `main` por su URL raw y obtiene directamente los documentos `ejercicios/<id>/<id>.json` asociados a la categoría seleccionada; para una búsqueda de catálogo completo usa la unión de ids de todas las categorías. Las imágenes se leen desde `ejercicios/<id>/imagenes/<imagenId>.json`. No se lista el directorio `ejercicios` ni se requiere credencial para estas lecturas.
- **Rationale**: Evita enumerar y traer ficheros de un directorio completo en cada búsqueda, carga solamente los ejercicios pertinentes a la categoría seleccionada y conserva la lectura pública por CDN sin consumir cuota de API de contenidos.
- **Alternatives considered**: Enumerar el directorio remoto y descargar todos los ejercicios — descartado por la cantidad de ficheros descargados y la latencia innecesaria. Modificar el formato JSON de ejercicios o imágenes para guardar rutas absolutas — descartado; la estructura JSON actual se mantiene y `ruta` sigue siendo relativa al directorio del ejercicio.

## 2. Comprobación de nombre duplicado antes de subir

- **Decision**: Para comprobar si ya existe un ejercicio con el mismo nombre (ignorando mayúsculas/minúsculas y espacios al principio/final, FR-017), el adaptador obtiene los ids desde `categorias.json` y lee sus documentos por URL raw para comparar `nombre` con `normalizarNombreEjercicio`. No enumera el directorio ni necesita una llamada autenticada de listado.
- **Rationale**: Los ficheros se nombran por `id`, no por `nombre`, así que se leen los documentos indexados para hallar una coincidencia. El índice reemplaza el antiguo listado de directorio tanto para búsquedas como para comprobación de duplicados.
- **Alternatives considered**: Confiar únicamente en que el repositorio remoto rechace duplicados durante la validación automática de la pull request — rechazada porque la spec exige bloquear la subida **antes** de enviar nada (FR-017) y pedir confirmación explícita solo cuando no hay duplicado.
- **Limitación conocida**: la comprobación de duplicados debe leer los ejercicios del índice para comparar sus nombres; las búsquedas por categoría, en cambio, solo descargan los ids asociados a la categoría seleccionada.

## 3. Reutilización del token de GitHub ya guardado para un segundo repositorio fijo

- **Decision**: La acción "Subir al repositorio común" reutiliza el mismo token de acceso personal (`AjustesAplicacion.tokenGitHub`) que el usuario ya guardó para su repositorio privado de datos (FR-037 de 001); el repositorio común (`rsolerv/common-data-physical-exercises`, rama `requests`) es una constante fija de la aplicación, no un campo configurable en Ajustes. No se añade ningún campo nuevo a `AjustesAplicacion` ni a `AjustesRepositoryPort`.
- **Rationale**: El usuario pidió explícitamente reutilizar "las credenciales introducidas de GitHub"; introducir un segundo campo de configuración solo para este repositorio complicaría la pantalla de Ajustes sin que se haya pedido. Mantener el repositorio común como constante de código (no como dato de Ajustes) evita que la persona pueda apuntar por error esta función a un repositorio distinto del oficial.
- **Alternatives considered**: Pedir un token independiente dedicado al repositorio común — rechazada, añade fricción no solicitada. Ampliar `repositorioGitHub` para aceptar una lista de repositorios — rechazada, ese campo sigue representando únicamente el repositorio privado de datos del usuario (FR-037), concepto distinto del repositorio común compartido.
- **Impacto documental**: la guía de la pantalla de Ajustes (FR-037 de 001: "token *fine-grained* limitado a un único repositorio") debe actualizarse para indicar que, si la persona también quiere subir ejercicios al repositorio común, el token necesita permiso de lectura y escritura de contenidos también sobre `rsolerv/common-data-physical-exercises` (repositorio público), además de su repositorio privado de datos. Este cambio de texto se registra como tarea de esta feature sobre el componente ya existente de configuración de sincronización; no cambia el comportamiento ni el esquema de `001-gestion-ejercicios-fisicos`.
- **Referencia Living Spec**: decisión transversal añadida también en `specs/001-gestion-ejercicios-fisicos/research.md`, sección 25, referenciando esta feature.

## 4. Escritura en la rama `requests` sin control de concurrencia optimista

- **Decision**: `RepositorioComunPort.subirEjercicio()` crea ficheros **nuevos** (`ejercicios/<id>/<id>.json` y, si corresponde, `ejercicios/<id>/imagenes/<imagenId>.json`) mediante `PUT /repos/.../contents/<ruta>` con `branch: "requests"` y sin `sha`. Después actualiza `categorias.json` con el `sha` de su versión en `requests`, añadiendo el id a las categorías asociadas. No se reutiliza el mecanismo de SHA esperado de `GitHubSyncPort.escribirRemoto()` para los ficheros nuevos.
- **Rationale**: Esta feature solo sube ejercicios nuevos, nunca modifica uno existente (FR-017, "no se permiten modificaciones de ejercicios ya publicados"); por construcción no hay nunca un fichero remoto que sobrescribir en `requests ` para ese `id`, así que el control de concurrencia optimista de 001 no aplica aquí.
- **Alternatives considered**: Comprobar primero si el `id` generado ya existe en `requests` antes de subir — innecesario: el `id` del ejercicio se genera localmente como identificador único (mismo mecanismo que el resto de entidades del dominio) y no se reutiliza entre ejercicios.

## 5. Reutilización de tipos y utilidades existentes en lugar de duplicarlos

- **Decision**: El nuevo puerto reutiliza directamente los tipos ya definidos en `application/ports/github-sync.port.ts`: `ImagenArchivoJSON` (mismo documento de imagen en ambos repositorios) y `CredencialesGitHub` (mismo `tokenPAT`, con el nombre del repositorio común fijado por el adaptador, no por el usuario). La lógica de lectura de contenido con *fallback* a la API de blobs para ficheros de más de 1 MB, y la codificación/decodificación base64, se extraen de `github-sync.adapter.ts` a un util compartido de Infrastructure (`infrastructure/github-sync/github-contenido.util.ts`) usado por ambos adaptadores.
- **Rationale**: Evita duplicar formato y lógica ya probados en 001; cumple el principio SOLID de la constitución (responsabilidad única del detalle HTTP de GitHub, reutilizado por composición en lugar de copiado).
- **Alternatives considered**: Duplicar la lógica de lectura/base64 en el nuevo adaptador — rechazada por duplicación de código sin beneficio. Generalizar `GitHubSyncPort` para cubrir ambos repositorios — rechazada: mezclaría en un único puerto dos modelos de datos distintos (un documento combinado con SHA de control de concurrencia vs. un documento por entidad sin ese control), dificultando el cumplimiento de FR-007/FR-017 (acceso público sin credenciales, sin control de concurrencia en la escritura).

## 6. Conversión de formato entre el Ejercicio local y el fichero del repositorio común

- **Decision**: La conversión es casi una identidad de campos, con dos diferencias puras y testables en Domain (`convertir-ejercicio-comun.ts`):
  1. `categoriaIds`: al importar, se sustituyen por ids de categorías **propias** del usuario. Si alguna categoría común entre los ejercicios seleccionados no coincide por nombre con una propia, la interfaz presenta una única selección múltiple y aplica esa misma lista de categorías propias a todos los ejercicios seleccionados (FR-009); si todas coinciden, conserva las correspondencias por nombre. Al subir, se sustituyen por los ids de las categorías **comunes** elegidas por el usuario (FR-016). Nunca se mezclan ambos espacios de ids.
  2. `imagenes` de tipo `archivo`: el `Ejercicio` local guarda `contenidoBase64` embebido; el fichero del repositorio común solo guarda `ruta: "imagenes/<id>.json"`. La conversión separa (al subir) o reincorpora (al importar) el contenido base64 mediante un documento `ImagenArchivoJSON` independiente, exactamente como ya hace `GitHubSyncPort` en 001.
  - El campo `enlaces` (`{ tipo: 'web' | 'youtube'; url }[]`) y el campo opcional `observaciones` no requieren ninguna conversión: la entidad `Ejercicio` de 001 ya los representa con la misma forma que usa el repositorio común.
- **Rationale**: Verificado contra el código existente (`domain/ejercicio/ejercicio.entity.ts`, `application/ports/github-sync.port.ts`): el modelo local de 001 ya unificó `enlacesWeb`/`enlacesYoutube` en una única lista `enlaces` con discriminador `tipo`, igual que el formato remoto que compartió el usuario. Esto reduce la superficie de conversión a solo categorías e imágenes de archivo, ambas ya con prior art en el adaptador de sincronización de 001.
- **Alternatives considered**: Ninguna; es la lectura más directa del código existente, sin alternativas razonables.

## 7. Marca local de "ejercicio ya subido"

- **Decision**: Se añade un campo booleano `subidoRepositorioComun` a la entidad `Ejercicio` (por defecto `false`), persistido como columna `subido_repositorio_comun INTEGER` en la tabla `ejercicio` de SQLite. `EjercicioRepositoryPort` ofrece `marcarSubidoRepositorioComun()` y `quitarMarcaSubidoRepositorioComun()`; la segunda operación solo se orquesta tras acreditar a la cuenta `rsolerv`.
- **Rationale**: La marca persiste para ocultar la subida tras un envío correcto; el requisito de administración permite revertirla expresamente sin modificar el resto del ejercicio. No se guarda fecha porque la spec no pide mostrarla.
- **Alternatives considered**: Tabla de registro separada (`ejercicio_subido_comun`) — rechazada por ser una relación estrictamente 1:1 con `ejercicio`, sin necesidad de una tabla propia. Confiar solo en la comprobación remota de nombre duplicado (FR-017) sin marca local — rechazada porque exigiría una llamada de red (listar + leer `main`) solo para decidir si mostrar el botón en cada apertura de la ficha, degradando el rendimiento percibido sin necesidad.

## 8. Validación de disponibilidad de la acción de subida

- **Decision**: `cumpleRequisitoRepositorioComun(ejercicio)` (función pura de Domain) solo comprueba `imagenes.length > 0 || enlaces.some(e => e.tipo === 'youtube')`, ya que nombre, descripción y categoría son invariantes garantizados por `validar-ejercicio.ts` de 001 (FR-005/FR-006) y no necesitan revalidarse aquí. El botón de Presentation usa esta función junto con `ajustes.tokenGitHub` (ya cargado por el *shell*) y `ejercicio.subidoRepositorioComun` para decidir si se muestra.
- **Rationale**: Evita duplicar una validación que el dominio ya garantiza en todo `Ejercicio` persistido; mantiene la nueva función pura mínima y 100% cubierta por pruebas, conforme a la constitución.
- **Alternatives considered**: Repetir también nombre/descripción/categoría en la nueva función — rechazada por redundante.

## 9. Pantalla "Importar ejercicios": filtro de una sola categoría común

- **Decision**: `BuscarEjerciciosComunesUseCase.buscar(texto: string, categoriaId: string | null)` acepta como máximo un identificador de categoría común (a diferencia de `BuscarEjerciciosUseCase.buscar(texto, categoriaIds[])` de 001, que admite varias), reflejando en la firma la restricción de FR-002 de esta spec. El componente de Presentation usa un grupo de radio/selección única de Angular Material sobre las categorías comunes, sin opción "Todas", y dispara la búsqueda solo al pulsar "Buscar" (sin `effect()` automático sobre los cambios de texto/categoría).
- **Rationale**: Hacer explícita en la firma del caso de uso la restricción de una sola categoría evita que una futura ampliación de la UI reintroduzca sin querer la selección múltiple sin revisar también la spec.
- **Alternatives considered**: Reutilizar la firma `categoriaIds: string[]` de 001 limitando solo en Presentation a un elemento — rechazada por dejar la restricción de negocio únicamente en la capa de interfaz, more frágil ante refactors.

## 10. Flujo de confirmación "enviado, pendiente de revisión"

- **Decision**: Tras `RepositorioComunPort.subirEjercicio()` resolverse con éxito, `SubirEjercicioComunUseCase` marca el ejercicio como subido (sección 7) y el componente de Presentation muestra una notificación de éxito con el texto "Ejercicio enviado. Quedará pendiente de revisión antes de publicarse en el catálogo común." La aplicación no consulta el estado de la pull request ni del automerge (resuelto así en `spec.md`, Clarifications).
- **Rationale**: Traza directa a la clarificación ya resuelta con el usuario; evita introducir llamadas periódicas o un nuevo puerto de consulta de estado de PR, fuera del alcance aprobado.
- **Alternatives considered**: Ninguna (decisión ya cerrada en la especificación).

## 11. Previsualización individual de un ejercicio común

- **Decision**: Desde cada resultado se navega a `/ejercicios/importar/:id`. Application consulta un único documento mediante `RepositorioComunPort.obtenerEjercicioPorId(id)` y carga los documentos de sus imágenes de archivo para la ficha de lectura. Infrastructure obtiene `ejercicios/<id>/<id>.json` directamente de la URL raw de `main`; no lista de nuevo el catálogo ni requiere credenciales. Un 404 se representa como ejercicio no encontrado; las imágenes inválidas se omiten con aviso y los fallos de red permiten reintentar.
- **Rationale**: La previsualización necesita sobrevivir a recargas y enlaces directos, sin depender del estado temporal de la lista de resultados. La lectura por id evita volver a descargar todo el catálogo y preserva el límite de llamadas a la API de contenidos fijado en la decisión 1.
- **Presentation**: La ficha reutiliza los embeds de vídeo y enlaces web, muestra descripción, categorías e imágenes, pero no muestra observaciones ni acciones de edición/eliminación. "Importar ejercicio" invoca el mismo caso de uso y diálogo de mapeo existentes; al completar vuelve a la pantalla de importación.
- **Prototipo**: Para esta ampliación el propietario indicó expresamente que no se preparase prototipo de Storybook; se implementa la vista directamente desde este contrato, manteniendo las historias existentes sin cambios.

## 12. Índice remoto y preservación del formato JSON publicado

- **Decision**: Cada categoría incorpora `ejercicios`, un array de ids de ejercicios relacionados. La aplicación consulta ese array para seleccionar qué documentos descargar, escribe ejercicios e imágenes dentro de la carpeta del ejercicio y actualiza `categorias.json` en `requests` con el `sha` de GitHub. El JSON del ejercicio y el JSON de imagen conservan sus campos actuales; el valor de `ruta` de imagen sigue siendo relativo (`imagenes/<id>.json`).
- **Rationale**: El índice elimina la enumeración completa del directorio, mientras que los directorios por ejercicio permiten agrupar sus imágenes sin cambiar los documentos de datos existentes.
- **Referencia Living Spec**: [spec.md](./spec.md), FR-025; [contracts/repositorio-comun.port.md](./contracts/repositorio-comun.port.md).

## 13. Acreditación del administrador con la identidad GitHub autenticada

- **Decision**: La cuenta administradora se configura internamente como `rsolerv`. Cuando hay una PAT guardada, Infrastructure consulta `GET https://api.github.com/user` con esa PAT; Application compara el `login` devuelto con la cuenta configurada. La presencia del token, el campo del repositorio privado y la sincronización Google no conceden el rol. Presentation oculta las acciones hasta acreditar, y el caso de uso vuelve a comprobar identidad antes de mutar datos.
- **Rationale**: La app no tiene servidor de autenticación propio. Validar el usuario autenticado en GitHub evita tratar una PAT de cualquier cuenta como una sesión administradora, reutiliza la credencial existente y no persiste un rol falso o editable localmente.
- **Alternatives considered**: Añadir OAuth independiente — descartado al confirmarse con el propietario que la PAT ya introducida representa su sesión GitHub. Conceder el rol por mera existencia de una PAT — descartado porque no prueba que pertenezca a `rsolerv`.
- **Referencia Living Spec**: [spec.md](./spec.md), FR-026/FR-027, User Story 3.

## 14. Borrado administrativo atómico del catálogo publicado

- **Decision**: El borrado comprueba la referencia y el árbol recursivo de `main`, y aplica en una sola mutación `createCommitOnBranch` de GraphQL la actualización de `categorias.json` y la eliminación de todos los archivos bajo `ejercicios/<id>/`. La mutación incluye el SHA leído como `expectedHeadOid`; si el árbol está truncado, falta el JSON del ejercicio o cambió la referencia, aborta sin actualizar la rama.
- **Rationale**: La API REST de actualización de referencias requiere `PATCH`, que puede quedar bloqueado por el preflight CORS en navegadores. La mutación GraphQL usa `POST` desde la SPA sin añadir backend y crea el commit de forma atómica; `expectedHeadOid` evita sobrescribir cambios concurrentes.
- **Referencia Living Spec**: [spec.md](./spec.md), FR-028/FR-029; [contracts/repositorio-comun.port.md](./contracts/repositorio-comun.port.md).
