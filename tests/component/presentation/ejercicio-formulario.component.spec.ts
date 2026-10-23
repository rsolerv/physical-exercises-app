import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { EjercicioFormularioComponent } from '../../../src/app/presentation/biblioteca-ejercicios/ejercicio-formulario.component';
import { GestionarEjercicioUseCase } from '../../../src/app/application/casos-uso/gestionar-ejercicio.use-case';
import { ConsultarPlanificacionUseCase } from '../../../src/app/application/casos-uso/consultar-planificacion.use-case';
import { GestionarPlanificacionUseCase } from '../../../src/app/application/casos-uso/gestionar-planificacion.use-case';
import { CategoriaRepositoryPort } from '../../../src/app/application/ports/categoria-repository.port';
import { EjercicioRepositoryPort } from '../../../src/app/application/ports/ejercicio-repository.port';
import { diaSemanaDeFecha } from '../../../src/app/domain/planificacion/fecha-semana';
import { MensajeFeedbackService } from '../../../src/app/presentation/compartido/ui/mensaje-feedback.service';
import type { Categoria } from '../../../src/app/domain/categoria/categoria.entity';

describe('EjercicioFormularioComponent', () => {
  const categorias: Categoria[] = [
    { id: 'cat-1', nombre: 'Rodilla' },
    { id: 'cat-2', nombre: 'Pierna' },
  ];
  let mostrarExito: ReturnType<typeof vi.fn>;
  let mostrarError: ReturnType<typeof vi.fn>;
  let asignarEjercicioADia: ReturnType<typeof vi.fn>;
  let obtenerDeHoy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mostrarExito = vi.fn();
    mostrarError = vi.fn();
    asignarEjercicioADia = vi.fn().mockResolvedValue(undefined);
    obtenerDeHoy = vi.fn().mockResolvedValue(null);
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
        { provide: ConsultarPlanificacionUseCase, useValue: { obtenerDeHoy } },
        { provide: GestionarPlanificacionUseCase, useValue: { asignarEjercicioADia } },
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

  it('ofrece áreas táctiles de 48 px para categorías y selectores del formulario', () => {
    crearComponente();
    const estilos = Array.from(document.querySelectorAll('style'), (estilo) => estilo.textContent ?? '').join('\n');

    expect(
      estilos.includes('.ejercicio-formulario mat-chip-option') && estilos.includes('min-height: 48px')
    ).toBe(true);
    expect(
      estilos.includes('.ejercicio-formulario__tipo .mat-button-toggle-button') && estilos.includes('min-height: 48px')
    ).toBe(true);
  });

  it('permite seleccionar varias categorías desde el formulario', async () => {
    const fixture = crearComponente();
    await vi.waitFor(() => expect(fixture.componentInstance.categorias()).toHaveLength(2));
    fixture.detectChanges();
    const raiz = fixture.nativeElement as HTMLElement;
    const lista = raiz.querySelector('mat-chip-listbox');
    const opciones = raiz.querySelectorAll('mat-chip-option');

    expect(lista?.hasAttribute('multiple')).toBe(true);
    (opciones[0] as HTMLElement).click();
    fixture.detectChanges();
    (opciones[1] as HTMLElement).click();
    fixture.detectChanges();

    expect(fixture.componentInstance.categoriaIdsSeleccionadas()).toEqual(['cat-1', 'cat-2']);
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

  it('el botón "Añadir enlace" del formulario añade el enlace introducido en el campo de URL', () => {
    const fixture = crearComponente();
    const componente = fixture.componentInstance;

    componente.nuevoEnlaceTipo.set('youtube');
    componente.nuevoEnlaceUrl.set('https://youtu.be/abc123');
    fixture.detectChanges();
    const boton = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Añadir enlace')
    ) as HTMLButtonElement;
    boton.click();
    fixture.detectChanges();

    expect(componente.enlaces()).toEqual([{ tipo: 'youtube', url: 'https://youtu.be/abc123' }]);
    expect(componente.nuevoEnlaceUrl()).toBe('');
  });

  it('el botón "Añadir imagen" del formulario añade la imagen introducida por URL', () => {
    const fixture = crearComponente();
    const componente = fixture.componentInstance;

    componente.nuevaImagenUrl.set('https://example.com/foto.jpg');
    fixture.detectChanges();
    const boton = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Añadir imagen')
    ) as HTMLButtonElement;
    boton.click();
    fixture.detectChanges();

    expect(componente.imagenes()).toEqual([{ id: expect.any(String), tipo: 'url', valorUrl: 'https://example.com/foto.jpg' }]);
    expect(componente.nuevaImagenUrl()).toBe('');
  });

  it('identifica YouTube a partir de la URL sin elegir antes el tipo de enlace', () => {
    const fixture = crearComponente();
    const componente = fixture.componentInstance;

    componente.nuevoEnlaceUrl.set('https://youtu.be/abc123');
    componente.agregarEnlaceDesdeFormulario();

    expect(componente.enlaces()).toEqual([{ tipo: 'youtube', url: 'https://youtu.be/abc123' }]);
  });

  it('cambiar el origen de la imagen a "Archivo" muestra el botón "Subir imagen" en vez del campo de URL', () => {
    const fixture = crearComponente();
    const componente = fixture.componentInstance;

    componente.nuevaImagenTipo.set('archivo');
    fixture.detectChanges();

    const textoFormulario = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(textoFormulario).toContain('Subir imagen');
  });

  it('onArchivoImagenSeleccionado añade la imagen seleccionada y limpia el input de archivo', async () => {
    const fixture = crearComponente();
    const componente = fixture.componentInstance;
    const archivo = new File(['contenido'], 'foto.png', { type: 'image/png' });
    const input = document.createElement('input');
    input.type = 'file';
    Object.defineProperty(input, 'files', { value: [archivo] });

    await componente.onArchivoImagenSeleccionado({ target: input } as unknown as Event);

    expect(componente.imagenes()).toHaveLength(1);
    expect(componente.imagenes()[0].nombreArchivo).toBe('foto.png');
    expect(input.value).toBe('');
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

  it('rechaza una imagen URL que no tenga formato válido', () => {
    const fixture = crearComponente();
    const componente = fixture.componentInstance;

    componente.anadirImagenDesdeUrl('imagen-invalida');

    expect(componente.imagenes()).toHaveLength(0);
    expect(componente.errorImagen()).toContain('formato de URL válido');
  });

  it('muestra un estado de carga de categorías mientras obtiene las opciones', async () => {
    let resolver: (categorias: Categoria[]) => void = () => undefined;
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideNoopAnimations(),
        {
          provide: CategoriaRepositoryPort,
          useValue: { listarTodas: () => new Promise<Categoria[]>((resolve) => (resolver = resolve)) },
        },
        { provide: EjercicioRepositoryPort, useValue: { obtenerPorId: vi.fn().mockResolvedValue(null) } },
        { provide: GestionarEjercicioUseCase, useValue: { crear: vi.fn(), actualizar: vi.fn() } },
        { provide: ConsultarPlanificacionUseCase, useValue: { obtenerDeHoy } },
        { provide: GestionarPlanificacionUseCase, useValue: { asignarEjercicioADia } },
        { provide: MensajeFeedbackService, useValue: { mostrarExito, mostrarError } },
      ],
    });
    const fixture = crearComponente();
    expect((fixture.nativeElement as HTMLElement).querySelector('.ejercicio-formulario__carga')).toBeTruthy();

    resolver(categorias);
    await fixture.whenStable();
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('.ejercicio-formulario__carga')).toBeNull();
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
    componente.alternarCategoria('cat-2');
    fixture.detectChanges();

    await componente.guardar();

    expect(gestionarEjercicio.crear).toHaveBeenCalledWith(
      expect.objectContaining({
        nombre: 'Sentadilla',
        descripcion: 'Flexionar rodillas',
        categoriaIds: ['cat-1', 'cat-2'],
      })
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
        { provide: ConsultarPlanificacionUseCase, useValue: { obtenerDeHoy } },
        { provide: GestionarPlanificacionUseCase, useValue: { asignarEjercicioADia } },
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

  it('distingue los cambios pendientes del estado guardado y del guardado en curso', async () => {
    let completarGuardado: () => void = () => undefined;
    const gestionar = TestBed.inject(GestionarEjercicioUseCase);
    vi.mocked(gestionar.crear).mockImplementation(
      () =>
        new Promise((resolve) => {
          completarGuardado = () =>
            resolve({
              id: 'ej-1',
              nombre: 'Sentadilla',
              descripcion: 'Flexionar rodillas',
              categoriaIds: ['cat-1'],
              enlaces: [],
              imagenes: [],
            });
        })
    );
    const fixture = crearComponente();
    const componente = fixture.componentInstance;

    expect(componente.estadoGuardado()).toBe('sin-guardar');
    componente.formulario.nombre().value.set('Sentadilla');
    componente.formulario.descripcion().value.set('Flexionar rodillas');
    componente.alternarCategoria('cat-1');
    const guardado = componente.guardar();
    expect(componente.estadoGuardado()).toBe('guardando');

    completarGuardado();
    await guardado;

    expect(componente.estadoGuardado()).toBe('guardado');
  });

  it('solo ofrece agregar a hoy cuando hay planificación activa esta semana', async () => {
    obtenerDeHoy.mockResolvedValue({
      id: 'plan-1',
      nombre: 'Semana actual',
      fechaInicio: '2026-10-19',
      dias: [],
    });
    const fixture = crearComponente();
    await fixture.whenStable();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Agregar a los ejercicios de hoy');

    obtenerDeHoy.mockResolvedValue(null);
    const sinPlanificacion = crearComponente();
    await sinPlanificacion.whenStable();
    sinPlanificacion.detectChanges();

    expect((sinPlanificacion.nativeElement as HTMLElement).textContent).not.toContain('Agregar a los ejercicios de hoy');
  });

  it('asigna el ejercicio nuevo al día actual de la planificación activa si se marca la opción', async () => {
    obtenerDeHoy.mockResolvedValue({
      id: 'plan-1',
      nombre: 'Semana actual',
      fechaInicio: '2026-10-19',
      dias: [],
    });
    const gestionarEjercicio = TestBed.inject(GestionarEjercicioUseCase);
    vi.mocked(gestionarEjercicio.crear).mockResolvedValue({
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
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const raiz = fixture.nativeElement as HTMLElement;
    const casilla = raiz.querySelector('mat-checkbox input') as HTMLInputElement;
    expect(casilla).not.toBeNull();
    casilla.click();
    fixture.detectChanges();

    const componente = fixture.componentInstance;
    componente.formulario.nombre().value.set('Sentadilla');
    componente.formulario.descripcion().value.set('Flexionar rodillas');
    componente.alternarCategoria('cat-1');
    await componente.guardar();

    expect(asignarEjercicioADia).toHaveBeenCalledWith('plan-1', diaSemanaDeFecha(new Date()), 'ej-1');
  });

  it('informa que el ejercicio se guardó si falla su asignación a hoy', async () => {
    obtenerDeHoy.mockResolvedValue({
      id: 'plan-1',
      nombre: 'Semana actual',
      fechaInicio: '2026-10-19',
      dias: [],
    });
    asignarEjercicioADia.mockRejectedValue(new Error('fallo de asignación'));
    const gestionarEjercicio = TestBed.inject(GestionarEjercicioUseCase);
    vi.mocked(gestionarEjercicio.crear).mockResolvedValue({
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
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture.componentInstance.formulario.nombre().value.set('Sentadilla');
    fixture.componentInstance.formulario.descripcion().value.set('Flexionar rodillas');
    fixture.componentInstance.alternarCategoria('cat-1');
    fixture.componentInstance.agregarAEjerciciosHoy.set(true);

    await fixture.componentInstance.guardar();

    expect(fixture.componentInstance.errorAlGuardar()).toContain('El ejercicio se ha guardado');
    expect(fixture.componentInstance.errorAlGuardar()).toContain('fallo de asignación');
    expect(mostrarError).toHaveBeenCalled();
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
          { provide: ConsultarPlanificacionUseCase, useValue: { obtenerDeHoy: vi.fn().mockResolvedValue(null) } },
          { provide: GestionarPlanificacionUseCase, useValue: { asignarEjercicioADia: vi.fn() } },
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

    it('presenta formulario y ficha previa junto a acciones persistentes al editar', async () => {
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

      const raiz = fixture.nativeElement as HTMLElement;
      expect(raiz.querySelector('.ejercicio-formulario__disposicion--edicion')).not.toBeNull();
      expect(raiz.querySelector('.ejercicio-formulario__previsualizacion')?.textContent).toContain('Sentadilla');
      expect(raiz.querySelector('mat-checkbox')).toBeNull();
      expect(raiz.querySelector('.ejercicio-formulario__acciones')?.textContent).toContain('Guardar');
      expect(raiz.querySelector('.ejercicio-formulario__acciones')?.textContent).toContain('Cancelar');
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
