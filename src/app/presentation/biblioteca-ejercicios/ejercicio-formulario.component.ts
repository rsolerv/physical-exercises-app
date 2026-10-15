import { Component, computed, inject, signal } from '@angular/core';
import { form, required, FormField } from '@angular/forms/signals';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { toSignal } from '@angular/core/rxjs-interop';
import { from } from 'rxjs';
import { GestionarEjercicioUseCase } from '../../application/casos-uso/gestionar-ejercicio.use-case';
import { CategoriaRepositoryPort } from '../../application/ports/categoria-repository.port';
import type { Categoria } from '../../domain/categoria/categoria.entity';
import type { EnlaceEjercicio, ImagenEjercicio, TipoEnlaceEjercicio } from '../../domain/ejercicio/ejercicio.entity';

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
 * listas de longitud variable.
 */
@Component({
  selector: 'app-ejercicio-formulario',
  standalone: true,
  imports: [FormField, MatFormFieldModule, MatInputModule, MatButtonModule, MatSelectModule, MatIconModule, MatChipsModule],
  templateUrl: './ejercicio-formulario.component.html',
})
export class EjercicioFormularioComponent {
  private readonly gestionarEjercicio = inject(GestionarEjercicioUseCase);
  private readonly categoriaRepository = inject(CategoriaRepositoryPort);

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

  readonly imagenes = signal<ImagenEjercicio[]>([]);
  readonly errorImagen = signal<string | null>(null);

  readonly guardando = signal(false);
  readonly errorAlGuardar = signal<string | null>(null);

  anadirEnlace(tipo: TipoEnlaceEjercicio, url: string): void {
    if (!url.trim()) return;
    this.enlaces.update((actuales) => [...actuales, { tipo, url }]);
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
      await this.gestionarEjercicio.crear({
        nombre: this.modelo().nombre,
        descripcion: this.modelo().descripcion,
        categoriaIds: this.categoriaIdsSeleccionadas(),
        enlaces: this.enlaces(),
        imagenes: this.imagenes(),
        observaciones: this.modelo().observaciones,
      });
    } catch (error) {
      this.errorAlGuardar.set(error instanceof Error ? error.message : 'No se ha podido guardar el ejercicio.');
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
