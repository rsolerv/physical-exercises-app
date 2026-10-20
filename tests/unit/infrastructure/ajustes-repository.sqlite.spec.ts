import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { SqliteConexionService } from '../../../src/app/infrastructure/persistencia-sqlite/sqlite-conexion.service';
import { AjustesRepositorySqlite } from '../../../src/app/infrastructure/persistencia-sqlite/ajustes-repository.sqlite';
import { MotorSqlite, crearMotorSqliteEnMemoria } from '../../../src/app/infrastructure/persistencia-sqlite/motor-sqlite';

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
    expect(ajustes.ultimaSincronizacionCorrecta).toBeNull();
  });

  it('registra la fecha correcta como ISO UTC y conserva el valor nulo inicial', async () => {
    const fecha = new Date('2026-10-20T12:34:56.000Z');

    await repositorio.registrarSincronizacionCorrecta(fecha);

    expect((await repositorio.obtener()).ultimaSincronizacionCorrecta).toEqual(fecha);
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

  it('migra una instalación anterior conservando sus ajustes', async () => {
    await conexion.cerrar();
    const motor: MotorSqlite = await crearMotorSqliteEnMemoria();
    await motor.ejecutarSinResultado(
      'CREATE TABLE ajustes_aplicacion (id INTEGER PRIMARY KEY, token_github TEXT, repositorio_github TEXT, ' +
        'ultimo_sha_sincronizado TEXT, cambios_locales_pendientes INTEGER NOT NULL DEFAULT 0, ' +
        'catalogo_predefinido_cargado INTEGER NOT NULL DEFAULT 0)'
    );
    await motor.ejecutarSinResultado(
      'INSERT INTO ajustes_aplicacion (id, token_github, repositorio_github, ultimo_sha_sincronizado, cambios_locales_pendientes, catalogo_predefinido_cargado) ' +
        'VALUES (1, ?, ?, ?, ?, ?)',
      ['token-existente', 'owner/datos', 'sha-existente', 1, 1]
    );
    await motor.aplicarEsquema();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [{ provide: SqliteConexionService, useValue: motor }] });

    const ajustesMigrados = await TestBed.inject(AjustesRepositorySqlite).obtener();

    expect(ajustesMigrados).toMatchObject({
      tokenGitHub: 'token-existente',
      repositorioGitHub: 'owner/datos',
      ultimoShaSincronizado: 'sha-existente',
      cambiosLocalesPendientes: true,
      catalogoPredefinidoCargado: true,
      ultimaSincronizacionCorrecta: null,
    });
    await motor.cerrar();
  });
});
