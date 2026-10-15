# Contrato: AjustesRepositoryPort

**Capa que lo define**: Application (puerto) · **Capa que lo implementa**: Infrastructure (adaptador SQLite WASM)

Puerto de soporte técnico (no es una entidad de negocio del spec) para los ajustes descritos en `data-model.md` → "Ajustes de aplicación".

```ts
interface AjustesRepositoryPort {
  obtener(): Promise<AjustesAplicacion>;

  guardarCredencialesGitHub(tokenPAT: string, repositorio: string): Promise<void>;

  olvidarCredencialesGitHub(): Promise<void>;
  // Borra token y repositorio guardados (acción "Olvidar token", FR-037).

  actualizarUltimoShaSincronizado(sha: string): Promise<void>;

  marcarCambiosLocalesPendientes(pendientes: boolean): Promise<void>;
  // true tras cualquier alta, modificación o borrado de datos de usuario;
  // false tras una sincronización completada (FR-035).

  estaCatalogoPredefinidoCargado(): Promise<boolean>;

  marcarCatalogoPredefinidoCargado(): Promise<void>;
  // Invocado una única vez, tras insertar con éxito el catálogo de ejercicios predefinidos
  // y la categoría genérica "Sin categoría" en el primer arranque (FR-034, FR-011).
}
```

**Uso esperado en el arranque de la aplicación** (FR-001): el caso de uso de arranque comprueba `estaCatalogoPredefinidoCargado()`; si es `false`, inserta la categoría genérica y el catálogo de ejercicios predefinidos (datos semilla en `src/assets/catalogo-predefinido/`) y después llama a `marcarCatalogoPredefinidoCargado()`, de modo que en arranques posteriores no se repite la inserción ni se sobrescriben ediciones del usuario sobre esos ejercicios. La siembra del catálogo NO marca `cambiosLocalesPendientes`, para que un dispositivo nuevo no se considere "con cambios locales" en su primera sincronización.

**Uso esperado en los casos de uso de escritura**: todo caso de uso de Application que cree, modifique o borre datos de usuario (ejercicios, categorías, planificaciones, progreso) DEBE llamar a `marcarCambiosLocalesPendientes(true)` tras guardar con éxito.
