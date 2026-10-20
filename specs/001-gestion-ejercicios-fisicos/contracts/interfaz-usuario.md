# Contrato de interfaz de usuario


**Ámbito**: Interacción visible de la aplicación de gestión de ejercicios.  
**Especificación normativa**: [spec.md](../spec.md), en especial FR-038–FR-078.  
**Plan**: [plan.md](../plan.md).

Este contrato resume las respuestas observables de la aplicación. La especificación es la fuente normativa para los detalles y criterios de aceptación; este documento no añade reglas de negocio.

## Navegación

| Dispositivo | Presentación | Accesos |
|---|---|---|
| Móvil (≤599 px) | Barra inferior y panel inferior "Más" | "Hoy", "Planificación", "Buscar", "Más"; "Más" contiene "Gestionar categorías", "Sincronización" y la versión. "Nuevo ejercicio" permanece como acción destacada. |
| Tablet (768–1024 px) | Riel lateral de 80 px | Acceso a las secciones y a la acción destacada para crear ejercicio. |
| Escritorio (≥1280 px) | Menú lateral fijo y agrupado | "Entrenar", "Biblioteca" y "Sistema"; la sección actual se distingue. |

Los anchos entre rangos y menores de 360 px siguen siendo utilizables. Ninguna variante genera desplazamiento horizontal, superposición accidental del contenido o pérdida de acceso a una acción descrita en la spec.

## Contratos por pantalla

### Hoy y progreso

- La pantalla prioriza la fecha, el plan, los ejercicios y el progreso del día.
- Cada ejercicio permite abrir su ficha y marcarlo como realizado con controles independientes.
- La ficha también permite marcar o desmarcar el ejercicio cuando está planificado para hoy.
- El progreso distingue inicio, avance parcial y finalización. El usuario puede deshacer un cambio mientras su notificación siga visible.
- Si el día está vacío, se comunica el descanso y, cuando existe, se muestra la próxima sesión.

### Buscar y ficha

- El buscador y los filtros siguen disponibles al recorrer los resultados.
- Los filtros de categoría se muestran en una sola fila horizontalmente desplazable, sin provocar desbordamiento horizontal de la página.
- Con los datos cargados, una búsqueda por texto o categoría muestra los resultados en menos de 1 segundo (SC-031).
- Cada resultado proporciona nombre, descripción, categorías e imagen cuando exista.
- En escritorio, seleccionar un resultado muestra su ficha junto a la lista sin descartar los resultados ni los filtros. En móvil, abre la ficha.
- La ficha permite volver a los resultados y editar; la eliminación está dentro de un menú secundario identificado como destructivo.
- Los medios fallidos no ocultan el resto de la ficha. El vídeo requiere una acción explícita para iniciar la reproducción.
- Las vistas previas identifican título y miniatura cuando están disponibles. Las observaciones pueden destacar series/repeticiones recomendadas existentes; no se inventan si faltan.

### Planificación y constructor

- En móvil, la tira de siete días permite seleccionar un día e identifica actividad, día actual y descanso; el contenido muestra los ejercicios del día seleccionado.
- Con los datos cargados, cambiar el día seleccionado actualiza el contenido visible en menos de 1 segundo (SC-031).
- En escritorio, la cuadrícula permite comparar los siete días.
- El selector de ejercicios se abre desde el día y permite buscar por texto. No se admiten duplicados en el mismo día.
- Los ejercicios de la planificación llevan a su ficha sin sustituir el control de selección o edición.

### Categorías

- La creación se inicia desde un campo y una acción "Añadir" contiguos a la lista.
- Cada categoría muestra su número de ejercicios. La edición ocurre en línea y se confirma con Enter o se cancela con Escape.
- "Sin categoría" se identifica como categoría del sistema no eliminable.
- Después de eliminar una categoría, el usuario puede deshacer mientras se ve la notificación.

### Formularios de ejercicio

- Los campos obligatorios y opcionales se identifican antes de guardar; los errores aparecen junto al campo afectado.
- El guardado distingue los cambios pendientes, el guardado en curso y el guardado completado.
- En escritorio, la edición presenta el formulario y la vista previa de la ficha en dos columnas, con "Guardar" y "Cancelar" visibles y accesibles sin desplazamiento vertical.
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
