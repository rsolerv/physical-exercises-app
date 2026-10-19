import { Component, computed, inject, resource, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { from } from 'rxjs';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { EjercicioRepositoryPort } from '../../application/ports/ejercicio-repository.port';
import { CategoriaRepositoryPort } from '../../application/ports/categoria-repository.port';
import { GestionarEjercicioUseCase } from '../../application/casos-uso/gestionar-ejercicio.use-case';
import type { Categoria } from '../../domain/categoria/categoria.entity';
import { CabeceraPaginaComponent } from '../compartido/ui/cabecera-pagina/cabecera-pagina.component';
import { EstadoVacioComponent } from '../compartido/ui/estado-vacio/estado-vacio.component';
import { YoutubeEmbedComponent } from '../compartido/embebidos/youtube-embed.component';
import { EnlaceEmbedComponent } from '../compartido/embebidos/enlace-embed.component';
import { MensajeFeedbackService } from '../compartido/ui/mensaje-feedback.service';

/**
 * Ficha de un ejercicio (Historias de Usuario 1 y 2): muestra sus datos
 * completos, los vídeos de YouTube y enlaces web embebidos (FR-015, FR-016)
 * y permite editarlo o eliminarlo.
 */
@Component({
  selector: 'app-ejercicio-ficha',
  standalone: true,
  imports: [
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    CabeceraPaginaComponent,
    EstadoVacioComponent,
    YoutubeEmbedComponent,
    EnlaceEmbedComponent,
  ],
  templateUrl: './ejercicio-ficha.component.html',
  styleUrl: './ejercicio-ficha.component.scss',
})
export class EjercicioFichaComponent {
  private readonly ruta = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly ejercicioRepository = inject(EjercicioRepositoryPort);
  private readonly categoriaRepository = inject(CategoriaRepositoryPort);
  private readonly gestionarEjercicio = inject(GestionarEjercicioUseCase);
  private readonly mensajeFeedback = inject(MensajeFeedbackService);

  private readonly ejercicioId = this.ruta.snapshot.paramMap.get('id') ?? '';

  protected readonly recursoEjercicio = resource({
    loader: () => this.ejercicioRepository.obtenerPorId(this.ejercicioId),
  });

  readonly categorias = toSignal(from(this.categoriaRepository.listarTodas()), { initialValue: [] as Categoria[] });
  readonly imagenesConError = signal<ReadonlySet<string>>(new Set());
  readonly errorAlEliminar = signal<string | null>(null);

  protected readonly nombresCategorias = computed(() => {
    const ejercicio = this.recursoEjercicio.value();
    if (!ejercicio) return [];
    const porId = new Map(this.categorias().map((categoria) => [categoria.id, categoria.nombre]));
    return ejercicio.categoriaIds.map((id) => porId.get(id) ?? id);
  });

  protected readonly enlacesYoutube = computed(
    () => this.recursoEjercicio.value()?.enlaces.filter((enlace) => enlace.tipo === 'youtube') ?? []
  );

  protected readonly enlacesWeb = computed(
    () => this.recursoEjercicio.value()?.enlaces.filter((enlace) => enlace.tipo === 'web') ?? []
  );

  protected imagenSrc(imagen: { tipo: 'url' | 'archivo'; valorUrl?: string; contenidoBase64?: string; tipoMime?: string }): string {
    if (imagen.tipo === 'url') return imagen.valorUrl ?? '';
    return `data:${imagen.tipoMime};base64,${imagen.contenidoBase64}`;
  }

  marcarErrorImagen(id: string): void {
    this.imagenesConError.update((actuales) => new Set(actuales).add(id));
  }

  async eliminar(): Promise<void> {
    this.errorAlEliminar.set(null);
    try {
      await this.gestionarEjercicio.eliminar(this.ejercicioId);
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'No se ha podido eliminar el ejercicio.';
      this.errorAlEliminar.set(mensaje);
      this.mensajeFeedback.mostrarError(mensaje);
      return;
    }
    this.mensajeFeedback.mostrarExito('Ejercicio eliminado.');
    await this.router.navigate(['/buscar']);
  }
}
