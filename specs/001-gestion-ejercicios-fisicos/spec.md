# Feature Specification: Gestión de Ejercicios Físicos y Planificación Semanal











**Feature Branch**: `001-gestion-ejercicios-fisicos`

**Created**: 2026-10-14

**Status**: Draft

**Input**: User description: "Especificación: PhysicalExcercises v1 — aplicación para centralizar ejercicios físicos de rehabilitación, prevención o entrenamiento dispersos en vídeos, imágenes y enlaces, organizarlos por categorías y asociarlos a una planificación semanal consultable desde ordenador o móvil."

## Decisiones de producto

- Una planificación concreta está activa automáticamente cuando la semana actual (de lunes a domingo) cae dentro de su semana; no existe activación manual.
- La sincronización con GitHub requiere que el usuario introduzca un token fine-grained limitado a un único repositorio privado de datos, con permisos de lectura y escritura de contenidos. El token se muestra oculto, no se incluye en los datos sincronizados y puede eliminarse mediante la acción "Olvidar token". Se acepta guardarlo sin cifrar en el almacenamiento local del navegador.
- El repositorio privado de datos es distinto del repositorio público que aloja la aplicación.
- Si solo hay cambios locales, se suben; si solo hay cambios remotos, se descargan. Si ambos lados han cambiado, el usuario elige qué copia completa conservar. En la primera sincronización con datos remotos, se ofrece esa elección con "Usar los datos de GitHub" seleccionado por defecto.
- Al eliminar una categoría, se retira de los ejercicios asociados; los que se queden sin categoría reciben "Sin categoría". Esta categoría genérica no se puede eliminar.
- Las imágenes locales se sincronizan como archivos independientes y no pueden superar los 5 MB cada una.
- El catálogo de fábrica definido en [catalogo-predefinido.json](./catalogo-predefinido.json) contiene 7 categorías y 23 ejercicios. Sus ejercicios y categorías se pueden modificar o eliminar como los creados por el usuario. Las series y repeticiones recomendadas se guardan en las observaciones.
- La accesibilidad de las pantallas debe cumplir WCAG 2.1 AA en contraste, foco visible y uso mediante teclado. Los anchos de referencia son móvil hasta 599 px, tablet de 768 a 1024 px y escritorio desde 1280 px; los anchos intermedios también deben seguir siendo utilizables.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Gestionar la biblioteca personal de ejercicios (Priority: P1)

Como usuario quiero crear, modificar y organizar por categorías mis ejercicios físicos (nombre, descripción, enlaces, vídeos, imágenes y observaciones) para dejar de depender de vídeos de YouTube sueltos, imágenes y enlaces dispersos en distintas fuentes.

**Why this priority**: Es la base de todo el sistema: sin una biblioteca de ejercicios organizada por categorías no es posible planificar nada. Por sí sola ya aporta valor, porque sustituye el actual "cajón desastre" de enlaces y notas sueltas por un único lugar centralizado y consultable. Además, al incluir un catálogo de ejercicios predefinidos desde el primer uso, aporta valor inmediato también al usuario principiante, que puede empezar a consultar y planificar sin tener que crear ningún ejercicio manualmente.

**Independent Test**: Puede probarse completamente creando una categoría, dando de alta varios ejercicios asociados a ella con sus datos (nombre, descripción, enlaces, imágenes), editando uno de ellos y comprobando que los cambios se conservan, sin necesidad de que exista todavía ninguna planificación.

**Acceptance Scenarios**:

1. **Given** que no existe ninguna categoría todavía, **When** el usuario crea una categoría indicando un nombre, **Then** la categoría queda disponible inmediatamente para asociarla a nuevos ejercicios.
2. **Given** que existe al menos una categoría, **When** el usuario crea un ejercicio indicando nombre, descripción y categoría, **Then** el ejercicio se guarda correctamente y aparece disponible para su consulta.
3. **Given** un ejercicio ya creado, **When** el usuario modifica cualquiera de sus datos (nombre, descripción, categoría, enlaces, imágenes u observaciones), **Then** los cambios quedan reflejados al volver a consultar el ejercicio.
4. **Given** que el usuario intenta crear una categoría con un nombre ya existente, **When** confirma la creación, **Then** el sistema rechaza la operación e informa de que el nombre ya está en uso.
5. **Given** una categoría con ejercicios asociados, **When** el usuario la elimina, **Then** la categoría desaparece y se retira de todos los ejercicios que la tenían asignada, los cuales conservan sus demás categorías o pasan a la categoría genérica "Sin categoría" si no les queda ninguna.
6. **Given** un ejercicio al que se le añade un enlace con formato no válido, **When** el usuario intenta guardarlo, **Then** el sistema rechaza el enlace e indica que el formato no es correcto.
7. **Given** una instalación nueva de la aplicación sin ejercicios creados todavía por el usuario, **When** el usuario principiante abre la biblioteca de ejercicios, **Then** encuentra disponible un catálogo de ejercicios predefinidos, listos para consultar y planificar sin necesidad de crearlos manualmente.
8. **Given** que el usuario abre la biblioteca con muchos ejercicios, **When** recorre el listado, **Then** cada ejercicio se distingue visualmente, su nombre y descripción se leen sin desplazamiento horizontal y la lista admite desplazamiento vertical.
9. **Given** que los ejercicios o categorías se están cargando, **When** el usuario abre la pantalla correspondiente, **Then** ve un indicador de carga y no una pantalla vacía sin explicación.
10. **Given** que el usuario modifica una categoría, **When** guarda los cambios, **Then** ve la categoría actualizada y una confirmación visible; si la operación falla, ve un mensaje de error asociado al contexto de la operación.
11. **Given** que el usuario crea o edita un ejercicio, **When** abre el formulario, **Then** distingue los bloques de datos básicos, categorías, enlaces, imágenes y observaciones.
12. **Given** que el usuario consulta el formulario de ejercicio, **When** todavía no ha intentado guardarlo, **Then** identifica los campos obligatorios; si un valor no es válido, el mensaje aparece junto al campo afectado y este queda resaltado.
13. **Given** que el usuario guarda o elimina un ejercicio o una categoría, **When** la operación termina correctamente o falla, **Then** recibe una confirmación o un error visible cerca del contexto de la operación.
14. **Given** que el usuario añade enlaces o imágenes a un ejercicio, **When** revisa los elementos añadidos, **Then** cada uno aparece ordenado y dispone de una acción claramente identificable para quitarlo.

