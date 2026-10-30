# Feature Specification: Gestión de Ejercicios Físicos y Planificación Semanal






**Feature Branch**: `001-gestion-ejercicios-fisicos`

**Created**: 2026-10-14

**Status**: Draft

**Input**: Enmienda de la especificación vigente a partir de la propuesta de experiencia visual y flujos de pantalla de [pre-spec-diseño.md](../pre-spec-diseño.md), sin crear una feature independiente.

## Decisiones de producto

- Una planificación concreta está activa automáticamente cuando la semana actual (de lunes a domingo) cae dentro de su semana; no existe activación manual.
- La sincronización con GitHub requiere que el usuario introduzca un token fine-grained limitado a un único repositorio privado de datos, con permisos de lectura y escritura de contenidos. El token se muestra oculto, no se incluye en los datos sincronizados y puede eliminarse mediante la acción "Olvidar token". Se acepta guardarlo sin cifrar en el almacenamiento local del navegador.
- La capacidad de sincronización se amplía con Google y copia manual según [la especificación 002](../002-sincronizacion-google-drive/spec.md); esta especificación conserva sin cambios el comportamiento de GitHub. Conforme a FR-037, conectar Google no borra ni modifica el token de GitHub guardado.
- El repositorio privado de datos es distinto del repositorio público que aloja la aplicación.
- Si solo hay cambios locales, se suben; si solo hay cambios remotos, se descargan. Si ambos lados han cambiado, el usuario elige qué copia completa conservar. En la primera sincronización con datos remotos, se ofrece esa elección con "Usar los datos de GitHub" seleccionado por defecto.
- Todo ejercicio debe tener al menos una categoría. Al eliminar una categoría, la operación se rechaza si algún ejercicio asociado se quedaría sin categorías y se indican los ejercicios que hay que reasignar; si todos conservan otra categoría, se elimina normalmente. No existe una categoría genérica o de reserva.
- Las imágenes locales se sincronizan como archivos independientes y no pueden superar los 5 MB cada una.
- El catálogo de fábrica definido en [catalogo-predefinido.json](./catalogo-predefinido.json) contiene 7 categorías y 23 ejercicios. Sus ejercicios y categorías se pueden modificar o eliminar como los creados por el usuario. Las series y repeticiones recomendadas se guardan en las observaciones.
- La accesibilidad de las pantallas debe cumplir WCAG 2.1 AA en contraste, foco visible y uso mediante teclado. Los anchos de referencia son móvil hasta 599 px, tablet de 768 a 1024 px y escritorio desde 1280 px; los anchos intermedios también deben seguir siendo utilizables.
- La navegación se adapta al dispositivo: en móvil hay una barra inferior con "Hoy", "Planificación", "Buscar" y "Más"; en tablet hay un riel lateral; en escritorio hay un menú lateral agrupado por "Entrenar", "Biblioteca" y "Sistema". "Nuevo ejercicio" es un acceso directo destacado y "Gestionar categorías" y "Sincronización" se encuentran dentro de "Más" en móvil.
- No existe una pantalla ni una opción de navegación denominada "Mis ejercicios". La consulta del catálogo completo, así como la búsqueda y selección de ejercicios, se realiza desde la pantalla "Buscar".
- La interfaz mantiene un tema claro y una identidad visual cálida y profesional, con la paleta, tipografía, espaciado y componentes definidos en los requisitos de experiencia visual de esta especificación.
- Los ejercicios planificados se pueden marcar como realizados desde "Hoy" y, si están planificados para el día actual, desde su ficha. La persona puede deshacer una marca o eliminación mientras se muestra la notificación de confirmación.
- En móvil, la pantalla "Hoy" prioriza los ejercicios y el progreso del día; si no hay ejercicios para hoy, informa del descanso y presenta la próxima sesión cuando exista.

## Clarifications

### Session 2026-10-19

- Q: Al seleccionar un ejercicio en “Buscar”, ¿se considera satisfecho FR-053 si la ficha abierta desde ese resultado ofrece “Editar” y “Eliminar”, o deben estar esas acciones directamente en la lista? → A: Se accede a “Editar” y “Eliminar” desde la ficha abierta al seleccionar un resultado; no se añaden acciones directas en la lista.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Gestionar la biblioteca personal de ejercicios (Priority: P1)

Como usuario quiero crear, modificar y organizar por categorías mis ejercicios físicos (nombre, descripción, enlaces, vídeos, imágenes y observaciones) para dejar de depender de vídeos de YouTube sueltos, imágenes y enlaces dispersos en distintas fuentes.

**Why this priority**: Es la base de todo el sistema: sin una biblioteca de ejercicios organizada por categorías no es posible planificar nada. Por sí sola ya aporta valor, porque sustituye el actual "cajón desastre" de enlaces y notas sueltas por un único lugar centralizado y consultable. Además, al incluir un catálogo de ejercicios predefinidos desde el primer uso, aporta valor inmediato también al usuario principiante, que puede empezar a consultar y planificar sin tener que crear ningún ejercicio manualmente.

**Independent Test**: Puede probarse completamente accediendo desde el menú principal en "Gestionar categorías" para crear una categoría, accediendo desde el mismo menú a "Nuevo ejercicio" para dar de alta varios ejercicios asociados a ella y utilizando posteriormente la pantalla "Buscar" para consultarlos, editarlos, eliminarlos y comprobar que los cambios se conservan, sin necesidad de que exista todavía ninguna planificación.

**Acceptance Scenarios**:

