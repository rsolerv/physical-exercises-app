---





description: "Implementación incremental del rediseño visual y funcional de la gestión de ejercicios"
---

# Tasks: Rediseño de la experiencia de ejercicios y planificación

**Input**: [spec.md](./spec.md), [plan.md](./plan.md), [research.md](./research.md), [data-model.md](./data-model.md), [quickstart.md](./quickstart.md), [contracts/](./contracts/)

**Alcance**: US1–US6 y FR-038–FR-084, preservando las reglas de negocio anteriores. No crear una feature nueva, backend, entidad de negocio ni dependencia npm.

**Tests**: Obligatorios antes de implementar, según la constitución. Escribirlos con Vitest y Angular `TestBed`, ejecutarlos para comprobar que fallan por la funcionalidad pendiente y después implementar.

**Convenciones**: Mantener Angular Material, las capas Domain/Application/Infrastructure/Presentation, el idioma español de España y los requisitos de `.github/instructions/ux-ui.instructions.md`.

## Phase 1: Setup

**Purpose**: Confirmar el uso de la aplicación Angular y las herramientas existentes; no se requiere inicializar el proyecto ni instalar dependencias.

- [X] T001 Verificar los scripts existentes de test, lint y build en `package.json`, la estructura Angular en `src/app/` y los patrones de pruebas en `tests/`; conservar las dependencias actuales.

---

## Phase 2: Foundational

**Purpose**: No hay infraestructura técnica nueva. La fundación visual se entrega como US6, primera historia, y precede a los cambios de presentación de las demás historias.

**Checkpoint**: Tras T001, preparar las pruebas de US6 y US1 en paralelo si se desea; completar los tokens de US6 antes de implementar las vistas de biblioteca.

---

## Phase 3: User Story 6 - Usar una aplicación clara, coherente y accesible (Priority: P1)

**Goal**: Establecer el sistema visual y una navegación usable con teclado y tacto en móvil, tablet y escritorio.

**Independent Test**: Recorrer la navegación y pantallas disponibles en móvil, tablet y escritorio; verificar sección activa, acción principal, teclado, foco, contraste, estados y ausencia de solapamientos.

### Tests for User Story 6

> Escribir y ejecutar estas pruebas primero; comprobar que fallan antes de implementar el comportamiento.

- [X] T002 [P] [US6] Añadir pruebas de navegación adaptable, elemento activo, cierre del panel "Más", accesos directos a nuevo ejercicio y categorías, y ausencia de "Mis ejercicios" en `tests/component/presentation/shell.component.spec.ts` y `tests/component/presentation/shell-biblioteca.integration.spec.ts`.
- [X] T003 [P] [US6] Ampliar pruebas para título único, acciones contextuales, mensajes reconocibles, feedback de éxito/error y placeholders de carga con estructura y nombre accesible en `tests/component/presentation/compartido/ui/cabecera-pagina.component.spec.ts`, `tests/component/presentation/compartido/ui/estado-vacio.component.spec.ts`, `tests/component/presentation/compartido/ui/mensaje-feedback.service.spec.ts` y `tests/component/presentation/compartido/ui/estado-carga.component.spec.ts`.

### Implementation for User Story 6

- [X] T004 [US6] Definir la paleta exacta de FR-044 y tokens para Roboto Flex (Display 32/40, página 22/28, sección 16/24, lectura 16/26, cuerpo 14/20, metadato 12/16), líneas de texto legibles, cifras tabulares, espaciado de 8 px, márgenes de 16/24/32 px, listas de gestión con ancho máximo de 640 px (sin ancho máximo fijo para el formulario de ejercicio ni el editor de planificación en escritorio), radios de campos/chips de 8 px, tarjetas/medios de 16 px, botones píldora, alturas uniformes, áreas táctiles de 48 × 48 px, jerarquía de acciones, borde único de campos y colores de autorrelleno; servir la fuente con su licencia en `src/styles.scss`, `src/styles/_espaciado.scss`, `src/styles/_breakpoints.scss`, `src/styles/_utilidades.scss`, `public/assets/fonts/roboto-flex-variable.woff2` y `public/assets/fonts/OFL.txt`.
- [X] T005 [P] [US6] Implementar barra inferior y panel "Más" en móvil, riel de 80 px en tablet y navegación agrupada en escritorio, con estado activo y acción destacada de alta; conservar acceso directo a categorías y redirección compatible de `/ejercicios` a `/buscar`, en `src/app/presentation/compartido/shell/shell.component.ts`, `src/app/presentation/compartido/shell/shell.component.html`, `src/app/presentation/compartido/shell/shell.component.scss`, `src/app/presentation/compartido/shell/menu-principal.ts` y `src/app/app.routes.ts`.
- [X] T006 [P] [US6] Implementar cabeceras, estados vacíos, feedback contextual y un estado de carga reutilizable con placeholders que anticipen la estructura del contenido; aplicar foco visible y Angular Material cuando exista un componente equivalente en `src/app/presentation/compartido/ui/cabecera-pagina/cabecera-pagina.component.html`, `src/app/presentation/compartido/ui/cabecera-pagina/cabecera-pagina.component.scss`, `src/app/presentation/compartido/ui/estado-vacio/estado-vacio.component.html`, `src/app/presentation/compartido/ui/estado-vacio/estado-vacio.component.scss`, `src/app/presentation/compartido/ui/estado-carga/estado-carga.component.ts`, `src/app/presentation/compartido/ui/estado-carga/estado-carga.component.html`, `src/app/presentation/compartido/ui/estado-carga/estado-carga.component.scss` y `src/app/presentation/compartido/ui/mensaje-feedback.service.ts`.

