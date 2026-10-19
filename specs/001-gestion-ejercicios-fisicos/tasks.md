---
description: "Tareas consolidadas para completar y verificar la feature 001"
---

# Tareas: Gestión integral de ejercicios y planificación semanal

**Input**: [spec.md](./spec.md) y [plan.md](./plan.md)

**Alcance**: 6 historias de usuario, FR-001…FR-048. Se conservaron como completadas únicamente las partes cuyo código y, cuando corresponde, sus pruebas están presentes en el repositorio. `[X]` no significa que la suite se haya ejecutado durante esta reconstrucción.

**Tests**: Test-first obligatorio. Las tareas de pruebas pendientes preceden a sus tareas de implementación. Vitest es el runner; los umbrales vigentes son 80% global y 100% en Domain.

**Formato**: `[ID] [P?] [US?] Descripción`; todas las rutas son relativas a la raíz del repositorio.

---

## Phase 1: Setup

**Purpose**: Establecer las herramientas y convenciones ya usadas por la aplicación.

- [X] T001 Confirmar el workspace Angular standalone y zoneless y las dependencias existentes en `package.json`, `angular.json`, `src/main.ts` y `src/app/app.config.ts`.
- [X] T002 Configurar ESLint y Vitest para `tests/**/*.spec.ts`, con los umbrales de cobertura de la constitución, en `eslint.config.js`, `angular.json`, `vitest-base.config.mts` y `tsconfig.spec.json`.
- [X] T003 Configurar Angular Material 3, tema claro, estilos globales y tokens de diseño en `src/styles.scss` y `src/styles/`.
- [X] T004 Configurar la compilación y publicación estática en GitHub Pages, incluidos los presupuestos actuales, en `.github/workflows/deploy.yml` y `angular.json`.

---

## Phase 2: Foundational

**Purpose**: Conservar persistencia, arranque y componentes comunes requeridos por las historias funcionales.

- [X] T005 Implementar la conexión SQLite WASM, el esquema y los adaptadores de persistencia, con pruebas en `src/app/infrastructure/persistencia-sqlite/` y `tests/unit/infrastructure/` (FR-027).
- [X] T006 Implementar el arranque, la carga de datos y la siembra del catálogo predefinido con pruebas en `src/app/application/casos-uso/arrancar-aplicacion.use-case.ts`, `src/app/application/casos-uso/sembrar-catalogo-predefinido.use-case.ts` y `tests/unit/application/` (FR-001, FR-034).
- [X] T007 Implementar los componentes compartidos de cabecera, estado vacío y feedback, con sus pruebas, en `src/app/presentation/compartido/ui/` y `tests/component/presentation/compartido/ui/` (FR-029…FR-031, FR-038, FR-042, FR-044).

---

## Phase 3: User Story 1 - Gestionar la biblioteca personal (P1)

**Goal**: Gestionar ejercicios y categorías, incluido el feedback y la presentación de biblioteca/formulario.

**Independent Test**: Crear, editar y eliminar ejercicios; crear y eliminar categorías; verificar validaciones, estados de la biblioteca, formulario y persistencia de los cambios. Corresponde a US1.AS1–AS14.

