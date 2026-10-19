import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../../src/app/app.routes';
import { AjustesRepositoryPort } from '../../../src/app/application/ports/ajustes-repository.port';
import { GitHubSyncPort } from '../../../src/app/application/ports/github-sync.port';
import { EjercicioRepositoryPort } from '../../../src/app/application/ports/ejercicio-repository.port';
import { CategoriaRepositoryPort } from '../../../src/app/application/ports/categoria-repository.port';
import { PlanificacionRepositoryPort } from '../../../src/app/application/ports/planificacion-repository.port';
import { ProgresoDiarioRepositoryPort } from '../../../src/app/application/ports/progreso-diario-repository.port';
import { ConflictoSincronizacionEstadoService } from '../../../src/app/presentation/sincronizacion/conflicto-sincronizacion-estado.service';
import type { ExportacionJSON } from '../../../src/app/application/ports/github-sync.port';

describe('Integración de rutas de sincronización (US5)', () => {
  function configurar() {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter(routes),
        provideNoopAnimations(),
        {
          provide: AjustesRepositoryPort,
          useValue: {
            obtener: vi.fn().mockResolvedValue({
              tokenGitHub: null,
              repositorioGitHub: null,
              ultimoShaSincronizado: null,
              cambiosLocalesPendientes: false,
              catalogoPredefinidoCargado: true,
            }),
            guardarCredencialesGitHub: vi.fn().mockResolvedValue(undefined),
            olvidarCredencialesGitHub: vi.fn().mockResolvedValue(undefined),
          },
        },
        { provide: GitHubSyncPort, useValue: {} },
        { provide: EjercicioRepositoryPort, useValue: { listarTodos: vi.fn().mockResolvedValue([]) } },
        { provide: CategoriaRepositoryPort, useValue: { listarTodas: vi.fn().mockResolvedValue([]) } },
        { provide: PlanificacionRepositoryPort, useValue: { listarTodas: vi.fn().mockResolvedValue([]) } },
        { provide: ProgresoDiarioRepositoryPort, useValue: { obtenerPorFecha: vi.fn().mockResolvedValue([]) } },
      ],
    });
  }

  it('navegar a la ruta de sincronización muestra la configuración', async () => {
    configurar();
    const harness = await RouterTestingHarness.create('/sincronizacion');
    await harness.fixture.whenStable();

    expect(harness.routeNativeElement?.querySelector('.configuracion-sincronizacion')).toBeTruthy();
    expect(harness.routeNativeElement?.querySelector('app-cabecera-pagina h1')?.textContent).toContain('Sincronización');
  });

  it('tras un conflicto se muestra la pantalla de resolución desde el mismo flujo', async () => {
    configurar();
    const datosRemotos: ExportacionJSON = { version: 1, ejercicios: [], categorias: [], planificaciones: [], progresoDiario: [] };
    const harness = await RouterTestingHarness.create('/sincronizacion');
    await harness.fixture.whenStable();

    const estado = TestBed.inject(ConflictoSincronizacionEstadoService);
    estado.conflictoActual.set({ opcionPorDefecto: 'conservar_local', datosRemotos, sha: 'sha-1' });
    await harness.navigateByUrl('/sincronizacion/conflicto');
    await harness.fixture.whenStable();

    expect(harness.routeNativeElement?.querySelector('.resolucion-conflicto')).toBeTruthy();
    expect(harness.routeNativeElement?.querySelector('app-cabecera-pagina h1')?.textContent).toContain('Conflicto de sincronización');
    expect(harness.routeNativeElement?.textContent?.toLowerCase()).toContain('mis datos');
  });
});
