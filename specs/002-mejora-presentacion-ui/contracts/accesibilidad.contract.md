# UI Contract: Accesibilidad (WCAG 2.1 AA)

**Feature**: [../spec.md](../spec.md) · **Plan**: [../plan.md](../plan.md)

Checklist de aceptación de FR-015 y SC-007. Toda pantalla tocada por esta feature DEBE cumplir cada punto antes de considerarse terminada. Se verifica con `ng lint` (puntos marcados "lint") y navegación manual descrita en `quickstart.md` (puntos marcados "manual").

| # | Requisito | Verificación |
|---|---|---|
| A1 | Todo texto normal tiene un contraste ≥4.5:1 frente a su fondo; todo texto grande (≥24px) o icono funcional tiene ≥3:1 | manual (research.md § 2) |
| A2 | Todo elemento interactivo (botón, enlace, campo, chip) es alcanzable con `Tab` en un orden lógico que sigue el orden visual | manual |
| A3 | Todo elemento interactivo muestra un indicador de foco visible (`:focus-visible`) al navegar con teclado | manual |
| A4 | Ningún control usa únicamente un manejador de `click` sin equivalente de teclado (`keydown`/`keyup`) | lint (`angular.configs.templateAccessibility`) |
| A5 | Toda imagen con significado tiene texto alternativo; todo icono puramente decorativo se marca `aria-hidden="true"` | lint + manual |
| A6 | Los mensajes de error de validación (`mat-error`) quedan asociados a su campo mediante la relación nativa de `mat-form-field` (ya provista por Angular Material) | manual |
| A7 | Las confirmaciones de operación (`MatSnackBar`) se anuncian sin requerir que el usuario mueva el foco manualmente | manual |
| A8 | Ningún flujo completo (crear ejercicio, gestionar categorías, navegar entre secciones) requiere el ratón/táctil: es completable 100% con teclado | manual |

**Resultado esperado**: las 8 filas marcadas como conformes antes de cerrar cualquier tarea de implementación que toque una pantalla dentro del alcance de esta feature.
