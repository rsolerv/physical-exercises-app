# Propuesta de rediseño completa


Este documento reúne en un solo sitio todas las soluciones que hemos ido proponiendo. Cuando alguna se contradecía, aplico la versión más reciente.

## 0. Dirección visual

Combina la dirección **E (Material Expressive bien hecho)** con el **tono cálido de la A (Calma clínica)**.

- **Por qué esta:** mantiene Angular Material, como piden vuestros estándares, pero con una identidad propia en lugar de los valores por defecto.
- **Sensación buscada:** «Una app moderna y coherente que me cuida». Calmada, legible a distancia y orientada a hacer los ejercicios de hoy.

---

## 1. Sistema de diseño

### 1.1 Color

| Token | Valor | Uso |
|---|---|---|
| Fondo | `#F6F3EE` | Fondo general (hueso cálido) |
| Superficie | `#FFFFFF` | Tarjetas, menús, desplegables |
| Borde | `#E4DED4` | Tarjetas, separadores, campos |
| Texto | `#161D1D` | Texto principal |
| Primario | `#00696B` | Acción principal, enlaces, página activa |
| Primario suave | `#D7EEEC` | Fondos amplios: página activa, fila seleccionada, día de hoy, opción resaltada |
| Contenedor primario | `#9CF1F0` | Solo elementos pequeños: insignias, check |
| Terciario | `#4A6380` / contenedor `#D2E4FF` | Información secundaria, etiquetas |
| Éxito | verde de éxito | Progreso, completado |
| Descanso | neutro cálido | Día sin ejercicios |
| Error / destructivo | `#BA1A1A` | Errores y acciones destructivas |

Los tonos de éxito y descanso todavía no tienen código asignado: hay que fijarlos al generar el tema.

**Reglas de color**

- **Una sola acción con relleno de color por pantalla.** El resto va con contorno, como botón de texto o con tono suave.
- **La selección siempre se ve claramente:** fondo sólido más un indicador (check o barra lateral de 3 px), con contraste de al menos 3:1 respecto al fondo.
- **Nada de opacidad para dar significado.** Lo vacío no se muestra atenuado, porque eso parece deshabilitado.
- Desaparecen el lavanda por defecto y las tarjetas grises.

### 1.2 Tipografía

La fuente es **Roboto Flex** (variable), con **números tabulares** en porcentajes, contadores y fechas.

| Estilo | Tamaño / interlineado | Peso | Uso |
|---|---|---|---|
| Display | 32/40 | 600 | Solo el título de «Hoy» |
| Título de página | 22/28 | 600 | Planificación, Buscar, Editar, Categorías, Sincronización |
| Sección | 16/24 | 600 | «Lunes», «Datos básicos», nombre de ejercicio en tarjetas |
| Lectura | 16/26, máx. 65 caracteres por línea | 400 | Descripciones e instrucciones de ejercicios |
| Cuerpo | 14/20 | 400 | Texto general y formularios |
| Metadato | 12/16 | 500 | Fechas, contadores, ayudas, categorías |

**Reglas tipográficas**

- **Un solo título por pantalla.** La barra superior muestra el título de la página, no «Gestión de Ejercicios Físicos». La marca solo aparece en la navegación lateral.
- **El mismo elemento lleva el mismo estilo en todas las pantallas.** Por ejemplo, «Lunes» siempre va en estilo Sección.
- **Títulos de sección sin aclaraciones técnicas.** «Imágenes (URL o archivo, máximo 5 MB)» pasa a ser «Imágenes», con la ayuda «URL o archivo · máx. 5 MB» debajo en estilo Metadato.
- **Fechas legibles:** «Semana del 2026-10-19» pasa a «19–25 oct», y la pantalla «Hoy» muestra «Martes, 20 de octubre».

### 1.3 Espaciado y tamaños

