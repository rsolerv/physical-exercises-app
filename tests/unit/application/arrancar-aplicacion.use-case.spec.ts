import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ArrancarAplicacionUseCase } from '../../../src/app/application/casos-uso/arrancar-aplicacion.use-case';
import { SqliteConexionService } from '../../../src/app/infrastructure/persistencia-sqlite/sqlite-conexion.service';
import { AjustesRepositoryPort } from '../../../src/app/application/ports/ajustes-repository.port';
import { SembrarCatalogoPredefinidoPort } from '../../../src/app/application/ports/sembrar-catalogo-predefinido.port';

function crearAjustesRepoSimulado(catalogoCargado: boolean): AjustesRepositoryPort {
  return {
    obtener: vi.fn(),
    guardarCredencialesGitHub: vi.fn(),
    olvidarCredencialesGitHub: vi.fn(),
    conectarGoogle: vi.fn(),
    desconectarGoogle: vi.fn(),
    activarMetodo: vi.fn(),
    registrarSincronizacionCompletada: vi.fn(),
    marcarCambiosLocalesPendientes: vi.fn(),
    estaCatalogoPredefinidoCargado: vi.fn().mockResolvedValue(catalogoCargado),
    marcarCatalogoPredefinidoCargado: vi.fn(),
  };
}

function crearCaso(opfsDisponible: boolean, catalogoCargado: boolean, sembrador: SembrarCatalogoPredefinidoPort) {
  const conexion = { inicializar: vi.fn().mockResolvedValue({ opfsDisponible }) } as unknown as SqliteConexionService;
  const ajustesRepo = crearAjustesRepoSimulado(catalogoCargado);

  TestBed.configureTestingModule({
    providers: [
      { provide: SqliteConexionService, useValue: conexion },
      { provide: AjustesRepositoryPort, useValue: ajustesRepo },
      { provide: SembrarCatalogoPredefinidoPort, useValue: sembrador },
    ],
  });

  return { caso: TestBed.inject(ArrancarAplicacionUseCase), conexion, ajustesRepo };
}

describe('ArrancarAplicacionUseCase', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('carga la información almacenada al abrir la aplicación (FR-001)', async () => {
    const sembrador: SembrarCatalogoPredefinidoPort = { sembrarSiNecesario: vi.fn() };
    const { caso, conexion } = crearCaso(true, true, sembrador);

    const resultado = await caso.ejecutar();

    expect(conexion.inicializar).toHaveBeenCalledOnce();
    expect(resultado.opfsDisponible).toBe(true);
  });

  it('invoca la siembra del catálogo solo si estaCatalogoPredefinidoCargado() es false', async () => {
    const sembrador: SembrarCatalogoPredefinidoPort = { sembrarSiNecesario: vi.fn() };
    const { caso } = crearCaso(true, false, sembrador);

    await caso.ejecutar();

    expect(sembrador.sembrarSiNecesario).toHaveBeenCalledOnce();
  });

  it('no invoca la siembra si el catálogo ya estaba cargado', async () => {
    const sembrador: SembrarCatalogoPredefinidoPort = { sembrarSiNecesario: vi.fn() };
    const { caso } = crearCaso(true, true, sembrador);

    await caso.ejecutar();

    expect(sembrador.sembrarSiNecesario).not.toHaveBeenCalled();
  });

  it('expone un aviso (opfsDisponible = false) si el navegador no tiene OPFS', async () => {
    const sembrador: SembrarCatalogoPredefinidoPort = { sembrarSiNecesario: vi.fn() };
    const { caso } = crearCaso(false, true, sembrador);

    const resultado = await caso.ejecutar();

    expect(resultado.opfsDisponible).toBe(false);
  });
});
