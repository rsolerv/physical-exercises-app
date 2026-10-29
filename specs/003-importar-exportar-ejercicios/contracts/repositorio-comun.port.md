# Contrato: RepositorioComunPort

**Capa que lo define**: Application (puerto) · **Capa que lo implementa**: Infrastructure (adaptador HTTP directo contra la API de contenidos de GitHub y `raw.githubusercontent.com`)

Puerto que Application usa para leer el catálogo público del repositorio común (`rsolerv/common-data-physical-exercises`) y para subir un ejercicio nuevo. El repositorio y la rama de lectura (`main`) y de escritura (`requests`) son constantes del adaptador, no parámetros: la aplicación nunca apunta esta función a otro repositorio (ver research.md, sección 3).

```ts
interface RepositorioComunPort {
  listarCategorias(): Promise<CategoriaComun[]>;
  // Descarga categorias.json de `main` por su URL raw. No requiere credenciales.
  // Devuelve lista vacía (no un error) si el fichero no existe todavía.

  buscarEjercicios(texto: string, categoriaId: string | null): Promise<EjercicioComunArchivo[]>;
  // Lista /ejercicios en `main` (1 llamada a la API de contenidos) y descarga
  // el contenido de cada fichero por su URL raw para filtrar por texto
  // (parcial, sin distinguir mayúsculas/minúsculas, sobre nombre y descripción)
  // y/o por categoriaId (si no es null). Sin texto ni categoría, devuelve el
  // catálogo completo (FR-004). No requiere credenciales (FR-007).

  obtenerEjercicioPorId(id: string): Promise<EjercicioComunArchivo | null>;
  // Descarga ejercicios/<id>.json directamente de main por su URL raw,
  // sin credenciales. Devuelve null si el documento no existe (FR-024).

  leerImagen(ruta: string): Promise<ImagenArchivoJSON>;
  // Descarga y parsea imagenes/<id>.json de `main` por su URL raw.
  // Lanza ErrorValidacion si el documento no tiene el formato de ImagenArchivoJSON
  // (la aplicación debe capturarlo y omitir solo esa imagen, FR-011).

  existeEjercicioPorNombre(nombre: string): Promise<boolean>;
  // Lista /ejercicios en `main` (1 llamada autenticada a la API de contenidos)
  // y compara el `nombre` de cada fichero (descargado por su URL raw) con
  // `normalizarNombreEjercicio(nombre)`. Requiere credenciales (se llama solo
  // antes de subir). No consulta los ejercicios pendientes en `requests` (FR-017).

  subirEjercicio(
    credenciales: CredencialesGitHub,
    ejercicio: EjercicioComunArchivo,
    imagenesArchivo: ImagenArchivoJSON[]
  ): Promise<void>;
  // Crea ejercicios/<id>.json en la rama `requests` (y, antes, cada
  // imagenes/<id>.json que corresponda) mediante PUT sin `sha` (son ficheros
  // nuevos, FR-017/FR-019). No escribe en `main` ni gestiona la pull request
  // ni las reglas de validación automática que la fusionan (fuera de alcance).
}

interface CategoriaComun {
  id: string;
  nombre: string;
}

interface EjercicioComunArchivo {
  id: string;
  nombre: string;
  descripcion: string;
  categoriaIds: string[]; // referencias a CategoriaComun; una o varias
  enlaces: EnlaceEjercicio[]; // mismo tipo que domain/ejercicio/ejercicio.entity.ts
  imagenes: ImagenEjercicioComun[];
  observaciones?: string;
}

interface ImagenEjercicioComun {
  id: string;
  tipo: 'url' | 'archivo';
  valorUrl?: string; // presente cuando tipo === 'url'
  ruta?: string; // presente cuando tipo === 'archivo': "imagenes/<id>.json"
}

// ImagenArchivoJSON y CredencialesGitHub se reutilizan tal cual de
// application/ports/github-sync.port.ts (mismo formato, mismo token).
```

**Errores que puede lanzar la implementación**: `ErrorRedSincronizacion` (repositorio común no disponible o sin conexión, FR-023), `ErrorAutenticacionGitHub` (token inválido o sin permisos, solo en `existeEjercicioPorNombre`/`subirEjercicio`), `ErrorValidacion` (documento remoto con formato inválido, p. ej. una imagen de archivo). Ninguno modifica datos locales; `subirEjercicio` no deja cambios parciales si falla a mitad (si la subida de una imagen falla, no se intenta subir el fichero del ejercicio).

## Reglas de decisión de Application (sin lógica de dominio adicional)

A diferencia de `GitHubSyncPort` (001), este puerto no necesita un caso de uso puro de `decidir-accion-sincronizacion`: no hay conflicto posible porque solo se crean ficheros nuevos, nunca se actualizan los existentes. Los casos de uso de Application (`BuscarEjerciciosComunesUseCase`, `ImportarEjerciciosComunesUseCase`, `SubirEjercicioComunUseCase`) orquestan directamente: comprobar credenciales en `AjustesRepositoryPort` cuando se requieren (FR-014), aplicar `cumpleRequisitoRepositorioComun` (Domain) antes de ofrecer la subida, llamar a `existeEjercicioPorNombre` antes de pedir confirmación, y llamar a `EjercicioRepositoryPort.marcarSubidoRepositorioComun()` tras una subida correcta.

## Reutilización explícita

- `ImagenArchivoJSON` y `CredencialesGitHub`: importados de `application/ports/github-sync.port.ts`, sin redefinirlos.
- La lectura de contenido con *fallback* a la API de blobs (ficheros remotos de más de 1 MB) y la codificación/decodificación base64 se extraen de `GithubSyncAdapter` a un util compartido de Infrastructure, usado también por el adaptador de este puerto (ver research.md, sección 5). Para las URLs raw no aplica el fallback de blobs (el CDN de `raw.githubusercontent.com` no tiene ese límite de tamaño de respuesta).
