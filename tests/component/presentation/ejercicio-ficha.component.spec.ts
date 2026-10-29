import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Location } from '@angular/common';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, ActivatedRoute, Router } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { EjercicioFichaComponent } from '../../../src/app/presentation/biblioteca-ejercicios/ejercicio-ficha.component';
import { EjercicioRepositoryPort } from '../../../src/app/application/ports/ejercicio-repository.port';
import { CategoriaRepositoryPort } from '../../../src/app/application/ports/categoria-repository.port';
import { GestionarEjercicioUseCase } from '../../../src/app/application/casos-uso/gestionar-ejercicio.use-case';
import { ConsultarPlanificacionUseCase } from '../../../src/app/application/casos-uso/consultar-planificacion.use-case';
import { GestionarProgresoDiarioUseCase } from '../../../src/app/application/casos-uso/gestionar-progreso-diario.use-case';
import { SubirEjercicioComunUseCase } from '../../../src/app/application/casos-uso/subir-ejercicio-comun.use-case';
import { ProgresoDiarioRepositoryPort } from '../../../src/app/application/ports/progreso-diario-repository.port';
import { crearDiasVacios } from '../../../src/app/domain/planificacion/planificacion.entity';
import { diaSemanaDeFecha } from '../../../src/app/domain/planificacion/fecha-semana';
import type { Planificacion } from '../../../src/app/domain/planificacion/planificacion.entity';
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
    subidoRepositorioComun: false,
    ...sobrescribir,
  };
}

