# Implementation Plan: Gestión integral de ejercicios y planificación semanal

**Branch**: `001-gestion-ejercicios-fisicos` | **Date**: 2026-10-19 | **Spec**: [spec.md](./spec.md)

## Summary

Alcance exclusivo: integrar las opciones de acceso directo a “Nuevo ejercicio” y “Gestionar categorías”, retirar la pantalla “Mis ejercicios” sin perder funciones de dominio y centralizar la consulta del catálogo en “Buscar” (FR-050…FR-054). Se conservan las acciones existentes de edición y eliminación en la ficha a la que se llega desde los resultados. La ruta antigua `/ejercicios` se mantiene únicamente como redirección de compatibilidad a `/buscar`, dado que ya es una ruta pública usada como entrada de la biblioteca y puede haber enlaces guardados. Se preservan las condiciones de presentación ya vigentes para Buscar (FR-039) y el menú móvil (FR-047); no se modifica ningún archivo de implementación de la pantalla Buscar.

## Technical Context

**Language/Version**: TypeScript 6 con Angular 22.2.x, ya instalado y en uso.

**Primary Dependencies**: Angular standalone, Signals y Signal Forms; Angular Material 3 como única librería de componentes visuales; Angular CDK ya instalado; RxJS y `HttpClient` confinados a los adaptadores de infraestructura; `@sqlite.org/sqlite-wasm`. No se prevén dependencias nuevas.

**Storage**: SQLite WASM en un Web Worker del navegador con VFS `opfs-sahpool`; no hay backend ni almacenamiento gestionado externo. Los datos se sincronizan manualmente como JSON y las imágenes locales como documentos separados en el repositorio privado de datos de GitHub.

**Testing**: Vitest y Angular `TestBed`. Se conserva la cobertura mínima del 80% global y del 100% para Domain, ESLint sin errores y desarrollo test-first. La accesibilidad visual y el uso solo con teclado requieren comprobación manual en la interfaz; las reglas de plantillas de ESLint no bastan para demostrar WCAG 2.1 AA.

**Target Platform**: Navegadores modernos de escritorio, tablet y móvil; sitio estático publicado en GitHub Pages desde el repositorio público de código; repositorio privado separado para los datos.

**Project Type**: SPA sin backend, organizada en las cuatro capas exigidas por la constitución: Domain, Application, Infrastructure y Presentation.

**Performance Goals**: Cumplir los presupuestos existentes en `angular.json`: bundle inicial con aviso en 700 kB y error en 1.5 MB; estilos por componente con aviso en 4 kB y error en 8 kB. No aplican metas de throughput de servidor.

**Constraints**: Uso normal disponible sin conexión; sincronización solo bajo acción explícita; detección de cambios zoneless; texto visible en español de España; tema claro; espaciado basado en 8 px; adaptación a todos los anchos, con rangos de referencia móvil ≤599 px, tablet 768–1024 px y escritorio ≥1280 px. Los anchos intermedios también deben funcionar.

**Scale/Scope**: Un usuario por instalación. Este cambio comprende FR-050…FR-054 y las regresiones necesarias para los requisitos modificados FR-039 y FR-047. No hay un FR-055 en la especificación activa; no se añade alcance para ese identificador.

## Constitution Check

*GATE: mantener conformidad durante los cambios pendientes y revalidar antes de cerrar la implementación.*

| Principio / regla                               | Evaluación para este plan                                                                                                                                                                                                  | Estado              |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| I. Idioma y Mercado                             | Las nuevas etiquetas del menú y cualquier feedback permanecen en español de España.                                                                                                                                       | PASS                |
| II. Cero Alcance Fantasma                       | El alcance se limita a FR-050…FR-054 y a pruebas de regresión de FR-039/FR-047; FR-055 no existe en la especificación activa. No se incorporan funciones nuevas.                                                            | PASS                |
| III. Verificabilidad por una Persona No Técnica | Menú, redirección antigua, catálogo sin filtros, navegación a ficha y menú móvil se comprueban recorriendo la aplicación; las pruebas automatizadas respaldan esas verificaciones.                                        | PASS                |
| IV. UX Multiplataforma y Accesible              | Se mantienen el listado legible y desplazable de Buscar (FR-039) y el menú overlay móvil de ancho completo con cierre tras seleccionar una entrada (FR-047); se validan en móvil, tablet y escritorio.                   | PASS                |
| Arquitectura y Stack                            | Solo cambia Presentation y su configuración de rutas; permanecen las cuatro capas, la persistencia SQLite WASM, el catálogo de fábrica y la lógica de dominio. No se modifica código de la pantalla Buscar.                | PASS                |
| Calidad de Código y Pruebas                     | Vitest y test-first para rutas, menú y regresiones de catálogo/acciones; se ejecutan las pruebas dirigidas y ESLint sin alterar la cobertura de Domain.                                                                   | PASS                |

