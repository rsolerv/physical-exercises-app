# Implementation Plan: Rediseño de la experiencia de ejercicios y planificación

**Branch**: `001-gestion-ejercicios-fisicos` | **Date**: 2026-10-20 | **Spec**: [spec.md](./spec.md)

## Summary

Actualizar la presentación de la aplicación y los flujos ya existentes para que biblioteca, búsqueda, ficha, planificación, progreso, categorías y sincronización compartan un sistema visual claro, accesible y responsive. La navegación cambia según el dispositivo; búsqueda en escritorio conserva su lista al mostrar una ficha; el constructor permite localizar ejercicios; las eliminaciones y cambios de progreso se pueden deshacer mientras la notificación está visible.

El alcance viene de la Living Spec actual (US1–US6, FR-038–FR-084 y los requisitos de negocio relacionados). Se conserva la aplicación Angular sin backend, sus cuatro capas, las reglas de dominio y el almacenamiento SQLite WASM. No se crea una feature nueva, no se añade una dependencia npm y los cambios de interfaz no introducen nuevas entidades persistentes.

## Technical Context

**Language/Version**: TypeScript 6 y Angular 22.2.x, ya instalados.

**Primary Dependencies**: Angular standalone, Signals, Signal Forms, Angular Material 3 y Angular CDK existentes. SQLite WASM, Vitest y Angular `TestBed` se mantienen. No se prevén nuevas dependencias de ejecución.

**Storage**: SQLite WASM dentro de un Web Worker y VFS `opfs-sahpool`. El modelo de negocio se mantiene; Ajustes de aplicación incorpora la fecha-hora de la última sincronización correcta para cumplir FR-070. Los datos de usuario siguen sincronizándose manualmente con GitHub.

**Testing**: Vitest y Angular `TestBed`; desarrollo test-first. Se mantienen los umbrales del proyecto (80 % global y 100 % en Domain), cero errores de ESLint y validación manual de contraste, teclado y adaptación visual. Los escenarios de navegación, edición, deshacer y estados deben probarse además de los de presentación.

**Target Platform**: Navegadores modernos en móvil, tablet y escritorio; aplicación estática en GitHub Pages. La interfaz normal continúa disponible sin conexión.

**Project Type**: SPA web sin backend, organizada en Domain, Application, Infrastructure y Presentation.

**Performance Goals**: Cumplir los presupuestos existentes: bundle inicial con aviso en 700 kB y error en 1.5 MB; estilos por componente con aviso en 4 kB y error en 8 kB. Con los datos cargados, una búsqueda por texto o categoría y un cambio de día deben actualizar el contenido visible en menos de 1 segundo, sin bloquear la interacción (SC-031); `quickstart.md` define la comprobación manual.

**Constraints**:
- Todo el texto visible y los mensajes permanecen en español de España.
- Angular Material continúa siendo la única biblioteca de componentes visuales.
- Navegación, formularios y acciones funcionan con teclado y tacto, y cumplen los umbrales de contraste de la spec.
- Rangos de referencia: móvil ≤599 px, tablet 768–1024 px y escritorio ≥1280 px; también se validan los anchos intermedios y menores de 360 px.
- Roboto Flex se sirve localmente para no depender de una conexión o CDN.
- La acción temporal "Deshacer" conserva en memoria solo la instantánea necesaria durante la notificación; no se crea historial persistente.

**Scale/Scope**: Un usuario por instalación. Se rediseñan las pantallas y comportamientos descritos en la spec vigente. Las reglas de negocio, la forma de sincronización, el catálogo y las entidades permanecen sin cambios, salvo los mecanismos de restauración necesarios para cumplir FR-069 y FR-075.

## Constitution Check

*Gate inicial y posterior al diseño: comprobar que el plan permanece dentro de la spec aprobada y la constitución.*