**Checkpoint**: Navegación, sistema visual, estados de carga y controles compartidos están listos para integrarse con las pantallas de las siguientes historias.

---

## Phase 4: User Story 1 - Gestionar la biblioteca personal de ejercicios (Priority: P1) 🎯 MVP

**Goal**: Crear, editar y eliminar ejercicios y categorías; presentar categorías en contexto y permitir deshacer eliminaciones restaurando las asociaciones.

**Independent Test**: Crear una categoría y un ejercicio, comprobar sus datos, editar ambos, eliminar la categoría y el ejercicio y usar "Deshacer" para restaurar los registros y asociaciones sin cambiar sus identificadores.

### Tests for User Story 1

> Escribir y ejecutar estas pruebas primero; comprobar que fallan antes de implementar el comportamiento.

- [X] T007 [P] [US1] Añadir pruebas de presentación para recuento de ejercicios, creación junto a la lista, edición en línea confirmable con Enter/cancelable con Escape, categorías sin tratamiento especial, acción "Deshacer" y placeholder de carga en `tests/component/presentation/categoria-gestion.component.spec.ts`.
- [X] T008 [P] [US1] Añadir pruebas del caso de uso para que deshacer una categoría restaure su identificador original y las asignaciones anteriores, y para que fallos de restauración se comuniquen explícitamente, en `tests/unit/application/gestionar-categoria.use-case.spec.ts`.
- [X] T009 [P] [US1] Añadir pruebas del formulario para campos obligatorios y opcionales, errores junto al campo, categorías requeridas, URLs inválidas, imágenes URL/archivo y rechazo de archivos superiores a 5 MB; verificar en escritorio dos columnas, preview visible, acciones "Guardar"/"Cancelar" visibles sin desplazamiento y estados sin guardar/guardando/guardado en `tests/component/presentation/ejercicio-formulario.component.spec.ts`. Comprobar además que el primer arranque carga una sola vez las 7 categorías y 23 ejercicios predefinidos en `tests/unit/application/arrancar-aplicacion.use-case.spec.ts` y `tests/unit/application/sembrar-catalogo-predefinido.use-case.spec.ts`.
- [X] T010 [P] [US1] Añadir pruebas de eliminación y deshacer de ejercicio que comprueben restauración del identificador, datos, categorías y asociaciones con días de planificación en `tests/unit/application/gestionar-ejercicio.use-case.spec.ts`, `tests/unit/infrastructure/ejercicio-repository.sqlite.spec.ts` y `tests/unit/infrastructure/planificacion-repository.sqlite.spec.ts`.

### Implementation for User Story 1

- [X] T011 [P] [US1] Implementar la captura y restauración temporal de ejercicios y categorías conservando sus IDs, asignaciones a categorías y relaciones con días de planificación, y propagar errores de restauración, en `src/app/application/casos-uso/gestionar-categoria.use-case.ts`, `src/app/application/casos-uso/gestionar-ejercicio.use-case.ts`, `src/app/application/casos-uso/gestionar-planificacion.use-case.ts`, `src/app/application/ports/categoria-repository.port.ts`, `src/app/application/ports/ejercicio-repository.port.ts`, `src/app/application/ports/planificacion-repository.port.ts`, `src/app/infrastructure/persistencia-sqlite/categoria-repository.sqlite.ts`, `src/app/infrastructure/persistencia-sqlite/ejercicio-repository.sqlite.ts` y `src/app/infrastructure/persistencia-sqlite/planificacion-repository.sqlite.ts`.
- [X] T012 [P] [US1] Implementar recuento, creación, edición en línea y "Deshacer" de categorías, sin una categoría de sistema no eliminable; bloquear el borrado si algún ejercicio perdería su última categoría, indicando cuáles deben reasignarse, con estado de carga y alturas uniformes en `src/app/presentation/biblioteca-ejercicios/categorias/categoria-gestion.component.ts`, `src/app/presentation/biblioteca-ejercicios/categorias/categoria-gestion.component.html` y `src/app/presentation/biblioteca-ejercicios/categorias/categoria-gestion.component.scss`.
- [X] T013 [P] [US1] Implementar el formulario de ejercicio con bloques diferenciados, campos obligatorios y opcionales, validación contextual, enlaces e imágenes; en escritorio, mostrar en dos columnas el formulario y la ficha previa y mantener visibles "Guardar"/"Cancelar"; distinguir cambios sin guardar, guardando y guardado. Respetar que `nombre` no puede estar vacío, `descripción` no puede estar vacía, `categorías` debe contener al menos una, cada URL debe tener formato válido y cada imagen de archivo admite un máximo de 5 MB; mostrar el estado de carga correspondiente en `src/app/presentation/biblioteca-ejercicios/ejercicio-formulario.component.ts`, `src/app/presentation/biblioteca-ejercicios/ejercicio-formulario.component.html` y `src/app/presentation/biblioteca-ejercicios/ejercicio-formulario.component.scss`.
- [X] T037 [US1] Añadir pruebas para que la opción de agregar a hoy solo aparezca en altas con planificación activa, no aparezca sin planificación y asigne el ejercicio al día local actual al guardar, en `tests/component/presentation/ejercicio-formulario.component.spec.ts`.
- [X] T038 [US1] Consultar la planificación activa al crear un ejercicio y ofrecer antes de las acciones la opción "Agregar a los ejercicios de hoy"; al seleccionarla, asignar el ejercicio guardado al día actual y comunicar explícitamente cualquier fallo de asignación, en `src/app/presentation/biblioteca-ejercicios/ejercicio-formulario.component.ts`, `src/app/presentation/biblioteca-ejercicios/ejercicio-formulario.component.html` y `src/app/presentation/biblioteca-ejercicios/ejercicio-formulario.component.scss`.

