import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import type { EjercicioResumen } from '../../../domain/ejercicio/ejercicio.entity';

@Component({
  selector: 'app-ejercicio-list-item',
  standalone: true,
  imports: [RouterLink, MatChipsModule, MatListModule],
  templateUrl: './ejercicio-list-item.component.html',
  styleUrl: './ejercicio-list-item.component.scss',
})
export class EjercicioListItemComponent {
  readonly ejercicio = input.required<EjercicioResumen>();
  readonly nombresCategorias = input.required<string[]>();
}
