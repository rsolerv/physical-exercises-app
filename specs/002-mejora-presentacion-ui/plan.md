# Implementation Plan: Mejora de la presentación (UI/UX) de la aplicación

**Branch**: `002-mejora-presentacion-ui` | **Date**: 2026-10-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-mejora-presentacion-ui/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Rediseño visual integral (sin cambios de comportamiento funcional) de las pantallas ya implementadas — listado de la biblioteca de ejercicios, formulario de ejercicio, gestión de categorías y shell de navegación — y de las cuatro pantallas pendientes ("Hoy", "Buscar", "Planificación", "Sincronización"), que hoy solo muestran texto plano sin estilo. Enfoque técnico: aplicar el sistema de diseño exigido por `ux-ui.instructions.md` (estilo SaaS empresarial, escala de espaciado de 8px, jerarquía tipográfica y breakpoints mobile/tablet/desktop) reutilizando al máximo Angular Material 3 y los tokens de sistema (`--mat-sys-*`) ya configurados en `styles.scss`, añadiendo solo dos componentes de presentación compartidos y reutilizables (cabecera de página, estado vacío) para evitar duplicar marcado entre pantallas. Todos los cambios se confinan a la capa Presentation y a los estilos globales; no se toca Domain, Application ni Infrastructure (Principio II, FR-014).

## Technical Context

**Language/Version**: TypeScript (versión empaquetada con Angular 22.2.x) — reutiliza el stack ya fijado por `specs/001-gestion-ejercicios-fisicos`; no se introduce ningún lenguaje ni runtime nuevo.

**Primary Dependencies**: Angular 22 (standalone components, Signals), Angular Material 22 (theming M3 vía `mat.theme()`, ya configurado en `src/styles.scss`), Angular CDK (`@angular/cdk/layout` si se necesita observar breakpoints desde TypeScript, `@angular/cdk/a11y` para gestión de foco). No se añade ninguna dependencia nueva de terceros: todo el trabajo se apoya en paquetes ya presentes en `package.json`.

**Storage**: N/A — esta feature no modifica la persistencia (SQLite WASM) ni el formato de datos; es un cambio puramente de presentación (FR-014).

**Testing**: Vitest + `TestBed` (mismo framework ya usado en `tests/component/presentation/`). Los specs de componente existentes se actualizan cuando cambien selectores o estructura del DOM; los dos componentes compartidos nuevos (cabecera de página, estado vacío) se desarrollan test-first con sus propios specs. La conformidad con WCAG 2.1 AA (FR-015) se verifica mediante la regla ya activa `angular.configs.templateAccessibility` de `angular-eslint` (`ng lint`) más la validación manual guiada en `quickstart.md`; no se añade ninguna herramienta de accesibilidad automatizada nueva (Principio II).

**Target Platform**: Igual que `specs/001-gestion-ejercicios-fisicos` — navegadores web modernos de escritorio y móvil, despliegue como sitio estático en GitHub Pages.

**Project Type**: Aplicación web de página única (SPA) sin backend, mismo proyecto Angular ya existente. Esta feature solo toca `src/app/presentation/` y los estilos globales (`src/styles.scss`); no añade proyectos ni paquetes nuevos.

**Performance Goals**: Mantener los presupuestos de bundle ya configurados en `angular.json` (`anyComponentStyle`: 4 kB de aviso / 8 kB de error, `initial`: 500 kB de aviso / 1 MB de error); los estilos y componentes compartidos nuevos deben mantenerse dentro de esos límites sin necesidad de ampliarlos.

**Constraints**: No alterar ningún comportamiento funcional existente (FR-014); cumplir WCAG 2.1 AA en contraste, foco visible y navegación por teclado (FR-015); usar exactamente los breakpoints acordados en las Clarifications del spec — móvil ≤599 px, tablet 768–1024 px, escritorio ≥1280 px (FR-010); mantener un único tema claro (sin modo oscuro); conservar el español de España en todos los textos (Principio I).

**Scale/Scope**: 3 historias de usuario (P1–P3) que tocan 4 pantallas ya implementadas (listado de ejercicios, formulario de ejercicio, gestión de categorías, shell/menú) y 4 pantallas placeholder ("Hoy", "Buscar", "Planificación", "Sincronización"); 15 requisitos funcionales (FR-001…FR-015).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio / regla de la constitución | Evaluación | Estado |
|---|---|---|
| I. Idioma y Mercado (Español de España) | No se traduce ni se añade ningún texto en otro idioma; los textos existentes se conservan (Assumptions del spec) y cualquier texto nuevo (p. ej. mensajes de estado vacío o "próximamente") se redacta en español de España | PASS |
| II. Cero Alcance Fantasma | El plan cubre exclusivamente FR-001…FR-015 del spec; no se implementa ninguna funcionalidad nueva de las secciones pendientes (Hoy, Buscar, Planificación, Sincronización), solo su presentación visual (Assumptions del spec) | PASS |
| III. Verificabilidad por una Persona No Técnica | `quickstart.md` documenta únicamente pasos de navegación por la interfaz (abrir pantallas, redimensionar la ventana, navegar con teclado) para validar cada escenario de aceptación, sin leer código ni logs | PASS |
| IV. UX Multiplataforma y Accesible | Objetivo central de la feature: diseño responsive mobile-first en los tres rangos de ancho acordados y cumplimiento WCAG 2.1 AA (FR-010, FR-011, FR-015) | PASS |
| Arquitectura y Stack Tecnológico | Angular Material sigue siendo la única librería visual; no se añade dependencia nueva; los cambios respetan la arquitectura en capas (todo el trabajo vive en Presentation, sin tocar Domain/Application/Infrastructure) | PASS |
| Calidad de Código y Pruebas | Los dos componentes de presentación compartidos nuevos se diseñan con responsabilidad única (SOLID); cero errores de ESLint (incluida la regla de accesibilidad de plantillas ya activa); Vitest para sus specs; test-first obligatorio para el código nuevo; la cobertura global del 80% ya exigida no decae porque el código nuevo se cubre con sus propios tests | PASS |