**Checkpoint**: La biblioteca se puede usar de forma independiente sobre el sistema visual compartido; los formularios y las restauraciones cumplen sus criterios funcionales.

---

## Phase 5: User Story 2 - Buscar y consultar ejercicios (Priority: P2)

**Goal**: Encontrar ejercicios mediante texto o categorías y consultar su ficha sin perder el contexto de búsqueda en escritorio.

**Independent Test**: Buscar por texto y categoría, abrir varios resultados en móvil y escritorio, verificar que se conservan filtros/resultados donde corresponde y consultar medios disponibles y no disponibles.

### Tests for User Story 2

> Escribir y ejecutar estas pruebas primero; comprobar que fallan antes de implementar.

- [X] T014 [P] [US2] Añadir pruebas de resultados diferenciados sin imagen/miniatura, categorías separadas de la descripción, buscador y filtros disponibles durante el scroll, estados vacío/carga y navegación a la ficha desde resultados en `tests/component/presentation/busqueda-ejercicios.component.spec.ts` y `tests/component/presentation/shell-busqueda.integration.spec.ts`.
- [X] T015 [P] [US2] Añadir pruebas de ficha para orden y proporción de imágenes/vídeos, título/miniatura/atribución de vistas previas, reproducción explícita, enlaces autoidentificados, medios no disponibles, series/repeticiones de observaciones, carga y menú secundario destructivo en `tests/component/presentation/ejercicio-ficha.component.spec.ts`, `tests/component/presentation/enlace-embed.component.spec.ts` y `tests/component/presentation/youtube-embed.component.spec.ts`.

### Implementation for User Story 2

- [X] T016 [P] [US2] Implementar resultados legibles con nombre, descripción y categorías separadas visualmente, sin imagen ni miniatura; conservar filtros y búsqueda, estados vacío/carga mediante el componente compartido y navegación a la ficha al seleccionar un resultado, tanto en escritorio como en móvil, en `src/app/presentation/busqueda-ejercicios/busqueda-ejercicios.component.ts`, `src/app/presentation/busqueda-ejercicios/busqueda-ejercicios.component.html` y `src/app/presentation/busqueda-ejercicios/busqueda-ejercicios.component.scss`.
- [X] T017 [P] [US2] Implementar ficha con estado de carga, medios al inicio, imágenes completas ampliables, preview 16:9 con título/miniatura/atribución cuando estén disponibles y reproducción explícita; identificar enlaces, conservar el enlace original ante fallos, destacar series/repeticiones existentes sin inventarlas y ofrecer volver/editar y eliminación en menú secundario destructivo, en `src/app/presentation/biblioteca-ejercicios/ejercicio-ficha.component.ts`, `src/app/presentation/biblioteca-ejercicios/ejercicio-ficha.component.html`, `src/app/presentation/biblioteca-ejercicios/ejercicio-ficha.component.scss`, `src/app/presentation/compartido/embebidos/enlace-embed.component.ts`, `src/app/presentation/compartido/embebidos/enlace-embed.component.html`, `src/app/presentation/compartido/embebidos/enlace-embed.component.scss`, `src/app/presentation/compartido/embebidos/youtube-embed.component.ts`, `src/app/presentation/compartido/embebidos/youtube-embed.component.html` y `src/app/presentation/compartido/embebidos/youtube-embed.component.scss`.

**Checkpoint**: Se puede consultar el catálogo y abrir fichas sin perder el contexto requerido; los errores de medios no ocultan el resto de información.

---

## Phase 6: User Story 3 - Planificar la semana de ejercicios (Priority: P3)

**Goal**: Consultar y editar una semana desde una tira móvil o cuadrícula de escritorio, buscar ejercicios desde el día y abrir su ficha.

**Independent Test**: Crear y duplicar una planificación o plantilla, asignar ejercicios a varios días y comprobar tira/cuadrícula, etiquetas de plan, prevención de duplicados y accesos a fichas.

### Tests for User Story 3

> Escribir y ejecutar estas pruebas primero; comprobar que fallan antes de implementar.

- [X] T018 [P] [US3] Añadir pruebas de estado de carga, tira semanal, día actual, indicadores de actividad/descanso, cuadrícula de siete días, nombres de ejercicio en filas y fallback legible —nunca mostrar el ID— en `tests/component/presentation/calendario-semanal.component.spec.ts`.
- [X] T019 [P] [US3] Añadir pruebas del constructor para estado de carga, pantalla independiente de selección múltiple con búsqueda parcial por nombre y filtro por categoría, descripciones completas, prevención de duplicados, identificación "Activa"/"Plantilla", duplicado independiente, reglas y accesibilidad móvil del calendario de fecha en `tests/component/presentation/planificacion-constructor.component.spec.ts` y `tests/unit/application/gestionar-planificacion.use-case.spec.ts`.