1. **Given** que no existe ninguna categoría todavía, **When** el usuario crea una categoría indicando un nombre, **Then** la categoría queda disponible inmediatamente para asociarla a nuevos ejercicios.
2. **Given** que existe al menos una categoría, **When** el usuario crea un ejercicio indicando nombre, descripción y una o varias categorías, **Then** el ejercicio se guarda correctamente y aparece disponible para su consulta con todas las categorías seleccionadas.
3. **Given** un ejercicio ya creado, **When** el usuario modifica cualquiera de sus datos (nombre, descripción, una o varias categorías, enlaces, imágenes u observaciones), **Then** los cambios quedan reflejados al volver a consultar el ejercicio.
4. **Given** que el usuario intenta crear una categoría con un nombre ya existente, **When** confirma la creación, **Then** el sistema rechaza la operación e informa de que el nombre ya está en uso.
5. **Given** una categoría asociada a ejercicios, **When** el usuario intenta eliminarla, **Then** la operación se rechaza con los nombres de los ejercicios que solo tienen esa categoría; si todos los ejercicios asociados conservan otra categoría, la categoría se elimina y se retira de ellos.
6. **Given** un ejercicio al que se le añade un enlace con formato no válido, **When** el usuario intenta guardarlo, **Then** el sistema rechaza el enlace e indica que el formato no es correcto.
7. **Given** una instalación nueva de la aplicación sin ejercicios creados todavía por el usuario, **When** el usuario principiante abre la pantalla “Buscar”, **Then** encuentra disponible un catálogo de ejercicios predefinidos, listos para consultar y planificar sin necesidad de crearlos manualmente.
8. **Given** que el usuario abre la pantalla “Buscar” con muchos ejercicios disponibles, **When** recorre el listado, **Then** cada ejercicio se distingue visualmente, su nombre y descripción se leen sin desplazamiento horizontal y la lista admite desplazamiento vertical.
9. **Given** que los ejercicios o categorías se están cargando, **When** el usuario abre la pantalla correspondiente, **Then** ve un indicador de carga y no una pantalla vacía sin explicación.
10. **Given** que el usuario modifica una categoría, **When** guarda los cambios, **Then** ve la categoría actualizada y una confirmación visible; si la operación falla, ve un mensaje de error asociado al contexto de la operación.
11. **Given** que el usuario crea o edita un ejercicio, **When** abre el formulario, **Then** distingue los bloques de datos básicos, categorías, enlaces, imágenes y observaciones.
12. **Given** que el usuario consulta el formulario de ejercicio, **When** todavía no ha intentado guardarlo, **Then** identifica los campos obligatorios; si un valor no es válido, el mensaje aparece junto al campo afectado y este queda resaltado.
13. **Given** que el usuario guarda o elimina un ejercicio o una categoría, **When** la operación termina correctamente o falla, **Then** recibe una confirmación o un error visible cerca del contexto de la operación.
14. **Given** que el usuario añade enlaces o imágenes a un ejercicio, **When** revisa los elementos añadidos, **Then** cada uno aparece ordenado y dispone de una acción claramente identificable para quitarlo.
15. **Given** que el usuario visualiza el menú principal, **When** activa la opción "Nuevo ejercicio", **Then** el sistema muestra directamente el formulario de creación de un ejercicio, sin requerir que pase previamente por otra pantalla.
16. **Given** que el usuario visualiza el menú principal, **When** activa la opción "Gestionar categorías", **Then** el sistema muestra directamente la pantalla de gestión de categorías.
17. **Given** que el usuario consulta el menú principal, **When** revisa las opciones disponibles, **Then** encuentra las opciones "Hoy", "Buscar", "Planificación", "Sincronización", "Nuevo ejercicio" y "Gestionar categorías" y no encuentra una opción denominada "Mis ejercicios".
18. **Given** que el usuario quiere consultar, editar o eliminar un ejercicio, **When** accede a la opción "Buscar" del menú principal, **Then** puede localizar el ejercicio y acceder a las acciones disponibles sobre él sin necesitar una pantalla independiente denominada "Mis ejercicios".
19. **Given** que el usuario administra una categoría, **When** la crea o selecciona para editarla, **Then** puede realizar la acción desde la misma pantalla, con edición en línea y sin perder el contexto de la lista.
20. **Given** que el usuario elimina una categoría con ejercicios asociados, **When** aparece la confirmación de la operación, **Then** puede deshacerla y restaurar la categoría y sus asociaciones.
21. **Given** que se muestra una lista de categorías, **When** el usuario la consulta, **Then** cada categoría indica cuántos ejercicios tiene asociados y todas se comportan como categorías normales, sin una categoría del sistema no eliminable.
22. **Given** que el usuario elimina un ejercicio asociado a categorías o planificaciones, **When** aparece la notificación de confirmación, **Then** puede deshacer la eliminación y restaurar el ejercicio y sus asociaciones.
23. **Given** que el usuario crea un ejercicio y existe una planificación activa para la semana actual, **When** activa la opción "Agregar a los ejercicios de hoy" y guarda, **Then** el ejercicio se añade al día actual de esa planificación; la opción no aparece al editar ni cuando no hay planificación activa esta semana.

---

### User Story 2 - Buscar y consultar ejercicios (Priority: P2)

Como usuario quiero consultar el catálogo completo, buscar ejercicios por categoría o por texto y visualizar sus vídeos e información sin salir de la aplicación, para localizar rápidamente lo que necesito sin recordar de memoria cada ejercicio ni abrir enlaces externos por separado.

**Why this priority**: Una vez existe la biblioteca de ejercicios (User Story 1), la capacidad de encontrarlos y consultarlos cómodamente es el siguiente valor más importante: evita la "consulta manual de múltiples fuentes externas" mencionada como objetivo principal del producto.

**Independent Test**: Puede probarse de forma independiente creando previamente varios ejercicios en distintas categorías, accediendo a la pantalla "Buscar" para consultar el catálogo completo y comprobando que las búsquedas por categoría y por texto devuelven los resultados correctos, y que al abrir un ejercicio con vídeo se visualiza el reproductor integrado sin salir de la aplicación.

**Acceptance Scenarios**:

1. **Given** varios ejercicios repartidos en distintas categorías, **When** el usuario selecciona una categoría, **Then** se muestran únicamente los ejercicios asociados a esa categoría.
2. **Given** varios ejercicios con distintos nombres, **When** el usuario escribe parte del nombre de uno de ellos en el buscador, **Then** el ejercicio aparece entre los resultados.
3. **Given** un ejercicio con un enlace de vídeo de YouTube válido, **When** el usuario abre la ficha del ejercicio, **Then** el vídeo se visualiza integrado en la propia aplicación.
4. **Given** una categoría sin ejercicios asociados, **When** el usuario la selecciona, **Then** se muestra una lista vacía con un mensaje indicándolo.
5. **Given** que no existe ningún ejercicio registrado todavía, **When** el usuario accede a la búsqueda, **Then** se muestra un mensaje indicando que no hay ejercicios.
6. **Given** que una búsqueda no devuelve resultados, **When** el usuario consulta la lista, **Then** ve un estado vacío claro que indica que puede cambiar los criterios de búsqueda.
7. **Given** que el usuario abre la búsqueda o la ficha de un ejercicio, **When** se muestra la pantalla, **Then** identifica su título y acción principal sin tener que desplazarse para encontrarlos.
8. **Given** que el usuario busca ejercicios desde cualquier dispositivo, **When** selecciona un resultado, **Then** abre la ficha del ejercicio y puede regresar a "Buscar".
9. **Given** que el usuario busca ejercicios desde cualquier dispositivo, **When** revisa un resultado, **Then** encuentra su nombre, una descripción legible y cada categoría asociada una sola vez, claramente separada de la descripción, sin imagen, miniatura ni vista previa del ejercicio.
10. **Given** que el usuario consulta un ejercicio con imágenes o vídeos, **When** abre su ficha, **Then** los medios se muestran en proporciones coherentes, las imágenes conservan su contenido completo y el vídeo puede iniciarse desde una vista previa identificable.
11. **Given** que un vídeo asociado no está disponible o una imagen no carga, **When** el usuario consulta la ficha, **Then** se informa de ese medio no disponible sin ocultar el resto de la información del ejercicio.
12. **Given** que el usuario abre la ficha desde “Hoy”, “Planificación semanal” o “Buscar”, **When** activa “Volver”, **Then** regresa a la pantalla desde la que abrió el ejercicio; si no se conoce el contexto de navegación, regresa a “Buscar”.

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
12. **Given** que el usuario consulta una planificación en móvil, **When** selecciona un día en la tira semanal, **Then** ve los ejercicios de ese día y distingue los días con actividad, el día actual y los días de descanso.
13. **Given** que el usuario consulta una planificación en escritorio, **When** ve la semana, **Then** puede comparar los ejercicios de los siete días en una cuadrícula compacta.
14. **Given** que el usuario crea o edita una planificación, **When** activa “Agregar ejercicio” en un día, **Then** se abre una pantalla independiente para buscar y seleccionar ejercicios y no puede duplicar en ese día un ejercicio ya asignado.
15. **Given** que el usuario consulta una semana o un plan seleccionado, **When** cambia de planificación, **Then** identifica si es una planificación activa o una plantilla.
16. **Given** que el usuario añade ejercicios desde la pantalla de selección, **When** busca por una parte del nombre o filtra por categoría, **Then** cada resultado muestra el nombre, la descripción completa y las categorías, y cada ejercicio seleccionado se añade inmediatamente al día elegido, sin exigir una confirmación adicional.
17. **Given** que el usuario edita una planificación en un móvil, **When** cambia su fecha de inicio, **Then** puede abrir y usar el calendario desde un control visible y accesible, sin que lo oculten el teclado o la navegación.
18. **Given** que el usuario consulta la planificación semanal en móvil, **When** se abre la semana actual, **Then** el día actual ya está seleccionado y no se muestra un control o rótulo redundante “Hoy” que comprima la tira de días.

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
5. **Given** que todavía no se ha completado ningún ejercicio, **When** el usuario consulta el progreso, **Then** ve el estado inicial "Empieza por el primero".
6. **Given** que se han completado algunos ejercicios del día, **When** el usuario consulta el progreso, **Then** ve el recuento de ejercicios completados sobre el total.
7. **Given** que se han completado todos los ejercicios del día, **When** el usuario consulta el progreso, **Then** el 100 % se acompaña de una confirmación visual de finalización.
8. **Given** que un ejercicio está planificado para hoy, **When** el usuario abre su ficha, **Then** puede marcarlo como realizado o deshacer la marca desde esa misma pantalla.
9. **Given** que el usuario marca un ejercicio como realizado o no realizado, **When** aparece la notificación de confirmación, **Then** puede deshacer el cambio y recuperar el estado anterior.

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
9. **Given** que el usuario abre la pantalla de sincronización, **When** revisa su estado, **Then** ve si está configurada, cuándo se sincronizó por última vez o qué error o conflicto requiere atención.
10. **Given** que el usuario ya ha configurado GitHub, **When** abre la configuración, **Then** esta aparece plegada inicialmente y el token permanece oculto; al desplegarla puede consultar o modificar sus credenciales.
11. **Given** que los datos remotos contienen una imagen de archivo cuyo documento no existe o no tiene el formato esperado, **When** el usuario descarga los datos de GitHub o elige conservar la versión remota en un conflicto, **Then** se importan los demás datos y las imágenes válidas, se omite solo la imagen inválida y se informa cuántas imágenes se omitieron.
12. **Given** que falla la conexión al descargar los datos o alguna imagen de GitHub, **When** la sincronización no puede completar la lectura, **Then** la importación se cancela antes de reemplazar los datos locales y se informa del error.