- **Rejilla de 8 px.**
- **Márgenes laterales:** 16 px en móvil, 24 px en tablet y 32 px en escritorio. Todo el contenido de una pantalla se alinea al mismo borde izquierdo.
- **Ritmo vertical:** 8 px entre elementos relacionados, 16 px de relleno dentro de las tarjetas, 24 px entre secciones y 32 px entre bloques.
- **De la barra superior al título:** entre 16 y 24 px.
- **Altura de los controles:** 48 px en móvil y 40 px en escritorio, igual para todos los controles de una misma fila. En las pantallas que se usan durante el ejercicio (Hoy y Ficha), el área táctil sube a 56 px.
- **Anchos máximos:** 720 px para formularios, 640 px para listas de gestión y 65 caracteres para textos largos.

### 1.4 Formas

Hay solo **tres radios de esquina:**

- **8 px:** chips y campos.
- **16 px:** tarjetas y medios.
- **Píldora:** botones.

### 1.5 Componentes

**Navegación según el dispositivo**

| Dispositivo | Navegación |
|---|---|
| Móvil | Barra inferior: *Hoy · Planificación · Buscar · Más*. «Más» abre un panel inferior con Categorías, Sincronización (con su estado, por ejemplo «Hace 2 h ✓») y la versión de la app. |
| Tablet | Riel lateral de 80 px. |
| Escritorio | Menú lateral fijo, con logo y nombre corto de la app, agrupado en: *Entrenar* (Hoy, Planificación), *Biblioteca* (Buscar, Categorías) y *Sistema* (Sincronización). |

- **«Nuevo ejercicio»** pasa a ser un botón flotante (FAB) en móvil y un botón destacado arriba del menú lateral en escritorio.
- **Un único indicador de página activa:** fondo primario suave, texto e icono en primario y 12 px de margen lateral. La píldora no toca los bordes.
- **La hamburguesa solo aparece cuando la navegación está oculta.**

**Botones**

- **Jerarquía:** relleno (uno por pantalla) › tono suave › contorno › texto.
- **En escritorio, el botón mide lo que su texto.** Solo ocupa todo el ancho en móvil, dentro de barras de acción fijas.
- **Las acciones destructivas** van como botón de texto o en el menú ⋮, en rojo `#BA1A1A`, nunca al lado de la acción principal.
- **En vez de modales de confirmación**, el borrado se hace al momento y aparece un aviso con «Deshacer».

**Chips**

- Se usan **solo como filtros o etiquetas**, nunca como enlaces.
- Un único tamaño: 32 px visibles con 48 px de área táctil.
- Los filtros van en una sola fila desplazable que empieza por «Todas».

**Listas**

- Filas de 48 px o más, con miniatura de 48–56 px, título en estilo Sección, metadatos y una flecha (›) cuando la fila lleva a otra pantalla.
- En escritorio, las acciones de cada fila aparecen al pasar el ratón; en móvil, en un menú ⋮.

**Selector de ejercicios**

- **Un único selector con búsqueda** sustituye a los 7 desplegables (uno por día). En escritorio es un autocompletado; en móvil, un panel inferior («Añadir a Lunes») con búsqueda y filtro por categoría.
- El desplegable usa superficie blanca y la opción resaltada lleva fondo primario suave.

**Medios (imágenes y vídeos)**

- Proporción fija: 16:9 para vídeo y 1:1 para miniaturas.
- Esquinas de 16 px, fondo neutro y la imagen ajustada sin recortes.
- **Vídeos:** se muestra una miniatura con ▶, la plataforma y el autor. El reproductor solo se carga al pulsar.

**Enlaces**

- Se muestran con vista previa (miniatura y título).
- El tipo (web o YouTube) se detecta automáticamente a partir de la URL, así que desaparece el selector «Web | YouTube».

**Campos de formulario**

- Un solo borde, sin la línea interior extra que se ve ahora.
- El autorrelleno del navegador usa el color de superficie del tema, en vez del azul `#E8F0FE`.

**Etiquetas de estado:** «Activa», «Plantilla», «Hoy», «Descanso» y «Categoría del sistema».

### 1.6 Estados

