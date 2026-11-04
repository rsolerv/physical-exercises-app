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
4. Crea o edita un ejercicio. Comprueba que se identifican los campos obligatorios y opcionales y que los errores aparecen junto al campo afectado. En móvil no se muestra información textual de guardado ni de cambios pendientes. En escritorio, comprueba que el formulario y la vista previa aparecen en dos columnas, que el formulario aprovecha el ancho disponible sin un máximo fijo y que "Guardar" y "Cancelar" permanecen visibles sin desplazamiento vertical.
5. Con una planificación activa para esta semana, crea un ejercicio y marca "Agregar a los ejercicios de hoy". **Esperado**: al guardar, aparece en el día actual de la planificación. Comprueba que la opción no aparece al editar ni cuando no existe planificación activa.
6. Añade una URL válida de YouTube sin elegir antes un tipo de enlace. Comprueba que se identifica el enlace y que la vista previa muestra título y miniatura cuando estén disponibles. La reproducción no debe iniciarse hasta que la solicites.
7. Añade una imagen y un vídeo a la ficha. Comprueba las proporciones de miniatura, que las imágenes no se recortan, que las series/repeticiones recomendadas se destacan solo cuando están en las observaciones y que un medio no disponible no oculta el resto de la ficha.
8. Desde la ficha, comprueba que "Editar" está disponible y que "Eliminar" aparece dentro de un menú secundario identificado como destructivo. Elimina un ejercicio planificado y asociado a categorías; comprueba que desaparece de las listas y que "Deshacer" restaura el ejercicio y las asociaciones.

## US2 — Buscar y consultar

1. Abre "Buscar" sin texto ni categorías seleccionadas. **Esperado**: el catálogo completo es accesible por páginas; aparecen inicialmente hasta 50 resultados, no solo los ejercicios que se consultaron anteriormente.
2. Busca por nombre y filtra por categoría. Comprueba el estado de carga con placeholders que anticipan el contenido, que el buscador permanece disponible al recorrer resultados, que los filtros de categoría forman una sola fila desplazable horizontalmente y que el texto largo no provoca desplazamiento horizontal de la página.
3. En móvil, confirma que los resultados muestran nombre, descripción y categorías separadas visualmente; no muestran imagen, miniatura ni vista previa. Selecciona uno y comprueba que abre su ficha.
4. En escritorio, confirma el mismo flujo: seleccionar un resultado abre su ficha en una pantalla dedicada y "Volver" regresa a "Buscar".
5. En la ficha, vuelve a la búsqueda, edita y elimina un ejercicio. Comprueba el feedback de cada operación y que el borrado puede deshacerse mientras la notificación esté visible.

## US3 — Calendario y constructor semanal

1. Crea o selecciona una planificación con ejercicios en varios días. Comprueba el estado de carga. En móvil, verifica que el día actual ya está seleccionado sin un rótulo o control "Hoy" redundante; selecciona cada día en la tira semanal. **Esperado**: solo se muestra el contenido del día elegido, los puntos indican actividad y los días vacíos aparecen como "Descanso".
2. Repite en escritorio. **Esperado**: la cuadrícula permite comparar los siete días y las filas de ejercicios abren la ficha correspondiente.
3. Cambia el plan desde la cabecera. Comprueba que se identifica como "Activa" o "Plantilla" y que su nombre no se repite como título redundante.
4. Edita una planificación en escritorio y comprueba que el editor aprovecha el ancho disponible sin un máximo fijo. Activa "Agregar ejercicio". **Esperado**: se abre una pantalla independiente con un campo de búsqueda parcial en la parte superior y filtros por categoría; cada resultado muestra el nombre y la descripción completa. Selecciona varios ejercicios sucesivamente y comprueba que cada uno se añade inmediatamente, sin confirmación adicional. Intenta añadir un ejercicio ya presente en ese día; el duplicado se impide.
5. En un móvil, edita la fecha de inicio de una planificación. **Esperado**: el control abre el calendario y permite usarlo sin que lo oculten el teclado virtual o la navegación; solo se pueden elegir lunes y dejar la fecha vacía crea una plantilla.
6. Comprueba que duplicar una planificación o plantilla conserva sus ejercicios y días, y que las restricciones de fecha y plan activo siguen vigentes.

## US4 — Hoy y progreso

