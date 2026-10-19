# Quickstart: Validación de Gestión de Ejercicios Físicos y Planificación Semanal

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Modelo de datos**: [data-model.md](./data-model.md)

Esta guía permite validar manualmente, navegando por la interfaz de la aplicación (sin leer código, logs ni la base SQLite), que cada historia de usuario del spec funciona de extremo a extremo. Está pensada para que la siga una persona sin conocimientos de programación, tal como exige el Principio III de la constitución.

## Requisitos previos

- La aplicación compilada y servida localmente (ver comandos de ejecución más abajo) o ya publicada en GitHub Pages, abierta en un navegador de escritorio o móvil.
- Para validar la historia de usuario 5 (sincronización): una cuenta de GitHub; un repositorio **privado** y vacío dedicado solo a los datos (por ejemplo, `data-physical-exercises`), distinto del repositorio público donde se publica la aplicación; un token *fine-grained* limitado solo a ese repositorio de datos con permiso de lectura y escritura de contenidos (la pantalla de configuración de la app explica cómo crearlo); y **dos navegadores distintos** (o un navegador normal y una ventana de otro perfil) para simular dos dispositivos. No es necesario para validar las historias 1 a 4.

## Puesta en marcha (para quien ejecuta la validación localmente)

```powershell
npm install
npm start            # sirve la aplicación en local (ng serve)
npm test             # ejecuta la batería de pruebas automatizadas con Vitest
```

Abrir la URL local indicada por `npm start` en el navegador. En el primer arranque, la aplicación debe cargar sola, sin pasos adicionales, el catálogo de ejercicios predefinidos y la categoría genérica "Sin categoría" (FR-034).

## US1 — Gestionar la biblioteca personal de ejercicios (P1)

1. Abrir la aplicación por primera vez. **Esperado**: ya existen ejercicios predefinidos visibles en la biblioteca, sin haber creado ninguno manualmente (escenario 7 / FR-034).
2. Crear una categoría nueva, p. ej. "Cuello", indicando solo el nombre. **Esperado**: aparece inmediatamente disponible para asignarla a un ejercicio (escenario 1).
3. Crear un ejercicio nuevo indicando nombre, descripción y la categoría "Cuello". **Esperado**: se guarda y aparece al consultar la biblioteca (escenario 2).
4. Editar ese ejercicio cambiando su descripción y añadiendo una observación. **Esperado**: los cambios se conservan al volver a abrir la ficha del ejercicio (escenario 3).
5. Intentar crear otra categoría llamada también "Cuello". **Esperado**: la aplicación rechaza la operación e indica que el nombre ya existe (escenario 4).
6. Intentar guardar un ejercicio con un enlace con formato incorrecto (p. ej. escribir `ejercicio1` en el campo de enlace). **Esperado**: la aplicación rechaza el enlace e indica que el formato no es válido (escenario 6).
7. Eliminar la categoría "Cuello" (que ya tiene el ejercicio del paso 3 asociado). **Esperado**: la categoría desaparece; el ejercicio conserva sus demás categorías si tenía más de una, o pasa a mostrar la categoría "Sin categoría" si esa era la única que tenía (escenario 5).
8. Intentar eliminar la categoría "Sin categoría". **Esperado**: la aplicación lo impide.
9. Abrir "Gestionar categorías", cambiar el nombre de "Cuello" (o de otra categoría no genérica) y guardar. **Esperado**: la lista refleja el nuevo nombre y muestra una confirmación junto a la categoría; si el nombre ya existe, el error aparece junto al formulario de edición.
10. Mientras se abre la gestión de categorías, comprobar que se indica que están cargando; tras terminar, se muestra el listado.
11. En la ficha de un ejercicio con imagen, probar una imagen cuyo destino ya no esté disponible. **Esperado**: aparece un aviso junto a la imagen y el nombre, la descripción y el resto de la ficha siguen visibles.

## US2 — Buscar y consultar ejercicios (P2)