---

### User Story 2 - Buscar y consultar ejercicios (Priority: P2)

Como usuario quiero buscar ejercicios por categoría o por texto, y visualizar sus vídeos e información sin salir de la aplicación, para localizar rápidamente lo que necesito sin recordar de memoria cada ejercicio ni abrir enlaces externos por separado.

**Why this priority**: Una vez existe la biblioteca de ejercicios (User Story 1), la capacidad de encontrarlos y consultarlos cómodamente es el siguiente valor más importante: evita la "consulta manual de múltiples fuentes externas" mencionada como objetivo principal del producto.

**Independent Test**: Puede probarse de forma independiente creando previamente varios ejercicios en distintas categorías y comprobando que las búsquedas por categoría y por texto devuelven los resultados correctos, y que al abrir un ejercicio con vídeo se visualiza el reproductor integrado sin salir de la aplicación.

**Acceptance Scenarios**:

1. **Given** varios ejercicios repartidos en distintas categorías, **When** el usuario selecciona una categoría, **Then** se muestran únicamente los ejercicios asociados a esa categoría.
2. **Given** varios ejercicios con distintos nombres, **When** el usuario escribe parte del nombre de uno de ellos en el buscador, **Then** el ejercicio aparece entre los resultados.
3. **Given** un ejercicio con un enlace de vídeo de YouTube válido, **When** el usuario abre la ficha del ejercicio, **Then** el vídeo se visualiza integrado en la propia aplicación.
4. **Given** una categoría sin ejercicios asociados, **When** el usuario la selecciona, **Then** se muestra una lista vacía con un mensaje indicándolo.
5. **Given** que no existe ningún ejercicio registrado todavía, **When** el usuario accede a la búsqueda, **Then** se muestra un mensaje indicando que no hay ejercicios.
6. **Given** que una búsqueda no devuelve resultados, **When** el usuario consulta la lista, **Then** ve un estado vacío claro que indica que puede cambiar los criterios de búsqueda.
7. **Given** que el usuario abre la búsqueda o la ficha de un ejercicio, **When** se muestra la pantalla, **Then** identifica su título y acción principal sin tener que desplazarse para encontrarlos.

---

### User Story 3 - Planificar la semana de ejercicios (Priority: P3)

Como usuario quiero crear planificaciones semanales (concretas o como plantillas reutilizables), asociar ejercicios a los días de la semana y consultar fácilmente qué debo hacer hoy o en cualquier día de la semana, para dejar de tener que recordar u organizar manualmente mi rutina.

**Why this priority**: Es el objetivo de negocio central del producto ("consultar fácilmente qué debe hacer cada día"), pero depende de que ya existan ejercicios y categorías (User Stories 1 y 2) para poder planificarlos.

**Independent Test**: Puede probarse de forma independiente creando una planificación semanal, asociando ejercicios existentes a distintos días, duplicando dicha planificación para generar una nueva, y comprobando que al abrir la aplicación se muestra la planificación del día actual y que se puede consultar cualquier otro día o la semana completa.

**Acceptance Scenarios**:

