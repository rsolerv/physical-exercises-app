---

description: "Implementación de la sincronización con cuenta de Google, el puerto neutro de proveedores y la copia manual en fichero"
---

# Tasks: Sincronización con cuenta de Google sin credenciales técnicas

**Input**: [spec.md](./spec.md), [plan.md](./plan.md), [research.md](./research.md), [data-model.md](./data-model.md), [quickstart.md](./quickstart.md), [contracts/](./contracts/)

**Alcance**: US1–US5 y FR-001–FR-027 de la spec. Las tareas T001–T057 corresponden a US1–US4 (en gran parte ya hechas); la enmienda del 2026-10-27 (US5: GitHub y Google guardados a la vez) se añade en la fase 10 (T058–T077). Sin backend ni entidades de negocio nuevas. `fflate` se usa en Presentation para el ZIP de copia manual. El comportamiento de la sincronización con GitHub no cambia (FR-017, SC-009).

**Tests**: Obligatorios antes de implementar, según la constitución (test-first). Escribirlos con Vitest y Angular `TestBed`, ejecutarlos para comprobar que fallan por la funcionalidad pendiente y después implementar. Las pruebas de Google usan dobles: no requieren cuenta ni red.

**Convenciones**: Angular Material como única biblioteca de componentes, capas Domain/Application/Infrastructure/Presentation (las dependencias fluyen hacia el dominio), español de España y las normas de `.github/instructions/ux-ui.instructions.md`. Comandos: `npm test -- --watch=false`, `npm run lint`, `npm run build`, `npm run build-storybook`.

**Puerta de diseño (principio V de la constitución)**: la pantalla de Sincronización es un cambio grande de presentación. Ninguna tarea marcada **[UI]** puede empezar hasta que el propietario haya aprobado de forma explícita el prototipo de Storybook (T022). Las tareas de Domain, Application e Infrastructure no dependen de esa aprobación.

## Format: `- [ ] [ID] [P?] [Story] Descripción con ruta de fichero`

- **[P]**: se puede ejecutar en paralelo (ficheros distintos, sin dependencias pendientes).
- **[Story]**: historia de la spec a la que pertenece (US1–US5).
- **[UI]**: tarea de presentación bloqueada por T022 (fase 4 a 8) o por T066 (fase 10).

## Phase 1: Setup

**Purpose**: Confirmar la línea base y resolver las dependencias externas de Google. No se requiere inicializar el proyecto ni instalar dependencias.

- [X] T001 Ejecutar `npm test -- --watch=false`, `npm run lint`, `npm run build` y `npm run build-storybook` y anotar el resultado como línea base; confirmar que `tests/unit/application/sincronizar-github.use-case.spec.ts`, `tests/unit/infrastructure/github-sync.adapter.spec.ts` y `tests/component/presentation/configuracion-sincronizacion.component.spec.ts` pasan, porque serán la regresión de GitHub (FR-017, SC-009).
- [X] T002 Acción del propietario, sin cambios en el repositorio: registrar la aplicación en Google Cloud siguiendo los cinco pasos de `specs/002-sincronizacion-google-drive/research.md`, sección 12 (proyecto y API de Drive, pantalla de consentimiento con el permiso `drive.appdata`, identificador de cliente web con el origen de GitHub Pages y el de desarrollo local, usuarios de prueba) y entregar el identificador de cliente, que es público, para T028.
- [X] T003 Ejecutar las verificaciones técnicas V1–V4 de `specs/002-sincronizacion-google-drive/quickstart.md` con una página de prueba desechable fuera del repositorio (no se confirma ni se publica) y anotar el resultado y la alternativa aplicada en la tabla "Verificaciones técnicas previas pendientes" de `specs/002-sincronizacion-google-drive/research.md`. Depende de T002. Condiciona T028 y T029; no bloquea las tareas con dobles.

---

## Phase 2: Foundational

**Purpose**: Generalizar la sincronización sin cambiar el comportamiento de GitHub. Al terminar, la aplicación sincroniza con GitHub a través del puerto neutro y toda la regresión existente sigue en verde.

**⚠️ CRITICAL**: Ninguna historia puede empezar hasta completar esta fase.

### Tests for the foundation

> Escribir y ejecutar estas pruebas primero; comprobar que fallan antes de implementar.

- [X] T004 [P] *(Parcialmente sustituida por T058 y T067, enmienda 2026-10-27)* Escribir pruebas de las funciones puras `versionSincronizadaEfectiva(destinoActual, destinoGuardado, versionGuardada)` e `identificarDestinoSincronizacion(metodo, cuentaGoogle)` en `tests/unit/domain/version-sincronizada-efectiva.spec.ts` y `tests/unit/domain/identificar-destino-sincronizacion.spec.ts`. Versión efectiva: "Destino actual igual a `destinoUltimaSincronizacion`" devuelve `ultimaVersionSincronizada`; "Destino actual distinto o `destinoUltimaSincronizacion` nulo" devuelve nula (primera sincronización, FR-016). Destino: `github` para el método `github`; `google:<correo>` para `google` con cuenta; nulo si no hay método o falta la cuenta de Google. Cobertura del 100 %.
- [X] T005 [P] Actualizar `tests/unit/domain/decidir-accion-sincronizacion.spec.ts` para usar `ultimaVersionSincronizada` y `lecturaRemota.version` en lugar de `ultimoShaSincronizado` y `sha`, conservando exactamente los seis casos de la tabla de decisión y sus resultados.
- [X] T006 [P] *(Parcialmente sustituida por T059, enmienda 2026-10-27)* Ampliar `tests/unit/infrastructure/ajustes-repository.sqlite.spec.ts`: columnas nuevas nulas en una instalación nueva; migración desde el esquema anterior que cumpla "En instalaciones existentes con token y repositorio de GitHub guardados, establecer `metodo_sincronizacion = 'github'`; si además hay versión sincronizada, establecer `destino_ultima_sincronizacion = 'github'`. No se recrea ni borra ninguna fila"; `conectarGoogle(correo)` guarda método `google` y la cuenta y rechaza con `ErrorValidacion` si el método es `github`; `guardarCredencialesGitHub` rechaza con `ErrorValidacion` si el método es `google` y establece `github`; `olvidarCredencialesGitHub` pone el método a nulo; `desconectarGoogle` "pone a nulo `metodoSincronizacion` y `cuentaGoogle`" sin borrar `ultimaVersionSincronizada` ni `destinoUltimaSincronizacion`; `registrarDestinoSincronizado(destino)`; `ultimaVersionSincronizada` se lee de la columna `ultimo_sha_sincronizado`.
- [X] T007 [P] Renombrar con `git mv` `tests/unit/application/sincronizar-github.use-case.spec.ts` a `tests/unit/application/sincronizar.use-case.spec.ts` y adaptarlo a `SincronizarUseCase` con un doble de `ProveedorSincronizacionPort`, conservando todos los escenarios existentes (subir, descargar, conflicto con sus opciones por defecto, errores sin tocar datos locales, fecha solo tras éxito). Añadir: usa la versión efectiva (destino distinto → primera sincronización, `conflicto` con `conservar_remoto` si el remoto existe); tras éxito guarda la versión, `registrarDestinoSincronizado`, `cambiosLocalesPendientes = false` y la fecha; error o conflicto no cambian versión, destino ni fecha; cualquier error del proveedor (incluido el de "sin método activo", que lanza el delegado, ver T026) se propaga sin modificar datos locales.
- [X] T008 [P] Actualizar `tests/unit/application/exportar-importar-datos.use-case.spec.ts` para `importar(datos, resolverImagen)`: las imágenes de tipo `archivo` se piden por su ruta lógica `imagenes/<id>.json` mediante el resolvedor, con los mismos resultados que antes. Añadir: todas las imágenes se resuelven antes de borrar ningún dato local; si el resolvedor falla en una imagen, no se modifica ningún dato local; una imagen de archivo de más de 5 MB (`TAMANO_MAXIMO_IMAGEN_BYTES`) lanza `ErrorValidacion` con "Cada imagen de archivo no puede superar los 5 MB." sin modificar datos locales.
- [X] T009 [P] Escribir pruebas de `ProveedorGithubSync` en `tests/unit/infrastructure/proveedor-github-sync.spec.ts`: lee token y repositorio de `AjustesRepositoryPort`, delega en `GitHubSyncPort`, traduce `sha` ↔ `version`, y sin credenciales lanza `ErrorValidacion` con el mensaje actual "Configura el token y el repositorio de GitHub antes de sincronizar.".

