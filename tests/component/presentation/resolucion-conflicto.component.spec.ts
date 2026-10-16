import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ResolucionConflictoComponent } from '../../../src/app/presentation/sincronizacion/conflicto/resolucion-conflicto.component';
import { ConflictoSincronizacionEstadoService } from '../../../src/app/presentation/sincronizacion/conflicto-sincronizacion-estado.service';
import { SincronizarGithubUseCase } from '../../../src/app/application/casos-uso/sincronizar-github.use-case';
import { MensajeFeedbackService } from '../../../src/app/presentation/compartido/ui/mensaje-feedback.service';
import type { ExportacionJSON } from '../../../src/app/application/ports/github-sync.port';

const DATOS_REMOTOS: ExportacionJSON = { version: 1, ejercicios: [], categorias: [], planificaciones: [], progresoDiario: [] };

describe('ResolucionConflictoComponent', () => {
  function configurar(
    conflicto: { opcionPorDefecto: 'conservar_local' | 'conservar_remoto'; datosRemotos: ExportacionJSON; sha: string } | null,
    resolverConflicto?: ReturnType<typeof vi.fn>
  ) {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideNoopAnimations(),
        { provide: SincronizarGithubUseCase, useValue: { resolverConflicto: resolverConflicto ?? vi.fn().mockResolvedValue(undefined) } },
        { provide: MensajeFeedbackService, useValue: { mostrarExito: vi.fn(), mostrarError: vi.fn() } },
      ],
    });
    const estado = TestBed.inject(ConflictoSincronizacionEstadoService);
    estado.conflictoActual.set(conflicto);
  }

  function crearComponente() {
    const fixture = TestBed.createComponent(ResolucionConflictoComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('preselecciona la opción por defecto indicada por el caso de uso (FR-035)', () => {
    configurar({ opcionPorDefecto: 'conservar_remoto', datosRemotos: DATOS_REMOTOS, sha: 'sha-1' });
    const fixture = crearComponente();

    expect(fixture.componentInstance.opcionSeleccionada()).toBe('conservar_remoto');
  });

  it('ofrece las opciones "conservar mis datos" y "usar los datos de GitHub"', () => {
    configurar({ opcionPorDefecto: 'conservar_local', datosRemotos: DATOS_REMOTOS, sha: 'sha-1' });
    const fixture = crearComponente();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto.toLowerCase()).toContain('mis datos');
    expect(texto.toLowerCase()).toContain('github');
  });

  it('al confirmar, llama a resolverConflicto con la opción elegida', async () => {
    const resolverConflicto = vi.fn().mockResolvedValue(undefined);
    configurar({ opcionPorDefecto: 'conservar_local', datosRemotos: DATOS_REMOTOS, sha: 'sha-1' }, resolverConflicto);
    const fixture = crearComponente();
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture.componentInstance.opcionSeleccionada.set('conservar_remoto');
    await fixture.componentInstance.confirmar();

    expect(resolverConflicto).toHaveBeenCalledWith('conservar_remoto', DATOS_REMOTOS, 'sha-1');
  });

  it('muestra un mensaje cuando no hay ningún conflicto pendiente', () => {
    configurar(null);
    const fixture = crearComponente();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto.toLowerCase()).toContain('no hay ningún conflicto');
  });
});