---

### User Story 6 - Usar una aplicación clara, coherente y accesible (Priority: P1)

Como usuario quiero reconocer rápidamente dónde estoy, encontrar las acciones principales y completar los flujos en cualquier dispositivo, para gestionar mis ejercicios con comodidad y sin depender del ratón.

**Why this priority**: La presentación y accesibilidad son transversales a la biblioteca, búsqueda, planificación, progreso y sincronización, y deben mantenerse coherentes en todas las funciones disponibles.

**Independent Test**: Recorrer las pantallas funcionales y completar los flujos principales en móvil, tablet y escritorio, comprobando títulos, acciones, navegación, estados, foco y uso exclusivo del teclado.

**Acceptance Scenarios**:

1. **Given** que el usuario abre cualquier pantalla funcional, **When** se muestra la pantalla, **Then** ve un único título de página claro y las acciones principales disponibles en el contexto de esa pantalla.
2. **Given** que el usuario utiliza la aplicación en móvil, **When** consulta la navegación, **Then** encuentra "Hoy", "Planificación", "Buscar" y "Más" en una barra inferior; "Más" abre un panel inferior con "Gestionar categorías", "Sincronización" y la versión de la aplicación.
3. **Given** que el usuario utiliza la aplicación en tablet, **When** consulta la navegación, **Then** encuentra un riel lateral de iconos; en escritorio encuentra un menú lateral fijo agrupado en "Entrenar", "Biblioteca" y "Sistema".
4. **Given** que el usuario crea un ejercicio, **When** busca el acceso a esa acción, **Then** lo encuentra como acción destacada sin tener que navegar a través de un listado.
5. **Given** que el usuario cambia de sección, **When** la nueva pantalla se carga, **Then** la sección activa queda identificada consistentemente en todas las presentaciones de navegación.
6. **Given** que el usuario navega con teclado, **When** recorre los controles y completa las tareas principales, **Then** puede alcanzarlos en un orden lógico y el foco permanece visible sin dejar un estado de foco persistente tras abandonar el control.
7. **Given** que el usuario consulta una pantalla en móvil, tablet, escritorio o un ancho intermedio, **When** cambia el tamaño de la ventana, **Then** el contenido sigue siendo legible y utilizable sin solapamientos ni desplazamiento horizontal.
8. **Given** que la interfaz muestra texto o controles, **When** se comprueban el contraste y el foco, **Then** el contraste es de al menos 4,5:1 para texto normal y 3:1 para texto grande e iconos funcionales, y todos los controles tienen un indicador de foco visible.
9. **Given** que el usuario consulta un formulario, **When** encuentra un campo obligatorio o un error de validación, **Then** puede identificarlo antes de guardar y ve el mensaje junto al campo afectado.
10. **Given** que se carga una vista, **When** los datos todavía no están disponibles, **Then** ve un estado de carga con la forma aproximada del contenido, no un área vacía que parezca un fallo.
11. **Given** que el usuario completa una acción destructiva o marca un ejercicio, **When** aparece la confirmación, **Then** puede deshacer la acción mientras la notificación siga visible.
12. **Given** que el usuario consulta los controles en móvil, **When** los utiliza mediante interacción táctil, **Then** las áreas táctiles principales miden al menos 48 × 48 px y los controles de las pantallas de uso durante el ejercicio tienen al menos 56 px de alto.
13. **Given** que el usuario ve botones de una misma fila, **When** compara su presentación, **Then** mantienen alturas y separación uniformes; en escritorio los botones no se estiran al ancho completo sin necesidad.
14. **Given** que el usuario abre el menú "Más" o navega mediante el menú lateral, **When** selecciona una sección, **Then** llega a la pantalla y el menú o panel se cierra cuando corresponde.
15. **Given** que el usuario abre el menú móvil asociado al botón “+”, **When** pulsa el control de cierre, **Then** el menú se oculta; el botón “+” permanece en la zona superior de la pantalla y no tapa contenido.
16. **Given** que el usuario consulta una cabecera en móvil, **When** abre una pantalla funcional, **Then** el título y las acciones principales aparecen sin un espacio superior excesivo.
17. **Given** que el usuario crea o edita un ejercicio en móvil, **When** consulta el formulario, **Then** no se muestra el estado textual de guardado ni de cambios pendientes; los errores y confirmaciones de operación siguen siendo visibles.

---

### Edge Cases

