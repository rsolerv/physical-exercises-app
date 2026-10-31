# Implementation Plan: Importación y exportación de ejercicios con el repositorio común

**Branch**: `003-importar-exportar-ejercicios` | **Date**: 2026-10-28 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-importar-exportar-ejercicios/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

La pantalla "Importar ejercicios" busca en el repositorio público `rsolerv/common-data-physical-exercises` (rama `main`, lectura sin credenciales) por texto y categoría común, permite seleccionar varios resultados e incorporarlos a la biblioteca del usuario (`datos.json` local), resolviendo antes la correspondencia de categorías no reconocidas. Desde cada resultado también se abre una ficha remota con opción para importar ese ejercicio. En la ficha y edición de un ejercicio propio se ofrece "Subir al repositorio común" y el envío va a `requests`. La cuenta `rsolerv` se acredita validando la PAT guardada con `GET /user`; solo esa cuenta ve y ejecuta las acciones administrativas para revertir la marca local y borrar ejercicios publicados. El borrado remoto prepara un único commit en `main` que actualiza el índice y retira todos los archivos del ejercicio.

## Technical Context

**Language/Version**: TypeScript sobre Angular 22.x (componentes standalone), Signals y `provideZonelessChangeDetection()`, conforme a `specs/001-gestion-ejercicios-fisicos/research.md` §§1-2 (sin NEEDS CLARIFICATION: se reutiliza la decisión ya vigente).

**Primary Dependencies**: `@angular/common/http` (`HttpClient`) para llamar directamente a la API de contenidos de GitHub y a `raw.githubusercontent.com`; `@angular/forms/signals` (Signal Forms) para los diálogos de selección/mapeo de categorías, conforme a research.md §3-4 de 001 (RxJS confinado a Infrastructure, convertido a `Promise`/`Signal` antes de cruzar los puertos de Application).

**Storage**: SQLite WASM (igual que 001): se añade una columna booleana a la tabla `ejercicio` existente (`subido_repositorio_comun`) mediante migración `ALTER TABLE`, sin nueva tabla. No hay almacenamiento adicional del lado remoto gestionado por la aplicación (el repositorio común vive fuera de su control).

**Testing**: Vitest (unitario para Domain/Application) + `TestBed` de Angular para componentes de Presentation, igual que 001 (research.md §5). Cobertura 100% en los casos de uso puros de Domain añadidos (conversión de formato, normalización de nombre, requisito mínimo de subida) y ≥80% global, conforme a la constitución.

**Target Platform**: Navegador (SPA publicada en GitHub Pages), igual que 001/002; sin backend propio.

**Project Type**: Aplicación web Angular de un solo proyecto (frontend-only), misma estructura que 001/002.

**Performance Goals**: Una búsqueda explícita en "Importar ejercicios" (tras pulsar "Buscar") debe mostrar resultados en menos de 3 segundos con una conexión normal y un catálogo común de tamaño moderado (decenas a baja centena de ejercicios), coherente con SC-001. No se fija un objetivo de rendimiento para catálogos de gran escala (ver research.md, limitación conocida).

**Constraints**: Sin backend ni servidor intermediario (constitución); autenticación solo con la PAT guardada (sin secretos de cliente embebidos); todas las llamadas de lectura pública deben funcionar sin ese token. Las operaciones administrativas requieren validar `login === 'rsolerv'`; el borrado necesita permiso de escritura sobre `main` y no fuerza cambios concurrentes. Debe seguir funcionando la aplicación local-first si el repositorio común no está disponible (solo se ve afectada esta feature, no el resto de la aplicación).

**Scale/Scope**: 3 historias de usuario (importar, subir, administración), 2 pantallas de importación (resultados y previsualización), ampliaciones de ficha/edición, 1 puerto nuevo, 4 casos de uso nuevos, 1 campo nuevo en una entidad existente.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio / regla | Evaluación |
|---|---|
| I. Idioma y Mercado (español de España) | PASS. Todos los textos de la nueva pantalla y diálogos se redactan en español de España, igual que el resto de la aplicación. |
| II. Cero Alcance Fantasma | PASS. Cada elemento del plan traza a un FR de `spec.md`; no se añade ninguna capacidad no especificada (p. ej. no se crea un índice remoto de búsqueda ni un seguimiento del resultado de la fusión automática, por no estar en el alcance aprobado). |
| III. Verificabilidad por una persona no técnica | PASS. Los criterios de aceptación de la spec se comprueban navegando la aplicación (buscar, marcar casillas, importar; abrir ficha, subir, confirmar). `quickstart.md` documenta los pasos manuales. |
| IV. Experiencia multiplataforma y accesible | PASS. La pantalla "Importar ejercicios" reutiliza el layout responsive ya validado de "Buscar" (research.md/contracts de 001); los diálogos de categoría usan Angular Material y cumplen WCAG 2.1 AA igual que el resto de formularios. |
| V. Prototipo y aprobación en Storybook | La pantalla de resultados original tuvo sus historias y aprobación en la implementación inicial (T007-T008). Para esta ampliación, el propietario pidió expresamente no preparar un prototipo Storybook; por tanto la ficha de previsualización se implementa directamente conforme a esta enmienda de Living Spec. |
| Arquitectura en capas (Domain/Application/Infrastructure/Presentation) | PASS. Ver "Project Structure": nuevo puerto en Application, nuevo adaptador en Infrastructure, funciones puras nuevas en Domain, componentes nuevos/ampliados en Presentation; las dependencias siguen fluyendo hacia el dominio. |
| Sincronización de datos (destinos permitidos, un único activo) | PASS, sin enmienda constitucional. El repositorio común **no es un destino de sincronización** de los datos propios del usuario (no reemplaza, amplía ni compite con GitHub/Google/copia manual de 001/002): es una fuente de catálogo compartido de solo ejercicios, de un repositorio público fijo, con flujo unidireccional explícito (importar o subir uno o varios ejercicios), no una sincronización bidireccional del estado íntegro del usuario. Reutiliza el token de GitHub ya guardado para un repositorio **adicional** fijo por la aplicación, no configurable por el usuario; no se introduce un nuevo "destino de sincronización" en el sentido de la constitución. Ver research.md (decisión de reutilización de credenciales) y la nueva sección 25 en `specs/001-gestion-ejercicios-fisicos/research.md`. |
| Autorización sin secretos de cliente | PASS. Se reutiliza el token de acceso personal que el usuario ya introdujo manualmente (FR-037 de 001); no se añade ningún secreto embebido en el código. |
| Calidad de código y pruebas (SOLID, ESLint 0 errores, Vitest, cobertura) | PASS, ver "Testing" arriba. Se extrae un util compartido de lectura/escritura de contenidos de GitHub (base64, fallback a la API de blobs) para no duplicar lógica entre `github-sync.adapter.ts` y el nuevo adaptador del repositorio común (ver research.md). |