### Implementation for User Story 3

- [X] T020 [P] [US3] Implementar la tira de siete días en móvil y cuadrícula comparable en escritorio, ejercicios como filas con acceso a ficha, estado de carga compartido, nombre legible del ejercicio ante cargas asíncronas y fallback "Ejercicio no disponible" sin exponer identificadores, en `src/app/presentation/planificacion-semanal/calendario/calendario-semanal.component.ts`, `src/app/presentation/planificacion-semanal/calendario/calendario-semanal.component.html` y `src/app/presentation/planificacion-semanal/calendario/calendario-semanal.component.scss`.
- [X] T021 [P] [US3] Implementar selección de planificación desde cabecera y una pantalla independiente de selección múltiple abierta por "Agregar ejercicio", con búsqueda parcial por nombre, filtro por categoría y resultados de descripción completa; añadir cada ejercicio al día inmediatamente al seleccionarlo, sin confirmación adicional ni duplicados; mantener el calendario accesible en móvil y respetar que `fechaInicio` DEBE ser un lunes y que no haya dos planificaciones concretas con la misma fecha de inicio, en `src/app/presentation/planificacion-semanal/constructor/planificacion-constructor.component.ts`, `src/app/presentation/planificacion-semanal/constructor/planificacion-constructor.component.html` y `src/app/presentation/planificacion-semanal/constructor/planificacion-constructor.component.scss`.

**Checkpoint**: La persona puede cambiar de plan y día, buscar y asignar ejercicios sin duplicados y comparar la semana en escritorio.

---

## Phase 7: User Story 4 - Marcar el progreso diario (Priority: P4)

**Goal**: Mostrar el progreso del día con estados inicial, parcial y completo; permitir marcar y deshacer desde Hoy y desde la ficha del ejercicio planificado.

**Independent Test**: Marcar y desmarcar ejercicios del día, comprobar el porcentaje y recuento, completar el 100 % y deshacer el último cambio desde notificación y ficha.

### Tests for User Story 4

> Escribir y ejecutar estas pruebas primero; comprobar que fallan antes de implementar.

- [X] T022 [P] [US4] Añadir pruebas de caso de uso para marcar/desmarcar y deshacer restaurando el valor previo de `realizado`, conservando el cálculo del porcentaje, en `tests/unit/application/gestionar-progreso-diario.use-case.spec.ts` y `tests/unit/domain/calcular-porcentaje-dia.spec.ts`.
- [X] T023 [P] [US4] Añadir pruebas de interfaz e integración para carga, mensajes de inicio, recuento parcial, confirmación del 100 %, controles táctiles, notificación "Deshacer" y acción independiente de progreso en la ficha en `tests/component/presentation/progreso-diario.component.spec.ts`, `tests/component/presentation/dia-actual.component.spec.ts`, `tests/component/presentation/dia-actual-progreso.integration.spec.ts`, `tests/component/presentation/ejercicio-ficha.component.spec.ts` y `tests/component/presentation/compartido/ui/mensaje-feedback.service.spec.ts`.

### Implementation for User Story 4

- [X] T024 [US4] Implementar el estado temporal necesario para deshacer una marca sin crear historial persistente y restaurar el valor anterior en `src/app/application/casos-uso/gestionar-progreso-diario.use-case.ts` y `src/app/presentation/compartido/ui/mensaje-feedback.service.ts`.
- [X] T025 [US4] Implementar estados de carga y progreso inicial/parcial/completo, controles de al menos 56 px de alto en el flujo de ejercicio, acción para abrir ficha y control de progreso independiente en `src/app/presentation/progreso-diario/progreso-diario.component.ts`, `src/app/presentation/progreso-diario/progreso-diario.component.html`, `src/app/presentation/progreso-diario/progreso-diario.component.scss`, `src/app/presentation/planificacion-semanal/dia-actual/dia-actual.component.ts`, `src/app/presentation/planificacion-semanal/dia-actual/dia-actual.component.html`, `src/app/presentation/planificacion-semanal/dia-actual/dia-actual.component.scss`, `src/app/presentation/biblioteca-ejercicios/ejercicio-ficha.component.ts`, `src/app/presentation/biblioteca-ejercicios/ejercicio-ficha.component.html` y `src/app/presentation/biblioteca-ejercicios/ejercicio-ficha.component.scss`.

**Checkpoint**: El porcentaje y el mensaje describen el mismo progreso; "Deshacer" restaura el estado previo mientras siga visible la notificación.

---

## Phase 8: User Story 5 - Conservar y sincronizar la información (Priority: P5)

**Goal**: Mantener los datos locales y la sincronización existente; mostrar estado y fecha de última sincronización correcta, incluso tras reabrir la aplicación.

**Independent Test**: Sincronizar correctamente, reabrir la pantalla y verificar la fecha; provocar un error y un conflicto para comprobar que los datos locales y la última fecha correcta se conservan; validar también configuración y elección de resolución en dos navegadores.

### Tests for User Story 5

> Escribir y ejecutar estas pruebas primero; comprobar que fallan antes de implementar.

