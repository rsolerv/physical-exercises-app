import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { CategoriaGestionComponent } from '../../../src/app/presentation/biblioteca-ejercicios/categorias/categoria-gestion.component';
import { GestionarCategoriaUseCase } from '../../../src/app/application/casos-uso/gestionar-categoria.use-case';
import { CategoriaRepositoryPort } from '../../../src/app/application/ports/categoria-repository.port';
import { ErrorNombreDuplicado } from '../../../src/app/domain/errores/errores-dominio';
import type { Categoria } from '../../../src/app/domain/categoria/categoria.entity';

describe('CategoriaGestionComponent', () => {
  let listarTodas: ReturnType<typeof vi.fn>;
  let crear: ReturnType<typeof vi.fn>;
  let eliminar: ReturnType<typeof vi.fn>;

  function configurar(categorias: Categoria[]) {
    listarTodas = vi.fn().mockResolvedValue(categorias);
    crear = vi.fn();
    eliminar = vi.fn().mockResolvedValue(undefined);

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideNoopAnimations(),
        { provide: CategoriaRepositoryPort, useValue: { listarTodas } },
        { provide: GestionarCategoriaUseCase, useValue: { crear, eliminar } },
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

    expect(fixture.componentInstance.errorCreacion()).toContain('Rodilla');
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
});
