# Contrato de interfaz de usuario




**Ámbito**: Interacción visible de la aplicación de gestión de ejercicios.  
**Especificación normativa**: [spec.md](../spec.md), en especial FR-038–FR-084.
**Ampliación vigente**: FR-086–FR-095, paginación SQL de búsquedas y selector (2026-11-04).
**Plan**: [plan.md](../plan.md).

Este contrato resume las respuestas observables de la aplicación. La especificación es la fuente normativa para los detalles y criterios de aceptación; este documento no añade reglas de negocio.

## Navegación

| Dispositivo | Presentación | Accesos |
|---|---|---|
| Móvil (≤599 px) | Barra inferior y panel inferior "Más" | "Hoy", "Planificación", "Buscar", "Más"; "Más" contiene "Gestionar categorías", "Sincronización" y la versión. "Nuevo ejercicio" permanece como acción destacada. |
| Tablet (768–1024 px) | Riel lateral de 80 px | Acceso a las secciones y a la acción destacada para crear ejercicio. |
| Escritorio (≥1280 px) | Menú lateral fijo y agrupado | "Entrenar", "Biblioteca" y "Sistema"; la sección actual se distingue. |

Los anchos entre rangos y menores de 360 px siguen siendo utilizables. Ninguna variante genera desplazamiento horizontal, superposición accidental del contenido o pérdida de acceso a una acción descrita en la spec.
En móvil, las cabeceras no dejan más de 24 px entre el área segura superior y el título. El botón flotante "+" se sitúa en la zona superior para no tapar contenido; si despliega un menú, su control de cierre lo oculta.

## Contratos por pantalla

### Hoy y progreso

- La pantalla prioriza la fecha, el plan, los ejercicios y el progreso del día.
- Cada ejercicio permite abrir su ficha y marcarlo como realizado con controles independientes.
- La ficha también permite marcar o desmarcar el ejercicio cuando está planificado para hoy.
- Cada ejercicio de "Hoy" muestra su nombre, descripción completa y categorías; el contenido se ajusta a la altura necesaria y no se trunca.
- El progreso distingue inicio, avance parcial y finalización. El usuario puede deshacer un cambio mientras su notificación siga visible.
- Si el día está vacío, se comunica el descanso y, cuando existe, se muestra la próxima sesión.

### Buscar y ficha

- El buscador y los filtros siguen disponibles al recorrer los resultados.
- Los filtros de categoría se muestran en una sola fila horizontalmente desplazable, sin provocar desbordamiento horizontal de la página.
- Con los datos cargados, una búsqueda por texto o categoría muestra los resultados en menos de 1 segundo (SC-031).
- Cada resultado muestra nombre, descripción y categorías claramente distinguibles y separadas visualmente de la descripción; las categorías no tienen que presentarse como chips. No muestra imagen, miniatura ni vista previa del ejercicio.
- Al seleccionar un resultado, tanto en escritorio como en móvil, se abre su ficha; "Volver" regresa a "Buscar".
- La ficha permite volver a los resultados y editar; la eliminación está dentro de un menú secundario identificado como destructivo.
- Los medios fallidos no ocultan el resto de la ficha. El vídeo requiere una acción explícita para iniciar la reproducción.
- Las vistas previas de medios pertenecen a la ficha y muestran título y miniatura cuando están disponibles. Las observaciones pueden destacar series/repeticiones recomendadas existentes; no se inventan si faltan.

#### Paginación de Buscar

