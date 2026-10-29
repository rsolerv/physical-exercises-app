# Data Model: Importación y exportación de ejercicios con el repositorio común

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Investigación**: [research.md](./research.md)

Este documento solo describe entidades y campos **nuevos o ampliados** por esta feature. El resto del modelo de datos (Ejercicio, Categoría, Planificación, Progreso diario, Ajustes de aplicación) es el ya definido en [specs/001-gestion-ejercicios-fisicos/data-model.md](../001-gestion-ejercicios-fisicos/data-model.md) y no cambia salvo donde se indique.

## Ampliación de Ejercicio (entidad existente, 001)

| Campo nuevo | Tipo | Obligatorio | Regla de validación / origen |
|---|---|---|---|
| `subidoRepositorioComun` | booleano | Sí (por defecto `false`) | Pasa a `true` tras una subida correcta al repositorio común (FR-021). Nunca vuelve a `false`; no se expone ningún control para revertirlo. No afecta a ninguna otra regla de validación de Ejercicio. |

**Persistencia**: columna `subido_repositorio_comun INTEGER NOT NULL DEFAULT 0` añadida a la tabla `ejercicio` mediante migración `ALTER TABLE` (mismo patrón que `ultima_sincronizacion_correcta` en `ajustes_aplicacion`), aplicada una sola vez al iniciar el esquema y dejando `0` (false) en los ejercicios ya existentes.

**Nuevo método de `EjercicioRepositoryPort`**: `marcarSubidoRepositorioComun(id: string): Promise<void>` — pone `subidoRepositorioComun = true` para ese ejercicio; no modifica ningún otro campo. Ver ampliación del contrato en `specs/001-gestion-ejercicios-fisicos/contracts/ejercicio-repository.port.md`.

## Ejercicio común (remoto)

Representación de un ejercicio en el repositorio común, como fichero JSON independiente `ejercicios/<id>.json` en la rama `main` (lectura) o `requests` (escritura de uno nuevo). No es una entidad persistida localmente: vive solo en memoria mientras dura una búsqueda, una importación o una subida.

| Campo | Tipo | Obligatorio | Notas |
|---|---|---|---|
| `id` | identificador único | Sí | Generado por la aplicación al subir (mismo mecanismo que el `id` de Ejercicio); nombra el propio fichero. |
| `nombre` | texto | Sí | Comparado ignorando mayúsculas/minúsculas y espacios al principio/final para detectar duplicados (FR-017) y para localizar resultados de búsqueda por texto. |
| `descripcion` | texto | Sí | Igual que en Ejercicio local. |
| `categoriaIds` | lista de referencias a Categoría común, al menos 1 | Sí | Un ejercicio común puede tener una o varias categorías comunes (ver `categorias.json`). Al **subir**, contiene las categorías comunes elegidas por el usuario (una o varias, FR-016); al **importar**, se traduce a categorías propias del usuario (ver más abajo). |
| `enlaces` | lista de `{ tipo: 'web' \| 'youtube'; url }` | No | Misma forma que `Ejercicio.enlaces` en el modelo local (sin conversión). |
| `imagenes` | lista de `{ id; tipo: 'url' \| 'archivo'; valorUrl? ; ruta? }` | No | `tipo: 'archivo'` referencia `imagenes/<id>.json` (ver Imagen de archivo común); `tipo: 'url'` guarda la URL directamente en `valorUrl`. |
| `observaciones` | texto | No | Igual que en Ejercicio local; se omite en el fichero si está vacío. |

**Relaciones**: N:M con Categoría común (por `categoriaIds`). No tiene relación con Planificación, Progreso diario ni Ajustes: estos nunca se leen ni se escriben en el repositorio común (FR-013).

**Diferencia clave con Ejercicio local**: `categoriaIds` referencia categorías **comunes**, un espacio de identificadores distinto al de las categorías **propias** del usuario; nunca se mezclan ambos espacios en la misma lista (ver research.md, sección 6).

## Categoría común (remota)

Definida en `categorias.json`, al mismo nivel que `/ejercicios` y `/imagenes` en el repositorio común.