### Implementation of the foundation

- [X] T010 Crear `src/app/domain/sincronizacion/version-sincronizada-efectiva.ts` e `identificar-destino-sincronizacion.ts` (funciones puras sin dependencias de Angular), renombrar en `src/app/domain/sincronizacion/decidir-accion-sincronizacion.ts` `ultimoShaSincronizado` → `ultimaVersionSincronizada` y `sha` → `version`, y añadir `ErrorAutorizacionGoogle`, `ErrorConexionCancelada` y `ErrorVentanaBloqueada` (extienden `ErrorDominio`, con mensajes en español de España y sin códigos HTTP) en `src/app/domain/errores/errores-dominio.ts`.
- [X] T011 *(Parcialmente sustituida por T068 y T069, enmienda 2026-10-27)* Ampliar los ajustes según `data-model.md`: campos `metodoSincronizacion` (`github` | `google` | nulo; "Solo hay uno (FR-016)"), `cuentaGoogle` ("Es nulo si el método no es `google`. No es un secreto") y `destinoUltimaSincronizacion` (`github` o `google:<correo>`, "Se actualiza al completar una sincronización"); exponer `ultimoShaSincronizado` como `ultimaVersionSincronizada` y `actualizarUltimoShaSincronizado` como `actualizarUltimaVersionSincronizada` sin renombrar la columna `ultimo_sha_sincronizado`; añadir `conectarGoogle`, `desconectarGoogle` y `registrarDestinoSincronizado`; columnas TEXT nuevas `metodo_sincronizacion`, `cuenta_google` y `destino_ultima_sincronizacion` en el esquema y migración con el mismo patrón `PRAGMA table_info` + `ALTER TABLE` ya usado para `ultima_sincronizacion_correcta`, validando el valor del método en el adaptador; ningún campo guarda token de Google. Ficheros: `src/app/application/ports/ajustes-repository.port.ts`, `src/app/infrastructure/persistencia-sqlite/esquema.ts`, `src/app/infrastructure/persistencia-sqlite/motor-sqlite.ts` y `src/app/infrastructure/persistencia-sqlite/ajustes-repository.sqlite.ts`.
- [X] T012 Propagar el renombrado `ultimoShaSincronizado` → `ultimaVersionSincronizada` y `actualizarUltimoShaSincronizado` → `actualizarUltimaVersionSincronizada` y los campos nuevos de `AjustesAplicacion` a todas las referencias restantes (localizarlas con `grep`): `tests/component/presentation/configuracion-sincronizacion.component.spec.ts`, `tests/component/presentation/shell.component.spec.ts`, `tests/component/presentation/shell-sincronizacion.integration.spec.ts`, `tests/component/presentation/resolucion-conflicto.component.spec.ts`, `tests/unit/application/sembrar-catalogo-predefinido.use-case.spec.ts`, `tests/unit/application/gestionar-ejercicio.use-case.spec.ts`, `tests/unit/application/gestionar-categoria.use-case.spec.ts`, `tests/unit/application/arrancar-aplicacion.use-case.spec.ts` y `src/stories/demo-data.ts`. Sin cambios de comportamiento.
- [X] T013 [P] Crear los puertos `src/app/application/ports/proveedor-sincronizacion.port.ts` (`ProveedorSincronizacionPort` con `leerRemoto`, `escribirRemoto(datos, imagenes, versionEsperada)` y `leerImagen(ruta)`, y el tipo `LecturaRemota` con `version`) y `src/app/application/ports/google-autorizacion.port.ts` (`GoogleAutorizacionPort` con `conectar`, `obtenerTokenAcceso` y `desconectar`), como clases abstractas según `contracts/proveedor-sincronizacion.port.md`. Reutilizar `ExportacionJSON` e `ImagenArchivoJSON` de `github-sync.port.ts`, que no cambia.
- [X] T014 Cambiar `ExportarImportarDatosUseCase.importar` para que reciba un resolvedor de imágenes `(ruta: string) => Promise<ImagenArchivoJSON>` en lugar de `CredencialesGitHub` y elimine su dependencia de `GitHubSyncPort`, en `src/app/application/casos-uso/exportar-importar-datos.use-case.ts`. Además, resolver en memoria todas las imágenes de archivo y comprobar que ninguna supere `TAMANO_MAXIMO_IMAGEN_BYTES` (de `src/app/domain/ejercicio/validar-ejercicio.ts`) antes de borrar ningún dato local, lanzando `ErrorValidacion("Cada imagen de archivo no puede superar los 5 MB.")` si alguna lo supera. Hace pasar T008.
- [X] T015 *(Parcialmente sustituida por T071, enmienda 2026-10-27)* Crear `src/app/application/casos-uso/sincronizar.use-case.ts` con `SincronizarUseCase` (`sincronizar()` y `resolverConflicto(opcion, datosRemotos, version)`), que sustituye a `sincronizar-github.use-case.ts` (borrarlo): usa `ProveedorSincronizacionPort`, calcula la versión efectiva e identifica el destino con las funciones de T010, tras éxito guarda versión, destino, `cambiosLocalesPendientes = false` y fecha, y ante cualquier error no modifica datos locales (CL4, FR-032). Exportar `ResultadoSincronizacion` con `version`. Hace pasar T007.
- [X] T016 [P] Crear `src/app/infrastructure/github-sync/proveedor-github-sync.ts` (capa fina sobre el `GithubSyncAdapter`, sin modificarlo) y cablear en `src/app/app.config.ts` `ProveedorSincronizacionPort` con `useExisting: ProveedorGithubSync`. Hace pasar T009.
- [X] T017 Adaptar sin cambios de comportamiento ni de aspecto `src/app/presentation/sincronizacion/configuracion/configuracion-sincronizacion.component.ts`, `src/app/presentation/sincronizacion/conflicto/resolucion-conflicto.component.ts`, `src/app/presentation/sincronizacion/conflicto-sincronizacion-estado.service.ts` (campo `sha` → `version`), `src/stories/demo-data.ts` y sus pruebas en `tests/component/presentation/` a `SincronizarUseCase` y a `version`.
- [X] T018 Comprobar el punto de control con `npx ng test --watch=false --coverage=false`, `npm run lint`, `npm run build` y `npm run build-storybook`; la suite completa y la regresión de GitHub pasan; no quedan referencias a `SincronizarGithubUseCase`, `ultimoShaSincronizado` ni `actualizarUltimoShaSincronizado` en `src/` ni `tests/`.

