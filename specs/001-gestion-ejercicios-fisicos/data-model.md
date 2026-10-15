# Data Model: Gestión de Ejercicios Físicos y Planificación Semanal

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Fecha**: 2026-10-15

Este modelo recoge las entidades descritas en la sección "Key Entities" del spec, junto con los campos, relaciones y reglas de validación que se derivan de los requisitos funcionales (FR), reglas de negocio y casos límite. Todos los nombres de campo se dan en español, en línea con el Principio I de la constitución (el modelo de dominio no es texto de interfaz, pero se mantiene el mismo idioma por coherencia y porque algunos de estos nombres pueden aparecer en mensajes de validación mostrados al usuario).

## Resumen de entidades

| Entidad | Capa | Persistida en SQLite WASM |
|---|---|---|
| Ejercicio | Domain | Sí |
| Categoría | Domain | Sí |
| Planificación | Domain | Sí |
| Día de planificación | Domain (parte de Planificación) | Sí (tabla de asociación) |
| Progreso diario | Domain | Sí |
| Ajustes de aplicación (técnica, no de negocio) | Infrastructure | Sí |

## Ejercicio

Actividad física concreta que el usuario puede consultar, planificar y marcar como realizada. Incluye tanto los ejercicios creados por el usuario como los del catálogo predefinido de fábrica (FR-034); no hay distinción de comportamiento entre ambos.

| Campo | Tipo | Obligatorio | Regla de validación / origen |
|---|---|---|---|
| id | identificador único | Sí | Generado por el sistema |
| nombre | texto | Sí | No puede estar vacío (FR-005) |
| descripción | texto | Sí | No puede estar vacía (FR-005) |
| categorías | lista de referencias a Categoría | Sí, al menos 1 | Un ejercicio pertenece a 1 o más categorías (FR-006, RN8); si tras eliminar una categoría la lista queda vacía, se añade automáticamente la categoría genérica "Sin categoría" (FR-011) |
| enlacesWeb | lista de URLs | No | Cada URL debe tener formato válido antes de guardarse (FR-007); se puede visualizar embebida dentro de la app cuando el sitio lo permita (FR-016) |
| enlacesYoutube | lista de URLs de YouTube | No | Cada URL debe tener formato válido antes de guardarse (FR-007); se previsualiza con reproductor embebido (FR-015); si el vídeo deja de estar disponible, el ejercicio se sigue mostrando indicándolo (FR-033) |
| imágenes | lista de imágenes, cada una `{ id, tipo: "url" \| "archivo", valor }` | No | `tipo: "url"` guarda una URL externa; `tipo: "archivo"` guarda el contenido binario de la imagen en el almacenamiento local, con un máximo de 5 MB por imagen (FR-036). Al sincronizar, cada imagen de archivo se sube como un archivo independiente del repositorio y el documento JSON solo guarda su ruta |
| observaciones | texto | No | Campo libre opcional (FR-014) |

**Relaciones**: N:M con Categoría. N:M con Día de planificación (a través de Planificación). 1:N con Progreso diario (un ejercicio puede tener una entrada de progreso por cada fecha en la que estaba planificado).

**Reglas de eliminación**: al eliminar un ejercicio, se retira de todas las planificaciones en las que apareciera, tanto localmente como en la siguiente sincronización (FR-028, CA13).

## Categoría

Agrupación temática de ejercicios (p. ej. cuello, espalda, piernas, hombros, glúteos).

| Campo | Tipo | Obligatorio | Regla de validación / origen |
|---|---|---|---|
| id | identificador único | Sí | Generado por el sistema |
| nombre | texto | Sí | Único en todo el sistema, no puede repetirse (FR-010) |
| descripción | texto | No | Campo libre opcional |
| esGenérica | booleano | Sí (por defecto `false`) | `true` únicamente para la categoría de fábrica "Sin categoría"; impide su eliminación (FR-011) |

**Relaciones**: N:M con Ejercicio.

