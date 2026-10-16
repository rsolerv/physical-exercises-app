import { describe, it, expect } from 'vitest';
import { decidirAccionSincronizacion } from '../../../src/app/domain/sincronizacion/decidir-accion-sincronizacion';

describe('decidirAccionSincronizacion', () => {
  it('sube cuando el remoto no existe', () => {
    const accion = decidirAccionSincronizacion({
      cambiosLocalesPendientes: false,
      ultimoShaSincronizado: null,
      lecturaRemota: { existe: false },
    });
    expect(accion).toEqual({ tipo: 'subir' });
  });

  it('propone conflicto con "conservar_remoto" por defecto en la primera sincronización con datos remotos (FR-035)', () => {
    const accion = decidirAccionSincronizacion({
      cambiosLocalesPendientes: false,
      ultimoShaSincronizado: null,
      lecturaRemota: { existe: true, sha: 'sha-remoto' },
    });
    expect(accion).toEqual({ tipo: 'conflicto', opcionPorDefecto: 'conservar_remoto' });
  });

  it('no hace nada cuando el SHA remoto coincide y no hay cambios locales', () => {
    const accion = decidirAccionSincronizacion({
      cambiosLocalesPendientes: false,
      ultimoShaSincronizado: 'sha-1',
      lecturaRemota: { existe: true, sha: 'sha-1' },
    });
    expect(accion).toEqual({ tipo: 'nada' });
  });

  it('sube cuando el SHA remoto coincide pero hay cambios locales pendientes', () => {
    const accion = decidirAccionSincronizacion({
      cambiosLocalesPendientes: true,
      ultimoShaSincronizado: 'sha-1',
      lecturaRemota: { existe: true, sha: 'sha-1' },
    });
    expect(accion).toEqual({ tipo: 'subir' });
  });

  it('descarga cuando el SHA remoto difiere y no hay cambios locales', () => {
    const accion = decidirAccionSincronizacion({
      cambiosLocalesPendientes: false,
      ultimoShaSincronizado: 'sha-1',
      lecturaRemota: { existe: true, sha: 'sha-2' },
    });
    expect(accion).toEqual({ tipo: 'descargar' });
  });

  it('propone conflicto con "conservar_local" por defecto cuando hay cambios en ambos lados', () => {
    const accion = decidirAccionSincronizacion({
      cambiosLocalesPendientes: true,
      ultimoShaSincronizado: 'sha-1',
      lecturaRemota: { existe: true, sha: 'sha-2' },
    });
    expect(accion).toEqual({ tipo: 'conflicto', opcionPorDefecto: 'conservar_local' });
  });
});