- [X] T026 [P] [US5] Añadir pruebas de actualización compatible del esquema para instalaciones previas, conservación de registros existentes, valor nulo inicial de la fecha y persistencia UTC en `tests/unit/infrastructure/ajustes-repository.sqlite.spec.ts`.
- [X] T027 [P] [US5] Añadir pruebas del flujo de sincronización para registrar la fecha solo tras éxito y conservar la fecha anterior ante error/conflicto, sin cambiar la regla de resolución local/remota ni incluir el token en los datos exportados, en `tests/unit/application/sincronizar-github.use-case.spec.ts` y `tests/unit/application/exportar-importar-datos.use-case.spec.ts`.
- [X] T028 [P] [US5] Añadir pruebas de estados de carga, sin configurar/sincronizando/sincronizado/error/conflicto, repositorio y fecha, configuración abierta o plegada, token oculto y errores de campo en `tests/component/presentation/configuracion-sincronizacion.component.spec.ts` y `tests/component/presentation/resolucion-conflicto.component.spec.ts`.

### Implementation for User Story 5

- [X] T029 [US5] Añadir la fecha opcional de última sincronización al puerto, almacenamiento y esquema con migración compatible, mapeando el campo lógico `ultimaSincronizacionCorrecta` a la convención de nombres SQLite existente: el valor es "fecha-hora ISO 8601 en UTC", "se actualiza solo cuando una sincronización termina correctamente", "un error o conflicto no debe sobrescribir la fecha anterior" y "en instalaciones anteriores a este campo, el valor inicial es nulo"; mantener los datos existentes en `src/app/application/ports/ajustes-repository.port.ts`, `src/app/infrastructure/persistencia-sqlite/esquema.ts`, `src/app/infrastructure/persistencia-sqlite/motor-sqlite.ts` y `src/app/infrastructure/persistencia-sqlite/ajustes-repository.sqlite.ts`.
- [X] T030 [US5] Registrar la fecha UTC a través de `registrarSincronizacionCorrecta(fecha)` únicamente tras completar con éxito la sincronización, sin llamarlo en las ramas de error o conflicto, en `src/app/application/casos-uso/sincronizar-github.use-case.ts`.
- [X] T031 [US5] Implementar tarjeta de sincronización con estado de carga, repositorio, fecha y acción principal; dejar configuración abierta sin credenciales y plegada si ya está configurada, mantener oculto el token y conservar la resolución explícita de conflictos en `src/app/presentation/sincronizacion/configuracion/configuracion-sincronizacion.component.ts`, `src/app/presentation/sincronizacion/configuracion/configuracion-sincronizacion.component.html`, `src/app/presentation/sincronizacion/configuracion/configuracion-sincronizacion.component.scss`, `src/app/presentation/sincronizacion/conflicto/resolucion-conflicto.component.ts`, `src/app/presentation/sincronizacion/conflicto/resolucion-conflicto.component.html` y `src/app/presentation/sincronizacion/conflicto/resolucion-conflicto.component.scss`.

**Checkpoint**: La fecha de éxito persiste tras reabrir la aplicación; ni un fallo ni un conflicto la reemplazan ni pierden datos locales.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Verificar regresiones, constitución, calidad y recorridos manuales de las seis historias.

- [X] T032 Ejecutar el conjunto Vitest de `tests/unit/` y `tests/component/`; resolver fallos y comprobar los umbrales de cobertura global del 80 % y Domain del 100 % definidos en `package.json` y en `.specify/memory/constitution.md`.
- [X] T033 Ejecutar `npm run lint` y `npm run build` según `package.json`; corregir errores de lint y build sin añadir dependencias.
- [X] T034 Completar los recorridos de US1–US6, sincronización, anchos de 320 a 1366 px, teclado, contraste, estados y controles táctiles, registrar los tiempos de SC-001/002/004/006/009/023/026 y comprobar SC-031 (actualización en menos de 1 segundo) según `specs/001-gestion-ejercicios-fisicos/quickstart.md`; corregir incumplimientos del contrato de `specs/001-gestion-ejercicios-fisicos/contracts/interfaz-usuario.md`.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: T001 verifica el entorno existente; no instala ni actualiza paquetes.
- **Foundational (Phase 2)**: No requiere implementación nueva; las historias pueden comenzar después de T001.
- **User Stories (Phase 3+)**: US6 establece primero los tokens, el shell y los estados compartidos descritos como fundación en `plan.md`. Las pruebas de US1 pueden prepararse en paralelo, pero sus vistas deben esperar a T004. US2 requiere la biblioteca de US1; US3 requiere ejercicios de US1; US4 requiere planificación de US3; US5 integra la persistencia y los datos de US1, US3 y US4.
- **Polish (Phase 9)**: Depende de las historias acordadas y de sus pruebas.

### User Story Dependencies

- **US6 (P1)**: Fundacional para las vistas de las demás historias; completar tokens antes de integrar sus componentes de presentación.
- **US1 (P1)**: Primer incremento funcional de biblioteca; sus pruebas pueden escribirse en paralelo con US6, pero T012/T013 requieren los tokens de T004.
- **US2 (P2)**: Requiere ejercicios disponibles de US1.
- **US3 (P3)**: Requiere ejercicios de US1; no depende de la búsqueda de US2.
- **US4 (P4)**: Requiere planificación disponible de US3.
- **US5 (P5)**: Requiere los datos y flujos de escritura de US1, US3 y US4 para validar persistencia y sincronización completa.

### Within Each User Story

