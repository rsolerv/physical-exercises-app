# Contrato: Copia de seguridad en ZIP

**Capa**: formato lógico en Application/Domain · empaquetado, descarga y selección en Presentation · **Decisión**: [research.md](../research.md), sección 8

Permite exportar todos los datos a un único archivo ZIP y reemplazar los datos locales importándolo, sin ninguna cuenta (historia 4, FR-019 y FR-020). El archivo conserva la estructura lógica de sincronización: `datos.json` y una carpeta hermana `imagenes/` con un JSON por imagen. Application intercambia rutas y texto; ZIP, `Blob` y el selector de archivos viven en Presentation.

## Estructura del archivo

Nombre sugerido `copia-ejercicios-AAAA-MM-DD.zip`; estructura interna:

```text
copia-ejercicios-AAAA-MM-DD.zip
├── datos.json                 # ExportacionJSON actual
└── imagenes/
    ├── <id-imagen-1>.json     # ImagenArchivoJSON
    └── <id-imagen-2>.json
```

`ExportacionJSON` e `ImagenArchivoJSON` son los de [la feature 001](../../001-gestion-ejercicios-fisicos/contracts/github-sync.port.md). En `datos.json`, las imágenes de archivo referencian `imagenes/<id>.json`. Cada archivo de imagen contiene un objeto `ImagenArchivoJSON` con `id`, `nombreArchivo`, `tipoMime` y `contenidoBase64`. El ZIP no incluye ajustes, tokens, correo ni información de la cuenta (FR-018).

## Casos de uso (Application)

```ts
class CopiaManualUseCase {
  exportar(): Promise<{ nombreSugerido: string; archivos: Record<string, string> }>;
  // Devuelve datos.json y las rutas imagenes/<id>.json; no construye ZIP ni modifica datos.

  importar(datosJson: string, archivosImagenes: Record<string, string>): Promise<void>;
  // Valida los JSON y sus rutas, reemplaza los datos locales y marca cambios pendientes.
}
```

La confirmación previa ("esto reemplaza tus datos actuales") es responsabilidad de Presentation: Application no importa si no se le invoca, y cancelar no la invoca.

`ExportarImportarDatosUseCase.importar` recibe un resolvedor de imágenes (`(ruta: string) => Promise<ImagenArchivoJSON>`). La sincronización lo invoca con `ProveedorSincronizacionPort.leerImagen`; la copia manual resuelve las rutas desde el ZIP. Antes de borrar datos locales, se validan los documentos y se resuelven todas las imágenes referenciadas; si una falta, está dañada o supera los 5 MB, no se modifica ningún dato (SC-005).

## Validación (función pura de Domain: `validar-copia-seguridad`)

Se rechaza, sin modificar datos locales, cuando:

| Causa | Mensaje al usuario (español de España) |
|---|---|
| `datos.json` no es JSON | "El fichero no es una copia de seguridad válida." |
| Falta alguna colección de datos o tiene un tipo incorrecto | "El fichero está dañado o incompleto." |
| Un elemento no está dentro de `imagenes/` o no acaba en `.json` | "El fichero está dañado o incompleto." |
| Una imagen no es JSON válido, no tiene la estructura esperada o su `id` no coincide con su nombre | "El fichero está dañado o incompleto." |
| Una imagen de archivo referenciada no está en el ZIP | "El fichero está dañado o incompleto." |
| Una imagen de archivo supera los 5 MB (regla de FR-036 de la feature 001, `TAMANO_MAXIMO_IMAGEN_BYTES`) | "Cada imagen de archivo no puede superar los 5 MB." |

Presentation rechaza también un ZIP que no pueda abrirse o que no contenga `datos.json`. La validación de contenido no ejecuta ni evalúa el fichero: analiza JSON y comprueba estructura y rutas lógicas, sin extraer rutas a disco.

## Comportamiento por escenario de la spec

| Escenario | Resultado |
|---|---|
| Exportar con datos | Se descarga un ZIP con `datos.json` e `imagenes/` y se muestra una confirmación (FR-019, historia 4 · 1) |
| Importar un ZIP válido y confirmar | Los datos locales y todas las imágenes pasan a ser los del ZIP (FR-020, historia 4 · 2) |
| Importar un archivo inválido o incompleto | Mensaje claro y datos locales intactos (historia 4 · 3) |
| Cancelar en la confirmación | Sin cambios (historia 4 · 4) |
| Revisar el contenido exportado | `datos.json` e imágenes no contienen credenciales ni información de cuenta (historia 4 · 5) |
