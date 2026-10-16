import { Component, inject, resource } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { EjercicioRepositoryPort } from '../../application/ports/ejercicio-repository.port';
import { CabeceraPaginaComponent } from '../compartido/ui/cabecera-pagina/cabecera-pagina.component';
import { EstadoVacioComponent } from '../compartido/ui/estado-vacio/estado-vacio.component';

/**
 * Listado de la biblioteca de ejercicios (Historia de Usuario 1): muestra
 * todos los ejercicios (incluido el catálogo predefinido desde el primer
 * uso, FR-034) y un mensaje cuando no hay ninguno (FR-029, CL1).
 */
@Component({
  selector: 'app-biblioteca-listado',
  standalone: true,
  imports: [
    RouterLink,
    MatListModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    CabeceraPaginaComponent,
    EstadoVacioComponent,
  ],
  templateUrl: './biblioteca-listado.component.html',
  styleUrl: './biblioteca-listado.component.scss',
})
export class BibliotecaListadoComponent {
  private readonly ejercicioRepository = inject(EjercicioRepositoryPort);

  protected readonly recursoEjercicios = resource({
    loader: () => this.ejercicioRepository.listarTodos(),
  });
}