1. **Given** una planificación semanal con ejercicios asociados a varios días, **When** el usuario la consulta, **Then** se muestran claramente los ejercicios correspondientes a cada día.
2. **Given** que existe una planificación para el día actual, **When** el usuario abre la aplicación, **Then** se visualiza en primer lugar la planificación de hoy.
3. **Given** que no existe planificación para el día actual, **When** el usuario abre la aplicación, **Then** se muestra un mensaje indicando que no hay ejercicios programados para hoy.
4. **Given** una planificación o plantilla ya existente, **When** el usuario la duplica, **Then** se crea una nueva planificación con los mismos ejercicios y días, lista para modificarse de forma independiente.
5. **Given** una plantilla de planificación sin fecha asociada, **When** el usuario la utiliza para crear una planificación semanal concreta, **Then** la nueva planificación conserva los ejercicios y días de la plantilla y queda asociada a una semana real.
6. **Given** un ejercicio ya asociado a un día de una planificación, **When** el usuario intenta añadir ese mismo ejercicio otra vez al mismo día de la misma planificación, **Then** el sistema impide la duplicación.
7. **Given** que ya existe una planificación activa (no plantilla) para la semana en curso, **When** el usuario intenta crear otra planificación activa para esa misma semana, **Then** el sistema lo impide.
8. **Given** un ejercicio asociado a varias planificaciones distintas, **When** el usuario consulta cada una de esas planificaciones, **Then** el ejercicio aparece correctamente en todas ellas.
9. **Given** una planificación concreta, **When** el usuario solicita ver todos los ejercicios que contiene, **Then** se muestra el listado completo de ejercicios de esa planificación, independientemente del día al que estén asociados.
10. **Given** que el usuario abre una vista de planificación, **When** consulta sus contenidos, **Then** identifica el título, la acción principal y el día activo sin desplazamiento horizontal.
11. **Given** que la planificación de hoy contiene uno o varios ejercicios, **When** el usuario activa el acceso a uno de ellos, **Then** el sistema muestra la ficha del ejercicio seleccionado con toda su información disponible.

---

### User Story 4 - Marcar el progreso diario (Priority: P4)

Como usuario quiero marcar cada ejercicio planificado como realizado para llevar un seguimiento de mi progreso del día.

**Why this priority**: Aporta valor motivacional y de seguimiento, pero solo tiene sentido una vez existe una planificación consultable (User Story 3); por eso se prioriza después.

**Independent Test**: Puede probarse de forma independiente marcando como realizados los ejercicios planificados para un día concreto y comprobando que el indicador de progreso del día refleja el porcentaje completado.

**Acceptance Scenarios**:

1. **Given** un ejercicio planificado para hoy, **When** el usuario lo marca como realizado, **Then** su estado cambia y queda reflejado al volver a consultar el día.
2. **Given** que el usuario marca todos los ejercicios del día como realizados, **When** consulta el indicador de progreso, **Then** se muestra el 100% de progreso para ese día.
3. **Given** un día con varios ejercicios planificados y solo algunos marcados como realizados, **When** el usuario consulta el progreso, **Then** se muestra el porcentaje correspondiente a los ejercicios completados sobre el total planificado.
4. **Given** que el usuario consulta el progreso diario, **When** abre esa vista, **Then** identifica el título y el porcentaje de progreso con una presentación legible en móvil y escritorio.

---

### User Story 5 - Conservar y sincronizar la información (Priority: P5)

Como usuario quiero que toda mi información (ejercicios, categorías, planificaciones y progreso) se conserve entre sesiones y pueda sincronizarse con GitHub, para no perder mis datos y poder acceder a ellos desde distintos dispositivos.

**Why this priority**: Es una capacidad transversal de conservación y respaldo de los datos creados en las historias anteriores; sin las historias anteriores no habría datos que conservar ni sincronizar, por lo que se prioriza en último lugar aunque es imprescindible para el uso continuado de la aplicación.

**Independent Test**: Puede probarse de forma independiente creando o modificando datos, cerrando y volviendo a abrir la aplicación para comprobar que persisten, y sincronizando desde un navegador para después abrir la aplicación en otro navegador o dispositivo, sincronizar con el mismo token y repositorio y comprobar en pantalla que aparecen los mismos datos.

**Acceptance Scenarios**:

1. **Given** que el usuario ha creado o modificado información, **When** cierra y vuelve a abrir la aplicación, **Then** todos los datos introducidos siguen disponibles.
2. **Given** datos creados y sincronizados con GitHub desde el navegador A, **When** el usuario abre la aplicación en otro navegador o dispositivo B, configura el mismo token y repositorio y sincroniza, **Then** ve en B todos los datos creados en A.
3. **Given** que GitHub no está disponible durante una sincronización, **When** el usuario intenta sincronizar, **Then** los datos permanecen almacenados localmente sin pérdida y el sistema informa del error.
4. **Given** un ejercicio asociado a varias planificaciones, **When** el usuario lo elimina, **Then** desaparece de todas las planificaciones en las que estaba incluido, tanto localmente como en la siguiente sincronización.
5. **Given** que desde la última sincronización ha habido cambios tanto en este dispositivo como en GitHub (por ejemplo, el mismo ejercicio editado en dos navegadores distintos sin sincronizar entre medias), **When** el usuario ejecuta una sincronización, **Then** el sistema le informa del conflicto y le permite elegir explícitamente si conserva todos los datos locales o todos los datos remotos antes de completar la sincronización.
6. **Given** un dispositivo nuevo que nunca se ha sincronizado y un repositorio de GitHub que ya contiene datos, **When** el usuario sincroniza por primera vez, **Then** el sistema no sobrescribe los datos de GitHub, sino que le muestra la elección entre datos locales y remotos con la opción "Usar los datos de GitHub" marcada por defecto.
7. **Given** que solo ha habido cambios en GitHub desde la última sincronización (ninguno en este dispositivo), **When** el usuario sincroniza, **Then** el sistema descarga y aplica los datos remotos sin mostrar ningún conflicto.
8. **Given** que el usuario guarda la configuración o resuelve un conflicto, **When** la operación termina o falla, **Then** recibe una confirmación o un error visible y comprensible sin perder los datos locales.

