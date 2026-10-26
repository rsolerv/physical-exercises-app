# Data Model: Sincronización con cuenta de Google sin credenciales técnicas

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Investigación**: [research.md](./research.md)

Esta feature no añade ni modifica ninguna entidad de negocio (Ejercicio, Categoría, Planificación, Día de planificación, Progreso diario). El modelo vigente está en [el modelo de datos de la feature 001](../001-gestion-ejercicios-fisicos/data-model.md). Los cambios afectan a la entidad técnica **Ajustes de aplicación**, a un documento descargable nuevo y a estados que solo existen en memoria.

## Resumen

| Elemento | Capa | Persistente | Cambio |
|---|---|---|---|
| Ajustes de aplicación | Infrastructure | Sí | Tres columnas nuevas y un cambio de significado |
| Copia remota (en Google) | Servicio externo | Sí (en la cuenta de la persona) | Mismo formato que en GitHub |
| Copia de seguridad en fichero | Documento descargable | Lo guarda la persona | Nuevo |
| Sesión de Google (token y caducidad) | Infrastructure | **No** (solo memoria) | Nuevo |
| Conexión de sincronización | Application/Presentation | No (se deriva de los ajustes) | Nuevo, solo lectura |

## Ajustes de aplicación (entidad técnica)

Campos existentes que no cambian: `tokenGitHub`, `repositorioGitHub`, `ultimaSincronizacionCorrecta`, `cambiosLocalesPendientes`, `catalogoPredefinidoCargado`.

| Campo | Tipo | Obligatorio | Descripción y reglas |
|---|---|---|---|
| ultimaVersionSincronizada | texto | No | Antes `ultimoShaSincronizado`. Versión remota opaca de la última sincronización: SHA en GitHub, `version` de `datos.json` en Google. El nombre de la columna SQLite (`ultimo_sha_sincronizado`) no cambia |
| metodoSincronizacion | `github` \| `google` \| nulo | No | Método activo. Solo hay uno (FR-016). Se establece al guardar las credenciales de GitHub o al conectar Google, y vuelve a nulo al olvidar el token o desconectar la cuenta |
| cuentaGoogle | texto | No | Correo de la cuenta conectada, solo para mostrarlo (FR-011). Es nulo si el método no es `google`. No es un secreto |
| destinoUltimaSincronizacion | texto | No | Identifica el destino con el que se sincronizó por última vez: `github` o `google:<correo>`. Se actualiza al completar una sincronización. Permite aplicar la regla de primera sincronización al cambiar de método o de cuenta |

Reglas:

- **Primera sincronización con un destino nuevo**: si el destino actual (`metodoSincronizacion` + cuenta) es distinto de `destinoUltimaSincronizacion`, la versión sincronizada se considera nula al decidir la acción (FR-016). Los datos del destino anterior no se tocan.
- **Un solo método activo**: guardar credenciales de GitHub con `metodoSincronizacion = google` (o conectar Google con `github`) se rechaza con un error de validación que pide desconectar antes.
- **Desconectar Google**: pone a nulo `metodoSincronizacion` y `cuentaGoogle`. No borra `ultimaVersionSincronizada` ni `destinoUltimaSincronizacion`: si la persona vuelve a conectar la misma cuenta, continúa donde estaba; si conecta otra, se aplica la regla anterior.
- **Secretos**: ningún campo guarda token de Google ni información de sesión (FR-018). Los ajustes nunca se exportan ni sincronizan.
- **Migración** (en la inicialización del esquema, con el mismo patrón que `ultima_sincronizacion_correcta`): añadir las columnas `metodo_sincronizacion`, `cuenta_google` y `destino_ultima_sincronizacion` si faltan. En instalaciones existentes con token y repositorio de GitHub guardados, establecer `metodo_sincronizacion = 'github'`; si además hay versión sincronizada, establecer `destino_ultima_sincronizacion = 'github'`. No se recrea ni borra ninguna fila.

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

Estado que muestra la pantalla; se calcula a partir de los ajustes y del resultado de la operación en curso, no se guarda:

| Estado | Condición |
|---|---|
| Sin configurar | `metodoSincronizacion` nulo |
| Sincronizando | Hay una sincronización en curso |
| Sincronizado | La última operación terminó bien |
| Error | La última operación falló (red, permisos u otro error) |
| Requiere reconectar | Error de autorización de Google (caducada, revocada o denegada) |
| Conflicto | Hay una elección pendiente entre datos locales y remotos |

## Reglas de decisión

No cambian: se reutiliza la tabla de [la feature 001](../001-gestion-ejercicios-fisicos/contracts/github-sync.port.md) con `version` en lugar de `sha`. La única regla nueva es la de destino distinto, que se resuelve **antes** de decidir la acción:

| Situación | Versión sincronizada efectiva |
|---|---|
| Destino actual igual a `destinoUltimaSincronizacion` | `ultimaVersionSincronizada` |
| Destino actual distinto o `destinoUltimaSincronizacion` nulo | Nula (primera sincronización) |

## Impacto en la sincronización con GitHub

Ninguno funcional: mismo token fine-grained, mismo repositorio, mismas reglas y mismos datos. La spec exige conservar sus resultados (FR-017, SC-009); la suite existente de GitHub se mantiene como prueba de regresión.
