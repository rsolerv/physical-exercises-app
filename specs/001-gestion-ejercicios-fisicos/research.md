# Research: Gestión de Ejercicios Físicos y Planificación Semanal












**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Fecha**: 2026-10-20

Este documento no parte de ningún `NEEDS CLARIFICATION` pendiente (la fase de especificación y de clarificación ya resolvieron las ambigüedades funcionales). Documenta en su lugar las decisiones técnicas necesarias para pasar de la especificación al diseño, derivadas de: (a) la instrucción explícita del usuario para esta planificación, y (b) la constitución del proyecto.

Las decisiones transversales de las secciones 12–18 se incorporan a partir de la Living Spec de la feature `001-gestion-ejercicios-fisicos`; sus referencias a requisitos y criterios de aceptación identifican la fuente funcional de cada decisión.

## 1. Versión de Angular

- **Decision**: Angular 22.x (la versión estable "latest" publicada en npm en el momento de esta planificación), en componentes standalone.
- **Rationale**: El usuario pidió explícitamente "la última versión estable de Angular"; la constitución exige como mínimo Angular 21, por lo que Angular 22 lo satisface y queda alineado con la petición explícita. Angular ya no recomienda `NgModule` para proyectos nuevos; los componentes standalone son el valor por defecto del CLI en esta versión.
- **Alternatives considered**: Fijar la versión LTS v21 (`v21-lts` en npm) — rechazada porque el usuario pidió expresamente la última estable, no la LTS más conservadora.

## 2. Signals y change detection zoneless

- **Decision**: Signals (`signal()`, `computed()`, `effect()`, `input()`/`output()` basados en signals) como primitiva de estado por defecto en Domain, Application y Presentation. Change detection zoneless mediante `provideZonelessChangeDetection()` en el bootstrap de la aplicación, sin incluir `zone.js` como polyfill. Usar `resource` de Angular en la medida de lo posible para obtener datos de Promises de la capa infraestructura.
- **Rationale**: Instrucción explícita del usuario. Zoneless es estable desde Angular v20.2 (ya no es experimental), por lo que es una elección de producción razonable para una SPA sin backend publicada en GitHub Pages, donde reducir el peso del bundle y mejorar el rendimiento percibido es directamente relevante para los criterios de éxito SC-002/SC-003 del spec.
- **Alternatives considered**: Change detection basado en `zone.js` (comportamiento histórico por defecto) — rechazado por instrucción explícita del usuario y por ser la vía que Angular está dejando de recomendar.

## 3. Formularios: Signal Forms en Presentation

- **Decision**: Usar `@angular/forms/signals` (Signal Forms, en developer preview/experimental en esta versión de Angular) como mecanismo principal de formularios en la capa de Presentation: alta/edición de ejercicio, alta/edición de categoría, constructor de planificación semanal, configuración del token de GitHub, pantalla de resolución de conflictos.
- **Rationale**: Instrucción explícita del usuario ("signal forms en la capa de presentación sobre todo"). Al ser una API en developer preview, se mitiga el riesgo encapsulando cada formulario tras un componente de Presentation dedicado, de modo que las reglas de validación de negocio (nombre/descripción obligatorios, URL válida, nombre de categoría único, etc.) vivan como funciones puras en Domain y los formularios de Presentation solo las invoquen; si la API de Signal Forms cambiara antes de su estabilización, el impacto quedaría limitado a la capa de Presentation, sin tocar Domain/Application (coherente con el flujo de dependencias de la arquitectura en capas de la constitución).
- **Alternatives considered**: Reactive Forms (API estable y madura) — descartada como mecanismo principal por instrucción explícita del usuario; queda documentada aquí como posible vía de escape puntual si algún formulario concreto resultara inviable con Signal Forms, lo cual debería justificarse por escrito en este mismo documento si llegara a ocurrir durante la implementación.

## 4. RxJS/Observables confinados a Infrastructure

