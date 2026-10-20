# Research: Gestión de Ejercicios Físicos y Planificación Semanal









**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Fecha**: 2026-10-15

Este documento no parte de ningún `NEEDS CLARIFICATION` pendiente (la fase de especificación y de clarificación ya resolvieron las ambigüedades funcionales). Documenta en su lugar las decisiones técnicas necesarias para pasar de la especificación al diseño, derivadas de: (a) la instrucción explícita del usuario para esta planificación, y (b) la constitución del proyecto.

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

- **Decision**: Adaptador de Infrastructure que llama directamente a la API REST de contenidos de GitHub desde el navegador (vía `HttpClient`), autenticando cada petición con el token de acceso personal *fine-grained* (limitado únicamente al repositorio privado de datos, por ejemplo `data-physical-exercises`, con permiso de lectura y escritura de contenidos) que el usuario introduce manualmente. Se sincroniza un único `datos.json` con el estado íntegro de los datos (ejercicios, categorías, planificaciones y progreso), más un documento JSON independiente `imagenes/<id>.json` por cada imagen subida como archivo, con su contenido codificado en base64 (`datos.json` solo guarda la ruta). Todo el repositorio de datos queda así en formato JSON, tal como exige la constitución. La decisión de qué hacer la toma un caso de uso puro de dominio (`decidir-accion-sincronizacion`) combinando `cambiosLocalesPendientes`, `últimoShaSincronizado` y el SHA remoto actual: si solo cambió un lado se sube o se descarga sin preguntar; si cambiaron ambos, o es la primera sincronización y GitHub ya tiene datos, se muestra la pantalla de conflicto para elegir la versión local o la remota completas (ver la tabla en contracts/github-sync.port.md). Al escribir se envía el SHA esperado para que GitHub rechace la escritura si alguien escribió entre medias. El token nunca se incluye en `datos.json`. Al aplicar una descarga (ya sea porque solo cambió lo remoto, o porque se resolvió un conflicto eligiendo "conservar lo remoto"), el caso de uso descarga también todas las imágenes de archivo referenciadas y las guarda localmente, para que la aplicación siga funcionando sin conexión.
- **Rationale**: No existe backend propio (prohibido por la constitución), por lo que la única vía viable es llamar a la API de GitHub directamente desde el cliente. Tener en cuenta si hay cambios locales evita falsos conflictos cuando solo ha cambiado GitHub, y tratar la primera sincronización como conflicto evita que un dispositivo nuevo sobrescriba los datos remotos con el catálogo de fábrica. Guardar cada imagen como un documento JSON aparte mantiene `datos.json` pequeño y permite leerlas con el formato "raw" de la API (hasta unos 6,7 MB en base64 para el límite de 5 MB por imagen de FR-036), cumpliendo a la vez el mandato constitucional de que la sincronización se haga íntegramente en JSON.
- **Alternatives considered**: Un backend propio de sincronización — rechazado, viola la prohibición de backend de la constitución. Detección de conflictos por entidad (fusión campo a campo) — rechazada por su complejidad para una aplicación de un único usuario. Guardar las imágenes como archivos binarios aparte (`imagenes/<id>.<ext>`) — rechazada tras revisión de constitución: el mandato de sincronizar "en formato JSON" aplica a todo el repositorio de datos, no solo al documento principal. Incrustar las imágenes en base64 dentro del propio `datos.json` — rechazada porque el documento crecería mucho con cada imagen y superaría cómodamente el tamaño de lectura estándar de la API de contenidos al acumular varias imágenes. Resolución automática "gana lo local" o "gana lo remoto" — rechazada, contradice la clarificación ya resuelta con el usuario.

## 8. Vídeos de YouTube y enlaces externos embebidos

