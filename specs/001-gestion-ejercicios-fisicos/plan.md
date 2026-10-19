# Implementation Plan: Gestión integral de ejercicios y planificación semanal

**Branch**: `001-gestion-ejercicios-fisicos` | **Date**: 2026-10-19 | **Spec**: [spec.md](./spec.md)

## Summary

Aplicación web de un único usuario para gestionar una biblioteca de ejercicios, buscar y consultar su contenido, organizar planificaciones semanales, registrar el progreso diario y conservar/sincronizar los datos. La solución combina persistencia local y sincronización manual con GitHub con una experiencia responsive, coherente y accesible en todas las pantallas funcionales. El código existente ya implementa la mayor parte de la funcionalidad; el trabajo restante se concentra en cerrar los huecos visuales y de interacción identificados en la revisión del código, incluido el acceso desde la planificación semanal a la ficha de ejercicio existente, sin alterar el dominio ni la persistencia salvo que una prueba demuestre que es imprescindible.

## Technical Context

**Language/Version**: TypeScript 6 con Angular 22.2.x, ya instalado y en uso.

**Primary Dependencies**: Angular standalone, Signals y Signal Forms; Angular Material 3 como única librería de componentes visuales; Angular CDK ya instalado; RxJS y `HttpClient` confinados a los adaptadores de infraestructura; `@sqlite.org/sqlite-wasm`. No se prevén dependencias nuevas.

**Storage**: SQLite WASM en un Web Worker del navegador con VFS `opfs-sahpool`; no hay backend ni almacenamiento gestionado externo. Los datos se sincronizan manualmente como JSON y las imágenes locales como documentos separados en el repositorio privado de datos de GitHub.

**Testing**: Vitest y Angular `TestBed`. Se conserva la cobertura mínima del 80% global y del 100% para Domain, ESLint sin errores y desarrollo test-first. La accesibilidad visual y el uso solo con teclado requieren comprobación manual en la interfaz; las reglas de plantillas de ESLint no bastan para demostrar WCAG 2.1 AA.

**Target Platform**: Navegadores modernos de escritorio, tablet y móvil; sitio estático publicado en GitHub Pages desde el repositorio público de código; repositorio privado separado para los datos.

**Project Type**: SPA sin backend, organizada en las cuatro capas exigidas por la constitución: Domain, Application, Infrastructure y Presentation.

**Performance Goals**: Cumplir los presupuestos existentes en `angular.json`: bundle inicial con aviso en 700 kB y error en 1.5 MB; estilos por componente con aviso en 4 kB y error en 8 kB. No aplican metas de throughput de servidor.

**Constraints**: Uso normal disponible sin conexión; sincronización solo bajo acción explícita; detección de cambios zoneless; texto visible en español de España; tema claro; espaciado basado en 8 px; adaptación a todos los anchos, con rangos de referencia móvil ≤599 px, tablet 768–1024 px y escritorio ≥1280 px. Los anchos intermedios también deben funcionar.

**Scale/Scope**: Un usuario por instalación, datos personales (decenas de ejercicios y pocas planificaciones simultáneas), 6 historias de usuario y 49 requisitos funcionales.

## Constitution Check

*GATE: mantener conformidad durante los cambios pendientes y revalidar antes de cerrar la implementación.*

| Principio / regla                               | Evaluación para este plan                                                                                                                                                                                                  | Estado              |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| I. Idioma y Mercado                             | Mantener todos los textos, validaciones y feedback en español de España.                                                                                                                                                   | PASS                |
| II. Cero Alcance Fantasma                       | Las modificaciones se limitan a FR-001…FR-049; los huecos de presentación identificados corresponden a requisitos ya descritos. No se añaden funciones nuevas.                                                             | PASS                |
| III. Verificabilidad por una Persona No Técnica | Las mejoras de presentación, responsive, feedback y teclado se validan recorriendo la aplicación; no se exige inspeccionar código, logs o la base de datos.                                                                | PASS                |
| IV. UX Multiplataforma y Accesible              | La solución debe cubrir los rangos y flujos accesibles del spec, incluidos el menú superpuesto en móvil, foco visible, contraste y navegación con teclado. La implementación actual tiene diferencias descritas más abajo. | PENDIENTE DE CIERRE |
| Arquitectura y Stack                            | Se conserva Angular, Angular Material como única librería visual, SQLite WASM en navegador, GitHub Pages y las cuatro capas; la intervención se concentra en Presentation.                                                 | PASS                |
| Calidad de Código y Pruebas                     | Vitest, test-first, ESLint sin errores, ≥80% de cobertura global y 100% para Domain. Las tareas pendientes deben añadir pruebas de componente para los gaps identificados.                                                 | PENDIENTE DE CIERRE |

