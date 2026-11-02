import { describe, expect, it } from 'vitest';
import { extraerPautaObservaciones } from '../../../src/app/domain/ejercicio/extraer-pauta-observaciones';

describe('extraerPautaObservaciones', () => {
  it('separa series y repeticiones de las observaciones restantes', () => {
    expect(extraerPautaObservaciones('3 series de 10 repeticiones. Mantén la espalda recta.')).toEqual({
      series: 3,
      repeticiones: 10,
      observaciones: 'Mantén la espalda recta',
    });
  });

  it('extrae una pauta completa aunque no haya observaciones adicionales', () => {
    expect(extraerPautaObservaciones('1 serie de 8 repeticiones.')).toEqual({ series: 1, repeticiones: 8 });
  });

  it('extrae una serie sola si el texto antiguo no indicaba repeticiones', () => {
    expect(extraerPautaObservaciones('1 serie.')).toEqual({ series: 1 });
  });

  it('extrae repeticiones solas', () => {
    expect(extraerPautaObservaciones('8 repeticiones')).toEqual({ repeticiones: 8 });
  });

  it('no interpreta ceros ni valores que exceden el rango entero seguro', () => {
    expect(extraerPautaObservaciones('0 series de 10 repeticiones')).toBeNull();
    expect(extraerPautaObservaciones('9007199254740992 series de 10 repeticiones')).toBeNull();
    expect(extraerPautaObservaciones('0 series.')).toBeNull();
    expect(extraerPautaObservaciones('9007199254740992 repeticiones')).toBeNull();
  });

  it('no altera texto que no contiene una pauta reconocible', () => {
    expect(extraerPautaObservaciones('Hazlo con control.')).toBeNull();
    expect(extraerPautaObservaciones('2 series de unos 25 pasos.')).toBeNull();
  });
});
