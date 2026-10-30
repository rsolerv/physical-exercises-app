# Feature Specification: Importación y exportación de ejercicios con el repositorio común

**Feature Branch**: `003-importar-exportar-ejercicios`

**Created**: 2026-10-28

**Status**: Draft

**Input**: User description: "Tengo un repositorio publico en GitHub desde donde quiero que los usuarios importen y exporten ejercicios individuales. Repositorio común de ejercicios: repositorio público `rsolerv/common-data-physical-exercises`, con ramas `main` y `requests`; un fichero JSON por ejercicio en `/ejercicios`, imágenes en `/imagenes` y categorías comunes en `categorias.json` al mismo nivel. Los usuarios importan ejercicios eligiendo entre el catálogo común y suben los que marquen; las planificaciones no se suben. La rama `main` valida y fusiona automáticamente lo que llega a `requests` mediante pull request automático. 1) Nueva opción de menú 'Importar ejercicios' con una pantalla similar a 'Buscar' (buscador de texto + categorías del repositorio común, selección de una sola categoría, sin opción 'Todas', botón 'Buscar' explícito, resultados con casillas de selección y botón 'Importar'); si alguna categoría del ejercicio no existe para el usuario, se le pide indicar la categoría propia equivalente; importar descarga de `main` los datos y las imágenes y los añade a la biblioteca del usuario. 2) Subida de ejercicios: solo disponible con credenciales de GitHub guardadas; se ofrece desde la ficha o edición de un ejercicio ya creado; antes de subir se elige una categoría del repositorio común remoto; se bloquea si ya existe un ejercicio con el mismo nombre (ignorando mayúsculas y espacios); pide confirmación porque no se puede repetir; exige al menos una imagen o un enlace de YouTube, además de nombre, descripción y categoría."

## Contexto y relación con otras especificaciones

- Esta especificación añade una nueva capacidad de intercambio de ejercicios con un repositorio público y compartido entre todos los usuarios. Es independiente de la sincronización de datos propios del usuario definida en [specs/001-gestion-ejercicios-fisicos/spec.md](../001-gestion-ejercicios-fisicos/spec.md) (repositorio privado de datos) y ampliada en [specs/002-sincronizacion-google-drive/spec.md](../002-sincronizacion-google-drive/spec.md) (Google Drive): no sustituye ni modifica su comportamiento.
- Reutiliza las entidades **Ejercicio** y **Categoría** del usuario definidas en el [modelo de datos de 001](../001-gestion-ejercicios-fisicos/data-model.md). **Categoría** no cambia; **Ejercicio** se amplía únicamente con el nuevo campo local `subidoRepositorioComun` (FR-021), detallado en el modelo de datos de esta feature.
- Reutiliza las credenciales de GitHub (token de acceso personal) que el usuario ya puede haber guardado según FR-037 de 001, con independencia de cuál sea su método de sincronización activo (GitHub o Google, FR-017 de 002).
- El modelo de almacenamiento y sincronización local de los datos del usuario **no cambia**: todos sus ejercicios, categorías, planificaciones y progreso siguen viviendo en un único documento `datos.json` (`ExportacionJSON`, ver el [contrato de sincronización de GitHub de 001](../001-gestion-ejercicios-fisicos/contracts/github-sync.port.md)), junto con sus imágenes de archivo en documentos independientes. El formato de un fichero JSON por ejercicio (`/ejercicios`) es exclusivo del repositorio común remoto: importar añade los ejercicios descargados a ese `datos.json` del usuario, y subir convierte el ejercicio elegido del formato único local al formato de fichero independiente que usa el repositorio común.
- Las decisiones técnicas transversales (formato de los documentos remotos, cliente HTTP, control de concurrencia) se registrarán en [specs/001-gestion-ejercicios-fisicos/research.md](../001-gestion-ejercicios-fisicos/research.md) durante la fase de plan, referenciando esta feature.

## Clarifications

### Session 2026-10-28

