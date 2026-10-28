# Data Model: Sincronización con cuenta de Google sin credenciales técnicas

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Investigación**: [research.md](./research.md)

Esta feature no añade ni modifica ninguna entidad de negocio (Ejercicio, Categoría, Planificación, Día de planificación, Progreso diario). El modelo vigente está en [el modelo de datos de la feature 001](../001-gestion-ejercicios-fisicos/data-model.md). Los cambios afectan a la entidad técnica **Ajustes de aplicación**, a un documento descargable nuevo y a estados que solo existen en memoria.

## Resumen

| Elemento | Capa | Persistente | Cambio |
|---|---|---|---|
| Ajustes de aplicación | Infrastructure | Sí | Tres columnas nuevas (método activo, cuenta de Google) y conexiones independientes |
| Estado de sincronización por destino | Infrastructure | Sí | **Nuevo** (enmienda 2026-10-27): versión, cambios pendientes y fecha por destino |
| Copia remota (en Google) | Servicio externo | Sí (en la cuenta de la persona) | Mismo formato que en GitHub |
| Copia de seguridad en fichero | Documento descargable | Lo guarda la persona | Nuevo |
| Sesión de Google (token y caducidad) | Infrastructure | **No** (solo memoria) | Nuevo |
| Conexión de sincronización | Application/Presentation | No (se deriva de los ajustes) | Nuevo, solo lectura |

## Ajustes de aplicación (entidad técnica)

Campos existentes que no cambian: `tokenGitHub`, `repositorioGitHub`, `catalogoPredefinidoCargado`.

| Campo | Tipo | Obligatorio | Descripción y reglas |
|---|---|---|---|
| metodoSincronizacion | `github` \| `google` \| nulo | No | **Método activo**: el que usa "Sincronizar ahora". Solo hay uno (FR-016). Debe ser un método conectado. Un alta (conectar Google, o guardar GitHub sin credenciales previas) lo activa; `activarMetodo` lo cambia. Vuelve a nulo solo al olvidar el token si era `github` o al desconectar Google si era `google` (FR-026) |
| cuentaGoogle | texto | No | Correo de la cuenta de Google conectada, solo para mostrarlo (FR-011). No es un secreto. **Se conserva aunque Google no sea el método activo**; es nulo solo si Google no está conectado |
| ultimaVersionSincronizada, cambiosLocalesPendientes, ultimaSincronizacionCorrecta | texto, booleano, fecha | — | **Vista derivada** que el repositorio rellena con el estado del destino del método activo (ver abajo). Si no hay método activo o el destino nunca se sincronizó: `null`, `false` y `null`. Las columnas antiguas (`ultimo_sha_sincronizado`, `cambios_locales_pendientes`, `ultima_sincronizacion_correcta`, `destino_ultima_sincronizacion`) quedan en la tabla sin uso y no se leen tras la migración |

Estados de conexión (derivados, no se guardan):

| Método | Conectado cuando |
|---|---|
| GitHub | `tokenGitHub` y `repositorioGitHub` están guardados |
| Google | `cuentaGoogle` no es nulo |

Reglas:

- **Conexiones independientes (FR-016, FR-017)**: guardar o editar las credenciales de GitHub nunca modifica `cuentaGoogle`, y conectar o desconectar Google nunca modifica `tokenGitHub` ni `repositorioGitHub`. Ya no existe el rechazo "desconecta antes". Solo "Olvidar token" borra las credenciales de GitHub.
- **Activación**: conectar Google (alta o reconexión) pone `metodoSincronizacion = 'google'`. Guardar credenciales de GitHub lo pone a `github` solo si antes no había credenciales guardadas o no había método activo; editar unas ya guardadas no lo cambia. `activarMetodo(metodo)` lo establece y rechaza con `ErrorValidacion` un método no conectado.
- **Olvidar o desconectar el método activo (FR-026)**: `metodoSincronizacion` pasa a nulo y no se activa el otro automáticamente. Si el olvidado no era el activo, `metodoSincronizacion` no cambia.
- **Secretos**: ningún campo guarda token de Google ni información de sesión (FR-018). Los ajustes y el estado por destino nunca se exportan ni sincronizan.
- **Migración** (en la inicialización del esquema, con el mismo patrón que las columnas ya añadidas): lo existente se mantiene (columnas `metodo_sincronizacion`, `cuenta_google`; marcar `github` en instalaciones con token y repositorio guardados). Se crea `sincronizacion_destino` si falta y, si está vacía y hay `ultimo_sha_sincronizado` con un destino antiguo, se inserta su fila (ver abajo). No se recrea ni borra ninguna fila ni columna.

## Estado de sincronización por destino (tabla nueva `sincronizacion_destino`)

Una fila por destino con el que se ha sincronizado alguna vez desde este dispositivo (FR-025). Se conserva al olvidar el token o desconectar la cuenta, de modo que volver al mismo destino continúa donde estaba.

| Campo | Tipo | Obligatorio | Descripción y reglas |
|---|---|---|---|
| destino | texto (clave) | Sí | `github:<propietario/repositorio>` o `google:<correo en minúsculas>`. Lo calcula la función pura `identificarDestinoSincronizacion` |
| ultimaVersion | texto | Sí | Versión remota opaca de la última sincronización con este destino: SHA en GitHub, `version` de `datos.json` en Google |
| cambiosLocalesPendientes | booleano | Sí | Hay cambios locales no reflejados en este destino |
| ultimaSincronizacion | fecha UTC | Sí | Última sincronización completada con este destino; la pantalla muestra la del método activo (FR-011) |