**Reglas de eliminación**: cualquier categoría con `esGenérica = false` puede eliminarse aunque tenga ejercicios asociados; al eliminarla, se retira de todos los ejercicios que la tuvieran (FR-011). La categoría con `esGenérica = true` ("Sin categoría") no puede eliminarse nunca y se crea una única vez, de fábrica, junto con el catálogo predefinido (ver Ajustes de aplicación).

## Planificación

Conjunto de ejercicios organizado por día de la semana; puede ser una planificación concreta (asociada a una semana real) o una plantilla reutilizable.

| Campo | Tipo | Obligatorio | Regla de validación / origen |
|---|---|---|---|
| id | identificador único | Sí | Generado por el sistema |
| nombre | texto | Sí | Identifica la planificación para el usuario |
| fechaInicio | fecha | No | Si tiene valor, DEBE ser un lunes (el formulario solo permite elegir lunes) y es una planificación concreta (FR-017); si es nula, es una plantilla reutilizable (FR-018) |
| días | lista de 7 "Día de planificación" (lunes a domingo) | Sí | Ver entidad "Día de planificación" |

**Campo derivado (no almacenado)**: `activa` = `fechaInicio` tiene valor **y** la semana actual (lunes-domingo) cae dentro del rango `[fechaInicio, fechaInicio + 6 días]`. Se calcula en el momento de la consulta; no se persiste como columna, de modo que nunca puede quedar desincronizado respecto a la fecha real del sistema (decisión de clarificación de spec).

**Regla de unicidad**: no pueden existir dos planificaciones concretas con la misma `fechaInicio`. Como cada planificación concreta cubre exactamente una semana (de lunes a domingo), esto garantiza que para cualquier semana, presente o futura, existe como máximo una planificación activa (FR-022, RN9). La regla se valida al crear una planificación concreta y al modificar su `fechaInicio`.

**Operaciones especiales**: duplicar una planificación o plantilla existente crea una nueva planificación independiente con los mismos días y ejercicios asociados, sin fecha de inicio salvo que el usuario la asigne explícitamente (FR-019, CA14).

## Día de planificación

Día concreto de la semana dentro de una planificación, con los ejercicios asignados a ese día.

| Campo | Tipo | Obligatorio | Regla de validación / origen |
|---|---|---|---|
| díaSemana | enumerado: lunes, martes, miércoles, jueves, viernes, sábado, domingo | Sí | Exactamente uno de los 7 valores; cada planificación tiene exactamente un "Día de planificación" por cada día de la semana |
| ejercicios | lista de referencias a Ejercicio | No (puede estar vacía) | Un mismo ejercicio no puede repetirse dentro de la lista del mismo día de la misma planificación (FR-021, RN5) |

**Relaciones**: pertenece a una Planificación; referencia N:M a Ejercicio.

## Progreso diario

Registro de si un ejercicio planificado para una fecha concreta ha sido marcado como realizado.

| Campo | Tipo | Obligatorio | Regla de validación / origen |
|---|---|---|---|
| fecha | fecha concreta (no solo día de la semana) | Sí | Fecha real en la que el ejercicio estaba planificado |
| ejercicio | referencia a Ejercicio | Sí | Debe corresponder a un ejercicio planificado para esa fecha en la planificación activa de esa semana |
| realizado | booleano | Sí (por defecto `false`) | Se alterna mediante la acción de marcar/desmarcar del usuario (FR-024) |

**Nota de diseño**: no se almacena una referencia explícita a la Planificación ni al Día de planificación en "Progreso diario", porque la regla de unicidad de planificación activa por semana (FR-022) garantiza que, para cualquier fecha dada, solo existe una planificación activa; por tanto `(fecha, ejercicio)` identifica sin ambigüedad el contexto de planificación correspondiente.

**Cálculo derivado**: el porcentaje de progreso de un día (FR-025, CA10) se calcula como `nº de registros de Progreso diario con realizado = true para esa fecha ÷ nº total de ejercicios planificados para esa fecha en la planificación activa`. No se almacena como columna; se recalcula en cada consulta. El único responsable del cálculo es el caso de uso puro de dominio `calcular-porcentaje-dia`; los repositorios solo devuelven los datos necesarios.