- [X] T008 [P] [US1] Implementar entidades y reglas de validación para ejercicios y categorías, con cobertura unitaria, en `src/app/domain/ejercicio/`, `src/app/domain/categoria/` y `tests/unit/domain/validar-ejercicio.spec.ts`, `tests/unit/domain/validar-categoria.spec.ts`, `tests/unit/domain/retirar-categoria-de-ejercicios.spec.ts` (FR-004, FR-005, FR-006, FR-007, FR-009, FR-010, FR-011, FR-014; US1.AS2–AS6).
- [X] T009 [US1] Implementar los casos de uso y repositorios de ejercicios y categorías —incluida la actualización de categoría en la capa de aplicación— con pruebas en `src/app/application/casos-uso/gestionar-ejercicio.use-case.ts`, `src/app/application/casos-uso/gestionar-categoria.use-case.ts`, `src/app/infrastructure/persistencia-sqlite/ejercicio-repository.sqlite.ts`, `src/app/infrastructure/persistencia-sqlite/categoria-repository.sqlite.ts` y sus pruebas en `tests/unit/` (FR-004, FR-009…FR-011).
- [X] T010 [US1] Implementar la presentación de biblioteca, ficha y formulario de ejercicio, con creación, edición, eliminación, enlaces e imágenes por URL o archivo, en `src/app/presentation/biblioteca-ejercicios/` y cubrirla en `tests/component/presentation/biblioteca-listado.component.spec.ts`, `tests/component/presentation/ejercicio-ficha.component.spec.ts` y `tests/component/presentation/ejercicio-formulario.component.spec.ts` (FR-004, FR-005, FR-006, FR-007, FR-014, FR-036; US1.AS1–AS7, AS11–AS14).
- [X] T011 [US1] Aplicar la presentación de lista y formulario —cabeceras, tarjetas, estado vacío, carga, secciones, obligatoriedad y feedback— y la creación/eliminación de categorías en `src/app/presentation/biblioteca-ejercicios/`, con pruebas en `tests/component/presentation/` (FR-029, FR-038, FR-039, FR-040, FR-041, FR-042, FR-044; US1.AS8–AS9, AS11–AS14).
- [X] T012 [US1] Añadir pruebas de componente para editar una categoría, presentar el estado de carga y mostrar feedback de creación/edición/eliminación junto al contexto afectado en `tests/component/presentation/categoria-gestion.component.spec.ts` (FR-009, FR-040, FR-042; US1.AS10, AS13).
- [X] T013 [US1] Completar la interfaz de edición de categorías usando `GestionarCategoriaUseCase.actualizar`, mostrar el estado de carga y asociar el feedback al formulario o elemento afectado en `src/app/presentation/biblioteca-ejercicios/categorias/categoria-gestion.component.ts`, `categoria-gestion.component.html` y `categoria-gestion.component.scss` (depende de T012; FR-009, FR-040, FR-042; US1.AS10, AS13).

---

## Phase 4: User Story 2 - Buscar y consultar ejercicios (P2)

**Goal**: Buscar por texto y categoría y consultar ejercicios, vídeos, enlaces e imágenes.

**Independent Test**: Buscar por texto y categorías, consultar resultados vacíos y abrir fichas con contenido multimedia. Corresponde a US2.AS1–AS7.

- [X] T014 [US2] Implementar la búsqueda por nombre, descripción y una o varias categorías, sus estados vacíos y su presentación responsive en `src/app/application/casos-uso/buscar-ejercicios.use-case.ts` y `src/app/presentation/busqueda-ejercicios/`, con pruebas en `tests/unit/application/buscar-ejercicios.use-case.spec.ts` y `tests/component/presentation/busqueda-ejercicios.component.spec.ts` (FR-012, FR-013, FR-031, FR-039; US2.AS1–AS2, AS4–AS7).
- [X] T015 [US2] Implementar la ficha y las previsualizaciones de YouTube y enlaces externos, incluido el fallback cuando un destino no se puede embeber, en `src/app/presentation/biblioteca-ejercicios/ejercicio-ficha.component.ts` y `src/app/presentation/compartido/embebidos/`, con pruebas en `tests/component/presentation/ejercicio-ficha.component.spec.ts`, `youtube-embed.component.spec.ts` y `enlace-embed.component.spec.ts` (FR-015, FR-016, FR-033; US2.AS3).
- [X] T016 [P] [US2] Añadir una prueba de componente que simule el fallo de carga de una imagen y compruebe que se indica el error sin ocultar el resto de la ficha en `tests/component/presentation/ejercicio-ficha.component.spec.ts` (FR-014, FR-036; caso límite de imagen no disponible).
- [X] T017 [US2] Añadir un fallback visual al fallo de carga de imágenes y mantener visibles los demás datos del ejercicio en `src/app/presentation/biblioteca-ejercicios/ejercicio-ficha.component.html`, `ejercicio-ficha.component.ts` y `ejercicio-ficha.component.scss` (depende de T016; FR-014, FR-036).

---

## Phase 5: User Story 3 - Planificar la semana de ejercicios (P3)

**Goal**: Crear planificaciones semanales y plantillas, asignar ejercicios y consultar calendarios y días.

