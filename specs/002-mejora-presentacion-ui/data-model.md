# Data Model: Mejora de la presentación (UI/UX) de la aplicación

**Feature**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md)

## Nota de alcance

Esta feature **no introduce ninguna entidad de dominio nueva ni modifica el esquema de persistencia** (SQLite WASM). Las entidades ya definidas en `specs/001-gestion-ejercicios-fisicos/data-model.md` (`Ejercicio`, `Categoria`, `Planificacion`, `ProgresoDiario`, etc.) permanecen sin cambios, tal como exige FR-014.

Lo que sigue son **modelos de estado puramente de presentación** (no persistidos, viven solo en memoria del componente mientras el usuario interactúa con la pantalla) que los nuevos componentes compartidos y las plantillas modificadas usan para decidir qué mostrar. Se documentan aquí porque son la base de los `@Input`/`@Output` de los componentes definidos en `contracts/`.

## Estado de carga de un recurso (`EstadoRecurso`)

Representa en qué fase está la obtención de datos ya existente (`resource()` de Angular, usado hoy por `BibliotecaListadoComponent`) y qué variante visual le corresponde.

| Valor | Cuándo ocurre | Presentación exigida |
|---|---|---|
| `cargando` | `recurso.isLoading()` es `true` | Indicador de carga centrado y consistente (FR-004) |
| `vacio` | Carga terminada y la colección resultante tiene longitud 0 | `app-estado-vacio` con mensaje orientativo y acción de alta (FR-003) |
| `con-datos` | Carga terminada y la colección tiene 1 o más elementos | Listado de tarjetas/filas (FR-002) |
| `error` | La carga del recurso falla | Mensaje de error visible, mismo tratamiento visual que el éxito (Edge Cases) |

No es una entidad persistida: se deriva en la plantilla a partir de las signals que ya expone cada componente (`isLoading()`, `value()`, `error()`); no requiere un nuevo tipo en Domain/Application.

## Mensaje de retroalimentación de operación (`MensajeFeedback`)

Representa el contenido transitorio mostrado tras crear, editar o eliminar un ejercicio o categoría (FR-008), vehiculado mediante `MatSnackBar` (ver `research.md` § 4).

| Campo | Tipo | Descripción |
|---|---|---|
| `texto` | `string` | Mensaje en español de España mostrado al usuario (p. ej. "Ejercicio guardado", "No se pudo eliminar la categoría") |
| `tipo` | `'exito' \| 'error'` | Determina el estilo (icono/color) del snackbar, reutilizando los tokens de color del sistema M3 |
| `duracionMs` | `number` | Tiempo visible antes de desaparecer automáticamente (valor por defecto acordado en research.md: 4000 ms) |

No se persiste; se crea y se descarta en el propio componente que ejecuta la acción.

## Entrada de menú activa (`EntradaMenuPrincipal`)

Ya existe como interfaz en `menu-principal.ts` (`etiqueta`, `ruta`, `icono`); esta feature no le añade campos, solo exige que la entrada correspondiente a la ruta activa se distinga visualmente (FR-012, Acceptance Scenario 4 de la Historia 3). No requiere cambios de modelo, solo de estilo (`routerLinkActive`, ya usado hoy en `shell.component.html`).

## Relación con los componentes de presentación compartidos

```text
EstadoRecurso ──consumido-por──> plantillas de biblioteca-listado y categoria-gestion
                                   └─ en estado "vacio" renderizan <app-estado-vacio>

MensajeFeedback ──creado-por──> ejercicio-formulario y categoria-gestion al guardar/eliminar
                                   └─ se muestra vía MatSnackBar (sin componente propio)

EntradaMenuPrincipal ──sin cambios── shell.component (solo estilo de "activo")
```

Los contratos de `@Input`/`@Output` de `app-cabecera-pagina` y `app-estado-vacio` se detallan en [contracts/componentes-presentacion.contract.md](./contracts/componentes-presentacion.contract.md).
