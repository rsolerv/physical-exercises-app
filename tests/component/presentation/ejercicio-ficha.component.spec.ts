import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, ActivatedRoute, Router } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { EjercicioFichaComponent } from '../../../src/app/presentation/biblioteca-ejercicios/ejercicio-ficha.component';
import { EjercicioRepositoryPort } from '../../../src/app/application/ports/ejercicio-repository.port';
import { CategoriaRepositoryPort } from '../../../src/app/application/ports/categoria-repository.port';
import { GestionarEjercicioUseCase } from '../../../src/app/application/casos-uso/gestionar-ejercicio.use-case';
import type { Ejercicio } from '../../../src/app/domain/ejercicio/ejercicio.entity';

function ejercicio(sobrescribir: Partial<Ejercicio> = {}): Ejercicio {
  return {
    id: 'ej-1',
    nombre: 'Sentadilla',
    descripcion: 'Flexionar las rodillas.',
    categoriaIds: ['cat-1'],
    enlaces: [],
    imagenes: [],
    ...sobrescribir,
  };
}

describe('EjercicioFichaComponent', () => {
  function configurar(opciones: { ejercicio: Ejercicio | null; eliminar?: ReturnType<typeof vi.fn> }) {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideNoopAnimations(),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => 'ej-1' } } },
        },
        {
          provide: EjercicioRepositoryPort,
          useValue: { obtenerPorId: vi.fn().mockResolvedValue(opciones.ejercicio) },
        },
        {
          provide: CategoriaRepositoryPort,
          useValue: { listarTodas: vi.fn().mockResolvedValue([{ id: 'cat-1', nombre: 'Piernas', esGenerica: false }]) },
        },
        { provide: GestionarEjercicioUseCase, useValue: { eliminar: opciones.eliminar ?? vi.fn().mockResolvedValue(undefined) } },
      ],
    });
  }

  async function crearComponente() {
    const fixture = TestBed.createComponent(EjercicioFichaComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('muestra los datos del ejercicio', async () => {
    configurar({ ejercicio: ejercicio() });
    const fixture = await crearComponente();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Sentadilla');
    expect(texto).toContain('Flexionar las rodillas.');
    expect(texto).toContain('Piernas');
  });

  it('muestra el reproductor embebido para cada enlace de YouTube (FR-015)', async () => {
    configurar({ ejercicio: ejercicio({ enlaces: [{ tipo: 'youtube', url: 'https://youtu.be/abc123' }] }) });
    const fixture = await crearComponente();

    expect((fixture.nativeElement as HTMLElement).querySelector('app-youtube-embed')).toBeTruthy();
  });

  it('muestra la previsualización embebida para cada enlace web (FR-016)', async () => {
    configurar({ ejercicio: ejercicio({ enlaces: [{ tipo: 'web', url: 'https://example.com/rutina' }] }) });
    const fixture = await crearComponente();

    expect((fixture.nativeElement as HTMLElement).querySelector('app-enlace-embed')).toBeTruthy();
  });

  it('muestra un mensaje cuando el ejercicio no existe', async () => {
    configurar({ ejercicio: null });
    const fixture = await crearComponente();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('no se ha encontrado');
  });

  it('elimina el ejercicio y navega al listado', async () => {
    const eliminar = vi.fn().mockResolvedValue(undefined);
    configurar({ ejercicio: ejercicio(), eliminar });
    const fixture = await crearComponente();
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    await fixture.componentInstance.eliminar();

    expect(eliminar).toHaveBeenCalledWith('ej-1');
    expect(navigateSpy).toHaveBeenCalledWith(['/ejercicios']);
  });
});
