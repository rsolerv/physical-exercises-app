import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { CategoriaGestionComponent } from '../../../src/app/presentation/biblioteca-ejercicios/categorias/categoria-gestion.component';
import { GestionarCategoriaUseCase } from '../../../src/app/application/casos-uso/gestionar-categoria.use-case';
import { CategoriaRepositoryPort } from '../../../src/app/application/ports/categoria-repository.port';
import { MensajeFeedbackService } from '../../../src/app/presentation/compartido/ui/mensaje-feedback.service';
import { ErrorNombreDuplicado } from '../../../src/app/domain/errores/errores-dominio';
import type { Categoria } from '../../../src/app/domain/categoria/categoria.entity';

describe('CategoriaGestionComponent', () => {
  let listarTodas: ReturnType<typeof vi.fn>;
  let crear: ReturnType<typeof vi.fn>;
  let actualizar: ReturnType<typeof vi.fn>;
  let eliminar: ReturnType<typeof vi.fn>;
  let mostrarExito: ReturnType<typeof vi.fn>;
  let mostrarError: ReturnType<typeof vi.fn>;

  function configurar(categorias: Categoria[]) {
    listarTodas = vi.fn().mockResolvedValue(categorias);
    crear = vi.fn();
    actualizar = vi.fn();
    eliminar = vi.fn().mockResolvedValue(undefined);
    mostrarExito = vi.fn();
    mostrarError = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideNoopAnimations(),
        { provide: CategoriaRepositoryPort, useValue: { listarTodas } },
        { provide: GestionarCategoriaUseCase, useValue: { crear, actualizar, eliminar } },
        { provide: MensajeFeedbackService, useValue: { mostrarExito, mostrarError } },
      ],
    });
  }

  beforeEach(() => {
    configurar([
      { id: 'cat-2', nombre: 'Rodilla', esGenerica: false },
      { id: 'cat-1', nombre: 'Abdomen', esGenerica: false },
      { id: 'cat-generica', nombre: 'Sin categoría', esGenerica: true },
    ]);
  });

  async function crearComponente() {
    const fixture = TestBed.createComponent(CategoriaGestionComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('lista las categorías en orden alfabético', async () => {
    const fixture = await crearComponente();
    expect(fixture.componentInstance.categorias().map((c) => c.nombre)).toEqual(['Abdomen', 'Rodilla', 'Sin categoría']);
  });

  it('crea una categoría nueva', async () => {
    crear.mockResolvedValue({ id: 'cat-3', nombre: 'Cadera', esGenerica: false });
    const fixture = await crearComponente();
    await fixture.componentInstance.crearCategoria('Cadera');

    expect(crear).toHaveBeenCalledWith('Cadera');
  });

  it('muestra un error si el nombre ya existe (FR-010)', async () => {
    crear.mockRejectedValue(new ErrorNombreDuplicado('Ya existe una categoría con el nombre "Rodilla".'));
    const fixture = await crearComponente();
    await fixture.componentInstance.crearCategoria('Rodilla');
    fixture.detectChanges();

    expect(fixture.componentInstance.errorCreacion()).toContain('Rodilla');
    expect((fixture.nativeElement as HTMLElement).querySelector('.categoria-gestion__alta [role="alert"]')?.textContent)
      .toContain('Rodilla');
  });

  it('elimina una categoría con aviso de retirada automática', async () => {
    const fixture = await crearComponente();
    await fixture.componentInstance.eliminarCategoria('cat-1');

    expect(eliminar).toHaveBeenCalledWith('cat-1');
  });

  it('impide eliminar la categoría genérica desde la interfaz', async () => {
    const fixture = await crearComponente();
    await fixture.componentInstance.eliminarCategoria('cat-generica');

    expect(eliminar).not.toHaveBeenCalled();
  });

  it('renderiza app-cabecera-pagina con el título "Categorías" (FR-001)', async () => {
    const fixture = await crearComponente();

    const cabecera = (fixture.nativeElement as HTMLElement).querySelector('app-cabecera-pagina');
    expect(cabecera).toBeTruthy();
    expect(cabecera?.textContent).toContain('Categorías');
  });

  it('invoca MensajeFeedbackService.mostrarExito al crear una categoría (FR-008)', async () => {
    crear.mockResolvedValue({ id: 'cat-3', nombre: 'Cadera', esGenerica: false });
    const fixture = await crearComponente();
    await fixture.componentInstance.crearCategoria('Cadera');

    expect(mostrarExito).toHaveBeenCalled();
  });

  it('invoca MensajeFeedbackService.mostrarError si falla la creación de una categoría (FR-008)', async () => {
    crear.mockRejectedValue(new ErrorNombreDuplicado('Ya existe una categoría con el nombre "Rodilla".'));
    const fixture = await crearComponente();
    await fixture.componentInstance.crearCategoria('Rodilla');

    expect(mostrarError).toHaveBeenCalled();
  });

  it('invoca MensajeFeedbackService.mostrarExito al eliminar una categoría (FR-008)', async () => {
    const fixture = await crearComponente();
    await fixture.componentInstance.eliminarCategoria('cat-1');

    expect(mostrarExito).toHaveBeenCalled();
  });

  it('invoca MensajeFeedbackService.mostrarError si falla la eliminación de una categoría (FR-008)', async () => {
    eliminar.mockRejectedValue(new Error('fallo simulado'));
    const fixture = await crearComponente();
    await fixture.componentInstance.eliminarCategoria('cat-1');

    expect(mostrarError).toHaveBeenCalled();
  });

  it('permite editar una categoría y muestra la confirmación junto al elemento', async () => {
    actualizar.mockResolvedValue({ id: 'cat-1', nombre: 'Core', esGenerica: false });
    const fixture = await crearComponente();

    const botonEditar = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      '[aria-label="Editar categoría Abdomen"]'
    );
    expect(botonEditar).toBeTruthy();
    botonEditar?.click();
    fixture.detectChanges();

    const formulario = (fixture.nativeElement as HTMLElement).querySelector<HTMLFormElement>(
      '[aria-label="Editar categoría Abdomen"]'
    );
    const entrada = formulario?.querySelector<HTMLInputElement>('input');
    expect(entrada?.value).toBe('Abdomen');
    if (!formulario || !entrada) throw new Error('No se ha mostrado el formulario de edición.');
    entrada.value = 'Core';
    entrada.dispatchEvent(new Event('input'));
    formulario.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(actualizar).toHaveBeenCalledWith('cat-1', { nombre: 'Core' });
    expect((fixture.nativeElement as HTMLElement).querySelector('[role="status"]')?.textContent).toContain('actualizada');
  });

  it('muestra el indicador de carga mientras obtiene las categorías', async () => {
    let resolver: (categorias: Categoria[]) => void = () => undefined;
    listarTodas.mockImplementation(() => new Promise<Categoria[]>((resolve) => (resolver = resolve)));
    const fixture = TestBed.createComponent(CategoriaGestionComponent);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('.categoria-gestion__carga')).toBeTruthy();
    resolver([{ id: 'cat-generica', nombre: 'Sin categoría', esGenerica: true }]);
    await fixture.whenStable();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('.categoria-gestion__carga')).toBeNull();
  });

  it('muestra el error al editar junto al elemento afectado', async () => {
    actualizar.mockRejectedValue(new ErrorNombreDuplicado('Ya existe una categoría con ese nombre.'));
    const fixture = await crearComponente();
    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('[aria-label="Editar categoría Abdomen"]')
      ?.click();
    fixture.detectChanges();

    const formulario = (fixture.nativeElement as HTMLElement).querySelector<HTMLFormElement>(
      '[aria-label="Editar categoría Abdomen"]'
    );
    formulario?.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(formulario?.querySelector('[role="alert"]')?.textContent).toContain('Ya existe');
  });

  it('muestra el feedback de éxito de creación junto al formulario', async () => {
    crear.mockResolvedValue({ id: 'cat-3', nombre: 'Cadera', esGenerica: false });
    const fixture = await crearComponente();
    await fixture.componentInstance.crearCategoria('Cadera');
    fixture.detectChanges();

    expect(
      (fixture.nativeElement as HTMLElement).querySelector('.categoria-gestion__alta [role="status"]')?.textContent
    ).toContain('creada');
  });

  it('muestra la confirmación de eliminación junto al listado', async () => {
    const fixture = await crearComponente();
    await fixture.componentInstance.eliminarCategoria('cat-1');
    await fixture.whenStable();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('[role="status"]')?.textContent).toContain('eliminada');
  });

  it('muestra el error de eliminación junto al listado', async () => {
    eliminar.mockRejectedValue(new Error('fallo simulado'));
    const fixture = await crearComponente();
    await fixture.componentInstance.eliminarCategoria('cat-1');
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('[role="alert"]')?.textContent).toContain(
      'No se ha podido eliminar'
    );
  });
});