- ¿Qué ocurre cuando no existe ningún ejercicio registrado? Se muestra un mensaje indicando que no hay ejercicios (en lugar de una lista vacía sin explicación).
- ¿Qué ocurre cuando no existe planificación para el día actual? Se muestra un mensaje indicando que no hay ejercicios programados para hoy.
- ¿Qué ocurre cuando una categoría buscada no contiene ejercicios? Se muestra una lista vacía con mensaje indicativo, no un error.
- ¿Qué ocurre cuando GitHub no está disponible durante una sincronización? Los datos permanecen localmente y el sistema informa del error, sin pérdida de información.
- ¿Qué ocurre cuando un vídeo de YouTube asociado a un ejercicio deja de existir? El ejercicio se sigue mostrando con el resto de su información, indicando que el vídeo no está disponible.
- ¿Qué ocurre si el usuario intenta crear una categoría con un nombre ya existente? Se rechaza la operación e informa del motivo.
- ¿Qué ocurre si el usuario elimina una categoría que tiene ejercicios asociados? Se rechaza la operación y se indican los ejercicios que solo tienen esa categoría; primero deben recibir otra. Si todos los ejercicios afectados conservan al menos otra categoría, la categoría puede eliminarse y se retira de ellos.
- ¿Qué ocurre si el usuario intenta añadir el mismo ejercicio dos veces al mismo día de la misma planificación? Se impide la duplicación.
- ¿Qué ocurre si el usuario intenta tener dos planificaciones activas (no plantilla) en la misma semana? Se impide la creación de la segunda.
- ¿Qué ocurre cuando ha habido cambios tanto locales como en GitHub desde la última sincronización? Se informa al usuario del conflicto y se le pide elegir si conserva la versión local completa o la remota completa antes de completar la sincronización.
- ¿Qué ocurre en la primera sincronización de un dispositivo nuevo si GitHub ya contiene datos? No se sobrescriben; se muestra la elección entre datos locales y remotos, con "Usar los datos de GitHub" marcada por defecto.
- ¿Qué ocurre si el usuario intenta añadir una imagen de archivo de más de 5 MB? Se rechaza con un mensaje que indica el tamaño máximo permitido.
- ¿Qué ocurre si el nombre o la descripción de un ejercicio es muy largo? Se ajusta o trunca sin romper la tarjeta ni provocar desplazamiento horizontal.
- ¿Qué ocurre si una búsqueda para añadir ejercicios no devuelve resultados? Se muestra un estado vacío informativo; el usuario puede modificar el nombre parcial o la categoría sin salir de la pantalla de selección.
- ¿Qué ocurre si el usuario ya ha asignado al día alguno de los ejercicios seleccionados? El sistema no lo añade por segunda vez.
- ¿Qué ocurre si el formulario tiene muchas categorías? Las opciones se reorganizan sin desbordar el contenedor.
- ¿Qué ocurre si una imagen no carga o su URL no es válida? Se indica el problema sin impedir que se use el resto del formulario.
- ¿Qué ocurre si falla una operación de guardado o eliminación? Se informa con claridad junto al campo o elemento afectado, además de la confirmación visual cuando la operación tiene éxito.
- ¿Qué ocurre si el listado contiene muchos ejercicios? Se puede recorrer con desplazamiento vertical sin perder legibilidad; no se exige mostrar todo el listado de una vez.
- ¿Qué ocurre en pantallas de menos de 360 px? Los controles y formularios siguen siendo utilizables, sin solapamientos ni texto cortado.
- ¿Qué ocurre en los anchos intermedios no incluidos en los rangos de referencia? El diseño se adapta de forma fluida y permanece utilizable.
- ¿Qué ocurre al seleccionar "Más" en móvil? Se abre un panel inferior con las secciones secundarias y se cierra al seleccionar una de ellas o al descartarlo.
- ¿Qué ocurre si el usuario completa un flujo solo con teclado? Todos los controles son alcanzables con foco visible y sin depender únicamente de acciones con ratón o pantalla táctil.
- ¿Qué ocurre si el usuario quiere consultar todos los ejercicios sin aplicar filtros? La pantalla "Buscar" muestra el catálogo completo cuando no existe texto de búsqueda ni categorías seleccionadas.
- ¿Qué ocurre con la funcionalidad que anteriormente estaba disponible en "Mis ejercicios"? La creación se abre desde "Nuevo ejercicio", la gestión de categorías desde "Gestionar categorías" y la consulta, edición y eliminación de ejercicios desde "Buscar"; ninguna capacidad funcional se pierde.
- ¿Qué ocurre al seleccionar "Nuevo ejercicio" o "Gestionar categorías" desde el menú móvil? El menú se cierra antes de mostrar la pantalla correspondiente y no permanece superpuesto sobre su contenido.
- ¿Qué ocurre si se intenta acceder mediante una URL antigua correspondiente a la pantalla "Mis ejercicios"? La aplicación redirige a "Buscar" y no muestra una pantalla vacía ni un error técnico.
- ¿Qué ocurre si un día no tiene ejercicios en la planificación semanal? Se identifica como "Descanso", no como contenido deshabilitado; en "Hoy" se informa de que no hay ejercicios y se muestra la próxima sesión cuando exista.
- ¿Qué ocurre si el usuario deshace la eliminación de una categoría? Se restauran la categoría y las asociaciones que tenía con ejercicios antes de eliminarla.
- ¿Qué ocurre si el usuario deshace la eliminación de un ejercicio? Se restaura el ejercicio y sus asociaciones con categorías y planificaciones.
- ¿Qué ocurre si se elimina un ejercicio o categoría y la notificación deja de estar visible? La eliminación queda aplicada y no se ofrece la acción de deshacer para esa operación.
- ¿Qué ocurre si el usuario abre un vídeo cuya vista previa no está disponible? Puede abrir el enlace original; el resto de la ficha sigue accesible.
- ¿Qué ocurre si un ejercicio no incluye series o repeticiones en sus observaciones? La ficha no inventa ni muestra valores de series o repeticiones.
- ¿Qué ocurre si el usuario guarda la configuración de GitHub y el token no es válido? Se muestra el error junto a la configuración, el token no se presenta como guardado y los datos locales se conservan.

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
- **FR-011**: El sistema DEBE permitir eliminar una categoría solo si todos los ejercicios asociados conservan al menos otra categoría. Si alguno se quedaría sin categoría, DEBE rechazar el borrado e indicar qué ejercicios deben reasignarse. Cuando la eliminación esté permitida, DEBE retirar la categoría de los ejercicios asociados. El sistema NO DEBE crear ni tratar una categoría genérica "Sin categoría".
- **FR-012**: El sistema DEBE permitir buscar ejercicios filtrando por una o varias categorías.
- **FR-013**: El sistema DEBE permitir buscar ejercicios mediante texto libre sobre su nombre o descripción.
- **FR-014**: Cada ejercicio DEBE poder almacenar: nombre, descripción, una o varias categorías, enlaces web, enlaces de YouTube, imágenes y observaciones opcionales.
- **FR-015**: El sistema DEBE mostrar una previsualización integrada (reproductor embebido) de los vídeos de YouTube asociados a un ejercicio, siempre que el vídeo esté disponible.
- **FR-016**: Para los enlaces web, el sistema DEBE mostrar el nombre del sitio y permitir abrir la URL original en una pestaña nueva. Solo DEBE mostrar vista previa integrada para vídeos de YouTube, publicaciones públicas compatibles de Instagram y vídeos compatibles de TikTok; para las demás URL, NO DEBE intentar mostrar una vista previa.
- **FR-017**: El sistema DEBE permitir crear y editar planificaciones semanales con una fecha de inicio asociada, que siempre corresponde a un lunes; el selector de fecha DEBE permitir elegirla mediante un calendario accesible en móvil y escritorio. No pueden existir dos planificaciones concretas con la misma fecha de inicio.
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
- **FR-033**: Si un vídeo de YouTube asociado a un ejercicio deja de estar disponible, el sistema DEBE seguir mostrando el ejercicio e indicar que el vídeo no está disponible, mostrando la URL original como enlace que se pueda abrir.
- **FR-034**: El sistema DEBE incluir, desde el primer uso, un catálogo de ejercicios predefinidos (contenido de fábrica) ya cargado en la aplicación, para que el usuario principiante pueda consultarlos y planificarlos sin necesidad de crearlos manualmente. El contenido del catálogo es el definido en el anexo [catalogo-predefinido.json](./catalogo-predefinido.json): 7 categorías (Abdomen, Cadera, Cervicales, Glúteo, Isquiotibiales, Lumbar y Rodilla) y 23 ejercicios de fortalecimiento y rehabilitación. Los ejercicios y las categorías predefinidos se comportan como cualquier otro: el usuario puede modificarlos o eliminarlos igual que los creados por él mismo.
- **FR-035**: Al sincronizar, el sistema DEBE actuar según dónde haya habido cambios desde la última sincronización: si solo hay cambios locales, los sube a GitHub; si solo hay cambios en GitHub, descarga y aplica los datos remotos; si hay cambios en ambos lados, DEBE detener la sincronización, informar al usuario del conflicto y permitirle elegir explícitamente si conserva todos los datos locales o todos los datos remotos. En la primera sincronización de un dispositivo, si GitHub ya contiene datos, el sistema DEBE tratarlo como conflicto (sin sobrescribir los datos remotos) y proponer por defecto "Usar los datos de GitHub". Al importar los datos de GitHub, si un documento de imagen de archivo no existe o no tiene el formato esperado, DEBE omitir únicamente esa imagen, importar el resto de los datos y las imágenes válidas e informar del número de imágenes omitidas. Los errores de conexión o autenticación durante la descarga DEBEN cancelar la importación antes de reemplazar los datos locales e informar del error.
- **FR-036**: El sistema DEBE permitir añadir imágenes a un ejercicio tanto mediante una URL externa como mediante la subida de un archivo de imagen local, soportando ambos mecanismos de forma indistinta. Cada imagen subida como archivo NO DEBE superar los 5 MB; si los supera, se rechaza con un mensaje que indica el tamaño máximo. Las imágenes subidas como archivo DEBEN sincronizarse con GitHub junto con el resto de datos; al crear una imagen remota nueva se omite el SHA y al modificar una existente se envía su SHA remoto actual.
- **FR-037**: El token de acceso de GitHub DEBE mostrarse oculto en pantalla, NUNCA DEBE incluirse en los datos sincronizados con GitHub, y el usuario DEBE poder borrarlo de la aplicación mediante una acción "Olvidar token". La pantalla de configuración DEBE indicar al usuario que cree un token de tipo *fine-grained* limitado a un único repositorio y con permiso de lectura y escritura de contenidos. Los datos DEBEN sincronizarse con un repositorio **privado** dedicado solo a datos (por ejemplo, `data-physical-exercises`), distinto del repositorio público donde se publica la aplicación, y el token DEBE limitarse a ese repositorio de datos; la pantalla de configuración DEBE indicarlo así.
- **FR-038**: Cada pantalla funcional DEBE mostrar una cabecera con el título de la sección y, cuando existan, sus acciones principales, visibles sin tener que desplazarse para encontrarlas. En móvil, el espacio entre el borde superior seguro de la pantalla y la cabecera NO DEBE superar 24 px.
- **FR-039**: En la pantalla "Buscar", el listado de ejercicios DEBE presentar cada ejercicio como un elemento visualmente diferenciado, con nombre y descripción legibles de un vistazo y sin desplazamiento horizontal. Los nombres o descripciones largos DEBEN ajustarse o truncarse sin romper el diseño; los listados largos DEBEN poder recorrerse verticalmente.
- **FR-040**: Mientras se cargan los datos de cualquier pantalla, el sistema DEBE mostrar un estado de carga reconocible que anticipe la forma del contenido y no parezca una pantalla vacía ni un error.
- **FR-041**: El formulario de ejercicio DEBE distinguir visualmente los bloques de datos básicos, categorías, enlaces, imágenes y observaciones; DEBE indicar los campos obligatorios antes del envío y mostrar los errores junto al campo afectado, resaltándolo.
- **FR-042**: Al crear, editar o eliminar ejercicios o categorías, el sistema DEBE comunicar el éxito o el error de forma visible y comprensible, cerca del contexto de la operación.
- **FR-043**: Las acciones principales de cada pantalla DEBEN poder alcanzarse en un único clic o toque desde el contexto correspondiente, sin pasos de navegación innecesarios.
- **FR-044**: Todas las pantallas DEBEN mantener un estilo visual coherente, profesional y cálido, basado en esta paleta: fondo `#F6F3EE`, superficies `#FFFFFF`, bordes `#E4DED4`, texto `#161D1D`, color primario `#00696B`, contenedor primario suave `#D7EEEC`, contenedor primario para elementos pequeños `#9CF1F0`, color terciario `#4A6380`, contenedor terciario `#D2E4FF`, éxito `#2E7D5B`, descanso `#F1EDE5` y error o acción destructiva `#BA1A1A`.
- **FR-045**: Todas las pantallas DEBEN cumplir los aspectos de accesibilidad acordados de WCAG 2.1 AA: contraste mínimo de 4,5:1 para texto normal y 3:1 para texto grande e iconos funcionales, foco visible en cada control interactivo y posibilidad de completar todos los flujos principales solo con teclado.
- **FR-046**: La aplicación DEBE conservar el comportamiento funcional de navegación, creación, edición, eliminación, consulta, planificación, seguimiento del progreso y sincronización definido en esta especificación al aplicar las mejoras de presentación.
- **FR-047**: En móvil, la navegación principal DEBE mostrarse como una barra inferior con "Hoy", "Planificación", "Buscar" y "Más". "Más" DEBE abrir un panel inferior con "Gestionar categorías", "Sincronización" y la versión de la aplicación. El panel DEBE cerrarse al seleccionar una opción o descartarlo.
- **FR-048**: Desde la planificación correspondiente al día actual, el sistema DEBE permitir acceder directamente a la ficha de cada ejercicio planificado mediante una acción claramente identificable asociada al ejercicio. Esta acción DEBE ser independiente del control utilizado para marcar el ejercicio como realizado o no realizado, y DEBE poder activarse mediante teclado y mediante interacción táctil.
- **FR-049**: Desde la planificación semanal, el sistema DEBE permitir acceder directamente a la ficha de cada ejercicio planificado.
- **FR-050**: La navegación DEBE adaptarse al dispositivo: barra inferior con cuatro opciones principales en móvil; riel lateral de 80 px en tablet; y menú lateral fijo y agrupado en "Entrenar" (Hoy, Planificación), "Biblioteca" (Buscar, Gestionar categorías) y "Sistema" (Sincronización) en escritorio. La opción activa DEBE distinguirse de forma coherente en todas las presentaciones.
- **FR-051**: El acceso "Nuevo ejercicio" DEBE abrir directamente el formulario de creación sin pasar por una lista. En móvil DEBE estar disponible como acción flotante destacada y en escritorio como acción destacada junto a la navegación.
- **FR-052**: "Gestionar categorías" DEBE abrir directamente la gestión de categorías; en móvil se encuentra dentro de "Más".
- **FR-053**: La aplicación NO DEBE incluir una pantalla ni una opción de navegación denominada "Mis ejercicios". La consulta del catálogo completo y la búsqueda DEBEN realizarse desde "Buscar". Al seleccionar un resultado, en todos los dispositivos se abre la ficha del ejercicio y la acción "Volver" regresa a la búsqueda. Las acciones de edición y eliminación se ofrecen desde la ficha, no directamente en la lista.
- **FR-054**: La retirada de la pantalla "Mis ejercicios" NO DEBE eliminar ni limitar las capacidades de creación, consulta, modificación y eliminación de ejercicios definidas en esta especificación.
- **FR-055**: La interfaz DEBE usar Roboto Flex con una escala tipográfica coherente: Display 32/40 px, título de página 22/28 px, sección 16/24 px, lectura 16/26 px, cuerpo 14/20 px y metadato 12/16 px. Las descripciones e instrucciones DEBEN limitar la longitud de línea para facilitar su lectura; los porcentajes, contadores y fechas DEBEN alinear sus cifras de forma estable.
- **FR-056**: La interfaz DEBE usar una escala de espaciado de 8 px, con márgenes laterales de 16 px en móvil, 24 px en tablet y 32 px en escritorio; el contenido de una misma pantalla DEBE compartir el mismo borde de alineación. En escritorio, el formulario de ejercicio y el editor de planificación DEBEN aprovechar el ancho disponible y NO DEBEN tener un ancho máximo fijo. Las listas de gestión pueden conservar un ancho máximo de referencia de 640 px.
- **FR-057**: Los campos y chips DEBEN tener esquinas de 8 px, las tarjetas y medios de 16 px y los botones forma de píldora. Los controles de una misma fila DEBEN tener alturas uniformes; en móvil, los controles principales DEBEN ofrecer áreas táctiles mínimas de 48 × 48 px, y las acciones de uso durante el ejercicio, de al menos 56 px de alto.
- **FR-058**: Cada pantalla DEBE tener un único título principal y una jerarquía visible entre título, secciones, cuerpo y metadatos. Las fechas de semana DEBEN presentarse en formato legible para personas, sin exponer el formato ISO como etiqueta principal.
- **FR-059**: Cada pantalla DEBE priorizar una única acción con botón de color primario relleno; las acciones secundarias DEBEN usar estilos visuales de menor énfasis. En escritorio, los botones DEBEN ajustarse a su contenido, no ocupar todo el ancho sin necesidad. Las acciones destructivas DEBEN distinguirse en rojo y no compartir el mismo nivel visual que la acción principal.
- **FR-060**: Los chips DEBEN limitarse a filtros o etiquetas y no sustituir controles de navegación. Los filtros DEBEN poder recorrerse horizontalmente en una sola fila y comenzar con una opción para mostrar todas las categorías.
- **FR-061**: La pantalla de planificación semanal DEBE mostrar por debajo de 1500 px una tira seleccionable de los siete días con indicadores de actividad, seleccionar inicialmente el día actual y mostrar debajo los ejercicios del día elegido. El día seleccionado DEBE comunicar cuál es el actual sin añadir un control o rótulo redundante "Hoy". Desde 1500 px DEBE permitir comparar los siete días en una cuadrícula. Los días sin ejercicios DEBEN identificarse como "Descanso" y no parecer deshabilitados.
- **FR-062**: La planificación DEBE permitir elegir entre planes existentes desde la cabecera, identificando cada uno como "Activa" o "Plantilla". El nombre del plan seleccionado no DEBE repetirse como título redundante. Los ejercicios planificados DEBEN mostrarse como filas legibles con acceso directo a sus fichas, no como chips de navegación.
- **FR-063**: Al añadir ejercicios a una planificación, la acción "Agregar ejercicio" DEBE abrir desde el día correspondiente una pantalla independiente para buscar y seleccionar ejercicios. La pantalla DEBE permitir añadir varios ejercicios mediante selecciones sucesivas, incorporando cada ejercicio al día inmediatamente al seleccionarlo, sin exigir una acción de confirmación adicional. DEBE impedir duplicar un ejercicio ya asignado. La tira de días y la presentación de ejercicios DEBEN ser coherentes entre el calendario y el constructor. En el constructor, los días DEBEN mostrarse en una columna en móvil, en dos columnas entre 600 y 1499 px y en siete columnas desde 1500 px.
- **FR-064**: En la pantalla "Buscar", los filtros y el buscador DEBEN permanecer disponibles mientras se recorren los resultados. Cada resultado DEBE mostrar nombre, descripción legible y categorías claramente identificables y visualmente separadas de la descripción; no se exige que las categorías se presenten como chips ni que se eliminen nombres de categoría repetidos. Los resultados NO DEBEN mostrar imagen, miniatura ni vista previa del ejercicio.
- **FR-065**: La ficha de ejercicio DEBE presentar los medios disponibles al inicio, seguidos del título, los datos de realización disponibles, las categorías y la descripción. Las imágenes DEBEN mostrarse completas dentro de una proporción cuadrada para miniaturas; si hay varias, DEBEN organizarse en una cuadrícula de dos columnas y poder abrirse ampliadas. Los vídeos de YouTube DEBEN usar una vista previa 16:9 con título, atribución disponible y acción explícita de reproducción; el reproductor no DEBE iniciarse antes de que el usuario lo solicite. Las publicaciones públicas compatibles de Instagram y los vídeos compatibles de TikTok DEBEN mostrarse integrados con su reproductor oficial y conservar el acceso a la URL original. Las demás URL web DEBEN mostrar el nombre del sitio y permitir abrir la URL original sin intentar una vista previa integrada.
- **FR-066**: Cuando las observaciones del ejercicio contengan series y repeticiones recomendadas, la ficha DEBE destacarlas de forma legible sin tratarlas como datos de seguimiento estructurados. Si no existen esos datos, no DEBE inventarlos.
- **FR-067**: Si un ejercicio está planificado para hoy, su ficha DEBE permitir marcarlo como realizado o no realizado desde una acción independiente del acceso a sus enlaces y medios.
- **FR-068**: La gestión de categorías DEBE mostrar el recuento de ejercicios asociados y permitir crear y editar categorías en el contexto de la lista. El campo de creación y la acción "Añadir" DEBEN aparecer juntos antes de la lista. La edición DEBE realizarse en línea y poder confirmarse con Enter o cancelarse con Escape. Todas las categorías DEBEN ser categorías normales, sin una categoría de sistema no eliminable.
- **FR-069**: Cuando se elimina un ejercicio o categoría, el sistema DEBE ofrecer "Deshacer" en la notificación de confirmación. Deshacer una categoría DEBE restaurar sus asociaciones anteriores; deshacer un ejercicio DEBE restaurar el ejercicio y sus asociaciones con categorías y planificaciones. Una vez desaparecida la notificación, la eliminación queda aplicada.
- **FR-070**: La pantalla de sincronización DEBE mostrar el estado (sin configurar, sincronizando, sincronizado, error o conflicto), el repositorio y la última sincronización cuando exista. La acción "Sincronizar ahora" DEBE ser la acción principal. La configuración DEBE aparecer abierta si no está configurada y plegada inicialmente si ya está configurada, mantener el token oculto y mostrar errores junto a los campos correspondientes.
- **FR-071**: La configuración de enlaces de ejercicios DEBE permitir introducir la URL sin elegir previamente entre web y YouTube y el sistema DEBE identificar su tipo. Para YouTube, publicaciones públicas compatibles de Instagram y vídeos compatibles de TikTok, DEBE mostrar la vista previa correspondiente cuando esté disponible; para otras URL, DEBE mostrar el nombre del sitio y permitir abrir el enlace sin generar una vista previa.
- **FR-072**: El progreso diario DEBE comunicar el estado además del porcentaje: antes de completar ejercicios, un mensaje de inicio; con progreso parcial, el recuento completado sobre el total; y al completar todos, una confirmación visual de finalización.
- **FR-073**: Los formularios DEBEN identificar los campos obligatorios y opcionales antes de guardar; los opcionales se indicarán como "(opcional)". Los errores de validación DEBEN aparecer junto al campo afectado.
- **FR-074**: Las confirmaciones de guardado, error, sincronización, marcado y eliminación DEBEN ser claras y contextuales. Los errores de formulario aparecen junto al campo; los errores de operación, junto a la operación. El estado de guardado DEBE distinguir cambios sin guardar, guardando y guardado donde se muestre; en móvil, el formulario de ejercicio NO DEBE mostrar el estado textual de guardado ni de cambios pendientes.
- **FR-075**: Cuando el usuario cambia el estado de realización de un ejercicio, el sistema DEBE mostrar una notificación con una acción "Deshacer" que restaura el estado que tenía antes del cambio mientras la notificación permanezca visible.
- **FR-076**: Los campos de formulario DEBEN presentar un solo borde visual y el autorrelleno del navegador DEBE conservar los colores de la paleta de la aplicación, sin introducir un color ajeno que perjudique la legibilidad.
- **FR-077**: La ficha de ejercicio DEBE ofrecer una acción para volver, una acción para editar y la eliminación dentro de un menú secundario identificado como destructivo. Si el ejercicio está planificado para hoy, DEBE mantener disponible la acción de progreso definida en FR-067.
- **FR-078**: En escritorio, la edición de un ejercicio DEBE mostrar el formulario y la vista previa de la ficha en dos columnas. Las acciones "Guardar" y "Cancelar" DEBEN permanecer visibles y accesibles durante la edición, sin requerir desplazamiento vertical para alcanzarlas.
- **FR-079**: Al crear un ejercicio, si existe una planificación activa para la semana actual, el formulario DEBE ofrecer al final del formulario y antes de las acciones una opción seleccionable, no un botón, denominada "Agregar a los ejercicios de hoy". Si se selecciona, al guardar el ejercicio el sistema DEBE asignarlo al día actual de esa planificación. La opción NO DEBE aparecer al editar un ejercicio ni cuando no exista planificación activa esta semana. Si falla la asignación después de guardar el ejercicio, el sistema DEBE informar claramente que el ejercicio se guardó pero no se pudo agregar a la planificación.
- **FR-080**: La acción "Volver" de la ficha de ejercicio DEBE regresar a la pantalla desde la que se abrió la ficha ("Hoy", "Planificación semanal" o "Buscar"). Si la ficha se abre sin un contexto de navegación conocido, DEBE regresar a "Buscar".
- **FR-081**: En "Hoy", cada ejercicio planificado DEBE mostrar su nombre, descripción completa y categorías sin truncarlos. El selector para añadir ejercicios a una planificación semanal DEBE mostrar igualmente la descripción completa y las categorías de cada resultado; sus elementos DEBEN crecer para acomodar el contenido sin recortarlo.
- **FR-082**: La pantalla independiente de selección de ejercicios DEBE permitir buscar por una parte del nombre mediante un campo situado en la parte superior y filtrar por categoría. Cada resultado DEBE mostrar el nombre, la descripción completa y las categorías del ejercicio, sin recortarlos. El usuario DEBE poder seleccionar ejercicios de forma sucesiva y cada selección DEBE incorporarse inmediatamente al día elegido, sin una confirmación adicional.
- **FR-083**: Durante la edición de una planificación en móvil, el calendario de fecha de inicio DEBE poder abrirse desde un control visible y accesible, y permanecer utilizable sin quedar oculto por el teclado virtual o la navegación del dispositivo. Debe conservarse la regla de que la fecha concreta corresponde a un lunes; una fecha vacía crea una plantilla.
- **FR-084**: En móvil, el botón flotante "+" DEBE situarse en la zona superior de la pantalla para no cubrir contenido. Si abre un menú de acciones, DEBE mostrar un control de cierre que oculte dicho menú al activarse por tacto o teclado.


