# Tasks: Importación y exportación de ejercicios con el repositorio común






**Input**: Design documents from `specs/003-importar-exportar-ejercicios/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`

**Tests**: Obligatorios por la Constitución del proyecto (test-first; 100 % de cobertura de las nuevas funciones puras de Domain).

**Organization**: Las tareas están agrupadas por historia de usuario. La configuración Angular, SQLite WASM, Vitest y Angular Material ya existe; no se requieren cambios de inicialización del proyecto.

## Phase 1: Setup

**Purpose**: Preparación del proyecto.

No se requieren tareas de setup: se reutilizan el proyecto Angular y las herramientas ya configuradas.

---

## Phase 2: Foundational

**Purpose**: Tipos y reglas compartidos, y persistencia de la marca local que necesitan las historias.

- [X] T001 [P] Añadir pruebas Vitest para normalizar nombres y comprobar el requisito mínimo de subida en `tests/unit/domain/normalizar-nombre-ejercicio.spec.ts` y `tests/unit/domain/cumple-requisito-repositorio-comun.spec.ts`.
- [X] T002 [P] Añadir pruebas Vitest de conversión en ambos sentidos, categorías y separación/reincorporación de imágenes de archivo en `tests/unit/domain/convertir-ejercicio-comun.spec.ts`.
- [X] T003 [P] Añadir pruebas de migración, valor por defecto y marcado persistente en `tests/unit/infrastructure/ejercicio-repository.sqlite.spec.ts`.
- [X] T004 Implementar `normalizarNombreEjercicio`, `cumpleRequisitoRepositorioComun`, `aEjercicioComun` y `aDatosNuevoEjercicio` en `src/app/domain/ejercicio/normalizar-nombre-ejercicio.ts`, `src/app/domain/ejercicio/cumple-requisito-repositorio-comun.ts` y `src/app/domain/ejercicio/convertir-ejercicio-comun.ts`; mantener 100 % de cobertura unitaria de estas funciones.
- [X] T005 Añadir a `Ejercicio` `subidoRepositorioComun` con el valor por defecto `false` y la regla «Nunca vuelve a `false`» en `src/app/domain/ejercicio/ejercicio.entity.ts`; ampliar `EjercicioRepositoryPort` con `marcarSubidoRepositorioComun(id: string): Promise<void>` en `src/app/application/ports/ejercicio-repository.port.ts`; persistir el campo y migrar SQLite con `subido_repositorio_comun INTEGER NOT NULL DEFAULT 0` en `src/app/infrastructure/persistencia-sqlite/esquema.ts`, `src/app/infrastructure/persistencia-sqlite/motor-sqlite.ts` y `src/app/infrastructure/persistencia-sqlite/ejercicio-repository.sqlite.ts`.
- [X] T006 Definir `RepositorioComunPort`, `CategoriaComun`, `EjercicioComunArchivo` e `ImagenEjercicioComun` conforme a `specs/003-importar-exportar-ejercicios/contracts/repositorio-comun.port.md` en `src/app/application/ports/repositorio-comun.port.ts`, reutilizando `ImagenArchivoJSON` y `CredencialesGitHub` de `src/app/application/ports/github-sync.port.ts`.

**Checkpoint**: Contratos compartidos, conversiones y persistencia listos para las historias.

---

## Phase 3: User Story 1 - Importar ejercicios del repositorio común (Priority: P1)

**Goal**: Buscar ejercicios publicados sin credenciales, seleccionar varios, resolver categorías no reconocidas e importarlos sin cambios parciales.

**Independent Test**: Desde `/ejercicios/importar`, buscar por texto, categoría y catálogo completo; seleccionar e importar ejercicios con y sin mapeo de categorías; comprobarlos en «Buscar» con sus datos e imágenes válidas. Comprobar también estados inicial, vacío, carga y error, y que no se necesita configurar credenciales.

### Prototipo y aprobación de presentación (obligatorio para la pantalla nueva)

- [X] T007 [US1] El agente `ux-ui-expert` debe crear o actualizar historias navegables de la pantalla de importación en `src/stories/importar-ejercicios.stories.ts`, dentro del marco real de la aplicación, con datos en español y estados inicial, con resultados, vacío, carga y error a 390 px, 834 px y 1280 px.
- [X] T008 [US1] El agente `ux-ui-expert` debe ejecutar y presentar el prototipo de `src/stories/importar-ejercicios.stories.ts` al propietario con URL de vista previa y capturas de los tres tamaños, solicitar aprobación explícita e iterar si procede; registrar la aprobación en `specs/003-importar-exportar-ejercicios/tasks.md` antes de iniciar tareas de presentación.
  - **Aprobación registrada**: el propietario aprobó la maquetación de Storybook en la conversación del 2026-10-29 antes de iniciar la implementación de Presentation.

