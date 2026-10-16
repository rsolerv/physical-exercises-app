# Feature Specification: Mejora de la presentación (UI/UX) de la aplicación


**Feature Branch**: `002-mejora-presentacion-ui`

**Created**: 2026-10-16

**Status**: Draft

**Input**: User description: "mejorar la presentación del proyecto actual usando las instrucciones de #ux-ui.instructions.md"

## Clarifications

### Session 2026-10-16

- Q: ¿Qué nivel de accesibilidad debe cumplir esta mejora de presentación (contraste de color, navegación por teclado, lectores de pantalla)? → A: Nivel WCAG 2.1 AA: contraste mínimo, foco visible y navegación por teclado en todos los controles.
- Q: La aplicación no tiene backend ni telemetría, ¿cómo se verifica el "50% menos de errores de validación" de SC-004? → A: Se mantiene el 50% como objetivo orientativo/aspiracional, sin verificación formal; no es un criterio de aceptación bloqueante.
- Q: ¿Qué rango de ancho debe usarse como referencia para "tablet" al verificar el diseño responsive? → A: 768–1024 px (rango estándar de tablet en Material Design / Angular CDK Breakpoints).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Explorar y gestionar la biblioteca de ejercicios con una presentación profesional (Priority: P1)

Como usuario que gestiona su biblioteca de ejercicios físicos, quiero que el listado de "Mis ejercicios" y la gestión de categorías se vean ordenados, con buena jerarquía visual y estados claros (vacío, cargando, con datos), para poder encontrar y gestionar mis ejercicios de forma rápida y sin esfuerzo visual.

**Why this priority**: Es la pantalla que más se usa hoy en la aplicación (la única con funcionalidad completa de alta, listado y categorización). Mejorar su presentación aporta el mayor valor percibido inmediato y sirve de referencia visual para el resto de pantallas.

**Independent Test**: Puede probarse de forma independiente abriendo la sección "Mis ejercicios" con cero, uno y muchos ejercicios/categorías, y verificando que la información clave se entiende sin desplazamiento adicional y que las acciones principales (crear ejercicio, gestionar categorías, eliminar categoría) son evidentes y accesibles en un clic.

**Acceptance Scenarios**:

1. **Given** el usuario no tiene ningún ejercicio registrado, **When** abre la sección "Mis ejercicios", **Then** ve un mensaje de estado vacío claro y con estilo propio (no texto plano) que le indica cómo crear su primer ejercicio.
2. **Given** el usuario tiene varios ejercicios registrados, **When** abre la sección "Mis ejercicios", **Then** ve cada ejercicio presentado como un elemento visualmente diferenciado (tarjeta o fila con espaciado claro), con su nombre y descripción legibles sin necesidad de desplazamiento horizontal.
3. **Given** los datos de ejercicios están cargando, **When** el usuario visualiza la pantalla, **Then** ve un indicador de carga coherente con el resto de la aplicación en lugar de una pantalla en blanco o desalineada.
4. **Given** el usuario está en la gestión de categorías, **When** intenta eliminar una categoría que no es genérica, **Then** la acción y su resultado (éxito o error) se comunican con una señal visual clara junto al elemento afectado.

---

### User Story 2 - Completar el formulario de ejercicio con confianza (Priority: P2)

Como usuario que da de alta o edita un ejercicio, quiero que el formulario agrupe la información en secciones claras, marque qué campos son obligatorios y muestre los errores junto al campo correspondiente, para poder completarlo rápido y sin cometer errores innecesarios.

**Why this priority**: El formulario es el segundo punto de contacto más frecuente tras el listado y es donde se genera el contenido principal de la aplicación; una mala presentación aquí provoca abandono o errores de introducción de datos.

**Independent Test**: Puede probarse de forma independiente abriendo el formulario de "Nuevo ejercicio", dejando campos obligatorios vacíos y comprobando que los mensajes de validación aparecen junto al campo afectado, que las secciones (datos básicos, categorías, enlaces, imágenes, observaciones) se distinguen visualmente, y que el usuario recibe confirmación clara al guardar.

**Acceptance Scenarios**:

1. **Given** el usuario abre el formulario de un nuevo ejercicio, **When** observa la pantalla, **Then** identifica claramente los distintos bloques de información (datos básicos, categorías, enlaces, imágenes, observaciones) gracias a una jerarquía visual y espaciado consistentes.
2. **Given** el usuario deja un campo obligatorio vacío o inválido, **When** intenta guardar o abandona el campo, **Then** el mensaje de error aparece junto al campo afectado y el campo se resalta visualmente.
3. **Given** el usuario guarda el formulario correctamente, **When** la operación finaliza, **Then** recibe una confirmación visual clara de que el ejercicio se ha guardado.
4. **Given** el usuario está añadiendo enlaces o imágenes, **When** revisa la lista de elementos añadidos, **Then** cada elemento se presenta de forma ordenada y con una acción de eliminación fácilmente identificable.