- Los tests de cada historia preceden a toda implementación relacionada y deben fallar por el comportamiento pendiente.
- T004 precede a T005/T006 y a los cambios de presentación T012/T013; T003 precede a la implementación del estado de carga compartido T006.
- Las pruebas T007–T010 preceden a T011–T013.
- Los cambios de UI y de Application/Infrastructure pueden avanzar en paralelo solo si no comparten archivos ni dependen de contratos aún no implementados.
- La migración del puerto/esquema/SQLite (T029) precede al uso del nuevo método de sincronización (T030), que precede a la integración visual dependiente de la fecha (T031).

### Parallel Opportunities

- T002 y T003 son pruebas independientes. Después de T004, T005 y T006 pueden implementarse en paralelo.
- Las pruebas T007–T010 trabajan archivos distintos y pueden prepararse en paralelo con las pruebas de US6. Tras ellas y T004, T011–T013 pueden implementarse en paralelo porque trabajan lógica, categorías y formulario en rutas distintas.
- T014 y T015 son pruebas independientes; T016 y T017 trabajan áreas de presentación distintas y pueden implementarse en paralelo tras pasar las pruebas.
- T018 y T019 son pruebas independientes; T020 y T021 trabajan calendario y constructor en archivos distintos.
- T022 y T023 pueden prepararse en paralelo. T024 precede a la UI de progreso T025.
- T026–T028 son pruebas independientes; después, T029 precede a T030 y T031.

### Parallel Execution Examples per User Story

```text
US6: T002 + T003; luego T004 y después T005 + T006.
US1: T007 + T008 + T009 + T010; luego T011 + T012 + T013 (T012/T013 esperan a T004).
US2: T014 + T015; luego T016 + T017.
US3: T018 + T019; luego T020 + T021.
US4: T022 + T023; luego T024 y T025.
US5: T026 + T027 + T028; luego T029, después T030 y finalmente T031.
```

---

## Implementation Strategy

### MVP recomendado

Completar primero la base visual y de navegación de US6, en particular T004, y entregar US1 como primer incremento funcional independiente: gestión de categorías y ejercicios, validación y restauración temporal con asociaciones. US2–US5 se añaden incrementalmente.

### Entrega incremental

1. Confirmar T001 y completar las pruebas, tokens, shell y estados compartidos de US6.
2. Completar US1 con sus pruebas previas y validar la biblioteca sobre el sistema visual compartido.
3. Entregar US2 y después US3, que depende de ejercicios existentes.
4. Entregar US4 tras la planificación y US5 cuando estén disponibles los datos que debe conservar y sincronizar.
5. Ejecutar T032–T034 antes de aceptar el rediseño completo.

## Validation Summary (anterior a la enmienda de paginación)

- **Total**: 41 tareas, incluidas 2 tareas de convergencia pendientes, 3 tareas de convergencia cerradas por decisión de producto y 2 tareas de la ampliación de US1.
- **Por historia**: US1 = 9; US6 = 5; US2 = 4; US3 = 4; US4 = 4; US5 = 6.
- **Fuera de historias**: Setup = 1; Foundational = 0; Polish = 3; Convergence = 5 (2 pendientes y 3 cerradas por decisión de producto).
- **Criterios de prueba independientes**: definidos en cada fase de US1–US6.
- **MVP**: US6 como base visual seguida de US1 como primer incremento funcional.
- **Formato**: todas las tareas usan `- [ ] T###`, incluyen etiqueta de historia cuando corresponde y citan rutas concretas.

## Phase 10: Convergence

- [ ] T035 Completar y registrar los recorridos manuales pendientes: tiempos de SC-001, SC-002, SC-004, SC-006, SC-009 y SC-023; además, verificar teclado, foco, contraste y áreas táctiles según US6/AC6–8 y SC-028, corrigiendo los incumplimientos que se detecten (partial).
- [ ] T036 Validar la sincronización real entre dos navegadores o perfiles, incluidos los escenarios de cambios locales/remotos y conflicto, y comprobar la transferencia de los datos según US5/AC2–7, FR-035 y SC-008; usar credenciales locales del usuario, sin compartir el token (partial).

## Phase 11: Convergence

- [X] T038 Cerrada por decisión de producto (2026-10-23): no implementar vista maestro-detalle en "Buscar"; seleccionar un resultado abre su ficha en una pantalla dedicada.
- [X] T039 Cerrada por decisión de producto (2026-10-23): priorizar la rapidez; cada ejercicio se incorpora al seleccionarlo sin confirmación adicional.
- [X] T040 Cerrada por decisión de producto (2026-10-23): no se exige deduplicar las categorías mostradas en los resultados de búsqueda.

## Phase 12: Enmienda 2026-11-04 — Preparación y aprobación visual

**Alcance aprobado**: FR-086–FR-095 y SC-035–SC-038 de [spec.md](./spec.md). SQL paginado, resúmenes sin medios, 50 inicialmente; Buscar usa anterior/siguiente y selector 25/50/100 en tablet/escritorio; Agregar acumula bloques de 50. Preservar todas las tareas y estados previos: esta ampliación no los da por ejecutados.

**Gate**: la propietaria ha aprobado la propuesta funcional, no un prototipo ejecutable. T043 bloquea los cambios de presentación T050/T052.