No se han identificado violaciones que requieran justificación en "Complexity Tracking".

## Project Structure

### Documentation (this feature)

```text
specs/003-importar-exportar-ejercicios/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   ├── repositorio-comun.port.md
│   └── interfaz-usuario.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

Proyecto único (frontend Angular, sin backend), misma estructura en capas que `001-gestion-ejercicios-fisicos`. Esta feature solo añade o amplía los siguientes ficheros (el resto del árbol existente no cambia):

```text
src/app/
├── domain/
│   └── ejercicio/
│       ├── normalizar-nombre-ejercicio.ts        # nuevo: trim + minúsculas para comparar nombres
│       ├── cumple-requisito-repositorio-comun.ts # nuevo: ≥1 imagen o ≥1 enlace YouTube
│       └── convertir-ejercicio-comun.ts          # nuevo: Ejercicio local ⇄ EjercicioComunArchivo
├── application/
│   ├── ports/
│   │   └── repositorio-comun.port.ts             # nuevo puerto (leer, buscar, comprobar, subir, borrar e identidad)
│   │   # ejercicio-repository.port.ts: marcar y revertir marca administrativamente
│   └── casos-uso/
│   ├── buscar-ejercicios-comunes.use-case.ts     # nuevo (US1), ampliado para consulta previa por id
│       ├── importar-ejercicios-comunes.use-case.ts   # nuevo (US1)
│       ├── subir-ejercicio-comun.use-case.ts         # nuevo (US2)
│       └── administrar-repositorio-comun.use-case.ts # nuevo (US3), vuelve a acreditar antes de mutar
│   └── configuracion/
│       └── administrador.config.ts                   # login GitHub fijo: rsolerv
├── infrastructure/
│   ├── github-sync/
│   │   └── github-contenido.util.ts              # nuevo: extraído de github-sync.adapter.ts (DRY)
│   ├── repositorio-comun/
│   │   └── repositorio-comun.adapter.ts          # nuevo adaptador HTTP directo (API de contenidos + raw)
│   └── persistencia-sqlite/
│       ├── esquema.ts                            # ampliado: columna subido_repositorio_comun
│       ├── motor-sqlite.ts                       # ampliado: migración ALTER TABLE
│       └── ejercicio-repository.sqlite.ts        # ampliado: lee/escribe la columna nueva
└── presentation/
    ├── importar-ejercicios/                      # nuevo (US1), estructura hermana de busqueda-ejercicios/
    │   ├── importar-ejercicios.component.ts
    │   ├── previsualizar-ejercicio-comun.component.ts
    │       ├── confirmar-eliminar-ejercicio-comun-dialog.component.ts
    │   ├── mapear-categoria-importada-dialog.component.ts
    │   └── ...
    └── biblioteca-ejercicios/
        ├── ejercicio-ficha.component.ts          # subir y quitar marca solo para administrador
        ├── ejercicio-formulario.component.ts     # ampliado: misma acción en edición
        └── subir-ejercicio-comun-dialog.component.ts  # nuevo: selección de categorías comunes + confirmación

tests/unit/
├── domain/                 # specs de las 3 funciones puras nuevas (cobertura 100%)
├── application/             # specs de los 3 casos de uso nuevos
└── infrastructure/          # spec del nuevo adaptador y del util compartido
```

**Structure Decision**: Se reutiliza íntegramente la arquitectura en capas y la convención "un subdirectorio de Presentation por historia de usuario" ya establecidas en 001 (research.md §9). Las pantallas de lista y previsualización de US1 comparten `importar-ejercicios/`; las acciones administrativas se integran en esas pantallas y en `biblioteca-ejercicios/`. Se usa Git Database API para aplicar la eliminación del catálogo en un commit único y el CAS de referencia no forzado para evitar sobrescribir cambios concurrentes.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

Ninguna. El Constitution Check no identifica violaciones; esta tabla se deja vacía intencionadamente.

## Constitution Check (re-evaluación tras la Fase 1)

El diseño detallado en `research.md`, `data-model.md` y `contracts/` no introduce ninguna desviación nueva respecto al Constitution Check inicial: el nuevo puerto y adaptador siguen la misma arquitectura en capas; no se añade ningún destino de sincronización ni ningún secreto embebido; la única columna SQLite nueva se añade por migración no destructiva. Para esta ampliación se registra en la tabla anterior la decisión explícita del propietario de omitir Storybook. **PASS**.