---

### User Story 6 - Usar una aplicación clara, coherente y accesible (Priority: P1)

Como usuario quiero reconocer rápidamente dónde estoy, encontrar las acciones principales y completar los flujos en cualquier dispositivo, para gestionar mis ejercicios con comodidad y sin depender del ratón.

**Why this priority**: La presentación y accesibilidad son transversales a la biblioteca, búsqueda, planificación, progreso y sincronización, y deben mantenerse coherentes en todas las funciones disponibles.

**Independent Test**: Recorrer las pantallas funcionales y completar los flujos principales en móvil, tablet y escritorio, comprobando títulos, acciones, navegación, estados, foco y uso exclusivo del teclado.

**Acceptance Scenarios**:

1. **Given** que el usuario abre cualquier pantalla funcional, **When** se muestra la pantalla, **Then** ve una cabecera con el título y, cuando existan, las acciones principales sin tener que desplazarse para encontrarlas.
2. **Given** que el usuario usa la aplicación en un móvil de hasta 599 px, **When** abre el menú, **Then** este aparece como una superposición que no comprime el contenido y se cierra al elegir una sección.
3. **Given** que el usuario cambia de sección, **When** la nueva pantalla se carga, **Then** la sección activa queda identificada visualmente en el menú.
4. **Given** que el usuario navega con teclado, **When** recorre los controles y completa las tareas principales, **Then** puede alcanzarlos en un orden lógico y el foco permanece visible.
5. **Given** que el usuario consulta una pantalla en móvil, tablet, escritorio o un ancho intermedio, **When** cambia el tamaño de la ventana, **Then** el contenido sigue siendo legible y utilizable sin solapamientos ni desplazamiento horizontal.
6. **Given** que la interfaz muestra texto o controles, **When** se comprueban el contraste y el foco, **Then** el contraste es de al menos 4,5:1 para texto normal y 3:1 para texto grande e iconos funcionales, y todos los controles tienen un indicador de foco visible.

---

### Edge Cases