| Principio / regla | Evaluación | Estado |
|---|---|---|
| I. Idioma y mercado | Etiquetas, errores, estados y ayudas nuevos en español de España. | PASS |
| II. Cero alcance fantasma | Cada flujo nuevo o modificado se traza a FR-044–FR-084 o a requisitos de negocio existentes. | PASS |
| III. Verificabilidad por una persona no técnica | La navegación, las vistas, los estados y las operaciones reversibles tienen recorridos de validación manual en `quickstart.md`. | PASS |
| IV. Experiencia multiplataforma y accesible | Se cubren navegación móvil/tablet/escritorio, anchos intermedios, teclado, foco y contraste WCAG 2.1 AA. | PASS |
| Arquitectura y stack | Se reutilizan Angular Material y las cuatro capas; no se añade backend, framework ni tecnología de almacenamiento. Solo se amplía el ajuste técnico existente en SQLite. La restauración temporal se orquesta en Application y Presentation. | PASS |
| Calidad y pruebas | Se planifican pruebas previas a implementación, Vitest, TestBed, lint, build y comprobación manual visual. Se mantienen los umbrales actuales. | PASS |

## Phase 0: Research

La investigación técnica previa de Angular, SQLite WASM, Signal Forms, Vitest y arquitectura sigue vigente. Se añadieron en [research.md](./research.md) decisiones transversales para búsqueda/ficha, navegación por dispositivo, sistema visual, fuente local, deshacer temporal, fecha de sincronización y selección de ejercicios. No quedan `NEEDS CLARIFICATION` ni elecciones de tecnología pendientes, y no se requieren nuevas dependencias.

## Phase 1: Design

### Estrategia de diseño

1. **Fundación visual y shell**: centralizar tokens de color, tipografía, espaciado y radios en los estilos globales existentes; servir la fuente localmente; adaptar el shell a barra inferior y panel "Más" en móvil, riel lateral en tablet y menú agrupado en escritorio.
2. **Biblioteca y categorías**: rediseñar la ficha y los formularios de ejercicio; tratar imágenes y vistas previas de enlaces según la spec; permitir edición de categoría en línea, informar el recuento de ejercicios y restaurar borrados desde una instantánea temporal. En el alta, ofrecer agregar el ejercicio al día actual solo si hay una planificación activa esta semana.
3. **Búsqueda**: compactar los filtros y resultados para móvil y añadir una vista maestro-detalle en escritorio sin perder búsqueda ni selección. Los resultados muestran nombre, descripción y categorías separadas, sin imágenes ni vistas previas; estas permanecen en la ficha. Mantener una ficha de pantalla completa en móvil.
4. **Planificación semanal**: usar la tira de días en móvil y la cuadrícula de siete columnas en escritorio, seleccionar planes desde la cabecera y abrir desde "Agregar ejercicio" una pantalla independiente para buscar por nombre parcial o categoría y seleccionar varios ejercicios. El día actual ya seleccionado no repite la etiqueta "Hoy"; el calendario de fecha de inicio sigue accesible durante la edición en móvil.
5. **Hoy y progreso**: priorizar sesión actual, mostrar estados inicial/parcial/completo y permitir marcar/deshacer también desde la ficha cuando el ejercicio esté planificado hoy.
6. **Sincronización**: presentar una tarjeta con estado, acción principal y acceso a configuración plegable cuando ya esté configurada; conservar las reglas actuales de sincronización y conflicto.
7. **Validación transversal**: verificar navegación, errores, cargas, foco, tamaños táctiles, contraste, anchos de referencia, uso del ancho disponible en el formulario de ejercicio y el editor semanal, y los flujos de regresión de datos.

Las pantallas comparten los contratos de interacción descritos en [contracts/interfaz-usuario.md](./contracts/interfaz-usuario.md). Los detalles normativos de cada pantalla y sus criterios de aceptación permanecen en [spec.md](./spec.md).

### Modelo de datos

No se añade entidad de negocio ni se modifican los modelos de Ejercicio, Categoría, Planificación, Día de planificación o Progreso diario. Ajustes de aplicación sí incorpora la columna técnica `ultimaSincronizacionCorrecta` para que FR-070 pueda mostrar la fecha tras una recarga; la actualización del esquema debe mantener los datos existentes y dejar el valor nulo en instalaciones anteriores. Para deshacer, Application conserva en memoria una instantánea del registro eliminado y las relaciones que la spec exige restaurar; al vencer o descartarse la notificación, esa referencia temporal se libera. La instantánea no se sincroniza ni sobrevive a una recarga.

