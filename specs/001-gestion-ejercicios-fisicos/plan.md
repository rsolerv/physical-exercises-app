# Implementation Plan: Gestión de Ejercicios Físicos y Planificación Semanal

**Branch**: `001-gestion-ejercicios-fisicos` | **Date**: 2026-10-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-gestion-ejercicios-fisicos/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Aplicación web (SPA) de un único usuario para centralizar la biblioteca de ejercicios físicos (con categorías, enlaces, vídeos e imágenes), planificarlos semanalmente (planificaciones concretas y plantillas reutilizables) y marcar el progreso diario, con persistencia local en el navegador y sincronización manual contra un repositorio de GitHub. Enfoque técnico: Angular 22 (última versión estable) con componentes standalone, Signals como primitiva de estado en Dominio/Aplicación/Presentación, Signal Forms (developer preview) como mecanismo principal de formularios en la capa de Presentación, RxJS/Observables confinados a la capa de Infraestructura (SQLite WASM, cliente HTTP de GitHub), change detection zoneless, y arquitectura en capas (Domain/Application/Infrastructure/Presentation) tal como exige la constitución del proyecto.

## Technical Context

**Language/Version**: TypeScript (versión empaquetada con Angular 22) sobre Angular 22.x (última versión estable disponible; cumple el mínimo "Angular 21 o superior" de la constitución)

**Primary Dependencies**: Angular 22 (standalone components, Signals, `@angular/forms/signals` — Signal Forms en developer preview), Angular Material (única librería de componentes visuales permitida), RxJS (solo en la capa de Infraestructura), Angular `HttpClient` (API REST de GitHub), un paquete oficial de SQLite WASM (ejecución íntegra en el navegador)

**Storage**: SQLite WASM ejecutándose en un Web Worker del navegador con el VFS `opfs-sahpool`, que no requiere cabeceras COOP/COEP y por tanto funciona en GitHub Pages (research.md § 6); sin base de datos gestionada externa. Las imágenes subidas como archivo (máximo 5 MB) se guardan como BLOB en la misma base de datos

**Testing**: Vitest (vía la integración experimental de Angular CLI para Vitest) combinado con `TestBed` de Angular para pruebas de componentes de Presentación; cobertura mínima 80% global y 100% en casos de uso de Dominio, por mandato de la constitución

**Target Platform**: Navegadores web modernos de escritorio y móvil; despliegue exclusivo como sitio estático en GitHub Pages desde un repositorio público de código. Los datos del usuario se sincronizan con un repositorio privado aparte (`data-physical-exercises`)

**Project Type**: Aplicación web de página única (SPA) sin backend — proyecto único estructurado internamente en las cuatro capas obligatorias de la constitución (Domain/Application/Infrastructure/Presentation)

**Performance Goals**: Derivados de los criterios de éxito del spec — localizar un ejercicio en menos de 10s (SC-002), mostrar la planificación del día de forma inmediata al abrir la app (SC-003); no aplican metas de throughput de servidor al no existir backend

**Constraints**: Funcionamiento sin conexión salvo para la sincronización con GitHub (Assumptions del spec); change detection zoneless (sin `zone.js`); cero errores de ESLint; test-first obligatorio; todo el texto de interfaz en español de España

**Scale/Scope**: Un único usuario por instalación, volumen de datos personal (decenas de ejercicios, pocas planificaciones simultáneas); 5 historias de usuario priorizadas (P1–P5) que cubren 36 requisitos funcionales

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio / regla de la constitución | Evaluación | Estado |
|---|---|---|
| I. Idioma y Mercado (Español de España) | Toda la interfaz, mensajes de validación/error y documentación de usuario se redactarán en español de España; sin excepciones de alcance | PASS |
| II. Cero Alcance Fantasma | El plan cubre únicamente FR-001…FR-036 y las 5 historias de usuario del spec; ninguna capacidad adicional (favoritos, estadísticas, multiusuario, etc.) se incluye en el diseño | PASS |
| III. Verificabilidad por una Persona No Técnica | `quickstart.md` documenta únicamente pasos de uso de la interfaz (sin leer código, logs ni la base SQLite) para validar cada historia de usuario | PASS |
| IV. UX Multiplataforma y Accesible | Angular Material + diseño responsive obligatorio; flujos cortos (p. ej. reasignación de categoría en el mismo borrado) orientados a usuarios no técnicos | PASS |
| Arquitectura y Stack Tecnológico | Angular 22 (≥21 ✓), SQLite WASM en navegador ✓, export/import JSON vía API de GitHub ✓, despliegue en GitHub Pages ✓, sin backend propio ✓, Angular Material como única librería visual ✓, arquitectura en 4 capas con dependencias hacia el dominio ✓ | PASS |
| Calidad de Código y Pruebas | SOLID en el diseño de clases; cero errores de ESLint; Vitest como framework de pruebas; cobertura 80% global / 100% en Domain; test-first en el orden de tareas de implementación | PASS |

No se detectan violaciones que requieran justificación; la tabla de Complexity Tracking queda vacía.

**Re-evaluación post-Fase 1 (tras research.md, data-model.md, contracts/ y quickstart.md)**: el diseño resultante no introduce ninguna entidad, capa, dependencia externa ni flujo de interfaz no contemplados en la tabla anterior. La única entidad añadida sin estar en el spec ("Ajustes de aplicación") es de soporte técnico puro (credenciales de sincronización y bandera de semilla del catálogo), imprescindible para implementar FR-002 y FR-034 ya aprobados, por lo que no constituye alcance nuevo (Principio II). **Resultado: todas las filas siguen en PASS.**

**Revisión tras `/speckit-analyze` (2026-10-15)**: se corrigieron cuatro conflictos con la constitución detectados en el análisis. Los casos de uso puros pasan a Domain (research.md § 10); los componentes embebidos pasan de Infrastructure a Presentation; la verificación de la sincronización ya no requiere inspeccionar GitHub (Principio III); y se añade el despliegue en GitHub Pages (research.md § 11). Las tareas se regeneran con tests previos para toda la funcionalidad (test-first).

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
│       └── compartido/                 # shell, navegación, componentes comunes
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
    └── presentation/
```

**Structure Decision**: Proyecto único de Angular (SPA sin backend), sin la división frontend/backend de la Opción 2 del template porque no existe servidor propio. La estructura interna sigue literalmente las cuatro capas obligatorias de la constitución (`domain/`, `application/`, `infrastructure/`, `presentation/`), y dentro de `presentation/` se organiza además por historia de usuario (US1–US5) para permitir entrega y prueba independientes tal como exige el spec. Domain contiene los casos de uso puros (funciones sin E/S, sujetos al 100% de cobertura), y Application solo orquesta: carga datos mediante los puertos, llama al dominio y guarda el resultado (research.md § 10). Todos los componentes Angular, incluidos los embebidos de YouTube y enlaces, viven en Presentation. Los tests espejan esas mismas capas bajo `tests/`.

## Complexity Tracking

*Sin violaciones de la constitución que requieran justificación: no se añade ninguna capa, proyecto o patrón adicional a los ya exigidos por la constitución.*