**Independent Test**: Crear o duplicar una planificación, asignar ejercicios y consultar el día y la semana; desde “Hoy”, abrir directamente la ficha de un ejercicio con una acción independiente de marcarlo como realizado. Corresponde a US3.AS1–AS11, FR-048 y SC-015.

- [X] T018 [P] [US3] Implementar entidades, validaciones y casos de uso de planificación, calendario y persistencia, con pruebas en `src/app/domain/planificacion/`, `src/app/application/casos-uso/gestionar-planificacion.use-case.ts`, `consultar-planificacion.use-case.ts`, `src/app/infrastructure/persistencia-sqlite/planificacion-repository.sqlite.ts` y `tests/unit/` (FR-017, FR-018, FR-019, FR-020, FR-021, FR-022, FR-023, FR-028; US3.AS1, AS4–AS9).
- [X] T019 [US3] Implementar calendario, constructor de planificación y vista de hoy con navegación y estados vacíos/carga en `src/app/presentation/planificacion-semanal/` y `src/app/app.routes.ts`, con pruebas en `tests/component/presentation/calendario-semanal.component.spec.ts`, `planificacion-constructor.component.spec.ts`, `dia-actual.component.spec.ts` y `shell-planificacion.integration.spec.ts` (FR-003, FR-008, FR-030, FR-038…FR-040; US3.AS1–AS3, AS10).

---

## Phase 6: User Story 4 - Marcar el progreso diario (P4)

**Goal**: Registrar ejercicios realizados y mostrar el porcentaje diario.

**Independent Test**: Marcar ejercicios y comprobar que los estados y el porcentaje del día se conservan. Corresponde a US4.AS1–AS4.

- [X] T020 [US4] Implementar el cálculo del progreso y su persistencia por fecha, con pruebas en `src/app/domain/progreso-diario/`, `src/app/application/casos-uso/gestionar-progreso-diario.use-case.ts`, `src/app/infrastructure/persistencia-sqlite/progreso-diario-repository.sqlite.ts` y `tests/unit/` (FR-024, FR-025).
- [X] T021 [US4] Implementar los controles de progreso y su integración en la vista de hoy en `src/app/presentation/progreso-diario/` y `src/app/presentation/planificacion-semanal/dia-actual/`, con pruebas en `tests/component/presentation/progreso-diario.component.spec.ts`, `dia-actual.component.spec.ts` y `dia-actual-progreso.integration.spec.ts` (FR-024, FR-025, FR-038…FR-040; US4.AS1–AS4).

---

## Phase 7: User Story 5 - Conservar y sincronizar la información (P5)

**Goal**: Conservar datos localmente y sincronizarlos de forma explícita con GitHub.

**Independent Test**: Comprobar persistencia entre sesiones, configurar la sincronización, resolver conflictos y verificar los datos en otro navegador. Corresponde a US5.AS1–AS8.

- [X] T022 [US5] Implementar exportación/importación de datos, gestión de ajustes y sincronización GitHub —incluidas imágenes, token y resolución de cambios concurrentes— en `src/app/application/casos-uso/`, `src/app/application/ports/` y `src/app/infrastructure/github-sync/`, con pruebas en `tests/unit/application/` y `tests/unit/infrastructure/` (FR-001, FR-002, FR-027, FR-028, FR-032, FR-035…FR-037; US5.AS1–AS7).
- [X] T023 [US5] Implementar configuración de sincronización, feedback, resolución de conflictos y rutas en `src/app/presentation/sincronizacion/` y `src/app/app.routes.ts`, con pruebas en `tests/component/presentation/configuracion-sincronizacion.component.spec.ts`, `resolucion-conflicto.component.spec.ts` y `shell-sincronizacion.integration.spec.ts` (FR-002, FR-032, FR-035, FR-037, FR-042; US5.AS2–AS8).

---

## Phase 8: User Story 6 - Usar una aplicación clara, coherente y accesible (P1)

**Goal**: Mantener cabeceras, acciones, feedback, accesibilidad y adaptación responsive coherentes en todas las pantallas funcionales.

**Independent Test**: Recorrer las rutas reales en varios tamaños de pantalla, comprobar navegación y operaciones con teclado, foco visible y contraste. Corresponde a US6.AS1–AS6.

