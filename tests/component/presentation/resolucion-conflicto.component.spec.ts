import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ResolucionConflictoComponent } from '../../../src/app/presentation/sincronizacion/conflicto/resolucion-conflicto.component';
import { ConflictoSincronizacionEstadoService } from '../../../src/app/presentation/sincronizacion/conflicto-sincronizacion-estado.service';
import { SincronizarUseCase } from '../../../src/app/application/casos-uso/sincronizar.use-case';
import { MensajeFeedbackService } from '../../../src/app/presentation/compartido/ui/mensaje-feedback.service';
import { AjustesRepositoryPort } from '../../../src/app/application/ports/ajustes-repository.port';
import type { ExportacionJSON } from '../../../src/app/application/ports/github-sync.port';

const DATOS_REMOTOS: ExportacionJSON = { version: 1, ejercicios: [], categorias: [], planificaciones: [], progresoDiario: [] };

describe('ResolucionConflictoComponent', () => {
  let mostrarError: ReturnType<typeof vi.fn>;

  function configurar(
    conflicto: { opcionPorDefecto: 'conservar_local' | 'conservar_remoto'; datosRemotos: ExportacionJSON; version: string } | null,
    resolverConflicto?: ReturnType<typeof vi.fn>,
    metodoSincronizacion: 'github' | 'google' | null = 'github'
  ) {
    mostrarError = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideNoopAnimations(),
        { provide: SincronizarUseCase, useValue: { resolverConflicto: resolverConflicto ?? vi.fn().mockResolvedValue(undefined) } },
        { provide: AjustesRepositoryPort, useValue: { obtener: vi.fn().mockResolvedValue({ metodoSincronizacion }) } },
        { provide: MensajeFeedbackService, useValue: { mostrarExito: vi.fn(), mostrarError } },
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
    configurar({ opcionPorDefecto: 'conservar_remoto', datosRemotos: DATOS_REMOTOS, version: 'sha-1' });
    const fixture = crearComponente();

    expect(fixture.componentInstance.opcionSeleccionada()).toBe('conservar_remoto');
  });

  it('ofrece las opciones "conservar mis datos" y "usar los datos de GitHub"', () => {
    configurar({ opcionPorDefecto: 'conservar_local', datosRemotos: DATOS_REMOTOS, version: 'sha-1' });
    const fixture = crearComponente();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto.toLowerCase()).toContain('mis datos');
    expect(texto.toLowerCase()).toContain('github');
  });

  it('muestra "Usar los datos de Google" cuando Google es el método activo', async () => {
    configurar({ opcionPorDefecto: 'conservar_remoto', datosRemotos: DATOS_REMOTOS, version: 'v1' }, undefined, 'google');
    const fixture = crearComponente();
    await fixture.whenStable();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Usar los datos de Google');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('en Google');
  });

  it('al confirmar, llama a resolverConflicto con la opción elegida', async () => {
    const resolverConflicto = vi.fn().mockResolvedValue(undefined);
    configurar({ opcionPorDefecto: 'conservar_local', datosRemotos: DATOS_REMOTOS, version: 'sha-1' }, resolverConflicto);
    const fixture = crearComponente();
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture.componentInstance.opcionSeleccionada.set('conservar_remoto');
    await fixture.componentInstance.confirmar();

    expect(resolverConflicto).toHaveBeenCalledWith('conservar_remoto', DATOS_REMOTOS, 'sha-1');
  });

  it('bloquea una segunda confirmación mientras resuelve y comunica el error', async () => {
    let fallar: (error: Error) => void = () => undefined;
    const resolverConflicto = vi.fn().mockImplementation(
      () =>
        new Promise<void>((_, reject) => {
          fallar = reject;
        })
    );
    configurar({ opcionPorDefecto: 'conservar_local', datosRemotos: DATOS_REMOTOS, version: 'sha-1' }, resolverConflicto);
    const fixture = crearComponente();

    const peticion = fixture.componentInstance.confirmar();
    fixture.detectChanges();
    const boton = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('button');
    expect(boton?.disabled).toBe(true);
    expect(boton?.textContent).toContain('Resolviendo');
    fallar(new Error('No se pudo subir la copia.'));
    await peticion;

    expect(resolverConflicto).toHaveBeenCalledOnce();
    expect(mostrarError).toHaveBeenCalledWith('No se pudo subir la copia.');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('[role="alert"]')?.textContent).toContain('No se pudo subir');
  });

  it('muestra un mensaje cuando no hay ningún conflicto pendiente', () => {
    configurar(null);
    const fixture = crearComponente();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto.toLowerCase()).toContain('no hay ningún conflicto');
  });
});