### Interfaces y contratos

- **Interfaz de usuario**: el contrato observable por la persona usuaria se especifica en [contracts/interfaz-usuario.md](./contracts/interfaz-usuario.md) y en los escenarios de `spec.md`.
- **Servicios externos**: no se introduce una API ni una integración externa nueva. Los contratos existentes de los puertos de repositorio y GitHub siguen siendo la referencia para las llamadas entre capas. El puerto de ajustes expone la fecha de última sincronización; los contratos de ejercicio y categoría documentan la restauración de registros; Application coordina la restauración de asociaciones con planificación a partir de la instantánea.

### Quickstart de validación

[quickstart.md](./quickstart.md) documenta los prerrequisitos y recorridos manuales de las seis historias, además de la validación de Vitest, lint y build. Las instrucciones son comprobables por pantalla y no requieren inspeccionar SQLite, logs o código.

## Constitution Check posterior al diseño

| Principio / regla | Resultado posterior al diseño |
|---|---|
| Idioma y mercado | PASS: las nuevas cadenas de interfaz se mantienen en español de España. |
| Cero alcance fantasma | PASS: el modelo de datos y los flujos se derivan de FR-038–FR-084 y de requisitos ya vigentes. |
| Verificabilidad | PASS: cada grupo de pantallas dispone de recorridos manuales y resultados esperados en `quickstart.md`. |
| UX multiplataforma y accesible | PASS: el contrato especifica navegación, teclado, foco, contraste, tamaños y disposición para los dispositivos acordados. |
| Arquitectura y stack | PASS: sin nuevos proyectos, servicios remotos, almacenes nuevos ni bibliotecas de componentes; se actualiza el esquema técnico existente para guardar la última sincronización. La instantánea de deshacer es estado temporal de la aplicación, no una capa adicional. |
| Calidad y pruebas | PASS: test-first, Vitest, lint, build y validación visual/manual descritos en el plan y quickstart. |

## Project Structure

### Documentación de esta feature

```text
specs/001-gestion-ejercicios-fisicos/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── interfaz-usuario.md
│   └── *-repository.port.md
└── tasks.md                 # Se actualizará con /speckit-tasks
```

### Código existente relacionado

```text
src/
├── styles/                  # tokens globales de espaciado, breakpoints y utilidades
└── app/
    ├── domain/              # entidades y reglas actuales; sin cambios previstos
    ├── application/         # casos de uso; orquestación de restauración temporal si procede
    ├── infrastructure/      # repositorios y SQLite actuales; sin nuevos servicios
    └── presentation/
        ├── compartido/shell/           # navegación adaptada por dispositivo
        ├── compartido/ui/              # estados, avisos y controles reutilizables
        ├── biblioteca-ejercicios/      # formulario, ficha y categorías
        ├── busqueda-ejercicios/        # resultados y vista maestro-detalle de escritorio
        ├── planificacion-semanal/      # calendario, constructor y vista de hoy
        └── sincronizacion/             # configuración, estados y conflictos

public/
└── assets/fonts/             # Roboto Flex y su licencia, servido localmente

tests/
├── unit/                    # Domain, Application e Infrastructure
└── component/presentation/  # pantallas, navegación y controles compartidos
```

**Structure Decision**: Mantener el proyecto Angular SPA y la arquitectura Domain/Application/Infrastructure/Presentation. Los tokens y la fuente se integran en recursos existentes; la interfaz se actualiza en sus áreas funcionales actuales. No se crea una capa de diseño ni un servicio global de historial: los componentes reutilizan los patrones y servicios de presentación existentes, y la coordinación de las operaciones de dominio permanece en Application. La única ampliación de persistencia es la fecha técnica de última sincronización en Ajustes de aplicación.

## Complexity Tracking

No hay excepciones a la constitución que requieran justificación. Las vistas maestro-detalle, la navegación adaptable y la restauración temporal se realizan dentro de las capas y áreas funcionales existentes; no requieren una entidad de negocio, servicios ni dependencias nuevas.
