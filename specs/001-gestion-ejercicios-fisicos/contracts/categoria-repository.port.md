# Contrato: CategoriaRepositoryPort

**Capa que lo define**: Application (puerto) · **Capa que lo implementa**: Infrastructure (adaptador SQLite WASM)

```ts
interface CategoriaRepositoryPort {
  listarTodas(): Promise<Categoria[]>;
  // Ordenadas alfabéticamente por nombre (decisión de Assumptions del spec).

  obtenerPorId(id: string): Promise<Categoria | null>;

  crear(nombre: string, descripcion?: string): Promise<Categoria>;
  // Lanza ErrorNombreDuplicado si ya existe una categoría (de cualquier tipo) con ese nombre (FR-010).

  actualizar(id: string, cambios: { nombre?: string; descripcion?: string }): Promise<Categoria>;
  // Lanza ErrorNombreDuplicado si el nuevo nombre colisiona con otra categoría existente.
  eliminar(id: string): Promise<void>;
  // Application impide el borrado si algún ejercicio asociado solo tiene esta categoría.
  // Si todos conservan otra, llama antes EjercicioRepositoryPort.quitarCategoriaDeTodos().

  restaurar(categoria: Categoria): Promise<void>;
  // Restaura una categoría eliminada conservando su id original (FR-069).
  // Application restaura después las asignaciones de ejercicios capturadas en la instantánea.
}
```

**Errores del dominio que puede lanzar la implementación**: `ErrorNombreDuplicado`, `ErrorNoEncontrado`.