- Los resultados se consultan en SQLite con el [contrato de lectura paginada](./ejercicio-repository.port.md); no se recorta una lista completa en memoria. Son resúmenes sin enlaces ni imágenes, incluso cuando el ejercicio los tiene almacenados.
- Tamaño inicial 50. El paginador Angular Material muestra el rango "1–50 de 125" y controles anterior/siguiente al final de la lista, fuera del bloque fijo de filtros. No se construye una botonera personalizada de números de página.
- En móvil (hasta 599 px), rango y flechas se adaptan al ancho, sin selector de tamaño. En tablet y escritorio se ofrece "Ejercicios por página" con 25, 50 y 100; cambiar tamaño reinicia a la primera página. A 600–1279 px se conserva una disposición utilizable con el riel de navegación y sin depender de un ancho fijo; en anchos estrechos los controles se redistribuyen en filas, sin recortar el rango.
- Con tamaño inicial y 0–50 coincidencias no hay avance a otra página. La capacidad de avanzar depende siempre del tamaño activo y del total filtrado, no de cuántos ejercicios hay en el catálogo sin filtrar. Cambiar el ancho no altera el tamaño ni la página; si se eligió 25 o 100 antes de pasar a móvil se conserva ese valor aunque el selector no sea visible.
- Texto/categorías vuelven a página 0. Al cargar se indica el estado y se impide avanzar repetidamente; el rango solo confirma la nueva página tras el éxito. Un fallo tiene mensaje y reintento, no se interpreta como búsqueda vacía. Las respuestas antiguas se descartan.
- El foco permanece en el control de paginación que inició el cambio y el lector de pantalla recibe el rango actualizado; no se fuerza el foco a resultados durante la escritura. Al volver desde la ficha se restauran criterios, tamaño y página de esa búsqueda durante la navegación, y se reconsulta si hubo cambios. Si un borrado deja el índice fuera de rango, se carga la última página válida.

#### Selector de ejercicios: bloques acumulativos

Este contrato complementa "Planificación y constructor":

- Primera consulta de 50 y después páginas SQL de 50 distintas, no consultas cada vez mayores del prefijo completo. Solo los resúmenes ya recibidos se acumulan en memoria para su visualización.
- El pie muestra "Mostrando 50 de 125" y un botón "Cargar 50 más"; cuando quedan 25, muestra "Cargar 25 más". El botón desaparece al mostrar todos; no hay carga automática al desplazar.
- En móvil el botón ocupa el ancho disponible; en tablet/escritorio se centra y ajusta al contenido. El pie permanece en el flujo normal con 16 px de separación y respeta el espacio que reserva el shell para la barra inferior y el área segura, sin duplicar esa reserva.
- El contador "N ejercicios en este día" permanece visible con la cabecera/filtros, también cuando el filtro oculta asignados. Las casillas se vinculan al conjunto de ids del día que mantiene el constructor, incluidas las asignaciones previas. Cambiar de día cambia esa fuente; la paginación nunca elimina asignaciones.
- Cambiar filtros descarta los bloques de candidatos y solicita el primero, sin borrar los ejercicios asignados. Fallar una carga conserva lo acumulado y las asignaciones, muestra el error al lado del botón y permite reintentar el mismo bloque sin saltos ni duplicados.
- Tras una carga explícita, el foco de teclado pasa a la primera opción nueva y el lector de pantalla anuncia cuántos se añadieron y cuántos se muestran del total. No se mueve el foco al escribir filtros. Mientras hay una petición de avance pendiente, la acción está deshabilitada.
- Un cambio conocido del catálogo invalida las respuestas pendientes y reinicia candidatos sobre los datos nuevos; no se intenta ocultar inconsistencias de paginación únicamente deduplicando arrays.

#### Prototipo pendiente antes de implementar presentación

El agente `ux-ui-expert` debe actualizar las historias en `src/stories/` a partir de este contrato y presentarlas con el shell y rutas reales, datos en español y capturas a 390, 834 y 1280 px. También se comprueban 320 px, anchos intermedios y zoom 200 %. Debe cubrir 0/49/50/51/125 resultados, primera/intermedia/última página, selección entre bloques, carga inicial/adicional, error con reintento y éxito. La aprobación funcional de la enmienda no es la aprobación del prototipo: no se implementa la presentación real hasta recibir esta última explícitamente y registrarla.

### Planificación y constructor

