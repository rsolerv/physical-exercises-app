# Quickstart: Importación y exportación de ejercicios con el repositorio común

Guía de validación manual end-to-end de las dos historias de usuario. No sustituye a las pruebas automatizadas de `tasks.md`; sirve para que una persona no técnica compruebe el comportamiento navegando la aplicación (Constitución, principio III).

## Prerrequisitos

- Aplicación en ejecución (`ng serve` o la build publicada).
- Para probar US1 (importar): ninguno adicional; funciona sin cuenta ni credenciales.
- Para probar US2 (subir): credenciales de GitHub ya guardadas en "Sincronización" (un token de acceso personal con permiso de lectura y escritura de contenidos también sobre `rsolerv/common-data-physical-exercises`, además de tu repositorio privado de datos — ver research.md, sección 3).
- Para probar US3 como administradora: una PAT válida de `rsolerv`, permiso de escritura de contenidos sobre `rsolerv/common-data-physical-exercises` y permisos para actualizar `main`. La aplicación comprueba el `login` con GitHub; una PAT de otra cuenta no acredita el rol.
- Al menos una categoría propia creada (para completar una importación que requiera seleccionar categorías propias, FR-010).
- Un ejercicio propio con nombre, descripción, categoría y al menos una imagen o un enlace de YouTube (para poder subirlo).

## Escenario 1 — Importar ejercicios (US1, happy path)

1. Abrir el menú principal → "Importar ejercicios".
2. Comprobar que se ve un buscador de texto y una lista de categorías del repositorio común con selección única, sin ninguna opción "Todas".
3. Seleccionar una categoría y pulsar "Buscar": comprobar que aparecen sus ejercicios. Al consultar el tráfico de red, verificar que se descargan documentos por id bajo `ejercicios/<id>/<id>.json` y que no se solicita un listado del directorio (FR-004).
4. Marcar la casilla de uno o varios ejercicios: comprobar que aparece el botón "Importar" con el recuento de seleccionados (FR-005, FR-006).
5. Pulsar "Importar":
   - Si alguna categoría de los ejercicios seleccionados no coincide con ninguna categoría propia, comprobar que aparece un único selector múltiple de categorías propias (en un diálogo o en la pantalla). Elegir dos categorías y continuar; comprobar que esas dos categorías quedan asociadas a todos los ejercicios seleccionados, sustituyendo sus categorías comunes originales (FR-009).
   - Si todas las categorías coinciden por nombre, comprobar que no aparece el selector y que se conservan las categorías propias correspondientes.
   - Comprobar la notificación de éxito con el número de ejercicios importados.
6. Ir a "Buscar" y comprobar que los ejercicios importados aparecen en la biblioteca propia, con su descripción, enlaces e imágenes, y con la categoría sustituida cuando correspondía (SC-002).

## Escenario 2 — Importar sin categorías propias (edge case)

1. Con una cuenta/instalación sin ninguna categoría propia creada, repetir los pasos 1–4 del escenario 1.
2. Pulsar "Importar": comprobar que la aplicación bloquea la importación con un mensaje indicando crear antes al menos una categoría (FR-010), sin aplicar ningún cambio.

## Escenario 3 — Subir un ejercicio elegible (US2, happy path)

1. Abrir la ficha (o la edición) de un ejercicio propio que cumpla los requisitos mínimos.
2. Comprobar que la acción "Subir al repositorio común" está disponible.
3. Pulsarla: elegir una o varias categorías comunes (FR-016) y pulsar "Continuar".
4. Comprobar el texto de confirmación que advierte de que la acción no se puede deshacer ni repetir (FR-018); pulsar "Confirmar y enviar".
5. Comprobar la notificación "Ejercicio enviado. Quedará pendiente de revisión..." (research.md, sección 10).
6. Volver a abrir la ficha del mismo ejercicio: comprobar que la acción "Subir al repositorio común" ya no está disponible (FR-021), incluso tras recargar la aplicación.
7. Comprobar en la rama `requests` que el JSON mantiene su formato actual bajo `ejercicios/<id>/<id>.json`, sus imágenes están en `ejercicios/<id>/imagenes/` y `categorias.json` incluye el id en las categorías seleccionadas (FR-019, FR-025).

## Escenario 4 — Bloqueos de disponibilidad (US2, edge cases)

1. Sin credenciales de GitHub guardadas: abrir la ficha de cualquier ejercicio propio y comprobar que la acción "Subir al repositorio común" no aparece (FR-014).
2. Con credenciales guardadas pero un ejercicio sin ninguna imagen ni ningún enlace de YouTube: comprobar que la acción tampoco aparece en su ficha (FR-015).
3. Intentar subir un ejercicio cuyo nombre (ignorando mayúsculas y espacios) ya exista en el repositorio común: comprobar que se bloquea antes de pedir confirmación, con un mensaje explicativo, y que no se envía nada (FR-017, SC-004).
4. Cancelar la confirmación de una subida: comprobar que no se envía nada y que la acción sigue disponible para ese ejercicio (FR-022).

## Escenario 5 — Administrar la marca local y borrar del catálogo (US3)

1. Con la PAT de `rsolerv` guardada, abrir la ficha de un ejercicio propio cuya marca de subida sea `true`: comprobar que aparece "Quitar marca de subida". Activarla y verificar que la marca pasa a `false` y la disponibilidad de subida vuelve a evaluarse.
2. Abrir "Importar ejercicios" y buscar un ejercicio común. Comprobar que aparece "Borrar del repositorio común" en el resultado y en su ficha.
3. Pulsar "Borrar" y cancelar: comprobar que el ejercicio permanece.
4. Repetir y confirmar: comprobar que el ejercicio y todos los ficheros bajo `ejercicios/<id>/` desaparecen de `main`, se retiran sus ids de todas las categorías de `categorias.json` y la lista actual deja de mostrarlo (FR-028).
5. Guardar una PAT de otra cuenta o quitar la PAT, volver a las mismas pantallas y comprobar que las acciones administrativas no aparecen. Si GitHub no está disponible al verificar la identidad, debe mostrarse un aviso y mantenerse ocultas.

## Verificación cruzada

- Comprobar en todo momento que las planificaciones, el progreso diario y los ajustes propios del usuario no aparecen en ningún momento del flujo de importar/subir (FR-013).
- Comprobar que cortar la conexión a internet durante una búsqueda, una importación o una subida muestra un error comprensible sin perder datos locales ni dejar cambios a medias (FR-023).

## Referencias

- Requisitos funcionales completos: [spec.md](./spec.md).
- Formato de los documentos remotos y decisiones técnicas: [research.md](./research.md), [data-model.md](./data-model.md).
- Detalle de pantallas y diálogos: [contracts/interfaz-usuario.md](./contracts/interfaz-usuario.md).
