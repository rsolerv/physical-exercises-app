# Contrato: EjercicioRepositoryPort

**Capa que lo define**: Application (puerto) · **Capa que lo implementa**: Infrastructure (adaptador SQLite WASM)

Puerto que Application usa para leer y escribir Ejercicios, sin conocer el detalle de SQLite WASM.

```ts
interface EjercicioRepositoryPort {
  obtenerPorId(id: string): Promise<Ejercicio | null>;

  listarTodos(): Promise<Ejercicio[]>;

  buscarPorTexto(texto: string): Promise<Ejercicio[]>;
  // Busca coincidencias parciales, sin distinguir mayúsculas/minúsculas,
  // sobre nombre y descripción (FR-013, CA6).

  buscarPorCategorias(categoriaIds: string[]): Promise<Ejercicio[]>;
  // Devuelve ejercicios que pertenezcan a alguna de las categorías indicadas (FR-012, CA7).
  // Lista vacía de resultados es una respuesta válida (CL3), no un error.

  crear(datos: DatosNuevoEjercicio): Promise<Ejercicio>;
  // Lanza ErrorValidacion si falta nombre, descripción o categoría (FR-005, FR-006),
  // o si alguna URL de datos.enlacesWeb/enlacesYoutube no tiene formato válido (FR-007).

  actualizar(id: string, cambios: Partial<DatosNuevoEjercicio>): Promise<Ejercicio>;
  // Mismas validaciones que crear() sobre los campos modificados.
  // Lanza ErrorNoEncontrado si el id no existe.

  eliminar(id: string): Promise<void>;
  // Debe propagar la eliminación a todas las planificaciones que lo referencien (FR-028).

  quitarCategoriaDeTodos(categoriaId: string, categoriaGenericaId: string): Promise<void>;
  // Usado al eliminar una Categoría: retira categoriaId de todos los ejercicios que la tengan;
  // si algún ejercicio queda sin ninguna categoría, le añade categoriaGenericaId (FR-011).
}
```

**Errores del dominio que puede lanzar la implementación**: `ErrorValidacion` (datos incompletos o URL inválida), `ErrorNoEncontrado` (id inexistente). Ningún método expone detalles de SQLite (SQL, códigos de motor) al resto de capas.
