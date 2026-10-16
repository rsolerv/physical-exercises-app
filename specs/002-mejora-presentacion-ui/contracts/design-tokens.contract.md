# UI Contract: Tokens de diseño

**Feature**: [../spec.md](../spec.md) · **Plan**: [../plan.md](../plan.md)

Este contrato define los valores que **toda** pantalla y componente de presentación de la aplicación debe usar al implementar esta feature. Es la referencia que se revisa en cada pull request (equivalente a un "contrato visual") para mantener la coherencia exigida por `ux-ui.instructions.md`.

## Espaciado (escala de 8px)

Definido en `src/styles/_espaciado.scss`, expuesto como variables SCSS:

| Token | Valor | Uso típico |
|---|---|---|
| `$espaciado-1` | 8px | separación mínima entre elementos relacionados (icono + texto) |
| `$espaciado-2` | 16px | padding interno de tarjetas, separación entre campos de formulario |
| `$espaciado-3` | 24px | separación entre secciones dentro de una misma pantalla |
| `$espaciado-4` | 32px | padding de la cabecera de página, margen bajo el título |
| `$espaciado-6` | 48px | separación entre bloques mayores (p. ej. antes del estado vacío) |

**Regla**: ningún nuevo estilo introduce valores de `margin`/`padding`/`gap` en píxeles que no sean múltiplos de 8 (excepto los 1px de bordes). Los estilos existentes se migran a estos tokens cuando se toquen como parte de esta feature.

## Breakpoints

Definidos en `src/styles/_breakpoints.scss` como mixins (`@include movil { ... }`, `@include tablet { ... }`, `@include escritorio { ... }`), acordados en `/speckit-clarify`:

| Rango | Ancho | Comportamiento exigido |
|---|---|---|
| Móvil | hasta 599px | una sola columna; menú lateral oculto por defecto, abrible con botón (FR-010) |
| Tablet | 768px–1024px | disposición más densa; controles con tamaño táctil cómodo (FR-010, FR-011) |
| Escritorio | 1280px en adelante | mayor densidad de información; menú lateral visible por defecto (FR-010) |

## Color y tipografía

- **Fuente única de verdad**: variables de sistema de Angular Material M3 (`--mat-sys-primary`, `--mat-sys-on-surface`, `--mat-sys-surface-variant`, `--mat-sys-headline-*`, `--mat-sys-title-*`, `--mat-sys-body-*`, etc.), ya generadas por `mat.theme()` en `src/styles.scss`.
- **Prohibido**: introducir valores de color hexadecimales sueltos o una escala tipográfica paralela en componentes nuevos; siempre se referencia la variable `--mat-sys-*` equivalente.
- **Contraste mínimo (WCAG 2.1 AA, FR-015)**: 4.5:1 para texto normal, 3:1 para texto grande (≥24px o ≥18.66px en negrita) e iconografía funcional. Toda combinación de color nueva (p. ej. icono + fondo del estado vacío) se verifica manualmente según `research.md` § 2 antes de dar la tarea por completada.

## Foco visible y teclado (WCAG 2.1 AA, FR-015)

- Todo control interactivo nuevo debe mostrar un indicador de foco (`:focus-visible`) con contraste ≥3:1 frente al fondo adyacente.
- Todo flujo (crear, editar, eliminar, navegar) debe poder completarse únicamente con teclado (`Tab`, `Shift+Tab`, `Enter`, `Espacio`, `Escape` donde aplique).

## Elevación y densidad

- `density: 0` (ya configurado en `mat.theme()`) se mantiene; no se introduce una densidad distinta para esta feature.
- Las tarjetas/filas del listado usan como máximo el nivel de elevación por defecto de `mat-card`/`mat-list-item`; no se definen sombras personalizadas.
