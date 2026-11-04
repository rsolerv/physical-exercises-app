# Implementation Plan: Rediseño de la experiencia de ejercicios y planificación

**Branch**: `001-gestion-ejercicios-fisicos` | **Date**: 2026-10-20 | **Spec**: [spec.md](./spec.md)

## Summary

Actualizar la presentación de la aplicación y los flujos ya existentes para que biblioteca, búsqueda, ficha, planificación, progreso, categorías y sincronización compartan un sistema visual claro, accesible y responsive. La navegación cambia según el dispositivo; la búsqueda abre la ficha en una pantalla dedicada; el constructor permite localizar y añadir ejercicios con rapidez; las eliminaciones y cambios de progreso se pueden deshacer mientras la notificación está visible.

El alcance viene de la Living Spec actual (US1–US6, FR-038–FR-084 y los requisitos de negocio relacionados). Se conserva la aplicación Angular sin backend, sus cuatro capas, las reglas de dominio y el almacenamiento SQLite WASM. No se crea una feature nueva, no se añade una dependencia npm y los cambios de interfaz no introducen nuevas entidades persistentes.

**Enmienda vigente 2026-11-04**: Se añade la paginación SQL y la lectura ligera de búsquedas (FR-086–FR-095, SC-035–SC-038) dentro de US2/US3. El diseño y la secuencia de esta ampliación se detallan al final de este plan y prevalecen para esas lecturas sobre las notas anteriores de «sin cambios» en Domain/Infrastructure. La funcionalidad está aprobada; el prototipo visual todavía debe aprobarse antes de implementar presentación.

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
3. **Búsqueda**: compactar los filtros y resultados; al seleccionar un resultado, abrir la ficha en una pantalla dedicada tanto en escritorio como en móvil. Los resultados muestran nombre, descripción y categorías separadas, sin imágenes ni vistas previas; estas permanecen en la ficha.
4. **Planificación semanal**: usar la tira de días en móvil y la cuadrícula de siete columnas en escritorio, seleccionar planes desde la cabecera y abrir desde "Agregar ejercicio" una pantalla independiente para buscar por nombre parcial o categoría y seleccionar varios ejercicios. Cada selección se añade inmediatamente al día, sin confirmación adicional. El día actual ya seleccionado no repite la etiqueta "Hoy"; el calendario de fecha de inicio sigue accesible durante la edición en móvil.
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
        ├── busqueda-ejercicios/        # resultados y acceso a fichas de ejercicio
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

No hay excepciones a la constitución que requieran justificación. La navegación adaptable y la restauración temporal se realizan dentro de las capas y áreas funcionales existentes; no requieren una entidad de negocio, servicios ni dependencias nuevas.

## Enmienda 2026-11-04: paginación SQL y resúmenes de ejercicios

### Objetivo y límites

Servir Buscar y los candidatos del selector por páginas SQL, con 50 resultados iniciales en todos los dispositivos, evitando recuperar el catálogo completo para esas búsquedas y evitando hidratar medios que no se muestran. Buscar sustituye la página mediante `MatPaginator`; el selector conserva los bloques recibidos y solicita los siguientes con "Cargar más".

Esta enmienda no modifica la ficha, los formatos de sincronización/backup, los destinos autorizados ni el catálogo común de la feature 003. Tampoco redefine `listarTodos()` ni pagina los ejercicios de una sesión o planificación ya existente. Los requisitos técnicos transversales son los de [research.md](./research.md), secciones 1–6 y decisión 30.

### Diseño por capas y superficies afectadas

