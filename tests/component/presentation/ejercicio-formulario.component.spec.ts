import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { EjercicioFormularioComponent } from '../../../src/app/presentation/biblioteca-ejercicios/ejercicio-formulario.component';
import { GestionarEjercicioUseCase } from '../../../src/app/application/casos-uso/gestionar-ejercicio.use-case';
import { CategoriaRepositoryPort } from '../../../src/app/application/ports/categoria-repository.port';
import { EjercicioRepositoryPort } from '../../../src/app/application/ports/ejercicio-repository.port';
import { MensajeFeedbackService } from '../../../src/app/presentation/compartido/ui/mensaje-feedback.service';
import type { Categoria } from '../../../src/app/domain/categoria/categoria.entity';

describe('EjercicioFormularioComponent', () => {
  const categorias: Categoria[] = [{ id: 'cat-1', nombre: 'Rodilla', esGenerica: false }];
  let mostrarExito: ReturnType<typeof vi.fn>;
  let mostrarError: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mostrarExito = vi.fn();
    mostrarError = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideNoopAnimations(),
        { provide: CategoriaRepositoryPort, useValue: { listarTodas: () => Promise.resolve(categorias) } },
        { provide: EjercicioRepositoryPort, useValue: { obtenerPorId: vi.fn().mockResolvedValue(null) } },
        {
          provide: GestionarEjercicioUseCase,
          useValue: { crear: vi.fn().mockResolvedValue({}), actualizar: vi.fn().mockResolvedValue({}) },
        },
        { provide: MensajeFeedbackService, useValue: { mostrarExito, mostrarError } },
      ],
    });
  });

  function crearComponente() {
    const fixture = TestBed.createComponent(EjercicioFormularioComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('el formulario es inválido si el nombre está vacío (FR-005)', () => {
    const fixture = crearComponente();
    const componente = fixture.componentInstance;
    componente.formulario.nombre().value.set('');
    componente.formulario.descripcion().value.set('Flexionar rodillas');
    fixture.detectChanges();

    expect(componente.formulario.nombre().errors().length).toBeGreaterThan(0);
  });

  it('el formulario es inválido si la descripción está vacía (FR-005)', () => {
    const fixture = crearComponente();
    const componente = fixture.componentInstance;
    componente.formulario.nombre().value.set('Sentadilla');
    componente.formulario.descripcion().value.set('');
    fixture.detectChanges();

    expect(componente.formulario.descripcion().errors().length).toBeGreaterThan(0);
  });

  it('el formulario es válido con nombre y descripción no vacíos', () => {
    const fixture = crearComponente();
    const componente = fixture.componentInstance;
    componente.formulario.nombre().value.set('Sentadilla');
    componente.formulario.descripcion().value.set('Flexionar rodillas');
    fixture.detectChanges();

    expect(componente.formulario().valid()).toBe(true);
  });

  it('rechaza un enlace con formato de URL inválido (FR-007) con un mensaje en español', () => {
    const fixture = crearComponente();
    const componente = fixture.componentInstance;
    componente.anadirEnlace('web', 'ejercicio1');
    fixture.detectChanges();

    expect(componente.erroresEnlaces()[0]).toContain('formato de URL válido');
  });

  it('acepta un enlace con formato de URL válido', () => {
    const fixture = crearComponente();
    const componente = fixture.componentInstance;
    componente.anadirEnlace('web', 'https://example.com');
    fixture.detectChanges();

    expect(componente.erroresEnlaces()).toEqual([]);
    expect(componente.enlaces()).toEqual([{ tipo: 'web', url: 'https://example.com' }]);
  });

  it('rechaza una imagen de archivo de más de 5 MB con un mensaje en español (FR-036)', () => {
    const fixture = crearComponente();
    const componente = fixture.componentInstance;
    const archivoGrande = new File([new Uint8Array(6 * 1024 * 1024)], 'foto.png', { type: 'image/png' });

    componente.validarTamanoArchivo(archivoGrande);

    expect(componente.errorImagen()).toContain('5 MB');
  });

  it('acepta una imagen de archivo de hasta 5 MB', () => {
    const fixture = crearComponente();
    const componente = fixture.componentInstance;
    const archivoPequeno = new File([new Uint8Array(1024)], 'foto.png', { type: 'image/png' });

    componente.validarTamanoArchivo(archivoPequeno);

    expect(componente.errorImagen()).toBeNull();
  });

  it('anadirImagenDesdeArchivo añade la imagen con su contenido en base64', async () => {
    const fixture = crearComponente();
    const componente = fixture.componentInstance;
    const archivo = new File(['contenido'], 'foto.png', { type: 'image/png' });

    await componente.anadirImagenDesdeArchivo(archivo);

    expect(componente.imagenes()).toHaveLength(1);
    expect(componente.imagenes()[0].tipo).toBe('archivo');
    expect(componente.imagenes()[0].nombreArchivo).toBe('foto.png');
  });

  it('anadirImagenDesdeArchivo no añade nada si el archivo supera los 5 MB', async () => {
    const fixture = crearComponente();
    const componente = fixture.componentInstance;
    const archivoGrande = new File([new Uint8Array(6 * 1024 * 1024)], 'foto.png', { type: 'image/png' });

    await componente.anadirImagenDesdeArchivo(archivoGrande);

    expect(componente.imagenes()).toHaveLength(0);
  });

  it('anadirImagenDesdeUrl añade una imagen de tipo URL', () => {
    const fixture = crearComponente();
    const componente = fixture.componentInstance;
    componente.anadirImagenDesdeUrl('https://example.com/foto.jpg');

    expect(componente.imagenes()).toEqual([
      { id: expect.any(String), tipo: 'url', valorUrl: 'https://example.com/foto.jpg' },
    ]);
  });

  it('anadirImagenDesdeUrl no hace nada si la URL está vacía', () => {
    const fixture = crearComponente();
    const componente = fixture.componentInstance;
    componente.anadirImagenDesdeUrl('');
    expect(componente.imagenes()).toHaveLength(0);
  });

  it('quitarEnlace elimina el enlace indicado', () => {
    const fixture = crearComponente();
    const componente = fixture.componentInstance;
    componente.anadirEnlace('web', 'https://example.com/a');
    componente.anadirEnlace('web', 'https://example.com/b');
    componente.quitarEnlace(0);

    expect(componente.enlaces()).toEqual([{ tipo: 'web', url: 'https://example.com/b' }]);
  });

  it('quitarImagen elimina la imagen indicada', () => {
    const fixture = crearComponente();
    const componente = fixture.componentInstance;
    componente.anadirImagenDesdeUrl('https://example.com/a.jpg');
    componente.anadirImagenDesdeUrl('https://example.com/b.jpg');
    componente.quitarImagen(0);

    expect(componente.imagenes()).toHaveLength(1);
    expect(componente.imagenes()[0].valorUrl).toBe('https://example.com/b.jpg');
  });

  it('alternarCategoria selecciona y deselecciona una categoría', () => {
    const fixture = crearComponente();
    const componente = fixture.componentInstance;
    componente.alternarCategoria('cat-1');
    expect(componente.categoriaIdsSeleccionadas()).toEqual(['cat-1']);

    componente.alternarCategoria('cat-1');
    expect(componente.categoriaIdsSeleccionadas()).toEqual([]);
  });

  it('guardar() no llama al caso de uso si el formulario no es válido o no hay categoría seleccionada', async () => {
    const fixture = crearComponente();
    const componente = fixture.componentInstance;
    const gestionarEjercicio = TestBed.inject(GestionarEjercicioUseCase);

    await componente.guardar();

    expect(gestionarEjercicio.crear).not.toHaveBeenCalled();
  });

  it('guardar() llama al caso de uso cuando los datos son válidos', async () => {
    const fixture = crearComponente();
    const componente = fixture.componentInstance;
    const gestionarEjercicio = TestBed.inject(GestionarEjercicioUseCase);

    componente.formulario.nombre().value.set('Sentadilla');
    componente.formulario.descripcion().value.set('Flexionar rodillas');
    componente.alternarCategoria('cat-1');
    fixture.detectChanges();

    await componente.guardar();

    expect(gestionarEjercicio.crear).toHaveBeenCalledWith(
      expect.objectContaining({ nombre: 'Sentadilla', descripcion: 'Flexionar rodillas', categoriaIds: ['cat-1'] })
    );
    expect(componente.guardando()).toBe(false);
  });

  it('guardar() expone el mensaje de error si el caso de uso falla', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideNoopAnimations(),
        { provide: CategoriaRepositoryPort, useValue: { listarTodas: () => Promise.resolve(categorias) } },
        { provide: EjercicioRepositoryPort, useValue: { obtenerPorId: vi.fn().mockResolvedValue(null) } },
        { provide: GestionarEjercicioUseCase, useValue: { crear: () => Promise.reject(new Error('fallo simulado')) } },
        { provide: MensajeFeedbackService, useValue: { mostrarExito, mostrarError } },
      ],
    });
    const fixture = crearComponente();
    const componente = fixture.componentInstance;

    componente.formulario.nombre().value.set('Sentadilla');
    componente.formulario.descripcion().value.set('Flexionar rodillas');
    componente.alternarCategoria('cat-1');
    fixture.detectChanges();

    await componente.guardar();

    expect(componente.errorAlGuardar()).toBe('fallo simulado');
    expect(mostrarError).toHaveBeenCalled();
  });

  it('guardar() invoca MensajeFeedbackService.mostrarExito cuando los datos son válidos (FR-008)', async () => {
    const fixture = crearComponente();
    const componente = fixture.componentInstance;

    componente.formulario.nombre().value.set('Sentadilla');
    componente.formulario.descripcion().value.set('Flexionar rodillas');
    componente.alternarCategoria('cat-1');
    fixture.detectChanges();

    await componente.guardar();

    expect(mostrarExito).toHaveBeenCalled();
  });

  it('agrupa el formulario en 5 secciones identificables por su propio encabezado (FR-005)', () => {
    const fixture = crearComponente();
    const titulosEsperados = ['Datos básicos', 'Categorías', 'Enlaces', 'Imágenes', 'Observaciones'];

    const encabezados = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('h3')).map(
      (elemento) => elemento.textContent?.trim()
    );

    for (const titulo of titulosEsperados) {
      expect(encabezados.some((encabezado) => encabezado?.includes(titulo))).toBe(true);
    }
  });

  it('marca visiblemente "Nombre del ejercicio", "Descripción" y "Categorías" como obligatorios antes de guardar (FR-007)', () => {
    const fixture = crearComponente();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toMatch(/Nombre del ejercicio.*(\*|obligatorio)/is);
    expect(texto).toMatch(/Descripción.*(\*|obligatorio)/is);
    expect(texto).toMatch(/Categorías.*(\*|obligatorio)/is);
  });

  describe('modo edición', () => {
    function configurarEdicion(ejercicioExistente: {
      id: string;
      nombre: string;
      descripcion: string;
      categoriaIds: string[];
      enlaces: unknown[];
      imagenes: unknown[];
      observaciones?: string;
    }) {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          provideRouter([]),
          provideNoopAnimations(),
          { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => ejercicioExistente.id } } } },
          { provide: CategoriaRepositoryPort, useValue: { listarTodas: () => Promise.resolve(categorias) } },
          { provide: EjercicioRepositoryPort, useValue: { obtenerPorId: vi.fn().mockResolvedValue(ejercicioExistente) } },
          {
            provide: GestionarEjercicioUseCase,
            useValue: { crear: vi.fn().mockResolvedValue({}), actualizar: vi.fn().mockResolvedValue({ id: ejercicioExistente.id }) },
          },
          { provide: MensajeFeedbackService, useValue: { mostrarExito, mostrarError } },
        ],
      });
    }

    it('precarga los datos del ejercicio existente', async () => {
      configurarEdicion({
        id: 'ej-1',
        nombre: 'Sentadilla',
        descripcion: 'Flexionar rodillas',
        categoriaIds: ['cat-1'],
        enlaces: [],
        imagenes: [],
        observaciones: 'Cuidado con la espalda',
      });
      const fixture = crearComponente();
      await fixture.whenStable();
      fixture.detectChanges();
      const componente = fixture.componentInstance;

      expect(componente.modelo().nombre).toBe('Sentadilla');
      expect(componente.modelo().observaciones).toBe('Cuidado con la espalda');
      expect(componente.categoriaIdsSeleccionadas()).toEqual(['cat-1']);
    });

    it('guardar() llama a actualizar() en vez de crear()', async () => {
      configurarEdicion({
        id: 'ej-1',
        nombre: 'Sentadilla',
        descripcion: 'Flexionar rodillas',
        categoriaIds: ['cat-1'],
        enlaces: [],
        imagenes: [],
      });
      const fixture = crearComponente();
      await fixture.whenStable();
      fixture.detectChanges();
      const componente = fixture.componentInstance;
      const gestionarEjercicio = TestBed.inject(GestionarEjercicioUseCase);

      await componente.guardar();

      expect(gestionarEjercicio.actualizar).toHaveBeenCalledWith('ej-1', expect.objectContaining({ nombre: 'Sentadilla' }));
      expect(gestionarEjercicio.crear).not.toHaveBeenCalled();
    });
  });
});