- Q: Antes de subir, la aplicación comprueba que no exista ya un ejercicio con el mismo nombre. ¿Contra qué lista de ejercicios remotos se hace esa comprobación? → A: Solo contra los ejercicios ya publicados en la rama `main`; no se comprueban los ejercicios todavía pendientes de validación en `requests` (posibles colisiones temporales las resuelve el repositorio remoto).
- Q: Tras pulsar "Subir" y enviar el ejercicio a la rama `requests`, el repositorio común valida y fusiona automáticamente con reglas externas a la aplicación. ¿Qué debe comunicar la aplicación sobre el resultado final de esa validación? → A: La aplicación considera terminada la acción en cuanto el envío a `requests` se realiza correctamente, mostrando un mensaje de "enviado/pendiente de revisión"; no consulta ni informa después del resultado final de la validación ni de la fusión automática.

## Decisiones de producto

- Repositorio común: GitHub público `rsolerv/common-data-physical-exercises`, con una carpeta `/ejercicios` (un fichero JSON por ejercicio, nombrado con su `id`: `ejercicios/<id>.json`), una carpeta `/imagenes` (un fichero JSON por imagen de tipo archivo, nombrado igualmente con su `id`: `imagenes/<id>.json`, con el mismo formato que las imágenes del repositorio privado de datos) y un fichero `categorias.json` al mismo nivel con todas las categorías comunes (`id` y `nombre`).
- Cada fichero de `/ejercicios` contiene `id`, `nombre`, `descripcion`, `categoriaIds` (una o varias referencias por `id` a `categorias.json`, igual que el ejercicio del usuario puede pertenecer a una o varias categorías propias), `enlaces` (una lista unificada de enlaces, cada uno con `tipo` —por ejemplo `"youtube"` para vídeos, u otro valor para enlaces web— y `url`) e `imagenes` (cada una con `id`, `tipo` —`"archivo"`, referenciando su `ruta` `imagenes/<id>.json`, o `"url"`— ); por ejemplo:
  ```json
  {
    "id": "32baae03-9dd4-49f5-bb8b-ad9df443f1b9",
    "nombre": "Almeja",
    "descripcion": "Tumbada de lado con las rodillas dobladas por delante de la pelvis levantar una rodilla sin dejar de juntar las puntas de los pies. Se puede usar una banda encima de las rodillas para darle más dificultad.",
    "categoriaIds": ["0fdee16c-1a5b-4b9c-88b6-4f4ec4d8618a", "46d85989-4755-4567-860d-c7d235b2f295"],
    "enlaces": [{ "tipo": "youtube", "url": "https://www.youtube.com/watch?v=LZ7ci0drcqw" }],
    "imagenes": [{ "id": "975d0977-961d-4a9c-af3b-d478ced45b0b", "tipo": "archivo", "ruta": "imagenes/975d0977-961d-4a9c-af3b-d478ced45b0b.json" }]
  }
  ```
  Este formato por fichero, con enlaces unificados (`enlaces[]` con `tipo`) y categorías por referencia (`categoriaIds[]`), es exclusivo del repositorio común; al importar o subir, la aplicación DEBE convertir entre este formato y el modelo local del usuario (que mantiene `enlacesWeb` y `enlacesYoutube` como listas separadas y las categorías como referencias a las categorías propias).
