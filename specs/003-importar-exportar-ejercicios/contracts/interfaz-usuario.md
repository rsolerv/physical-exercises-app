# Contrato de interfaz de usuario: Importar y subir ejercicios

Complementa `spec.md` con el detalle de presentación necesario para implementar y para que `ux-ui-expert` prepare las historias de Storybook de la pantalla nueva (Constitución, principio V).

## Pantalla "Importar ejercicios" (nueva, US1)

- Ruta: `/ejercicios/importar`. Entrada de menú "Importar ejercicios" en el grupo "Biblioteca" (junto a "Buscar" y "Gestionar categorías"), visible en escritorio/tablet; en móvil se ubica en el panel "Más", igual que "Gestionar categorías" (FR-001, coherente con `menu-principal.ts` y FR-047 de 001).
- Cabecera con título "Importar ejercicios", sin acciones principales adicionales en la cabecera (la acción "Importar" vive junto a los resultados, no en la cabecera, ver más abajo).
- Mismo layout responsive que "Buscar" (buscador de texto arriba, filtro de categoría debajo o al lado según el ancho disponible, resultados en lista vertical sin desbordamiento horizontal), con estas diferencias respecto a "Buscar":
  - La cabecera y los filtros permanecen fijos bajo la barra superior de la aplicación, igual que en "Buscar". El área de resultados reserva el espacio vertical necesario para que el listado empiece después de los filtros y no quede oculto al cambiar el tamaño de pantalla.
  - El filtro de categoría usa una selección **única** (p. ej. `mat-selection-list` en modo single o `mat-radio-group`) sobre las categorías del repositorio común; la primera categoría queda seleccionada al cargar la pantalla y no existe una opción "Todas" (FR-002).
  - Debajo del buscador y del filtro hay un botón "Buscar" explícito. Está deshabilitado cuando no hay ninguna categoría seleccionada; no se dispara ninguna búsqueda automáticamente al escribir o al cambiar la categoría (FR-003).
  - Antes de la primera búsqueda de la sesión, la zona de resultados muestra un estado inicial neutro (no un estado vacío de "sin resultados"), invitando a buscar.
  - Cada resultado se presenta igual que en "Buscar" (nombre, descripción, categorías comunes) más una casilla de selección (`mat-checkbox`) a su izquierda (FR-005). La casilla y la acción secundaria "Ver ejercicio" son controles independientes: abrir la ficha no cambia la selección.
  - Mientras `seleccionados.length === 0`, no se muestra el botón "Importar"; en cuanto hay al menos un seleccionado, aparece fijo y accesible sin desplazamiento adicional (p. ej. en una barra inferior de acciones o flotante), con el recuento de seleccionados (FR-006).
- Al pulsar "Importar": si hay categorías sin mapear, se abre el diálogo "Asignar categoría" (ver más abajo) antes de aplicar ningún cambio; si no hay ninguna que mapear, se aplica directamente y se muestra una notificación de éxito con el número de ejercicios importados (y, si corresponde, el número de imágenes omitidas, FR-011).
- Estados: carga (mientras se realiza la búsqueda, con un indicador reconocible, FR-040 de 001), vacío (sin resultados, con mensaje orientativo), error (red o repositorio no disponible, con mensaje y posibilidad de reintentar, FR-023).

## Ficha remota "Previsualizar ejercicio" (ampliación de US1)

- Ruta: `/ejercicios/importar/:id`. Se abre desde la acción secundaria de cada resultado y puede cargar el ejercicio publicado directamente por su identificador, sin credenciales.
- Presenta nombre, descripción, categorías comunes, imágenes y enlaces multimedia con el mismo estilo de lectura de la ficha local.
- No muestra observaciones ni acciones para editar o eliminar el ejercicio remoto.
- Incluye "Volver a los resultados" y la acción principal "Importar ejercicio". Esta última usa el mismo flujo de mapeo de categorías y los mismos mensajes de éxito/error que importar desde la lista; tras completar la importación vuelve a `/ejercicios/importar`.
- Estados: carga, no encontrado, error de red con posibilidad de reintentar. Las imágenes de archivo inválidas se omiten en la previsualización y se informa de cuántas no se pudieron mostrar; un error de red al leerlas permite reintentar la carga.

