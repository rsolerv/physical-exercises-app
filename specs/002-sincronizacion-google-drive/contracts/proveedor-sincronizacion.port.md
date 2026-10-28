# Contrato: ProveedorSincronizacionPort


**Capa que lo define**: Application (puerto) · **Capas que lo implementan**: Infrastructure (`ProveedorGithubSync`, `ProveedorGoogleDriveSync` y un delegado que elige entre ellos)

Generaliza el [contrato de GitHub](../../001-gestion-ejercicios-fisicos/contracts/github-sync.port.md) para que el caso de uso `SincronizarUseCase` no conozca ningún proveedor. El puerto solo transporta datos; la decisión de subir, descargar o pedir elección la toma el caso de uso puro `decidir-accion-sincronizacion`. Como el resto de puertos de la aplicación, se declara como clase abstracta para poder usarse como token de inyección.

```ts
abstract class ProveedorSincronizacionPort {
  abstract leerRemoto(): Promise<LecturaRemota>;
  // Lee datos.json y su versión remota actual. Devuelve { existe: false } si el destino aún no
  // contiene datos (incluido el caso de que la persona haya borrado la carpeta de datos de la app).
  // Las imágenes no se descargan aquí.

  abstract escribirRemoto(
    datos: ExportacionJSON,
    imagenes: ImagenArchivoJSON[],
    versionEsperada: string | null
  ): Promise<{ versionNueva: string }>;
  // Escribe primero las imágenes y por último datos.json. Si la versión remota ya no es
  // versionEsperada, lanza ErrorConflictoRemoto sin sobrescribir datos.json.

  abstract leerImagen(ruta: string): Promise<ImagenArchivoJSON>;
  // Descarga y parsea el documento de una imagen a partir de su ruta lógica "imagenes/<id>.json".
}

type LecturaRemota =
  | { existe: false }
  | { existe: true; datos: ExportacionJSON; version: string };
```

`ExportacionJSON` e `ImagenArchivoJSON` no cambian. La `version` es un texto opaco: Application y Presentation no interpretan su contenido.

## Implementaciones

| Clase | Qué hace |
|---|---|
| `ProveedorGithubSync` | Lee token y repositorio de `AjustesRepositoryPort` y delega en el `GitHubSyncPort` actual; traduce `sha` ↔ `version`. No cambia el adaptador HTTP de GitHub ni su contrato |
| `ProveedorGoogleDriveSync` | Usa `GoogleAutorizacionPort` y la API de Drive ([contrato](./google-drive-sync.md)) |
| `ProveedorSincronizacionSeleccionado` | Implementa el puerto delegando en el proveedor del método activo guardado en ajustes. Si no hay método activo, lanza `ErrorValidacion` |

## Errores

| Error | Cuándo | Efecto en datos locales |
|---|---|---|
| `ErrorRedSincronizacion` | Sin conexión, servicio no disponible o fallo transitorio | Ninguno |
| `ErrorAutenticacionGitHub` | Token de GitHub inválido o sin permisos (ya existente) | Ninguno |
| `ErrorAutorizacionGoogle` | Conexión de Google caducada, revocada o con permiso no concedido; requiere "Volver a conectar" (FR-013) | Ninguno |
| `ErrorConexionCancelada` | La persona cierra la ventana de Google o rechaza el permiso (FR-014) | Ninguno |
| `ErrorVentanaBloqueada` | El navegador bloquea la ventana de acceso de Google (FR-014) | Ninguno |
| `ErrorConflictoRemoto` | La versión remota cambió entre la lectura y la escritura (FR-009) | Ninguno |

Los tres errores de Google son nuevos en `errores-dominio.ts`. Ninguno expone códigos HTTP ni detalles de la API a Application ni Presentation.

## Reglas de decisión

Idénticas a las de [la feature 001](../../001-gestion-ejercicios-fisicos/contracts/github-sync.port.md) con estos cambios:

1. Las entradas `cambiosLocalesPendientes` y `ultimaVersionSincronizada` son las de la **fila del destino activo** en `sincronizacion_destino` (ver [data-model.md](../data-model.md)). Si ese destino no tiene fila, la versión es nula, lo que produce la primera sincronización (`conflicto` con `conservar_remoto` por defecto si el remoto existe). Desaparece la función `versionSincronizadaEfectiva`.
2. En la entrada de `decidirAccionSincronizacion` el campo `ultimoShaSincronizado` pasa a llamarse `ultimaVersionSincronizada` y el de la lectura remota, `version`.