- Un ejercicio del repositorio común puede estar asociado a una o varias categorías comunes (`categoriaIds`), igual que el ejercicio del usuario puede pertenecer a una o varias categorías propias; esto aplica tanto a los ejercicios que ya existen en `main` como a los que se importan o se suben. Al **subir** un ejercicio, el usuario elige directamente entre las categorías del repositorio común (una o varias, según corresponda al ejercicio) para asociarlas como `categoriaIds`; esta elección es independiente de las categorías propias del usuario y **no crea, modifica ni renombra ninguna categoría propia**.
- La rama `main` contiene los datos ya validados y es la única fuente de lectura para importar. La rama `requests` es el único destino de las subidas; la aplicación nunca escribe en `main` ni gestiona la pull request automática ni las reglas de validación que fusionan `requests` en `main`: son responsabilidad del propio repositorio remoto, fuera del alcance de esta especificación.
- Importar ejercicios **no requiere** credenciales de GitHub guardadas: al leerse como contenido público de la rama `main`, cualquier usuario puede importar, tenga o no configurada alguna sincronización (GitHub o Google) y tenga o no credenciales de GitHub guardadas. Subir ejercicios **sí requiere** tener credenciales de GitHub guardadas en la aplicación (el mismo token de acceso ya usado para la sincronización avanzada de 001/002); si no están guardadas, la acción de subir no está disponible, con independencia de si el usuario sincroniza sus propios datos con Google, con GitHub o no sincroniza en absoluto.
- La pantalla "Importar ejercicios" reutiliza la disposición visual de "Buscar" (buscador de texto + lista de categorías), pero muestra las categorías del repositorio común (no las del usuario), selecciona la primera categoría disponible al entrar, permite seleccionar como máximo una categoría a la vez, no ofrece una opción "Todas" y solo permite buscar cuando hay una categoría seleccionada. La búsqueda se dispara solo al pulsar un botón "Buscar" explícito, no automáticamente.
- Importar nunca sobrescribe ni fusiona con ejercicios existentes del usuario: cada ejercicio importado se añade siempre como una entrada nueva e independiente en su biblioteca.
- Si alguna categoría de un ejercicio seleccionado para importar no coincide por nombre con ninguna categoría del usuario, la aplicación pide, antes de completar la importación, que el usuario indique con cuál de sus categorías existentes se corresponde; esa categoría sustituye a la original en el ejercicio importado. Si el usuario no tiene ninguna categoría propia, la importación se bloquea con un mensaje que le indica crear primero al menos una.
- Subir un ejercicio es una acción disponible desde la ficha de detalle y desde la edición de un ejercicio ya guardado por el usuario; no está disponible mientras se está creando un ejercicio todavía sin guardar.
- Antes de subir, se muestran las categorías del repositorio común remoto (no las propias del usuario) y se exige elegir al menos una para asociarla al ejercicio; puede elegir varias si corresponde. Esta elección no crea, modifica ni renombra ninguna categoría propia del usuario: las categorías comunes y las propias son conjuntos independientes.
- Solo se suben ejercicios nuevos: si ya existe en la rama `main` del repositorio común un ejercicio cuyo nombre coincide, ignorando mayúsculas/minúsculas y los espacios al principio y al final, la subida se bloquea y se informa al usuario; no se permiten modificaciones de ejercicios ya publicados. La comprobación no consulta los ejercicios todavía pendientes de validación en la rama `requests`.
- Un ejercicio solo puede subirse una vez: tras una subida correcta, la aplicación recuerda localmente que ya se subió y no vuelve a ofrecer la acción para él, aunque después se edite su nombre u otros datos.
- Requisitos mínimos para poder subir un ejercicio: nombre, descripción y al menos una categoría común asignados, y al menos una imagen (de cualquier tipo, URL o archivo) o al menos un enlace de YouTube.
- Subir pide confirmación explícita antes de enviarse, advirtiendo de que la acción no se puede deshacer ni repetir para ese ejercicio. Una vez enviado correctamente a `requests`, la aplicación da la acción por completada mostrando un mensaje de "enviado, pendiente de revisión"; no consulta ni informa después del resultado final de la validación o fusión automática del repositorio remoto.
- Las planificaciones, el progreso diario y los ajustes propios del usuario nunca se suben ni se leen del repositorio común; solo se intercambian ejercicios y, cuando corresponda, sus categorías e imágenes asociadas.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Importar ejercicios del repositorio común (Priority: P1)

Como usuario quiero buscar ejercicios en el catálogo público compartido por todos los usuarios y añadir a mi biblioteca los que me interesen, para ampliar mis ejercicios disponibles sin tener que crearlos manualmente ni buscar contenido equivalente en otras fuentes.

**Why this priority**: Es el valor principal de la feature y aporta beneficio inmediato por sí solo: cualquier usuario, incluso quien nunca suba nada, puede enriquecer su biblioteca a partir del catálogo común. No depende de la historia de subida para funcionar ni para demostrarse.