**Conservación**: los registros de Progreso diario se conservan indefinidamente, sin fecha de caducidad automática (Assumptions del spec).

## Ajustes de aplicación (entidad técnica de soporte)

No es una entidad de negocio descrita en el spec, pero es necesaria para implementar correctamente requisitos ya aprobados sin añadir alcance nuevo (Principio II): el almacenamiento y borrado del token de GitHub (FR-002, FR-037), la decisión de sincronización (FR-035) y evitar volver a insertar el catálogo predefinido en cada arranque (FR-034).

| Campo | Tipo | Obligatorio | Regla de validación / origen |
|---|---|---|---|
| tokenGitHub | texto (PAT fine-grained) | No | Introducido manualmente por el usuario (FR-002); se envía en la cabecera de autorización de cada llamada a la API de GitHub. Se muestra oculto en pantalla, NUNCA se incluye en el documento JSON sincronizado y se borra con la acción "Olvidar token" (FR-037) |
| repositorioGitHub | texto (owner/repo) | No | Repositorio **privado** de datos configurado por el usuario (p. ej. `owner/data-physical-exercises`), distinto del repositorio público de la aplicación (FR-037) |
| últimoShaSincronizado | texto | No | SHA/ETag remoto conocido tras la última sincronización correcta; se usa para detectar conflictos (FR-035) |
| cambiosLocalesPendientes | booleano | Sí (por defecto `false`) | Pasa a `true` tras cualquier alta, modificación o borrado de datos de usuario, y vuelve a `false` tras una sincronización completada. Junto con `últimoShaSincronizado` permite distinguir "solo cambios locales", "solo cambios remotos" y "cambios en ambos lados" (FR-035) |
| catálogoPredefinidoCargado | booleano | Sí (por defecto `false`) | Pasa a `true` la primera vez que se inserta el catálogo de ejercicios predefinidos y la categoría genérica "Sin categoría"; evita reinsertar el catálogo de fábrica en arranques posteriores (FR-034, FR-011) |

## Catálogo predefinido (datos semilla)

El contenido de fábrica (FR-034) está en el anexo [catalogo-predefinido.json](./catalogo-predefinido.json) y se copia tal cual a `src/assets/catalogo-predefinido/catalogo.json`. Formato:

| Campo | Tipo | Regla |
|---|---|---|
| version | número | Versión del formato del catálogo (actualmente `1`) |
| categorias[] | `{ nombre, descripcion }` | Nombres únicos; NO incluye "Sin categoría", que la crea el caso de uso de siembra |
| ejercicios[] | `{ nombre, descripcion, categorias[], enlacesYoutube[], enlacesWeb[], imagenes[], observaciones }` | Cada ejercicio cumple las reglas de Ejercicio; `categorias` contiene nombres de `categorias[]` (al menos uno); `imagenes` solo admite el tipo `url` |

Los identificadores no vienen en el archivo: el caso de uso de siembra los genera al insertar, resolviendo las categorías de cada ejercicio por su nombre.

## Reglas de validación transversales (resumen)

- Nombre y descripción de Ejercicio: obligatorios, no vacíos (FR-005).
- Nombre de Categoría: obligatorio y único en todo el sistema (FR-010).
- Toda URL (enlace web o YouTube): debe superar una validación de formato antes de guardarse (FR-007).
- Un Ejercicio debe tener siempre al menos una Categoría (FR-006); la categoría genérica "Sin categoría" actúa de red de seguridad para no violar esta regla cuando se borra la última categoría de un ejercicio (FR-011).
- Un Ejercicio no puede repetirse dos veces en el mismo "Día de planificación" (FR-021).
- Solo puede existir una Planificación activa (no plantilla) por semana (FR-022), donde "activa" se calcula por fecha, no por marca manual; se garantiza impidiendo dos planificaciones concretas con la misma `fechaInicio`, que siempre es un lunes (FR-017).
- Imagen de archivo: máximo 5 MB por imagen (FR-036).
