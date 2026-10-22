import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { CategoriaGestionComponent } from '../../../src/app/presentation/biblioteca-ejercicios/categorias/categoria-gestion.component';
import { GestionarCategoriaUseCase } from '../../../src/app/application/casos-uso/gestionar-categoria.use-case';
import { CategoriaRepositoryPort } from '../../../src/app/application/ports/categoria-repository.port';
import { EjercicioRepositoryPort } from '../../../src/app/application/ports/ejercicio-repository.port';
import { MensajeFeedbackService } from '../../../src/app/presentation/compartido/ui/mensaje-feedback.service';
import { ErrorNombreDuplicado, ErrorOperacionNoPermitida } from '../../../src/app/domain/errores/errores-dominio';
import type { Categoria } from '../../../src/app/domain/categoria/categoria.entity';

describe('CategoriaGestionComponent', () => {
  let listarTodas: ReturnType<typeof vi.fn>;
  let crear: ReturnType<typeof vi.fn>;
  let actualizar: ReturnType<typeof vi.fn>;
  let eliminar: ReturnType<typeof vi.fn>;
  let restaurarEliminacion: ReturnType<typeof vi.fn>;
  let listarEjercicios: ReturnType<typeof vi.fn>;
  let mostrarExito: ReturnType<typeof vi.fn>;
  let mostrarExitoConAccion: ReturnType<typeof vi.fn>;
  let mostrarError: ReturnType<typeof vi.fn>;

  function configurar(categorias: Categoria[]) {
    listarTodas = vi.fn().mockResolvedValue(categorias);
    crear = vi.fn();
    actualizar = vi.fn();
    eliminar = vi.fn().mockResolvedValue(undefined);
    restaurarEliminacion = vi.fn().mockResolvedValue(undefined);
    listarEjercicios = vi.fn().mockResolvedValue([]);
    mostrarExito = vi.fn();
    mostrarExitoConAccion = vi.fn();
    mostrarError = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideNoopAnimations(),
        { provide: CategoriaRepositoryPort, useValue: { listarTodas } },
        {
          provide: GestionarCategoriaUseCase,
          useValue: { crear, actualizar, eliminar, restaurarEliminacion },
        },
        { provide: EjercicioRepositoryPort, useValue: { listarTodos: listarEjercicios } },
        { provide: MensajeFeedbackService, useValue: { mostrarExito, mostrarExitoConAccion, mostrarError } },
      ],
    });
  }

  beforeEach(() => {
    configurar([
      { id: 'cat-2', nombre: 'Rodilla' },
      { id: 'cat-1', nombre: 'Abdomen' },
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
    expect(fixture.componentInstance.categorias().map((c) => c.nombre)).toEqual(['Abdomen', 'Rodilla']);
  });

  it('muestra el recuento de ejercicios asociados a cada categoría', async () => {
    listarEjercicios.mockResolvedValue([
      { id: 'ej-1', categoriaIds: ['cat-1'] },
      { id: 'ej-2', categoriaIds: ['cat-1', 'cat-2'] },
    ]);
    const fixture = await crearComponente();

    const filaRodilla = (fixture.nativeElement as HTMLElement).querySelector('[data-categoria-id="cat-2"]');
    const filaAbdomen = (fixture.nativeElement as HTMLElement).querySelector('[data-categoria-id="cat-1"]');
    expect(filaRodilla?.textContent).toContain('1 ejercicio');
    expect(filaAbdomen?.textContent).toContain('2 ejercicios');
  });

  it('sitúa la creación junto a la lista antes de las categorías', async () => {
    const fixture = await crearComponente();
    const raiz = fixture.nativeElement as HTMLElement;

    expect(raiz.querySelector('.categoria-gestion__alta')?.compareDocumentPosition(
      raiz.querySelector('mat-nav-list') as Node
    )).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(raiz.querySelector('.categoria-gestion__alta button')?.textContent).toContain('Añadir');
  });

  it('crea una categoría nueva', async () => {
    crear.mockResolvedValue({ id: 'cat-3', nombre: 'Cadera' });
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

  it('solicita la eliminación de una categoría y muestra la acción para deshacer', async () => {
    const fixture = await crearComponente();
    await fixture.componentInstance.eliminarCategoria('cat-1');

    expect(eliminar).toHaveBeenCalledWith('cat-1');
    expect(mostrarExitoConAccion).toHaveBeenCalledWith('Categoría eliminada.', 'Deshacer', expect.any(Function));
  });

  it('muestra los ejercicios que deben reasignarse si no se puede eliminar una categoría', async () => {
    eliminar.mockRejectedValue(
      new ErrorOperacionNoPermitida(
        'No se puede eliminar la categoría porque estos ejercicios solo la tienen asignada: «Sentadilla». Asigna otra categoría a esos ejercicios antes de eliminarla.'
      )
    );
    const fixture = await crearComponente();
    await fixture.componentInstance.eliminarCategoria('cat-1');

    expect(fixture.componentInstance.errorEliminacion()).toContain('«Sentadilla»');
    expect(mostrarError).toHaveBeenCalledWith(expect.stringContaining('Asigna otra categoría'));
  });

  it('renderiza app-cabecera-pagina con el título "Categorías" (FR-001)', async () => {
    const fixture = await crearComponente();

    const cabecera = (fixture.nativeElement as HTMLElement).querySelector('app-cabecera-pagina');
    expect(cabecera).toBeTruthy();
    expect(cabecera?.textContent).toContain('Categorías');
  });

  it('invoca MensajeFeedbackService.mostrarExito al crear una categoría (FR-008)', async () => {
    crear.mockResolvedValue({ id: 'cat-3', nombre: 'Cadera' });
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

    expect(mostrarExitoConAccion).toHaveBeenCalledWith('Categoría eliminada.', 'Deshacer', expect.any(Function));
  });

  it('invoca MensajeFeedbackService.mostrarError si falla la eliminación de una categoría (FR-008)', async () => {
    eliminar.mockRejectedValue(new Error('fallo simulado'));
    const fixture = await crearComponente();
    await fixture.componentInstance.eliminarCategoria('cat-1');

    expect(mostrarError).toHaveBeenCalled();
  });

  it('permite editar una categoría y muestra la confirmación junto al elemento', async () => {
    actualizar.mockResolvedValue({ id: 'cat-1', nombre: 'Core' });
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

  it('cancela la edición en línea con Escape', async () => {
    const fixture = await crearComponente();
    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('[aria-label="Editar categoría Abdomen"]')
      ?.click();
    fixture.detectChanges();

    const entrada = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(
      '[aria-label="Editar categoría Abdomen"] input'
    );
    expect(entrada).toBeTruthy();
    entrada?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();

    expect(fixture.componentInstance.categoriaEnEdicion()).toBeNull();
  });

  it('confirma la edición en línea con Enter', async () => {
    actualizar.mockResolvedValue({ id: 'cat-1', nombre: 'Core' });
    const fixture = await crearComponente();
    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('[aria-label="Editar categoría Abdomen"]')
      ?.click();
    fixture.detectChanges();

    const entrada = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(
      '[aria-label="Editar categoría Abdomen"] input'
    );
    if (!entrada) throw new Error('No se ha mostrado el formulario de edición.');
    entrada.value = 'Core';
    entrada.dispatchEvent(new Event('input'));
    entrada.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await fixture.whenStable();

    expect(actualizar).toHaveBeenCalledWith('cat-1', { nombre: 'Core' });
  });

  it('ofrece deshacer y restaura una categoría eliminada', async () => {
    const snapshot = { categoria: { id: 'cat-1', nombre: 'Abdomen' }, ejercicios: [] };
    eliminar.mockResolvedValue(snapshot);
    const fixture = await crearComponente();
    await fixture.componentInstance.eliminarCategoria('cat-1');

    expect(mostrarExitoConAccion).toHaveBeenCalledWith('Categoría eliminada.', 'Deshacer', expect.any(Function));
    const deshacer = mostrarExitoConAccion.mock.calls[0][2] as () => Promise<void>;
    await deshacer();

    expect(restaurarEliminacion).toHaveBeenCalledWith(snapshot);
    expect(mostrarExito).toHaveBeenCalledWith('Categoría restaurada.');
  });

  it('muestra el indicador de carga mientras obtiene las categorías', async () => {
    let resolver: (categorias: Categoria[]) => void = () => undefined;
    listarTodas.mockImplementation(() => new Promise<Categoria[]>((resolve) => (resolver = resolve)));
    const fixture = TestBed.createComponent(CategoriaGestionComponent);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('.categoria-gestion__carga')).toBeTruthy();
    resolver([{ id: 'cat-1', nombre: 'Rodilla' }]);
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
    crear.mockResolvedValue({ id: 'cat-3', nombre: 'Cadera' });
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