1. Con varios ejercicios ya creados en distintas categorías, seleccionar una categoría concreta. **Esperado**: solo se muestran los ejercicios de esa categoría (escenario 1).
2. Escribir parte del nombre de un ejercicio conocido en el buscador de texto. **Esperado**: el ejercicio aparece entre los resultados (escenario 2).
3. Abrir un ejercicio que tenga un enlace de YouTube válido. **Esperado**: el vídeo se reproduce embebido dentro de la propia aplicación, sin abrir YouTube en otra pestaña (escenario 3).
4. Seleccionar una categoría sin ejercicios asociados. **Esperado**: se muestra una lista vacía con un mensaje indicándolo, no un error (escenario 4).

## US3 — Planificar la semana de ejercicios (P3)

1. Crear una planificación semanal nueva con fecha de inicio en el lunes de la semana actual, y asignar 2-3 ejercicios a distintos días. **Esperado**: al consultarla, se ven claramente los ejercicios de cada día (escenario 1).
2. Volver a la pantalla principal / abrir la aplicación de nuevo. **Esperado**: se muestra en primer lugar la planificación de hoy, sin tener que buscarla manualmente (escenario 2), porque su fecha de inicio hace que se considere "activa" automáticamente para la semana en curso.
3. Si no se ha creado ninguna planificación para la semana actual, abrir la aplicación. **Esperado**: mensaje indicando que no hay ejercicios programados para hoy (escenario 3).
4. Duplicar la planificación creada en el paso 1. **Esperado**: se genera una copia independiente con los mismos ejercicios y días (escenario 4).
5. Crear una plantilla (sin fecha de inicio) y después usarla para generar una planificación concreta asignándole una fecha. **Esperado**: la nueva planificación concreta conserva los ejercicios y días de la plantilla (escenario 5).
6. Intentar añadir el mismo ejercicio dos veces al mismo día de la misma planificación. **Esperado**: la aplicación lo impide (escenario 6).
7. Con la planificación del paso 1 ya activa para la semana actual, intentar crear otra planificación concreta con fecha de inicio también en la semana actual. **Esperado**: la aplicación lo impide (escenario 7).
8. Consultar todos los ejercicios de una planificación concreta, sin filtrar por día. **Esperado**: se listan todos, independientemente del día al que estén asociados (escenario 9).
9. Desde “Hoy”, activar “Consultar” en uno de los ejercicios planificados. **Esperado**: se abre la ficha del ejercicio elegido sin buscarlo en la biblioteca; consultar no cambia su estado de progreso. Comprobar que el enlace se alcanza y activa con teclado, y que es un control separado de la casilla para marcarlo como realizado; repetir la acción mediante tacto (escenario 11, FR-048, SC-015).

## US4 — Marcar el progreso diario (P4)

1. Con ejercicios planificados para hoy, marcar uno de ellos como realizado. **Esperado**: su estado cambia visualmente y se mantiene al volver a consultar el día (escenario 1).
2. Marcar todos los ejercicios del día como realizados. **Esperado**: el indicador de progreso muestra el 100% (escenario 2).
3. Dejar solo una parte de los ejercicios del día marcados como realizados. **Esperado**: el indicador de progreso muestra el porcentaje correspondiente, no 0% ni 100% (escenario 3).

## US5 — Conservar y sincronizar la información (P5)

En esta sección, "navegador A" y "navegador B" son dos navegadores distintos (o dos perfiles) que simulan dos dispositivos. Nada de lo que sigue requiere entrar en GitHub: todo se comprueba en la pantalla de la aplicación.