---

### User Story 3 - Navegar por una aplicación coherente y responsiva de principio a fin (Priority: P3)

Como usuario de la aplicación en cualquier dispositivo, quiero que la barra superior, el menú de navegación y las secciones aún no disponibles ("Hoy", "Buscar", "Planificación", "Sincronización") mantengan el mismo nivel de acabado visual y se adapten bien a mi pantalla, para tener una experiencia coherente y profesional en toda la aplicación, no solo en las pantallas ya terminadas.

**Why this priority**: Aporta coherencia global y "sensación de producto terminado", pero depende de que las pantallas principales (US1, US2) ya tengan el estilo de referencia aplicado, y afecta a secciones que hoy todavía no tienen funcionalidad real.

**Independent Test**: Puede probarse de forma independiente navegando entre todas las secciones del menú en un ancho de escritorio, uno de tablet y uno de móvil, verificando que el menú y la barra superior se comportan correctamente (incluyendo apertura/cierre en móvil) y que las secciones pendientes muestran un mensaje de "próximamente" con el mismo estilo visual que el resto de la aplicación.

**Acceptance Scenarios**:

1. **Given** el usuario abre la aplicación en una pantalla estrecha (móvil), **When** visualiza el shell de navegación, **Then** el menú lateral se presenta de forma adaptada (oculto u optimizado) y se puede abrir con un control táctil de tamaño adecuado.
2. **Given** el usuario abre la aplicación en una pantalla ancha (escritorio), **When** visualiza el shell de navegación, **Then** aprovecha el espacio disponible mostrando el menú lateral y el contenido con una densidad de información adecuada.
3. **Given** el usuario navega a una sección todavía no implementada (p. ej. "Buscar"), **When** la pantalla se muestra, **Then** ve un mensaje de "próximamente" con el mismo estilo visual (tipografía, color, espaciado) que el resto de la aplicación, en lugar de texto plano sin formato.
4. **Given** el usuario cambia de sección usando el menú, **When** la nueva pantalla se carga, **Then** la sección activa se indica visualmente de forma clara en el menú.

---

### Edge Cases