No se detectan violaciones que requieran justificación; la tabla de Complexity Tracking queda vacía.

**Re-evaluación post-Fase 1 (tras research.md, data-model.md, contracts/ y quickstart.md)**: el diseño resultante no introduce ninguna entidad persistente, capa ni dependencia externa fuera de las ya aprobadas. Los dos componentes de presentación compartidos (`app-cabecera-pagina`, `app-estado-vacio`) son presentacionales puros (sin lógica de negocio, sin acceso a Infrastructure) y viven en `presentation/compartido/ui/`, por lo que no constituyen alcance nuevo (Principio II) ni una capa adicional. **Resultado: todas las filas siguen en PASS.**

## Project Structure

### Documentation (this feature)

```text
specs/002-mejora-presentacion-ui/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/
├── styles.scss                              # [MODIFICADO] se añaden los `@use` a las nuevas partials de tokens
├── styles/                                  # [NUEVO] partials SCSS compartidas (design tokens)
│   ├── _espaciado.scss                      # escala de espaciado de 8px (variables/mixins)
│   └── _breakpoints.scss                    # mixins de breakpoints móvil/tablet/escritorio (FR-010)
└── app/
    └── presentation/
        ├── compartido/
        │   ├── shell/
        │   │   ├── shell.component.html     # [MODIFICADO] cabecera + menú con estilo pulido
        │   │   ├── shell.component.scss      # [MODIFICADO] usa partials de espaciado/breakpoints
        │   │   └── pagina-en-construccion.component.ts  # [MODIFICADO] usa cabecera-pagina + estado-vacio
        │   ├── embebidos/                    # sin cambios en esta feature
        │   └── ui/                           # [NUEVO] componentes de presentación compartidos
        │       ├── cabecera-pagina/
        │       │   ├── cabecera-pagina.component.ts
        │       │   ├── cabecera-pagina.component.html
        │       │   └── cabecera-pagina.component.scss
        │       └── estado-vacio/
        │           ├── estado-vacio.component.ts
        │           ├── estado-vacio.component.html
        │           └── estado-vacio.component.scss
        ├── biblioteca-ejercicios/
        │   ├── biblioteca-listado.component.html   # [MODIFICADO] tarjetas + cabecera-pagina + estado-vacio
        │   ├── biblioteca-listado.component.ts      # [MODIFICADO] solo si cambian imports de módulos Material
        │   ├── ejercicio-formulario.component.html  # [MODIFICADO] secciones agrupadas + feedback de guardado
        │   └── categorias/
        │       └── categoria-gestion.component.html # [MODIFICADO] cabecera-pagina + estado-vacio + feedback
        ├── busqueda-ejercicios/               # sin cambios funcionales; solo heredan el placeholder pulido
        ├── planificacion-semanal/             # ídem
        ├── progreso-diario/                   # ídem
        └── sincronizacion/                    # ídem

tests/
└── component/
    └── presentation/
        ├── compartido/
        │   └── ui/                           # [NUEVO] specs test-first de cabecera-pagina y estado-vacio
        ├── biblioteca-listado.component.spec.ts     # [MODIFICADO] si cambian selectores verificados
        ├── categoria-gestion.component.spec.ts      # [MODIFICADO] ídem
        ├── ejercicio-formulario.component.spec.ts   # [MODIFICADO] ídem
        └── shell.component.spec.ts                  # [MODIFICADO] ídem
```

**Structure Decision**: No se modifica la estructura de capas ya establecida por `specs/001-gestion-ejercicios-fisicos` (Domain/Application/Infrastructure/Presentation); esta feature trabaja exclusivamente dentro de `presentation/` y de los estilos globales. Se añade una única carpeta nueva, `presentation/compartido/ui/`, para alojar los dos componentes de presentación puros y reutilizables que evitan duplicar marcado de cabecera y estado vacío en cada pantalla (biblioteca, categorías, formulario, placeholders). Las partials SCSS en `src/styles/` centralizan la escala de espaciado de 8px y los breakpoints para que todos los componentes los reutilicen en vez de redefinir valores mágicos, tal como exige `ux-ui.instructions.md`. Los tests espejan la misma ubicación bajo `tests/component/presentation/`.

## Complexity Tracking

*Sin violaciones de la constitución que requieran justificación: no se añade ninguna capa, proyecto, dependencia ni patrón fuera de los ya exigidos por la constitución. La única adición estructural (`presentation/compartido/ui/`) es una subcarpeta de la capa Presentation ya existente, no una capa nueva.*