- [X] T024 [US6] Integrar cabeceras, estados vacíos, feedback y estilos compartidos en las pantallas funcionales de `src/app/presentation/`, reutilizando `src/app/presentation/compartido/ui/` y `src/styles/`; las rutas de `src/app/app.routes.ts` apuntan a vistas funcionales (FR-029…FR-031, FR-038…FR-044).
- [X] T025 [P] [US6] Añadir pruebas de integración que verifiquen cabecera con título y acciones en las rutas funcionales en `tests/component/presentation/shell-biblioteca.integration.spec.ts`, `shell-busqueda.integration.spec.ts`, `shell-planificacion.integration.spec.ts` y `shell-sincronizacion.integration.spec.ts` (FR-038; US6.AS1).
- [X] T026 [P] [US6] Añadir pruebas de componente para el menú superpuesto hasta 599 px, el cierre al navegar, el modo lateral desde 600 px, la adaptación al redimensionar y el estado activo en `tests/component/presentation/shell.component.spec.ts` (FR-026, FR-043, FR-047; US6.AS2, AS3, AS5).
- [X] T027 [US6] Configurar el menú como overlay hasta 599 px y como panel lateral desde 600 px, manteniendo cierre en navegación y controles táctiles de tamaño suficiente en `src/app/presentation/compartido/shell/shell.component.html`, `shell.component.ts` y `shell.component.scss` (depende de T026; FR-026, FR-043, FR-047; US6.AS2–AS5).
- [X] T028 [US6] Eliminar el componente de placeholder que no se usa en ninguna ruta y retirar referencias/comentarios obsoletos en `src/app/presentation/compartido/shell/pagina-en-construccion.component.ts`, `src/app/presentation/compartido/shell/menu-principal.ts`, `src/app/presentation/compartido/ui/estado-vacio/estado-vacio.component.ts` y `tests/component/presentation/compartido/pagina-en-construccion.component.spec.ts` (FR-044).

---

## Phase 9: Polish y validación transversal

- [X] T029 Actualizar `specs/001-gestion-ejercicios-fisicos/quickstart.md` con recorridos verificables de las seis historias, los estados vacíos/carga, el feedback y las comprobaciones responsive/accesibles de US6.AS1–AS6 (FR-038…FR-047).
- [X] T030 Completar la comprobación manual desde la interfaz: contraste ≥4,5:1 para texto normal y ≥3:1 para texto grande/iconos, navegación con teclado y foco visible, controles táctiles, menú móvil y ausencia de solapamientos o desplazamiento horizontal en <360 px, rangos de referencia y anchos intermedios, siguiendo `specs/001-gestion-ejercicios-fisicos/quickstart.md` (FR-026, FR-045, FR-047; US6.AS2–AS6). Verificado en navegador a 320, 359, 375, 599, 600, 768, 1024 y 1280 px; las rutas muestreadas no presentan desbordamiento y los controles principales alcanzan 48 × 48 px.
- [X] T031 Ejecutar `npm run lint` y la suite Vitest con los umbrales configurados; corregir fallos y confirmar que los flujos funcionales conservan los resultados esperados (constitución; FR-046) en `eslint.config.js`, `angular.json`, `src/` y `tests/`. Validación ejecutada con `npx ng lint` y `npx ng test --watch=false`: 51 archivos, 322 pruebas aprobadas; cobertura global de líneas 94,92%.
- [X] T032 Ejecutar el build de producción y confirmar que respeta los presupuestos de `angular.json` (700 kB/1.5 MB inicial y 4/8 kB por estilo) en `.github/workflows/deploy.yml` y `angular.json`. Build correcto, sin superar los límites de error (1,5 MB inicial y 8 kB por estilo); el bundle inicial de 1,02 MB supera el umbral preventivo de 700 kB y genera una advertencia.

---

## Dependencias y orden

- Setup y Foundational están implementados; se conservan para reproducir el estado real sin recrear el proyecto.
- US1, US2 y US3 se apoyan en la biblioteca. US4 depende de US3; US5 integra y conserva los datos de US1, US3 y US4.
- US6 reutiliza los componentes ya implementados; T025 y T026 pueden desarrollarse en paralelo con T012 y T016 porque trabajan en archivos de prueba distintos.
- T013 depende de T012; T017 depende de T016; T027 depende de T026. T029–T032 se completan tras los cambios de las historias.
- El incremento FR-048 reutiliza capacidades ya existentes; T035 debe completarse antes de T036. T037 puede prepararse en paralelo con T035/T036; T038 depende de que T036 y T037 estén completadas.

