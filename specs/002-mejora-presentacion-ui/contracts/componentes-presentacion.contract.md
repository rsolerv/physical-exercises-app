# UI Contract: Componentes de presentación compartidos

**Feature**: [../spec.md](../spec.md) · **Plan**: [../plan.md](../plan.md) · **Data model**: [../data-model.md](../data-model.md)

Define la API pública (`@Input`/`@Output`/contenido proyectado) de los dos componentes nuevos de `presentation/compartido/ui/`. Ambos son componentes de presentación puros (sin dependencias de Application/Infrastructure, standalone, sin lógica de negocio) y DEBEN desarrollarse test-first (constitución, Calidad de Código y Pruebas).

## `app-cabecera-pagina`

Resuelve FR-001 (cabecera visible con título y acciones principales en cada pantalla).

**Selector**: `app-cabecera-pagina`

**Inputs**:

| Nombre | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `titulo` | `string` | Sí | Título de la sección, en español de España (p. ej. "Mis ejercicios") |
| `descripcion` | `string` | No | Línea secundaria opcional bajo el título (p. ej. recuento de elementos) |

**Contenido proyectado**: un `<ng-content select="[acciones]">` para los botones de acción principal de la pantalla (p. ej. "Nuevo ejercicio", "Gestionar categorías"), de forma que cada pantalla decide sus propios botones sin que el componente conozca rutas ni permisos.

**Contrato visual**: respeta los tokens de `design-tokens.contract.md` (espaciado `$espaciado-4` de padding, tipografía `--mat-sys-headline-small` para el título); se adapta a una sola columna en móvil (título y acciones apiladas) y a una fila en tablet/escritorio.

**Accesibilidad**: el título se renderiza como encabezado semántico (`<h1>` o `<h2>` según el nivel de anidamiento de la pantalla) para que los lectores de pantalla puedan saltar entre secciones.

## `app-estado-vacio`

Resuelve FR-003 (estado vacío con estilo propio y mensaje orientativo) para listados de ejercicios y categorías, y reutilizable por `PaginaEnConstruccionComponent` para el mensaje "próximamente" (FR-013).

**Selector**: `app-estado-vacio`

**Inputs**:

| Nombre | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `icono` | `string` | Sí | Nombre del icono de Material Symbols a mostrar (p. ej. `fitness_center`, `construction`) |
| `mensaje` | `string` | Sí | Texto orientativo en español de España (p. ej. "No hay ejercicios registrados todavía") |

**Contenido proyectado**: un `<ng-content select="[accion]">` opcional para un botón de llamada a la acción (p. ej. "Crear mi primer ejercicio"); si no se proyecta nada, el componente solo muestra icono + mensaje (caso de uso de las pantallas "próximamente", que no tienen acción disponible).

**Contrato visual**: contenido centrado vertical y horizontalmente dentro del área de contenido, con espaciado `$espaciado-6` respecto a la cabecera de página; icono y texto usan tokens `--mat-sys-on-surface-variant` para diferenciarse visualmente de contenido "real" sin perder contraste AA.

**Accesibilidad**: el icono se marca como decorativo (`aria-hidden="true"`) porque el mensaje de texto ya transmite la misma información; el mensaje se asocia mediante texto visible plano (no solo color) para no depender del color como único indicador.

## Fuera de alcance de este contrato

- El indicador de **carga** (FR-004) no se encapsula en un componente nuevo: se resuelve reutilizando `mat-progress-spinner` directamente en cada plantilla, con una clase de utilidad compartida (`.contenido--centrado`, definida junto a los partials de `src/styles/`) para centrarlo de forma consistente. No se documenta aquí como componente porque no tiene `@Input`/`@Output` propios.
- La **confirmación de operación** (FR-008) no es un componente sino un servicio de la capa Presentation que envuelve `MatSnackBar` (ver `research.md` § 4); no expone una plantilla propia que requiera contrato de UI.
