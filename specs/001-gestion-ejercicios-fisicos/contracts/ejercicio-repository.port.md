# Contrato: EjercicioRepositoryPort

**Capa que lo define**: Application (puerto) · **Capa que lo implementa**: Infrastructure (adaptador SQLite WASM)

Puerto que Application usa para leer y escribir Ejercicios, sin conocer el detalle de SQLite WASM.

La [feature 003](../../003-importar-exportar-ejercicios/spec.md) amplía este puerto con `marcarSubidoRepositorioComun(id)` y con el campo `subidoRepositorioComun` de la entidad `Ejercicio`; el detalle de esa ampliación está en su [modelo de datos](../../003-importar-exportar-ejercicios/data-model.md). El resto de este contrato no cambia.

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

  restaurar(ejercicio: Ejercicio): Promise<void>;
  // Restaura el ejercicio eliminado con su id, datos y categorías originales (FR-069).
  // Application restaura las asociaciones con los días mediante PlanificacionRepositoryPort
  // antes de informar que "Deshacer" se completó.

  quitarCategoriaDeTodos(categoriaId: string): Promise<void>;
  // Retira categoriaId después de comprobar que todos los ejercicios afectados
  // conservan otra categoría; no crea categorías de reserva (FR-011).
}
```

**Errores del dominio que puede lanzar la implementación**: `ErrorValidacion` (datos incompletos o URL inválida), `ErrorNoEncontrado` (id inexistente). Ningún método expone detalles de SQLite (SQL, códigos de motor) al resto de capas.