**Independent Test**: Puede probarse completamente accediendo desde el menú principal a "Importar ejercicios", buscando por texto y por una categoría del repositorio común, seleccionando uno o varios resultados con sus casillas, pulsando "Importar", eligiendo las categorías propias que se aplicarán a todos los ejercicios si se solicita, y comprobando que aparecen en la biblioteca del usuario (visibles desde "Buscar") con su descripción, enlaces e imágenes.

**Acceptance Scenarios**:

1. **Given** que el usuario abre "Importar ejercicios" desde el menú principal y hay categorías comunes disponibles, **When** se carga la pantalla, **Then** ve un buscador de texto y la lista de categorías del repositorio común (no las suyas propias), con la primera categoría seleccionada, sin ninguna opción "Todas" y permitiendo seleccionar como máximo una categoría.
2. **Given** que el usuario ha escrito un texto o mantiene seleccionada una categoría común, **When** pulsa "Buscar", **Then** obtiene un listado de ejercicios del repositorio común que coinciden, cada uno con una casilla de selección.
3. **Given** que el usuario desmarca todas las categorías, **When** la pantalla muestra los filtros, **Then** el botón "Buscar" está deshabilitado y no se ejecuta ninguna búsqueda; al seleccionar una categoría, el botón vuelve a habilitarse.
4. **Given** que el listado de resultados está vacío, **When** se muestra la pantalla, **Then** aparece un estado vacío indicativo, no un error.
5. **Given** que el usuario marca una o varias casillas de resultados, **When** hay al menos una selección, **Then** aparece un botón "Importar"; si no hay ninguna selección, el botón no se muestra.
6. **Given** que el usuario tiene seleccionados ejercicios cuyas categorías existen todas en su biblioteca por nombre, **When** pulsa "Importar", **Then** los ejercicios se añaden directamente a su biblioteca con esas categorías, sus enlaces y sus imágenes.
7. **Given** que al menos una categoría de los ejercicios seleccionados no existe en la biblioteca de categorías del usuario, **When** pulsa "Importar", **Then** se le pide, antes de completarse la importación, que indique con cuál de sus categorías existentes se corresponde cada categoría no reconocida.
8. **Given** que el usuario no tiene ninguna categoría propia creada, **When** intenta importar, **Then** la aplicación se lo impide e indica que debe crear antes al menos una categoría.
9. **Given** que un ejercicio importado contiene una imagen de tipo archivo cuyo documento remoto falta o es inválido, **When** se completa la importación, **Then** el resto de los datos y las imágenes válidas se importan igualmente y se informa del número de imágenes omitidas.
10. **Given** que el usuario importa un ejercicio cuyo nombre ya existe en su propia biblioteca, **When** se completa la importación, **Then** el ejercicio se añade igualmente como una entrada nueva e independiente, sin fusionarse ni sobrescribir el existente.
11. **Given** que no hay conexión o el repositorio común no está disponible durante la búsqueda o la importación, **When** ocurre el fallo, **Then** la aplicación informa del error sin perder datos locales ni dejar una importación a medias.
12. **Given** que aparecen resultados de búsqueda, **When** el usuario activa "Ver ejercicio" en uno de ellos, **Then** se abre una ficha remota de solo lectura con sus datos completos y la acción "Importar ejercicio"; al volver, conserva los filtros, resultados y selección anteriores.

---

### User Story 2 - Subir un ejercicio propio al repositorio común (Priority: P2)

Como usuario con credenciales de GitHub guardadas, quiero compartir con el resto de usuarios un ejercicio que he creado y que cumple los requisitos mínimos, para contribuir al catálogo común y que otros puedan encontrarlo y aprovecharlo.

**Why this priority**: Aporta valor añadido una vez que ya existe un catálogo común que importar (User Story 1); depende de tener ya un ejercicio propio creado que cumpla los requisitos mínimos, por lo que es una ampliación secundaria y no bloquea el uso de la importación.