| Situación | Comportamiento |
|---|---|
| Foco y pulsación | Solo aparecen al pasar el ratón o al navegar con teclado. Se acaba el círculo gris permanente. |
| Carga | Esqueletos con la forma del contenido final, sin ruedita de carga ni parpadeos. |
| Día sin ejercicios | «Descanso», con icono y opacidad completa. |
| Día actual | Fondo primario suave y etiqueta «Hoy». |
| Progreso | 0%: «Empieza por el primero». A medias: «2 de 3». 100%: celebración (check grande, color de éxito y mensaje). |
| Marcar un ejercicio | Check animado y aviso con «Deshacer». |
| Borrado | Se hace al momento y aparece un aviso con «Deshacer». |
| Formularios | Errores debajo de cada campo, campos opcionales marcados como «(opcional)» y estados visibles de «Cambios sin guardar», «Guardando…» y «Guardado». |
| Sincronización | Sincronizado, Sin configurar, Sincronizando (con barra de progreso), Error (con el motivo) y Conflictos (con enlace directo). |

---

## 2. Pantallas

### 2.1 Hoy (móvil)

- **Cabecera:** «Martes, 20 de octubre», el nombre del plan y «1 de 3 ejercicios», junto a un indicador de progreso grande y en color.
- **Cada ejercicio es una tarjeta:** miniatura, nombre en estilo Sección y categorías. Toda la tarjeta abre la ficha, con un check de 56 px a la derecha.
- Se eliminan el botón «Consultar» y «Ver planificación semanal», porque esto último ya está en la navegación.
- **Si el día está vacío**, se muestra la próxima sesión.
- Todo cabe en una pantalla, sin hacer scroll.

### 2.2 Planificación semanal

- **Selector de plan en la cabecera** («prueba ▾ · Activa»). Sustituye a la lista de planes y elimina el «prueba» duplicado. Cada plan lleva su etiqueta «Activa» o «Plantilla».
- **«Nueva planificación»** pasa a acción secundaria.
- **En móvil**, una tira de 7 días (L M X J V S D) con un punto en los días con ejercicios y «Hoy» resaltado. Debajo, la lista del día seleccionado. La semana entera se consulta en una sola pantalla, sin scroll.
- **En escritorio**, una rejilla de 7 columnas con filas compactas.
- Los ejercicios se muestran como filas de lista enlazadas, no como chips. Los días vacíos aparecen como «Descanso».

### 2.3 Constructor de planificación

- Usa la misma tira de días en móvil y la misma rejilla en escritorio que el calendario, con los mismos estilos.
- Los ejercicios de cada día son filas con «✕» para quitarlos.
- **Un único botón «Añadir ejercicio»** por día, que abre el selector con búsqueda.
- **Barra de acciones fija** con «Guardar» (principal) y el estado del formulario. «Duplicar» pasa al menú ⋮.

### 2.4 Buscar

- **Barra superior fija:** buscador, fila de filtros desplazable (empezando por «Todas») y el número de resultados («14 resultados»).
- **Cada resultado:** miniatura, nombre, dos líneas de descripción, etiquetas de categoría, el texto buscado resaltado y una flecha (›).
- **En móvil**, los resultados empiezan hacia los 180 px (ahora a unos 480 px), así que se ven unos 6 en vez de 2,5.
- **En escritorio, diseño maestro-detalle:** la lista a la izquierda (unos 420 px) y la vista previa de la ficha a la derecha.

### 2.5 Ficha del ejercicio

- **Barra superior:** «‹ Volver» a la izquierda y, a la derecha, ✏️ y el menú ⋮ con «Eliminar» en rojo.
- **Imagen o vídeo principal** arriba, en 16:9 y a todo el ancho. Si hay varios, se deslizan con un contador («1/3»).
- **Bajo el título, los datos clave en grande:** **2 × 10 repeticiones** en estilo Sección con fondo primario suave, y al lado las categorías.
- **Descripción** en estilo Lectura.
- **Vídeos** como miniatura con ▶ y debajo «YouTube · FisioDual». **Imágenes** en una cuadrícula de 2 columnas que se abren a pantalla completa.
- **Si el ejercicio está planificado para hoy**, aparece abajo una barra fija con «Marcar como hecho».