- ¿Qué ocurre cuando el nombre o la descripción de un ejercicio es muy largo? El texto debe truncarse o ajustarse sin romper el diseño de la tarjeta/fila ni provocar desplazamiento horizontal.
- ¿Qué ocurre cuando hay muchas categorías seleccionables en el formulario? Deben organizarse (por ejemplo, ajustándose en varias líneas) sin desbordar el contenedor.
- ¿Qué ocurre cuando una imagen asociada a un ejercicio no carga o el enlace es inválido? Debe mostrarse un indicador visual de error sin romper el resto del formulario.
- ¿Qué ocurre en pantallas muy estrechas (anchura menor a 360 px)? Los controles de navegación y los formularios deben seguir siendo utilizables sin solapamientos ni texto cortado.
- ¿Qué ocurre si una operación de guardado o eliminación falla? El error debe comunicarse con el mismo nivel de cuidado visual que la confirmación de éxito, cerca del contexto donde ocurrió.
- ¿Qué ocurre si el usuario tiene una lista muy larga de ejercicios? El listado debe seguir siendo navegable (desplazamiento vertical fluido) sin degradar el rendimiento percibido ni la legibilidad.
- ¿Qué ocurre al abrir el menú lateral en móvil? DEBE presentarse como una superposición (overlay) que ocupa todo el ancho de la pantalla, nunca como una columna fija que comprima el contenido principal en una franja estrecha; al seleccionar cualquier entrada de navegación, el menú DEBE cerrarse automáticamente para mostrar el contenido sin un toque adicional (corrección post-entrega, FR-009, FR-010).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE mostrar en cada pantalla una cabecera visible sin necesidad de desplazamiento, con el título de la sección y, cuando existan, sus acciones principales.
- **FR-002**: El sistema DEBE presentar el listado de ejercicios como elementos visualmente diferenciados (tarjeta o fila con espaciado y jerarquía tipográfica claros), permitiendo distinguir nombre y descripción de un vistazo.
- **FR-003**: El sistema DEBE mostrar un estado vacío con estilo propio y un mensaje orientativo cuando no existan ejercicios o categorías, en lugar de texto plano sin formato.
- **FR-004**: El sistema DEBE mostrar un indicador de carga visualmente coherente con el resto de la interfaz mientras se obtienen los datos de ejercicios o categorías.
- **FR-005**: El sistema DEBE agrupar los campos del formulario de ejercicio en secciones claramente diferenciadas (datos básicos, categorías, enlaces, imágenes, observaciones).
- **FR-006**: El sistema DEBE mostrar los mensajes de validación de cada campo junto al propio campo, resaltando visualmente el campo afectado.
- **FR-007**: El sistema DEBE indicar de forma clara y visible qué campos del formulario son obligatorios antes de que el usuario intente enviarlo.
- **FR-008**: El sistema DEBE ofrecer una confirmación visual clara cuando se crea, edita o elimina un ejercicio o una categoría, y una señal de error igualmente clara cuando la operación falla.
- **FR-009**: El sistema DEBE permitir alcanzar cualquier acción principal (crear, editar, eliminar, guardar, cambiar de sección) en un único clic o toque desde la pantalla correspondiente.
- **FR-010**: El sistema DEBE adaptar la disposición de cada pantalla a un diseño de una sola columna en anchos de pantalla móviles (hasta 599 px) y a una disposición más densa en anchos de tablet (768–1024 px) y escritorio (1280 px o más).
- **FR-011**: El sistema DEBE garantizar que los controles de navegación (menú, barra superior, botones) tengan un tamaño cómodo para interacción táctil en dispositivos móviles y tablet.
- **FR-012**: El sistema DEBE aplicar un estilo visual coherente y profesional (espaciado, tipografía, color) en todas las pantallas de la aplicación, incluidas las secciones todavía no implementadas funcionalmente.
- **FR-013**: Las pantallas de secciones pendientes de implementar DEBEN comunicar su estado ("próximamente"/"en construcción") con el mismo tratamiento visual que el resto de la aplicación, en lugar de un texto plano sin formato.
- **FR-014**: El sistema DEBE conservar sin cambios todo el comportamiento funcional existente (navegación, creación, edición, eliminación y listado de ejercicios y categorías) al mejorar su presentación.
- **FR-015**: El sistema DEBE cumplir el nivel de accesibilidad WCAG 2.1 AA en todas las pantallas rediseñadas: contraste de color suficiente entre texto y fondo, indicador de foco visible en todos los controles interactivos, y posibilidad de completar cualquier flujo (navegar, crear, editar, eliminar) usando únicamente el teclado.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un usuario que abre cualquier pantalla de la aplicación puede identificar la acción principal disponible en menos de 3 segundos.
- **SC-002**: El 100% de las pantallas muestra su información y acciones principales sin necesidad de desplazamiento en los tamaños de pantalla habituales de escritorio (1366×768), tablet (768–1024 px de ancho) y móvil (375×812).
- **SC-003**: En una revisión de usabilidad, la calidad visual percibida de la aplicación se valora igual o mejor que la de herramientas de productividad profesionales de referencia.
- **SC-004** *(objetivo orientativo, no bloqueante)*: Se aspira a que los usuarios completen el alta de un nuevo ejercicio con un 50% menos de errores de validación en el primer intento de envío, gracias a la indicación previa de campos obligatorios. Al no existir telemetría en la aplicación (solo almacenamiento local, sin backend), esta cifra no se mide ni se verifica formalmente; la aceptación de la mejora del formulario se basa en los criterios verificables SC-001 y SC-007 y en el requisito FR-007 (campos obligatorios indicados antes del envío).
- **SC-005**: Todas las pantallas permanecen utilizables (sin elementos solapados ni desplazamiento horizontal) en los tres rangos de ancho de pantalla: móvil (hasta 599 px), tablet (768–1024 px) y escritorio (1280 px o más).
- **SC-006**: Las pruebas automatizadas existentes sobre navegación y operaciones de creación, edición y eliminación siguen pasando tras aplicar la nueva presentación, sin regresiones funcionales.
- **SC-007**: Un usuario puede completar los flujos principales (crear un ejercicio, gestionar categorías, moverse entre secciones del menú) usando únicamente el teclado, con el elemento con foco siempre visible en pantalla.

## Assumptions

- El comportamiento funcional de las funciones ya implementadas (biblioteca de ejercicios, formulario de ejercicio, gestión de categorías, navegación del shell) no cambia; esta funcionalidad solo modifica su presentación visual.
- Las secciones todavía no implementadas ("Hoy", "Buscar", "Planificación", "Sincronización") reciben el mismo tratamiento visual que el resto de la aplicación mediante una pantalla de "próximamente" cuidada, sin implementar su funcionalidad real en esta iniciativa.
- Las decisiones de estilo (colores, tipografía, espaciado, densidad) se basan en las directrices ya definidas para el proyecto (estilo SaaS empresarial moderno, sistema de espaciado de 8px, mobile-first, principios de Material Design) como única fuente de referencia.
- Se mantiene el tema claro como único tema visual; no se introduce modo oscuro en esta iniciativa.
- No se introducen nuevos roles de usuario ni cambios de permisos como parte de esta mejora de presentación.
- Los textos e idioma (español) de la interfaz se mantienen; solo se revisa su redacción cuando sea necesario para mejorar la claridad, sin cambiar su significado.