**Independent Test**: Con un ejercicio propio ya creado que tenga nombre, descripción, categoría y al menos una imagen o un enlace de YouTube, y con credenciales de GitHub guardadas, abrir su ficha o su edición, pulsar "Subir al repositorio común", elegir una o varias categorías comunes, confirmar, y comprobar que la acción deja de ofrecerse para ese ejercicio; repetir el intento con un nombre ya existente en el repositorio común y comprobar que se bloquea.

**Acceptance Scenarios**:

1. **Given** que el usuario no tiene credenciales de GitHub guardadas, **When** consulta la ficha o la edición de un ejercicio propio, **Then** no encuentra disponible la acción "Subir al repositorio común".
2. **Given** que el usuario tiene credenciales de GitHub guardadas y el ejercicio no tiene ni imágenes ni enlaces de YouTube, **When** consulta su ficha o edición, **Then** la acción "Subir al repositorio común" no está disponible.
3. **Given** que el usuario tiene credenciales de GitHub guardadas y el ejercicio tiene nombre, descripción y al menos una imagen o un enlace de YouTube, **When** consulta su ficha o edición, **Then** encuentra disponible la acción "Subir al repositorio común".
4. **Given** que el usuario consulta la ficha de un ejercicio elegible desde un móvil o una tablet, **When** abre el menú de las elipsis, **Then** encuentra "Subir al repositorio común" inmediatamente antes de "Eliminar"; en escritorio, la acción permanece junto a las acciones principales de la ficha.
5. **Given** que el usuario pulsa "Subir al repositorio común", **When** se muestra el siguiente paso, **Then** debe elegir al menos una categoría de la lista de categorías del repositorio común remoto antes de continuar, sin que esta elección afecte a sus categorías propias.
6. **Given** que el usuario ha elegido una categoría común, **When** el sistema comprueba el nombre del ejercicio contra los ejercicios ya publicados en el repositorio común, **Then**, si coincide ignorando mayúsculas/minúsculas y espacios al principio o al final con uno existente, se bloquea la subida y se informa al usuario sin enviar nada.
7. **Given** que el nombre no coincide con ningún ejercicio publicado, **When** continúa el flujo, **Then** se le pide confirmación explícita, advirtiendo de que la acción no podrá deshacerse ni repetirse para ese ejercicio.
8. **Given** que el usuario confirma la subida, **When** el envío a la rama `requests` se completa correctamente, **Then** la aplicación muestra un mensaje de confirmación de envío pendiente de revisión y dicho ejercicio deja de ofrecer la acción "Subir al repositorio común" en adelante, aunque se edite después.
9. **Given** que el usuario cancela la confirmación, **When** decide no continuar, **Then** no se envía ningún dato y el ejercicio conserva disponible la acción para subirlo más adelante.
10. **Given** que no hay conexión o las credenciales de GitHub no son válidas durante la subida, **When** ocurre el fallo, **Then** la aplicación informa del error, no marca el ejercicio como subido y permite reintentarlo.

### Edge Cases