- [] T041 Confirmar el contexto `.specify/feature.json` en `001-gestion-ejercicios-fisicos`, leer la enmienda de `specs/001-gestion-ejercicios-fisicos/plan.md` y localizar todos los consumidores/dobles de `EjercicioRepositoryPort` antes de cambiar sus firmas; no añadir dependencias ni redefinir `listarTodos()`.
- [] T042 Encargar al agente `ux-ui-expert` la creación/actualización de `src/stories/paginacion-ejercicios.stories.ts` y las historias afectadas de `src/stories/pantallas.stories.ts`, con prototipos aislados cuando hagan falta: ambas pantallas, shell/rutas reales, 390/834/1280 px, 0/49/50/51/125 coincidencias, bloques/páginas intermedias, selección global, cargas, error/reintento y éxito. No implementar aún la presentación real.
- [] T043 Ejecutar `npm run build-storybook` y `npm run storybook` según `package.json`, comprobar que Storybook responde, y hacer que `ux-ui-expert` presente URL y capturas por dispositivo; registrar aquí la aprobación explícita del prototipo o las mejoras solicitadas, iterando antes de desbloquear T050/T052.

**Registro de aprobación visual**: Pendiente. No hay todavía historias ni capturas aprobadas para esta enmienda.

## Phase 13: Enmienda — Fundamentos de lectura paginada

**Meta**: Implementar el contrato SQL sin cambiar las operaciones completas. Test-first obligatorio por constitución. Esta fase puede avanzar durante la revisión visual, pero no permite anticipar T050/T052.

- [ ] T044 [P] Añadir primero pruebas fallidas en `tests/unit/infrastructure/ejercicio-repository.sqlite.spec.ts`: 0/49/50/51/125 coincidencias, texto/categorías/ambos, categoría múltiple sin duplicados, categorías completas de cada resumen, nombres iguales con desempate por id, total filtrado, página fuera de rango y errores propagados; espiar la conexión para exigir como máximo tres consultas, cero lecturas a `ejercicio_enlace`/`ejercicio_imagen` y ningún hidratador completo incluso con medios presentes. Verificar índices e inicialización idempotente sobre base nueva/existente.
- [ ] T045 [P] Añadir primero pruebas fallidas en `tests/unit/application/buscar-ejercicios.use-case.spec.ts`: valores iniciales página 0/tamaño 50, `trim()`, categorías sin repetir, delegación a búsqueda SQL/conteo, sin `listarTodos()` ni intersección JS; rechazo explícito de página que no sea entero seguro mayor o igual que 0, tamaño fuera del intervalo entero 1–100 y desplazamiento inseguro; propagación de errores.
- [ ] T046 Añadir `EjercicioResumen` puro con solo id/nombre/descripcion/categoriaIds en `src/app/domain/ejercicio/ejercicio.entity.ts`, crear los tipos `CriteriosBusquedaEjercicios`/`PaginaEjercicios` en `src/app/application/models/busqueda-ejercicios.ts` y migrar `src/app/application/ports/ejercicio-repository.port.ts` según `specs/001-gestion-ejercicios-fisicos/contracts/ejercicio-repository.port.md`; mantener `Ejercicio`, `listarTodos()` y detalle completo.
- [ ] T047 Implementar `buscarPaginado`/`contarTodos` en `src/app/infrastructure/persistencia-sqlite/ejercicio-repository.sqlite.ts`: SQL parametrizado con texto AND `EXISTS`, conteo con idéntico predicado, `ORDER BY nombre, id`, límite/desplazamiento y categorías en un lote; añadir índices idempotentes `(nombre, id)` y `(categoria_id, ejercicio_id)` en `src/app/infrastructure/persistencia-sqlite/esquema.ts`. No leer medios en la ruta paginada ni cambiar escrituras/exportaciones.
- [ ] T048 Migrar `src/app/application/casos-uso/buscar-ejercicios.use-case.ts` a normalización/validación y delegación `buscarPaginado`/`contarTotal`; retirar los métodos de búsqueda antiguos y actualizar todos los dobles afectados en `tests/`, `src/stories/demo-data.ts` y `src/stories/pantallas.stories.ts`. No simular agregados completos rellenando medios vacíos.

**Checkpoint**: T044/T045 pasan con SQLite real en memoria; ninguna búsqueda paginada carga el catálogo completo ni sus medios.

## Phase 14: Enmienda — US2 Buscar y consultar (P2)

**Prueba independiente**: Con 125 resultados, recorrer 1–50/51–100/101–125, cambiar filtros/tamaño y abrir/volver de ficha sin omisiones ni pérdida de contexto. Abrir la ficha sigue cargando medios.

- [ ] T049 [US2] Añadir antes de implementar pruebas en `tests/component/presentation/busqueda-ejercicios.component.spec.ts` y `tests/component/presentation/shell-busqueda.integration.spec.ts`: tamaño inicial 50, límites, total SQL, cambio de filtro/tamaño, error y reintento, respuestas fuera de orden, vuelta desde ficha, borrado de última página, invalidación tras importación/sincronización y ausencia de `listarTodos()` en las consultas de Buscar.
- [ ] T050 [US2] Después de T043 y T049, implementar página/tamaño/clave activa, conteo ligero, `MatPaginator` traducido, estados/foco/anuncios y maquetación aprobada en `src/app/presentation/busqueda-ejercicios/busqueda-ejercicios.component.ts`, `.html` y `.scss`; cambiar el input de `src/app/presentation/compartido/ejercicios/ejercicio-list-item.component.ts` a `EjercicioResumen`, actualizar sus usos y coordinar el retorno/invalidación con `src/app/presentation/biblioteca-ejercicios/ejercicio-ficha.component.ts`. Sin componentes personalizados que dupliquen Material.

