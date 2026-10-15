import { describe, it, expect } from 'vitest';
import {
  ErrorDominio,
  ErrorValidacion,
  ErrorNoEncontrado,
  ErrorNombreDuplicado,
  ErrorOperacionNoPermitida,
  ErrorPlanificacionActivaDuplicada,
  ErrorEjercicioDuplicadoEnDia,
  ErrorRedSincronizacion,
  ErrorAutenticacionGitHub,
  ErrorConflictoRemoto,
} from '../../../src/app/domain/errores/errores-dominio';

describe('Errores de dominio', () => {
  const casos: Array<[new (mensaje: string) => ErrorDominio, string]> = [
    [ErrorValidacion, 'ErrorValidacion'],
    [ErrorNoEncontrado, 'ErrorNoEncontrado'],
    [ErrorNombreDuplicado, 'ErrorNombreDuplicado'],
    [ErrorOperacionNoPermitida, 'ErrorOperacionNoPermitida'],
    [ErrorPlanificacionActivaDuplicada, 'ErrorPlanificacionActivaDuplicada'],
    [ErrorEjercicioDuplicadoEnDia, 'ErrorEjercicioDuplicadoEnDia'],
    [ErrorRedSincronizacion, 'ErrorRedSincronizacion'],
    [ErrorAutenticacionGitHub, 'ErrorAutenticacionGitHub'],
    [ErrorConflictoRemoto, 'ErrorConflictoRemoto'],
  ];

  it.each(casos)('%s se instancia como ErrorDominio con el mensaje y el nombre correctos', (Clase, nombreEsperado) => {
    const error = new Clase('mensaje de prueba');
    expect(error).toBeInstanceOf(ErrorDominio);
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('mensaje de prueba');
    expect(error.name).toBe(nombreEsperado);
  });
});
