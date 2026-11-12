# Contrato de interfaz de usuario y privacidad: Distribución Android y Google Play

**Feature**: [spec.md](../spec.md) | **Plan**: [plan.md](../plan.md) | **Contrato general**: [interfaz-usuario.md de la feature 001](../../001-gestion-ejercicios-fisicos/contracts/interfaz-usuario.md)

Define los ajustes de presentación y del documento público de privacidad necesarios para cumplir las historias 1, 3 y 4 (FR-002, FR-003, FR-010, FR-011, FR-015 y SC-005) sin rediseñar pantallas existentes ni introducir flujos nuevos.

---

## 1. Evaluación del Principio V (Storybook)

Conforme al Principio V de la [constitución](../../../.specify/memory/constitution.md) y a [ux-ui.instructions.md](../../../.github/instructions/ux-ui.instructions.md):
- Esta feature **no crea ninguna pantalla Angular nueva, no rediseña pantallas existentes ni altera la estructura visual o de navegación**.
- Reutiliza el documento estático ya existente `public/politica-privacidad.html` y añade únicamente un enlace de texto accesible (`"Política de privacidad"`) en el marco de navegación y en la sección de privacidad de Sincronización.
- Por tratarse de un ajuste puntual de enlace y texto informativo que no altera la estructura ni el flujo, **no requiere un ciclo de prototipado y aprobación de pantalla nueva en Storybook**; las historias existentes deben seguir compilando sin errores (`npm run build-storybook`).

---

## 2. Acceso a la Política de Privacidad en ≤ 2 acciones (FR-011, SC-005)

La persona usuaria debe poder abrir `politica-privacidad.html` sin identificarse y en un máximo de dos acciones desde cualquier punto de entrada:

| Punto de entrada | Ubicación del enlace | Texto visible | Ruta / Destino | Nº máximo de acciones |
|---|---|---|---|---|
| **Móvil (≤ 599 px)** | Panel inferior `"Más opciones"` (`PanelMasComponent` en `shell.component.ts`) | `Política de privacidad` (con icono `policy` o `privacy_tip`) | `politica-privacidad.html` | **2 acciones**: pulsar `Más` en la barra inferior → pulsar `Política de privacidad` |
| **Tablet (600–1279 px)** | Pie del riel lateral (`shell.component.html`) | Botón de icono con `aria-label="Política de privacidad"` y `matTooltip="Política de privacidad"` | `politica-privacidad.html` | **1 acción** desde cualquier pantalla |
| **Escritorio (≥ 1280 px)** | Pie del menú lateral (`shell.component.html`) | `Política de privacidad` | `politica-privacidad.html` | **1 acción** desde cualquier pantalla |
| **Pantalla Sincronización** | Bloque de información de privacidad en `configuracion-sincronizacion.component.html` | `Consultar la política de privacidad` | `politica-privacidad.html` | **1 acción** desde Sincronización (2 desde otra pantalla) |
| **Ficha de Google Play** | Enlace de Política de privacidad en la ficha de la tienda | Enlace estándar de Google Play en español | `https://rsolerv.github.io/physical-exercises-app/politica-privacidad.html` | **1–2 acciones** desde la ficha de la tienda sin iniciar sesión |

### Reglas de navegación del enlace

- El enlace a `politica-privacidad.html` apunta al recurso del mismo origen (`https://rsolerv.github.io/physical-exercises-app/politica-privacidad.html`), por lo que en Android TWA se abre dentro de la propia actividad sin barras del navegador y su enlace inferior `"Volver a Physical Exercises"` (`href="./"`) regresa a la pantalla principal de la aplicación.
- Cumple el área táctil mínima de 48 × 48 px en móvil y tablet y foco visible por teclado (`:focus-visible`).

---

## 3. Contenido obligatorio de `public/politica-privacidad.html` (FR-010, FR-011, Historia 4)

El documento `public/politica-privacidad.html` conserva su estructura clara en español de España y su estilo legible, actualizando su contenido para cubrir de forma verificable todos los tratamientos reales vigentes:

1. **Dónde se conservan los datos**:
   - En el almacenamiento local del navegador del dispositivo mediante SQLite en el navegador, tanto si se accede desde la web como desde la aplicación Android instalada (que abre la misma aplicación web en el navegador compatible del dispositivo y no crea una base de datos aparte ni envía los datos a un servidor propio).
2. **Qué envíos realiza cada función existente**:
   - **Uso local y copia manual (ZIP/JSON)**: no realiza envíos a servidores externos.
   - **Sincronización opcional con Google Drive**: comunicación directa entre el navegador y Google con permiso exclusivo `drive.appdata` (espacio privado de la aplicación).
   - **Sincronización opcional con repositorio privado de GitHub**: comunicación directa entre el navegador y la API de GitHub con el token personal configurado por la persona.
   - **Catálogo público común de ejercicios (feature 003)**: consulta pública del repositorio `rsolerv/common-data-physical-exercises` al abrir «Importar ejercicios» y, solo cuando la persona pulsa explícitamente «Subir al repositorio común» sobre un ejercicio concreto, envío de ese ejercicio y sus imágenes asociadas usando su token de GitHub.
   - **Recursos externos e hipervínculos**: carga de tipografías/iconos de Google Fonts y apertura bajo acción explícita de vídeos de YouTube o enlaces externos incluidos en las fichas.
3. **Cómo retirar accesos**:
   - Desconectar la cuenta de Google en «Sincronización» y/o retirar el permiso en la cuenta de Google.
   - Pulsar «Olvidar token» en «Sincronización» y/o revocar el token en GitHub.
4. **Cómo eliminar los datos**:
   - Borrar ejercicios, categorías o planificaciones desde la aplicación, o borrar los datos del sitio en los ajustes del navegador / de la aplicación en Android.
   - Eliminar la copia del espacio de aplicaciones de Google Drive o del repositorio de GitHub controlado por la persona.

---

## 4. Adaptación visual en Android TWA (FR-002, FR-003, FR-015)

- La aplicación mantiene `env(safe-area-inset-bottom)` en la barra inferior móvil (`shell.component.scss`) y en el panel `"Más opciones"` (`shell.component.ts`), evitando que la barra de gestos o los botones del sistema de Android tapen controles esenciales.
- No se ocultan la barra de estado superior ni la barra de navegación del sistema Android (FR-002); el color de tema (`#00696b`) y el color de navegación (`#f6f3ee`) se integran con el tema claro de la aplicación.
- El botón o gesto **Atrás** de Android recorre el historial del enrutador de Angular (por ejemplo, de la ficha de un ejercicio de vuelta a Buscar) y cierra la actividad al encontrarse en la vista inicial sin historial previo, sin atrapar a la persona (FR-003).
