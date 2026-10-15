# Contrato: PlanificacionRepositoryPort

**Capa que lo define**: Application (puerto) · **Capa que lo implementa**: Infrastructure (adaptador SQLite WASM)

```ts
interface PlanificacionRepositoryPort {
  obtenerPorId(id: string): Promise<Planificacion | null>;

  listarTodas(): Promise<Planificacion[]>;

  obtenerActiva(fechaReferencia: Date): Promise<Planificacion | null>;
  // Devuelve la planificación concreta (no plantilla) cuya semana lunes-domingo contiene
  // fechaReferencia, o null si no existe ninguna (CL2). El cálculo de "activa" es por fecha,
  // nunca por una marca manual almacenada (decisión de clarificación de spec).

  crear(datos: DatosNuevaPlanificacion): Promise<Planificacion>;
  // Si datos.fechaInicio tiene valor, DEBE ser un lunes (si no, ErrorValidacion) y no puede
  // existir otra planificación concreta con la misma fechaInicio (FR-017, FR-022); si existe,
  // lanza ErrorPlanificacionActivaDuplicada.

  actualizar(id: string, cambios: Partial<DatosNuevaPlanificacion>): Promise<Planificacion>;
  // Mismas validaciones que crear() cuando se modifica fechaInicio (excluyendo la propia planificación).

  duplicar(id: string, nuevoNombre: string): Promise<Planificacion>;
  // Crea una copia independiente con los mismos días/ejercicios, sin fechaInicio (FR-019, CA14).

  asignarEjercicioADia(planificacionId: string, dia: DiaSemana, ejercicioId: string): Promise<void>;
  // Lanza ErrorEjercicioDuplicadoEnDia si ejercicioId ya está en ese día de esa planificación (FR-021).

  quitarEjercicioDeDia(planificacionId: string, dia: DiaSemana, ejercicioId: string): Promise<void>;

  listarPorEjercicio(ejercicioId: string): Promise<Planificacion[]>;
  // Todas las planificaciones donde aparece un ejercicio dado (soporte de FR-028 al eliminarlo).
}
```

**Errores del dominio que puede lanzar la implementación**: `ErrorValidacion`, `ErrorPlanificacionActivaDuplicada`, `ErrorEjercicioDuplicadoEnDia`, `ErrorNoEncontrado`.
