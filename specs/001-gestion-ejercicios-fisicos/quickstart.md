# Quickstart: Validación de la experiencia de ejercicios y planificación

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Modelo de datos**: [data-model.md](./data-model.md) | **Contrato de interfaz**: [contracts/interfaz-usuario.md](./contracts/interfaz-usuario.md)

Guía para validar los flujos desde la interfaz, sin inspeccionar el código, los registros de ejecución ni la base de datos. Las etiquetas visibles se comprobarán en español de España.

## Requisitos previos

- Node.js y las dependencias del proyecto instaladas.
- Para las comprobaciones de sincronización: un repositorio privado de datos, un token fine-grained limitado a ese repositorio y dos navegadores o perfiles diferentes.
- Para validar el diseño responsive: navegador con herramientas para cambiar el tamaño de la ventana.

## Ejecución local y validaciones automatizadas

```powershell
npm start
npm test -- --watch=false
npm run lint
npm run build
```

Abre la URL que muestra `npm start`. El primer arranque debe cargar el catálogo predefinido y sus categorías; no debe aparecer una categoría genérica "Sin categoría".

## US1 — Biblioteca, ejercicio y categorías

1. Abre "Gestionar categorías". Comprueba el estado de carga, que el campo "Nueva categoría" y "Añadir" están juntos antes de la lista, y que cada categoría muestra su recuento de ejercicios.
2. Edita una categoría desde su fila. Guarda con Enter y repite cancelando con Escape. Comprueba que no pierdes la posición ni el contexto de la lista y que todas las categorías se pueden editar como categorías normales.
3. Intenta eliminar una categoría que sea la única asignada a un ejercicio. **Esperado**: el borrado se rechaza y se indica qué ejercicio hay que reasignar. Asigna otra categoría y vuelve a borrar la primera; la notificación ofrece "Deshacer". Actívalo y comprueba que se restaura la categoría y sus asociaciones.
4. Crea o edita un ejercicio. Comprueba que se identifican los campos obligatorios y opcionales, los errores aparecen junto al campo afectado y la interfaz distingue cambios sin guardar, guardado en curso y guardado. En escritorio, comprueba que el formulario y la vista previa aparecen en dos columnas y que "Guardar" y "Cancelar" permanecen visibles sin desplazamiento vertical.
5. Añade una URL válida de YouTube sin elegir antes un tipo de enlace. Comprueba que se identifica el enlace y que la vista previa muestra título y miniatura cuando estén disponibles. La reproducción no debe iniciarse hasta que la solicites.
6. Añade una imagen y un vídeo a la ficha. Comprueba las proporciones de miniatura, que las imágenes no se recortan, que las series/repeticiones recomendadas se destacan solo cuando están en las observaciones y que un medio no disponible no oculta el resto de la ficha.
7. Desde la ficha, comprueba que "Editar" está disponible y que "Eliminar" aparece dentro de un menú secundario identificado como destructivo. Elimina un ejercicio planificado y asociado a categorías; comprueba que desaparece de las listas y que "Deshacer" restaura el ejercicio y las asociaciones.

## US2 — Buscar y consultar

1. Abre "Buscar" sin texto ni categorías seleccionadas. **Esperado**: aparece el catálogo completo.
2. Busca por nombre y filtra por categoría. Comprueba el estado de carga con placeholders que anticipan el contenido, que el buscador permanece disponible al recorrer resultados, que los filtros de categoría forman una sola fila desplazable horizontalmente y que el texto largo no provoca desplazamiento horizontal de la página.
3. En móvil, confirma que los resultados muestran nombre, descripción, categorías e imagen cuando existe; selecciona uno y comprueba que abre su ficha.
4. En escritorio, selecciona resultados diferentes. **Esperado**: la ficha aparece junto a la lista y cambiar la selección no borra los criterios ni los resultados.
5. En la ficha, vuelve a la búsqueda, edita y elimina un ejercicio. Comprueba el feedback de cada operación y que el borrado puede deshacerse mientras la notificación esté visible.

## US3 — Calendario y constructor semanal

1. Crea o selecciona una planificación con ejercicios en varios días. Comprueba el estado de carga. En móvil, selecciona cada día en la tira semanal. **Esperado**: solo se muestra el contenido del día elegido; los puntos indican actividad, "Hoy" identifica el día actual y los días vacíos aparecen como "Descanso".
2. Repite en escritorio. **Esperado**: la cuadrícula permite comparar los siete días y las filas de ejercicios abren la ficha correspondiente.
3. Cambia el plan desde la cabecera. Comprueba que se identifica como "Activa" o "Plantilla" y que su nombre no se repite como título redundante.
4. Edita una planificación y añade un ejercicio usando la búsqueda del selector del día. Intenta añadirlo dos veces al mismo día. **Esperado**: el duplicado se impide; el selector y la presentación de días son coherentes con el calendario.
5. Comprueba que duplicar una planificación o plantilla conserva sus ejercicios y días, y que las restricciones de fecha y plan activo siguen vigentes.

## US4 — Hoy y progreso

