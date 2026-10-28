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

  it('por defecto, no hay método activo ni cambios locales pendientes', async () => {
    expect(await repositorio.obtener()).toMatchObject({
      cambiosLocalesPendientes: false,
      catalogoPredefinidoCargado: false,
      tokenGitHub: null,
      repositorioGitHub: null,
      ultimaVersionSincronizada: null,
      ultimaSincronizacionCorrecta: null,
      metodoSincronizacion: null,
      cuentaGoogle: null,
    });
  });

  it('conserva a la vez GitHub y Google y permite activar cada método', async () => {
    await repositorio.guardarCredencialesGitHub('ghp_token', 'owner/datos');
    await repositorio.conectarGoogle('Persona@example.com');

    expect(await repositorio.obtener()).toMatchObject({
      tokenGitHub: 'ghp_token',
      repositorioGitHub: 'owner/datos',
      metodoSincronizacion: 'google',
      cuentaGoogle: 'Persona@example.com',
    });

    await repositorio.activarMetodo('github');
    expect((await repositorio.obtener()).metodoSincronizacion).toBe('github');
    await repositorio.activarMetodo('google');
    expect((await repositorio.obtener()).metodoSincronizacion).toBe('google');
  });

  it('solo activa GitHub al guardar credenciales por primera vez o al faltar método activo', async () => {
    await repositorio.guardarCredencialesGitHub('token-1', 'owner/datos');
    await repositorio.conectarGoogle('persona@example.com');
    await repositorio.guardarCredencialesGitHub('token-2', 'owner/datos-2');
    expect((await repositorio.obtener()).metodoSincronizacion).toBe('google');

    await repositorio.olvidarCredencialesGitHub();
    await repositorio.guardarCredencialesGitHub('token-3', 'owner/datos-3');
    expect((await repositorio.obtener()).metodoSincronizacion).toBe('github');
    expect((await repositorio.obtener()).cuentaGoogle).toBe('persona@example.com');
  });

  it('no activa un método sin conexión', async () => {
    await expect(repositorio.activarMetodo('google')).rejects.toThrow(ErrorValidacion);
    await expect(repositorio.activarMetodo('github')).rejects.toThrow(ErrorValidacion);
  });

  it('al olvidar o desconectar solo borra las credenciales de su método', async () => {
    await repositorio.guardarCredencialesGitHub('token', 'owner/datos');
    await repositorio.conectarGoogle('persona@example.com');
    await repositorio.olvidarCredencialesGitHub();
    expect(await repositorio.obtener()).toMatchObject({
      tokenGitHub: null,
      repositorioGitHub: null,
      metodoSincronizacion: 'google',
      cuentaGoogle: 'persona@example.com',
    });

    await repositorio.desconectarGoogle();
    expect(await repositorio.obtener()).toMatchObject({
      metodoSincronizacion: null,
      cuentaGoogle: null,
    });
  });

  it('conserva el estado por destino al desconectar y lo deriva del método activo', async () => {
    const fechaGitHub = new Date('2026-10-20T12:34:56.000Z');
    const fechaGoogle = new Date('2026-10-21T12:34:56.000Z');
    await repositorio.guardarCredencialesGitHub('token', 'owner/datos');
    await repositorio.registrarSincronizacionCompletada('github:owner/datos', 'sha-1', fechaGitHub, false);
    await repositorio.conectarGoogle('persona@example.com');
    await repositorio.registrarSincronizacionCompletada('google:persona@example.com', 'v-2', fechaGoogle, false);

    expect(await repositorio.obtener()).toMatchObject({
      ultimaVersionSincronizada: 'v-2',
      cambiosLocalesPendientes: false,
      ultimaSincronizacionCorrecta: fechaGoogle,
    });
    await repositorio.activarMetodo('github');
    expect(await repositorio.obtener()).toMatchObject({
      ultimaVersionSincronizada: 'sha-1',
      cambiosLocalesPendientes: false,
      ultimaSincronizacionCorrecta: fechaGitHub,
    });

    await repositorio.desconectarGoogle();
    await repositorio.activarMetodo('github');
    expect(await repositorio.obtener()).toMatchObject({
      ultimaVersionSincronizada: 'sha-1',
      ultimaSincronizacionCorrecta: fechaGitHub,
    });
  });

  it('marca pendientes los otros destinos solo cuando la sincronización cambia datos locales', async () => {
    await repositorio.guardarCredencialesGitHub('token', 'owner/datos');
    await repositorio.registrarSincronizacionCompletada(
      'github:owner/datos',
      'sha-1',
      new Date('2026-10-20T12:34:56.000Z'),
      false,
    );
    await repositorio.conectarGoogle('persona@example.com');
    await repositorio.registrarSincronizacionCompletada(
      'google:persona@example.com',
      'v-1',
      new Date('2026-10-21T12:34:56.000Z'),
      true,
    );

    await repositorio.activarMetodo('github');
    expect((await repositorio.obtener()).cambiosLocalesPendientes).toBe(true);

    await repositorio.marcarCambiosLocalesPendientes();
    expect((await conexion.ejecutar<{ cambios_locales_pendientes: number }>(
      'SELECT cambios_locales_pendientes FROM sincronizacion_destino ORDER BY destino',
    )).map((fila) => fila.cambios_locales_pendientes)).toEqual([1, 1]);
  });

  it('conserva los cambios pendientes por destino al alternar Google y GitHub', async () => {
    const fecha = new Date('2026-10-22T12:34:56.000Z');
    await repositorio.guardarCredencialesGitHub('token', 'owner/datos');
    await repositorio.registrarSincronizacionCompletada('github:owner/datos', 'sha-github', fecha, false);
    await repositorio.marcarCambiosLocalesPendientes();
    await repositorio.conectarGoogle('persona@example.com');

    expect(await repositorio.obtener()).toMatchObject({
      metodoSincronizacion: 'google',
      ultimaVersionSincronizada: null,
      cambiosLocalesPendientes: false,
    });
    await repositorio.registrarSincronizacionCompletada('google:persona@example.com', 'v-google', fecha, false);
    await repositorio.activarMetodo('github');

    expect(await repositorio.obtener()).toMatchObject({
      metodoSincronizacion: 'github',
      ultimaVersionSincronizada: 'sha-github',
      cambiosLocalesPendientes: true,
    });
  });

  it('conserva los datos de las filas antiguas al migrar y migra la sincronización a su destino', async () => {
    await conexion.cerrar();
    const motor: MotorSqlite = await crearMotorSqliteEnMemoria();
    await motor.ejecutarSinResultado(
      'CREATE TABLE ajustes_aplicacion (id INTEGER PRIMARY KEY, token_github TEXT, repositorio_github TEXT, ' +
        'ultimo_sha_sincronizado TEXT, ultima_sincronizacion_correcta TEXT, cambios_locales_pendientes INTEGER NOT NULL DEFAULT 0, ' +
        'catalogo_predefinido_cargado INTEGER NOT NULL DEFAULT 0, destino_ultima_sincronizacion TEXT)',
    );
    await motor.ejecutarSinResultado(
      'INSERT INTO ajustes_aplicacion (id, token_github, repositorio_github, ultimo_sha_sincronizado, ' +
        'ultima_sincronizacion_correcta, cambios_locales_pendientes, catalogo_predefinido_cargado, destino_ultima_sincronizacion) ' +
        'VALUES (1, ?, ?, ?, ?, ?, ?, ?)',
      ['token-existente', 'owner/datos', 'sha-existente', null, 1, 1, 'github'],
    );
    await motor.aplicarEsquema();
    await motor.aplicarEsquema();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [{ provide: SqliteConexionService, useValue: motor }] });

    const ajustesMigrados = await TestBed.inject(AjustesRepositorySqlite).obtener();
    const destinos = await motor.ejecutar<{ destino: string; ultima_version: string; cambios_locales_pendientes: number }>(
      'SELECT destino, ultima_version, cambios_locales_pendientes FROM sincronizacion_destino',
    );

    expect(ajustesMigrados).toMatchObject({
      tokenGitHub: 'token-existente',
      repositorioGitHub: 'owner/datos',
      metodoSincronizacion: 'github',
      cambiosLocalesPendientes: true,
      catalogoPredefinidoCargado: true,
      ultimaVersionSincronizada: 'sha-existente',
    });
    expect(destinos).toMatchObject([
      { destino: 'github:owner/datos', ultima_version: 'sha-existente', cambios_locales_pendientes: 1 },
    ]);
    expect(await motor.ejecutar<{ name: string }>('PRAGMA table_info(ajustes_aplicacion)')).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'ultimo_sha_sincronizado' })]),
    );
    await motor.cerrar();
  });

  it('rechaza un método de sincronización persistido desconocido', async () => {
    await conexion.ejecutarSinResultado("UPDATE ajustes_aplicacion SET metodo_sincronizacion = 'otro' WHERE id = 1");
    await expect(repositorio.obtener()).rejects.toThrow(ErrorValidacion);
  });

  it('marca todos los destinos pendientes tras un cambio local', async () => {
    await repositorio.registrarSincronizacionCompletada(
      'github:owner/datos',
      'sha-1',
      new Date('2026-10-20T12:34:56.000Z'),
      false,
    );
    await repositorio.registrarSincronizacionCompletada(
      'google:persona@example.com',
      'v-1',
      new Date('2026-10-21T12:34:56.000Z'),
      false,
    );

    await repositorio.marcarCambiosLocalesPendientes();

    const filas = await conexion.ejecutar<{ cambios_locales_pendientes: number }>(
      'SELECT cambios_locales_pendientes FROM sincronizacion_destino ORDER BY destino',
    );
    expect(filas.map((fila) => fila.cambios_locales_pendientes)).toEqual([1, 1]);
  });

  it('estaCatalogoPredefinidoCargado() y marcarCatalogoPredefinidoCargado()', async () => {
    expect(await repositorio.estaCatalogoPredefinidoCargado()).toBe(false);
    await repositorio.marcarCatalogoPredefinidoCargado();
    expect(await repositorio.estaCatalogoPredefinidoCargado()).toBe(true);
  });
});
