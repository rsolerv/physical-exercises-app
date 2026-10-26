export function versionSincronizadaEfectiva(
  destinoActual: string | null,
  destinoGuardado: string | null,
  versionGuardada: string | null
): string | null {
  return destinoActual !== null && destinoActual === destinoGuardado ? versionGuardada : null;
}