**Checkpoint**: La aplicación sincroniza con GitHub a través del puerto neutro y sus resultados no han cambiado.

---

## Phase 3: Puerta de diseño — Prototipo en Storybook y aprobación

**Purpose**: Cumplir el principio V de la constitución. Puede empezar tras T001 y ejecutarse en paralelo con la Phase 2. Las tareas del agente `ux-ui-expert` siguen `.github/agents/ux-ui-expert.agent.md` y `.github/instructions/ux-ui.instructions.md`, y parten de `contracts/interfaz-usuario.md`. No añaden funcionalidad, pantallas ni campos fuera de la spec; si el prototipo necesita algo nuevo, se propone antes como enmienda a la spec.

**⚠️ CRITICAL**: Ninguna tarea **[UI]** puede empezar sin T022.

- [X] T019 Agente `ux-ui-expert`: crear el prototipo de la pantalla de Sincronización con componentes de prototipo identificados como tales (selector con prefijo `proto-`) en `src/stories/prototipos/sincronizacion/` y las 13 historias de `contracts/interfaz-usuario.md` ("Historias de Storybook exigidas") en `src/stories/sincronizacion.stories.ts`: sin configurar, conectando, Google conectado, sincronizando, sincronizado, error de conexión, volver a conectar, confirmar desconexión, conexión cancelada y ventana bloqueada, GitHub como método activo, conflicto, confirmar importación y fichero no válido. Cada una dentro del marco real de la aplicación, con datos de ejemplo en español de España, en móvil (390 px), tablet (834 px) y escritorio (1280 px), con los tokens del tema, Angular Material y confirmaciones en línea (sin diálogos modales). Ampliar `src/stories/demo-data.ts` si hace falta.
- [X] T020 Agente `ux-ui-expert`: verificar el prototipo con `npm run build-storybook`, la vista previa y las pruebas de Storybook, el complemento de accesibilidad y capturas en móvil, tablet y escritorio; comprobar que cubre los escenarios de aceptación de US1–US4 y los textos sin jerga ("token", "OAuth", "credenciales") en el flujo de Google; corregir los fallos antes de presentarlo.
- [X] T021 Agente `ux-ui-expert`: presentar el prototipo al propietario con las URL de las historias, las capturas por tamaño de pantalla y un resumen de qué escenarios de la spec cubre cada historia, y pedirle de forma explícita que lo apruebe o indique fallos y mejoras. Si pide cambios, repetir T019–T021 hasta obtener la aprobación.
- [X] T022 Registrar aquí la aprobación explícita del propietario, con la fecha y un resumen de los cambios que pidió, y solo entonces marcar esta tarea. Esta tarea desbloquea todas las tareas **[UI]**: `Aprobado el 2026-10-26 — aprobado sin cambios solicitados`.

**Checkpoint**: Diseño aprobado. Los componentes de presentación se implementan siguiendo las historias aprobadas como referencia visual.

---

## Phase 4: User Story 1 - Conectar con Google y sincronizar por primera vez (Priority: P1) 🎯 MVP

**Goal**: Una persona sin conocimientos técnicos conecta su cuenta de Google con un par de pulsaciones y sincroniza por primera vez; los datos se guardan en el espacio privado de la aplicación y la regla de primera sincronización nunca sobrescribe datos existentes.

**Independent Test**: Con datos locales y ninguna sincronización configurada, abrir "Sincronización", pulsar "Conectar con Google", elegir una cuenta y aceptar; pulsar "Sincronizar ahora" y comprobar en pantalla "Sincronizado" con la cuenta indicada. Con otra copia local y los datos de Google ya guardados, comprobar que se ofrece la elección con "Usar los datos de Google" marcada por defecto. Cancelar o rechazar el permiso no deja ninguna cuenta conectada ni cambia datos locales.

### Tests for User Story 1

> Escribir y ejecutar estas pruebas primero; comprobar que fallan antes de implementar.

- [X] T023 [P] [US1] Escribir pruebas de `GoogleIdentityAutorizacion` con un cargador de script falso en `tests/unit/infrastructure/google-identity-autorizacion.spec.ts`: el script de Google no se carga hasta `conectar()`; solicita únicamente el permiso `https://www.googleapis.com/auth/drive.appdata` y comprueba que se concedió por completo; lee la cuenta con `GET /about?fields=user(displayName,emailAddress)`; el token solo vive en memoria (no se escribe en `localStorage`, `sessionStorage` ni IndexedDB); `popup_closed` o permiso denegado → `ErrorConexionCancelada`; `popup_failed_to_open` → `ErrorVentanaBloqueada`; fallo al cargar el script → `ErrorRedSincronizacion`; identificador de cliente vacío → `ErrorAutorizacionGoogle`; `obtenerTokenAcceso()` devuelve el token vigente o solicita otro con `prompt: ''` y `login_hint`, y si falla lanza `ErrorAutorizacionGoogle`; `desconectar()` descarta el token y revoca como mejor esfuerzo aunque falle la red.
- [X] T024 [P] [US1] Escribir pruebas del camino básico de `ProveedorGoogleDriveSync` con `HttpTestingController` en `tests/unit/infrastructure/proveedor-google-drive-sync.spec.ts`: listado con `spaces=appDataFolder`, `orderBy=createdTime`, `pageSize=1000` y `fields=files(id,name,size,version)`; `leerRemoto()` sin `datos.json` devuelve `{ existe: false }` y con él devuelve datos y la `version` del listado; `escribirRemoto()` sube primero las imágenes y por último `datos.json`, con subida reanudable (petición de apertura y envío a la URL de `Location`), `parents: ["appDataFolder"]`, `mimeType: application/json`, nombres `imagenes__<id>.json` y `datos.json`, y devuelve `versionNueva` pedida con `fields=version`; cabecera `Authorization: Bearer`; traducción de errores según `contracts/google-drive-sync.md` (estado 0, 429 y 5xx → `ErrorRedSincronizacion`; 401 y 403 por permiso → `ErrorAutorizacionGoogle`; 403 por límite → `ErrorRedSincronizacion`; 404 en `datos.json` → no existe).
- [X] T025 [P] [US1] *(Parcialmente sustituida por T061, enmienda 2026-10-27)* Escribir pruebas de `GestionarConexionSincronizacionUseCase.conectarGoogle()` en `tests/unit/application/gestionar-conexion-sincronizacion.use-case.spec.ts`: llama a `GoogleAutorizacionPort.conectar()` y guarda el correo con `conectarGoogle(correo)`; con método `github` activo rechaza con `ErrorValidacion` que pide olvidar el token antes y sin abrir la ventana de Google; `ErrorConexionCancelada` y `ErrorVentanaBloqueada` se propagan sin guardar nada.
- [X] T026 [P] [US1] Escribir pruebas de `ProveedorSincronizacionSeleccionado` en `tests/unit/infrastructure/proveedor-sincronizacion-seleccionado.spec.ts`: delega en `ProveedorGithubSync` o en `ProveedorGoogleDriveSync` según `metodoSincronizacion` y, sin método activo, lanza `ErrorValidacion` sin invocar a ningún proveedor.
- [X] T027 [P] [US1] Reescribir `tests/component/presentation/configuracion-sincronizacion.component.spec.ts` para la pantalla nueva conservando los escenarios de GitHub, y añadir en él y en `tests/component/presentation/resolucion-conflicto.component.spec.ts`: sin configurar muestra "Conectar con Google" como acción principal y GitHub como alternativa secundaria; estados "Conectando" y conectado con la cuenta y una confirmación; "Sincronizar ahora" lleva a "Sincronizado" con fecha y hora; cancelación o permiso rechazado → mensaje comprensible y sin cuenta; ventana bloqueada → mensaje; error de conexión → "Reintentar"; aviso informativo de Google visible (FR-024); ninguna aparición de "token", "OAuth" ni "credenciales" en el bloque de Google; la resolución muestra "Usar los datos de Google" cuando el método es Google y "Usar los datos de GitHub" cuando es GitHub.