- ¿Qué ocurre cuando no existe ningún ejercicio registrado? Se muestra un mensaje indicando que no hay ejercicios (en lugar de una lista vacía sin explicación).
- ¿Qué ocurre cuando no existe planificación para el día actual? Se muestra un mensaje indicando que no hay ejercicios programados para hoy.
- ¿Qué ocurre cuando una categoría buscada no contiene ejercicios? Se muestra una lista vacía con mensaje indicativo, no un error.
- ¿Qué ocurre cuando GitHub no está disponible durante una sincronización? Los datos permanecen localmente y el sistema informa del error, sin pérdida de información.
- ¿Qué ocurre cuando un vídeo de YouTube asociado a un ejercicio deja de existir? El ejercicio se sigue mostrando con el resto de su información, indicando que el vídeo no está disponible.
- ¿Qué ocurre si el usuario intenta crear una categoría con un nombre ya existente? Se rechaza la operación e informa del motivo.
- ¿Qué ocurre si el usuario elimina una categoría que tiene ejercicios asociados? La categoría se elimina y se retira de todos los ejercicios asociados; si algún ejercicio se queda sin ninguna categoría, se le asigna automáticamente la categoría genérica "Sin categoría".
- ¿Qué ocurre si el usuario intenta eliminar la categoría genérica "Sin categoría"? El sistema lo impide, ya que es una categoría de fábrica no eliminable.
- ¿Qué ocurre si el usuario intenta añadir el mismo ejercicio dos veces al mismo día de la misma planificación? Se impide la duplicación.
- ¿Qué ocurre si el usuario intenta tener dos planificaciones activas (no plantilla) en la misma semana? Se impide la creación de la segunda.
- ¿Qué ocurre cuando ha habido cambios tanto locales como en GitHub desde la última sincronización? Se informa al usuario del conflicto y se le pide elegir si conserva la versión local completa o la remota completa antes de completar la sincronización.
- ¿Qué ocurre en la primera sincronización de un dispositivo nuevo si GitHub ya contiene datos? No se sobrescriben; se muestra la elección entre datos locales y remotos, con "Usar los datos de GitHub" marcada por defecto.
- ¿Qué ocurre si el usuario intenta añadir una imagen de archivo de más de 5 MB? Se rechaza con un mensaje que indica el tamaño máximo permitido.
- ¿Qué ocurre si el nombre o la descripción de un ejercicio es muy largo? Se ajusta o trunca sin romper la tarjeta ni provocar desplazamiento horizontal.
- ¿Qué ocurre si el formulario tiene muchas categorías? Las opciones se reorganizan sin desbordar el contenedor.
- ¿Qué ocurre si una imagen no carga o su URL no es válida? Se indica el problema sin impedir que se use el resto del formulario.
- ¿Qué ocurre si falla una operación de guardado o eliminación? Se informa con claridad junto al campo o elemento afectado, además de la confirmación visual cuando la operación tiene éxito.
- ¿Qué ocurre si el listado contiene muchos ejercicios? Se puede recorrer con desplazamiento vertical sin perder legibilidad; no se exige mostrar todo el listado de una vez.
- ¿Qué ocurre en pantallas de menos de 360 px? Los controles y formularios siguen siendo utilizables, sin solapamientos ni texto cortado.
- ¿Qué ocurre en los anchos intermedios no incluidos en los rangos de referencia? El diseño se adapta de forma fluida y permanece utilizable.
- ¿Qué ocurre al abrir el menú en móvil? Se superpone al contenido a ancho completo, sin comprimirlo, y se cierra después de seleccionar una sección.
- ¿Qué ocurre si el usuario completa un flujo solo con teclado? Todos los controles son alcanzables con foco visible y sin depender únicamente de acciones con ratón o pantalla táctil.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Al abrir la aplicación, el sistema DEBE cargar automáticamente toda la información almacenada del usuario.
- **FR-002**: El sistema DEBE permitir al usuario sincronizar, mediante una acción explícita, la información almacenada con un repositorio de GitHub, autenticándose mediante un token de acceso personal (PAT) de GitHub que el propio usuario genera en GitHub e introduce manualmente en la aplicación.
- **FR-003**: El sistema DEBE mostrar un calendario semanal con indicación visual de los días que contienen ejercicios planificados.
- **FR-004**: El sistema DEBE permitir crear, modificar y eliminar ejercicios.
- **FR-005**: Todo ejercicio DEBE tener obligatoriamente un nombre y una descripción; no podrá guardarse sin ambos datos.
- **FR-006**: Todo ejercicio DEBE estar asociado al menos a una categoría; un mismo ejercicio podrá pertenecer a varias categorías.
- **FR-007**: El sistema DEBE validar que cualquier enlace (web o de YouTube) introducido en un ejercicio tenga un formato de URL válido antes de guardarlo, rechazándolo en caso contrario.
- **FR-008**: Al iniciar la aplicación, el sistema DEBE mostrar prioritariamente la planificación correspondiente al día actual.
- **FR-009**: El sistema DEBE permitir crear, modificar y eliminar categorías de ejercicios.
- **FR-010**: El sistema DEBE impedir la existencia de dos categorías con el mismo nombre.
- **FR-011**: El sistema DEBE permitir eliminar una categoría aunque tenga ejercicios asociados. Al eliminarla, DEBE retirar esa categoría de todos los ejercicios que la tuvieran asignada; si algún ejercicio se queda sin ninguna categoría tras la eliminación, el sistema DEBE asignarle automáticamente la categoría genérica por defecto "Sin categoría". La categoría "Sin categoría" en sí misma no podrá eliminarse.
- **FR-012**: El sistema DEBE permitir buscar ejercicios filtrando por una o varias categorías.
- **FR-013**: El sistema DEBE permitir buscar ejercicios mediante texto libre sobre su nombre o descripción.
- **FR-014**: Cada ejercicio DEBE poder almacenar: nombre, descripción, una o varias categorías, enlaces web, enlaces de YouTube, imágenes y observaciones opcionales.
- **FR-015**: El sistema DEBE mostrar una previsualización integrada (reproductor embebido) de los vídeos de YouTube asociados a un ejercicio, siempre que el vídeo esté disponible.
- **FR-016**: El sistema DEBE permitir visualizar enlaces web externos dentro de la propia aplicación, siempre que el sitio de destino lo permita.
- **FR-017**: El sistema DEBE permitir crear planificaciones semanales con una fecha de inicio asociada, que siempre corresponde a un lunes; no pueden existir dos planificaciones concretas con la misma fecha de inicio.
- **FR-018**: El sistema DEBE permitir crear plantillas de planificación reutilizables, sin fecha de inicio asociada.
- **FR-019**: El sistema DEBE permitir duplicar cualquier planificación o plantilla existente para crear una nueva a partir de ella, conservando sus ejercicios y días asociados.
- **FR-020**: Un mismo ejercicio DEBE poder asociarse a varias planificaciones distintas, y a varios días de la semana dentro de una misma planificación.
- **FR-021**: El sistema DEBE impedir que un mismo ejercicio aparezca más de una vez en el mismo día de la misma planificación.
- **FR-022**: El sistema DEBE impedir que exista más de una planificación activa (no plantilla) para la misma semana. Una planificación se considera "activa" automáticamente cuando la semana actual (lunes a domingo) cae dentro de su rango de fechas; no requiere ninguna acción manual de activación por parte del usuario.
- **FR-023**: El sistema DEBE permitir visualizar todos los ejercicios pertenecientes a una planificación concreta, con independencia del día al que estén asociados.
- **FR-024**: El sistema DEBE permitir marcar cada ejercicio planificado para un día como realizado o no realizado.
- **FR-025**: El sistema DEBE calcular y mostrar el porcentaje de ejercicios marcados como realizados para el día actual.
- **FR-026**: El sistema DEBE funcionar correctamente en móviles (hasta 599 px), tablets (768–1024 px), escritorio (1280 px o más) y en los anchos intermedios; DEBE adaptar la disposición sin solapamientos ni desplazamiento horizontal. En móvil, las pantallas DEBEN priorizar una sola columna y los controles principales DEBEN tener un tamaño cómodo para la interacción táctil, con un área mínima de 48 × 48 px.
- **FR-027**: El sistema DEBE conservar toda la información del usuario entre sesiones, incluso sin haberse sincronizado con GitHub.
- **FR-028**: Cuando se elimine un ejercicio asociado a varias planificaciones, el sistema DEBE eliminarlo de todas ellas.
- **FR-029**: Si no existe ningún ejercicio registrado, el sistema DEBE mostrar un estado vacío visualmente distinguible, con un mensaje que lo indique y oriente sobre cómo empezar, en lugar de una lista vacía sin explicación.
- **FR-030**: Si no existe planificación para el día actual, el sistema DEBE mostrar un estado vacío con un mensaje que indique que no hay ejercicios programados para hoy.
- **FR-031**: Si una categoría consultada o una búsqueda no contiene ejercicios, el sistema DEBE mostrar un estado vacío con un mensaje indicativo y, cuando corresponda, orientación para cambiar los criterios; no DEBE presentarlo como un error.
- **FR-032**: Si la sincronización con GitHub falla por no disponibilidad del servicio, el sistema DEBE conservar los datos localmente e informar al usuario del error, sin pérdida de información.
- **FR-033**: Si un vídeo de YouTube asociado a un ejercicio deja de estar disponible, el sistema DEBE seguir mostrando el ejercicio e indicar que el vídeo no está disponible.
- **FR-034**: El sistema DEBE incluir, desde el primer uso, un catálogo de ejercicios predefinidos (contenido de fábrica) ya cargado en la aplicación, para que el usuario principiante pueda consultarlos y planificarlos sin necesidad de crearlos manualmente. El contenido del catálogo es el definido en el anexo [catalogo-predefinido.json](./catalogo-predefinido.json): 7 categorías (Abdomen, Cadera, Cervicales, Glúteo, Isquiotibiales, Lumbar y Rodilla) y 23 ejercicios de fortalecimiento y rehabilitación. Los ejercicios y las categorías predefinidos se comportan como cualquier otro: el usuario puede modificarlos o eliminarlos igual que los creados por él mismo.
- **FR-035**: Al sincronizar, el sistema DEBE actuar según dónde haya habido cambios desde la última sincronización: si solo hay cambios locales, los sube a GitHub; si solo hay cambios en GitHub, descarga y aplica los datos remotos; si hay cambios en ambos lados, DEBE detener la sincronización, informar al usuario del conflicto y permitirle elegir explícitamente si conserva todos los datos locales o todos los datos remotos. En la primera sincronización de un dispositivo, si GitHub ya contiene datos, el sistema DEBE tratarlo como conflicto (sin sobrescribir los datos remotos) y proponer por defecto "Usar los datos de GitHub".
- **FR-036**: El sistema DEBE permitir añadir imágenes a un ejercicio tanto mediante una URL externa como mediante la subida de un archivo de imagen local, soportando ambos mecanismos de forma indistinta. Cada imagen subida como archivo NO DEBE superar los 5 MB; si los supera, se rechaza con un mensaje que indica el tamaño máximo. Las imágenes subidas como archivo DEBEN sincronizarse con GitHub junto con el resto de datos.
- **FR-037**: El token de acceso de GitHub DEBE mostrarse oculto en pantalla, NUNCA DEBE incluirse en los datos sincronizados con GitHub, y el usuario DEBE poder borrarlo de la aplicación mediante una acción "Olvidar token". La pantalla de configuración DEBE indicar al usuario que cree un token de tipo *fine-grained* limitado a un único repositorio y con permiso de lectura y escritura de contenidos. Los datos DEBEN sincronizarse con un repositorio **privado** dedicado solo a datos (por ejemplo, `data-physical-exercises`), distinto del repositorio público donde se publica la aplicación, y el token DEBE limitarse a ese repositorio de datos; la pantalla de configuración DEBE indicarlo así.
- **FR-038**: Cada pantalla funcional DEBE mostrar una cabecera con el título de la sección y, cuando existan, sus acciones principales, visibles sin tener que desplazarse para encontrarlas.
- **FR-039**: El listado de ejercicios DEBE presentar cada ejercicio como un elemento visualmente diferenciado, con nombre y descripción legibles de un vistazo y sin desplazamiento horizontal. Los nombres o descripciones largos DEBEN ajustarse o truncarse sin romper el diseño; los listados largos DEBEN poder recorrerse verticalmente.
- **FR-040**: Mientras se cargan ejercicios o categorías, el sistema DEBE mostrar un indicador visual de carga coherente con el resto de la aplicación.
- **FR-041**: El formulario de ejercicio DEBE distinguir visualmente los bloques de datos básicos, categorías, enlaces, imágenes y observaciones; DEBE indicar los campos obligatorios antes del envío y mostrar los errores junto al campo afectado, resaltándolo.
- **FR-042**: Al crear, editar o eliminar ejercicios o categorías, el sistema DEBE comunicar el éxito o el error de forma visible y comprensible, cerca del contexto de la operación.
- **FR-043**: Las acciones principales de cada pantalla DEBEN poder alcanzarse en un único clic o toque desde el contexto correspondiente, sin pasos de navegación innecesarios.
- **FR-044**: Todas las pantallas DEBEN mantener un estilo visual coherente y profesional en espaciado, tipografía y color, basado en una escala de espaciado de 8 px y principios de diseño Material.
- **FR-045**: Todas las pantallas DEBEN cumplir los aspectos de accesibilidad acordados de WCAG 2.1 AA: contraste mínimo de 4,5:1 para texto normal y 3:1 para texto grande e iconos funcionales, foco visible en cada control interactivo y posibilidad de completar todos los flujos principales solo con teclado.
- **FR-046**: La aplicación DEBE conservar el comportamiento funcional de navegación, creación, edición, eliminación, consulta, planificación, seguimiento del progreso y sincronización definido en esta especificación al aplicar las mejoras de presentación.
- **FR-047**: En móvil, el menú de navegación DEBE abrirse como una superposición de ancho completo que no comprima el contenido principal y DEBE cerrarse automáticamente cuando el usuario elija una sección.
- **FR-048**: Desde la planificación correspondiente al día actual, el sistema DEBE permitir acceder directamente a la ficha de cada ejercicio planificado mediante una acción claramente identificable asociada al ejercicio. Esta acción DEBE ser independiente del control utilizado para marcar el ejercicio como realizado o no realizado, y DEBE poder activarse mediante teclado y mediante interacción táctil.