| Campo | Tipo | Obligatorio | Notas |
|---|---|---|---|
| `id` | identificador único | Sí | Espacio de identificadores propio del repositorio común, independiente del `id` de las categorías propias del usuario. |
| `nombre` | texto | Sí | Usado para: (a) filtrar en "Importar ejercicios" (selección única, FR-002); (b) comparar por nombre con las categorías propias del usuario al resolver el mapeo de importación (FR-009); (c) mostrarse en el selector de una o varias categorías al subir (FR-016). |

**Relaciones**: N:M con Ejercicio común. Nunca se crea, modifica ni elimina desde la aplicación (es un catálogo de solo lectura para la aplicación; su mantenimiento es responsabilidad del propietario del repositorio común, fuera de este alcance).

**Documento contenedor** `categorias.json`:

```json
{ "version": 1, "categorias": [{ "id": "...", "nombre": "..." }, "..."] }
```

## Imagen de archivo común (remota)

Documento `imagenes/<id>.json` en el repositorio común, con **la misma forma** que `ImagenArchivoJSON` ya definido en `application/ports/github-sync.port.ts` de 001 (reutilizado tal cual, sin un tipo nuevo):

| Campo | Tipo | Obligatorio |
|---|---|---|
| `id` | identificador único (igual al `id` de la imagen en el ejercicio que la referencia) | Sí |
| `nombreArchivo` | texto (p. ej. `"foto.jpg"`), solo para referencia/depuración | Sí |
| `tipoMime` | texto (p. ej. `"image/jpeg"`) | Sí |
| `contenidoBase64` | texto | Sí |

**Reglas de validación / origen**: igual que en 001 — si el documento remoto no existe o no tiene este formato al importar, se omite solo esa imagen y se informa del número de imágenes omitidas (FR-011); no se valida un tamaño máximo adicional al importar (la imagen ya se subió una vez respetando el límite de 5 MB de 001 por quien la publicó).

## Mapeo de categorías al importar (concepto de aplicación, no persistido)

No es una entidad de negocio ni se persiste: es una estructura transitoria que la Presentation construye durante la importación y pasa al caso de uso.

| Campo | Tipo | Notas |
|---|---|---|
| `categoriaComunId` | identificador de Categoría común | Categoría del ejercicio común que no coincide por nombre con ninguna categoría propia del usuario. |
| `categoriaLocalId` | identificador de Categoría propia del usuario | Categoría elegida por el usuario para sustituir a la anterior en el ejercicio importado (FR-009). |

Si el usuario no tiene ninguna categoría propia, no se puede construir ningún mapeo y la importación se bloquea (FR-010) antes de llegar a este paso.

## Validaciones nuevas (funciones puras de Domain)

- `normalizarNombreEjercicio(nombre: string): string` → `nombre.trim().toLowerCase()`. Usada tanto para comparar nombres al buscar como para detectar duplicados al subir (FR-017).
- `cumpleRequisitoRepositorioComun(ejercicio: Ejercicio): boolean` → `ejercicio.imagenes.length > 0 || ejercicio.enlaces.some(e => e.tipo === 'youtube')`. Nombre, descripción y categoría no se revalidan aquí: son invariantes ya garantizados por `validar-ejercicio.ts` de 001 para todo `Ejercicio` persistido.
- `aEjercicioComun(ejercicio: Ejercicio, categoriaIdsComunes: string[]): { datos: EjercicioComunArchivo; imagenesArchivo: ImagenArchivoJSON[] }` → separa las imágenes de tipo `archivo` en documentos independientes (mismo patrón que 001) y sustituye `categoriaIds` por `categoriaIdsComunes`.
- `aDatosNuevoEjercicio(ejercicioComun: EjercicioComunArchivo, categoriaIdsLocales: string[], imagenesArchivo: Map<string, ImagenArchivoJSON>): DatosNuevoEjercicio` → reincorpora el contenido base64 de las imágenes de archivo y sustituye `categoriaIds` por `categoriaIdsLocales` (ya resueltas por el mapeo).

## Resumen de cambios de esquema SQLite

```sql
ALTER TABLE ejercicio ADD COLUMN subido_repositorio_comun INTEGER NOT NULL DEFAULT 0;
```

Ninguna otra tabla cambia. No se crea ninguna tabla nueva: el repositorio común no tiene una copia local (siempre se consulta en línea; sin conexión, "Importar ejercicios" y "Subir al repositorio común" informan del error sin perder datos locales, FR-023).