- **Decision**: RxJS se usa únicamente en la capa de Infrastructure: wrappers sobre el driver de SQLite WASM (callbacks/promesas del motor expuestos como `Observable`), `HttpClient` para la API REST de GitHub, y cualquier stream de eventos del navegador (p. ej. detección de pérdida de conexión). Cada adaptador de Infrastructure convierte internamente esos `Observable` a `Promise` (con `firstValueFrom()` o equivalente) antes de devolver el resultado a través de los puertos de Application, que están definidos en términos de `Promise` (ver contracts/*.port.md). La conversión a `Signal` (con `toSignal()`) ocurre únicamente dentro de los componentes de Presentation, el único lugar con contexto de inyección de Angular, al envolver la llamada a un caso de uso de Application.
- **Rationale**: Instrucción explícita del usuario de confinar RxJS a Infrastructure. Application orquesta mediante casos de uso puros en Domain y puertos basados en `Promise` (research.md § 10); `toSignal()` requiere un contexto de inyección de Angular que los casos de uso de Application no tienen, por lo que la conversión a Signal solo puede ocurrir en Presentation, manteniendo una única primitiva reactiva (Signals) visible para la UI.
- **Alternatives considered**: RxJS de punta a punta — rechazada por instrucción explícita del usuario. Signals de punta a punta incluyendo Infrastructure — rechazada porque añadiría fricción innecesaria al integrar `HttpClient` y el driver de SQLite WASM, que exponen de forma nativa callbacks/promesas más cómodos de adaptar primero a `Observable`. Exponer `toSignal()` en los puertos de Application — rechazada porque exigiría que Application se ejecutara dentro de un contexto de inyección de Angular, acoplándola al framework en contra de su rol de orquestación pura.

## 5. Testing con Vitest

- **Decision**: Vitest como framework de pruebas unitarias y de componentes, usando la integración de primera parte que ofrece Angular CLI para Vitest (builder experimental de pruebas unitarias), combinada con `TestBed` de Angular para los componentes de Presentation.
- **Rationale**: La constitución exige Vitest explícitamente. Usar la integración oficial del CLI evita mantener una configuración de Vitest paralela y mantiene la coherencia con el resto del tooling de Angular (mismo `tsconfig`, mismos alias de paths).
- **Alternatives considered**: Karma + Jasmine (configuración histórica por defecto del CLI) — rechazada, la constitución mandata Vitest explícitamente.

## 6. Persistencia: SQLite WASM e imágenes locales

- **Decision**: El paquete oficial de SQLite WASM (`@sqlite.org/sqlite-wasm`) ejecutándose íntegramente en el navegador, dentro de un **Web Worker dedicado** (`src/app/infrastructure/persistencia-sqlite/sqlite.worker.ts`) y usando el modo de almacenamiento (VFS) **`opfs-sahpool`**, con un adaptador de Infrastructure por agregado (Ejercicio, Categoría, Planificación, ProgresoDiario, Ajustes de aplicación). Si el navegador no tiene OPFS, la aplicación muestra un aviso en español indicando que los datos no se podrán conservar entre sesiones. Las imágenes añadidas como archivo local (máximo 5 MB, FR-036) se almacenan como BLOB dentro de la misma base de datos SQLite; las imágenes añadidas como URL se guardan como una simple cadena de texto. En las pruebas unitarias (Node + Vitest) los adaptadores SQLite se ejecutan contra una base de datos SQLite WASM **en memoria**.
- **Rationale**: La constitución exige SQLite WASM como único mecanismo de persistencia y prohíbe cualquier almacenamiento gestionado fuera del navegador. El VFS `opfs` estándar necesita las cabeceras HTTP COOP/COEP (aislamiento entre orígenes), que **GitHub Pages no permite configurar**; `opfs-sahpool` no las necesita, por lo que es la opción compatible con el único destino de despliegue permitido. Mantener las imágenes dentro de la misma base de datos evita una segunda fuente de verdad.
- **Alternatives considered**: VFS `opfs` estándar — rechazado por exigir COOP/COEP, imposibles en GitHub Pages. Un service worker que inyecte COOP/COEP (p. ej. `coi-serviceworker`) — rechazado por añadir una pieza frágil (recarga inicial, compatibilidad con iframes de YouTube) sin necesidad. VFS `kvvfs` (localStorage) — rechazado por su límite de ~5 MB, insuficiente con imágenes. Guardar las imágenes en un IndexedDB independiente — rechazado por añadir una segunda tecnología de persistencia no exigida por la constitución ni por el spec.

## 7. Sincronización con GitHub (autenticación y conflictos)

- **Decision**: Adaptador de Infrastructure que llama directamente a la API REST de contenidos de GitHub desde el navegador (vía `HttpClient`), autenticando cada petición con el token de acceso personal *fine-grained* (limitado únicamente al repositorio privado de datos, por ejemplo `data-physical-exercises`, con permiso de lectura y escritura de contenidos) que el usuario introduce manualmente. Se sincroniza un único `datos.json` con el estado íntegro de los datos (ejercicios, categorías, planificaciones y progreso), más un documento JSON independiente `imagenes/<id>.json` por cada imagen subida como archivo, con su contenido codificado en base64 (`datos.json` solo guarda la ruta). Todo el repositorio de datos queda así en formato JSON, tal como exige la constitución. La decisión de qué hacer la toma un caso de uso puro de dominio (`decidir-accion-sincronizacion`) combinando `cambiosLocalesPendientes`, `últimoShaSincronizado` y el SHA remoto actual: si solo cambió un lado se sube o se descarga sin preguntar; si cambiaron ambos, o es la primera sincronización y GitHub ya tiene datos, se muestra la pantalla de conflicto para elegir la versión local o la remota completas (ver la tabla en contracts/github-sync.port.md). Al escribir `datos.json` se envía el SHA esperado para que GitHub rechace la escritura si alguien escribió entre medias; para cada imagen se consulta el SHA remoto antes de escribir, se envía si el documento ya existe y se omite al crearlo. Si la API de contenidos devuelve metadatos sin el cuerpo (ficheros de más de 1 MB), el adaptador descarga el documento por la API de blobs (`git/blobs/<sha>`, hasta 100 MB) antes de parsearlo. Al aplicar una descarga desde la sincronización, una imagen cuyo documento remoto no tiene un formato válido se omite y el resto de los datos se importa; la persona recibe un aviso con el número de imágenes omitidas. Los errores de red o de autenticación siguen abortando la descarga sin modificar los datos locales. El token nunca se incluye en `datos.json`. Al aplicar una descarga (ya sea porque solo cambió lo remoto, o porque se resolvió un conflicto eligiendo "conservar lo remoto"), el caso de uso descarga también todas las imágenes de archivo referenciadas y las guarda localmente, para que la aplicación siga funcionando sin conexión.
- **Rationale**: No existe backend propio (prohibido por la constitución), por lo que la única vía viable es llamar a la API de GitHub directamente desde el cliente. Tener en cuenta si hay cambios locales evita falsos conflictos cuando solo ha cambiado GitHub, y tratar la primera sincronización como conflicto evita que un dispositivo nuevo sobrescriba los datos remotos con el catálogo de fábrica. Guardar cada imagen como un documento JSON aparte mantiene `datos.json` pequeño y permite leerlas con el formato "raw" de la API (hasta unos 6,7 MB en base64 para el límite de 5 MB por imagen de FR-036), cumpliendo a la vez el mandato constitucional de que la sincronización se haga íntegramente en JSON.
- **Alternatives considered**: Un backend propio de sincronización — rechazado, viola la prohibición de backend de la constitución. Detección de conflictos por entidad (fusión campo a campo) — rechazada por su complejidad para una aplicación de un único usuario. Guardar las imágenes como archivos binarios aparte (`imagenes/<id>.<ext>`) — rechazada tras revisión de constitución: el mandato de sincronizar "en formato JSON" aplica a todo el repositorio de datos, no solo al documento principal. Incrustar las imágenes en base64 dentro del propio `datos.json` — rechazada porque el documento crecería mucho con cada imagen y superaría cómodamente el tamaño de lectura estándar de la API de contenidos al acumular varias imágenes. Resolución automática "gana lo local" o "gana lo remoto" — rechazada, contradice la clarificación ya resuelta con el usuario.
- **Actualización (feature `002-sincronizacion-google-drive`)**: GitHub con token pasa a ser uno de los destinos de sincronización posibles, junto con Google y la copia manual en fichero. Su comportamiento y su adaptador no cambian; ver la sección 22.

## 8. Vídeos de YouTube y enlaces externos embebidos

- **Decision**: Los vídeos de YouTube se embeben mediante un `<iframe>` apuntando a `youtube-nocookie.com/embed/<id>`; la extracción del identificador del vídeo a partir de la URL guardada es una función pura de dominio (`domain/ejercicio/extraer-id-youtube.ts`). Los enlaces web se intentan mostrar igualmente en un `<iframe>` sandboxed dentro de la aplicación; si el sitio de destino impide ser embebido (cabeceras `X-Frame-Options`/CSP), se detecta mediante un temporizador de carga y se ofrece como alternativa abrir el enlace en una pestaña nueva. Ambos componentes Angular viven en la capa de Presentation (`presentation/compartido/embebidos/`), como exige la constitución para todo componente Angular.
- **Rationale**: Implementa directamente FR-015/FR-016/CL5 sin depender de ningún servicio externo adicional (no hay backend que pueda hacer de proxy/unfurling). La detección por temporizador es una limitación conocida y aceptable del enfoque 100% cliente.
- **Alternatives considered**: Servicio propio de "unfurling"/proxy de enlaces — rechazado, requeriría un backend, prohibido por la constitución.

## 9. Organización del código por historias de usuario

- **Decision**: Dentro de la capa de Presentation, un subdirectorio por historia de usuario (US1 biblioteca de ejercicios, US2 búsqueda, US3 planificación semanal, US4 progreso diario, US5 sincronización), además de un subdirectorio compartido para shell/navegación/componentes comunes de Angular Material.
- **Rationale**: El spec ya prioriza y numera las historias de usuario como slices independientes y probables de forma aislada; reflejar esa misma división en el código facilita que `/speckit-tasks` genere tareas trazables historia a historia y que cada una pueda entregarse/probarse de forma incremental.
- **Alternatives considered**: Organizar Presentation únicamente por tipo técnico de artefacto (components/, services/, pages/) sin agrupar por historia — rechazada, dificulta la trazabilidad entre tareas, historias de usuario y código fuente.

## 10. Casos de uso puros en Domain frente a orquestación en Application

- **Decision**: La lógica de negocio sin entrada/salida vive como casos de uso puros (funciones sin dependencias de Angular ni de puertos) en `src/app/domain/`: validar ejercicio, extraer ID de YouTube, validar categoría, calcular si una planificación está activa, validar `fechaInicio`, duplicar planificación, calcular el porcentaje del día y decidir la acción de sincronización. La regla transversal de categorías de [FR-011](./spec.md) garantiza que todos los ejercicios conserven al menos una categoría: la eliminación se bloquea si algún ejercicio perdería la última, y no existe una categoría genérica de reserva. Los casos de uso de `src/app/application/casos-uso/` solo orquestan: cargan datos a través de los puertos, llaman al dominio y guardan el resultado.
- **Rationale**: La constitución define Domain como "entidades, reglas de negocio y casos de uso puros" y exige un 100% de cobertura sobre esos casos de uso; sin casos de uso en `domain/`, esa exigencia no se aplicaría a nada.
- **Alternatives considered**: Todos los casos de uso en Application — rechazado porque deja vacía la exigencia de cobertura del 100% en Domain.

## 11. Despliegue en GitHub Pages

- **Decision**: Workflow de GitHub Actions (`.github/workflows/deploy.yml`) en el repositorio **público** del código que, en cada push a `main`, ejecuta lint y pruebas, compila con `ng build --base-href /${{ github.event.repository.name }}/`, copia `index.html` como `404.html` (para que las rutas de la SPA funcionen al recargar) y publica `dist/` en GitHub Pages, configurado con origen "GitHub Actions". Los datos del usuario NO viven en este repositorio, sino en un repositorio privado aparte (`data-physical-exercises`, ver § 7).
- **Rationale**: La constitución exige publicar exclusivamente en GitHub Pages, que en cuentas gratuitas requiere un repositorio público. GitHub Pages sirve el sitio bajo `/<repo>/` y no tiene reescritura de rutas, de ahí `--base-href` (tomado automáticamente del nombre del repositorio) y el `404.html`. Ejecutar lint y pruebas antes de publicar refuerza los requisitos de cero errores de ESLint y cobertura. Separar los datos evita exponerlos públicamente y que cada sincronización dispare un despliegue.
- **Alternatives considered**: Enrutado con hash (`#/ruta`) en lugar de `404.html` — rechazado por empeorar las URLs sin necesidad. Publicación manual con `angular-cli-ghpages` — rechazada por no ejecutar lint y pruebas de forma automática.

## 12. Retirada de “Mis ejercicios” y compatibilidad de navegación

- **Decision**: Eliminar la pantalla y el componente exclusivo del listado bajo la ruta exacta `/ejercicios`, quitar su opción de menú y reemplazar esa ruta exacta por una redirección a `/buscar`. Mantener las rutas diferenciadas de creación, categorías, ficha y edición bajo `/ejercicios/...`. Añadir al menú enlaces directos a las rutas existentes `/ejercicios/nuevo` y `/ejercicios/categorias`.
- **Rationale**: `/ejercicios` es actualmente la ruta canónica expuesta por el menú para la biblioteca, por lo que puede haber marcadores o enlaces guardados. La redirección preserva esos accesos sin conservar una pantalla denominada “Mis ejercicios”. Las rutas anidadas siguen sirviendo funciones vigentes y no deben confundirse con la ruta retirada.
- **Alternatives considered**: Eliminar también `/ejercicios` — rechazado por romper enlaces guardados sin necesidad. Mantener el listado como alias o conservarlo en el menú — rechazado porque contradice FR-053.

## 13. Búsqueda, ficha y medios

- **Decision**: Seleccionar un resultado en "Buscar" abre la ficha en todos los tamaños; "Volver" regresa a la búsqueda. Los resultados muestran descripción y categorías visualmente distinguibles, pero no imágenes, miniaturas ni vistas previas; no se prescribe que las categorías se presenten como chips ni que se dedupliquen sus nombres. Las fichas priorizan los medios, presentan imágenes completas y muestran vídeos mediante una vista previa 16:9 que se abre por acción explícita. Los enlaces se identifican por su URL.
- **Rationale**: La ficha se abre en una pantalla dedicada para evitar un panel de escritorio que no aporta información necesaria y mantener el flujo simple entre lista y detalle. La distinción entre resultado y ficha conserva las vistas previas de medios donde se consulta el ejercicio. Los requisitos vigentes están en [spec.md](./spec.md), FR-053, FR-064, FR-065 y FR-071.
- **Alternatives considered**: Mostrar la ficha en un panel maestro-detalle en escritorio — descartado porque no aporta información útil que justifique el panel y complica el flujo; abrir todos los reproductores al entrar en la ficha — descartado porque carga medios antes de que el usuario elija reproducir.

## 14. Navegación adaptable por dispositivo

- **Decision**: En móvil, la navegación principal se presenta como barra inferior con "Hoy", "Planificación", "Buscar" y "Más"; las opciones secundarias Categorías y Sincronización se agrupan en el panel inferior de "Más", y "Nuevo ejercicio" permanece como acción destacada. En tablet se usa un riel lateral y en escritorio un menú lateral fijo agrupado por propósito. La opción activa mantiene el mismo tratamiento visual en todos los tamaños.
- **Rationale**: La decisión reemplaza el planteamiento anterior de un menú superpuesto de ancho completo en móvil, que queda obsoleto. Está registrada en la Living Spec de esta feature, FR-047, FR-050 a FR-052.
- **Alternatives considered**: Conservar el mismo menú lateral en todos los dispositivos — descartado porque ocupa casi toda la pantalla móvil y no prioriza las secciones de uso diario.

## 15. Sistema visual transversal

- **Decision**: La identidad visual común a toda la aplicación es un tema claro, cálido y profesional, con paleta definida por tokens, Roboto Flex, jerarquía tipográfica común, escala de espaciado de 8 px, tres radios de esquina, contraste accesible, estados de carga con esqueletos, acciones destructivas separadas y mensajes contextuales. Las decisiones y valores exactos forman parte de la Living Spec de esta feature, FR-044 a FR-046 y FR-055 a FR-060, FR-072 a FR-074.
- **Rationale**: La propuesta de diseño se aplica transversalmente a biblioteca, búsqueda, planificación, progreso, fichas y sincronización; documentarla aquí evita decisiones visuales divergentes al ampliar otras features.
- **Alternatives considered**: Mantener los valores predeterminados visuales de los componentes o definir una paleta distinta por pantalla — descartadas porque perpetuarían inconsistencias y no proporcionarían identidad común.

**Alcance de requisitos**: La especificación activa se amplía de forma incremental desde FR-054; los requisitos posteriores quedan definidos en [spec.md](./spec.md) y no crean una feature independiente.

## 16. Tipografía local y deshacer operaciones

- **Decision**: Servir Roboto Flex como recurso estático local, en lugar de depender de un CDN, para que la tipografía definida por la feature esté disponible también durante el uso sin conexión. La acción "Deshacer" mantiene temporalmente en memoria una instantánea de los datos y relaciones afectados; no añade una entidad persistida ni un registro permanente de auditoría.
- **Rationale**: La aplicación debe seguir siendo utilizable sin conexión y no debe introducir dependencias o servicios externos para presentar la interfaz. La instantánea temporal limita el cambio al flujo actual y permite restaurar las asociaciones requeridas por FR-069 sin modificar el modelo persistente de negocio.
- **Alternatives considered**: Cargar la tipografía desde un servicio externo — descartado por depender de conexión y realizar solicitudes de terceros. Añadir un historial permanente de borrados — descartado porque excede la acción temporal "Deshacer" aprobada y añade persistencia no solicitada.

## 17. Fecha de última sincronización

- **Decision**: Guardar en Ajustes de aplicación la fecha-hora de la última sincronización completada correctamente, en UTC, y exponerla mediante el puerto de ajustes. Actualizarla solo al terminar una sincronización exitosa; los errores y conflictos mantienen la fecha anterior. SQLite conserva el valor como texto ISO 8601 y, durante la inicialización del esquema, añade la columna si falta para migrar instalaciones existentes sin recrear ni borrar sus ajustes.
- **Rationale**: FR-070 requiere que la persona pueda consultar cuándo se sincronizó por última vez, incluso después de cerrar y reabrir la aplicación. El ajuste es metadato técnico y no se exporta como una entidad de negocio distinta.
- **Alternatives considered**: Derivar la fecha del SHA/ETag remoto — descartado porque no contiene una fecha de sincronización utilizable. Mantenerla solo en memoria — descartado porque desaparecería al recargar y no cumpliría el comportamiento persistente de la pantalla.
- **Referencia Living Spec**: Feature `001-gestion-ejercicios-fisicos`, FR-070 y [data-model.md](./data-model.md), campo `ultimaSincronizacionCorrecta`.

## 18. Tiempo de respuesta de búsqueda y cambio de día

- **Decision**: Con los datos ya cargados, la búsqueda por texto o categoría y el cambio del día seleccionado deben mostrar el contenido actualizado en menos de 1 segundo, sin bloquear la interacción. La comprobación manual se documenta en [spec.md](./spec.md), SC-031, y [quickstart.md](./quickstart.md).
- **Rationale**: El objetivo previo de que la búsqueda y el cambio entre días respondieran "sin bloquear" no definía un resultado medible. El umbral de un segundo hace verificable el comportamiento percibido sin añadir servicios, dependencias ni instrumentación de producción.
- **Alternatives considered**: Mantener solo "sin bloquear" — descartado por no ser verificable de forma consistente. Añadir telemetría o una herramienta de rendimiento de ejecución — descartado porque excedería el alcance y no es necesaria para la validación manual acordada.

## 19. Previsualización explícita de medios externos

- **Decision**: Los vídeos de YouTube muestran primero una miniatura con título, atribución y una acción explícita de reproducción; el iframe se crea solo tras esa acción. Las vistas previas web conservan siempre un enlace externo directo, incluso mientras cargan o cuando el sitio impide su inserción.
- **Rationale**: La decisión limita las solicitudes a terceros antes de que el usuario elija reproducir el vídeo y mantiene disponible el contenido original ante bloqueos de iframe. Se aplica a la ficha de ejercicio de esta feature, FR-065.
- **Alternatives considered**: Crear el iframe de vídeo inmediatamente — descartado porque inicializa contenido de terceros antes de la solicitud explícita de reproducción. Ocultar el enlace directo hasta que falle la vista previa — descartado porque algunos sitios señalan carga aunque bloqueen el contenido y dejarían el recurso sin alternativa.

## 20. Alta de ejercicio directamente en la sesión de hoy

- **Decision**: En el formulario de alta, mostrar una casilla "Agregar a los ejercicios de hoy" solo después de confirmar que existe una planificación activa para la fecha actual. Al seleccionarla, Presentation guarda primero el ejercicio y después reutiliza el caso de uso de planificación para asignarlo al día local actual; la edición no ofrece esta opción. Si la asignación falla tras guardar, se conserva el ejercicio y se comunica explícitamente el resultado parcial.
- **Rationale**: El comportamiento se limita a la intención temporal del alta y reutiliza la regla de planificación activa por fecha, el mapeo local de día y el caso de uso existente de asignación, sin añadir persistencia ni modificar el modelo de datos. La opción queda ausente si no hay planificación activa, conforme a FR-079.
- **Alternatives considered**: Mostrar siempre la opción y resolver la ausencia de planificación tras el guardado — descartado porque invita a una acción que no puede completarse. Añadir una segunda operación de guardado o una nueva entidad — descartado por duplicar responsabilidades y ampliar innecesariamente el modelo.
- **Referencia Living Spec**: Feature `001-gestion-ejercicios-fisicos`, FR-079 y escenario de aceptación 23 de US1.

## 21. Selección de ejercicios y uso del espacio en pantallas adaptables

- **Decision**: En el editor semanal, "Agregar ejercicio" abre una pantalla independiente con búsqueda parcial por nombre desde la parte superior y filtro por categoría. Los resultados muestran el nombre, la descripción completa y las categorías claramente distinguibles. Se pueden seleccionar varios ejercicios y cada selección se incorpora inmediatamente al día sin confirmación adicional ni duplicados. En móvil, la planificación semanal abre con el día actual seleccionado sin repetir el rótulo "Hoy", y el calendario de fecha de inicio permanece accesible durante la edición. En escritorio, el formulario de ejercicio y el editor de planificación aprovechan el ancho disponible sin un límite máximo fijo; en móvil, las cabeceras y acciones se ubican sin espacios superiores excesivos ni obstrucción del contenido.
- **Rationale**: La pantalla dedicada reduce la presión de espacio en el editor semanal y permite leer las descripciones completas antes de seleccionar varios ejercicios. El uso del ancho y la accesibilidad móvil mantienen disponibles las acciones del formulario y la planificación en cada dispositivo. Estas decisiones transversales se registran en la Living Spec de `001-gestion-ejercicios-fisicos`, FR-056, FR-061, FR-063, FR-081 a FR-084, y en [contracts/interfaz-usuario.md](./contracts/interfaz-usuario.md).

## 22. Proveedores de sincronización y puerto neutro

- **Decision**: La sincronización de datos se hace a través de un puerto neutro de Application (`ProveedorSincronizacionPort`: leer remoto, escribir remoto y leer imagen, con una versión remota opaca en lugar de un SHA). Cada destino permitido por la constitución (GitHub con token, espacio privado de la aplicación en la cuenta de Google de la persona y copia manual en fichero) se implementa como un adaptador de Infrastructure; un delegado elige el adaptador según el método activo guardado en Ajustes de aplicación. Solo hay un método activo a la vez y cambiar de método o de cuenta se trata como una primera sincronización mediante una regla pura de Domain. La autorización con terceros usa flujos sin secreto de cliente y el token de acceso vive solo en memoria. Las reglas de decisión (subir, descargar o conflicto) y el formato de `ExportacionJSON` son los de la sección 7 y no dependen del proveedor.
- **Rationale**: Permite añadir destinos sin tocar el caso de uso ni las reglas de decisión (SOLID) y mantiene las dependencias de capas que exige la constitución. Los contratos y el comportamiento de GitHub quedan intactos y sirven de regresión.
- **Alternatives considered**: Un caso de uso por proveedor — descartado por duplicar la orquestación y las marcas de ajustes. Generalizar el contrato `GitHubSyncPort` — descartado por arrastrar conceptos de GitHub a otros proveedores.
- **Referencia Living Spec**: Feature `002-sincronizacion-google-drive`, FR-002, FR-007, FR-016 y FR-017; [research.md](../002-sincronizacion-google-drive/research.md), secciones 1, 6 y 7, y [contracts/proveedor-sincronizacion.port.md](../002-sincronizacion-google-drive/contracts/proveedor-sincronizacion.port.md).

## 23. Scripts de terceros cargados bajo demanda

- **Decision**: Un script de un tercero que no pueda incluirse en el paquete de la aplicación (como Google Identity Services) se inserta dinámicamente solo cuando la persona inicia la función que lo necesita; nunca se declara en `index.html`. Si no se puede cargar, la función informa del error en su pantalla y el resto de la aplicación sigue disponible sin conexión.
- **Rationale**: Extiende la decisión de la sección 16 (no depender de servicios externos para presentar la interfaz y funcionar sin conexión) a los casos en que un tercero obliga a servir su código desde su dominio.
- **Alternatives considered**: Declarar el script en `index.html` — descartado por hacer solicitudes a terceros en cada arranque, incluso sin usar la función.
- **Referencia Living Spec**: Feature `002-sincronizacion-google-drive`, FR-001; [research.md](../002-sincronizacion-google-drive/research.md), sección 10.

## 24. Copias portables con estructura de archivos

- **Decision**: Cuando una copia de seguridad de una feature requiere conservar archivos y directorios hermanos (por ejemplo, `datos.json` e `imagenes/`), se descarga como un único ZIP con la estructura lógica intacta. La serialización ZIP y su lectura se quedan en Presentation; Application intercambia rutas y contenidos de texto, y Domain valida estructura y referencias antes de modificar datos.
- **Rationale**: La API estándar de descarga del navegador no puede crear una carpeta hermana fiable y la API de acceso a directorios no tiene el mismo soporte en todos los navegadores. El ZIP conserva portabilidad, estructura y separación entre datos e imágenes.
- **Alternatives considered**: Incrustar binarios en el JSON — descartado cuando la intención requiere archivos separados. Acceder a una carpeta real mediante API del navegador — descartado por diferencias de soporte y permisos.
- **Referencia Living Spec**: Feature `002-sincronizacion-google-drive`, FR-019 y FR-020; [research.md](../002-sincronizacion-google-drive/research.md), sección 8, y [contracts/copia-seguridad-archivo.md](../002-sincronizacion-google-drive/contracts/copia-seguridad-archivo.md).