describe('EjercicioFichaComponent', () => {
  function configurar(opciones: {
    ejercicio: Ejercicio | null;
    eliminar?: ReturnType<typeof vi.fn>;
    mostrarExito?: ReturnType<typeof vi.fn>;
    mostrarExitoConAccion?: ReturnType<typeof vi.fn>;
    mostrarError?: ReturnType<typeof vi.fn>;
    planificacion?: Planificacion | null;
    registrosProgreso?: { fecha: string; ejercicioId: string; realizado: boolean }[];
    marcarProgreso?: ReturnType<typeof vi.fn>;
    restaurarProgreso?: ReturnType<typeof vi.fn>;
    puedeOfrecerSubida?: ReturnType<typeof vi.fn>;
    dialogOpen?: ReturnType<typeof vi.fn>;
  }) {
    const dias = crearDiasVacios();
    dias.find((dia) => dia.diaSemana === diaSemanaDeFecha(new Date()))!.ejercicioIds = ['ej-1'];
    const planificacion =
      opciones.planificacion === undefined
        ? ({ id: 'plan-1', nombre: 'Semana', fechaInicio: '2020-01-06', dias } satisfies Planificacion)
        : opciones.planificacion;
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
          useValue: { listarTodas: vi.fn().mockResolvedValue([{ id: 'cat-1', nombre: 'Piernas' }]) },
        },
        {
          provide: ConsultarPlanificacionUseCase,
          useValue: { obtenerDeHoy: vi.fn().mockResolvedValue(planificacion) },
        },
        {
          provide: ProgresoDiarioRepositoryPort,
          useValue: { obtenerPorFecha: vi.fn().mockResolvedValue(opciones.registrosProgreso ?? []) },
        },
        {
          provide: GestionarProgresoDiarioUseCase,
          useValue: {
            marcar: opciones.marcarProgreso ?? vi.fn().mockResolvedValue({ realizadoAnterior: false }),
            restaurarCambio: opciones.restaurarProgreso ?? vi.fn().mockResolvedValue(undefined),
          },
        },
        { provide: GestionarEjercicioUseCase, useValue: { eliminar: opciones.eliminar ?? vi.fn().mockResolvedValue(undefined) } },
        {
          provide: SubirEjercicioComunUseCase,
          useValue: { puedeOfrecerSubida: opciones.puedeOfrecerSubida ?? vi.fn().mockResolvedValue(true) },
        },
        {
          provide: MensajeFeedbackService,
          useValue: {
            mostrarExito: opciones.mostrarExito ?? vi.fn(),
            mostrarExitoConAccion: opciones.mostrarExitoConAccion ?? vi.fn(),
            mostrarError: opciones.mostrarError ?? vi.fn(),
          },
        },
        ...(opciones.dialogOpen ? [{ provide: MatDialog, useValue: { open: opciones.dialogOpen } }] : []),
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

  it.each(['/inicio', '/planificacion', '/buscar'])('vuelve a la pantalla de origen: %s', async (returnUrl) => {
    configurar({ ejercicio: ejercicio() });
    const location = TestBed.inject(Location);
    vi.spyOn(location, 'getState').mockReturnValue({ returnUrl });
    const router = TestBed.inject(Router);
    const navigateByUrlSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    const fixture = await crearComponente();

    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.ejercicio-ficha__volver')?.click();
    await fixture.whenStable();

    expect(navigateByUrlSpy).toHaveBeenCalledWith(returnUrl);
  });

  it('vuelve a Buscar si la ficha se abre sin una pantalla de origen', async () => {
    configurar({ ejercicio: ejercicio() });
    vi.spyOn(TestBed.inject(Location), 'getState').mockReturnValue({});
    const navigateByUrlSpy = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const fixture = await crearComponente();

    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.ejercicio-ficha__volver')?.click();
    await fixture.whenStable();

    expect(navigateByUrlSpy).toHaveBeenCalledWith('/buscar');
  });

  it('permite cambiar el progreso de forma independiente cuando está planificado hoy', async () => {
    const marcarProgreso = vi.fn().mockResolvedValue({ realizadoAnterior: false });
    const mostrarExitoConAccion = vi.fn();
    configurar({ ejercicio: ejercicio(), marcarProgreso, mostrarExitoConAccion });
    const fixture = await crearComponente();

    const boton = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.ejercicio-ficha__progreso button');
    expect(boton?.textContent).toContain('Marcar como realizado');
    await boton?.click();
    await fixture.whenStable();

    expect(marcarProgreso).toHaveBeenCalledWith(expect.any(Date), 'ej-1', true);
    expect(mostrarExitoConAccion).toHaveBeenCalledWith('Progreso actualizado.', 'Deshacer', expect.any(Function));
    expect((fixture.nativeElement as HTMLElement).querySelector('.ejercicio-ficha__descripcion')?.textContent).toContain('Flexionar');
  });

  it('no muestra el control de progreso cuando el ejercicio no está planificado hoy', async () => {
    configurar({ ejercicio: ejercicio(), planificacion: null });
    const fixture = await crearComponente();

    expect((fixture.nativeElement as HTMLElement).querySelector('.ejercicio-ficha__progreso')).toBeNull();
  });

  it('destaca series y repeticiones que ya figuran en observaciones, sin inventarlas', async () => {
    configurar({
      ejercicio: ejercicio({ observaciones: '3 series de 10 repeticiones. Mantén la espalda recta.' }),
    });
    const fixture = await crearComponente();
    const raiz = fixture.nativeElement as HTMLElement;

    expect(raiz.querySelector('.ejercicio-ficha__pauta')?.textContent).toContain('3');
    expect(raiz.querySelector('.ejercicio-ficha__pauta')?.textContent).toContain('10');
    expect(raiz.querySelector('.ejercicio-ficha__observaciones')?.textContent).toContain('Mantén la espalda recta.');
  });

  it('no inventa pauta de series y repeticiones si no aparece en las observaciones', async () => {
    configurar({ ejercicio: ejercicio({ observaciones: 'Hazlo con control.' }) });
    const sinPauta = await crearComponente();
    expect((sinPauta.nativeElement as HTMLElement).querySelector('.ejercicio-ficha__pauta')).toBeNull();
  });

  it('muestra el reproductor embebido para cada enlace de YouTube (FR-015)', async () => {
    configurar({ ejercicio: ejercicio({ enlaces: [{ tipo: 'youtube', url: 'https://youtu.be/abc123' }] }) });
    const fixture = await crearComponente();

    expect((fixture.nativeElement as HTMLElement).querySelector('app-youtube-embed')).toBeTruthy();
  });

  it('muestra el nombre y el acceso externo para enlaces web sin vista previa (FR-016)', async () => {
    configurar({ ejercicio: ejercicio({ enlaces: [{ tipo: 'web', url: 'https://github.com/usuario/proyecto' }] }) });
    const fixture = await crearComponente();
    const raiz = fixture.nativeElement as HTMLElement;

    const enlace = raiz.querySelector<HTMLAnchorElement>('.enlace-embed__fallback');
    expect(raiz.querySelector('.enlace-embed__titulo')?.textContent).toContain('github.com');
    expect(enlace?.getAttribute('href')).toBe('https://github.com/usuario/proyecto');
    expect(raiz.querySelector('.enlace-embed__iframe')).toBeNull();
  });

  it('muestra la vista previa de un vídeo TikTok y conserva el acceso externo', async () => {
    configurar({
      ejercicio: ejercicio({
        enlaces: [{ tipo: 'web', url: 'https://www.tiktok.com/@usuario/video/1234567890123456789' }],
      }),
    });
    const raiz = (await crearComponente()).nativeElement as HTMLElement;

    expect(raiz.querySelector<HTMLIFrameElement>('.enlace-embed__vista-previa')?.src).toContain(
      'https://www.tiktok.com/player/v1/1234567890123456789'
    );
    expect(raiz.querySelector<HTMLAnchorElement>('.enlace-embed__fallback')?.href).toBe(
      'https://www.tiktok.com/@usuario/video/1234567890123456789'
    );
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
    const eliminar = vi.fn().mockResolvedValue({ ejercicio: ejercicio(), asignaciones: [] });
    const mostrarExitoConAccion = vi.fn();
    configurar({ ejercicio: ejercicio(), eliminar, mostrarExitoConAccion });
    const fixture = await crearComponente();
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    await fixture.componentInstance.eliminar();

    expect(eliminar).toHaveBeenCalledWith('ej-1');
    expect(mostrarExitoConAccion).toHaveBeenCalledWith('Ejercicio eliminado.', 'Deshacer', expect.any(Function));
    expect(navigateSpy).toHaveBeenCalledWith(['/buscar']);
  });

  it('ofrece Deshacer en la notificación y restaura el ejercicio sin ocultar errores', async () => {
    const snapshot = { ejercicio: ejercicio(), asignaciones: [] };
    const eliminar = vi.fn().mockResolvedValue(snapshot);
    const restaurarEliminacion = vi.fn().mockResolvedValue(undefined);
    const mostrarExito = vi.fn();
    const mostrarExitoConAccion = vi.fn();
    configurar({ ejercicio: ejercicio(), eliminar, mostrarExito, mostrarExitoConAccion });
    TestBed.overrideProvider(GestionarEjercicioUseCase, {
      useValue: { eliminar, restaurarEliminacion },
    });
    const fixture = await crearComponente();
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    await fixture.componentInstance.eliminar();

    const deshacer = mostrarExitoConAccion.mock.calls[0][2] as () => void;
    deshacer();

    expect(restaurarEliminacion).toHaveBeenCalledWith(snapshot);
  });

  it('mantiene la eliminación en el menú secundario', async () => {
    configurar({ ejercicio: ejercicio() });
    const fixture = await crearComponente();
    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      '[aria-label="Más acciones del ejercicio"]'
    )?.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(document.body.textContent).toContain('Eliminar');
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

  it('muestra la acción "Subir al repositorio común" cuando el ejercicio es elegible (US2)', async () => {
    configurar({ ejercicio: ejercicio(), puedeOfrecerSubida: vi.fn().mockResolvedValue(true) });
    const fixture = await crearComponente();

    expect((fixture.nativeElement as HTMLElement).querySelector('.ejercicio-ficha__subir-comun')).toBeTruthy();
  });

  it('no muestra la acción "Subir al repositorio común" cuando no es elegible (FR-014, FR-015, FR-021)', async () => {
    configurar({ ejercicio: ejercicio(), puedeOfrecerSubida: vi.fn().mockResolvedValue(false) });
    const fixture = await crearComponente();

    expect((fixture.nativeElement as HTMLElement).querySelector('.ejercicio-ficha__subir-comun')).toBeNull();
  });

  it('abre el diálogo de subida al pulsar la acción', async () => {
    const dialogOpen = vi.fn().mockReturnValue({ afterClosed: () => of(false) });
    configurar({ ejercicio: ejercicio(), puedeOfrecerSubida: vi.fn().mockResolvedValue(true), dialogOpen });
    const fixture = await crearComponente();

    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.ejercicio-ficha__subir-comun')?.click();
    await fixture.whenStable();

    expect(dialogOpen).toHaveBeenCalled();
  });
});