### Implementation for User Story 1

- [ ] T028 [US1] Aplicar el resultado de V1 de T003 a los componentes ya implementados `src/app/infrastructure/google-drive-sync/google-drive.config.ts`, `google-identity.cargador.ts` y `google-identity-autorizacion.ts`; mantener el token y su caducidad solo en memoria y la traducción de errores del contrato. La implementación y sus pruebas con dobles están hechas; esta tarea queda pendiente de la comprobación real de renovación.
- [X] T029 [US1] Aplicar el resultado de V2 de T003 a `src/app/infrastructure/google-drive-sync/proveedor-google-drive-sync.ts`; mantener listado único, lectura y escritura de datos e imágenes, subida reanudable y límites del contrato. La implementación y sus pruebas con dobles están hechas; esta tarea queda pendiente de verificar la subida desde el navegador.
- [X] T030 [US1] Crear `src/app/application/casos-uso/gestionar-conexion-sincronizacion.use-case.ts` con `conectarGoogle()`, crear `src/app/infrastructure/sincronizacion/proveedor-sincronizacion-seleccionado.ts` y cambiar en `src/app/app.config.ts` el cableado: `ProveedorSincronizacionPort` pasa a `ProveedorSincronizacionSeleccionado` y se registra `GoogleAutorizacionPort` con `GoogleIdentityAutorizacion`. Hace pasar T025 y T026.
- [X] T031 [US1] **[UI]** Implementar el bloque principal de Google y la reestructura de la pantalla aprobada (estados sin configurar, conectando, conectado, sincronizando, sincronizado y error con reintento, cuenta, última sincronización y aviso de Google), reorganizar `configuracion-sincronizacion.component.*` y conservar GitHub dentro de "Opciones avanzadas", plegado por defecto salvo cuando es el método activo. Textos en español de España sin jerga y feedback contextual con `MensajeFeedbackService`. El bloque Google y el formulario GitHub comparten la pantalla para mantener coherentes las acciones y el estado del método activo. Hace pasar T027.
- [X] T032 [US1] **[UI]** Mostrar "Usar los datos de Google" o "Usar los datos de GitHub" según el método activo en `src/app/presentation/sincronizacion/conflicto/resolucion-conflicto.component.ts`, `.html` y `.scss`, conservando la resolución explícita de conflictos.

**Checkpoint**: La historia 1 funciona y se puede probar de forma independiente (MVP).

---

## Phase 5: User Story 2 - Seguir mis datos en varios dispositivos (Priority: P2)

**Goal**: Sincronizar desde distintos dispositivos con las mismas reglas de seguridad que GitHub, sin perder cambios ni sobrescribir por error, y con cuentas totalmente aisladas entre sí.

**Independent Test**: Crear un ejercicio con imagen en el dispositivo A y sincronizar; en el dispositivo B conectar la misma cuenta, sincronizar y comprobar que aparece; modificar en uno y comprobar que la siguiente sincronización en el otro lo trae sin conflicto; cambiar en ambos y comprobar el conflicto.

### Tests for User Story 2

> Escribir y ejecutar estas pruebas primero; comprobar que fallan antes de implementar.

- [X] T033 [P] [US2] Ampliar `tests/unit/infrastructure/proveedor-google-drive-sync.spec.ts`: antes de escribir `datos.json` relee su `version` y, si no coincide con `versionEsperada`, lanza `ErrorConflictoRemoto` sin escribir; con `versionEsperada` nula y `datos.json` ya existente lanza `ErrorConflictoRemoto`; solo sube las imágenes que no existen en el listado o cuyo tamaño remoto difiere; recorre las páginas con `nextPageToken`; con varios `datos.json` usa el más antiguo por `createdTime`; un documento de unos 6,7 MB (imagen de 5 MB en base64) se sube con subida reanudable; `leerImagen("imagenes/<id>.json")` consulta `imagenes__<id>.json`; ninguna petición sale del espacio `appDataFolder` ni consulta otros ficheros de la cuenta (FR-003, FR-005, SC-004).
- [X] T034 [P] [US2] Ampliar `tests/unit/application/sincronizar.use-case.spec.ts`: una segunda llamada mientras hay una sincronización en curso se ignora y no duplica operaciones (FR-010); `ErrorConflictoRemoto` al subir deja datos locales, versión y marca de cambios pendientes sin modificar; al descargar se materializan las imágenes remotas con el resolvedor del proveedor; si `datos.json` ya no existe en el destino pero hay versión guardada, la acción es `subir`.
- [X] T035 [P] [US2] Ampliar `tests/component/presentation/configuracion-sincronizacion.component.spec.ts`: durante la sincronización "Sincronizar ahora" queda deshabilitada y el estado "Sincronizando…" se anuncia de forma accesible; pulsaciones repetidas no lanzan una segunda sincronización; un conflicto remoto detectado al escribir muestra un mensaje que pide repetir la sincronización y los datos locales siguen intactos; la fecha de la última sincronización se conserva tras recargar la pantalla.

### Implementation for User Story 2

- [X] T036 [US2] Completar `src/app/infrastructure/google-drive-sync/proveedor-google-drive-sync.ts` con la comprobación de versión inmediatamente anterior a escribir, la omisión de imágenes sin cambios, la paginación y la elección determinista de `datos.json` duplicado, según `research.md` secciones 4 y 5. Hace pasar T033. Se mantiene la alternativa documentada de comparación de versión hasta registrar el resultado V3 de T003.
- [X] T037 [US2] Añadir el bloqueo de ejecuciones simultáneas a `src/app/application/casos-uso/sincronizar.use-case.ts` (FR-010). Hace pasar T034.
- [X] T038 [US2] **[UI]** Deshabilitar "Sincronizar ahora" durante la sincronización, anunciar el estado de forma accesible y mostrar el mensaje de conflicto remoto en `configuracion-sincronizacion.component.*`. Hace pasar T035.

**Checkpoint**: Las historias 1 y 2 funcionan de forma independiente.

---

## Phase 6: User Story 3 - Gestionar la conexión: ver cuenta, reconectar y desconectar (Priority: P3)

**Goal**: Ver qué cuenta está conectada, recuperar la conexión cuando caduca o se revoca, desconectar con confirmación y cambiar de cuenta o de método sin perder datos.

**Independent Test**: Con una cuenta conectada, comprobar cuenta y estado; desconectar y confirmar (los datos locales y los de Google permanecen); volver a conectar y sincronizar; retirar el acceso desde la cuenta de Google y comprobar "Volver a conectar"; cambiar a otra cuenta o a GitHub y comprobar la regla de primera sincronización.

### Tests for User Story 3

> Escribir y ejecutar estas pruebas primero; comprobar que fallan antes de implementar.

