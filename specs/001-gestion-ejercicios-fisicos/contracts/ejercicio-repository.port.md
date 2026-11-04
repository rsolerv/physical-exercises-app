# Contrato: EjercicioRepositoryPort

**Capa que lo define**: Application (puerto) · **Capa que lo implementa**: Infrastructure (adaptador SQLite WASM)

Puerto que Application usa para leer y escribir Ejercicios, sin conocer el detalle de SQLite WASM.

La [feature 003](../../003-importar-exportar-ejercicios/spec.md) amplía este puerto con `marcarSubidoRepositorioComun(id)`, `quitarMarcaSubidoRepositorioComun(id)` y el campo `subidoRepositorioComun` de la entidad `Ejercicio`; el detalle de esa ampliación está en su [modelo de datos](../../003-importar-exportar-ejercicios/data-model.md). La segunda operación solo se orquesta tras acreditar a `rsolerv`. La enmienda de paginación del 2026-11-04 sustituye las búsquedas completas por texto/categorías por una consulta paginada de resúmenes; conserva las operaciones completas y administrativas.

```ts
interface EjercicioRepositoryPort {
  obtenerPorId(id: string): Promise<Ejercicio | null>;

  listarTodos(): Promise<Ejercicio[]>;

  buscarPaginado(criterios: CriteriosBusquedaEjercicios): Promise<PaginaEjercicios>;

  contarTodos(): Promise<number>;

  crear(datos: DatosNuevoEjercicio): Promise<Ejercicio>;
  // Lanza ErrorValidacion si falta nombre, descripción o categoría (FR-005, FR-006),
  // o si alguna URL de datos.enlacesWeb/enlacesYoutube no tiene formato válido (FR-007).

  actualizar(id: string, cambios: Partial<DatosNuevoEjercicio>): Promise<Ejercicio>;
  // Mismas validaciones que crear() sobre los campos modificados.
  // Lanza ErrorNoEncontrado si el id no existe.
  // series y repeticiones son enteros positivos opcionales y se persisten en
  // columnas independientes de observaciones.

  eliminar(id: string): Promise<void>;
  // Debe propagar la eliminación a todas las planificaciones que lo referencien (FR-028).

  restaurar(ejercicio: Ejercicio): Promise<void>;
  // Restaura el ejercicio eliminado con su id, datos y categorías originales (FR-069).
  // Application restaura las asociaciones con los días mediante PlanificacionRepositoryPort
  // antes de informar que "Deshacer" se completó.

  quitarCategoriaDeTodos(categoriaId: string): Promise<void>;
  // Retira categoriaId después de comprobar que todos los ejercicios afectados
  // conservan otra categoría; no crea categorías de reserva (FR-011).

  marcarSubidoRepositorioComun(id: string): Promise<void>;
  // Marca un ejercicio como enviado al repositorio común (feature 003, FR-021).

  quitarMarcaSubidoRepositorioComun(id: string): Promise<void>;
  // Revierte la marca administrativa de la feature 003 (FR-027); Application
  // solo lo invoca tras acreditar a rsolerv y no modifica otros datos.
}
```

**Errores del dominio que puede lanzar la implementación**: `ErrorValidacion` (datos incompletos o URL inválida), `ErrorNoEncontrado` (id inexistente). Ningún método expone detalles de SQLite (SQL, códigos de motor) al resto de capas.

## Contrato de lectura paginada

Tipos definidos en [data-model.md](../data-model.md):

```ts
interface CriteriosBusquedaEjercicios {
  texto: string;
  categoriaIds: string[];
  pagina: number;
  tamanoPagina: number;
}

interface PaginaEjercicios {
  resultados: EjercicioResumen[];
  total: number;
}
```

