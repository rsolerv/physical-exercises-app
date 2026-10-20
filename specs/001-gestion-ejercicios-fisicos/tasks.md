---

description: "Tareas acotadas para retirar Mis ejercicios y centralizar el catálogo en Buscar"
---

# Tareas: Retirada de “Mis ejercicios” y navegación del catálogo

**Input**: [spec.md](./spec.md), [plan.md](./plan.md), [research.md](./research.md), [quickstart.md](./quickstart.md)

**Alcance**: Solo FR-050…FR-054 y regresiones de FR-039 y FR-047. FR-055 no está definido en la especificación activa. Se incluyen las historias afectadas US1, US2 y US6; US3, US4 y US5 no se modifican.

**Tests**: Solicitados para este cambio y obligatorios antes de implementar. Usar Vitest y Angular `TestBed`. No modificar archivos de implementación de `src/app/presentation/busqueda-ejercicios/`.

**Datos y dominio**: No cambiar entidades, reglas, casos de uso, repositorios, catálogo de fábrica ni esquema SQLite. La ruta exacta antigua `/ejercicios` se conserva únicamente como redirección a `/buscar`; las rutas anidadas de alta, categorías, ficha y edición permanecen.

## Phase 1: Setup

**Purpose**: El proyecto Angular, Vitest, Angular `TestBed` y ESLint ya están configurados. No se requieren tareas de setup.

## Phase 2: Foundational

**Purpose**: Verificar primero el comportamiento compartido del menú móvil antes de ampliar las entradas de navegación.

- [X] T001 [P] Ampliar las pruebas de `tests/component/presentation/shell.component.spec.ts` para comprobar overlay hasta 599 px, cierre al seleccionar una sección, adaptación de modo al cambiar de ancho y menú utilizable sin comprimir el contenido; conservar la verificación del modo lateral en escritorio (FR-047).

## Phase 3: User Story 1 - Gestionar ejercicios y categorías desde el menú (Priority: P1)

**Goal**: Acceder directamente a la creación de ejercicios y a la gestión de categorías; retirar el listado “Mis ejercicios” sin perder las operaciones de ejercicios ni los enlaces guardados.

**Independent Test**: Desde el menú, abrir directamente “Nuevo ejercicio” y “Gestionar categorías”; crear un ejercicio, localizarlo en “Buscar”, abrir su ficha y verificar que se puede editar y eliminar. Abrir `/ejercicios` directamente y comprobar que redirige a “Buscar”, mientras las rutas anidadas de ejercicio y categorías siguen disponibles.

### Tests for User Story 1

> Escribir y ejecutar estas pruebas primero; comprobar que las nuevas expectativas fallan antes de aplicar los cambios de implementación.

- [X] T002 [P] [US1] Actualizar las pruebas de integración para comprobar las seis entradas exactas del menú, el acceso directo a alta y categorías, la ausencia de “Mis ejercicios” y la redirección de `/ejercicios` a `/buscar`, conservando las rutas anidadas, en `tests/component/presentation/shell-biblioteca.integration.spec.ts`.
- [X] T003 [P] [US1] Cambiar la prueba de eliminación de la ficha para esperar que la navegación finalice en `/buscar`, conservando la comprobación de feedback de éxito y la de que un error no navega, en `tests/component/presentation/ejercicio-ficha.component.spec.ts`.

### Implementation for User Story 1