## Revisión del código existente

La aplicación ya contiene las cinco áreas funcionales descritas en el spec: biblioteca y categorías, búsqueda y ficha, planificación y vista de hoy, progreso y sincronización. No se trata de rediseñar placeholders ni de volver a implementar la aplicación completa.

### Decisiones ya implementadas que se mantienen

- Arquitectura Domain/Application/Infrastructure/Presentation y persistencia SQLite WASM en navegador; se mantienen los casos de uso, repositorios y reglas de dominio.
- Componentes standalone con Signals, Signal Forms para el formulario, Angular Material 3, tema claro y variables `--mat-sys-*`.
- Componentes compartidos `CabeceraPaginaComponent`, `EstadoVacioComponent` y `MensajeFeedbackService`.
- Parciales de estilo `_espaciado.scss`, `_breakpoints.scss`, `_utilidades.scss`, importadas desde `styles.scss`.
- Cabeceras, estados vacíos, indicadores de carga en la biblioteca y varias vistas, listados diferenciados y errores de validación junto a campos.
- El feedback usa `MatSnackBar`; las pantallas de día, búsqueda, biblioteca, calendario, constructor y sincronización muestran cabeceras. `ProgresoDiarioComponent` es un componente integrado en la vista “Hoy”, no una ruta independiente.
- Los presupuestos de bundle configurados son 700 kB/1.5 MB para `initial` y 4 kB/8 kB para `anyComponentStyle`.

### Diferencias y decisiones de intervención