- ¿Qué ocurre si dos usuarios intentan subir un ejercicio con el mismo nombre antes de que el primero se valide y fusione en `main`? Dado que la comprobación de duplicados solo se hace contra `main`, ambos envíos a `requests` podrían aceptarse en la aplicación; la resolución final (aceptar uno, rechazar otro o fusionar ambos) es responsabilidad de las reglas de validación automática del repositorio remoto, fuera del alcance de esta especificación.
- ¿Qué ocurre si el usuario importa un ejercicio y, después, lo modifica localmente? El ejercicio importado se comporta como cualquier otro ejercicio propio: puede editarse, eliminarse y, si cumple los requisitos mínimos, subirse de nuevo al repositorio común (sujeto a la comprobación de nombre duplicado).
- ¿Qué ocurre si el repositorio común no tiene todavía ninguna categoría o ningún ejercicio publicado? La pantalla "Importar ejercicios" y el selector de categoría al subir muestran un estado vacío indicativo, no un error.
- ¿Qué ocurre si un ejercicio común referencia una imagen de archivo que ya no existe o con un formato distinto al esperado? Se omite únicamente esa imagen, se continúa con el resto de datos e imágenes válidas, y se informa del número de imágenes omitidas (FR-011).
- ¿Qué ocurre si el usuario pierde la conexión entre la selección de ejercicios a importar y la confirmación de "Importar"? La operación se cancela sin aplicar cambios parciales y se informa del error.
- ¿Qué ocurre si se intenta subir un ejercicio sin categorías comunes disponibles para elegir? La subida no puede continuar hasta que el repositorio común tenga al menos una categoría publicada; se informa al usuario.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: La aplicación DEBE ofrecer una opción "Importar ejercicios" en el menú principal, visible en todos los dispositivos conforme a la navegación definida en 001.
- **FR-002**: La pantalla "Importar ejercicios" DEBE mostrar un buscador de texto y una lista de categorías leída de `categorias.json` en la rama `main` del repositorio común, seleccionar inicialmente la primera categoría disponible, permitir seleccionar como máximo una categoría a la vez y no ofrecer una opción para seleccionar todas.
- **FR-003**: La búsqueda en "Importar ejercicios" DEBE activarse únicamente al pulsar un botón "Buscar" explícito, nunca automáticamente al escribir texto o cambiar la categoría seleccionada. El botón DEBE estar deshabilitado si no hay ninguna categoría seleccionada, y la búsqueda DEBE quedar bloqueada también si se invoca sin categoría.
- **FR-004**: Cuando haya una categoría seleccionada, pulsar "Buscar" DEBE devolver los ejercicios del repositorio común que coincidan con esa categoría y, si se indicó, con el texto de búsqueda. Si no hay categorías disponibles o se desmarcan todas, no se DEBE permitir buscar.
- **FR-005**: Los resultados de "Importar ejercicios" DEBEN mostrarse en un listado con una casilla de selección por ejercicio, permitiendo marcar uno o varios resultados a la vez.
- **FR-006**: Mientras haya al menos un resultado seleccionado, la pantalla DEBE mostrar un botón "Importar"; sin ninguna selección, el botón NO DEBE mostrarse.
- **FR-007**: Importar ejercicios NO DEBE requerir credenciales de GitHub guardadas en la aplicación, al leerse únicamente contenido público de la rama `main`.
- **FR-008**: Al confirmar "Importar", el sistema DEBE descargar de la rama `main` los datos completos de cada ejercicio seleccionado y, para cada imagen de tipo archivo que referencie, su documento de imagen correspondiente, convertir sus enlaces y categorías al formato local (separando los enlaces por `tipo` en enlaces web y de YouTube, y aplicando el mapeo de categorías de FR-009), y añadirlos al documento único de datos del usuario (`datos.json`), sin alterar su formato de almacenamiento local.
- **FR-009**: Si alguna categoría de un ejercicio seleccionado para importar no coincide por nombre con ninguna categoría existente del usuario, el sistema DEBE solicitar, antes de completar la importación, que el usuario indique con cuál de sus categorías existentes se corresponde; el ejercicio importado DEBE guardarse con la categoría indicada en lugar de la original.
- **FR-010**: Si el usuario no tiene ninguna categoría propia creada, el sistema DEBE impedir la importación e indicar que debe crear primero al menos una categoría.
- **FR-011**: Si al importar, una imagen de archivo referenciada no existe o no tiene el formato esperado, el sistema DEBE omitir únicamente esa imagen, continuar con el resto de los datos y las imágenes válidas, e informar del número de imágenes omitidas.
- **FR-012**: Tras una importación correcta, cada ejercicio DEBE añadirse como una entrada nueva e independiente en la biblioteca del usuario, sin deduplicar ni sobrescribir ejercicios existentes, aunque coincida su nombre con uno ya existente.
- **FR-013**: Las planificaciones, el progreso diario y los ajustes propios del usuario NUNCA DEBEN subirse ni leerse del repositorio común.
- **FR-014**: El sistema DEBE ofrecer la acción "Subir al repositorio común" desde la ficha de detalle y desde la edición de un ejercicio ya guardado por el usuario, únicamente cuando existan credenciales de GitHub guardadas en la aplicación, con independencia del método de sincronización activo del usuario. En la ficha, en móvil y tablet la acción DEBE estar dentro del menú de las elipsis e inmediatamente antes de "Eliminar"; en escritorio DEBE permanecer visible junto a las acciones principales.
- **FR-015**: La acción "Subir al repositorio común" NO DEBE estar disponible para un ejercicio que no tenga al menos una imagen (de cualquier tipo) o al menos un enlace de YouTube.
- **FR-016**: Antes de subir, el sistema DEBE mostrar las categorías del repositorio común remoto y exigir que el usuario seleccione una o varias para asociarlas al ejercicio que se sube; esta selección NO DEBE crear, modificar ni renombrar ninguna categoría propia del usuario.
- **FR-017**: Antes de subir, el sistema DEBE comprobar si ya existe, entre los ejercicios publicados en la rama `main` del repositorio común, uno cuyo nombre coincida, ignorando mayúsculas/minúsculas y los espacios al principio y al final; si coincide, DEBE bloquear la subida e informar al usuario sin enviar nada. Esta comprobación NO DEBE consultar los ejercicios todavía pendientes de validación en la rama `requests`.
- **FR-018**: El sistema DEBE pedir confirmación explícita antes de enviar la subida, advirtiendo de que la acción no podrá deshacerse ni repetirse para ese ejercicio.
- **FR-019**: Subir un ejercicio DEBE convertir su contenido desde el documento único de datos del usuario (`datos.json`) al formato de fichero JSON independiente por ejercicio usado en el repositorio común (unificando sus enlaces web y de YouTube en una sola lista con `tipo`, y guardando las categorías comunes elegidas como `categoriaIds`), y escribirlo (junto con sus imágenes de archivo, si corresponde) en la rama `requests` mediante una operación de subida; la aplicación NO DEBE escribir en la rama `main` ni gestionar la pull request ni las reglas de validación automática que la fusionan.
- **FR-020**: Tras completarse correctamente el envío a la rama `requests`, el sistema DEBE mostrar un mensaje de confirmación de envío pendiente de revisión, sin consultar ni informar después del resultado final de la validación o fusión automática del repositorio remoto.
- **FR-021**: Tras un envío correcto, el sistema DEBE registrar localmente que ese ejercicio ya fue subido y NO DEBE volver a ofrecer la acción "Subir al repositorio común" para él en adelante, aunque posteriormente se edite su nombre u otros datos.
- **FR-022**: Si el usuario cancela la confirmación de subida, el sistema NO DEBE enviar ningún dato y DEBE mantener disponible la acción de subida para ese ejercicio.
- **FR-023**: Si falla la conexión, la autenticación o la disponibilidad del repositorio común al buscar, importar o subir, el sistema DEBE informar del error de forma comprensible, sin perder datos locales, sin dejar cambios parciales y, en el caso de una subida fallida, sin marcar el ejercicio como ya subido.
- **FR-024**: Cada resultado de importación DEBE ofrecer una acción independiente para abrir la ficha del ejercicio común publicado, que DEBE mostrar nombre, descripción, categorías, enlaces e imágenes en modo lectura, sin editar, eliminar ni mostrar observaciones. La ficha DEBE ofrecer "Importar ejercicio" y aplicar las mismas reglas de mapeo de categorías y manejo de errores que la importación desde resultados. El acceso directo por identificador DEBE leer el ejercicio de `main` sin credenciales; si no existe o no puede cargarse, se DEBE mostrar un estado comprensible y permitir reintentar ante errores recuperables.

