# Contrato: CategoriaRepositoryPort

**Capa que lo define**: Application (puerto) · **Capa que lo implementa**: Infrastructure (adaptador SQLite WASM)

```ts
interface CategoriaRepositoryPort {
  listarTodas(): Promise<Categoria[]>;
  // Ordenadas alfabéticamente por nombre (decisión de Assumptions del spec).

  obtenerPorId(id: string): Promise<Categoria | null>;

  obtenerGenerica(): Promise<Categoria>;
  // Devuelve la categoría de fábrica "Sin categoría" (esGenerica = true).
  // Debe existir siempre tras el primer arranque (ver AjustesRepositoryPort).

  crear(nombre: string, descripcion?: string): Promise<Categoria>;
  // Lanza ErrorNombreDuplicado si ya existe una categoría (de cualquier tipo) con ese nombre (FR-010).

  actualizar(id: string, cambios: { nombre?: string; descripcion?: string }): Promise<Categoria>;
  // Lanza ErrorNombreDuplicado si el nuevo nombre colisiona con otra categoría existente.
  // Lanza ErrorOperacionNoPermitida si se intenta renombrar la categoría genérica.

  eliminar(id: string): Promise<void>;
  // Lanza ErrorOperacionNoPermitida si esGenerica = true (FR-011).
  // Si tiene ejercicios asociados, el llamador (caso de uso de Application) debe invocar
  // antes EjercicioRepositoryPort.quitarCategoriaDeTodos() con el id de la categoría genérica
  // como destino de reasignación, para no dejar ejercicios sin categoría.
}
```

**Errores del dominio que puede lanzar la implementación**: `ErrorNombreDuplicado`, `ErrorOperacionNoPermitida`, `ErrorNoEncontrado`.