| Área / componente                         | Situación observada                                                                                                                                                                                                                     | Decisión del plan                                                                                                                                                                                                                                                                                                                         |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CategoriaGestionComponent`               | Permite crear y eliminar, pero no editar categorías. El caso de uso `GestionarCategoriaUseCase.actualizar` ya existe. Tampoco presenta estado de carga aunque carga las categorías con `resource`.                                      | Mantener el componente y conectarlo al caso de uso existente para editar; añadir estados de carga y feedback contextual; ampliar las pruebas de componente. No modificar el dominio ni el puerto salvo que la integración existente lo requiera.                                                                                          |
| `EjercicioFormularioComponent`            | Los grupos del formulario y el feedback están implementados; la obligatoriedad de categoría es visible, pero nombre y descripción no muestran una marca previa al envío.                                                                | Mantener Signal Forms y el flujo actual; hacer visible la obligatoriedad de nombre y descripción y verificar estados de error, éxito y teclado mediante pruebas.                                                                                                                                                                          |
| `EjercicioFichaComponent`                 | Las imágenes se muestran con `<img>`, pero no se observa un tratamiento para el fallo de carga de una imagen.                                                                                                                           | Mantener la ficha y añadir una indicación de error de imagen que no oculte el resto de los datos; cubrirla con prueba de componente.                                                                                                                                                                                                      |
| Planificación de hoy / acceso a la ficha  | La ruta `/inicio` presenta los ejercicios planificados para hoy; la ruta `/ejercicios/:id` ya muestra el `EjercicioFichaComponent` (FR-048, SC-015).                                                                                    | Desde cada ejercicio de `/inicio`, ofrecer una acción claramente identificable que navegue directamente a `/ejercicios/:id` y reutilice `EjercicioFichaComponent`; mantenerla separada del control para marcarlo como realizado/no realizado. La acción debe funcionar con teclado y tacto. No crear otra ruta ni otra pantalla de ficha. |
| Planificación semanal / acceso a la ficha | La ficha de ejercicio ya está disponible en `/ejercicios/:id` mediante `EjercicioFichaComponent`.                                                                                                                                       | Desde cada ejercicio mostrado en la planificación semanal, ofrecer una acción que navegue directamente a `/ejercicios/:id` y reutilice `EjercicioFichaComponent`. No crear otra ruta ni otra pantalla de ficha ni exigir buscar previamente el ejercicio en la biblioteca (FR-049, SC-016).                                               |
| `ShellComponent`                          | El menú se cierra al navegar y tiene tratamiento visual para la ruta activa, pero el `mat-sidenav` usa `mode="side"` también en móvil. El código usa `<768 px` para el estado móvil mientras los estilos consideran móvil hasta 599 px. | Mantener shell, toolbar, navegación y estilo activo; modificar el modo responsive para que el menú sea overlay en móvil, cerrar al navegar y hacer coherentes las condiciones con los rangos del spec. Añadir pruebas del modo, cierre y anchos de referencia.                                                                            |
| Feedback de categorías                    | El éxito se anuncia mediante `MatSnackBar` y los errores aparecen en la página, no junto al elemento afectado.                                                                                                                          | Mantener `MensajeFeedbackService`; acercar el feedback al contexto de la operación y conservar el anuncio accesible.                                                                                                                                                                                                                      |
| `PaginaEnConstruccionComponent`           | No está registrada en `app.routes.ts`; las rutas funcionales apuntan a componentes reales. Su mención en comentarios de navegación y del estado vacío describe un uso que ya no es actual.                                              | Retirar el componente sin uso y limpiar las referencias/comentarios obsoletos al implementar. No sustituir ninguna ruta funcional por un placeholder.                                                                                                                                                                                     |
| Accesibilidad y responsive globales       | Material aporta controles y foco base, y ESLint revisa accesibilidad de plantillas; eso no demuestra contraste WCAG AA ni los flujos solo con teclado.                                                                                  | Mantener la lista manual de criterios y comprobar contraste, foco, teclado y tamaños mediante recorrido de interfaz. No añadir una dependencia de accesibilidad sin necesidad aprobada.                                                                                                                                                   |

No se identifican motivos para cambiar el modelo de datos, las capas de dominio/aplicación/infraestructura, la sincronización, el catálogo ni las dependencias. Los cambios de comportamiento visibles son los que especifica el spec consolidado.

## Enfoque de implementación

1. Añadir o completar primero pruebas de componente para edición de categorías, estado de carga de categorías, obligatoriedad visible en el formulario, errores de carga de imágenes y modo overlay/cierre del menú móvil.
2. Extender `CategoriaGestionComponent` usando el caso de uso `actualizar` ya disponible; no duplicar reglas de categoría en Presentación.
3. Corregir el modo responsive del shell para que el menú lateral se comporte como overlay hasta 599 px y como panel lateral desde 600 px; mantener el cierre tras la navegación y la indicación de sección activa, sin cambiar los rangos de referencia móvil, tablet y escritorio del spec.
4. Completar las señales visuales requeridas en el formulario, la ficha de ejercicio y las operaciones de categoría, reutilizando los componentes compartidos y los tokens ya existentes.
5. En “Hoy” (`/inicio`), añadir en cada ejercicio un acceso independiente a su ficha, que navegue a la ruta existente `/ejercicios/:id` y reutilice `EjercicioFichaComponent`. Conservar por separado el control de progreso y comprobar que ambas acciones son operables mediante teclado y tacto.
6. En la planificación semanal, añadir en cada ejercicio un acceso directo a `/ejercicios/:id` que reutilice `EjercicioFichaComponent`; no crear rutas ni pantallas de ficha adicionales y comprobar la navegación desde la planificación sin pasar por la biblioteca.
7. Retirar `PaginaEnConstruccionComponent` y actualizar los comentarios obsoletos que indiquen que las rutas funcionales son placeholders; conservar el estado vacío reutilizable para los casos funcionales sin datos.
8. Ejecutar pruebas Vitest y lint; comprobar presupuestos del build. Validar manualmente contraste, foco y flujos con teclado, además de ausencia de solapamientos y desplazamiento horizontal en anchos menores de 360 px, rangos de referencia y anchos intermedios.

La implementación se considera cerrada solo cuando los gaps de la tabla anterior están cubiertos por pruebas, el acceso desde hoy y desde la planificación semanal satisface SC-015 y SC-016, y los criterios manuales de accesibilidad y adaptación visual se han verificado desde la interfaz.

## Project Structure

### Documentation (this feature)

```text
specs/001-gestion-ejercicios-fisicos/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
.github/
└── workflows/
    └── deploy.yml                  # lint + tests + build con --base-href + 404.html + publicación en GitHub Pages