### Pruebas de User Story 1

- [X] T009 [P] [US1] Añadir pruebas de búsqueda e importación para catálogo completo, filtro de texto/categoría, mapeo de categorías, imágenes omitidas y fallo sin importación parcial en `tests/unit/application/buscar-ejercicios-comunes.use-case.spec.ts` y `tests/unit/application/importar-ejercicios-comunes.use-case.spec.ts`.
- [X] T010 [P] [US1] Añadir pruebas del adaptador para lectura de categorías, búsqueda pública por `main`, filtrado y lectura/validación de imágenes en `tests/unit/infrastructure/repositorio-comun.adapter.spec.ts`.
- [X] T011 [P] [US1] Añadir pruebas de componentes para búsqueda explícita, selección, contador/visibilidad de «Importar», estados de pantalla y asignación/cancelación de categorías en `tests/component/presentation/importar-ejercicios.component.spec.ts` y `tests/component/presentation/mapear-categoria-importada-dialog.component.spec.ts`.

### Implementación de User Story 1

- [X] T012 [P] [US1] Implementar en `src/app/infrastructure/repositorio-comun/repositorio-comun.adapter.ts` la lectura pública de categorías e índices de ejercicios desde `main`, descarga raw y filtrado por texto/categoría; respetar las llamadas y ramas definidas en `specs/003-importar-exportar-ejercicios/contracts/repositorio-comun.port.md`.
- [X] T013 [P] [US1] Implementar `BuscarEjerciciosComunesUseCase` e `ImportarEjerciciosComunesUseCase` en `src/app/application/casos-uso/buscar-ejercicios-comunes.use-case.ts` y `src/app/application/casos-uso/importar-ejercicios-comunes.use-case.ts`; resolver mapeos por nombre, omitir solo imágenes de archivo inválidas e informar el recuento omitido.
- [X] T014 [US1] Implementar la pantalla y el diálogo de mapeo aprobados en `src/app/presentation/importar-ejercicios/importar-ejercicios.component.ts`, `src/app/presentation/importar-ejercicios/importar-ejercicios.component.html`, `src/app/presentation/importar-ejercicios/mapear-categoria-importada-dialog.component.ts` y `src/app/presentation/importar-ejercicios/mapear-categoria-importada-dialog.component.html`; usar selección única de categoría común, botón de búsqueda explícito y Angular Material.
- [X] T015 [US1] Integrar el adaptador y los casos de uso en `src/app/app.config.ts`, registrar `/ejercicios/importar` en `src/app/app.routes.ts` y añadir «Importar ejercicios» al menú adaptable en `src/app/presentation/compartido/shell/menu-principal.ts`.

**Checkpoint**: La historia se puede validar por sí sola mediante `specs/003-importar-exportar-ejercicios/quickstart.md`.

---

## Phase 4: User Story 2 - Subir un ejercicio al repositorio común (Priority: P2)

**Goal**: Desde la ficha o la edición, permitir enviar una sola vez un ejercicio elegible a `requests`, tras elegir categorías comunes, bloquear duplicados publicados y pedir confirmación explícita.

**Independent Test**: Con credenciales guardadas, abrir un ejercicio elegible, seleccionar categorías comunes, comprobar el bloqueo por nombre duplicado o confirmar un envío válido; verificar el aviso de pendiente de revisión y que la acción no vuelve a aparecer tras recargar. Comprobar asimismo ausencia de la acción sin credenciales, para ejercicios no elegibles o ya enviados, y reintento tras error.

### Pruebas de User Story 2