### Key Entities *(include if feature involves data)*

- **Ejercicio común (remoto)**: representación de un ejercicio como fichero JSON independiente en `/ejercicios` del repositorio común (nombrado con su `id`), con `id`, `nombre`, `descripcion`, una o varias categorías comunes por referencia (`categoriaIds`), una lista unificada de enlaces con `tipo` (p. ej. `"youtube"` u otro para enlaces web) y una lista de imágenes (de tipo `"archivo"`, referenciando su documento en `/imagenes`, o `"url"`). Es un formato exclusivo del repositorio común, distinto del Ejercicio del usuario, que sigue almacenándose junto al resto de sus datos en el documento único `datos.json` con sus propias listas separadas de enlaces web y de YouTube.
- **Categoría común (remota)**: agrupación temática definida en `categorias.json` del repositorio común (identificador y nombre), independiente de las categorías propias de cada usuario y no modificada nunca por la aplicación; se usa para filtrar (seleccionando como máximo una) en "Importar ejercicios" y para clasificar un ejercicio (seleccionando una o varias) al subirlo.
- **Imagen de archivo común (remota)**: documento con el contenido binario (en base64) de una imagen de tipo archivo asociada a un ejercicio común, almacenado en `/imagenes` del repositorio común con el mismo formato que las imágenes de archivo del repositorio privado de datos (001).
- **Registro de ejercicio subido (local)**: marca asociada a un ejercicio del usuario que indica que ya fue subido correctamente al repositorio común, usada para no volver a ofrecer la acción de subida para ese ejercicio.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un usuario puede encontrar e importar uno o varios ejercicios del repositorio común a su biblioteca, sin ayuda externa, en menos de 2 minutos desde que abre "Importar ejercicios".
- **SC-002**: El 100% de los ejercicios importados en una misma operación aparecen disponibles en la biblioteca del usuario conservando su descripción, enlaces e imágenes válidas; si se mostró el selector, todos reciben exactamente las categorías propias elegidas por el usuario, y si no se mostró, conservan las categorías propias correspondientes por nombre.
- **SC-003**: Un usuario con credenciales de GitHub guardadas y un ejercicio elegible puede completar el flujo de subida (elegir categoría, confirmar y enviar) en menos de 1 minuto.
- **SC-004**: El sistema bloquea el 100% de los intentos de subir un ejercicio cuyo nombre ya existe, ignorando mayúsculas y espacios, entre los ejercicios publicados del repositorio común.
- **SC-005**: El sistema bloquea el 100% de los intentos de ofrecer la subida de un ejercicio que no cumple el requisito mínimo de al menos una imagen o un enlace de YouTube.
- **SC-006**: El 100% de los ejercicios subidos correctamente dejan de ofrecer la acción de subida para ese mismo ejercicio en intentos posteriores.