### Key Entities *(include if feature involves data)*

- **Ejercicio**: Actividad física concreta que el usuario puede realizar. Incluye nombre, descripción, una o varias categorías asociadas, enlaces web, enlaces de vídeo de YouTube, imágenes (mediante URL externa o archivo local) y observaciones opcionales. Puede asociarse a varios días de varias planificaciones distintas. Incluye tanto los ejercicios creados por el usuario como los del catálogo predefinido incorporado de fábrica.
- **Categoría**: Agrupación temática de ejercicios (por ejemplo, zona corporal como cuello, espalda, piernas, hombros o glúteos). Tiene un nombre único y una descripción opcional. Puede eliminarse aunque tenga ejercicios asociados: al hacerlo, se retira de dichos ejercicios, que conservan sus demás categorías o pasan a la categoría genérica "Sin categoría" si no les queda ninguna. Existe una única categoría no eliminable, "Sin categoría", que actúa como categoría de reserva. Las categorías del catálogo predefinido se crean de fábrica, pero se pueden modificar y eliminar como cualquier otra.
- **Planificación**: Conjunto de ejercicios organizados por día de la semana. Tiene un nombre y puede ser una planificación concreta (con fecha de inicio, asociada a una semana real) o una plantilla reutilizable (sin fecha, no se considera "activa"). Una planificación concreta se considera "activa" automáticamente cuando la semana actual cae dentro de su rango de fechas (de lunes a domingo); no requiere activación manual. Solo puede existir una planificación activa por semana.
- **Día de planificación**: Día concreto de la semana dentro de una planificación, con el listado de ejercicios asignados a ese día. Un mismo ejercicio no puede repetirse en el mismo día de la misma planificación.
- **Progreso diario**: Registro de si un ejercicio planificado para una fecha concreta ha sido marcado como realizado por el usuario. Sirve de base para calcular el porcentaje de cumplimiento del día.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un usuario puede dar de alta un ejercicio completo (nombre, descripción y categoría) en menos de 1 minuto.
- **SC-002**: Un usuario puede localizar un ejercicio conocido mediante la búsqueda por texto o categoría en menos de 10 segundos.
- **SC-003**: Al abrir la aplicación, el usuario visualiza la planificación de ejercicios del día actual de forma inmediata, sin necesidad de navegación adicional.
- **SC-004**: El usuario puede marcar como realizados todos los ejercicios planificados de un día y comprobar el 100% de progreso en menos de 1 minuto.
- **SC-005**: Tras cerrar y volver a abrir la aplicación, el 100% de la información introducida previamente (ejercicios, categorías, planificaciones y progreso) permanece disponible sin pérdidas.
- **SC-006**: Un usuario puede crear una planificación semanal reutilizando una plantilla o duplicando una planificación existente en menos de 2 minutos.
- **SC-007**: El usuario deja de necesitar consultar fuentes externas dispersas (vídeos, imágenes, notas, enlaces sueltos) para saber qué ejercicios realizar cada día, concentrando el 100% de esa información dentro de la aplicación.
- **SC-008**: Tras sincronizar en un dispositivo y después en otro con el mismo token y repositorio, el 100% de los datos del primer dispositivo (ejercicios, imágenes, categorías, planificaciones y progreso) se ve en el segundo.
- **SC-009**: Al abrir cualquier pantalla, un usuario identifica la acción principal disponible en menos de 3 segundos.
- **SC-010**: En las resoluciones de referencia de escritorio (1366×768), tablet (768–1024 px de ancho) y móvil (375×812), el título y las acciones principales de cada pantalla son visibles sin desplazamiento.
- **SC-011**: En móviles, tablets, escritorio y anchos intermedios, todas las pantallas se mantienen utilizables, sin solapamientos ni desplazamiento horizontal; esto también se cumple en pantallas de menos de 360 px.
- **SC-012**: Un usuario puede completar los flujos principales de creación, edición, eliminación y navegación solo con teclado, con el foco siempre visible.
- **SC-013**: Cada operación de creación, edición o eliminación muestra una confirmación visible cuando termina correctamente y un mensaje visible si falla.
- **SC-014**: Los flujos funcionales de biblioteca, búsqueda, planificación, progreso y sincronización conservan los resultados descritos en sus escenarios de aceptación tras aplicar las mejoras de presentación.
- **SC-015**: Desde la planificación de hoy, el usuario puede abrir la ficha de cualquier ejercicio planificado mediante una única acción, sin tener que buscarlo previamente en la biblioteca.