- Por debajo de 1500 px, la tira de siete días permite seleccionar un día e identifica actividad, día actual y descanso; el contenido muestra los ejercicios del día seleccionado. Desde 1500 px, la cuadrícula permite comparar los siete días sin que se solapen los nombres: las filas de ejercicios se ajustan a varias líneas y las tarjetas crecen según su contenido.
- Con los datos cargados, cambiar el día seleccionado actualiza el contenido visible en menos de 1 segundo (SC-031).
- En móvil, el día actual ya está seleccionado y no se añade un rótulo o control redundante "Hoy".
- En el constructor, los días se muestran en una columna en móvil, dos columnas entre 600 y 1499 px y siete columnas desde 1500 px.
- En el constructor, el selector de fecha ofrece un calendario que puede abrirse mediante un control visible tanto en móvil como en escritorio; en móvil permanece accesible durante la edición y no queda oculto por el teclado o la navegación. Solo permite seleccionar lunes; dejar la fecha vacía crea una plantilla.
- La acción "Agregar ejercicio" abre una pantalla independiente desde el día correspondiente. Permite buscar por parte del nombre desde un campo superior, filtrar por categoría y seleccionar varios ejercicios; cada selección se añade inmediatamente al día, sin confirmación adicional. No se admiten duplicados en el mismo día.
- Los resultados del selector muestran el nombre, la descripción completa y las categorías de cada ejercicio, sin recortarlas.
- Los ejercicios de la planificación llevan a su ficha sin sustituir el control de selección o edición.
- El editor de planificación utiliza el ancho disponible en escritorio, sin un ancho máximo fijo.

### Categorías

- La creación se inicia desde un campo y una acción "Añadir" contiguos a la lista.
- Cada categoría muestra su número de ejercicios. La edición ocurre en línea y se confirma con Enter o se cancela con Escape.
- Si borrar una categoría deja algún ejercicio sin categoría, la operación se rechaza y se indican los ejercicios que deben reasignarse.
- Después de eliminar una categoría, el usuario puede deshacer mientras se ve la notificación.

### Formularios de ejercicio

- Los campos obligatorios y opcionales se identifican antes de guardar; los errores aparecen junto al campo afectado.
- La pauta recomendada ofrece campos numéricos opcionales e independientes de series y repeticiones. La ficha los presenta con el bloque "Pauta recomendada" y el mismo estilo visual que ya utilizaba para destacarlos dentro de las observaciones; las observaciones siguen apareciendo por separado.
- Al crear un ejercicio, si existe una planificación activa para esta semana, se ofrece antes de las acciones la casilla "Agregar a los ejercicios de hoy". Si se marca, el ejercicio se asigna al día actual al guardarse; la casilla no aparece al editar ni cuando no existe planificación activa.
- Si la asignación a la planificación falla tras guardar el ejercicio, se informa del guardado y del fallo de asignación por separado.
- En móvil no se muestra información textual sobre si el formulario está guardado o tiene cambios pendientes.
- En escritorio, la edición presenta el formulario y la vista previa de la ficha en dos columnas, con "Guardar" y "Cancelar" visibles y accesibles sin desplazamiento vertical.
- El formulario de ejercicio utiliza el ancho disponible en escritorio, sin un ancho máximo fijo.
- El tipo de enlace se reconoce a partir de la URL. Una vista previa disponible se muestra antes de abrir el enlace o reproducir el vídeo.
- Las imágenes se muestran completas y los vídeos no se reproducen hasta que se solicite.

### Sincronización

- El usuario puede distinguir si la sincronización está sin configurar, en curso, completada, en error o en conflicto.
- "Sincronizar ahora" es la acción principal; la configuración se pliega inicialmente cuando ya está configurada.
- El token permanece oculto. Los errores se comunican junto a la operación o al campo correspondiente.

## Comportamiento común

- Un título principal por pantalla y una acción principal visualmente dominante.
- Confirmación visible de éxito, error contextual y estados de carga reconocibles.
- Los placeholders de carga anticipan la estructura aproximada del contenido de cada pantalla.
- El foco permanece visible al navegar con teclado; ninguna acción depende exclusivamente del ratón.
- Los controles táctiles principales miden al menos 48 × 48 px; los controles de uso durante el ejercicio, al menos 56 px de alto.
- Campos y chips usan radios de 8 px, tarjetas y medios de 16 px, y botones forma de píldora; los controles de una fila mantienen alturas uniformes y separación visible.
- Las búsquedas y cambios de día reflejan su resultado en menos de 1 segundo cuando los datos están cargados (SC-031).
- Se aplican la paleta, jerarquía tipográfica, espaciado, formas y umbrales de contraste establecidos por FR-044–FR-060.
