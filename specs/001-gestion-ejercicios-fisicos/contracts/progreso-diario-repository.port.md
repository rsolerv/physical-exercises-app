# Contrato: ProgresoDiarioRepositoryPort

**Capa que lo define**: Application (puerto) · **Capa que lo implementa**: Infrastructure (adaptador SQLite WASM)

```ts
interface ProgresoDiarioRepositoryPort {
  obtenerPorFecha(fecha: Date): Promise<ProgresoDiario[]>;
  // Todos los registros de progreso (uno por ejercicio planificado) para una fecha concreta.

  marcar(fecha: Date, ejercicioId: string, realizado: boolean): Promise<void>;
  // Crea o actualiza el registro de progreso para (fecha, ejercicioId) (FR-024).
}
```

**Nota de diseño**: el porcentaje del día (FR-025) NO se calcula en este puerto. Lo calcula el caso de uso puro de dominio `calcular-porcentaje-dia` a partir de los registros devueltos por `obtenerPorFecha()` y de los ejercicios planificados para esa fecha (obtenidos vía `PlanificacionRepositoryPort.obtenerActiva()`). El caso de uso de Application distingue "0% completado" de "no hay planificación hoy" (CL2) al construir el mensaje para el usuario.

**Errores del dominio que puede lanzar la implementación**: `ErrorNoEncontrado` (si `ejercicioId` no existe o no estaba planificado para `fecha`).