## Assumptions

- El mismo token de acceso de GitHub ya guardado por el usuario para la sincronización avanzada (FR-037 de 001) se reutiliza para subir ejercicios al repositorio común; la guía de configuración de ese token deberá ampliarse, en la fase de plan, para indicar que necesita permisos de lectura y escritura también sobre el repositorio público común, además de sobre el repositorio privado de datos.
- La comparación de nombres para detectar duplicados y para localizar ejercicios en la búsqueda no distingue mayúsculas de minúsculas ni tiene en cuenta espacios al principio o al final del texto, igual que indica el enunciado del usuario.
- El idioma de los textos del repositorio común (nombres de categorías y ejercicios) es el mismo español de España usado en el resto de la aplicación, al tratarse de un catálogo compartido por los mismos usuarios.
- El registro local de "ejercicio ya subido" (FR-021) es una marca de conveniencia en el dispositivo del usuario; la comprobación remota de nombre duplicado (FR-017) sigue actuando como control definitivo aunque ese registro local se pierda (por ejemplo, al limpiar datos del navegador o usar un dispositivo nuevo).
- No existe un límite específico de ejercicios que se puedan seleccionar e importar en una sola operación distinto de los límites generales de rendimiento ya asumidos por la pantalla "Buscar" en 001.
- El repositorio común no admite colaboración con los nombres de categoría: si la categoría de un ejercicio que se sube no existe todavía en `categorias.json`, queda fuera del alcance de esta especificación crear categorías nuevas en el repositorio común desde la aplicación; el usuario solo puede elegir entre las categorías comunes ya publicadas.
- El campo opcional `observaciones` del Ejercicio del usuario se conserva, cuando tiene contenido, también en el fichero remoto del ejercicio común, igual que el resto de atributos de contenido; se omite cuando está vacío.
