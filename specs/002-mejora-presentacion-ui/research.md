# Phase 0 Research: Mejora de la presentación (UI/UX) de la aplicación

**Feature**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md)

Esta feature no dejó ningún `NEEDS CLARIFICATION` abierto en el Technical Context (las ambigüedades de alcance se resolvieron en `/speckit-clarify`: accesibilidad WCAG 2.1 AA, rango de "tablet" 768–1024 px, y naturaleza no bloqueante de SC-004). Este documento recoge las decisiones técnicas necesarias para pasar de los requisitos a un diseño concreto.

## 1. Estrategia de tokens de diseño (espaciado, tipografía, color)

- **Decision**: No crear un sistema de tokens propio desde cero. Reutilizar los tokens de sistema que Angular Material 3 ya expone como variables CSS (`--mat-sys-*`, generadas por `mat.theme()` en `src/styles.scss`) para color y tipografía, y añadir únicamente dos partials SCSS nuevas y mínimas (`src/styles/_espaciado.scss`, `src/styles/_breakpoints.scss`) con la escala de espaciado de 8px (`$espaciado-1: 8px` … `$espaciado-6: 48px`) y los tres breakpoints acordados, expuestos como mixins (`@include breakpoint-movil { ... }`, etc.).
- **Rationale**: `ux-ui.instructions.md` exige "Material Design principles where appropriate" y "Avoid custom components when a Material equivalent exists"; extender ese principio a los estilos evita mantener una paleta/tipografía paralela y reduce el riesgo de romper el contraste WCAG AA que ya ofrece el esquema M3. La escala de espaciado y los breakpoints sí son responsabilidad del proyecto (Material no impone un grid de 8px por defecto), por lo que se centralizan en partials compartidas en lugar de repetir valores mágicos en cada `.scss` de componente (como ya ocurre hoy en `shell.component.scss` con `@media (max-width: 599px)`).
- **Alternatives considered**:
  - *Librería de design tokens externa (Style Dictionary, Tailwind, etc.)* — rechazada: añade una dependencia nueva no solicitada por el spec y viola el Principio II (cero alcance fantasma) y la restricción de la constitución de que Angular Material es la única librería visual permitida.
  - *Variables CSS propias para color/tipografía* — rechazada: duplicaría lo que `mat.theme()` ya resuelve y arriesgaría contrastes no verificados; mejor heredar los tokens de sistema ya auditados por Angular Material M3.

## 2. Verificación de contraste WCAG 2.1 AA sobre el tema M3 ya configurado

- **Decision**: Mantener la paleta ya elegida (`mat.$azure-palette` como `primary`, `mat.$blue-palette` como `tertiary`, `density: 0`) y validar manualmente con el inspector de accesibilidad del navegador (Chrome DevTools → Lighthouse/Accessibility o el panel de contraste) los pares texto/fondo que se introduzcan en los componentes nuevos (cabecera de página, estado vacío, snackbars de feedback). Si algún texto secundario no alcanza 4.5:1 (texto normal) o 3:1 (texto grande/iconografía), se sustituye por el rol de color del sistema inmediatamente superior en contraste (p. ej. `on-surface` en vez de `on-surface-variant`) en lugar de introducir un color ad-hoc.
- **Rationale**: Los paquetes de Angular Material 3 generan paletas con pares de color ya pensados para cumplir AA en la mayoría de combinaciones "on-*"; el riesgo real está en combinaciones nuevas que se introduzcan en plantillas (p. ej. texto sobre una tarjeta de estado vacío). Revisar solo esas combinaciones nuevas es proporcional al alcance de la feature y evita añadir una herramienta automatizada de auditoría de color no solicitada.
- **Alternatives considered**:
  - *Cambiar de paleta base (azure/blue) a otra con mejor contraste declarado* — rechazada: no hay evidencia de que la paleta actual incumpla AA; cambiarla sin motivo ampliaría el alcance (Principio II) y afectaría a pantallas fuera de esta feature.
  - *Añadir `axe-core` u otra librería de testing de accesibilidad automatizado* — rechazada por ahora: no está en el stack de testing actual (solo Vitest) y añadirla no la pidió el spec; la combinación de lint de plantillas + revisión manual guiada en `quickstart.md` es suficiente para el alcance de FR-015.

## 3. Componentes de presentación compartidos vs. duplicar marcado