- [X] T004 [P] [US1] Retirar la entrada “Mis ejercicios” y añadir “Nuevo ejercicio” (`/ejercicios/nuevo`) y “Gestionar categorías” (`/ejercicios/categorias`) a `MENU_PRINCIPAL` en `src/app/presentation/compartido/shell/menu-principal.ts` (depende de T001 y T002).
- [X] T005 [P] [US1] Eliminar el import y la ruta de componente del listado; sustituir la ruta exacta `/ejercicios` por una redirección a `/buscar` y conservar las rutas anidadas existentes en `src/app/app.routes.ts` (depende de T002).
- [X] T006 [P] [US1] Navegar a `/buscar` tras una eliminación correcta, en lugar de volver a la ruta antigua de biblioteca, en `src/app/presentation/biblioteca-ejercicios/ejercicio-ficha.component.ts` (depende de T003).
- [X] T007 [P] [US1] Eliminar el componente y los estilos exclusivos del listado retirado junto con su prueba dedicada en `src/app/presentation/biblioteca-ejercicios/biblioteca-listado.component.ts`, `src/app/presentation/biblioteca-ejercicios/biblioteca-listado.component.html`, `src/app/presentation/biblioteca-ejercicios/biblioteca-listado.component.scss` y `tests/component/presentation/biblioteca-listado.component.spec.ts`; conservar las pruebas de formularios, ficha y categorías (depende de T005).

**Checkpoint**: Las entradas nuevas llegan a sus pantallas; `/ejercicios` redirige a “Buscar”; el detalle, la edición, la creación, las categorías y el borrado siguen disponibles; no queda una pantalla de listado ni una entrada “Mis ejercicios”.

## Phase 4: User Story 6 - Navegar con un menú móvil utilizable (Priority: P1)

**Goal**: Confirmar que la nueva navegación conserva el comportamiento responsive y cierra el menú tras seleccionar una sección o una de las dos acciones.

**Independent Test**: En móvil hasta 599 px, comprobar el menú superpuesto de ancho completo y el cierre tras seleccionar una sección, “Nuevo ejercicio” o “Gestionar categorías”. En tablet y escritorio, comprobar que las mismas seis opciones siguen disponibles y que el contenido no se comprime ni solapa.

- [X] T008 [US6] Completar la comprobación manual de FR-047 y SC-021 descrita en `specs/001-gestion-ejercicios-fisicos/quickstart.md` a 599 px o menos, 768 px, 1024 px y 1280 px o más; confirmar el cierre del menú tras elegir las dos acciones nuevas (depende de T004, T005 y T007).

**Checkpoint**: El menú móvil ocupa todo el ancho sin comprimir el contenido y se cierra al elegir secciones y acciones; “Mis ejercicios” no aparece en móvil, tablet ni escritorio.

## Phase 5: User Story 2 - Consultar y operar sobre el catálogo completo (Priority: P2)

**Goal**: Usar “Buscar” para ver el catálogo completo sin filtros y llegar desde un resultado a la ficha con sus acciones existentes de edición y eliminación, sin modificar la implementación de la pantalla Buscar.

**Independent Test**: Abrir “Buscar” sin texto ni categorías seleccionadas y comprobar que aparecen todos los ejercicios. Abrir uno desde los resultados y verificar en su ficha las acciones de edición y eliminación. Revisar que los filtros siguen funcionando y que la lista se lee y desplaza correctamente en móvil y escritorio.

### Tests for User Story 2

> Añadir cobertura de regresión. Los cambios de esta historia se limitan a pruebas y validación manual; no se editará el código de la pantalla Buscar.

- [X] T009 [P] [US2] Añadir una prueba que confirme que, sin filtros, la búsqueda muestra todos los ejercicios disponibles, incluidos los predefinidos y los creados por el usuario, en `tests/component/presentation/busqueda-ejercicios.component.spec.ts`.
- [X] T010 [P] [US2] Ampliar la prueba de integración para navegar desde un resultado de “Buscar” a su ficha y comprobar que allí siguen disponibles las acciones “Editar” y “Eliminar”, en `tests/component/presentation/shell-busqueda.integration.spec.ts`.
- [X] T011 [US2] Completar la comprobación visual de FR-039 descrita en `specs/001-gestion-ejercicios-fisicos/quickstart.md`: resultados diferenciados, texto legible y ajustado, scroll vertical y ausencia de scroll horizontal en móvil y escritorio; no modificar `src/app/presentation/busqueda-ejercicios/`.