- [X] T016 [P] [US2] Añadir pruebas para la lectura compartida de GitHub y para comprobar nombres solo en `main`, enviar ficheros nuevos a `requests` y detener la subida del ejercicio si falla una imagen en `tests/unit/infrastructure/repositorio-comun.adapter.spec.ts` y `tests/unit/infrastructure/github-contenido.util.spec.ts`.
- [X] T017 [P] [US2] Añadir pruebas del caso de uso para credenciales, requisito mínimo, duplicado, confirmación, subida correcta y marcado local solo tras el éxito en `tests/unit/application/subir-ejercicio-comun.use-case.spec.ts`.
- [X] T018 [P] [US2] Añadir pruebas de visibilidad y flujo del diálogo, selección múltiple, bloqueo por duplicado, cancelación y errores reintentables en `tests/component/presentation/subir-ejercicio-comun-dialog.component.spec.ts`, `tests/component/presentation/ejercicio-ficha.component.spec.ts` y `tests/component/presentation/ejercicio-formulario.component.spec.ts`.

### Implementación de User Story 2

- [X] T019 [US2] Extraer la lectura de contenido GitHub, fallback de blobs y codificación/decodificación base64 a `src/app/infrastructure/github-sync/github-contenido.util.ts`; actualizar `src/app/infrastructure/github-sync/github-sync.adapter.ts` para reutilizar el utilitario sin alterar el comportamiento existente.
- [X] T020 [US2] Completar `RepositorioComunAdapter` en `src/app/infrastructure/repositorio-comun/repositorio-comun.adapter.ts` con la comprobación de nombre normalizado exclusivamente en `main` y creación de documentos de ejercicio e imágenes en `requests`, sin dejar un ejercicio enviado si falla antes una imagen.
- [X] T021 [US2] Implementar `SubirEjercicioComunUseCase` en `src/app/application/casos-uso/subir-ejercicio-comun.use-case.ts`; exigir credenciales y requisitos de dominio, comprobar duplicados antes de confirmar y llamar a `marcarSubidoRepositorioComun` únicamente después de completar la subida.
- [X] T022 [US2] Implementar el diálogo de selección y confirmación y sus estados de error en `src/app/presentation/biblioteca-ejercicios/subir-ejercicio-comun-dialog.component.ts` y `src/app/presentation/biblioteca-ejercicios/subir-ejercicio-comun-dialog.component.html`; integrar la acción condicionada por credenciales, elegibilidad y marca persistente en `src/app/presentation/biblioteca-ejercicios/ejercicio-ficha.component.ts`, `src/app/presentation/biblioteca-ejercicios/ejercicio-ficha.component.html`, `src/app/presentation/biblioteca-ejercicios/ejercicio-formulario.component.ts` y `src/app/presentation/biblioteca-ejercicios/ejercicio-formulario.component.html`.
- [X] T023 [P] [US2] Actualizar la explicación del permiso del token de GitHub para incluir el repositorio común y mantener la guía en español en `src/app/presentation/sincronizacion/configuracion/configuracion-sincronizacion.component.html` y `src/app/presentation/sincronizacion/configuracion/configuracion-sincronizacion.component.ts`.

**Checkpoint**: La subida se puede validar por sí sola mediante los escenarios 3 y 4 de `specs/003-importar-exportar-ejercicios/quickstart.md`.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Verificación integral y coherencia documental.

- [X] T024 [P] Actualizar `specs/001-gestion-ejercicios-fisicos/research.md` con la decisión transversal de reutilizar credenciales de GitHub para el repositorio común, referenciando `specs/003-importar-exportar-ejercicios/research.md`, y confirmar que la guía de permisos en `src/app/presentation/sincronizacion/configuracion/configuracion-sincronizacion.component.html` coincide con esa decisión.
- [X] T025 Ejecutar las pruebas unitarias y de componentes de `tests/unit/` y `tests/component/presentation/`, el lint del proyecto y las compilaciones de producción de la aplicación y Storybook; corregir cualquier regresión en los archivos afectados.
- [ ] T026 Ejecutar manualmente todos los escenarios de `specs/003-importar-exportar-ejercicios/quickstart.md`, incluido el envío a `requests`; requiere una instalación local con un token GitHub propio con permisos sobre el repositorio común, credencial que no está disponible en esta sesión.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Proyecto y herramientas existentes; no hay cambios de inicialización pendientes.
- **Foundational (Phase 2)**: Completar T001–T006 antes de implementar historias; las pruebas fundacionales se escriben antes del código correspondiente.
- **User Stories (Phase 3+)**: Ambas dependen de la base común. US1 (P1) y US2 (P2) son funcionalmente independientes; US2 reutiliza el adaptador y el contrato introducidos en US1.
- **Polish (Phase 5)**: Ejecutar después de las dos historias.

### User Story Dependencies