- **Decision**: Crear dos componentes de presentación "tontos" (sin estado de negocio, solo `input()`/`content projection`) en `presentation/compartido/ui/`: `app-cabecera-pagina` (título + zona de acciones proyectada) y `app-estado-vacio` (icono, mensaje, acción opcional proyectada). Se reutilizan desde el listado de ejercicios, la gestión de categorías y la página en construcción.
- **Rationale**: FR-001 (cabecera visible en cada pantalla) y FR-003 (estado vacío con estilo propio) se repiten textualmente en las tres historias de usuario del spec; sin un componente compartido, el mismo marcado (título + botones de acción, o icono + mensaje + CTA) se duplicaría en al menos 6 plantillas, dificultando mantener la coherencia visual exigida. Son componentes estrictamente presentacionales (reciben datos por `@Input`/projection, no inyectan repositorios), por lo que no alteran la arquitectura en capas ni el Principio II.
- **Alternatives considered**:
  - *Directivas o mixins SCSS reutilizables en vez de componentes* — rechazada: no resuelve la duplicación de estructura HTML (solo de estilos), y el spec pide comportamiento consistente (p. ej. icono + CTA en el estado vacío), no solo apariencia.
  - *Un único componente de "layout de página" que envuelva todo el contenido* — rechazada: sería más invasivo (obligaría a reestructurar cada componente de ruta) para un beneficio similar al de una cabecera + estado vacío más pequeños y de bajo riesgo.

## 4. Confirmación visual de acciones (crear/editar/eliminar) — FR-008

- **Decision**: Usar `MatSnackBar` (ya incluido en `@angular/material`) para las confirmaciones de éxito/error de operaciones de guardado y borrado (ejercicio, categoría), con una duración corta (ej. 4 s) y rol `aria-live="polite"` (comportamiento por defecto de `MatSnackBar`). Los errores de validación de campo siguen mostrándose inline con `mat-error`, como ya hace hoy el formulario; el snackbar se reserva para el resultado de la operación completa (guardar/eliminar), no para validación de campo.
- **Rationale**: Es el componente de Material pensado exactamente para este caso ("Avoid custom components when a Material equivalent exists"), ya anuncia el mensaje a tecnologías de asistencia sin mover el foco del usuario (compatible con FR-015/SC-007), y no requiere ninguna dependencia nueva.
- **Alternatives considered**:
  - *Banner inline persistente en la parte superior de la pantalla* — rechazada como mecanismo único: ya existe para errores de guardado fallido (`errorAlGuardar()` en el formulario) y se mantiene para esos casos, pero no es necesario para confirmaciones de éxito transitorias, donde un snackbar es más estándar en Material.
  - *Modal de confirmación tras cada guardado* — rechazada: contradice explícitamente `ux-ui.instructions.md` ("Avoid modal overuse") y añade un clic extra para cerrarlo.

## 5. Breakpoints: media queries CSS vs. `BreakpointObserver` de CDK

- **Decision**: Mantener media queries CSS estándar (`@media`) usando los mixins de `_breakpoints.scss`, igual que ya hace `shell.component.scss`, en vez de observar breakpoints desde TypeScript con `@angular/cdk/layout`. Solo se recurre a `BreakpointObserver` si una pantalla concreta necesitara cambiar *comportamiento* (no solo estilo) según el ancho — no es el caso en ninguna de las historias de usuario de este spec.
- **Rationale**: Todos los cambios responsive requeridos (una columna en móvil, densidad mayor en tablet/escritorio, menú lateral oculto/abierto) son puramente de estilo y ya se resuelven con CSS; introducir `BreakpointObserver` añadiría suscripciones y estado adicional sin beneficio para esta feature, incrementando la superficie de código a mantener y testear sin necesidad.
- **Alternatives considered**:
  - *`BreakpointObserver` + clases condicionales en la plantilla* — rechazada por sobre-ingeniería para necesidades puramente visuales.

## 6. Verificación de navegación por teclado y foco visible

- **Decision**: Apoyarse en el comportamiento nativo de foco de los elementos interactivos de Angular Material (ya gestionan `:focus-visible` y orden de tabulación correctos) y añadir, solo donde haga falta, estilos `:focus-visible` explícitos en los componentes nuevos (`app-cabecera-pagina`, `app-estado-vacio`) para asegurar un contorno de foco visible y con contraste suficiente. La verificación se hace manualmente navegando cada pantalla solo con `Tab`/`Shift+Tab`/`Enter`/`Espacio`, documentado como pasos de `quickstart.md`.
- **Rationale**: Angular Material ya cumple gran parte de los requisitos de foco por defecto; el riesgo real está en marcado no estándar (p. ej. un `<div>` usado como botón). La regla `angular.configs.templateAccessibility` de ESLint ya detecta patrones comunes de inaccesibilidad (como `click` sin `keydown` equivalente), cubriendo estáticamente parte de FR-015 sin esfuerzo adicional.
- **Alternatives considered**:
  - *Gestión de foco programática con `@angular/cdk/a11y` (`FocusMonitor`, `FocusTrap`)* — reservada solo si algún componente nuevo requiere lógica de foco compleja (no se prevé en esta feature); no se adopta de entrada para no ampliar el alcance sin necesidad.

## Resumen de salidas de la Fase 0

Todas las decisiones anteriores alimentan directamente el diseño de la Fase 1 (`data-model.md`, `contracts/`, `quickstart.md`). No quedan incógnitas pendientes de investigar.
