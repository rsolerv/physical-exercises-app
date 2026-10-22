# Contrato: GitHubSyncPort

**Capa que lo define**: Application (puerto) · **Capa que lo implementa**: Infrastructure (cliente HTTP de la API de contenidos de GitHub)

El puerto solo transporta datos (leer/escribir en el repositorio). La decisión de qué hacer (subir, descargar o pedir al usuario que elija) la toma el caso de uso puro de dominio `decidir-accion-sincronizacion`, y la orquesta el caso de uso de Application `sincronizar-github`.

```ts
interface GitHubSyncPort {
  leerRemoto(credenciales: CredencialesGitHub): Promise<LecturaRemota>;
  // Descarga datos.json del repositorio y su SHA actual.
  // Devuelve { existe: false } si el repositorio aún no contiene datos.
  // Las imágenes no se descargan aquí; se piden bajo demanda con leerImagen(),
  // o todas juntas al aplicar una descarga completa (ver exportar-importar-datos.use-case).

  escribirRemoto(
    credenciales: CredencialesGitHub,
    datos: ExportacionJSON,
    imagenes: ImagenArchivoJSON[],
    shaEsperado: string | null
  ): Promise<{ shaNuevo: string }>;
  // Sube cada imagen de archivo como un documento JSON independiente `imagenes/<id>.json`
  // y después datos.json. Usa shaEsperado como control de concurrencia optimista: si GitHub
  // ya tiene otro SHA, lanza ErrorConflictoRemoto sin sobrescribir nada. Para cada imagen,
  // consulta primero su SHA remoto: lo envía al actualizar un documento existente y lo omite
  // al crear uno nuevo.

  leerImagen(credenciales: CredencialesGitHub, ruta: string): Promise<ImagenArchivoJSON>;
  // Descarga y parsea un documento imagenes/<id>.json (formato "raw" de la API;
  // el límite de 5 MB por imagen deja el JSON resultante en torno a 6,7 MB en base64).
}

type LecturaRemota =
  | { existe: false }
  | { existe: true; datos: ExportacionJSON; sha: string };

interface CredencialesGitHub {
  tokenPAT: string;     // Solo se usa en la cabecera de autorización; nunca se escribe en el repositorio.
  repositorio: string;  // "owner/repo" del repositorio PRIVADO de datos (FR-037)
}

interface ImagenArchivoJSON {
  id: string;
  nombreArchivo: string;  // p. ej. "foto.jpg", solo para referencia/depuración
  tipoMime: string;       // p. ej. "image/jpeg"
  contenidoBase64: string;
}
```

**Errores que puede lanzar la implementación**: `ErrorRedSincronizacion` (GitHub no disponible o sin conexión; CL4, FR-032), `ErrorAutenticacionGitHub` (token inválido o sin permisos), `ErrorConflictoRemoto` (el SHA cambió entre la lectura y la escritura). Ninguno modifica datos locales.

## Regla de decisión (caso de uso puro de dominio `decidir-accion-sincronizacion`)

Entradas: `cambiosLocalesPendientes`, `últimoShaSincronizado` (puede ser nulo), y el resultado de `leerRemoto()`.

| Situación | Acción |
|---|---|
| Remoto no existe | `subir` |
| `últimoShaSincronizado` nulo (primera sincronización) y remoto existe | `conflicto` con opción por defecto `conservar_remoto` (FR-035) |
| SHA remoto = `últimoShaSincronizado` y sin cambios locales | `nada` |
| SHA remoto = `últimoShaSincronizado` y con cambios locales | `subir` |
| SHA remoto ≠ `últimoShaSincronizado` y sin cambios locales | `descargar` |
| SHA remoto ≠ `últimoShaSincronizado` y con cambios locales | `conflicto` con opción por defecto `conservar_local` |

Tras `subir`, resolver un conflicto con `conservar_local`, se guarda el nuevo SHA y `cambiosLocalesPendientes = false`. Tras `descargar` o resolver un conflicto con `conservar_remoto`, además de guardar el nuevo SHA, el caso de uso de Application DEBE aplicar localmente los `datos` descargados y descargar y guardar localmente (vía `leerImagen()`) todas las imágenes de tipo `archivo` que referencien esos datos, para que la aplicación siga funcionando sin conexión tras la sincronización (Assumptions del spec).

## Documento `ExportacionJSON`

Documento JSON único (`datos.json`) con el estado íntegro de los datos del usuario: ejercicios, categorías, planificaciones con sus días y progreso diario, acorde al mandato de exportación/importación JSON de la constitución.

- Las imágenes de tipo `url` se guardan como texto dentro del JSON.
- Las imágenes de tipo `archivo` NO se incrustan en `datos.json`: este guarda solo su ruta `imagenes/<id>.json`. El contenido de cada imagen (base64) vive en su propio documento JSON `imagenes/<id>.json` (`ImagenArchivoJSON`), manteniendo todo el repositorio de datos en formato JSON, tal como exige la constitución, sin necesidad de incrustar imágenes grandes dentro de `datos.json` (FR-036).
- El JSON **nunca** contiene el token, el repositorio ni ningún otro dato de "Ajustes de aplicación" (FR-037).

Este puerto no expone cabeceras HTTP, códigos de estado ni otros detalles de la API REST de GitHub a Application/Presentation.