1. Con una planificación activa, abre "Hoy". Comprueba el estado de carga y que la fecha, el plan, los ejercicios y el progreso son lo primero que ves. Cada ejercicio muestra su descripción completa y sus categorías sin recortarlas.
2. Marca un ejercicio y observa el recuento parcial; pulsa "Deshacer" mientras aparece la notificación y confirma que vuelve al estado anterior.
3. Marca todos los ejercicios. **Esperado**: se muestra una confirmación visual del 100 %.
4. Abre la ficha de un ejercicio planificado para hoy. Marca y desmarca desde la ficha; comprueba que el acceso a la ficha y el control del progreso son independientes.
5. Sin ejercicios planificados para hoy, comprueba el mensaje de descanso y que se indica la próxima sesión cuando exista. **Esperado**: "Crear una planificación" solo aparece cuando no existe una planificación activa.

## US5 — Sincronización

1. Abre "Más" y después "Sincronización" en móvil, o la sección "Sistema" en escritorio. Comprueba el estado de carga y los estados "Sin configurar", "Sincronizado", "Sincronizando", "Error" y "Conflicto" según corresponda.
2. Configura el repositorio y el token. Comprueba que el token permanece oculto, que los errores de validación aparecen junto a sus campos y que la configuración queda plegada en la siguiente visita.
3. Completa una sincronización correcta, cierra y vuelve a abrir la pantalla. **Esperado**: se muestra la fecha de la última sincronización. Provoca después un error o conflicto y comprueba que la fecha de la última operación correcta no se reemplaza.
4. Sincroniza con dos navegadores y comprueba los casos existentes de primera sincronización, cambios locales, cambios remotos, conflicto y recuperación tras un fallo. Los datos locales deben conservarse ante errores.
5. En un repositorio de prueba, referencia en `datos.json` varias imágenes válidas y una imagen de archivo cuyo documento `imagenes/<id>.json` no exista o no tenga el formato esperado. Descarga los datos o elige conservar los datos remotos al resolver un conflicto. **Esperado**: se importan los datos y las imágenes válidas, se omite solo la imagen inválida y se informa del número de imágenes omitidas. Repite provocando un error de conexión al leer una imagen; **esperado**: la importación se cancela y los datos locales permanecen intactos.

## US6 — Navegación, estados y accesibilidad

1. Cambia el tamaño de ventana y valida 320, 359, 375, 599, 600, 768, 1024, 1280 y 1366 px de ancho. Comprueba que la navegación cambia a la presentación correspondiente, que la sección activa se distingue y que no hay solapamientos ni desplazamiento horizontal.
2. En móvil, verifica la barra inferior "Hoy", "Planificación", "Buscar" y "Más". Abre "Más", entra en Categorías y Sincronización y comprueba que el panel se cierra. Comprueba que "Nuevo ejercicio" sigue disponible como acción destacada.
3. En móvil, verifica que el espacio superior de la cabecera no supera 24 px desde el área segura, que el botón "+" queda en la zona superior sin tapar contenido y que el control de cierre oculta el menú abierto por ese botón.
4. Recorre con Tab y Mayús+Tab los flujos principales. Comprueba el orden lógico, el foco visible y que se puede activar cada control sin ratón.
5. Comprueba que los controles táctiles principales tienen un área de al menos 48 × 48 px y que las acciones de uso durante el ejercicio tienen al menos 56 px de alto. Verifica que los botones de una fila tienen alturas uniformes y espaciado horizontal y vertical.
6. Revisa contraste de texto normal (al menos 4,5:1) y de texto grande e iconos funcionales (al menos 3:1). Comprueba que los campos y chips tienen radios de 8 px, las tarjetas y medios de 16 px, los botones forma de píldora, y el tema, la tipografía, la escala de 8 px y los botones mantienen una presentación coherente entre pantallas.
7. Comprueba los estados de carga, error, guardado y vacío en las pantallas funcionales. Los estados de carga deben anticipar la forma del contenido; los errores deben explicar qué hacer y aparecer junto al campo o la operación afectada.

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

## Enmienda de paginación 2026-11-04: preparación y aprobación visual

Estos recorridos verifican FR-086–FR-095 y SC-035–SC-038. No requieren inspeccionar SQL, registros ni la estructura del ZIP.