- [X] T039 [P] [US3] Ampliar `tests/unit/application/gestionar-conexion-sincronizacion.use-case.spec.ts`: `desconectar()` llama a `GoogleAutorizacionPort.desconectar()` y a `desconectarGoogle()`, no borra datos locales ni ficheros remotos y desconecta aunque falle la revocación por red; reconectar con la cuenta anterior continúa con la versión guardada.
- [X] T040 [P] [US3] Ampliar `tests/unit/application/sincronizar.use-case.spec.ts`: `ErrorAutorizacionGoogle` al sincronizar se propaga sin modificar datos; tras reconectar la sincronización se completa; conectar otra cuenta (o pasar de GitHub a Google y viceversa) produce primera sincronización (`conflicto` con `conservar_remoto` por defecto si el remoto existe) y no escribe nada en el destino anterior.
- [X] T041 [P] [US3] *(Parcialmente sustituida por T063, enmienda 2026-10-27)* Ampliar `tests/component/presentation/configuracion-sincronizacion.component.spec.ts`: la cuenta conectada muestra método, correo, estado y última sincronización; "Desconectar cuenta" pide confirmación en línea (sin diálogo modal) con "Desconectar" y "Cancelar", cancelar no cambia nada y confirmar vuelve a "Conectar con Google"; `ErrorAutorizacionGoogle` muestra "Requiere reconectar" y "Volver a conectar", y al reconectar con éxito la sincronización pendiente se completa automáticamente sin volver a pulsar "Sincronizar ahora" (SC-008: como máximo 2 acciones desde el mensaje); con GitHub como método activo se muestra ese método, "Opciones avanzadas" aparece desplegado y "Conectar con Google" queda deshabilitado con explicación; con Google conectado no se pueden guardar credenciales de GitHub y se explica que hay que desconectar antes.

### Implementation for User Story 3

- [X] T042 [US3] Añadir `desconectar()` a `src/app/application/casos-uso/gestionar-conexion-sincronizacion.use-case.ts`. Hace pasar T039 y T040.
- [X] T043 [US3] **[UI]** *(Parcialmente sustituida por T073, enmienda 2026-10-27: los bloqueos entre métodos desaparecen)* Implementar la desconexión con confirmación en línea, el estado "Requiere reconectar" con "Volver a conectar" (tras reconectar con éxito, lanzar automáticamente la sincronización pendiente), la presentación de GitHub como método activo y los bloqueos entre métodos en `configuracion-sincronizacion.component.*`. Hace pasar T041.

**Checkpoint**: Las historias 1 a 3 funcionan de forma independiente.

---

## Phase 7: User Story 4 - Llevar mis datos a otro dispositivo sin cuenta (copia manual) (Priority: P4)

**Goal**: Exportar todos los datos a un fichero y reemplazar los datos locales importándolo, sin ninguna cuenta.

**Independent Test**: Sin cuenta conectada, pulsar "Exportar copia de seguridad", guardar el fichero; en otro dispositivo pulsar "Importar copia de seguridad", elegirlo, confirmar y comprobar que aparecen todos los datos; un fichero inválido se rechaza sin cambios.

### Tests for User Story 4

> Escribir y ejecutar estas pruebas primero; comprobar que fallan antes de implementar.

- [X] T044 [P] [US4] Escribir pruebas de `validarCopiaSeguridad(datosJson, archivosImagenes)` en `tests/unit/domain/validar-copia-seguridad.spec.ts` con cobertura del 100 %: JSON de datos inválido o incompleto; estructura interna incorrecta; imagen referenciada ausente; rutas fuera de `imagenes/`, traversal o extensión distinta; JSON de imagen inválido o `id` no coincidente con el nombre; imagen superior a 5 MB; copia válida con datos e imágenes devuelve los objetos validados. Las incidencias lanzan `ErrorValidacion` con los mensajes del contrato ZIP.
- [X] T045 [P] [US4] Escribir pruebas de `CopiaManualUseCase` en `tests/unit/application/copia-manual.use-case.spec.ts`: `exportar()` devuelve `copia-ejercicios-AAAA-MM-DD.zip` con `datos.json` y cada `imagenes/<id>.json` como contenido JSON independiente, sin ajustes, token, correo ni cuenta (FR-018), sin modificar datos ni ajustes; `importar(datosJson, archivosImagenes)` inválido o con imágenes superiores a 5 MB no toca repositorios; una copia válida resuelve las imágenes desde las rutas ZIP, reemplaza los datos y llama a `marcarCambiosLocalesPendientes(true)`.
- [X] T046 [P] [US4] Escribir pruebas de la presentación en `tests/component/presentation/copia-manual.component.spec.ts`: exportar genera un ZIP con `datos.json` e imágenes y lo descarga; importar lee ZIP en memoria y muestra confirmación antes de reemplazar datos; cancelar no invoca el caso de uso; ZIP inválido o sin `datos.json` muestra error y no cambia nada. Probar `DescargaArchivoService` en `tests/unit/presentation/descarga-archivo.service.spec.ts` para el MIME ZIP, los bytes y la revocación de la URL temporal.

### Implementation for User Story 4

- [X] T047 [US4] Crear `src/app/domain/copia-seguridad/validar-copia-seguridad.ts`: función pura que valida `datos.json` y los documentos JSON del mapa `imagenes/<id>.json`, referencias, rutas y límites de tamaño sin ejecutar ni evaluar contenido, con sus propias interfaces estructurales y sin importar tipos de Application. Hace pasar T044.
- [X] T048 [US4] Crear `src/app/application/casos-uso/copia-manual.use-case.ts` con `exportar(): { nombreSugerido, archivos }` e `importar(datosJson, archivosImagenes)` según `contracts/copia-seguridad-archivo.md`, reutilizando `ExportarImportarDatosUseCase`; Application intercambia rutas y texto y no conoce ZIP. Hace pasar T045.
- [X] T049 [US4] **[UI]** Implementar en Presentation el empaquetado/lectura ZIP con `fflate`, descarga `application/zip`, selector `.zip` leído en memoria, confirmación en línea y errores junto al control; mantener `Blob` y ZIP fuera de Application/Domain e integrar el bloque en `configuracion-sincronizacion.component.*`. Hace pasar T046.

**Checkpoint**: Las cuatro historias funcionan de forma independiente.

---

## Phase 8: Polish & Cross-Cutting Concerns

