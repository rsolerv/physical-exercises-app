import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { SqliteConexionService } from '../../../src/app/infrastructure/persistencia-sqlite/sqlite-conexion.service';
import { AjustesRepositorySqlite } from '../../../src/app/infrastructure/persistencia-sqlite/ajustes-repository.sqlite';
import { MotorSqlite, crearMotorSqliteEnMemoria } from '../../../src/app/infrastructure/persistencia-sqlite/motor-sqlite';
import { ErrorValidacion } from '../../../src/app/domain/errores/errores-dominio';

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
    expect(ajustes.ultimaVersionSincronizada).toBeNull();
    expect(ajustes.ultimaSincronizacionCorrecta).toBeNull();
    expect(ajustes.metodoSincronizacion).toBeNull();
    expect(ajustes.cuentaGoogle).toBeNull();
    expect(ajustes.destinoUltimaSincronizacion).toBeNull();
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
    expect(ajustes.metodoSincronizacion).toBe('github');

    await repositorio.olvidarCredencialesGitHub();
    ajustes = await repositorio.obtener();
    expect(ajustes.tokenGitHub).toBeNull();
    expect(ajustes.repositorioGitHub).toBeNull();
    expect(ajustes.metodoSincronizacion).toBeNull();
  });

  it('actualiza la última versión sincronizada en la columna existente', async () => {
    await repositorio.actualizarUltimaVersionSincronizada('version-1');
    const ajustes = await repositorio.obtener();
    expect(ajustes.ultimaVersionSincronizada).toBe('version-1');
  });

  it('conecta Google y no permite activar dos métodos a la vez', async () => {
    await repositorio.conectarGoogle('persona@example.com');
    expect(await repositorio.obtener()).toMatchObject({
      metodoSincronizacion: 'google',
      cuentaGoogle: 'persona@example.com',
    });

    await expect(repositorio.guardarCredencialesGitHub('token', 'owner/datos')).rejects.toThrow(ErrorValidacion);
  });

  it('no permite conectar Google mientras GitHub está activo', async () => {
    await repositorio.guardarCredencialesGitHub('token', 'owner/datos');
    await expect(repositorio.conectarGoogle('persona@example.com')).rejects.toThrow(ErrorValidacion);
  });

  it('olvidar las credenciales de GitHub no desconecta una cuenta de Google activa', async () => {
    await repositorio.conectarGoogle('persona@example.com');

    await repositorio.olvidarCredencialesGitHub();

    expect(await repositorio.obtener()).toMatchObject({
      metodoSincronizacion: 'google',
      cuentaGoogle: 'persona@example.com',
    });
  });

  it('desconectar Google conserva la versión y el destino sincronizados', async () => {
    await repositorio.conectarGoogle('persona@example.com');
    await repositorio.actualizarUltimaVersionSincronizada('v-1');
    await repositorio.registrarDestinoSincronizado('google:persona@example.com');

    await repositorio.desconectarGoogle();

    expect(await repositorio.obtener()).toMatchObject({
      metodoSincronizacion: null,
      cuentaGoogle: null,
      ultimaVersionSincronizada: 'v-1',
      destinoUltimaSincronizacion: 'google:persona@example.com',
    });
  });

  it('rechaza un método de sincronización persistido desconocido', async () => {
    await conexion.ejecutarSinResultado("UPDATE ajustes_aplicacion SET metodo_sincronizacion = 'otro' WHERE id = 1");
    await expect(repositorio.obtener()).rejects.toThrow(ErrorValidacion);
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
      ultimaVersionSincronizada: 'sha-existente',
      metodoSincronizacion: 'github',
      destinoUltimaSincronizacion: 'github',
      cambiosLocalesPendientes: true,
      catalogoPredefinidoCargado: true,
      ultimaSincronizacionCorrecta: null,
    });
    await motor.cerrar();
  });
});