### Diálogo "Asignar categoría" (nuevo, parte de US1)

- Se abre solo si, entre los ejercicios seleccionados, alguna categoría común no coincide por nombre con ninguna categoría propia del usuario (FR-009).
- Muestra una fila por cada categoría común no reconocida (no una fila por ejercicio, para no repetir la misma pregunta si varios ejercicios comparten la misma categoría pendiente de mapear), con un selector (`mat-select`) sobre las categorías propias del usuario.
- Todas las filas deben resolverse antes de habilitar "Continuar"; "Cancelar" cierra el diálogo sin importar nada.
- Si el usuario no tiene ninguna categoría propia, no se abre este diálogo: se muestra directamente un mensaje bloqueante indicando que debe crear antes al menos una categoría, con un acceso directo a "Gestionar categorías" (FR-010).

## Ficha de ejercicio y formulario de edición (ampliación existente, US2)

- `ejercicio-ficha.component` y, en modo edición, `ejercicio-formulario.component`: añaden una acción secundaria "Subir al repositorio común", visible junto al resto de acciones del ejercicio (p. ej. junto a "Editar"/"Eliminar" en la ficha).
- La acción **no se muestra** (no solo deshabilitada) cuando no se cumple alguna condición de disponibilidad, para no exponer una función inalcanzable sin explicación (FR-014/FR-015/FR-021):
  - no hay credenciales de GitHub guardadas, o
  - el ejercicio no tiene ninguna imagen ni ningún enlace de YouTube, o
  - el ejercicio ya tiene `subidoRepositorioComun = true`.
- Al pulsarla, se abre el diálogo "Subir al repositorio común" (nuevo componente, en `biblioteca-ejercicios/`).

### Diálogo "Subir al repositorio común" (nuevo, parte de US2)

Flujo en dos pasos dentro del mismo diálogo (o dos diálogos encadenados, a discreción de implementación, manteniendo el flujo lineal):

1. **Elegir categorías**: lista de categorías comunes con selección múltiple (`mat-selection-list`), exige al menos una marcada para habilitar "Continuar" (FR-016). Si el repositorio común no tiene ninguna categoría publicada, se muestra un estado vacío bloqueante (edge case de `spec.md`).
2. **Confirmar**: tras elegir categorías, se comprueba el nombre duplicado (FR-017):
   - Si ya existe, se sustituye el paso de confirmación por un mensaje de bloqueo ("Ya existe un ejercicio con este nombre en el repositorio común") y una acción para cerrar; no se permite continuar.
   - Si no existe, se muestra el texto de confirmación explícito indicando que la acción no podrá deshacerse ni repetirse para ese ejercicio (FR-018), con "Confirmar y enviar" y "Cancelar".
3. Tras confirmar con éxito: notificación "Ejercicio enviado. Quedará pendiente de revisión antes de publicarse en el catálogo común." (research.md, sección 10); el diálogo se cierra y la acción "Subir al repositorio común" deja de mostrarse para ese ejercicio en adelante (FR-021).
4. Si falla la conexión o la autenticación durante la comprobación o el envío, se muestra el error correspondiente sin marcar el ejercicio como subido y sin cerrar el diálogo, permitiendo reintentar (FR-023).

## Accesibilidad y estilo

Ambas pantallas/diálogos siguen la paleta, tipografía y requisitos de accesibilidad WCAG 2.1 AA ya definidos en FR-044/FR-045 de 001 (sin excepción para esta feature) y los componentes de Angular Material ya usados en el resto de la aplicación, conforme a los estándares de UI/UX del proyecto.