- Trabaja con una copia de prueba, sin sustituir datos personales no respaldados. Importa `tests/fixtures/copia-paginacion-51-ejercicios.zip` o `copia-paginacion-125-ejercicios.zip` (generadas por `crear-catalogo-paginacion.ts`). El filtro de categoría «Grupo de 49» da 49, «Grupo de 50» da 50 y un texto sin coincidencias da 0; sin filtros, 51 o 125. El ZIP anterior `copia-100-ejercicios.zip` sigue disponible y no se ha modificado.
- En el conjunto de 125, incluye dos nombres iguales con ejercicios distintos, un ejercicio asociado a dos categorías seleccionadas y, después de los 100 primeros, un ejercicio reconocible con imagen local, enlace, series, repeticiones y observaciones. Asigna un ejercicio de ese último tramo a una planificación.
- Para SC-038, importa `tests/fixtures/copia-paginacion-1000-ejercicios.zip`. Anota navegador, dispositivo, tamaño de ventana y los tres tiempos por acción; SQLite local no exime de medir el coste de búsqueda/renderizado.
- Antes de implementar presentación, el agente `ux-ui-expert` ejecuta `npm run build-storybook` y `npm run storybook`, presenta ambas pantallas con shell y rutas reales, capturas 390/834/1280 px y sus URL, y solicita aprobación explícita. Incluye datos/vacío/cargando/error/éxito, bloque intermedio y selección en varios bloques. Registra aprobación o mejoras pendientes en [tasks.md](./tasks.md); no dar el gate por superado con la aprobación textual de la propuesta.

### Buscar: paginación y retorno

1. Con 125 coincidencias abre Buscar: **esperado** hasta 50 elementos y rango "1–50 de 125". Avanza: "51–100 de 125"; avanza otra vez: "101–125 de 125" sin siguiente habilitado. Vuelve a la primera sin perder ni repetir ejercicios del conjunto estable.
2. Prueba 49, 50 y 51 coincidencias con tamaño inicial: en 49/50 no puedes avanzar; en 51 puedes consultar el ejercicio restante. Cero coincidencias con catálogo no vacío indica cambiar criterios; catálogo vacío muestra el mensaje de no tener ejercicios.
3. En tablet/escritorio cambia a 25 y 100: vuelve a primera página y se ajustan rangos y avance al tamaño activo. Vuelve a 50. En móvil no se muestra el selector; cambiar de ancho no altera por sí solo el tamaño ni la página.
4. Desde una página posterior cambia texto y categorías: muestra la primera página y el total de la nueva búsqueda. Escribe rápidamente varios textos: no debe reaparecer el resultado de uno anterior después del último.
5. Abre la ficha de un resultado de la tercera página: la lista no tenía medios, pero la ficha sí muestra imágenes, enlaces y pauta cuando existen. Vuelve: conserva criterios y página. Edita o elimina y vuelve: datos y total se actualizan; si desapareció la última página, se muestra la última válida. Deshacer conserva el comportamiento existente.
6. Recorre con teclado y lector de pantalla: controles en español, foco visible conservado al paginar y anuncio del rango. Confirma pie accesible a 320/390/834/1280 px, anchos intermedios y zoom 200 %, sin quedar tapado por navegación o área segura.

### Agregar ejercicios: carga incremental y selección

1. Con 125 candidatos abre el selector para un día con asignaciones previas. **Esperado**: primeros 50, "Mostrando 50 de 125", contador global de ejercicios de ese día y casillas previamente asignadas marcadas.
2. Selecciona un ejercicio del primer bloque; pulsa "Cargar 50 más": se conservan los primeros 50 y aparecen hasta 100. Selecciona otro y carga los 25 restantes: muestra 125 y desaparece el botón. El contador y las asignaciones incluyen ambos, sin duplicados.
3. Filtra para ocultar uno de los seleccionados: candidatos vuelven al primer bloque del nuevo filtro, pero ni asignación ni contador se pierden. Limpia filtros y vuelve a cargar: los ejercicios ya asignados aparecen marcados. Cambia de día y verifica sus propias asignaciones.
4. Carga con teclado: tras el éxito el foco llega a la primera opción nueva y se anuncia la cantidad añadida. No se mueve el foco mientras escribes en el filtro. En móvil el botón aprovecha el ancho; en tablet/escritorio se centra y ajusta al texto.
5. Cambia rápidamente el filtro mientras se está cargando un bloque: solo debe quedar el conjunto del filtro nuevo. Un doble clic en cargar no duplica el bloque ni salta resultados. La selección sigue incorporándose sin una confirmación adicional, conservando el guardado existente de la planificación.

