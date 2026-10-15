import { Routes } from '@angular/router';
import { PaginaEnConstruccionComponent } from './presentation/compartido/shell/pagina-en-construccion.component';

/**
 * Cada historia de usuario sustituye su propia entrada por el componente real
 * al integrar sus rutas (T048, T061, T082, T108); hasta entonces apunta a
 * `PaginaEnConstruccionComponent` para que el shell sea navegable desde el
 * primer momento (T023).
 */
export const routes: Routes = [
  { path: '', redirectTo: 'inicio', pathMatch: 'full' },
  { path: 'inicio', component: PaginaEnConstruccionComponent, title: 'Hoy' },
  { path: 'ejercicios', component: PaginaEnConstruccionComponent, title: 'Mis ejercicios' },
  { path: 'buscar', component: PaginaEnConstruccionComponent, title: 'Buscar' },
  { path: 'planificacion', component: PaginaEnConstruccionComponent, title: 'Planificación' },
  { path: 'sincronizacion', component: PaginaEnConstruccionComponent, title: 'Sincronización' },
  { path: '**', redirectTo: 'inicio' },
];