## Revisión del código existente

La entrada actual `/ejercicios` muestra `BibliotecaListadoComponent`, y figura como “Mis ejercicios” en el menú. Al ser ya la ruta canónica de esa pantalla, es razonable que existan marcadores o enlaces guardados: se conserva esa URL como redirección exacta a `/buscar`, sin mantener la pantalla ni una opción del menú con ese nombre. Las rutas de detalle `/ejercicios/:id`, edición `/ejercicios/:id/editar`, alta `/ejercicios/nuevo` y categorías `/ejercicios/categorias` son distintas y se conservan.

“Buscar” ya llama a `BuscarEjerciciosUseCase`, que devuelve `listarTodos()` cuando texto y categorías están vacíos; sus resultados enlazan a `/ejercicios/:id`, cuya ficha ya ofrece editar y eliminar. Se conservan esas capacidades existentes: la pantalla Buscar, su plantilla, estilos, componente y caso de uso no se modifican. La ficha debe volver a `/buscar` después de eliminar, en vez de navegar a la antigua URL de biblioteca. El catálogo predefinido, entidades, reglas, casos de uso y persistencia no se alteran.

El menú móvil ya usa modo overlay en ≤599 px, ocupa el ancho completo mediante sus estilos responsive y se cierra al activar una entrada. Las nuevas opciones reutilizarán la misma navegación; las pruebas de regresión confirmarán tamaño, cierre y navegación sin reimplementar un comportamiento que ya satisface FR-047.

## Enfoque de implementación

1. Escribir primero pruebas dirigidas que verifiquen el menú exacto, acceso directo a `/ejercicios/nuevo` y `/ejercicios/categorias`, ausencia de la opción antigua, y redirección de `/ejercicios` a `/buscar` sin renderizar la pantalla retirada.
2. Añadir “Nuevo ejercicio” y “Gestionar categorías” a `MENU_PRINCIPAL`, con las rutas ya existentes; quitar “Mis ejercicios”. Mantener el cierre del menú al seleccionar cualquiera de las seis entradas.
3. Eliminar la ruta de componente que servía `BibliotecaListadoComponent`; sustituir únicamente la ruta exacta `/ejercicios` por una redirección de compatibilidad a `/buscar`. Conservar las rutas de alta, categorías, detalle y edición. Actualizar la navegación posterior al borrado de la ficha para volver a `/buscar`.
4. Eliminar los archivos exclusivos del listado retirado (`biblioteca-listado.component.ts`, `.html`, `.scss`) y su prueba dedicada. Limpiar imports/comentarios y retirar o sustituir solo los casos de integración/pruebas que exijan esa pantalla o su entrada de menú; conservar las pruebas de alta, edición, detalle y categorías.
5. Añadir pruebas de regresión para que “Buscar” sin filtros presente todos los ejercicios y sus resultados permitan abrir la ficha, desde la que se mantienen edición y eliminación. Limitar los cambios de pruebas a la cobertura: no tocar archivos de implementación de `presentation/busqueda-ejercicios/`.
6. Añadir o adaptar pruebas del menú móvil para constatar overlay de ancho completo hasta 599 px, ausencia de compresión del contenido, cierre al elegir secciones/acciones y navegación funcional con las dos nuevas opciones. Comprobar también que “Mis ejercicios” no aparece en móvil, tablet (768 y 1024 px) ni escritorio. Si la conducta ya existente pasa, no cambiar su implementación.
7. Comprobar manualmente FR-039 en “Buscar” (elementos diferenciados, nombre/descripcion legibles, ajuste de texto y scroll vertical sin scroll horizontal) sin modificar el código de esa pantalla. Conservar todos los datos, el catálogo, la lógica de dominio, repositorios y esquema SQLite.
8. Ejecutar las pruebas Vitest dirigidas de rutas, menú, búsqueda y ficha; después lint y build según los scripts existentes. Verificar el recorrido desde el menú y desde un enlace antiguo en escritorio y móvil, así como edición/eliminación desde resultados y retorno a “Buscar”.

El cambio queda validado cuando no hay pantalla ni enlace de menú “Mis ejercicios”, la URL antigua redirige a “Buscar”, la búsqueda sin filtros expone todo el catálogo y las operaciones existentes de ejercicio siguen disponibles; también deben pasar los criterios de regresión FR-039 y FR-047. No se cambian otros flujos funcionales.

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
│       ├── biblioteca-ejercicios/      # formularios, ficha y categorías; sin listado independiente
│       ├── busqueda-ejercicios/        # pantalla existente, fuera de cambios de implementación
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
