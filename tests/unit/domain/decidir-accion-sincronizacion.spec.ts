import { describe, it, expect } from 'vitest';
import { decidirAccionSincronizacion } from '../../../src/app/domain/sincronizacion/decidir-accion-sincronizacion';

describe('decidirAccionSincronizacion', () => {
  it('sube cuando el remoto no existe', () => {
    const accion = decidirAccionSincronizacion({
      cambiosLocalesPendientes: false,
      ultimaVersionSincronizada: null,
      lecturaRemota: { existe: false },
    });
    expect(accion).toEqual({ tipo: 'subir' });
  });

  it('propone conflicto con "conservar_remoto" por defecto en la primera sincronización con datos remotos (FR-035)', () => {
    const accion = decidirAccionSincronizacion({
      cambiosLocalesPendientes: false,
      ultimaVersionSincronizada: null,
      lecturaRemota: { existe: true, version: 'v-remota' },
    });
    expect(accion).toEqual({ tipo: 'conflicto', opcionPorDefecto: 'conservar_remoto' });
  });

  it('no hace nada cuando la versión remota coincide y no hay cambios locales', () => {
    const accion = decidirAccionSincronizacion({
      cambiosLocalesPendientes: false,
      ultimaVersionSincronizada: 'v-1',
      lecturaRemota: { existe: true, version: 'v-1' },
    });
    expect(accion).toEqual({ tipo: 'nada' });
  });

  it('sube cuando la versión remota coincide pero hay cambios locales pendientes', () => {
    const accion = decidirAccionSincronizacion({
      cambiosLocalesPendientes: true,
      ultimaVersionSincronizada: 'v-1',
      lecturaRemota: { existe: true, version: 'v-1' },
    });
    expect(accion).toEqual({ tipo: 'subir' });
  });

  it('descarga cuando la versión remota difiere y no hay cambios locales', () => {
    const accion = decidirAccionSincronizacion({
      cambiosLocalesPendientes: false,
      ultimaVersionSincronizada: 'v-1',
      lecturaRemota: { existe: true, version: 'v-2' },
    });
    expect(accion).toEqual({ tipo: 'descargar' });
  });

  it('propone conflicto con "conservar_local" por defecto cuando hay cambios en ambos lados', () => {
    const accion = decidirAccionSincronizacion({
      cambiosLocalesPendientes: true,
      ultimaVersionSincronizada: 'v-1',
      lecturaRemota: { existe: true, version: 'v-2' },
    });
    expect(accion).toEqual({ tipo: 'conflicto', opcionPorDefecto: 'conservar_local' });
  });
});