- **Decision**: Los vídeos de YouTube se embeben mediante un `<iframe>` apuntando a `youtube-nocookie.com/embed/<id>`; la extracción del identificador del vídeo a partir de la URL guardada es una función pura de dominio (`domain/ejercicio/extraer-id-youtube.ts`). Los enlaces web se intentan mostrar igualmente en un `<iframe>` sandboxed dentro de la aplicación; si el sitio de destino impide ser embebido (cabeceras `X-Frame-Options`/CSP), se detecta mediante un temporizador de carga y se ofrece como alternativa abrir el enlace en una pestaña nueva. Ambos componentes Angular viven en la capa de Presentation (`presentation/compartido/embebidos/`), como exige la constitución para todo componente Angular.
- **Rationale**: Implementa directamente FR-015/FR-016/CL5 sin depender de ningún servicio externo adicional (no hay backend que pueda hacer de proxy/unfurling). La detección por temporizador es una limitación conocida y aceptable del enfoque 100% cliente.
- **Alternatives considered**: Servicio propio de "unfurling"/proxy de enlaces — rechazado, requeriría un backend, prohibido por la constitución.

## 9. Organización del código por historias de usuario

- **Decision**: Dentro de la capa de Presentation, un subdirectorio por historia de usuario (US1 biblioteca de ejercicios, US2 búsqueda, US3 planificación semanal, US4 progreso diario, US5 sincronización), además de un subdirectorio compartido para shell/navegación/componentes comunes de Angular Material.
- **Rationale**: El spec ya prioriza y numera las historias de usuario como slices independientes y probables de forma aislada; reflejar esa misma división en el código facilita que `/speckit-tasks` genere tareas trazables historia a historia y que cada una pueda entregarse/probarse de forma incremental.
- **Alternatives considered**: Organizar Presentation únicamente por tipo técnico de artefacto (components/, services/, pages/) sin agrupar por historia — rechazada, dificulta la trazabilidad entre tareas, historias de usuario y código fuente.

## 10. Casos de uso puros en Domain frente a orquestación en Application

- **Decision**: La lógica de negocio sin entrada/salida vive como casos de uso puros (funciones sin dependencias de Angular ni de puertos) en `src/app/domain/`: validar ejercicio, extraer ID de YouTube, validar categoría, retirar una categoría de los ejercicios (con reasignación a "Sin categoría"), calcular si una planificación está activa, validar `fechaInicio`, duplicar planificación, calcular el porcentaje del día y decidir la acción de sincronización. Los casos de uso de `src/app/application/casos-uso/` solo orquestan: cargan datos a través de los puertos, llaman al dominio y guardan el resultado.
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

## 13. Reutilización de búsqueda y límites de implementación

- **Decision**: Dejar sin cambios los archivos de implementación de `presentation/busqueda-ejercicios/`. El caso de uso existente ya devuelve el catálogo completo cuando no hay filtros; cada resultado abre una ficha que proporciona edición y eliminación. Tras eliminar desde la ficha, volver a `/buscar`. Probar estas rutas de extremo a extremo sin cambiar el componente, su plantilla ni sus estilos.
- **Rationale**: La búsqueda ya cubre la consulta del catálogo y la ficha conserva las operaciones CRUD; reutilizarlas preserva las capacidades y respeta la instrucción de no modificar el código de la pantalla Buscar. El dominio, los repositorios, los datos semilla y el esquema de persistencia no requieren cambios.
- **Alternatives considered**: Incorporar edición/eliminación dentro del listado de Buscar o modificar el componente de búsqueda para presentar el catálogo — descartado porque las capacidades ya existen en la ficha y la pantalla Buscar está expresamente fuera de los cambios de implementación.

## 14. Regresión visual de Buscar y comportamiento del menú móvil

- **Decision**: Mantener y verificar el listado diferenciado, legible, ajustable y desplazable verticalmente de Buscar (FR-039) sin editar su implementación. Conservar el `mat-sidenav` overlay de ancho completo hasta 599 px y el cierre al elegir una entrada; probar que las dos entradas nuevas siguen el mismo comportamiento.
- **Rationale**: La pantalla ya usa una lista de resultados y el shell actual implementa overlay móvil a 599 px, ancho completo y cierre al seleccionar una ruta. El cambio de menú debe reutilizar ese comportamiento; la prueba de regresión basta si la conducta actual se mantiene.
- **Alternatives considered**: Rediseñar la pantalla Buscar o reimplementar el menú móvil — rechazado por no ser necesario para conservar los comportamientos descritos y por exceder el alcance.

**Alcance de requisitos**: La especificación activa termina en FR-054; FR-055 no está definido y no se infiere ni se incorpora como requisito.