src/
├── styles/                         # tokens SCSS compartidos de espaciado, breakpoints y utilidades
├── app/
│   ├── domain/                     # entidades y casos de uso PUROS (sin E/S, 100% de cobertura)
│   │   ├── errores/                # errores de dominio compartidos
│   │   ├── ejercicio/              # ejercicio.entity.ts, validar-ejercicio.ts, extraer-id-youtube.ts
│   │   ├── categoria/              # categoria.entity.ts, validar-categoria.ts, retirar-categoria-de-ejercicios.ts
│   │   ├── planificacion/          # planificacion.entity.ts, es-activa.ts, validar-fecha-inicio.ts, duplicar-planificacion.ts
│   │   ├── progreso-diario/        # progreso-diario.entity.ts, calcular-porcentaje-dia.ts
│   │   └── sincronizacion/         # decidir-accion-sincronizacion.ts
│   ├── application/
│   │   ├── ports/                  # interfaces hacia infraestructura (repositorios, sincronización)
│   │   └── casos-uso/              # orquestación: cargar vía puertos → llamar al dominio → guardar
│   ├── infrastructure/
│   │   ├── persistencia-sqlite/    # sqlite.worker.ts (VFS opfs-sahpool), conexión, esquema y adaptadores por agregado
│   │   └── github-sync/            # cliente de la API de contenidos de GitHub (datos.json + imagenes/)
│   └── presentation/
│       ├── biblioteca-ejercicios/      # US1 - crear/editar/categorizar ejercicios
│       ├── busqueda-ejercicios/        # US2 - buscar y consultar ejercicios
│       ├── planificacion-semanal/      # US3 - planificaciones, plantillas, calendario
│       ├── progreso-diario/            # US4 - marcar realizado y ver progreso
│       ├── sincronizacion/             # US5 - configuración del token, sincronización y conflictos
│       └── compartido/
│           ├── shell/                  # barra superior, menú y rutas
│           ├── ui/                     # cabecera, estado vacío y feedback reutilizables
│           └── embebidos/              # reproductor de YouTube y previsualización de enlaces externos
├── assets/
│   └── catalogo-predefinido/       # datos semilla del catálogo de ejercicios de fábrica (FR-034)
└── main.ts

tests/
├── unit/
│   ├── domain/
│   ├── application/
│   └── infrastructure/             # adaptadores SQLite contra una base de datos en memoria
└── component/
    └── presentation/                   # componentes funcionales y pruebas del UI compartido
```

**Structure Decision**: Proyecto único Angular (SPA sin backend) con las cuatro capas obligatorias (`domain/`, `application/`, `infrastructure/`, `presentation/`). Se conserva la organización por áreas funcionales y componentes standalone. Los componentes visuales reutilizables y tokens SCSS permanecen en Presentation y `src/styles/`; no se añade otra capa ni una dependencia. Domain conserva reglas y funciones puras con cobertura del 100%; Application orquesta mediante puertos, e Infrastructure mantiene SQLite WASM y sincronización GitHub. Las pruebas de presentación se mantienen en `tests/component/presentation/`, incluidas las de los componentes compartidos.

## Complexity Tracking

*Sin violaciones de la constitución que requieran justificación: no se añade ninguna capa, proyecto o patrón adicional a los ya exigidos por la constitución.*