| Superficie | Modificación prevista |
|---|---|
| `src/app/domain/ejercicio/ejercicio.entity.ts` | Añadir el tipo puro `EjercicioResumen`: id, nombre, descripción completa y categoríaIds. Sin campos de detalle ficticios y sin cambiar `Ejercicio` ni sus invariantes. |
| `src/app/application/ports/ejercicio-repository.port.ts` y `src/app/application/models/busqueda-ejercicios.ts` (nuevo módulo de tipos) | Añadir criterios/resultado tipados, `buscarPaginado` y `contarTodos`; retirar búsquedas completas por texto/categorías al migrar consumidores. Todos los métodos siguen devolviendo Promises. |
| `src/app/application/casos-uso/buscar-ejercicios.use-case.ts` | Normalizar criterios, validar página/tamaño/desplazamiento, valores iniciales 0/50 y delegación de búsqueda/conteo. Eliminar intersección y lectura completa de ejercicios. |
| `src/app/infrastructure/persistencia-sqlite/ejercicio-repository.sqlite.ts` | Consulta parametrizada combinada de texto + `EXISTS` de categorías, conteo con idéntico predicado, orden estable `nombre, id`, límite/desplazamiento SQL y lote de categorías para los ids de la página. No invocar `hidratar` ni consultar imágenes/enlaces en esta ruta. |
| `src/app/infrastructure/persistencia-sqlite/esquema.ts` | Crear índices idempotentes para `(nombre, id)` y `(categoria_id, ejercicio_id)`, conservando las tablas/datos y las migraciones existentes. Verificar inicialización nueva y de base existente. |
| `src/app/presentation/busqueda-ejercicios/busqueda-ejercicios.component.{ts,html,scss}` | `resource` por clave de filtros/página/tamaño; usar `total` de SQL, contador global ligero solo para distinguir vacíos, `MatPaginator`, estados de carga/error, reintento y reajuste de página. Ningún `slice` de un catálogo completo. |
| `src/app/presentation/compartido/ejercicios/ejercicio-list-item.component.ts` | Aceptar `EjercicioResumen` para no exigir campos ausentes en las listas. Mantener el acceso a la ficha por id. Revisar todos sus usos, incluidas historias/pruebas. |
| `src/app/presentation/biblioteca-ejercicios/ejercicio-ficha.component.ts` y contexto de navegación de Buscar | Conservar el regreso a criterios/tamaño/página al volver y refrescar tras editar/borrar; mantener el ejercicio completo y los medios. No añadir una ruta de negocio nueva. |
| `src/app/presentation/planificacion-semanal/constructor/agregar-ejercicio/agregar-ejercicio.component.{ts,html,scss}` | Solicitar páginas SQL de 50, acumular solo las recibidas, controlar clave activa y petición en curso, errores y foco. Añadir entrada de ids asignados al día y vincular cada opción a ella. |
| `src/app/presentation/planificacion-semanal/constructor/planificacion-constructor.component.{ts,html}` | Pasar las asignaciones del día activo, usarlas para contador/selección y conservar las operaciones actuales de añadir/quitar y sus errores. No derivar el conjunto seleccionado del bloque visible. |
| `src/stories/demo-data.ts`, `src/stories/pantallas.stories.ts` y nuevas historias de paginación en `src/stories/` | Migrar proveedores/dobles al contrato paginado y resumido; preparar prototipos y estados sin mezclar resumen con agregado. |
| Pruebas que implementan `EjercicioRepositoryPort` | Migrar todos los dobles y expectativas de búsquedas antiguas; revisar tests de Application, SQLite, pantallas y Storybook para mantener el tipado. |

No se crea un componente personalizado para sustituir `MatPaginator` ni un componente exclusivo para envolver un botón Material. Se reutilizan las primitivas existentes; solo se extrae una pieza común si durante la implementación existe lógica compartida real. La traducción de `MatPaginatorIntl`, los anuncios CDK y los estilos usan los patrones actuales de Presentation.

### Lectura SQL y costes

Una lectura de página ejecuta como máximo tres consultas: conteo de coincidencias, filas de la página y asociaciones de categorías en lote. `contarTodos()` es una consulta adicional ligera del catálogo, reutilizable hasta invalidación, no una carga por cada tecla/página. El `COUNT` y el filtro de texto pueden recorrer muchas filas, pero no transportan imágenes ni hidratan el conjunto completo.

Los índices apoyan orden y asociaciones; no se presume que resuelvan la búsqueda de subcadenas `LIKE '%texto%'`. Se mantiene el comportamiento lingüístico vigente y no se añade FTS. `OFFSET` es la elección inicial documentada, con coste creciente en páginas profundas; SC-038 obliga a verificar el rendimiento real, no a deducirlo de que la base sea local.

Los consumidores heredados de `listarTodos()` en categorías, Hoy, calendario y constructor conservan lecturas completas para sus usos actuales. En particular, el constructor aún carga el catálogo para resolver sus referencias: migrar solo su selector no elimina ese coste del padre. Esta enmienda acota las nuevas consultas de candidatos, no promete que toda la pantalla de planificación deje de efectuar cualquier lectura completa. No se sustituye esa lectura por una primera página, porque perdería nombres/referencias; una futura optimización debe consultar los ids necesarios sin truncar resultados.

### Estado, asincronía e invalidación

1. La clave activa incluye texto normalizado, categorías, página/tamaño y generación del catálogo. Reiniciar filtros reinicia la posición antes de solicitar los nuevos resultados.
2. Solo una respuesta de la clave/generación vigente se muestra o concatena. Cancelar lógicamente una petición no exige que SQLite interrumpa la consulta, pero su respuesta anterior nunca modifica el estado actual.
3. En Buscar, confirmar página/rango al éxito; un error deja el contexto para reintentar sin mostrar cero coincidencias. Al volver desde ficha, conservar criterios/tamaño/página y consultar datos actualizados.
4. En el selector, almacenar la siguiente página pendiente separada de los bloques confirmados. Deshabilitar cargas repetidas y avanzar solo al éxito; un fallo no vacía el acumulado ni se salta un bloque.
5. El constructor es la fuente de ids seleccionados por día. Cargar, filtrar o desmontar opciones no emite deselecciones artificiales. Se mantienen los errores y la persistencia ya existentes del flujo de planificación.
6. Edición/borrado/importación/sincronización aplicada invalida los datos afectados; no se añade un nuevo servicio remoto o un historial de cambios. Reutilizar puntos de finalización existentes y refrescar al reentrar. Si la invalidación sucede durante una lectura, descartar su resultado y repetirla. Buscar ajusta al último índice válido y el selector reinicia candidatos preservando asignaciones válidas.

