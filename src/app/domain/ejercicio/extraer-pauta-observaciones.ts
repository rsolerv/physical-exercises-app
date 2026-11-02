export interface PautaExtraida {
  series?: number;
  repeticiones?: number;
  observaciones?: string;
}

/** Separa la pauta que versiones anteriores guardaban dentro de observaciones. */
export function extraerPautaObservaciones(observaciones: string): PautaExtraida | null {
  const pautaCompleta = /\b(\d+)\s+series?\s+de\s+(\d+)\s+repeticiones?\b/i.exec(observaciones);
  if (pautaCompleta) {
    const series = enteroPositivo(pautaCompleta[1]);
    const repeticiones = enteroPositivo(pautaCompleta[2]);
    if (series === null || repeticiones === null) return null;
    return {
      series,
      repeticiones,
      ...detalleRestante(observaciones.replace(pautaCompleta[0], '')),
    };
  }

  const serieSola = /^\s*(\d+)\s+series?\s*[.,;]?\s*$/i.exec(observaciones);
  if (serieSola) {
    const series = enteroPositivo(serieSola[1]);
    return series === null ? null : { series };
  }

  const repeticionesSolas = /^\s*(\d+)\s+repeticiones?\s*[.,;]?\s*$/i.exec(observaciones);
  if (repeticionesSolas) {
    const repeticiones = enteroPositivo(repeticionesSolas[1]);
    return repeticiones === null ? null : { repeticiones };
  }

  return null;
}

function enteroPositivo(valor: string): number | null {
  const numero = Number(valor);
  return Number.isSafeInteger(numero) && numero > 0 ? numero : null;
}

function detalleRestante(texto: string): Pick<PautaExtraida, 'observaciones'> {
  const observaciones = texto.replace(/^\s*[.,;]\s*/, '').replace(/\s*[.,;]\s*$/, '').trim();
  return observaciones ? { observaciones } : {};
}