### 2.6 Editar ejercicio

- **Ruta de navegación** «Ejercicios › Apretar pelota contra pared» y **barra de acciones fija** con «Guardar» (principal), «Cancelar» y el estado del formulario.
- **En escritorio, dos columnas:** el formulario (máximo 720 px) a la izquierda y la vista previa de la ficha a la derecha. Cada campo tiene el ancho que su contenido necesita.
- **Secciones:** «Datos básicos», «Categorías», «Enlaces», «Imágenes», con los títulos limpios y la ayuda debajo.
- **Categorías** en una sola fila de chips.
- **Enlaces:** se pega la URL y el tipo se detecta solo. Cada enlace añadido muestra su vista previa con «✕» para quitarlo.
- Todos los controles de una misma fila tienen la misma altura.

### 2.7 Categorías

- **Cabecera:** «Categorías» con el contador «8 categorías». Justo debajo, el campo «Nueva categoría» con el botón **Añadir** en la misma línea, que también se activa con Enter.
- **Lista en una tarjeta** de 640 px como máximo. Cada fila muestra el nombre y el número de ejercicios («12 ejercicios»).
- **Edición en línea:** el nombre se convierte en un campo dentro de la misma fila, con ✓ y ✕. Enter guarda y Esc cancela.
- **Borrado:** aviso *«Lumbar eliminada · 3 ejercicios pasan a Sin categoría · Deshacer»*.
- **«Sin categoría»** va en la última fila, separada por una línea, con 🔒 y el texto «Categoría del sistema».

### 2.8 Sincronización

- **Tarjeta de estado arriba:** estado con icono, repositorio y una única acción principal, **Sincronizar ahora**. Mientras sincroniza muestra una barra de progreso; si hay conflictos, un enlace directo a la pantalla de conflictos.
- **Sección desplegable «Configuración de GitHub»:** aparece abierta si no hay nada configurado y plegada si ya lo está. Contiene:
  - pasos numerados con enlaces directos («Crear repositorio ↗», «Crear token ↗») y el nombre sugerido con un botón de copiar;
  - el campo del repositorio, con el prefijo `github.com/`;
  - el campo del token, con 👁 para mostrar u ocultar. Una vez guardado, muestra «Token guardado ···· a3F9»;
  - «Guardar» como botón de tono suave y «Olvidar token» como botón de texto rojo, separado a la derecha.

---

## 3. Orden de implementación

1. **Cambios rápidos de apariencia** (no cambian el comportamiento):
   - estilos compartidos (color, tipografía, espaciado, formas);
   - indicador único de página activa;
   - ancho de los botones según su texto;
   - nivel destructivo en rojo;
   - estilos Lectura y Medios;
   - limpieza de los campos;
   - fechas legibles;
   - foco solo con ratón o teclado;
   - «Descanso» en lugar de opacidad;
   - esqueletos de carga.
2. **Rediseño de pantallas:** Hoy, Planificación y constructor (tira semanal), Buscar (maestro-detalle), Ficha, Editar (dos columnas), Categorías (edición en línea) y Sincronización (tarjeta de estado).
3. **Cambios estructurales:**
   - barra inferior con «Más» y botón flotante;
   - selector único de ejercicios;
   - vista previa de enlaces con detección automática;
   - «Deshacer» en lugar de confirmaciones;
   - «Marcar como hecho» desde la ficha.

**Documentación:** según el modelo Living Spec del proyecto, las fases 2 y 3 cambian el comportamiento, así que hay que actualizar antes [spec.md](./001-gestion-ejercicios-fisicos/spec.md). El sistema de diseño (sección 1) es una decisión común a todas las pantallas, así que debe quedar registrado en [research.md](./001-gestion-ejercicios-fisicos/research.md).