## Oportunidades de paralelismo

- T012 (edición/carga de categorías), T016 (fallback de imagen), T025 (cabeceras por ruta) y T026 (menú responsive) pueden prepararse en paralelo.
- Tras esos tests, T013, T017 y T027 pueden implementarse en paralelo, al trabajar en componentes distintos.
- T030–T032 son validaciones finales y deben esperar a que terminen los cambios de implementación.
- T035 (prueba de navegación) y T037 (guía manual) pueden prepararse en paralelo; T036 se implementa tras T035 y T038 valida el incremento al final.

## Estrategia de entrega

El MVP funcional de biblioteca, planificación, progreso y sincronización ya existe. Para el siguiente incremento, completar el acceso directo de US3 a la ficha desde “Hoy” y ejecutar su validación de teclado, tacto, pruebas, lint y build. Las tareas marcadas `[X]` describen estado del código y presencia de pruebas, no una ejecución de la suite en esta reconstrucción.

## Phase 10: Convergence

- [X] T033 Completar el feedback contextual de eliminación de ejercicios: mostrar confirmación al terminar y un error visible si falla, y cubrir ambos resultados en `tests/component/presentation/ejercicio-ficha.component.spec.ts` y `src/app/presentation/biblioteca-ejercicios/ejercicio-ficha.component.ts`/`.html` (FR-042, SC-013; US1/AS13; partial).
- [X] T034 Garantizar que las acciones principales de todas las pantallas funcionales ofrecen un área táctil mínima de 48 × 48 px en móvil; añadir o ajustar estilos y verificar dimensiones en controles Material en los anchos móviles de referencia, en `src/styles.scss`, `src/app/presentation/` y `specs/001-gestion-ejercicios-fisicos/quickstart.md` (FR-026, SC-011; US6/AS5; partial).

## Phase 11: User Story 3 - Acceso directo a la ficha desde hoy (P3)

**Goal**: Abrir la ficha existente de cualquier ejercicio planificado para hoy sin pasar por la biblioteca y sin confundir la consulta con el control de progreso.

**Independent Test**: Desde `/inicio`, activar el acceso asociado a un ejercicio y comprobar que se abre la ficha de ese mismo ejercicio; verificar que el control de marcarlo como realizado sigue siendo independiente. Corresponde a US3.AS11, FR-048 y SC-015.

- [X] T035 [P] [US3] Añadir una prueba de integración que desde la planificación de hoy abra la ficha del ejercicio seleccionado mediante `/ejercicios/:id` y compruebe que el acceso es distinto del control de progreso en `tests/component/presentation/dia-actual-progreso.integration.spec.ts` (FR-048, US3.AS11, SC-015).
- [X] T036 [US3] Añadir en cada ejercicio de “Hoy” un acceso claramente identificable, operable con teclado y tacto, a la ruta existente `/ejercicios/:id`, reutilizando `EjercicioFichaComponent` y conservando separado el control de realizado/no realizado en `src/app/presentation/progreso-diario/progreso-diario.component.html`, `src/app/presentation/progreso-diario/progreso-diario.component.ts` y `src/app/presentation/progreso-diario/progreso-diario.component.scss` (depende de T035; FR-048, US3.AS11, SC-015).
- [X] T037 [P] [US3] Añadir al recorrido de validación manual el acceso desde `/inicio` a la ficha existente con una acción, y la comprobación de que consultar no marca el ejercicio como realizado, en `specs/001-gestion-ejercicios-fisicos/quickstart.md` (FR-048, US3.AS11, SC-015).

## Phase 12: Validación del incremento

- [ ] T038 Ejecutar la prueba de integración de `tests/component/presentation/dia-actual-progreso.integration.spec.ts`, `npm run lint` y `npm run build` según los scripts de `package.json`; completar el recorrido manual de teclado y tacto descrito en `specs/001-gestion-ejercicios-fisicos/quickstart.md` (FR-048, SC-015).