### Key Entities *(include if feature involves data)*

- **Ejercicio**: Actividad física concreta que el usuario puede realizar. Incluye nombre, descripción y al menos una categoría asociada, enlaces web, enlaces de vídeo de YouTube, imágenes (mediante URL externa o archivo local) y observaciones opcionales. Puede asociarse a varios días de varias planificaciones distintas. Incluye tanto los ejercicios creados por el usuario como los del catálogo predefinido incorporado de fábrica.
- **Categoría**: Agrupación temática de ejercicios (por ejemplo, zona corporal como cuello, espalda, piernas, hombros o glúteos). Tiene un nombre único y una descripción opcional. Puede eliminarse si los ejercicios asociados conservan al menos otra categoría; si alguno solo tiene esa categoría, el borrado se bloquea y se indican los ejercicios que deben reasignarse. No existe una categoría genérica o de reserva. Las categorías del catálogo predefinido se crean de fábrica, pero se pueden modificar y eliminar como cualquier otra.
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
- **SC-016**: Desde visualización de la planificación semanal, el usuario puede abrir la ficha de cualquier ejercicio planificado, sin tener que buscarlo previamente en la biblioteca.
- **SC-017**: En móviles, los botones deben tener un espaciado entre ellos tanto en horizontal como en vertical.
- **SC-018**: El usuario puede iniciar la creación de un ejercicio desde el
  menú principal mediante una única acción, sin acceder previamente a un listado de ejercicios.
