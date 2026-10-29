import { Component, computed, inject, resource, signal } from '@angular/core';
import { form, required, FormField } from '@angular/forms/signals';
import { ActivatedRoute, Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { toSignal } from '@angular/core/rxjs-interop';
import { from } from 'rxjs';
import { GestionarEjercicioUseCase } from '../../application/casos-uso/gestionar-ejercicio.use-case';
import { ConsultarPlanificacionUseCase } from '../../application/casos-uso/consultar-planificacion.use-case';
import { GestionarPlanificacionUseCase } from '../../application/casos-uso/gestionar-planificacion.use-case';
import { SubirEjercicioComunUseCase } from '../../application/casos-uso/subir-ejercicio-comun.use-case';
import { CategoriaRepositoryPort } from '../../application/ports/categoria-repository.port';
import { EjercicioRepositoryPort } from '../../application/ports/ejercicio-repository.port';
import type { Categoria } from '../../domain/categoria/categoria.entity';
import type { Ejercicio, EnlaceEjercicio, ImagenEjercicio, TipoEnlaceEjercicio } from '../../domain/ejercicio/ejercicio.entity';
import { diaSemanaDeFecha } from '../../domain/planificacion/fecha-semana';
import type { Planificacion } from '../../domain/planificacion/planificacion.entity';
import { MensajeFeedbackService } from '../compartido/ui/mensaje-feedback.service';
import { CabeceraPaginaComponent } from '../compartido/ui/cabecera-pagina/cabecera-pagina.component';
import { SubirEjercicioComunDialogComponent } from './subir-ejercicio-comun-dialog.component';

const TAMANO_MAXIMO_IMAGEN_BYTES = 5 * 1024 * 1024;

interface ModeloFormularioEjercicio {
  nombre: string;
  descripcion: string;
  observaciones: string;
}

/**
 * Formulario de alta/edición de ejercicio (Historia de Usuario 1). Los campos
 * simples (nombre, descripción, observaciones) usan Signal Forms; los enlaces,
 * las imágenes y las categorías se gestionan con signals directos porque son
 * listas de longitud variable. En modo edición (ruta `ejercicios/:id/editar`)
 * precarga los datos existentes y llama a `actualizar()` en vez de `crear()`.
 */
@Component({
  selector: 'app-ejercicio-formulario',
  standalone: true,
  imports: [
    FormField,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    MatChipsModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    CabeceraPaginaComponent,
  ],
  templateUrl: './ejercicio-formulario.component.html',
  styleUrl: './ejercicio-formulario.component.scss',
})
export class EjercicioFormularioComponent {
  private readonly gestionarEjercicio = inject(GestionarEjercicioUseCase);
  private readonly consultarPlanificacion = inject(ConsultarPlanificacionUseCase);
  private readonly gestionarPlanificacion = inject(GestionarPlanificacionUseCase);
  private readonly categoriaRepository = inject(CategoriaRepositoryPort);
  private readonly ejercicioRepository = inject(EjercicioRepositoryPort);
  private readonly subirEjercicioComun = inject(SubirEjercicioComunUseCase);
  private readonly dialog = inject(MatDialog);
  private readonly mensajeFeedback = inject(MensajeFeedbackService);
  private readonly ruta = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly ejercicioId = this.ruta.snapshot.paramMap.get('id');
  protected readonly modoEdicion = this.ejercicioId !== null;
  protected readonly titulo = this.modoEdicion ? 'Editar ejercicio' : 'Nuevo ejercicio';

  readonly modelo = signal<ModeloFormularioEjercicio>({ nombre: '', descripcion: '', observaciones: '' });
  readonly formulario = form(this.modelo, (ruta) => {
    required(ruta.nombre, { message: 'El nombre del ejercicio no puede estar vacío.' });
    required(ruta.descripcion, { message: 'La descripción del ejercicio no puede estar vacía.' });
  });

  readonly categoriasCargando = signal(true);
  readonly errorCargaCategorias = signal<string | null>(null);
  readonly categorias = toSignal(from(this.cargarCategorias()), { initialValue: [] as Categoria[] });
  readonly planificacionActiva = signal<Planificacion | null>(null);
  readonly cargandoPlanificacion = signal(!this.modoEdicion);
  readonly errorCargaPlanificacion = signal<string | null>(null);
  readonly agregarAEjerciciosHoy = signal(false);
  readonly categoriaIdsSeleccionadas = signal<string[]>([]);
  readonly categoriasPrevisualizacion = computed(() =>
    this.categorias().filter((categoria) => this.categoriaIdsSeleccionadas().includes(categoria.id))
  );

  readonly enlaces = signal<EnlaceEjercicio[]>([]);
  readonly erroresEnlaces = computed(() =>
    this.enlaces()
      .filter((enlace) => !esUrlValida(enlace.url))
      .map((enlace) => `El enlace "${enlace.url}" no tiene un formato de URL válido.`)
  );
  readonly nuevoEnlaceTipo = signal<TipoEnlaceEjercicio>('web');
  readonly nuevoEnlaceUrl = signal('');

  readonly imagenes = signal<ImagenEjercicio[]>([]);
  readonly errorImagen = signal<string | null>(null);
  readonly nuevaImagenTipo = signal<'url' | 'archivo'>('url');
  readonly nuevaImagenUrl = signal('');

  readonly guardando = signal(false);
  readonly errorAlGuardar = signal<string | null>(null);
  readonly cargandoEjercicio = signal(false);
  readonly errorCargaEjercicio = signal<string | null>(null);
  private readonly ultimoGuardado = signal<string | null>(null);

  private readonly ejercicioCargado = signal<Ejercicio | null>(null);
  private readonly yaSubidoRepositorioComun = signal(false);
  protected readonly recursoPuedeSubirComun = resource({
    params: () => this.ejercicioCargado() ?? undefined,
    loader: ({ params }) => this.subirEjercicioComun.puedeOfrecerSubida(params),
  });
  /** Nunca disponible mientras se crea un ejercicio todavía sin guardar. */
  protected readonly puedeSubirRepositorioComun = computed(
    () => this.modoEdicion && !this.yaSubidoRepositorioComun() && (this.recursoPuedeSubirComun.value() ?? false)
  );

  readonly estadoGuardado = computed(() => {
    if (this.guardando()) return 'guardando';
    const ultimoGuardado = this.ultimoGuardado();
    return ultimoGuardado !== null && ultimoGuardado === JSON.stringify(this.datosActuales()) ? 'guardado' : 'sin-guardar';
  });

  constructor() {
    if (this.ejercicioId) {
      this.cargandoEjercicio.set(true);
      void this.cargarParaEdicion(this.ejercicioId);
    } else {
      void this.cargarPlanificacionActiva();
    }
  }

  private async cargarCategorias(): Promise<Categoria[]> {
    try {
      return await this.categoriaRepository.listarTodas();
    } catch (error) {
      this.errorCargaCategorias.set(error instanceof Error ? error.message : 'No se han podido cargar las categorías.');
      return [];
    } finally {
      this.categoriasCargando.set(false);
    }
  }

  private async cargarPlanificacionActiva(): Promise<void> {
    try {
      this.planificacionActiva.set(await this.consultarPlanificacion.obtenerDeHoy());
    } catch (error) {
      this.errorCargaPlanificacion.set(
        error instanceof Error
          ? `No se ha podido consultar la planificación de esta semana: ${error.message}`
          : 'No se ha podido consultar la planificación de esta semana.'
      );
    } finally {
      this.cargandoPlanificacion.set(false);
    }
  }

  private async cargarParaEdicion(id: string): Promise<void> {
    this.errorCargaEjercicio.set(null);
    try {
      const ejercicio = await this.ejercicioRepository.obtenerPorId(id);
      if (!ejercicio) {
        this.errorCargaEjercicio.set('No se ha encontrado el ejercicio que quieres editar.');
        return;
      }
      this.modelo.set({
        nombre: ejercicio.nombre,
        descripcion: ejercicio.descripcion,
        observaciones: ejercicio.observaciones ?? '',
      });
      this.categoriaIdsSeleccionadas.set(ejercicio.categoriaIds);
      this.enlaces.set(ejercicio.enlaces);
      this.imagenes.set(ejercicio.imagenes);
      this.ejercicioCargado.set(ejercicio);
      this.ultimoGuardado.set(JSON.stringify(this.datosActuales()));
    } catch (error) {
      this.errorCargaEjercicio.set(error instanceof Error ? error.message : 'No se ha podido cargar el ejercicio.');
    } finally {
      this.cargandoEjercicio.set(false);
    }
  }

  anadirEnlace(tipo: TipoEnlaceEjercicio, url: string): void {
    if (!url.trim()) return;
    this.enlaces.update((actuales) => [...actuales, { tipo, url }]);
  }

  /** Invocado desde el formulario: añade el enlace introducido y limpia el campo. */
  agregarEnlaceDesdeFormulario(): void {
    const url = this.nuevoEnlaceUrl();
    this.anadirEnlace(esUrlYoutube(url) ? 'youtube' : this.nuevoEnlaceTipo(), url);
    this.nuevoEnlaceUrl.set('');
  }

  quitarEnlace(indice: number): void {
    this.enlaces.update((actuales) => actuales.filter((_, i) => i !== indice));
  }

  /** Valida el tamaño de un archivo de imagen antes de leerlo (FR-036). */
  validarTamanoArchivo(archivo: File): boolean {
    if (archivo.size > TAMANO_MAXIMO_IMAGEN_BYTES) {
      this.errorImagen.set('Cada imagen de archivo no puede superar los 5 MB.');
      return false;
    }
    this.errorImagen.set(null);
    return true;
  }

  async anadirImagenDesdeArchivo(archivo: File): Promise<void> {
    if (!this.validarTamanoArchivo(archivo)) return;
    const contenidoBase64 = await leerArchivoComoBase64(archivo);
    this.imagenes.update((actuales) => [
      ...actuales,
      {
        id: crypto.randomUUID(),
        tipo: 'archivo',
        contenidoBase64,
        tipoMime: archivo.type,
        nombreArchivo: archivo.name,
      },
    ]);
  }

  anadirImagenDesdeUrl(url: string): void {
    if (!url.trim()) return;
    if (!esUrlValida(url)) {
      this.errorImagen.set(`La imagen "${url}" no tiene un formato de URL válido.`);
      return;
    }
    this.errorImagen.set(null);
    this.imagenes.update((actuales) => [...actuales, { id: crypto.randomUUID(), tipo: 'url', valorUrl: url }]);
  }

  quitarImagen(indice: number): void {
    this.imagenes.update((actuales) => actuales.filter((_, i) => i !== indice));
  }

  /** Invocado desde el formulario: añade la imagen por URL introducida y limpia el campo. */
  agregarImagenUrlDesdeFormulario(): void {
    this.anadirImagenDesdeUrl(this.nuevaImagenUrl());
    this.nuevaImagenUrl.set('');
  }

  /** Invocado desde el formulario al elegir un archivo de imagen; limpia el input tras leerlo. */
  async onArchivoImagenSeleccionado(evento: Event): Promise<void> {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0];
    if (archivo) {
      try {
        await this.anadirImagenDesdeArchivo(archivo);
      } catch (error) {
        this.errorImagen.set(error instanceof Error ? error.message : 'No se ha podido leer el archivo de imagen.');
      }
    }
    input.value = '';
  }

  alternarCategoria(categoriaId: string): void {
    this.categoriaIdsSeleccionadas.update((actuales) =>
      actuales.includes(categoriaId) ? actuales.filter((id) => id !== categoriaId) : [...actuales, categoriaId]
    );
  }

  async cancelar(): Promise<void> {
    await this.router.navigate(this.ejercicioId ? ['/ejercicios', this.ejercicioId] : ['/buscar']);
  }

  abrirDialogoSubirComun(): void {
    const ejercicio = this.ejercicioCargado();
    if (!ejercicio) return;
    const referencia = this.dialog.open(SubirEjercicioComunDialogComponent, { data: { ejercicio } });
    referencia.afterClosed().subscribe((subidoCorrectamente) => {
      if (subidoCorrectamente) {
        this.yaSubidoRepositorioComun.set(true);
        this.mensajeFeedback.mostrarExito(
          'Ejercicio enviado. Quedará pendiente de revisión antes de publicarse en el catálogo común.'
        );
      }
    });
  }

  async guardar(): Promise<void> {
    if (!this.formulario().valid() || this.erroresEnlaces().length > 0 || this.categoriaIdsSeleccionadas().length === 0) {
      return;
    }
    this.guardando.set(true);
    this.errorAlGuardar.set(null);
    try {
      const datos = this.datosActuales();
      const guardado =
        this.modoEdicion && this.ejercicioId
          ? await this.gestionarEjercicio.actualizar(this.ejercicioId, datos)
          : await this.gestionarEjercicio.crear(datos);
      this.ultimoGuardado.set(JSON.stringify(datos));
      if (!this.modoEdicion && this.agregarAEjerciciosHoy()) {
        const planificacion = this.planificacionActiva();
        if (!planificacion || !guardado?.id) {
          const mensaje =
            'El ejercicio se ha guardado, pero no se ha podido agregar a los ejercicios de hoy porque falta la planificación activa.';
          this.errorAlGuardar.set(mensaje);
          this.mensajeFeedback.mostrarError(mensaje);
          await this.router.navigate(guardado?.id ? ['/ejercicios', guardado.id] : ['/ejercicios']);
          return;
        }
        try {
          await this.gestionarPlanificacion.asignarEjercicioADia(
            planificacion.id,
            diaSemanaDeFecha(new Date()),
            guardado.id
          );
        } catch (error) {
          const detalle = error instanceof Error ? `: ${error.message}` : '.';
          const mensaje = `El ejercicio se ha guardado, pero no se ha podido agregar a los ejercicios de hoy${detalle}`;
          this.errorAlGuardar.set(mensaje);
          this.mensajeFeedback.mostrarError(mensaje);
          await this.router.navigate(['/ejercicios', guardado.id]);
          return;
        }
      }
      this.mensajeFeedback.mostrarExito('Ejercicio guardado.');
      await this.router.navigate(guardado?.id ? ['/ejercicios', guardado.id] : ['/ejercicios']);
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'No se ha podido guardar el ejercicio.';
      this.errorAlGuardar.set(mensaje);
      this.mensajeFeedback.mostrarError(mensaje);
    } finally {
      this.guardando.set(false);
    }
  }

  private datosActuales() {
    return {
      nombre: this.modelo().nombre,
      descripcion: this.modelo().descripcion,
      categoriaIds: this.categoriaIdsSeleccionadas(),
      enlaces: this.enlaces(),
      imagenes: this.imagenes(),
      observaciones: this.modelo().observaciones,
    };
  }
}

function esUrlValida(url: string): boolean {
  try {
    const analizada = new URL(url);
    return analizada.protocol === 'http:' || analizada.protocol === 'https:';
  } catch {
    return false;
  }
}

function esUrlYoutube(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return hostname === 'youtu.be' || hostname === 'youtube.com' || hostname.endsWith('.youtube.com');
  } catch {
    return false;
  }
}

function leerArchivoComoBase64(archivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => {
      const resultado = lector.result as string;
      resolve(resultado.substring(resultado.indexOf(',') + 1));
    };
    lector.onerror = () => reject(new Error('No se ha podido leer el archivo de imagen.'));
    lector.readAsDataURL(archivo);
  });
}