1. Con una planificación activa, abre "Hoy". Comprueba el estado de carga y que la fecha, el plan, los ejercicios y el progreso son lo primero que ves.
2. Marca un ejercicio y observa el recuento parcial; pulsa "Deshacer" mientras aparece la notificación y confirma que vuelve al estado anterior.
3. Marca todos los ejercicios. **Esperado**: se muestra una confirmación visual del 100 %.
4. Abre la ficha de un ejercicio planificado para hoy. Marca y desmarca desde la ficha; comprueba que el acceso a la ficha y el control del progreso son independientes.
5. Sin ejercicios planificados para hoy, comprueba el mensaje de descanso y que se indica la próxima sesión cuando exista.

## US5 — Sincronización

1. Abre "Más" y después "Sincronización" en móvil, o la sección "Sistema" en escritorio. Comprueba el estado de carga y los estados "Sin configurar", "Sincronizado", "Sincronizando", "Error" y "Conflicto" según corresponda.
2. Configura el repositorio y el token. Comprueba que el token permanece oculto, que los errores de validación aparecen junto a sus campos y que la configuración queda plegada en la siguiente visita.
3. Completa una sincronización correcta, cierra y vuelve a abrir la pantalla. **Esperado**: se muestra la fecha de la última sincronización. Provoca después un error o conflicto y comprueba que la fecha de la última operación correcta no se reemplaza.
4. Sincroniza con dos navegadores y comprueba los casos existentes de primera sincronización, cambios locales, cambios remotos, conflicto y recuperación tras un fallo. Los datos locales deben conservarse ante errores.

## US6 — Navegación, estados y accesibilidad

1. Cambia el tamaño de ventana y valida 320, 359, 375, 599, 600, 768, 1024, 1280 y 1366 px de ancho. Comprueba que la navegación cambia a la presentación correspondiente, que la sección activa se distingue y que no hay solapamientos ni desplazamiento horizontal.
2. En móvil, verifica la barra inferior "Hoy", "Planificación", "Buscar" y "Más". Abre "Más", entra en Categorías y Sincronización y comprueba que el panel se cierra. Comprueba que "Nuevo ejercicio" sigue disponible como acción destacada.
3. Recorre con Tab y Mayús+Tab los flujos principales. Comprueba el orden lógico, el foco visible y que se puede activar cada control sin ratón.
4. Comprueba que los controles táctiles principales tienen un área de al menos 48 × 48 px y que las acciones de uso durante el ejercicio tienen al menos 56 px de alto. Verifica que los botones de una fila tienen alturas uniformes y espaciado horizontal y vertical.
5. Revisa contraste de texto normal (al menos 4,5:1) y de texto grande e iconos funcionales (al menos 3:1). Comprueba que los campos y chips tienen radios de 8 px, las tarjetas y medios de 16 px, los botones forma de píldora, y el tema, la tipografía, la escala de 8 px y los botones mantienen una presentación coherente entre pantallas.
6. Comprueba los estados de carga, error, guardado y vacío en las pantallas funcionales. Los estados de carga deben anticipar la forma del contenido; los errores deben explicar qué hacer y aparecer junto al campo o la operación afectada.

## Comprobación de tiempos y respuesta

Con el catálogo cargado y los datos de prueba preparados, usa un cronómetro desde la acción indicada hasta que el resultado sea visible. Repite cada recorrido tres veces y anota el resultado:

1. **SC-001**: inicia "Nuevo ejercicio" y detén el cronómetro cuando aparezca la confirmación del alta completa. Objetivo: menos de 1 minuto.
2. **SC-002**: inicia una búsqueda conocida por texto o categoría y detén el cronómetro cuando aparezca el ejercicio. Objetivo: menos de 10 segundos.
3. **SC-004**: inicia al marcar el primer ejercicio del día y detén el cronómetro al ver el 100 % de progreso. Objetivo: menos de 1 minuto.
4. **SC-006**: inicia al duplicar una plantilla o planificación y detén el cronómetro cuando la nueva planificación esté disponible para editar. Objetivo: menos de 2 minutos.
5. **SC-009**: al abrir cada pantalla funcional, identifica la acción principal. Objetivo: menos de 3 segundos.
6. **SC-023**: tras cambiar de sección, identifica cuál está activa. Objetivo: menos de 3 segundos.
7. **SC-026**: inicia al seleccionar un día y detén el cronómetro cuando se haya añadido por búsqueda un ejercicio y se pueda consultar la semana. Objetivo: menos de 30 segundos.
8. **SC-031**: con los datos ya cargados, mide desde la búsqueda o selección del día hasta que el contenido visible se actualice. Objetivo: menos de 1 segundo, sin bloquear la interacción.

## Criterio de aceptación global

La validación se supera cuando los flujos principales de las seis historias funcionan según sus resultados esperados en móvil, tablet y escritorio; los cambios de progreso y eliminaciones se deshacen dentro del periodo de notificación; no hay errores visibles sin explicación y una persona puede completar las tareas principales con teclado o tacto.