Reglas:

- **Sin fila = primera sincronización (FR-025, FR-007)**: si el destino del método activo no tiene fila, la versión sincronizada se considera nula al decidir la acción, y se ofrece la elección explícita con "Usar los datos de Google" o "Usar los datos de GitHub" por defecto. Los datos de otros destinos no se tocan.
- **Cambio local (FR-025)**: `marcarCambiosLocalesPendientes()` pone `cambiosLocalesPendientes = 1` en **todas** las filas. Lo invocan las altas, modificaciones y borrados de datos de usuario y la importación de una copia manual; sembrar el catálogo predefinido no lo marca, como hoy.
- **Sincronización completada con el destino D**: se inserta o actualiza la fila de D con la versión nueva, `cambiosLocalesPendientes = 0` y la fecha. Si la acción cambió los datos locales (`descargar` o resolver con "conservar remotos"), las demás filas pasan a `cambiosLocalesPendientes = 1`. Si fue `subir`, `nada` o resolver con "conservar locales", las demás no cambian.
- **Sin falsos conflictos (SC-011)**: la decisión usa solo la fila del destino activo, de modo que alternar entre métodos ya usados sin cambios en ninguno de los lados resulta en `nada`.
- **Migración**: si la tabla está vacía y existe `ultimo_sha_sincronizado` con `destino_ultima_sincronizacion` (el valor `github` pasa a `github:<repositorio_github>`), se inserta una fila con la versión, `cambios_locales_pendientes` y `ultima_sincronizacion_correcta` (o la fecha de la migración si falta).


## Copia remota en Google

Mismo contenido y formato que en GitHub, guardado en el espacio privado de la aplicación (ver [investigación, sección 3](./research.md)):

| Fichero (nombre en Drive) | Contenido |
|---|---|
| `datos.json` | `ExportacionJSON`: ejercicios, categorías, planificaciones con sus días y progreso diario, según [el contrato de GitHub](../001-gestion-ejercicios-fisicos/contracts/github-sync.port.md). Las imágenes de archivo guardan su ruta lógica `imagenes/<id>.json` |
| `imagenes__<id>.json` | `ImagenArchivoJSON` (`id`, `nombreArchivo`, `tipoMime`, `contenidoBase64`), máximo 5 MB por imagen original |

La **versión remota** es el campo `version` de `datos.json`. El documento nunca contiene correo, token ni ajustes.

## Copia de seguridad en fichero

Archivo ZIP único que la persona descarga e importa en otro dispositivo (ver [contrato](./contracts/copia-seguridad-archivo.md)). Conserva la estructura lógica de sincronización:

| Ruta ZIP | Contenido |
|---|---|
| `datos.json` | `ExportacionJSON` actual |
| `imagenes/<id>.json` | `ImagenArchivoJSON` de cada imagen de archivo referenciada por `datos.json` |

Reglas de validación (función pura de Domain): `datos.json` es JSON con todas las colecciones requeridas y sus tipos; cada archivo de imagen es JSON con la estructura esperada, su `id` coincide con el nombre y cada referencia de tipo `archivo` tiene su documento bajo `imagenes/`; ninguna imagen original supera 5 MB. Una ruta fuera de `imagenes/` o un elemento inválido rechaza la importación sin modificar datos locales (FR-020).

## Sesión de Google (solo memoria)

| Campo | Descripción |
|---|---|
| tokenAcceso | Token de vida corta; se descarta al desconectar, al recargar la página o al caducar |
| caducaEn | Instante de caducidad. Se renueva al sincronizar si queda menos de un margen de seguridad |

No se persiste en SQLite, almacenamiento del navegador ni en ningún documento sincronizado.

## Conexión de sincronización (vista derivada)

Estado que muestra la pantalla; se calcula a partir de los ajustes, del estado del destino activo y del resultado de la operación en curso, no se guarda. Hay una **conexión por método** (Google y GitHub), cada una "Conectada" o "Sin configurar", y como máximo una marcada como **activa**.

| Estado | Condición |
|---|---|
| Sin configurar | `metodoSincronizacion` nulo y ningún método conectado |
| Sin método activo | `metodoSincronizacion` nulo con algún método conectado (se ofrece "Usar este método"; no se ofrece "Sincronizar ahora", FR-026) |
| Sincronizando | Hay una sincronización en curso |
| Sincronizado | La última operación terminó bien |
| Error | La última operación falló (red, permisos u otro error) |
| Requiere reconectar | Error de autorización de Google (caducada, revocada o denegada) |
| Conflicto | Hay una elección pendiente entre datos locales y remotos |

## Reglas de decisión

No cambian: se reutiliza la tabla de [la feature 001](../001-gestion-ejercicios-fisicos/contracts/github-sync.port.md) con `version` en lugar de `sha`. Las entradas (`cambiosLocalesPendientes` y `ultimaVersionSincronizada`) son las de la **fila del destino activo** de la tabla `sincronizacion_destino`:

| Situación | Entradas de la decisión |
|---|---|
| El destino activo tiene fila | Su `ultimaVersion` y su `cambiosLocalesPendientes` |
| El destino activo no tiene fila | Versión nula (primera sincronización) |

## Impacto en la sincronización con GitHub

Ninguno funcional: mismo token fine-grained, mismo repositorio, mismas reglas y mismos datos. La spec exige conservar sus resultados (FR-017, SC-009); la suite existente de GitHub se mantiene como prueba de regresión. El único cambio observable es que sus credenciales ya no se rechazan ni se invalidan por tener Google conectado.