- [X] T050 Sustituir los componentes de prototipo por los reales: `src/stories/sincronizacion.stories.ts` apunta a las pantallas finales con proveedores de demostración de `src/stories/demo-data.ts`; se eliminó el componente prototipo y el build de Storybook concluyó correctamente. Las historias de la pantalla ya están enlazadas desde `src/stories/pantallas.stories.ts`.
- [X] T051 Ejecutar la validación automática completa: 487 pruebas en 61 archivos; cobertura global 88,58 % y umbrales de Domain satisfechos, incluido `validar-copia-seguridad.ts`; lint sin errores; build Angular y Storybook correctos; `src/index.html` no declara el script de Google y el cargador solo se invoca al conectar. El build Angular conserva la advertencia de presupuesto inicial (1,34 MB frente al umbral de aviso de 700 kB, por debajo del límite de error).
- [ ] T052 Completar los recorridos de US1–US4, sin conexión y compatibilidad de `specs/002-sincronizacion-google-drive/quickstart.md` con dos cuentas de Google reales y dos navegadores, usando para SC-006 el conjunto de datos de T055, anchos de 320 a 1366 px, teclado, foco, contraste y áreas táctiles de al menos 48 × 48 px; comprobar que "Sincronizar ahora" está fuera de las tarjetas de proveedor e identifica el método activo; registrar los resultados y los tiempos de SC-001, SC-006 y SC-008 en una sección "Resultados de validación" de ese quickstart y corregir los incumplimientos de `specs/002-sincronizacion-google-drive/contracts/interfaz-usuario.md`. Depende de T055.
- [X] T053 Añadir referencias cruzadas a esta feature en `specs/001-gestion-ejercicios-fisicos/spec.md` (Decisiones de producto, sincronización) y en `specs/001-gestion-ejercicios-fisicos/contracts/ajustes-repository.port.md`, sin modificar su comportamiento vigente.
- [X] T054 Revisión de seguridad: comprobar que no hay `client_secret` ni secretos reales en código, que el token de Google permanece en memoria y no se escribe en consola, ajustes, almacenamiento del navegador ni documentos sincronizados, que `GOOGLE_CLIENT_ID` es el único identificador de Google en el código y que el fichero de copia exportado no contiene correo ni credenciales (FR-018).
- [X] T055 Preparar, antes de T052, un conjunto de datos de unos 100 ejercicios con imágenes dentro del límite de 5 MB como ZIP de copia de seguridad importable en `tests/fixtures/copia-100-ejercicios.zip` (generado con `tests/fixtures/generar-copia-100-ejercicios.ts`, sin datos reales), para validar SC-006 y el límite de imagen en la importación.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias; T003 depende de T002.
- **Foundational (Phase 2)**: depende de T001 y bloquea las historias.
- **Puerta de diseño (Phase 3)**: puede empezar tras T001 y ejecutarse en paralelo con la Phase 2; bloquea solo las tareas **[UI]** (T031, T032, T038, T043, T049).
- **User Stories (Phase 4–7)**: dependen de la Phase 2. Las tareas **[UI]** además de T022.
- **Polish (Phase 8)**: depende de las historias deseadas y de T022; T052 depende además de T055 (que puede hacerse en cualquier momento tras la Phase 2 aunque figure al final).

### User Story Dependencies

- **US1 (P1)**: tras la Phase 2. T028 y T029 necesitan el identificador de cliente (T002) y los resultados de V1 y V2 (T003) para completarse; sus pruebas con dobles no.
- **US2 (P2)**: tras US1 (amplía `proveedor-google-drive-sync.ts` y `sincronizar.use-case.ts`).
- **US3 (P3)**: tras US1 (amplía el caso de uso de conexión y los componentes de la pantalla).
- **US4 (P4)**: independiente de US1–US3 salvo para integrar su bloque en la pantalla (T049, que depende de T031 y T022); `validar-copia-seguridad` y `CopiaManualUseCase` solo dependen de la Phase 2.

### Within Each User Story

- Las pruebas se escriben y se comprueba que fallan antes de implementar.
- Domain → Application → Infrastructure → Presentation.
- Las tareas **[UI]** no empiezan sin T022.

### Parallel Opportunities

- T004–T009 (pruebas de la fundación) en paralelo; T013 y T016 en paralelo con las implementaciones que no comparten fichero.
- Toda la Phase 3 puede avanzar en paralelo con la Phase 2.
- Dentro de cada historia, las pruebas marcadas [P] en paralelo.
- US4 (salvo T049) puede desarrollarse en paralelo con US2 y US3.

## Parallel Example: User Story 1