- **SC-019**: El usuario puede acceder a la gestión de categorías desde el menú principal mediante una única acción.
- **SC-020**: El 100 % de las capacidades de consulta, creación, edición y eliminación de ejercicios y categorías permanece disponible después de eliminar la pantalla "Mis ejercicios".
- **SC-021**: El menú principal no muestra la opción "Mis ejercicios" en móvil, tablet ni escritorio.
- **SC-022**: En las resoluciones de referencia de 375 × 812 px, 768 px de ancho y 1366 × 768 px, la navegación muestra la variante correspondiente a móvil, tablet o escritorio y deja claro cuál es la sección activa.
- **SC-023**: En una prueba de uso, el usuario identifica la sección activa tras cambiar de pantalla en menos de 3 segundos.
- **SC-024**: En una pantalla móvil de 375 × 812 px, la búsqueda, los filtros y al menos cinco resultados iniciales pueden consultarse sin desplazamiento horizontal; el buscador y los filtros siguen disponibles al recorrer la lista.
- **SC-025**: En móvil y escritorio, seleccionar un resultado de búsqueda abre la ficha y la acción "Volver" regresa a "Buscar".
- **SC-026**: El usuario puede seleccionar un día, añadir un ejercicio localizándolo por texto y consultar la distribución semanal en menos de 30 segundos.
- **SC-027**: El usuario puede crear o renombrar una categoría desde la lista sin abandonar su contexto y puede restaurarla con "Deshacer" mientras se muestra la notificación.
- **SC-028**: En una comprobación visual de todas las pantallas de referencia, los textos normales alcanzan un contraste mínimo de 4,5:1 y los textos grandes e iconos funcionales de 3:1; todos los flujos principales se completan solo con teclado y foco visible.
- **SC-029**: En las pantallas funcionales no hay desplazamiento horizontal ni controles solapados a 375 px, 768 px, 1366 px y en los anchos intermedios probados.
- **SC-030**: Si un ejercicio tiene un vídeo asociado, el usuario puede reconocer el vídeo desde su vista previa y abrirlo en una acción; si la vista previa no está disponible, el enlace original sigue siendo accesible.
- **SC-031**: Con los datos cargados, una búsqueda por texto o categoría y un cambio del día seleccionado muestran los resultados correspondientes en menos de 1 segundo, sin bloquear la interacción.
- **SC-032**: En la pantalla de selección de ejercicios, el usuario puede localizar ejercicios por nombre parcial o categoría, revisar su nombre y descripción completa y añadir varios al día elegido mediante selecciones sucesivas, sin una confirmación adicional ni duplicados.
- **SC-033**: En una pantalla de 1366 × 768 px, el formulario de ejercicio y el editor de planificación utilizan el ancho disponible respetando los márgenes de escritorio, sin quedar limitados por un ancho máximo fijo.
- **SC-034**: En una pantalla móvil de 375 × 812 px, la fecha de inicio puede editarse mediante el calendario; cabecera y acciones permanecen accesibles sin que el botón "+" tape contenido, y el menú del botón puede cerrarse.

