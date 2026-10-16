/** Acción resultante de comparar el estado local con el remoto (contracts/github-sync.port.md). */
export type AccionSincronizacion =
  | { tipo: 'subir' }
  | { tipo: 'descargar' }
  | { tipo: 'nada' }
  | { tipo: 'conflicto'; opcionPorDefecto: 'conservar_local' | 'conservar_remoto' };

export interface EntradaDecisionSincronizacion {
  cambiosLocalesPendientes: boolean;
  ultimoShaSincronizado: string | null;
  lecturaRemota: { existe: false } | { existe: true; sha: string };
}

/**
 * Decide qué acción de sincronización realizar a partir del estado local
 * (`cambiosLocalesPendientes`, `últimoShaSincronizado`) y del resultado de
 * `GitHubSyncPort.leerRemoto()`, según la tabla de contracts/github-sync.port.md.
 * No realiza ninguna E/S: el caso de uso de Application `sincronizar-github`
 * es quien ejecuta la acción resultante.
 */
export function decidirAccionSincronizacion(entrada: EntradaDecisionSincronizacion): AccionSincronizacion {
  const { cambiosLocalesPendientes, ultimoShaSincronizado, lecturaRemota } = entrada;

  if (!lecturaRemota.existe) {
    return { tipo: 'subir' };
  }

  if (ultimoShaSincronizado === null) {
    return { tipo: 'conflicto', opcionPorDefecto: 'conservar_remoto' };
  }

  const mismoSha = lecturaRemota.sha === ultimoShaSincronizado;

  if (mismoSha && !cambiosLocalesPendientes) return { tipo: 'nada' };
  if (mismoSha && cambiosLocalesPendientes) return { tipo: 'subir' };
  if (!mismoSha && !cambiosLocalesPendientes) return { tipo: 'descargar' };

  return { tipo: 'conflicto', opcionPorDefecto: 'conservar_local' };
}