- **US1 (P1)**: Puede comenzar tras Phase 2; no depende de otra historia.
- **US2 (P2)**: Puede comenzar tras Phase 2. La implementación de subida T020 amplía el adaptador creado en T012, por lo que esa tarea concreta se ejecuta después de T012; las pruebas y tareas de otros archivos pueden avanzar en paralelo.

### Parallel Opportunities

- **Foundational**: T001, T002 y T003 son pruebas en archivos separados y pueden escribirse en paralelo; T004 puede dividirse por archivo al implementar las reglas una vez listas las pruebas.
- **US1**: T009, T010 y T011 son suites distintas y paralelizables. Tras aprobar el prototipo, T012 y T013 pueden implementarse en paralelo; la presentación y el registro de ruta requieren sus dependencias.
- **US2**: T016, T017 y T018 son suites distintas y paralelizables. T019 y T023 afectan archivos separados; T020 requiere que la base del adaptador T012 exista.
- **Entre historias**: Tras la base común, las tareas de aplicación y presentación de US2 pueden avanzar mientras se completa US1, evitando editar simultáneamente `repositorio-comun.adapter.ts`.

### Parallel Example: User Story 1

```text
En paralelo: T009 pruebas de casos de uso
             T010 pruebas del adaptador
             T011 pruebas de componentes
Después de aprobar el prototipo: T012 adaptador de lectura || T013 casos de uso
Después: T014 pantalla y diálogo; T015 ruta, menú y proveedores
```

### Parallel Example: User Story 2

```text
En paralelo: T016 pruebas de infraestructura
             T017 pruebas del caso de uso
             T018 pruebas de presentación
En paralelo: T019 extracción del utilitario || T023 texto de permisos
Después de T012: T020 subida en el adaptador; T021 caso de uso y T022 presentación
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar Phase 2.
2. Crear y presentar el prototipo de US1 y obtener aprobación explícita antes de implementar su presentación.
3. Completar Phase 3 y validar de forma independiente los escenarios de importación de `quickstart.md`.
4. Entregar el MVP de importación; US2 puede añadirse después sin cambiar el flujo aprobado.

### Incremental Delivery

1. Base común con pruebas, conversiones y persistencia.
2. US1: búsqueda e importación pública sin credenciales; validar por separado.
3. US2: selección y envío con credenciales, marca local y bloqueo de duplicados; validar por separado.
4. Completar lint, pruebas, Storybook y quickstart en Phase 5.

---

## Enmienda Living Spec - Previsualización de ejercicio común (2026-10-29)

El propietario solicita añadir a US1 una ficha remota de solo lectura, accesible desde cada resultado, con importación directa. Ha indicado expresamente que no se prepare prototipo de Storybook para esta ampliación.

- [X] T024 [US1] Añadir `obtenerEjercicioPorId(id)` al contrato/puerto y lectura raw de `ejercicios/<id>/<id>.json` en `RepositorioComunAdapter`, con cobertura para éxito y 404.
- [X] T025 [US1] Ampliar `BuscarEjerciciosComunesUseCase` para cargar la ficha y sus imágenes de archivo, omitiendo imágenes inválidas y propagando fallos recuperables.
- [X] T026 [US1] Añadir la ruta de previsualización de solo lectura con acción propia para importar, aplicar mapeo existente, excluir observaciones/edición/eliminación, añadir "Ver ejercicio" a cada resultado y restaurar filtros/resultados/selección al volver.
- [X] T027 [US1] Actualizar criterios funcionales y contratos de interfaz/puerto/plan/research; añadir pruebas unitarias y de componente de carga, navegación, ausencia de observaciones e importación.

## Enmienda Living Spec - Índice remoto y directorios por ejercicio (2026-10-31)

- [X] T028 [US1] Sustituir el listado remoto de `/ejercicios` por lecturas guiadas por los ids de `categorias.json`; actualizar la búsqueda por categoría y la comprobación de duplicados.
- [X] T029 [US2] Subir el ejercicio y sus imágenes a `ejercicios/<id>/`, actualizar el índice `categorias.json` de `requests` usando su SHA y validar las categorías elegidas.
- [X] T030 [US1] Pasar el id del ejercicio al lector de imágenes para resolver su directorio sin alterar la ruta relativa serializada; añadir cobertura de las rutas anidadas.
- [X] T031 [US1/US2] Actualizar el contrato, modelo de datos, especificación funcional, investigación y guía manual; añadir pruebas del índice, el flujo de subida y la preservación del formato JSON.
