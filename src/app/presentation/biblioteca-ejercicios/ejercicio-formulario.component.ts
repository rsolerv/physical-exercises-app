import { Component, computed, inject, signal } from '@angular/core';
import { form, required, FormField } from '@angular/forms/signals';
import { ActivatedRoute, Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { toSignal } from '@angular/core/rxjs-interop';
import { from } from 'rxjs';
import { GestionarEjercicioUseCase } from '../../application/casos-uso/gestionar-ejercicio.use-case';
import { CategoriaRepositoryPort } from '../../application/ports/categoria-repository.port';
import { EjercicioRepositoryPort } from '../../application/ports/ejercicio-repository.port';
import type { Categoria } from '../../domain/categoria/categoria.entity';
import type { EnlaceEjercicio, ImagenEjercicio, TipoEnlaceEjercicio } from '../../domain/ejercicio/ejercicio.entity';
import { MensajeFeedbackService } from '../compartido/ui/mensaje-feedback.service';
import { CabeceraPaginaComponent } from '../compartido/ui/cabecera-pagina/cabecera-pagina.component';

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
    CabeceraPaginaComponent,
  ],
  templateUrl: './ejercicio-formulario.component.html',
  styleUrl: './ejercicio-formulario.component.scss',
})
export class EjercicioFormularioComponent {
  private readonly gestionarEjercicio = inject(GestionarEjercicioUseCase);
  private readonly categoriaRepository = inject(CategoriaRepositoryPort);
  private readonly ejercicioRepository = inject(EjercicioRepositoryPort);
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

  readonly categorias = toSignal(from(this.categoriaRepository.listarTodas()), { initialValue: [] as Categoria[] });
  readonly categoriaIdsSeleccionadas = signal<string[]>([]);

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

  constructor() {
    if (this.ejercicioId) {
      void this.cargarParaEdicion(this.ejercicioId);
    }
  }

  private async cargarParaEdicion(id: string): Promise<void> {
    const ejercicio = await this.ejercicioRepository.obtenerPorId(id);
    if (!ejercicio) return;
    this.modelo.set({
      nombre: ejercicio.nombre,
      descripcion: ejercicio.descripcion,
      observaciones: ejercicio.observaciones ?? '',
    });
    this.categoriaIdsSeleccionadas.set(ejercicio.categoriaIds);
    this.enlaces.set(ejercicio.enlaces);
    this.imagenes.set(ejercicio.imagenes);
  }

  anadirEnlace(tipo: TipoEnlaceEjercicio, url: string): void {
    if (!url.trim()) return;
    this.enlaces.update((actuales) => [...actuales, { tipo, url }]);
  }

  /** Invocado desde el formulario: añade el enlace introducido y limpia el campo. */
  agregarEnlaceDesdeFormulario(): void {
    this.anadirEnlace(this.nuevoEnlaceTipo(), this.nuevoEnlaceUrl());
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
      await this.anadirImagenDesdeArchivo(archivo);
    }
    input.value = '';
  }

  alternarCategoria(categoriaId: string): void {
    this.categoriaIdsSeleccionadas.update((actuales) =>
      actuales.includes(categoriaId) ? actuales.filter((id) => id !== categoriaId) : [...actuales, categoriaId]
    );
  }

  async guardar(): Promise<void> {
    if (!this.formulario().valid() || this.erroresEnlaces().length > 0 || this.categoriaIdsSeleccionadas().length === 0) {
      return;
    }
    this.guardando.set(true);
    this.errorAlGuardar.set(null);
    try {
      const datos = {
        nombre: this.modelo().nombre,
        descripcion: this.modelo().descripcion,
        categoriaIds: this.categoriaIdsSeleccionadas(),
        enlaces: this.enlaces(),
        imagenes: this.imagenes(),
        observaciones: this.modelo().observaciones,
      };
      const guardado =
        this.modoEdicion && this.ejercicioId
          ? await this.gestionarEjercicio.actualizar(this.ejercicioId, datos)
          : await this.gestionarEjercicio.crear(datos);
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
}

function esUrlValida(url: string): boolean {
  try {
    const analizada = new URL(url);
    return analizada.protocol === 'http:' || analizada.protocol === 'https:';
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