## Assumptions

- **Usuario único**: la aplicación gestiona los datos de un único usuario; no existen perfiles múltiples, inicio de sesión ni funciones de compartición entre usuarios en esta versión.
- **Disponibilidad sin conexión**: dado que la información se conserva localmente entre sesiones, el uso normal de la aplicación (consultar, crear y marcar ejercicios) no requiere conexión a Internet; solo la sincronización con GitHub la necesita.
- **Sincronización manual**: la sincronización con GitHub se ejecuta únicamente bajo una acción explícita del usuario, no de forma automática en segundo plano.
- **GitHub como único respaldo**: no se contempla ningún sistema de copia de seguridad adicional al repositorio de GitHub en esta versión.
- **Dos repositorios en GitHub**: el código de la aplicación vive en un repositorio público (requisito de GitHub Pages en cuentas gratuitas) desde el que se publica; los datos del usuario se sincronizan con un repositorio privado aparte (por ejemplo, `data-physical-exercises`), para que no sean públicos, para que sincronizar no dispare un despliegue y para que el token no tenga acceso al código.
- **Autenticación con GitHub mediante PAT**: el usuario se autentica introduciendo manualmente en la aplicación un token de acceso personal (PAT) generado por él mismo en GitHub; la aplicación no implementa un flujo OAuth ni requiere servidor intermediario para la autenticación. Se acepta que el token se guarde sin cifrar en el almacenamiento local del navegador, dado que la aplicación tiene un único usuario y no dispone de servidor propio.
- **Orden de categorías**: las categorías se muestran ordenadas alfabéticamente; no se contempla un orden personalizado por el usuario en esta versión.
- **Categoría genérica no eliminable**: existe una única categoría no eliminable, "Sin categoría", que actúa como categoría de reserva para los ejercicios que se quedan sin categoría al borrarse la suya. Las 7 categorías del catálogo predefinido se crean de fábrica, pero se comportan como las creadas por el usuario: se pueden modificar y eliminar aunque tengan ejercicios asociados.
- **Series y repeticiones del catálogo**: las series y repeticiones recomendadas de los ejercicios predefinidos se incluyen como texto en sus observaciones; la aplicación no registra series ni repeticiones (fuera de alcance).
- **Sin límite explícito de enlaces o imágenes**: no se establece un número máximo de enlaces o imágenes por ejercicio en esta versión, más allá de los límites técnicos razonables.
- **Progreso diario conservado indefinidamente**: el registro de qué ejercicios se marcaron como realizados cada día se conserva sin fecha de caducidad, aunque esta versión no incluye informes ni estadísticas históricas avanzadas sobre dicho progreso.
- **Semana de referencia**: a efectos de la regla de "una única planificación activa por semana", la semana se considera de lunes a domingo.
- **Catálogo predefinido editable**: el catálogo de ejercicios predefinidos de fábrica no es de solo lectura; el usuario puede modificarlo o eliminarlo igual que cualquier ejercicio propio.
- **Experiencia visual**: se mantiene un único tema claro, una presentación coherente basada en una escala de espaciado de 8 px y los principios de Material, y el idioma de interfaz sigue siendo español de España.
- **Pantallas funcionales**: las vistas de hoy, búsqueda, planificación y sincronización forman parte de las funciones disponibles; sus requisitos de presentación se aplican a esas pantallas funcionales, no a placeholders.
- **Objetivo orientativo de validación**: se aspira a reducir los errores de validación en el primer intento de alta de ejercicios, pero no se fija un porcentaje como criterio de aceptación porque no existe telemetría para medirlo.
- **Fuera de alcance en esta versión** (según el documento de origen): gestión de múltiples usuarios, compartición de ejercicios entre usuarios, autenticación mediante redes sociales, estadísticas avanzadas de entrenamiento, recordatorios por correo electrónico, notificaciones push, recomendación de ejercicios mediante inteligencia artificial, integración con relojes inteligentes, registro de peso/repeticiones/series, modo offline con sincronización automática avanzada, gestión de lesiones o diagnósticos médicos, seguimiento histórico detallado de rendimiento, impresión de fichas de ejercicio o de planificaciones, observaciones diarias dentro de una planificación, marcado de ejercicios como favoritos, y exportación a formatos como PDF o Excel (la exportación/importación de datos se cubre mediante la sincronización en JSON contra GitHub).