### Integridad de sincronización, copias y otras operaciones

| Flujo | Contrato a preservar | Verificación |
|---|---|---|
| `ExportarImportarDatosUseCase` | `listarTodos()` y ejercicios completos; todos los campos, medios y relaciones, independientemente de filtros/página | Exportación/importación con más de 100 ejercicios y un medio en un ejercicio no visitado |
| `SincronizarUseCase` y proveedores GitHub/Google | Reutilizar exportación completa, imágenes separadas, reglas de conflicto y recuperación; no usar `buscarPaginado` | Regresión de ambos destinos con todas las páginas incluidas y prueba manual en dos perfiles |
| `CopiaManualUseCase` y ZIP/JSON | Copia y restauración completas, compatibles con el formato vigente | Restaurar en otro perfil y localizar ejercicios/medios no consultados |
| Ficha, edición, borrado y deshacer | Agregado completo mediante `obtenerPorId` y operaciones actuales | Abrir desde la tercera página, editar/borrar, volver y deshacer con asociaciones conservadas |
| Categorías, Hoy, calendario y referencias del constructor | No recibir una página en lugar del catálogo requerido; conteos y ejercicios asignados siguen completos | Referencias a ids situados después de los 50 primeros |
| Importación/contribución del catálogo común | Contratos de la feature 003 intactos | Compilación y regresiones existentes; la importación aplicada invalida búsquedas locales al regresar |

No hay un nuevo formato serializado, migración de documentos ni cambio de versión de copia. Los índices son locales y recreables. Las mejoras técnicas de transmisión por lotes de una exportación completa no forman parte de esta enmienda.

### Prototipo, pruebas y secuencia de entrega

1. Mantener los documentos de esta Living Spec y el contexto activo en `001-gestion-ejercicios-fisicos`; no crear feature ni sobrescribir el trabajo anterior.
2. El agente `ux-ui-expert` prepara historias navegables de ambas pantallas con shell/rutas reales y estados del [contrato de interfaz](./contracts/interfaz-usuario.md), ejecuta `npm run build-storybook` y `npm run storybook`, presenta URL y capturas 390/834/1280 px y solicita aprobación. Registrar el resultado antes de implementar presentación; la aprobación de la propuesta textual no completa este paso.
3. Test-first: pruebas SQLite reales en memoria para límites 0/49/50/51/125, filtros combinados, multi-categoría sin duplicados, nombres repetidos y página fuera de rango; espías sobre la conexión para demostrar la ausencia de consultas a medios y el máximo de consultas, incluyendo bases que sí contienen medios.
4. Implementar los tipos, puerto, SQL/índices y caso de uso; actualizar sus dobles. La parte de datos puede avanzar mientras se revisa el prototipo, sin anticipar presentación no aprobada.
5. Tras aprobación visual y pruebas de componente previas, implementar Buscar (primer incremento US2), después acumulación/selección US3. Comprobar respuestas fuera de orden, doble clic, fallo/reintento, cambios de filtros/día, regreso de ficha e invalidaciones.
6. Ejecutar regresiones de exportación, sincronización y copia manual con ejercicios no visitados. Luego lint, build, build de Storybook y recorridos de [quickstart.md](./quickstart.md), manteniendo cobertura global 80 % y Domain 100 %. No marcar pruebas manuales o aprobación como completas sin ejecutarlas.

### Comprobación constitucional posterior al diseño

| Principio | Resultado para la enmienda |
|---|---|
| Idioma y verificabilidad | PASS: etiquetas españolas y criterios SC-035–SC-038 comprobables desde la aplicación; ausencia de lectura de medios y SQL se verifican adicionalmente con tests técnicos, no como requisitos de inspección para la propietaria. |
| Cero alcance fantasma / Living Spec | PASS: FR-086–FR-095 aprobados en esta feature. No se crea otra capacidad ni se redefine backup. |
| Multiplataforma y accesibilidad | PASS de diseño: 390/834/1280 px, 320 px/intermedios, foco, anuncios y 48 px; ejecución visual pendiente. |
| Prototipo aprobado | Gate pendiente: bloquea implementación de presentación, no la preparación documental o la implementación test-first de datos. |
| Capas y tecnologías | PASS: tipos puros, puertos Promise, SQLite en Worker y Signals/Material existentes; sin paquetes ni backend nuevos. |
| Calidad | PASS de diseño: test-first y regresiones de integridad; ejecución pendiente en las tareas de la enmienda. |

No hay incógnitas de diseño pendientes. La aprobación visual y los resultados de validación son hitos de ejecución pendientes, no autorizaciones implícitas.
