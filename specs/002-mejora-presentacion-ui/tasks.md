---

description: "Task list template for feature implementation"
---

# Tasks: Mejora de la presentación (UI/UX) de la aplicación

**Input**: Design documents from `/specs/002-mejora-presentacion-ui/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Esta feature SÍ incluye tareas de test explícitas. La constitución del proyecto exige test-first obligatorio ("ninguna funcionalidad se implementa sin que exista previamente al menos un test que la cubra"), por lo que cada componente/servicio nuevo y cada cambio de comportamiento visual verificable tiene su tarea de test antes de la tarea de implementación correspondiente.

**Organization**: Las tareas se agrupan por historia de usuario (US1, US2, US3) para permitir implementación y prueba independientes, precedidas de una fase de Setup y una Foundational compartidas por las tres.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias pendientes)
- **[Story]**: A qué historia de usuario pertenece la tarea (US1, US2, US3); Setup/Foundational/Polish no llevan etiqueta de historia
- Cada tarea incluye la ruta de archivo exacta

## Path Conventions

Proyecto único (Angular SPA sin backend). Todas las rutas son relativas a la raíz del repositorio:

- Código: `src/app/presentation/...`, `src/styles/...`, `src/styles.scss`
- Tests: `tests/component/presentation/...`

(Ver `plan.md` § Project Structure para el árbol completo.)

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Crear los tokens de diseño compartidos (espaciado, breakpoints, utilidades) exigidos por `contracts/design-tokens.contract.md`, sin los cuales ningún componente de las historias de usuario puede implementarse de forma coherente.

- [X] T001 [P] Create spacing-scale partial `src/styles/_espaciado.scss` con `$espaciado-1` (8px) a `$espaciado-6` (48px), según `contracts/design-tokens.contract.md`
- [X] T002 [P] Create breakpoint-mixins partial `src/styles/_breakpoints.scss` con los mixins `movil` (hasta 599px), `tablet` (768–1024px) y `escritorio` (1280px en adelante), según `contracts/design-tokens.contract.md`
- [X] T003 [P] Create utility partial `src/styles/_utilidades.scss` con la clase `.contenido--centrado` para centrar de forma consistente el indicador de carga (`mat-progress-spinner`), según `research.md` § 3
- [X] T004 Update `src/styles.scss` añadiendo `@use 'styles/espaciado'`, `@use 'styles/breakpoints'` y `@use 'styles/utilidades'`, sin modificar la configuración existente de `mat.theme()` (depende de T001, T002, T003)

**Checkpoint**: Tokens de diseño disponibles para toda la aplicación.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Construir los dos componentes de presentación compartidos y el servicio de feedback que usan las tres historias de usuario (`contracts/componentes-presentacion.contract.md`, `data-model.md`).

**⚠️ CRITICAL**: Ninguna tarea de las historias de usuario (Fase 3+) puede empezar hasta completar esta fase.

- [X] T005 [P] Write failing spec `tests/component/presentation/compartido/ui/cabecera-pagina.component.spec.ts`: el `input` `titulo` (obligatorio) se renderiza como encabezado semántico; el `input` `descripcion` (opcional) solo se muestra si se provee; el contenido proyectado en `[acciones]` se renderiza dentro del componente
- [X] T006 [P] Write failing spec `tests/component/presentation/compartido/ui/estado-vacio.component.spec.ts`: el `input` `icono` (obligatorio) se renderiza con `aria-hidden="true"`; el `input` `mensaje` (obligatorio) se muestra como texto visible; el contenido proyectado opcional en `[accion]` solo aparece si se provee
- [X] T007 [P] Write failing spec `tests/component/presentation/compartido/ui/mensaje-feedback.service.spec.ts`: `mostrarExito(texto)` y `mostrarError(texto)` invocan `MatSnackBar.open` con el texto recibido y una duración de 4000 ms, sin requerir que el usuario mueva el foco
- [X] T008 Implement `CabeceraPaginaComponent` standalone en `src/app/presentation/compartido/ui/cabecera-pagina/cabecera-pagina.component.ts` + `.html` + `.scss` (inputs `titulo: string` obligatorio y `descripcion?: string` opcional; `<ng-content select="[acciones]">`; usa `$espaciado-4` y la variable `--mat-sys-headline-small`) — hace pasar T005
- [X] T009 Implement `EstadoVacioComponent` standalone en `src/app/presentation/compartido/ui/estado-vacio/estado-vacio.component.ts` + `.html` + `.scss` (inputs `icono: string` y `mensaje: string` obligatorios; `<ng-content select="[accion]">` opcional; icono marcado `aria-hidden="true"`; usa `$espaciado-6` y la variable `--mat-sys-on-surface-variant`) — hace pasar T006
- [X] T010 Implement `MensajeFeedbackService` en `src/app/presentation/compartido/ui/mensaje-feedback.service.ts`, envolviendo `MatSnackBar` con los métodos `mostrarExito(texto: string)` y `mostrarError(texto: string)`, duración de 4000 ms — hace pasar T007

**Checkpoint**: Fundamento compartido listo (tokens + 2 componentes + servicio de feedback); las historias de usuario pueden empezar.

---

## Phase 3: User Story 1 - Explorar y gestionar la biblioteca de ejercicios con una presentación profesional (Priority: P1) 🎯 MVP

**Goal**: El listado de "Mis ejercicios" y la gestión de categorías usan cabecera, tarjetas, estados vacío/carga y feedback de operación coherentes con el resto de la aplicación.

**Independent Test**: Abrir "Mis ejercicios" con cero, uno y muchos ejercicios/categorías, y comprobar que la información clave se entiende sin desplazamiento adicional y que crear/gestionar/eliminar son accesibles en un clic.

### Tests for User Story 1 ⚠️

- [X] T011 [P] [US1] Update failing assertions en `tests/component/presentation/biblioteca-listado.component.spec.ts`: debe renderizar `app-cabecera-pagina` con `titulo="Mis ejercicios"`, `app-estado-vacio` cuando la lista esté vacía, y cada ejercicio como elemento de lista diferenciado
- [X] T012 [P] [US1] Update failing assertions en `tests/component/presentation/categoria-gestion.component.spec.ts`: debe renderizar `app-cabecera-pagina`, y debe invocar `MensajeFeedbackService.mostrarExito`/`mostrarError` al crear o eliminar una categoría

### Implementation for User Story 1

- [X] T013 [US1] Update `src/app/presentation/biblioteca-ejercicios/biblioteca-listado.component.html` para usar `<app-cabecera-pagina titulo="Mis ejercicios">` proyectando los botones "Nuevo ejercicio"/"Gestionar categorías" en `[acciones]`, y `<app-estado-vacio icono="fitness_center" mensaje="No hay ejercicios registrados todavía.">` proyectando el botón "Nuevo ejercicio" en `[accion]` cuando la lista esté vacía (FR-001, FR-003) — depende de T008, T009
- [X] T014 [US1] Update `src/app/presentation/biblioteca-ejercicios/biblioteca-listado.component.html` y create `src/app/presentation/biblioteca-ejercicios/biblioteca-listado.component.scss` para renderizar cada ejercicio como tarjeta/fila con `$espaciado-2`/`$espaciado-3`, truncando nombre y descripción (máx. 2 líneas, `text-overflow: ellipsis`) para que nombres/descripciones largos no rompan el diseño ni provoquen scroll horizontal (FR-002, Edge Case de truncamiento) — depende de T013
- [X] T015 [US1] Update `src/app/presentation/biblioteca-ejercicios/biblioteca-listado.component.ts` para importar `CabeceraPaginaComponent`/`EstadoVacioComponent` y envolver el `<mat-spinner>` existente con la clase `.contenido--centrado` (FR-004) — depende de T008, T009, T013
- [X] T016 [P] [US1] Update `src/app/presentation/biblioteca-ejercicios/categorias/categoria-gestion.component.html` y `.ts` para usar `<app-cabecera-pagina titulo="Categorías">` e inyectar `MensajeFeedbackService`, llamando a `mostrarExito`/`mostrarError` al crear o eliminar una categoría, conservando los mensajes inline `errorEliminacion()`/`errorCreacion()` como detalle adicional (FR-008) — depende de T008, T010
- [X] T017 [US1] Create `src/app/presentation/biblioteca-ejercicios/categorias/categoria-gestion.component.scss` aplicando los mixins de `_breakpoints.scss` para que el listado de categorías use una sola columna en móvil y una disposición más densa en tablet/escritorio (FR-010, FR-011) — depende de T016
- [X] T018 [US1] Apply el checklist de `contracts/accesibilidad.contract.md` (A1–A8) a las pantallas de listado de ejercicios y gestión de categorías: contraste, foco visible y flujo completo de crear/eliminar categoría solo con teclado (FR-015) — depende de T013, T014, T015, T016, T017

**Checkpoint**: La Historia de Usuario 1 debe ser completamente funcional y verificable de forma independiente.

---

## Phase 4: User Story 2 - Completar el formulario de ejercicio con confianza (Priority: P2)

**Goal**: El formulario de alta/edición de ejercicio agrupa la información en secciones claras, marca los campos obligatorios y confirma visualmente el resultado de guardar.

**Independent Test**: Abrir "Nuevo ejercicio", dejar campos obligatorios vacíos y comprobar que los mensajes de validación aparecen junto al campo afectado, que las 5 secciones se distinguen visualmente, y que el usuario recibe confirmación clara al guardar.

### Tests for User Story 2 ⚠️

- [X] T019 [US2] Update failing assertions en `tests/component/presentation/ejercicio-formulario.component.spec.ts`: las 5 secciones (datos básicos, categorías, enlaces, imágenes, observaciones) deben ser identificables por un contenedor/encabezado propio, los campos "Nombre del ejercicio", "Descripción" y "Categorías" deben marcarse visiblemente como obligatorios antes de enviar, y debe invocarse `MensajeFeedbackService` al guardar con éxito o con error

### Implementation for User Story 2

- [X] T020 [US2] Update `src/app/presentation/biblioteca-ejercicios/ejercicio-formulario.component.html` agrupando cada bloque existente (datos básicos, categorías, enlaces, imágenes, observaciones) en un contenedor con encabezado propio (`<h3>` + `$espaciado-3` de separación entre bloques) en vez de `<fieldset>` sin separación visual (FR-005) — depende de T019
- [X] T021 [US2] Update `src/app/presentation/biblioteca-ejercicios/ejercicio-formulario.component.html` para marcar visiblemente "Nombre del ejercicio", "Descripción" y "Categorías" como obligatorios (p. ej. asterisco o etiqueta "(obligatorio)") antes de que el usuario intente guardar (FR-007) — depende de T020
- [X] T022 [US2] Create `src/app/presentation/biblioteca-ejercicios/ejercicio-formulario.component.scss` aplicando espaciado consistente entre bloques y confirmando que cada `mat-error` permanece junto a su campo (FR-006) — depende de T020
- [X] T023 [US2] Update `src/app/presentation/biblioteca-ejercicios/ejercicio-formulario.component.ts` para inyectar `MensajeFeedbackService` y llamar a `mostrarExito`/`mostrarError` tras `guardar()`, conservando `errorAlGuardar()` como mensaje inline adicional en caso de fallo (FR-008) — depende de T010, T019
- [X] T024 [US2] Apply el checklist de `contracts/accesibilidad.contract.md` (A1–A8) al formulario de ejercicio: navegación completa por teclado, incluidos los chips de categoría y los botones de quitar enlace/imagen (FR-015) — depende de T020, T021, T022, T023

**Checkpoint**: Las Historias de Usuario 1 y 2 deben funcionar de forma independiente.

---

## Phase 5: User Story 3 - Navegar por una aplicación coherente y responsiva de principio a fin (Priority: P3)

**Goal**: El shell de navegación (barra superior, menú lateral) y las pantallas "próximamente" mantienen el mismo nivel de acabado visual en los tres rangos de ancho de referencia.

**Independent Test**: Navegar entre todas las secciones del menú en ancho de escritorio, de tablet y de móvil, verificando que el menú y la barra superior se comportan correctamente y que las secciones pendientes muestran un "próximamente" con el mismo estilo que el resto de la aplicación.

### Tests for User Story 3 ⚠️

- [X] T025 [P] [US3] Update failing assertions en `tests/component/presentation/shell.component.spec.ts`: el menú lateral debe ocultarse por defecto en viewport móvil y mostrarse por defecto en escritorio, y la entrada de menú de la ruta activa debe llevar una clase/atributo de "activo" visualmente distinguible más allá de `font-weight`
- [X] T026 [P] [US3] Create failing spec `tests/component/presentation/compartido/pagina-en-construccion.component.spec.ts`: debe renderizar `app-cabecera-pagina` y `app-estado-vacio` con `icono="construction"` y el mensaje "Esta sección todavía no está disponible." en vez de un `<p>` plano

### Implementation for User Story 3

- [X] T027 [US3] Update `src/app/presentation/compartido/shell/shell.component.scss` usando los mixins de `_breakpoints.scss` para ocultar el menú lateral por defecto en móvil y mostrarlo por defecto en escritorio, y asegurar que el botón de alternar menú cumple un tamaño de toque cómodo (FR-010, FR-011) — depende de T025
- [X] T028 [US3] Update `src/app/presentation/compartido/shell/shell.component.scss` para que `.shell__enlace-activo` use un tratamiento visual más allá de `font-weight` (p. ej. fondo con la variable `--mat-sys-secondary-container`) (FR-012) — depende de T025
- [X] T029 [US3] Update `src/app/presentation/compartido/shell/pagina-en-construccion.component.ts` para renderizar `<app-cabecera-pagina>` + `<app-estado-vacio icono="construction" mensaje="Esta sección todavía no está disponible.">` en vez del `<p>` plano actual (FR-013) — depende de T008, T009, T026
- [X] T030 [US3] Apply el checklist de `contracts/accesibilidad.contract.md` (A1–A8) al shell y al menú de navegación: recorrido completo de las 5 entradas del menú solo con teclado, con foco visible en cada una (FR-015) — depende de T027, T028, T029

**Checkpoint**: Las 3 historias de usuario deben ser ahora funcionales e independientemente verificables.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Mejoras que afectan a las tres historias de usuario y cierre de calidad de toda la feature.

- [X] T031 [P] Update `tests/component/presentation/shell-biblioteca.integration.spec.ts` si la integración shell+biblioteca cambió de estructura DOM tras T013–T029
- [X] T032 Run `npm run lint` y corregir cualquier infracción (incluida la regla de accesibilidad de plantillas `angular.configs.templateAccessibility`) en los archivos modificados por esta feature
- [X] T033 Run `npm test -- --coverage` y confirmar que la cobertura global se mantiene en ≥80% (umbral de `angular.json`), añadiendo pruebas para cualquier rama sin cubrir en `CabeceraPaginaComponent`, `EstadoVacioComponent` o `MensajeFeedbackService`
- [X] T034 Execute el recorrido manual completo de `quickstart.md` (las 3 historias de usuario + validación de accesibilidad) y registrar el resultado de las 8 filas de `contracts/accesibilidad.contract.md`
- [X] T035 [P] Review `contracts/componentes-presentacion.contract.md` y `contracts/design-tokens.contract.md` frente a la implementación final; actualizar la documentación si hubo alguna desviación necesaria

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias — puede empezar inmediatamente
- **Foundational (Phase 2)**: depende de Setup — BLOQUEA las tres historias de usuario
- **Historias de Usuario (Phase 3–5)**: todas dependen de Foundational; pueden avanzar en paralelo o en el orden de prioridad P1 → P2 → P3
- **Polish (Phase 6)**: depende de que las historias de usuario que se quieran entregar estén completas

### User Story Dependencies

- **US1 (P1)**: puede empezar tras Foundational (Phase 2) — sin dependencia de otras historias
- **US2 (P2)**: puede empezar tras Foundational (Phase 2) — reutiliza `MensajeFeedbackService` de Foundational, no depende de US1
- **US3 (P3)**: puede empezar tras Foundational (Phase 2) — reutiliza `CabeceraPaginaComponent`/`EstadoVacioComponent` de Foundational, no depende de US1/US2

### Within Each User Story

- Los tests (T011/T012, T019, T025/T026) se escriben y DEBEN fallar antes de implementar (test-first, constitución)
- Dentro de cada historia: cabecera/estado vacío → tarjetas/estilos → integración del servicio de feedback → revisión de accesibilidad
- Cada historia se da por completa solo cuando su revisión de accesibilidad (T018, T024, T030) pasa

### Parallel Opportunities

- T001, T002, T003 (Setup) en paralelo
- T005, T006, T007 (tests de Foundational) en paralelo
- T011, T012 (tests de US1) en paralelo
- T016 (categorías) en paralelo con T013–T015 (listado) dentro de US1
- T025, T026 (tests de US3) en paralelo
- Una vez completada Foundational, US1/US2/US3 pueden trabajarse en paralelo por distintas personas
- T031 y T035 (Polish) en paralelo

---

## Parallel Example: User Story 1

```bash
# Lanzar juntos los tests de la Historia 1:
Task: "Update failing assertions en tests/component/presentation/biblioteca-listado.component.spec.ts"
Task: "Update failing assertions en tests/component/presentation/categoria-gestion.component.spec.ts"