### Errores y cambios de catálogo

En las historias con fallo controlado, provoca un error al avanzar o cargar y usa el reintento visible. Buscar no muestra cero coincidencias como si la consulta hubiera terminado; el selector conserva bloques/selecciones y reintenta exactamente el bloque pendiente. Estas historias permiten reproducir errores sin manipular la base de datos. Repite con las pruebas automatizadas del adaptador para cubrir el fallo de persistencia real.

Tras importar o aplicar una sincronización que cambie el catálogo, vuelve a las búsquedas: resultados y totales deben reflejar los datos nuevos; el selector no concatena bloques obsoletos y las asignaciones válidas del día se conservan.

### Integridad: sincronizar y restaurar el total

1. Con más de 100 ejercicios consulta **solo la primera página**, aplica un filtro restrictivo y no visites los últimos ejercicios.
2. Exporta una copia manual y restáurala en otro perfil de prueba. Busca por nombre el ejercicio del último tramo: debe existir con imagen, enlace, pauta y observaciones originales; su planificación y categorías también deben conservarse.
3. Repite con sincronización GitHub y con Google, cada destino por separado y con las reglas de activación de la feature 002. Comprueba en el segundo perfil un ejercicio no visitado y sus medios; sincronizar no transporta únicamente los resultados visibles. Usa cuentas/repositorios de prueba autorizados, sin compartir credenciales.
4. Verifica los flujos existentes de conflictos, restauración y copia anterior a la enmienda. No cambia la versión del formato ni se pierden medios por convertir un resumen en ejercicio incompleto.
5. Consulta el día, calendario, constructor y recuentos de categorías con referencias a ejercicios posteriores al número 50: no deben faltar nombres ni relaciones.

### Rendimiento y validación técnica complementaria

Con SQLite inicializado y 1000 ejercicios, mide tres veces desde cambiar filtro/página o pulsar cargar hasta mostrar el bloque solicitado. Objetivo SC-038: menos de 1 segundo por recorrido sin bloquear la interacción; registra los resultados a 390/834/1280 px y el dispositivo real utilizado. También comprueba las descripciones largas y el desplazamiento del acumulador.

La ausencia de lecturas de imágenes/enlaces y la paginación real en SQL se comprueban con tests del repositorio SQLite en memoria y espías de conexión: hasta tres consultas por página, sin hidratador completo; no son pasos de inspección exigidos a la propietaria. Ejecuta las pruebas dirigidas de Application/SQLite/Presentation y de exportación/sincronización/copia definidas en [tasks.md](./tasks.md), antes de las comprobaciones generales existentes.

**Resultados parciales (2026-11-04)**: 723 pruebas Vitest superadas (cobertura global: 87,63 % sentencias, 81,85 % ramas, 84,73 % funciones y 91,22 % líneas); lint, build y build-storybook superados. El build mantiene avisos de tamaño del bundle inicial y de 7 bytes en un estilo de sincronización ajeno a esta enmienda. En Chromium local, con 23 ejercicios existentes y sin importar datos personales, Buscar muestra 23 resultados y el rango 1–23 de 23 sin desbordamiento horizontal a 320, 390, 599, 600, 834, 1024 y 1280 px; el selector de tamaño está oculto a 390 px y visible a 834 y 1280 px. Las pruebas automatizadas comprueban los límites de 49/50/51/125 y copias con más de 100 ejercicios, pero **no sustituyen** los recorridos manuales de 125/1000 ejercicios, las tres mediciones de SC-038, el zoom, el lector de pantalla ni las sincronizaciones reales GitHub/Google en otro perfil. Estas últimas verificaciones siguen pendientes (T056).

## Criterio de aceptación global

La validación se supera cuando los flujos principales de las seis historias funcionan según sus resultados esperados en móvil, tablet y escritorio; los cambios de progreso y eliminaciones se deshacen dentro del periodo de notificación; no hay errores visibles sin explicación y una persona puede completar las tareas principales con teclado o tacto.

La enmienda de paginación exige además el prototipo aprobado, SC-035–SC-038 verificados y regresiones que demuestren que copias/sincronización incluyen los ejercicios no visitados. Preparar estos documentos no equivale a haber ejecutado dichas validaciones.