Tras `subir`, resolver con `conservar_local`, `descargar` o resolver con `conservar_remoto`, el caso de uso llama a `registrarSincronizacionCompletada(destino, version, fecha, datosLocalesCambiados)`: `datosLocalesCambiados` es `true` en `descargar` y `conservar_remoto`, y `false` en `subir`, `nada` y `conservar_local`. Los datos de los destinos no activos no se leen ni se modifican (FR-025). Mientras hay una sincronización en curso, las pulsaciones repetidas se ignoran (FR-010).

## Puerto auxiliar: GoogleAutorizacionPort

```ts
abstract class GoogleAutorizacionPort {
  abstract conectar(): Promise<{ correo: string; nombre: string | null }>;
  // Abre la ventana de Google (cuenta y permiso). Debe invocarse desde un gesto de usuario.
  // Lanza ErrorConexionCancelada, ErrorVentanaBloqueada o ErrorAutorizacionGoogle.

  abstract obtenerTokenAcceso(): Promise<string>;
  // Devuelve el token en memoria si sigue vigente; si no, lo renueva (ver V1 en research.md).
  // Lanza ErrorAutorizacionGoogle si hace falta intervención de la persona.

  abstract desconectar(): Promise<void>;
  // Descarta el token en memoria y revoca el permiso como mejor esfuerzo. No falla si no hay red.
}
```

## Puerto auxiliar: AjustesRepositoryPort (cambios)

Se amplía el contrato [ajustes-repository.port.md](../../001-gestion-ejercicios-fisicos/contracts/ajustes-repository.port.md). Revisado el 2026-10-27 para conexiones simultáneas (FR-016, FR-025 a FR-027).

```ts
interface AjustesAplicacion {
  // Sin cambios: tokenGitHub, repositorioGitHub, catalogoPredefinidoCargado
  metodoSincronizacion: 'github' | 'google' | null; // método activo
  cuentaGoogle: string | null;                      // se conserva aunque Google no sea el activo
  // Vista derivada del destino del método activo (null / false / null si no hay activo o fila):
  ultimaVersionSincronizada: string | null;
  cambiosLocalesPendientes: boolean;
  ultimaSincronizacionCorrecta: Date | null;
  // Se elimina destinoUltimaSincronizacion
}

abstract guardarCredencialesGitHub(token: string, repositorio: string): Promise<void>;
// Ya no rechaza si Google está conectado ni toca cuentaGoogle. Activa GitHub solo si no había
// credenciales guardadas o no había método activo; editar unas ya guardadas no cambia el activo.
abstract olvidarCredencialesGitHub(): Promise<void>;
// Borra token y repositorio. Pone metodoSincronizacion a nulo solo si era 'github'.
abstract conectarGoogle(correo: string): Promise<void>;
// Ya no rechaza si GitHub está configurado. Guarda cuentaGoogle y activa Google (alta o reconexión).
abstract desconectarGoogle(): Promise<void>;
// Pone cuentaGoogle a nulo y metodoSincronizacion a nulo solo si era 'google'. No toca GitHub.
abstract activarMetodo(metodo: 'github' | 'google'): Promise<void>;
// Nuevo. ErrorValidacion si el método no está conectado.
abstract registrarSincronizacionCompletada(
  destino: string, version: string, fecha: Date, datosLocalesCambiados: boolean
): Promise<void>;
// Nuevo. Sustituye a actualizarUltimaVersionSincronizada, registrarDestinoSincronizado,
// registrarSincronizacionCorrecta y marcarCambiosLocalesPendientes(false). Inserta o actualiza la
// fila del destino (versión, pendientes = false, fecha); si datosLocalesCambiados, marca como
// pendientes las filas de los demás destinos.
abstract marcarCambiosLocalesPendientes(): Promise<void>;
// Sin parámetro: marca pendientes todas las filas de sincronizacion_destino.
```

`identificarDestinoSincronizacion(metodo, cuentaGoogle, repositorioGitHub)` (Domain) devuelve `github:<repositorio>`, `google:<correo en minúsculas>` o `null` si el método no está activo o falta el dato; lo usan el repositorio de ajustes y `SincronizarUseCase`.

## Caso de uso `GestionarConexionSincronizacionUseCase` (cambios)

- `conectarGoogle()`: deja de lanzar `ErrorValidacion` si GitHub está configurado.
- `activarMetodo(metodo)`: nuevo; delega en el repositorio de ajustes. No contacta con el proveedor ni con Google.
- `desconectar()`: sin cambios de contrato; el efecto sobre GitHub y el método activo lo fija el repositorio (arriba).