1. Crear o modificar cualquier dato (un ejercicio, una categoría, etc.), cerrar completamente la aplicación/pestaña y volver a abrirla. **Esperado**: todos los datos siguen disponibles (escenario 1).
2. En el navegador A, con varios datos creados (incluida al menos una imagen subida como archivo), ir a la pantalla de sincronización, introducir el token y el repositorio, y sincronizar. **Esperado**: mensaje de sincronización completada. Después, en el navegador B, abrir la aplicación, configurar el mismo token y repositorio y sincronizar. **Esperado**: como es la primera sincronización de B y GitHub ya tiene datos, aparece la elección entre datos locales y remotos con "Usar los datos de GitHub" marcada; al aceptarla, B muestra los mismos ejercicios, imágenes, categorías, planificaciones y progreso que A (escenarios 2 y 6).
3. En A, editar un ejercicio y sincronizar. En B, sin tocar nada, sincronizar. **Esperado**: B muestra el cambio sin que aparezca ninguna pantalla de conflicto (escenario 7).
4. Editar el mismo ejercicio de forma distinta en A y en B, sin sincronizar entre medias. Sincronizar A y después B. **Esperado**: en B aparece la pantalla de conflicto para elegir entre la versión local y la remota; tras elegir, B muestra la versión elegida, y al sincronizar de nuevo A también la muestra (escenario 5).
5. Simular que GitHub no está disponible (p. ej. desconectando la red) e intentar sincronizar. **Esperado**: los datos permanecen localmente sin pérdida y se muestra un mensaje de error de sincronización (escenario 3).
6. Eliminar un ejercicio que esté asociado a varias planificaciones. **Esperado**: desaparece de todas ellas (escenario 4).
7. En la pantalla de sincronización, comprobar que el token aparece oculto y pulsar "Olvidar token". **Esperado**: el token deja de estar configurado y, al intentar sincronizar, la aplicación pide configurarlo de nuevo (FR-037).

## US6 — Usar una aplicación clara, coherente y accesible (P1)

1. Abrir las pantallas funcionales de Hoy, Mis ejercicios, Buscar, Planificación, Sincronización y sus formularios/fichas principales. **Esperado**: cada pantalla tiene título visible y las acciones disponibles aparecen en la cabecera cuando corresponda.
2. En una ventana de 599 px o menos, abrir el menú desde el botón superior. **Esperado**: el menú se superpone al contenido, lo cubre sin comprimirlo y se cierra al elegir una sección.
3. Repetir en 600 px, 768 px y 1280 px. **Esperado**: el panel lateral se adapta al ancho, la sección seleccionada se distingue y el contenido permanece legible.
4. Recorrer con Tab y Mayús+Tab los flujos principales de creación, edición, eliminación y navegación. **Esperado**: todos los controles se alcanzan en orden lógico, se pueden activar con teclado y el foco siempre es visible.
5. Redimensionar entre móvil, tablet, escritorio y anchos intermedios, incluyendo 320 px, 359 px, 375 px y 599 px. **Esperado**: no hay solapamientos, texto cortado ni desplazamiento horizontal; los botones principales de Material (rellenos, contorneados y solo icono) en móvil tienen un área táctil mínima de 48 × 48 px.
6. Comprobar contraste de texto normal (≥4,5:1), texto grande e iconos funcionales (≥3:1) y foco de cada tipo de control interactivo.

## Casos límite adicionales a comprobar

- Sin ningún ejercicio registrado (instalación recién reseteada, antes de que se cargue el catálogo, o tras borrarlos todos manualmente si la implementación lo permite): se muestra un mensaje indicando que no hay ejercicios, no una pantalla vacía sin explicación.
- Un vídeo de YouTube asociado a un ejercicio ya no existe: el ejercicio se sigue mostrando con el resto de su información, indicando que el vídeo no está disponible.
- Una imagen de la ficha no carga: se indica el problema y se conservan visibles los demás datos.
- Intentar añadir a un ejercicio una imagen de archivo de más de 5 MB: se rechaza con un mensaje que indica el tamaño máximo (FR-036).
- Intentar crear una planificación concreta para un lunes que ya tiene otra planificación: la aplicación lo impide (FR-017, FR-022).

## Criterio de aceptación global

La validación se considera superada cuando se han recorrido las seis historias de usuario anteriores sin desviaciones respecto al resultado "Esperado" de cada paso, y sin haber necesitado en ningún momento consultar código fuente, logs o el contenido de la base SQLite directamente.
