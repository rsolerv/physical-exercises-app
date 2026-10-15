import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { SqliteConexionService } from '../../../src/app/infrastructure/persistencia-sqlite/sqlite-conexion.service';
import { AjustesRepositorySqlite } from '../../../src/app/infrastructure/persistencia-sqlite/ajustes-repository.sqlite';

describe('AjustesRepositorySqlite', () => {
  let conexion: SqliteConexionService;
  let repositorio: AjustesRepositorySqlite;

  beforeEach(async () => {
    conexion = new SqliteConexionService();
    await conexion.inicializar({ forzarEnMemoria: true });
    TestBed.configureTestingModule({
      providers: [{ provide: SqliteConexionService, useValue: conexion }],
    });
    repositorio = TestBed.inject(AjustesRepositorySqlite);
  });

  it('por defecto, cambiosLocalesPendientes y catalogoPredefinidoCargado son false', async () => {
    const ajustes = await repositorio.obtener();
    expect(ajustes.cambiosLocalesPendientes).toBe(false);
    expect(ajustes.catalogoPredefinidoCargado).toBe(false);
    expect(ajustes.tokenGitHub).toBeNull();
    expect(ajustes.repositorioGitHub).toBeNull();
    expect(ajustes.ultimoShaSincronizado).toBeNull();
  });

  it('guarda y olvida las credenciales de GitHub (FR-037)', async () => {
    await repositorio.guardarCredencialesGitHub('ghp_token123', 'owner/data-physical-exercises');
    let ajustes = await repositorio.obtener();
    expect(ajustes.tokenGitHub).toBe('ghp_token123');
    expect(ajustes.repositorioGitHub).toBe('owner/data-physical-exercises');

    await repositorio.olvidarCredencialesGitHub();
    ajustes = await repositorio.obtener();
    expect(ajustes.tokenGitHub).toBeNull();
    expect(ajustes.repositorioGitHub).toBeNull();
  });

  it('actualiza el último SHA sincronizado', async () => {
    await repositorio.actualizarUltimoShaSincronizado('abc123');
    const ajustes = await repositorio.obtener();
    expect(ajustes.ultimoShaSincronizado).toBe('abc123');
  });

  it('marca y desmarca cambiosLocalesPendientes', async () => {
    await repositorio.marcarCambiosLocalesPendientes(true);
    expect((await repositorio.obtener()).cambiosLocalesPendientes).toBe(true);

    await repositorio.marcarCambiosLocalesPendientes(false);
    expect((await repositorio.obtener()).cambiosLocalesPendientes).toBe(false);
  });

  it('estaCatalogoPredefinidoCargado() y marcarCatalogoPredefinidoCargado()', async () => {
    expect(await repositorio.estaCatalogoPredefinidoCargado()).toBe(false);
    await repositorio.marcarCatalogoPredefinidoCargado();
    expect(await repositorio.estaCatalogoPredefinidoCargado()).toBe(true);
  });
});
