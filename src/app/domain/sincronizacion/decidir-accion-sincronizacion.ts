/** Acción resultante de comparar el estado local con el remoto. */
export type AccionSincronizacion =
  | { tipo: 'subir' }
  | { tipo: 'descargar' }
  | { tipo: 'nada' }
  | { tipo: 'conflicto'; opcionPorDefecto: 'conservar_local' | 'conservar_remoto' };

export interface EntradaDecisionSincronizacion {
  cambiosLocalesPendientes: boolean;
  ultimaVersionSincronizada: string | null;
  lecturaRemota: { existe: false } | { existe: true; version: string };
}

/**
 * Decide qué acción de sincronización realizar a partir del estado local
 * (`cambiosLocalesPendientes`, `ultimaVersionSincronizada`) y del resultado
 * de la lectura remota, según la tabla de contratos de sincronización.
 * No realiza ninguna E/S: el caso de uso de Application `sincronizar-github`
 * es quien ejecuta la acción resultante.
 */
export function decidirAccionSincronizacion(entrada: EntradaDecisionSincronizacion): AccionSincronizacion {
  const { cambiosLocalesPendientes, ultimaVersionSincronizada, lecturaRemota } = entrada;

  if (!lecturaRemota.existe) {
    return { tipo: 'subir' };
  }

  if (ultimaVersionSincronizada === null) {
    return { tipo: 'conflicto', opcionPorDefecto: 'conservar_remoto' };
  }

  const mismaVersion = lecturaRemota.version === ultimaVersionSincronizada;

  if (mismaVersion && !cambiosLocalesPendientes) return { tipo: 'nada' };
  if (mismaVersion && cambiosLocalesPendientes) return { tipo: 'subir' };
  if (!mismaVersion && !cambiosLocalesPendientes) return { tipo: 'descargar' };

  return { tipo: 'conflicto', opcionPorDefecto: 'conservar_local' };
}