**Checkpoint**: La búsqueda sin filtros presenta todo el catálogo; los filtros conservan su comportamiento; cada resultado permite llegar a las acciones existentes de la ficha y la lista cumple la comprobación visual FR-039.

## Phase 6: Polish y validación transversal

**Purpose**: Confirmar que el cambio no afecta otras rutas ni funciones y ejecutar las comprobaciones existentes.

- [X] T012 Ejecutar las pruebas Vitest de `tests/component/presentation/shell-biblioteca.integration.spec.ts`, `tests/component/presentation/ejercicio-ficha.component.spec.ts`, `tests/component/presentation/shell.component.spec.ts`, `tests/component/presentation/busqueda-ejercicios.component.spec.ts`, `tests/component/presentation/shell-busqueda.integration.spec.ts`, `tests/component/presentation/ejercicio-formulario.component.spec.ts` y `tests/component/presentation/categoria-gestion.component.spec.ts`; ejecutar también `npm run lint` y `npm run build` según `package.json`, y completar los recorridos pertinentes de `specs/001-gestion-ejercicios-fisicos/quickstart.md`.

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No requiere cambios.
- **Foundational (Phase 2)**: T001 verifica el comportamiento responsive existente y debe completarse antes de modificar el menú.
- **User Stories (Phase 3+)**: T002/T003 preceden a sus cambios de rutas y ficha. T004–T006 pueden ejecutarse en paralelo una vez satisfechas sus pruebas. T007 espera a T005. US2 no modifica código de producción de Buscar.
- **Polish (Phase 6)**: Depende de que terminen las tareas de las historias y sus pruebas.

### User Story Dependencies

- **US1 (P1)**: T004 depende de T001 y T002; T005 depende de T002; T006 depende de T003; T007 depende de T005.
- **US6 (P1)**: T008 depende de T004, T005 y T007 para validar la navegación final en todos los anchos definidos.
- **US2 (P2)**: T009 y T010 son independientes; T011 valida manualmente el requisito visual sin modificar la pantalla Buscar.

### Parallel Opportunities

- T001, T002 y T003 trabajan en archivos de prueba distintos y pueden prepararse en paralelo.
- Tras esas pruebas, T004, T005 y T006 modifican archivos distintos y pueden trabajarse en paralelo; T007 también puede ejecutarse en paralelo con T004 y T006 una vez que T005 haya eliminado la referencia de ruta.
- T009 y T010 son pruebas independientes y pueden prepararse en paralelo. T011 puede realizarse cuando esté disponible la versión a validar.

## Implementation Strategy

### MVP recomendado

Completar US1: publicar las dos acciones directas, retirar la pantalla de listado, conservar `/ejercicios` como redirección compatible y mantener las capacidades de ejercicio en la ficha accesible desde “Buscar”.

### Entrega incremental

1. Completar T001 y las pruebas de US1; implementar y validar US1.
2. Validar en US6 el overlay, el cierre y la ausencia de “Mis ejercicios” en móvil, tablet y escritorio.
3. Completar las pruebas de regresión de catálogo y navegación de US2; validar FR-039 manualmente sin tocar el código de Buscar.
4. Ejecutar T012 y confirmar que dominio, datos, rutas restantes, planificación, progreso y sincronización no han cambiado.

## Notes

- **Total**: 12 tareas: Foundational = 1, US1 = 6, US6 = 1, US2 = 3, Polish = 1.
- Los marcadores `[P]` indican archivos independientes que pueden trabajarse en paralelo, una vez completadas las dependencias indicadas.
- Los tests deben preceder a la implementación; las pruebas de regresión de Buscar no autorizan cambios en `src/app/presentation/busqueda-ejercicios/`.
- La ruta `/ejercicios` es solo una redirección de compatibilidad; no se conserva como pantalla ni como opción de navegación.

## Phase 7: Convergence

- [X] T013 Corregir el desbordamiento horizontal de la cabecera del shell entre 320 y 359 px y añadir una prueba de regresión, sin modificar la implementación de Buscar, conforme a SC-011 (partial).
