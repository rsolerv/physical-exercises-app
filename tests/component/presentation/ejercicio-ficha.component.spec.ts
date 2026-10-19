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
import { MensajeFeedbackService } from '../../../src/app/presentation/compartido/ui/mensaje-feedback.service';

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
  function configurar(opciones: {
    ejercicio: Ejercicio | null;
    eliminar?: ReturnType<typeof vi.fn>;
    mostrarExito?: ReturnType<typeof vi.fn>;
    mostrarError?: ReturnType<typeof vi.fn>;
  }) {
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
        {
          provide: MensajeFeedbackService,
          useValue: {
            mostrarExito: opciones.mostrarExito ?? vi.fn(),
            mostrarError: opciones.mostrarError ?? vi.fn(),
          },
        },
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

  it('indica que una imagen no se ha podido cargar y conserva el resto de la ficha', async () => {
    configurar({
      ejercicio: ejercicio({
        imagenes: [{ id: 'img-1', tipo: 'url', valorUrl: 'https://example.com/no-disponible.jpg' }],
      }),
    });
    const fixture = await crearComponente();

    const imagen = (fixture.nativeElement as HTMLElement).querySelector<HTMLImageElement>('img');
    expect(imagen).toBeTruthy();
    imagen?.dispatchEvent(new Event('error'));
    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('No se ha podido cargar esta imagen.');
    expect(texto).toContain('Sentadilla');
    expect(texto).toContain('Flexionar las rodillas.');
  });

  it('elimina el ejercicio y vuelve a Buscar', async () => {
    const eliminar = vi.fn().mockResolvedValue(undefined);
    const mostrarExito = vi.fn();
    configurar({ ejercicio: ejercicio(), eliminar, mostrarExito });
    const fixture = await crearComponente();
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    await fixture.componentInstance.eliminar();

    expect(eliminar).toHaveBeenCalledWith('ej-1');
    expect(mostrarExito).toHaveBeenCalledWith('Ejercicio eliminado.');
    expect(navigateSpy).toHaveBeenCalledWith(['/buscar']);
  });

  it('muestra un error contextual y no navega si falla la eliminación', async () => {
    const eliminar = vi.fn().mockRejectedValue(new Error('No se ha podido eliminar el ejercicio.'));
    const mostrarError = vi.fn();
    configurar({ ejercicio: ejercicio(), eliminar, mostrarError });
    const fixture = await crearComponente();
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    await fixture.componentInstance.eliminar();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('No se ha podido eliminar el ejercicio.');
    expect(mostrarError).toHaveBeenCalledWith('No se ha podido eliminar el ejercicio.');
    expect(navigateSpy).not.toHaveBeenCalled();
  });
});
