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

Idénticas a las de [la feature 001](../../001-gestion-ejercicios-fisicos/contracts/github-sync.port.md) con estos dos cambios:

1. Antes de decidir, `versionSincronizadaEfectiva(destinoActual, destinoGuardado, versionGuardada)` devuelve nulo si el destino cambió (FR-016), lo que produce la primera sincronización (`conflicto` con `conservar_remoto` por defecto si el remoto existe).
2. En la entrada de `decidirAccionSincronizacion` el campo `ultimoShaSincronizado` pasa a llamarse `ultimaVersionSincronizada` y el de la lectura remota, `version`.

Tras `subir`, resolver con `conservar_local`, `descargar` o resolver con `conservar_remoto`, el caso de uso guarda la nueva versión y el destino de esta sincronización, pone `cambiosLocalesPendientes = false` y registra la fecha. Mientras hay una sincronización en curso, las pulsaciones repetidas se ignoran (FR-010).

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

Se amplía el contrato [ajustes-repository.port.md](../../001-gestion-ejercicios-fisicos/contracts/ajustes-repository.port.md); lo existente no cambia.

```ts
// Campos nuevos en AjustesAplicacion
metodoSincronizacion: 'github' | 'google' | null;
cuentaGoogle: string | null;
destinoUltimaSincronizacion: string | null;
// ultimoShaSincronizado se expone como ultimaVersionSincronizada (misma columna)

abstract conectarGoogle(correo: string): Promise<void>;
// Rechaza con ErrorValidacion si metodoSincronizacion es 'github'.
abstract desconectarGoogle(): Promise<void>;
abstract registrarDestinoSincronizado(destino: string): Promise<void>;
// guardarCredencialesGitHub rechaza con ErrorValidacion si metodoSincronizacion es 'google'
// y establece metodoSincronizacion = 'github'. olvidarCredencialesGitHub lo pone a nulo.
```
