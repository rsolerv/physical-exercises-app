---

description: "Task list for feature implementation"
---

# Tasks: Gestión de Ejercicios Físicos y Planificación Semanal

**Input**: Design documents from `/specs/001-gestion-ejercicios-fisicos/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/, quickstart.md

**Tests**: La constitución exige test-first obligatorio ("ninguna funcionalidad se implementa sin que exista previamente al menos un test que la cubra"), cobertura mínima del 80% global y del 100% en los casos de uso puros de `src/app/domain/`, con Vitest. Por eso cada fase incluye tareas de test que DEBEN escribirse y fallar antes de las tareas de implementación de esa fase. Los adaptadores SQLite se prueban contra una base de datos SQLite WASM en memoria (research.md § 6).

**Organization**: Tareas agrupadas por historia de usuario (US1–US5, prioridades P1–P5 de spec.md) para permitir su implementación y prueba independientes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias pendientes)
- **[Story]**: Historia de usuario a la que pertenece la tarea (US1…US5)
- Cada tarea incluye la ruta de archivo exacta

## Path Conventions (proyecto Angular único, sin backend — ver plan.md § Project Structure)

- `src/app/domain/<agregado>/` — entidades y casos de uso PUROS (sin E/S; 100% de cobertura)
- `src/app/application/ports/` y `src/app/application/casos-uso/` — puertos y orquestación (cargar vía puertos → llamar al dominio → guardar)
- `src/app/infrastructure/persistencia-sqlite/` y `src/app/infrastructure/github-sync/` — adaptadores concretos
- `src/app/presentation/<historia-de-usuario>/` y `src/app/presentation/compartido/` (incluye `embebidos/`) — todos los componentes Angular
- `src/assets/catalogo-predefinido/` — datos semilla
- `tests/unit/{domain,application,infrastructure}/` y `tests/component/presentation/` — pruebas Vitest

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Control de versiones y repositorio en GitHub, inicialización del proyecto, tooling y despliegue

- [ ] T001 Inicializar git en la raíz del repositorio (`git init -b main`), crear el `.gitignore` de raíz (`node_modules/`, `dist/`, `.angular/`, `coverage/`, `*.log`) y hacer un primer commit con la documentación existente (`.github/`, `.specify/`, `specs/`, `README.md`)
- [ ] T002 Crear en GitHub el repositorio **público** del código de la aplicación (público porque GitHub Pages lo exige en cuentas gratuitas) con el nombre elegido (p. ej. `physical-exercises`), por ejemplo con `gh repo create physical-exercises --public --source . --remote origin --push`, y subir la rama `main` (depende de T001)
- [ ] T003 Crear el workspace Angular 22 en la raíz del repositorio con `ng new <nombre> --directory . --skip-git` (genera `package.json`, `angular.json` y `src/`; componentes standalone, routing, change detection zoneless sin `zone.js`), conservando el `README.md`, `.gitignore` y `.github/` existentes si el asistente propone sobrescribirlos, según plan.md § Technical Context y research.md §§ 1–2 (depende de T001)
- [ ] T004 Configurar ESLint (`angular-eslint`) en `eslint.config.js` para una base de cero errores, según constitución § Calidad de Código y Pruebas (depende de T003)
- [ ] T005 Configurar Vitest como runner de pruebas unitarias de Angular CLI en `angular.json` (comprobar si ya es el runner por defecto de la versión instalada), con `include` que cubra `tests/**/*.spec.ts` y umbrales de cobertura del 80% global y 100% para `src/app/domain/**`, según research.md § 5 (depende de T003)
- [ ] T006 Instalar y configurar Angular Material (tema y estilos globales en `src/styles.scss`) como única librería visual permitida, según constitución § Arquitectura y Stack Tecnológico (depende de T003)
- [ ] T007 Instalar `@sqlite.org/sqlite-wasm`, configurar en `angular.json` el servido de su archivo `.wasm` como asset estático y habilitar Web Workers (`tsconfig.worker.json`), según research.md § 6 (depende de T003)
- [ ] T008 [P] Crear la estructura de carpetas de las 4 capas: `src/app/domain/{errores,ejercicio,categoria,planificacion,progreso-diario,sincronizacion}/`, `src/app/application/{ports,casos-uso}/`, `src/app/infrastructure/{persistencia-sqlite,github-sync}/`, `src/app/presentation/{biblioteca-ejercicios,busqueda-ejercicios,planificacion-semanal,progreso-diario,sincronizacion,compartido/embebidos}/`, según plan.md § Project Structure
- [ ] T009 [P] Crear la estructura de carpetas de pruebas `tests/unit/{domain,application,infrastructure}/` y `tests/component/presentation/`, según plan.md § Project Structure
- [ ] T010 [P] Crear el workflow de publicación en GitHub Pages `.github/workflows/deploy.yml`: en cada push a la rama principal ejecuta lint y pruebas, compila con `ng build --base-href /${{ github.event.repository.name }}/` (el nombre del repositorio lo aporta GitHub Actions), copia `index.html` como `404.html` en la carpeta de salida y publica en GitHub Pages, según research.md § 11 (depende de T004, T005)
- [ ] T011 Activar GitHub Pages en el repositorio del código con origen "GitHub Actions" (Settings → Pages, o `gh api -X POST repos/{owner}/{repo}/pages -f build_type=workflow`) y comprobar que el workflow `.github/workflows/deploy.yml` se ejecuta al hacer push a `main` (depende de T002, T010)

**Checkpoint**: Proyecto Angular 22 zoneless con Vitest, ESLint, Angular Material, SQLite WASM, estructura de 4 capas y despliegue automático preparados.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Persistencia, errores de dominio, arranque y navegación compartidos por todas las historias

**⚠️ CRITICAL**: Ninguna historia de usuario puede empezar hasta que esta fase esté completa

### Tests for Foundational ⚠️

> Escribir PRIMERO y comprobar que fallan

- [ ] T012 [P] Test de conexión y esquema SQLite contra una base de datos en memoria (crea todas las tablas del esquema; aplicar el esquema dos veces no falla; `PRAGMA foreign_keys` está activo) en `tests/unit/infrastructure/sqlite-conexion.spec.ts`
- [ ] T013 [P] Test del adaptador SQLite de ajustes (guardar y olvidar credenciales de GitHub FR-037; actualizar `últimoShaSincronizado`; `cambiosLocalesPendientes` "Sí (por defecto `false`)"; bandera `catálogoPredefinidoCargado` "Sí (por defecto `false`)") en `tests/unit/infrastructure/ajustes-repository.sqlite.spec.ts`
- [ ] T014 [P] Test del caso de uso "arrancar aplicación" con puertos simulados (carga los datos al abrir FR-001; invoca la siembra del catálogo solo si `estaCatalogoPredefinidoCargado()` es `false`; expone un aviso si el navegador no tiene OPFS) en `tests/unit/application/arrancar-aplicacion.use-case.spec.ts`
- [ ] T015 [P] Test del shell de navegación (menú responsive con Angular Material y textos en español de España; cada entrada de historia es un marcador de posición navegable hasta que su historia registre la ruta real; la aplicación arranca sin errores de enrutamiento) en `tests/component/presentation/shell.component.spec.ts`

### Implementation for Foundational

- [ ] T016 [P] Crear los errores de dominio `ErrorValidacion`, `ErrorNoEncontrado`, `ErrorNombreDuplicado`, `ErrorOperacionNoPermitida`, `ErrorPlanificacionActivaDuplicada`, `ErrorEjercicioDuplicadoEnDia`, `ErrorRedSincronizacion`, `ErrorAutenticacionGitHub` y `ErrorConflictoRemoto` en `src/app/domain/errores/errores-dominio.ts`, según contracts/*.port.md
- [ ] T017 Implementar el Web Worker de SQLite con el VFS `opfs-sahpool` en `src/app/infrastructure/persistencia-sqlite/sqlite.worker.ts` y el servicio que lo usa en `src/app/infrastructure/persistencia-sqlite/sqlite-conexion.service.ts` (abre o crea la base de datos; admite modo en memoria para pruebas; informa si OPFS no está disponible), según research.md § 6 (depende de T007, T012)
- [ ] T018 Crear el esquema en `src/app/infrastructure/persistencia-sqlite/esquema.sql` con las tablas `ejercicio`, `ejercicio_enlace` (tipo `web` o `youtube`), `ejercicio_imagen` (tipo `url` o `archivo`, URL o contenido BLOB y tipo MIME), `categoria` (`nombre` UNIQUE, `es_generica` booleano), `ejercicio_categoria`, `planificacion` (`fecha_inicio` UNIQUE y nullable), `dia_planificacion`, `dia_planificacion_ejercicio` (clave única día+ejercicio, FR-021), `progreso_diario` y `ajustes_aplicacion`; todas las claves foráneas hacia `ejercicio` con `ON DELETE CASCADE` para que borrar un ejercicio lo retire de todas las planificaciones (FR-028), según data-model.md (depende de T017)
- [ ] T019 [P] Definir la interfaz `AjustesRepositoryPort` en `src/app/application/ports/ajustes-repository.port.ts`, según contracts/ajustes-repository.port.md
- [ ] T020 Implementar el adaptador SQLite de `AjustesRepositoryPort` en `src/app/infrastructure/persistencia-sqlite/ajustes-repository.sqlite.ts` (depende de T013, T018, T019)
- [ ] T021 Implementar el caso de uso "arrancar aplicación" en `src/app/application/casos-uso/arrancar-aplicacion.use-case.ts` (la siembra concreta del catálogo la aporta la Historia de Usuario 1 en T045) (depende de T014, T020)
- [ ] T022 [P] Configurar el bootstrap zoneless (`provideZonelessChangeDetection()`), `provideHttpClient()` y el enrutador raíz en `src/app/app.config.ts` y `src/main.ts`, según research.md § 2
- [ ] T023 [P] Crear el shell de navegación compartido (barra/menú responsive con Angular Material, textos en español de España) en `src/app/presentation/compartido/shell/`, con las rutas de cada historia como marcadores de posición (depende de T015)

**Checkpoint**: Persistencia SQLite compatible con GitHub Pages, errores de dominio, arranque y navegación listos — las historias de usuario pueden empezar.

---

## Phase 3: User Story 1 - Gestionar la biblioteca personal de ejercicios (Priority: P1) 🎯 MVP

**Goal**: Crear, modificar y organizar por categorías los ejercicios (nombre, descripción, enlaces, vídeos, imágenes, observaciones), con un catálogo predefinido disponible desde el primer uso.

**Independent Test**: Crear una categoría, dar de alta varios ejercicios asociados con sus datos completos, editar uno y comprobar que los cambios se conservan, sin que exista ninguna planificación (quickstart.md § US1).

### Tests for User Story 1 ⚠️

> Escribir PRIMERO y comprobar que fallan

- [ ] T024 [P] [US1] Test del caso de uso puro `validar-ejercicio` (nombre y descripción "No puede estar vacío" FR-005; "1 o más categorías" FR-006; "Cada URL debe tener formato válido antes de guardarse" FR-007; imagen de archivo "máximo de 5 MB por imagen" FR-036) en `tests/unit/domain/validar-ejercicio.spec.ts`
- [ ] T025 [P] [US1] Test del caso de uso puro `validar-categoria` (nombre obligatorio y "Único en todo el sistema" FR-010; la categoría con `esGenerica = true` no puede renombrarse ni eliminarse FR-011) en `tests/unit/domain/validar-categoria.spec.ts`
- [ ] T026 [P] [US1] Test del caso de uso puro `retirar-categoria-de-ejercicios` (retira la categoría de todos los ejercicios; los que se quedan sin ninguna reciben "Sin categoría"; los demás conservan sus otras categorías FR-011) en `tests/unit/domain/retirar-categoria-de-ejercicios.spec.ts`
- [ ] T027 [P] [US1] Test del adaptador SQLite de ejercicios en memoria (crear/leer/actualizar/eliminar con enlaces e imágenes, incluido el contenido BLOB; `buscarPorTexto`; `buscarPorCategorias`; `quitarCategoriaDeTodos`) en `tests/unit/infrastructure/ejercicio-repository.sqlite.spec.ts`
- [ ] T028 [P] [US1] Test del adaptador SQLite de categorías en memoria (nombre repetido → `ErrorNombreDuplicado`; eliminar o renombrar la genérica → `ErrorOperacionNoPermitida`; `listarTodas()` en orden alfabético) en `tests/unit/infrastructure/categoria-repository.sqlite.spec.ts`
- [ ] T029 [P] [US1] Test del caso de uso "gestionar ejercicio" con puertos simulados (valida con el dominio antes de guardar; tras crear, modificar o eliminar llama a `marcarCambiosLocalesPendientes(true)`) en `tests/unit/application/gestionar-ejercicio.use-case.spec.ts`
- [ ] T030 [P] [US1] Test del caso de uso "gestionar categoría" con puertos simulados (eliminar aplica `retirar-categoria-de-ejercicios` antes de borrar; marca cambios locales pendientes) en `tests/unit/application/gestionar-categoria.use-case.spec.ts`
- [ ] T031 [P] [US1] Test del caso de uso "sembrar catálogo predefinido" (crea "Sin categoría", las 7 categorías y los 23 ejercicios del catálogo solo si `estaCatalogoPredefinidoCargado()` es `false`; resuelve las categorías de cada ejercicio por nombre; no se repite en arranques posteriores; NO marca `cambiosLocalesPendientes` FR-034) y test de integridad del archivo de catálogo (todos sus ejercicios superan `validar-ejercicio` y todas las categorías referenciadas existen) en `tests/unit/application/sembrar-catalogo-predefinido.use-case.spec.ts`
- [ ] T032 [P] [US1] Test de componente del formulario de ejercicio con Signal Forms (rechaza nombre/descripción vacíos, URL inválida e imagen de archivo de más de 5 MB con mensajes en español; escenarios 2, 3 y 6 de US1) en `tests/component/presentation/ejercicio-formulario.component.spec.ts`
- [ ] T033 [P] [US1] Test de componente de gestión de categorías (crear, listar en orden alfabético, nombre duplicado rechazado, eliminar con aviso de retirada automática; escenarios 1, 4 y 5 de US1) en `tests/component/presentation/categoria-gestion.component.spec.ts`
- [ ] T034 [P] [US1] Test de componente del listado de la biblioteca (muestra el catálogo predefinido, escenario 7; muestra "no hay ejercicios" cuando la lista está vacía FR-029) en `tests/component/presentation/biblioteca-listado.component.spec.ts`
- [ ] T035 [P] [US1] Test de integración de rutas de biblioteca (navegar a la ruta de biblioteca muestra el listado de ejercicios; el menú resalta la entrada activa) en `tests/component/presentation/shell-biblioteca.integration.spec.ts`

### Implementation for User Story 1

- [ ] T036 [P] [US1] Crear la entidad Ejercicio y el caso de uso puro `validar-ejercicio` en `src/app/domain/ejercicio/ejercicio.entity.ts` y `src/app/domain/ejercicio/validar-ejercicio.ts`, con los campos y reglas de data-model.md § Ejercicio (depende de T024)
- [ ] T037 [P] [US1] Crear la entidad Categoría (con `esGenerica`) y los casos de uso puros `validar-categoria` y `retirar-categoria-de-ejercicios` en `src/app/domain/categoria/`, según data-model.md § Categoría (depende de T025, T026)
- [ ] T038 [US1] Definir la interfaz `EjercicioRepositoryPort` en `src/app/application/ports/ejercicio-repository.port.ts`, según contracts/ejercicio-repository.port.md (depende de T036)
- [ ] T039 [US1] Definir la interfaz `CategoriaRepositoryPort` en `src/app/application/ports/categoria-repository.port.ts`, según contracts/categoria-repository.port.md (depende de T037)
- [ ] T040 [US1] Implementar el adaptador SQLite de `EjercicioRepositoryPort` en `src/app/infrastructure/persistencia-sqlite/ejercicio-repository.sqlite.ts` (depende de T018, T027, T038)
- [ ] T041 [US1] Implementar el adaptador SQLite de `CategoriaRepositoryPort` en `src/app/infrastructure/persistencia-sqlite/categoria-repository.sqlite.ts` (depende de T018, T028, T039)
- [ ] T042 [US1] Implementar el caso de uso "gestionar ejercicio" en `src/app/application/casos-uso/gestionar-ejercicio.use-case.ts` (depende de T020, T029, T040)
- [ ] T043 [US1] Implementar el caso de uso "gestionar categoría" en `src/app/application/casos-uso/gestionar-categoria.use-case.ts` (depende de T020, T030, T040, T041)
- [ ] T044 [P] [US1] Copiar el anexo aprobado `specs/001-gestion-ejercicios-fisicos/catalogo-predefinido.json` (7 categorías y 23 ejercicios, formato en data-model.md § Catálogo predefinido) a `src/assets/catalogo-predefinido/catalogo.json` (FR-034)
- [ ] T045 [US1] Implementar el caso de uso "sembrar catálogo predefinido" en `src/app/application/casos-uso/sembrar-catalogo-predefinido.use-case.ts` e invocarlo desde `arrancar-aplicacion.use-case.ts` (depende de T021, T031, T041, T042, T044)
- [ ] T046 [P] [US1] Construir los componentes de la biblioteca (listado con mensaje de lista vacía; formulario de alta/edición con Signal Forms; imágenes por URL o por archivo de hasta 5 MB) en `src/app/presentation/biblioteca-ejercicios/` (depende de T032, T034, T042)
- [ ] T047 [P] [US1] Construir el componente de gestión de categorías (listado alfabético, alta, edición, eliminación con aviso de retirada automática a "Sin categoría") en `src/app/presentation/biblioteca-ejercicios/categorias/` (depende de T033, T043)
- [ ] T048 [US1] Integrar las rutas y el menú de biblioteca y categorías en `src/app/presentation/compartido/shell/` (depende de T023, T046, T047, T035)

**Checkpoint**: La Historia de Usuario 1 es completamente funcional y probable de forma independiente.

---

## Phase 4: User Story 2 - Buscar y consultar ejercicios (Priority: P2)

**Goal**: Buscar ejercicios por categoría o por texto y visualizar sus vídeos e información sin salir de la aplicación.

**Independent Test**: Con varios ejercicios en distintas categorías, comprobar que las búsquedas por categoría y por texto devuelven lo correcto y que un ejercicio con vídeo muestra el reproductor integrado (quickstart.md § US2).

### Tests for User Story 2 ⚠️

- [ ] T049 [P] [US2] Test del caso de uso puro `extraer-id-youtube` (formatos `youtube.com/watch?v=`, `youtu.be/`, `youtube.com/embed/`; URL que no es de YouTube → nulo) en `tests/unit/domain/extraer-id-youtube.spec.ts`
- [ ] T050 [P] [US2] Test del caso de uso "buscar ejercicios" con puertos simulados (texto parcial sin distinguir mayúsculas sobre nombre y descripción FR-013; una o varias categorías FR-012; lista vacía sin error CL3; biblioteca vacía CL1) en `tests/unit/application/buscar-ejercicios.use-case.spec.ts`
- [ ] T051 [P] [US2] Test de componente del reproductor de YouTube embebido (muestra el iframe de `youtube-nocookie.com/embed/<id>` FR-015; muestra "vídeo no disponible" si falla CL5, FR-033) en `tests/component/presentation/youtube-embed.component.spec.ts`
- [ ] T052 [P] [US2] Test de componente de previsualización de enlace externo (iframe sandboxed; si el sitio no se puede embeber, ofrece "abrir en una pestaña nueva" FR-016) en `tests/component/presentation/enlace-embed.component.spec.ts`
- [ ] T053 [P] [US2] Test de componente de búsqueda (filtro por categorías, texto libre, mensaje cuando no hay resultados FR-031) en `tests/component/presentation/busqueda-ejercicios.component.spec.ts`
- [ ] T054 [P] [US2] Test de integración de rutas de búsqueda y de los componentes embebidos en la ficha de ejercicio (navegar a la ruta de búsqueda muestra el buscador; abrir un ejercicio con vídeo de YouTube muestra el reproductor embebido dentro de la ficha) en `tests/component/presentation/shell-busqueda.integration.spec.ts`

### Implementation for User Story 2

- [ ] T055 [P] [US2] Implementar el caso de uso puro `extraer-id-youtube` en `src/app/domain/ejercicio/extraer-id-youtube.ts` (depende de T049)
- [ ] T056 [US2] Implementar el caso de uso "buscar ejercicios" en `src/app/application/casos-uso/buscar-ejercicios.use-case.ts` (depende de T040, T050)
- [ ] T057 [P] [US2] Construir el componente de búsqueda en `src/app/presentation/busqueda-ejercicios/` (depende de T053, T056)
- [ ] T058 [P] [US2] Construir el componente del reproductor de YouTube embebido en `src/app/presentation/compartido/embebidos/youtube-embed.component.ts` (depende de T051, T055)
- [ ] T059 [P] [US2] Construir el componente de previsualización de enlace externo en `src/app/presentation/compartido/embebidos/enlace-embed.component.ts` (depende de T052)
- [ ] T060 [US2] Integrar los componentes embebidos en la ficha de ejercicio de `src/app/presentation/biblioteca-ejercicios/` y en los resultados de `src/app/presentation/busqueda-ejercicios/` (depende de T046, T057, T058, T059, T054)
- [ ] T061 [US2] Integrar la ruta y el menú de búsqueda en `src/app/presentation/compartido/shell/` (depende de T023, T057, T054)

**Checkpoint**: Las Historias de Usuario 1 y 2 funcionan de forma independiente.

---

## Phase 5: User Story 3 - Planificar la semana de ejercicios (Priority: P3)

**Goal**: Crear planificaciones semanales (concretas o plantillas), asociar ejercicios a días y consultar la planificación de hoy, de cualquier día o de la semana.

**Independent Test**: Crear una planificación, asociar ejercicios a distintos días, duplicarla y comprobar que al abrir la aplicación se muestra la planificación de hoy (quickstart.md § US3).

### Tests for User Story 3 ⚠️

- [ ] T062 [P] [US3] Test del caso de uso puro `es-activa` (una planificación concreta es activa si y solo si la fecha de referencia cae entre su `fechaInicio` y el domingo siguiente; una plantilla nunca es activa FR-022) en `tests/unit/domain/es-activa.spec.ts`
- [ ] T063 [P] [US3] Test del caso de uso puro `validar-fecha-inicio` ("DEBE ser un lunes"; no puede repetirse la `fechaInicio` de otra planificación concreta FR-017, FR-022) en `tests/unit/domain/validar-fecha-inicio.spec.ts`
- [ ] T064 [P] [US3] Test del caso de uso puro `validar-asignacion-dia` ("Un mismo ejercicio no puede repetirse dentro de la lista del mismo día de la misma planificación" FR-021) en `tests/unit/domain/validar-asignacion-dia.spec.ts`
- [ ] T065 [P] [US3] Test del caso de uso puro `duplicar-planificacion` (copia independiente con los mismos días y ejercicios y sin `fechaInicio` FR-019, CA14) en `tests/unit/domain/duplicar-planificacion.spec.ts`
- [ ] T066 [P] [US3] Test del adaptador SQLite de planificaciones en memoria (`fechaInicio` repetida → `ErrorPlanificacionActivaDuplicada`; ejercicio repetido en un día → `ErrorEjercicioDuplicadoEnDia`; `obtenerActiva()`; `listarPorEjercicio()`; al borrar un ejercicio desaparece de todos los días de todas las planificaciones FR-028, CA13) en `tests/unit/infrastructure/planificacion-repository.sqlite.spec.ts`
- [ ] T067 [P] [US3] Test del caso de uso "gestionar planificación" con puertos simulados (crear concreta o plantilla; asignar y quitar ejercicios por día; duplicar; crear una concreta a partir de una plantilla asignándole un lunes; marca cambios locales pendientes) en `tests/unit/application/gestionar-planificacion.use-case.spec.ts`
- [ ] T068 [P] [US3] Test del caso de uso "consultar planificación" con puertos simulados (planificación de hoy, de un día concreto y de la semana; todos los ejercicios de una planificación FR-023; `null` cuando no hay planificación para hoy CL2) en `tests/unit/application/consultar-planificacion.use-case.spec.ts`
- [ ] T069 [P] [US3] Test de componente del calendario semanal (marca visualmente los días con ejercicios FR-003) en `tests/component/presentation/calendario-semanal.component.spec.ts`
- [ ] T070 [P] [US3] Test de componente del constructor de planificación con Signal Forms (el selector de fecha solo permite lunes; impide duplicados en un día; duplicar planificación) en `tests/component/presentation/planificacion-constructor.component.spec.ts`
- [ ] T071 [P] [US3] Test de componente de la vista "hoy" (muestra la planificación del día FR-008; mensaje "no hay ejercicios programados hoy" FR-030) en `tests/component/presentation/dia-actual.component.spec.ts`
- [ ] T072 [P] [US3] Test de integración de la pantalla de inicio y de las rutas de planificación (la ruta raíz `/` muestra la vista "hoy" sin navegación adicional FR-008; navegar al calendario y al constructor de planificación funciona desde el menú) en `tests/component/presentation/shell-planificacion.integration.spec.ts`

### Implementation for User Story 3

- [ ] T073 [P] [US3] Crear las entidades Planificación y Día de planificación en `src/app/domain/planificacion/planificacion.entity.ts`, según data-model.md § Planificación y § Día de planificación
- [ ] T074 [US3] Implementar los casos de uso puros `es-activa.ts`, `validar-fecha-inicio.ts`, `validar-asignacion-dia.ts` y `duplicar-planificacion.ts` en `src/app/domain/planificacion/` (depende de T062, T063, T064, T065, T073)
- [ ] T075 [US3] Definir la interfaz `PlanificacionRepositoryPort` en `src/app/application/ports/planificacion-repository.port.ts`, según contracts/planificacion-repository.port.md (depende de T073)
- [ ] T076 [US3] Implementar el adaptador SQLite de `PlanificacionRepositoryPort` en `src/app/infrastructure/persistencia-sqlite/planificacion-repository.sqlite.ts` (depende de T018, T066, T075)
- [ ] T077 [US3] Implementar el caso de uso "gestionar planificación" en `src/app/application/casos-uso/gestionar-planificacion.use-case.ts` (depende de T020, T067, T074, T076)
- [ ] T078 [US3] Implementar el caso de uso "consultar planificación" en `src/app/application/casos-uso/consultar-planificacion.use-case.ts` (depende de T068, T074, T076)
- [ ] T079 [P] [US3] Construir el componente del calendario semanal en `src/app/presentation/planificacion-semanal/calendario/` (depende de T069, T078)
- [ ] T080 [P] [US3] Construir el constructor de planificación con Signal Forms en `src/app/presentation/planificacion-semanal/constructor/` (depende de T070, T077)
- [ ] T081 [P] [US3] Construir la vista "hoy" en `src/app/presentation/planificacion-semanal/dia-actual/` (depende de T071, T078)
- [ ] T082 [US3] Configurar la vista "hoy" como pantalla de inicio de la aplicación (FR-008, SC-003) e integrar las rutas y el menú de planificación en `src/app/presentation/compartido/shell/` (depende de T023, T079, T080, T081, T072)

**Checkpoint**: Las Historias de Usuario 1, 2 y 3 funcionan de forma independiente.

---

## Phase 6: User Story 4 - Marcar el progreso diario (Priority: P4)

**Goal**: Marcar cada ejercicio planificado como realizado y ver el progreso del día.

**Independent Test**: Marcar como realizados los ejercicios de un día y comprobar que el indicador muestra el porcentaje correcto (quickstart.md § US4).

### Tests for User Story 4 ⚠️

- [ ] T083 [P] [US4] Test del caso de uso puro `calcular-porcentaje-dia` (0%, parcial y 100% FR-025, CA10; sin ejercicios planificados devuelve un resultado distinguible de "0% completado" CL2) en `tests/unit/domain/calcular-porcentaje-dia.spec.ts`
- [ ] T084 [P] [US4] Test del adaptador SQLite de progreso diario en memoria (`marcar()` crea o actualiza el registro de `(fecha, ejercicioId)`; `obtenerPorFecha()`) en `tests/unit/infrastructure/progreso-diario-repository.sqlite.spec.ts`
- [ ] T085 [P] [US4] Test del caso de uso "gestionar progreso diario" con puertos simulados (marcar y desmarcar FR-024; el porcentaje se obtiene del dominio; marca cambios locales pendientes) en `tests/unit/application/gestionar-progreso-diario.use-case.spec.ts`
- [ ] T086 [P] [US4] Test de componente del progreso diario (casilla por ejercicio y porcentaje del día) en `tests/component/presentation/progreso-diario.component.spec.ts`
- [ ] T087 [P] [US4] Test de integración del progreso diario dentro de la vista "hoy" (marcar un ejercicio como realizado desde la vista "hoy" actualiza el indicador de progreso sin navegar a otra pantalla) en `tests/component/presentation/dia-actual-progreso.integration.spec.ts`

### Implementation for User Story 4

- [ ] T088 [P] [US4] Crear la entidad Progreso diario y el caso de uso puro `calcular-porcentaje-dia` en `src/app/domain/progreso-diario/`, según data-model.md § Progreso diario (depende de T083)
- [ ] T089 [US4] Definir la interfaz `ProgresoDiarioRepositoryPort` en `src/app/application/ports/progreso-diario-repository.port.ts`, según contracts/progreso-diario-repository.port.md (depende de T088)
- [ ] T090 [US4] Implementar el adaptador SQLite de `ProgresoDiarioRepositoryPort` en `src/app/infrastructure/persistencia-sqlite/progreso-diario-repository.sqlite.ts` (depende de T018, T084, T089)
- [ ] T091 [US4] Implementar el caso de uso "gestionar progreso diario" en `src/app/application/casos-uso/gestionar-progreso-diario.use-case.ts` (depende de T020, T076, T085, T090)
- [ ] T092 [P] [US4] Construir el componente de progreso diario en `src/app/presentation/progreso-diario/` (depende de T086, T091)
- [ ] T093 [US4] Integrar el componente de progreso diario en la vista "hoy" de `src/app/presentation/planificacion-semanal/dia-actual/` (depende de T081, T092, T087)

**Checkpoint**: Las Historias de Usuario 1 a 4 funcionan de forma independiente.

---

## Phase 7: User Story 5 - Conservar y sincronizar la información (Priority: P5)

**Goal**: Conservar los datos entre sesiones y sincronizarlos manualmente con GitHub mediante un token fine-grained, subiendo o descargando según dónde haya cambios y pidiendo al usuario que elija cuando hay cambios en ambos lados.

**Independent Test**: Reabrir la aplicación y ver los datos; sincronizar desde un navegador y comprobar en otro navegador, con el mismo token, que aparecen los mismos datos (quickstart.md § US5).

### Tests for User Story 5 ⚠️

- [ ] T094 [P] [US5] Test del caso de uso puro `decidir-accion-sincronizacion` cubriendo las 6 filas de la tabla de contracts/github-sync.port.md (incluida la primera sincronización con datos remotos → conflicto con `conservar_remoto` por defecto FR-035) en `tests/unit/domain/decidir-accion-sincronizacion.spec.ts`
- [ ] T095 [P] [US5] Test del caso de uso "exportar/importar datos" con puertos simulados (el JSON incluye ejercicios, categorías, planificaciones y progreso; las imágenes de archivo aparecen en `datos.json` solo como ruta `imagenes/<id>.json`, nunca con su contenido incrustado; el token y el repositorio NUNCA aparecen en el JSON FR-037; importar reemplaza los datos locales y descarga y guarda localmente, vía `leerImagen()`, cada imagen de archivo referenciada) en `tests/unit/application/exportar-importar-datos.use-case.spec.ts`
- [ ] T096 [P] [US5] Test del adaptador de GitHub con `HttpTestingController` (`leerRemoto` con y sin datos; `escribirRemoto` sube cada imagen como un documento `imagenes/<id>.json` en base64 y después `datos.json` con el SHA esperado; `leerImagen` descarga y parsea un documento `imagenes/<id>.json` con el formato raw; respuesta de conflicto → `ErrorConflictoRemoto`; sin red → `ErrorRedSincronizacion`; 401/403 → `ErrorAutenticacionGitHub`; el token solo va en la cabecera de autorización) en `tests/unit/infrastructure/github-sync.adapter.spec.ts`
- [ ] T097 [P] [US5] Test del caso de uso "sincronizar con GitHub" con puertos simulados (subir, descargar, nada y conflicto; resolver conflicto con la versión elegida; tras completar guarda el SHA nuevo y `cambiosLocalesPendientes = false`; ante error de red no modifica ningún dato local FR-032, CL4) en `tests/unit/application/sincronizar-github.use-case.spec.ts`
- [ ] T098 [P] [US5] Test de componente de configuración de sincronización con Signal Forms (token oculto; guía para crear un repositorio privado solo de datos (p. ej. `data-physical-exercises`) y un token fine-grained limitado a ese repositorio; botón "Olvidar token"; botón de sincronizar; mensajes de éxito y error en español FR-002, FR-037) en `tests/component/presentation/configuracion-sincronizacion.component.spec.ts`
- [ ] T099 [P] [US5] Test de componente de resolución de conflicto (opciones "conservar mis datos" y "usar los datos de GitHub", con la opción por defecto que indique el caso de uso FR-035) en `tests/component/presentation/resolucion-conflicto.component.spec.ts`
- [ ] T100 [P] [US5] Test de integración de rutas de sincronización (navegar a la ruta de sincronización muestra la configuración; tras un conflicto se muestra la pantalla de resolución desde el mismo flujo) en `tests/component/presentation/shell-sincronizacion.integration.spec.ts`

### Implementation for User Story 5

- [ ] T101 [P] [US5] Implementar el caso de uso puro `decidir-accion-sincronizacion` en `src/app/domain/sincronizacion/decidir-accion-sincronizacion.ts` (depende de T094)
- [ ] T102 [US5] Definir la interfaz `GitHubSyncPort` y los tipos `LecturaRemota`, `CredencialesGitHub` y `ExportacionJSON` en `src/app/application/ports/github-sync.port.ts`, según contracts/github-sync.port.md
- [ ] T103 [US5] Implementar el adaptador de `GitHubSyncPort` con `HttpClient` en `src/app/infrastructure/github-sync/github-sync.adapter.ts` (los Observables quedan dentro del adaptador; los métodos devuelven `Promise` como define el contrato) (depende de T096, T102)
- [ ] T104 [US5] Implementar el caso de uso "exportar/importar datos" en `src/app/application/casos-uso/exportar-importar-datos.use-case.ts` (exportar construye `ExportacionJSON` + la lista de `ImagenArchivoJSON` a subir; importar reemplaza los datos locales y descarga vía `leerImagen()` cada imagen de archivo referenciada, guardándola localmente para uso sin conexión) (depende de T040, T041, T076, T090, T095, T102)
- [ ] T105 [US5] Implementar el caso de uso "sincronizar con GitHub" en `src/app/application/casos-uso/sincronizar-github.use-case.ts` (depende de T020, T097, T101, T103, T104)
- [ ] T106 [P] [US5] Construir el componente de configuración de sincronización en `src/app/presentation/sincronizacion/configuracion/` (depende de T098, T105)
- [ ] T107 [P] [US5] Construir el componente de resolución de conflicto en `src/app/presentation/sincronizacion/conflicto/` (depende de T099, T105)
- [ ] T108 [US5] Integrar las rutas y el menú de sincronización en `src/app/presentation/compartido/shell/` (depende de T023, T106, T107, T100)

**Checkpoint**: Las 5 historias de usuario funcionan de forma independiente y conjunta.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Mejoras que afectan a varias historias de usuario

- [ ] T109 [P] Revisar el diseño responsive y la accesibilidad de todos los componentes de `src/app/presentation/` en móvil y escritorio (Principio IV, FR-026)
- [ ] T110 [P] Ejecutar ESLint en todo el proyecto y corregir hasta cero errores (constitución § Calidad de Código y Pruebas)
- [ ] T111 [P] Ejecutar Vitest con cobertura y añadir pruebas hasta cumplir el 80% global y el 100% en `src/app/domain/` (constitución § Calidad de Código y Pruebas)
- [ ] T112 [P] Revisar que todos los textos de interfaz y mensajes de validación y error de `src/app/presentation/` estén en español de España (Principio I)
- [ ] T113 Publicar mediante `.github/workflows/deploy.yml` y comprobar en la URL de GitHub Pages que la aplicación carga, que las rutas funcionan al recargar y que los datos se conservan tras cerrar y reabrir el navegador (VFS `opfs-sahpool`) (depende de T011)
- [ ] T114 Para validar la Historia de Usuario 5: crear en GitHub el repositorio **privado** de datos `data-physical-exercises` (vacío, distinto del repositorio del código) y un token *fine-grained* limitado solo a ese repositorio con permiso de lectura y escritura de contenidos, según quickstart.md § Requisitos previos (FR-037)
- [ ] T115 Ejecutar manualmente la guía completa de `quickstart.md` (las 5 historias de usuario y los casos límite) en la URL publicada en GitHub Pages y corregir cualquier desviación (depende de T113, T114)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sin dependencias — puede empezar inmediatamente
- **Foundational (Phase 2)**: Depende de Setup — BLOQUEA todas las historias de usuario
- **Historias de usuario (Phases 3–7)**: Dependen de Foundational; pueden avanzar en paralelo o en orden P1 → P5
- **Polish (Phase 8)**: Depende de las historias que se quieran entregar

### User Story Dependencies

- **US1 (P1)**: Solo depende de Foundational. Es el MVP.
- **US2 (P2)**: Reutiliza el adaptador de ejercicios de US1 (T040) y se integra en su ficha (T046), pero se prueba de forma independiente.
- **US3 (P3)**: Necesita ejercicios de US1 para planificar. El borrado en cascada de FR-028 está en el esquema (T018) y se verifica en T066.
- **US4 (P4)**: Usa la planificación activa de US3 (T076) y se integra en la vista "hoy" (T081).
- **US5 (P5)**: La exportación reutiliza los adaptadores de US1, US3 y US4 (T040, T041, T076, T090).

### Within Each Phase

- Los tests DEBEN escribirse y fallar antes de implementar (constitución)
- Casos de uso puros de Domain → puertos → adaptadores → casos de uso de Application → componentes de Presentation → integración en el shell

### Parallel Opportunities

- Setup: T008, T009 y T010
- Foundational: los tests T012–T014, y después T016, T019, T022 y T023
- Dentro de cada historia: todos los tests marcados [P]; las entidades y casos de uso puros marcados [P]; los componentes de Presentation marcados [P]
- Tras Foundational, US1 y la parte de dominio de US2–US5 pueden avanzar en paralelo

---

## Parallel Example: User Story 1

```bash
# Tests de US1 en paralelo:
Task: "Test validar-ejercicio en tests/unit/domain/validar-ejercicio.spec.ts"
Task: "Test validar-categoria en tests/unit/domain/validar-categoria.spec.ts"
Task: "Test retirar-categoria-de-ejercicios en tests/unit/domain/retirar-categoria-de-ejercicios.spec.ts"
Task: "Test adaptador SQLite de ejercicios en tests/unit/infrastructure/ejercicio-repository.sqlite.spec.ts"
Task: "Test adaptador SQLite de categorías en tests/unit/infrastructure/categoria-repository.sqlite.spec.ts"

# Dominio de US1 en paralelo:
Task: "Entidad Ejercicio y validar-ejercicio en src/app/domain/ejercicio/"
Task: "Entidad Categoría, validar-categoria y retirar-categoria-de-ejercicios en src/app/domain/categoria/"
```

---

## Implementation Strategy

### MVP First (solo User Story 1)

1. Completar Phase 1 (Setup) y Phase 2 (Foundational)
2. Completar Phase 3 (US1), incluido el catálogo predefinido
3. **PARAR Y VALIDAR** con quickstart.md § US1
4. Publicar en GitHub Pages con el workflow de T010

### Incremental Delivery

1. Setup + Foundational → base lista y desplegable
2. US1 → validar → publicar (MVP)
3. US2 → validar → publicar
4. US3 → validar → publicar
5. US4 → validar → publicar
6. US5 → validar → publicar
7. Polish