## Phase 15: Enmienda — US3 Seleccionar ejercicios de planificación (P3)

**Prueba independiente**: Con 125 candidatos, cargar 50/100/125 y seleccionar en distintos bloques/filtros, conservando asignaciones del día y contador global; fallar/reintentar no pierde ni duplica datos.

- [ ] T051 [US3] Crear primero `tests/component/presentation/agregar-ejercicio.component.spec.ts` y ampliar las pruebas del constructor en `tests/component/presentation/planificacion-constructor.component.spec.ts`: páginas SQL de 50, acumulación, último bloque parcial, contador global, ids previamente asignados, cambio de filtro/día, doble clic, respuesta obsoleta, error/reintento sin saltos, no emitir deselección por desmontar opciones y conservar errores/reglas de incorporación existentes.
- [ ] T052 [US3] Después de T043 y T051, implementar el acumulador por consulta vigente, carga serial de la siguiente página, error/reintento, foco/anuncios y botón Material "Cargar más" según el prototipo en `src/app/presentation/planificacion-semanal/constructor/agregar-ejercicio/agregar-ejercicio.component.ts`, `.html` y `.scss`; enlazar ids/contador del día y `[selected]` desde `src/app/presentation/planificacion-semanal/constructor/planificacion-constructor.component.ts` y `.html`. Conservar asignaciones al filtrar/inicializar bloques y al refrescar catálogo, sin convertir lecturas completas del padre en una primera página.

## Phase 16: Enmienda — US5 Integridad de los datos completos (P5)

**Prueba independiente**: Habiendo visitado solo 50 resultados, exportar/sincronizar/restaurar más de 100 y recuperar ejercicios, medios y relaciones de páginas no visitadas.

- [ ] T053 [US5] Añadir regresiones en `tests/unit/application/exportar-importar-datos.use-case.spec.ts`, `tests/unit/application/sincronizar.use-case.spec.ts` y `tests/unit/application/copia-manual.use-case.spec.ts` con más de 100 ejercicios: todos los ids/campos/medios/relaciones se exportan/restauran para GitHub, Google y copia manual sin depender de filtros/páginas, y estas operaciones no usan el método paginado. Mantener el formato y compatibilidad vigentes; corregir solo regresiones provocadas por la migración.

## Phase 17: Enmienda — Validación transversal

- [ ] T054 Preparar datos sintéticos importables y reutilizables para 51/125/1000 ejercicios bajo `tests/fixtures/`, siguiendo el formato existente de `tests/fixtures/generar-copia-100-ejercicios.ts`, con nombres repetidos, varias categorías, planificación y medios en ejercicios fuera del primer bloque; usar filtros para conjuntos de 0/49/50. No usar datos personales ni regenerar fixtures ajenas innecesariamente.
- [ ] T055 Ejecutar primero las pruebas dirigidas T044/T045/T049/T051/T053; después validar cobertura y regresiones de `tests/unit/` y `tests/component/` con la configuración de `package.json`, manteniendo 80 % global y 100 % Domain, y ejecutar `npm run lint`, `npm run build` y `npm run build-storybook`. Resolver referencias antiguas al puerto sin añadir dependencias.
- [ ] T056 Completar y registrar resultados de `specs/001-gestion-ejercicios-fisicos/quickstart.md` para SC-035–SC-038: 390/834/1280 px, 320/intermedios, zoom, tacto/teclado/lector, errores de historias y tres medidas de cada recorrido con 1000 ejercicios; sincronizar con ambos destinos autorizados por separado y restaurar una copia en otro perfil para verificar datos no visitados. No marcar verificaciones no realizadas como superadas.

### Dependencias de la enmienda

```text
T041 → T042 → T043 (gate visual)
T041 → T044 + T045 (pruebas independientes)
T044 + T045 → T046 → T047 → T048
T048 → T049 → T050 (requiere además T043)
T048 → T051 → T052 (requiere además T043)
T048 → T053
T041 → T054
T050 + T052 + T053 → T055
T043 + T054 + T055 → T056
```

T049/T051 se pueden preparar en paralelo después del contrato migrado: trabajan pruebas diferentes. T050 y T052 son incrementos funcionales independientes tras sus pruebas y el gate visual, pero hay que coordinar cualquier utilidad compartida de anuncios/invalidación para no duplicarla. T053 puede prepararse en paralelo con las pruebas de pantallas. T054 puede avanzar durante la revisión visual.

### Resumen y estrategia de entrega de la enmienda

- **16 tareas nuevas**, T041–T056, todas pendientes: preparación/gate 3; fundamentos 5; US2 2; US3 2; US5 1; validación transversal 3. No se renumeran ni se cierran las tareas previas.
- **Primer incremento**: contrato/datos SQL y resúmenes test-first; tras la aprobación visual, Buscar (US2) es la primera entrega utilizable. Después se integra el selector US3, manteniendo las regresiones de datos completos US5.
- **Trazabilidad**: T044–T048 cubren FR-086/089; T049–T050 FR-087/090/092/093/095; T051–T052 FR-088/090/091/092/093/095; T053 FR-094; T042–T043 el gate constitucional; T054–T056 SC-035–SC-038 y regresiones transversales.
- **Formato**: tareas con casilla, id único, etiqueta de historia en fases de historia y rutas concretas. `[P]` solo identifica las pruebas de fundamentos realmente independientes; las demás oportunidades están condicionadas al grafo anterior.