```text
# Lanzar juntas las pruebas de la historia 1:
Task: T023 pruebas de GoogleIdentityAutorizacion en tests/unit/infrastructure/google-identity-autorizacion.spec.ts
Task: T024 pruebas del camino básico de ProveedorGoogleDriveSync en tests/unit/infrastructure/proveedor-google-drive-sync.spec.ts
Task: T025 pruebas de conectarGoogle() en tests/unit/application/gestionar-conexion-sincronizacion.use-case.spec.ts
Task: T026 pruebas del delegado en tests/unit/infrastructure/proveedor-sincronizacion-seleccionado.spec.ts
Task: T027 pruebas de la pantalla en tests/component/presentation/configuracion-sincronizacion.component.spec.ts
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar la Phase 1 y la Phase 2 (GitHub intacto a través del puerto neutro).
2. En paralelo, completar la Phase 3 hasta obtener tu aprobación (T022).
3. Completar la Phase 4 (US1).
4. **PARAR y VALIDAR**: probar US1 de forma independiente con el quickstart y con una cuenta real.
5. Publicar o mostrar si está listo.

### Incremental Delivery

1. Setup + Foundational → la sincronización con GitHub sigue igual.
2. US1 → probar → entregable (MVP).
3. US2 → probar → varios dispositivos y cuentas aisladas.
4. US3 → probar → gestión de la conexión.
5. US4 → probar → copia manual.
6. Cada historia aporta valor sin romper las anteriores.

## Notes

- [P] = ficheros distintos y sin dependencias pendientes.
- La etiqueta [Story] vincula cada tarea con su historia de la spec; las fases de Setup, Foundational, Puerta de diseño y Polish no la llevan.
- Las verificaciones V1–V4 (T003) pueden cambiar detalles del adaptador de Google (renovación del token, subida de documentos grandes o comprobación de versión), no el contrato del puerto.
- La acción T002 depende del propietario; hasta entonces todo se puede desarrollar y probar con dobles.
- Confirmar que las pruebas fallan antes de implementar, y hacer commit tras cada tarea o grupo lógico.

## Phase 9: Convergence

- [ ] T056 Aplicar en `proveedor-google-drive-sync.ts` la escritura condicional con `If-Match` tras el resultado positivo de V3; los resultados de V1–V4 se registraron en `research.md` (incluidos T028, T029 y la actualización pendiente de T036) per plan: verificaciones técnicas V1–V4 (partial).
- [ ] T057 Completar los recorridos manuales pendientes de US1–US4, las comprobaciones de conexión, compatibilidad, accesibilidad, responsive y rendimiento; los resultados comunicados por el propietario están registrados en `quickstart.md`. Quedan por validar el flujo US4, sin conexión, compatibilidad con GitHub y los tiempos exactos de SC-001 y SC-008 (se acepta la prueba de rendimiento con 50 ejercicios) per US1–US4/SC-001–SC-009 (partial).

---

## Phase 10: User Story 5 - GitHub y Google guardados a la vez (Priority: P3) — enmienda 2026-10-27

**Goal**: Poder tener guardadas a la vez las credenciales de GitHub y la cuenta de Google, con un único método activo, cambiar de uno a otro con una sola acción ("Usar este método") y sin falsos conflictos, sin que conectar, desconectar o editar un método borre o invalide el otro (FR-016, FR-017, FR-025, FR-026, FR-027; SC-010, SC-011). Diseño en `research.md` sección 7, `data-model.md` ("Estado de sincronización por destino"), `contracts/proveedor-sincronizacion.port.md` ("AjustesRepositoryPort (cambios)") y `contracts/interfaz-usuario.md`.

**Independent Test**: Con GitHub configurado y sincronizado, conectar Google y comprobar que el repositorio y el token (oculto) de GitHub siguen guardados; pulsar "Usar este método" en cada uno y comprobar que cambia el método activo sin pedir ningún dato; sincronizar alternando sin cambios y comprobar que no hay conflictos; desconectar Google y comprobar que GitHub sigue guardado (recorrido US5 de `quickstart.md`).

**Tareas anteriores sustituidas**: T004 (`versionSincronizadaEfectiva`), T006 y T011 (rechazos "desconecta antes", destino único), T015 (versión efectiva), T025 (rechazo con GitHub activo), T041 y T043 (bloqueos entre métodos). Quedan marcadas como hechas porque reflejan el diseño anterior; el comportamiento nuevo lo fijan las tareas de esta fase, que prevalecen en caso de contradicción.

**Puerta de diseño**: la coexistencia de métodos cambia la estructura del bloque de conexión de una pantalla existente. Ninguna tarea **[UI]** de esta fase puede empezar hasta registrar la aprobación explícita del propietario en T066. Las tareas de Domain, Application e Infrastructure no dependen de esa aprobación.

### Tests for User Story 5

> Escribir y ejecutar estas pruebas primero; comprobar que fallan antes de implementar.

- [X] T058 [P] [US5] Actualizar `tests/unit/domain/identificar-destino-sincronizacion.spec.ts` para `identificarDestinoSincronizacion(metodo, cuentaGoogle, repositorioGitHub)`: devuelve `github:<propietario/repositorio>` para el método `github` con repositorio, `google:<correo en minúsculas>` para `google` con cuenta, y nulo si no hay método activo o falta el dato del método (repositorio o cuenta). Cobertura del 100 %.
- [X] T059 [P] [US5] Ampliar `tests/unit/infrastructure/ajustes-repository.sqlite.spec.ts` (y reemplazar en él los casos que exigían "desconecta antes"): `conectarGoogle(correo)` con GitHub configurado no lanza error, conserva `tokenGitHub` y `repositorioGitHub` y activa Google; `guardarCredencialesGitHub` con Google conectado no lanza error, no modifica `cuentaGoogle` y activa GitHub solo si no había credenciales guardadas o no había método activo (editar unas ya guardadas con Google activo no cambia el activo); `olvidarCredencialesGitHub` pone `metodoSincronizacion` a nulo solo si era `github` y no toca `cuentaGoogle`; `desconectarGoogle` pone `cuentaGoogle` a nulo y `metodoSincronizacion` a nulo solo si era `google`, sin tocar GitHub; `activarMetodo` cambia el activo y lanza `ErrorValidacion` si el método no está conectado (GitHub conectado = "`tokenGitHub` y `repositorioGitHub` están guardados"; Google conectado = "`cuentaGoogle` no es nulo"); tabla `sincronizacion_destino` con campos `destino` (texto, clave: `github:<propietario/repositorio>` o `google:<correo en minúsculas>`), `ultimaVersion` (texto, obligatorio), `cambiosLocalesPendientes` (booleano, obligatorio) y `ultimaSincronizacion` (fecha UTC, obligatorio); `registrarSincronizacionCompletada(destino, version, fecha, datosLocalesCambiados)` inserta o actualiza la fila con pendientes = falso y, solo si `datosLocalesCambiados`, marca como pendientes las demás filas; `marcarCambiosLocalesPendientes()` marca todas las filas; `obtener()` devuelve `ultimaVersionSincronizada`, `cambiosLocalesPendientes` y `ultimaSincronizacionCorrecta` del destino del método activo y `null`/`false`/`null` si no hay activo o fila; las filas se conservan al olvidar el token o desconectar Google; migración desde el esquema anterior: "si la tabla está vacía y existe `ultimo_sha_sincronizado` con `destino_ultima_sincronizacion` (el valor `github` pasa a `github:<repositorio_github>`), se inserta una fila con la versión, `cambios_locales_pendientes` y `ultima_sincronizacion_correcta` (o la fecha de la migración si falta)", sin borrar filas ni columnas y de forma idempotente.
- [X] T060 [P] [US5] Ampliar `tests/unit/application/sincronizar.use-case.spec.ts` (sustituyendo los casos que dependían de `versionSincronizadaEfectiva` y `registrarDestinoSincronizado`): usa el estado del destino activo; sin fila → primera sincronización (`conflicto` con `conservar_remoto` por defecto si el remoto existe); alternar entre dos destinos ya sincronizados y sin cambios resulta en `nada` en ambos (SC-011); un cambio local tras sincronizar con GitHub produce `subir` al sincronizar con Google y después `subir` con GitHub si el remoto no cambió; tras `descargar` o `conservar_remoto` se llama a `registrarSincronizacionCompletada(..., true)` y tras `subir`, `nada` o `conservar_local` con `false`; no lee ni escribe en el proveedor de un destino no activo; con GitHub activo y la sesión de Google ausente no hay ninguna llamada a `GoogleAutorizacionPort` (FR-027).
- [X] T061 [P] [US5] Ampliar `tests/unit/application/gestionar-conexion-sincronizacion.use-case.spec.ts`: `conectarGoogle()` con GitHub configurado abre la ventana de Google y guarda la cuenta sin rechazar (sustituye al caso de T025 que exigía olvidar el token); `activarMetodo('google'|'github')` delega en el repositorio de ajustes sin invocar a `GoogleAutorizacionPort` ni a ningún proveedor; `desconectar()` con GitHub configurado no modifica sus credenciales.
- [X] T062 [P] [US5] Adaptar a `marcarCambiosLocalesPendientes()` sin parámetro las pruebas de los casos de uso que lo invocan: `tests/unit/application/gestionar-ejercicio.use-case.spec.ts`, `gestionar-categoria.use-case.spec.ts`, `gestionar-planificacion.use-case.spec.ts`, `gestionar-progreso-diario.use-case.spec.ts`, `copia-manual.use-case.spec.ts` y `sembrar-catalogo-predefinido.use-case.spec.ts` (que sigue sin llamarlo), localizando el resto con `grep`.
- [X] T063 [P] [US5] Ampliar `tests/component/presentation/configuracion-sincronizacion.component.spec.ts` (sustituyendo los casos de T041 sobre "Conectar con Google" deshabilitado y credenciales de GitHub bloqueadas): con ambos métodos conectados se muestran las etiquetas "Método activo" y "Conectado" (texto e icono) y la acción común indica el método activo; "Usar este método" aparece solo en el conectado no activo, lo activa sin diálogo ni datos de acceso y muestra "Ahora sincronizas con Google." o "Ahora sincronizas con GitHub." con anuncio accesible; "Conectar con Google" y el guardado de GitHub están siempre disponibles y no desconectan al otro; editar GitHub ya guardado no cambia el activo; "Olvidar token" y "Desconectar cuenta" solo afectan a su método y, si era el activo, aparece "Elige con qué método quieres sincronizar." sin "Sincronizar ahora" y con "Usar este método" en el otro; con GitHub activo y Google caducado no aparece "Volver a conectar".

### Puerta de diseño de esta enmienda

- [X] T064 [US5] Agente `ux-ui-expert`: actualizar el prototipo siguiendo `contracts/interfaz-usuario.md` (etiquetas de método, "Usar este método", aviso de cambio, estado sin método activo y fin de los bloqueos entre métodos): crear componentes de prototipo con selector `proto-` en `src/stories/prototipos/sincronizacion/` y, en `src/stories/sincronizacion.stories.ts`, las historias nuevas "Google activo y GitHub conectado", "GitHub activo y Google conectado", "cambio de método" y "sin método activo con uno conectado", y sustituir la de "GitHub como método activo" (ya sin Google deshabilitado). Móvil (390 px), tablet (834 px) y escritorio (1280 px), con datos en español de España; verificar con `npm run build-storybook` y capturas. Build correcto; historias renderizadas dentro del shell real. Sin añadir funcionalidad fuera de la spec.
- [X] T065 [US5] Agente `ux-ui-expert`: presentar el prototipo actualizado al propietario con las URL de las historias y capturas por tamaño, y pedir aprobación explícita o fallos y mejoras; repetir T064–T065 hasta obtenerla. URL e historias presentadas el 2026-10-28; aprobación pendiente en T066.
- [X] T066 [US5] Registrar aquí la aprobación explícita del propietario, con fecha y resumen de cambios pedidos, y solo entonces marcar esta tarea. Desbloquea las tareas **[UI]** de la fase 10: `Aprobado el 2026-10-28; el propietario aprobó el prototipo sin solicitar cambios.`

### Implementation for User Story 5

- [X] T067 [US5] Domain: cambiar `identificarDestinoSincronizacion(metodo, cuentaGoogle, repositorioGitHub)` en `src/app/domain/sincronizacion/identificar-destino-sincronizacion.ts` (formato `github:<propietario/repositorio>` y `google:<correo en minúsculas>`), eliminar `src/app/domain/sincronizacion/version-sincronizada-efectiva.ts` y `tests/unit/domain/version-sincronizada-efectiva.spec.ts`. Hace pasar T058.
- [X] T068 [US5] Infrastructure: crear la tabla `sincronizacion_destino` en `src/app/infrastructure/persistencia-sqlite/esquema.ts` (`destino TEXT PRIMARY KEY`, `ultima_version TEXT NOT NULL`, `cambios_locales_pendientes INTEGER NOT NULL DEFAULT 0`, `ultima_sincronizacion TEXT NOT NULL`) y su migración idempotente en `src/app/infrastructure/persistencia-sqlite/motor-sqlite.ts` según `data-model.md`, sin borrar tablas, filas ni columnas antiguas.
- [X] T069 [US5] Application e Infrastructure: modificar `AjustesRepositoryPort` en `src/app/application/ports/ajustes-repository.port.ts` y `AjustesRepositorySqlite` en `src/app/infrastructure/persistencia-sqlite/ajustes-repository.sqlite.ts` según `contracts/proveedor-sincronizacion.port.md`: quitar `destinoUltimaSincronizacion`, `actualizarUltimaVersionSincronizada`, `registrarDestinoSincronizado` y `registrarSincronizacionCorrecta`; añadir `activarMetodo` y `registrarSincronizacionCompletada`; `marcarCambiosLocalesPendientes()` sin parámetro; eliminar los rechazos "desconecta antes"; `desconectarGoogle` y `olvidarCredencialesGitHub` anulan el método activo solo si era el suyo; `guardarCredencialesGitHub` y `conectarGoogle` con las reglas de activación; `obtener()` rellena la vista derivada del destino activo. Hace pasar T059.
- [X] T070 [US5] Propagar `marcarCambiosLocalesPendientes()` sin parámetro y el nuevo `AjustesAplicacion` a `src/app/application/casos-uso/gestionar-ejercicio.use-case.ts`, `gestionar-categoria.use-case.ts`, `gestionar-planificacion.use-case.ts`, `gestionar-progreso-diario.use-case.ts`, `copia-manual.use-case.ts`, `src/stories/demo-data.ts` y el resto de referencias localizadas con `grep`. Hace pasar T062.
- [X] T071 [US5] Cambiar `SincronizarUseCase` en `src/app/application/casos-uso/sincronizar.use-case.ts`: tomar las entradas de decisión de la vista del destino activo, llamar a `registrarSincronizacionCompletada(destino, version, fecha, datosLocalesCambiados)` (`true` en `descargar` y `conservar_remoto`, `false` en el resto) y no usar ninguna función de versión efectiva. Hace pasar T060.
- [X] T072 [US5] Cambiar `GestionarConexionSincronizacionUseCase` en `src/app/application/casos-uso/gestionar-conexion-sincronizacion.use-case.ts`: quitar el rechazo si GitHub está configurado en `conectarGoogle()` y añadir `activarMetodo(metodo)`. Hace pasar T061.
- [X] T073 [US5] **[UI]** Implementar en `src/app/presentation/sincronizacion/configuracion/configuracion-sincronizacion.component.*` el diseño aprobado en T066: etiquetas "Método activo", "Conectado" y "Sin configurar", "Usar este método" con aviso de cambio y anuncio accesible, estado "sin método activo", eliminación de los bloqueos entre métodos y de los textos "desconecta antes", y sin avisos de reconexión de Google con GitHub activo. Textos de `contracts/interfaz-usuario.md`, solo Angular Material, confirmaciones en línea. Hace pasar T063.
- [X] T074 [US5] **[UI]** Sustituir los componentes de prototipo `proto-` de T064 por los reales en `src/stories/sincronizacion.stories.ts` y `src/stories/demo-data.ts` (con `ajustesSincronizacionDemo` actualizado al nuevo `AjustesAplicacion`), eliminar `src/stories/prototipos/sincronizacion/` y comprobar `npm run build-storybook`.

### Validación de User Story 5

- [X] T075 [US5] Comprobar el punto de control con `npx ng test --watch=false --coverage=false`, `npm run lint`, `npm run build` y `npm run build-storybook`; la regresión de GitHub (`sincronizar.use-case.spec.ts`, `github-sync.adapter.spec.ts`, `proveedor-github-sync.spec.ts`) pasa; no quedan referencias a `versionSincronizadaEfectiva`, `destinoUltimaSincronizacion`, `registrarDestinoSincronizado` ni `actualizarUltimaVersionSincronizada` en `src/` ni `tests/`; cobertura de Domain al 100 %.
- [X] T076 [US5] Completar el recorrido "US5" y el punto 5 de "US3" de `specs/002-sincronizacion-google-drive/quickstart.md` con una cuenta de Google real y un repositorio de GitHub real, incluida una instalación con datos y token de GitHub guardados antes de la enmienda (migración), y registrar el resultado en "Resultados de validación" de ese quickstart. Depende de T073.
- [X] T077 [US5] Añadir una referencia cruzada a esta enmienda en `specs/001-gestion-ejercicios-fisicos/contracts/ajustes-repository.port.md` y en `specs/001-gestion-ejercicios-fisicos/spec.md` (FR-037: el token de GitHub se conserva aunque se conecte Google), sin cambiar su comportamiento vigente; revisar con `grep` que el token de GitHub y la cuenta de Google no se incluyen en ninguna exportación ni copia manual (FR-018, FR-037).

### Dependencias y paralelismo de la fase 10

- T058–T063 en paralelo entre sí (ficheros distintos); T064 puede empezar en paralelo con ellas y T065–T066 son secuenciales.
- Orden de implementación: T067 → T068 → T069 → T070 → T071 y T072 (en paralelo tras T069); T073 depende de T066, T069 y T072; T074 depende de T073; T075 depende de todas; T076 depende de T073; T077 es independiente.
- Estrategia: completar Domain, Application e Infrastructure (T058–T063 y T067–T072, que mantienen la aplicación funcionando sin cambiar la pantalla) y, tras la aprobación de T066, la presentación (T073–T074). **Parar y validar** con el recorrido US5 antes de dar la historia por terminada.