# Tras T013–T015 (listado), lanzar en paralelo el trabajo de categorías:
Task: "Update categoria-gestion.component.html/.ts con cabecera-pagina y MensajeFeedbackService"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar Fase 1: Setup
2. Completar Fase 2: Foundational (CRÍTICO — bloquea las tres historias)
3. Completar Fase 3: Historia de Usuario 1
4. **DETENER Y VALIDAR**: probar la Historia 1 de forma independiente con `quickstart.md`
5. Desplegar/mostrar si está listo

### Incremental Delivery

1. Setup + Foundational → fundamento listo
2. Añadir US1 → probar de forma independiente → desplegar/mostrar (¡MVP!)
3. Añadir US2 → probar de forma independiente → desplegar/mostrar
4. Añadir US3 → probar de forma independiente → desplegar/mostrar
5. Cada historia añade valor sin romper las anteriores (FR-014)

### Parallel Team Strategy

Con varias personas desarrollando:

1. El equipo completa Setup + Foundational junto
2. Una vez lista Foundational:
   - Persona A: Historia de Usuario 1
   - Persona B: Historia de Usuario 2
   - Persona C: Historia de Usuario 3
3. Las historias se completan e integran de forma independiente

---

## Notes

- [P] = archivos distintos, sin dependencias pendientes
- La etiqueta [Story] vincula cada tarea a su historia de usuario para trazabilidad
- Cada historia de usuario debe poder completarse y probarse de forma independiente
- Verificar que los tests fallan antes de implementar (test-first obligatorio, constitución)
- Hacer commit tras cada tarea o grupo lógico de tareas
- Detenerse en cada checkpoint para validar la historia de forma independiente antes de continuar
- Evitar: tareas vagas, conflictos de archivo entre tareas paralelas, dependencias cruzadas entre historias que rompan su independencia