## Assumptions

- **Usuario único**: la aplicación gestiona los datos de un único usuario; no existen perfiles múltiples, inicio de sesión ni funciones de compartición entre usuarios en esta versión.
- **Disponibilidad sin conexión**: dado que la información se conserva localmente entre sesiones, el uso normal de la aplicación (consultar, crear y marcar ejercicios) no requiere conexión a Internet; solo la sincronización con GitHub la necesita.
- **Sincronización manual**: la sincronización con GitHub se ejecuta únicamente bajo una acción explícita del usuario, no de forma automática en segundo plano.
- **GitHub como único respaldo**: no se contempla ningún sistema de copia de seguridad adicional al repositorio de GitHub en esta versión.
- **Dos repositorios en GitHub**: el código de la aplicación vive en un repositorio público (requisito de GitHub Pages en cuentas gratuitas) desde el que se publica; los datos del usuario se sincronizan con un repositorio privado aparte (por ejemplo, `data-physical-exercises`), para que no sean públicos, para que sincronizar no dispare un despliegue y para que el token no tenga acceso al código.
- **Autenticación con GitHub mediante PAT**: el usuario se autentica introduciendo manualmente en la aplicación un token de acceso personal (PAT) generado por él mismo en GitHub; la aplicación no implementa un flujo OAuth ni requiere servidor intermediario para la autenticación. Se acepta que el token se guarde sin cifrar en el almacenamiento local del navegador, dado que la aplicación tiene un único usuario y no dispone de servidor propio.
- **Orden de categorías**: las categorías se muestran ordenadas alfabéticamente; no se contempla un orden personalizado por el usuario en esta versión.
- Todos los ejercicios deben estar asignados a una o más categorías normales. No hay una categoría de sistema "Sin categoría" ni una reasignación automática al eliminar categorías.
- **Series y repeticiones del catálogo**: las series y repeticiones recomendadas de los ejercicios predefinidos se incluyen como texto en sus observaciones; la aplicación no registra series ni repeticiones (fuera de alcance).
- **Sin límite explícito de enlaces o imágenes**: no se establece un número máximo de enlaces o imágenes por ejercicio en esta versión, más allá de los límites técnicos razonables.
- **Progreso diario conservado indefinidamente**: el registro de qué ejercicios se marcaron como realizados cada día se conserva sin fecha de caducidad, aunque esta versión no incluye informes ni estadísticas históricas avanzadas sobre dicho progreso.
- **Semana de referencia**: a efectos de la regla de "una única planificación activa por semana", la semana se considera de lunes a domingo.
- **Catálogo predefinido editable**: el catálogo de ejercicios predefinidos de fábrica no es de solo lectura; el usuario puede modificarlo o eliminarlo igual que cualquier ejercicio propio.
- **Experiencia visual**: se mantiene un único tema claro. La identidad visual utiliza el fondo `#F6F3EE`, superficies `#FFFFFF`, bordes `#E4DED4`, texto `#161D1D`, primario `#00696B`, primario suave `#D7EEEC`, contenedor primario `#9CF1F0`, terciario `#4A6380`, contenedor terciario `#D2E4FF`, éxito `#2E7D5B`, descanso `#F1EDE5` y error `#BA1A1A`. Se usa Roboto Flex y una escala de espaciado de 8 px. La interfaz y sus mensajes se mantienen en español de España.
- **Navegación por dispositivo**: en móvil se usa la barra inferior "Hoy", "Planificación", "Buscar" y "Más"; en tablet, un riel lateral; en escritorio, un menú lateral agrupado. Las categorías y la sincronización están dentro de "Más" en móvil; "Nuevo ejercicio" permanece como acceso directo destacado.
- **Pantallas funcionales**: las vistas de hoy, búsqueda, planificación, ficha y sincronización forman parte de las funciones disponibles. "Gestionar categorías" permite administrar categorías desde su lista. No existe una pantalla independiente denominada "Mis ejercicios"; la consulta del catálogo y el acceso a la edición o eliminación de ejercicios se realizan desde "Buscar".
- **Presentación de ejercicio**: la aplicación no introduce series ni repeticiones como datos estructurados. Si están escritas en las observaciones, la ficha puede destacarlas; no se generan datos que no existan.
- **Objetivo orientativo de validación**: se aspira a reducir los errores de validación en el primer intento de alta de ejercicios, pero no se fija un porcentaje como criterio de aceptación porque no existe telemetría para medirlo.
- **Fuera de alcance en esta versión** (según el documento de origen): gestión de múltiples usuarios, compartición de ejercicios entre usuarios, autenticación mediante redes sociales, estadísticas avanzadas de entrenamiento, recordatorios por correo electrónico, notificaciones push, recomendación de ejercicios mediante inteligencia artificial, integración con relojes inteligentes, registro de peso/repeticiones/series, modo offline con sincronización automática avanzada, gestión de lesiones o diagnósticos médicos, seguimiento histórico detallado de rendimiento, impresión de fichas de ejercicio o de planificaciones, observaciones diarias dentro de una planificación, marcado de ejercicios como favoritos, y exportación a formatos como PDF o Excel (la exportación/importación de datos se cubre mediante la sincronización en JSON contra GitHub).