- `pagina` es un índice basado en cero; `tamanoPagina` admite enteros entre 1 y 100. Se rechazan números negativos, fraccionarios, no finitos o no seguros y desplazamientos no seguros mediante `ErrorValidacion`; no se corrigen silenciosamente.
- `BuscarEjerciciosUseCase.buscarPaginado` normaliza el texto con `trim()`, elimina ids de categoría repetidos y proporciona valores iniciales de página 0 y tamaño 50. Su operación `contarTotal()` delega en `contarTodos()`. No contiene intersección, filtrado ni recorte de arrays de ejercicios.
- Sin filtros se consulta el catálogo local completo **por páginas**, nunca mediante `listarTodos()`. El texto coincide parcialmente en nombre **o** descripción, conservando el comportamiento vigente de mayúsculas/minúsculas y `LIKE`; esta enmienda no añade búsqueda lingüística, relevancia ni normalización de acentos.
- Varias categorías significan cualquiera de ellas; texto y categorías se combinan con `AND`. Usar `EXISTS` sobre `ejercicio_categoria` evita multiplicar filas por pertenecer a varias categorías seleccionadas.
- La página aplica `ORDER BY e.nombre, e.id`, con la misma intercalación SQLite vigente, `LIMIT` y `OFFSET = pagina * tamanoPagina`. El desempate por id es obligatorio; no se ofrece ordenación configurable.
- El total se obtiene con `COUNT(*)` sobre ejercicios y **el mismo predicado** de texto y `EXISTS`, sin límite. No es el tamaño de la página ni el del catálogo sin filtrar. Una página fuera de rango devuelve `resultados: []` con el total real para que Presentation reajuste el índice.
- La consulta selecciona exclusivamente `id`, `nombre` y `descripcion`. Si la página no está vacía, una consulta adicional trae todas sus asociaciones de categoría mediante `ejercicio_id IN (...)`. No llama a la hidratación completa ni lee las tablas de enlaces o imágenes. El número de consultas de una lectura de página es como máximo tres (conteo, página y categorías), independiente del número de resultados; una página vacía no consulta asociaciones.
- Todo valor de filtro, límite y desplazamiento se enlaza como parámetro SQL. Los marcadores de las listas se construyen por cantidad, sin interpolar valores.
- `contarTodos()` ejecuta un conteo sin filtros y no hidrata ejercicios; conserva la distinción entre catálogo vacío y búsqueda vacía. No hace falta repetirlo al avanzar cada página si el catálogo no ha cambiado.
- Los errores de persistencia se propagan para mostrarse en la interfaz; no se devuelven páginas vacías ni ceros como sustituto de un fallo.
- Las páginas no representan una instantánea permanente del catálogo. Ante una escritura conocida (edición, borrado, importación o sincronización aplicada), se invalidan los resultados activos y se vuelven a consultar conteo/página; no se concatena un bloque de una versión anterior. Si ocurre durante una lectura y altera su coherencia, se descarta esa respuesta y se repite sobre el catálogo actualizado.

## Separación de operaciones completas

`listarTodos(): Promise<Ejercicio[]>` mantiene su significado: todos los ejercicios, sin filtros ni límites, con todos sus campos, enlaces e imágenes. `obtenerPorId` mantiene igualmente el detalle completo. No se implementan ninguno de ellos reutilizando solo la primera página o el acumulador de la interfaz.

`ExportarImportarDatosUseCase` sigue usando las operaciones completas, tanto al exportar como al leer los datos previos a importar. `SincronizarUseCase` y `CopiaManualUseCase` reutilizan esa exportación/importación; GitHub, Google Drive, conflictos, restauraciones e imágenes separadas conservan el formato y la integridad vigentes de la [feature 002](../../002-sincronizacion-google-drive/spec.md). Los datos de páginas no visitadas deben estar incluidos.

Los consumidores actuales de `listarTodos()` en categorías, reglas de borrado y vistas de planificación no pasan a recibir resultados parciales por esta enmienda. Optimizar esas lecturas completas requeriría su propio cambio acotado y sus pruebas, nunca redefinir `listarTodos()`.

Se retiran `buscarPorTexto` y `buscarPorCategorias` del puerto/adaptador al migrar sus consumidores a `buscarPaginado`. También se actualizan dobles de pruebas y proveedores de Storybook; no se dejan métodos incompatibles ni conversiones de resumen a agregado completo.
