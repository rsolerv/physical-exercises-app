import { Routes } from '@angular/router';
import { PaginaEnConstruccionComponent } from './presentation/compartido/shell/pagina-en-construccion.component';
import { BibliotecaListadoComponent } from './presentation/biblioteca-ejercicios/biblioteca-listado.component';
import { EjercicioFormularioComponent } from './presentation/biblioteca-ejercicios/ejercicio-formulario.component';
import { CategoriaGestionComponent } from './presentation/biblioteca-ejercicios/categorias/categoria-gestion.component';

/**
 * Cada historia de usuario sustituye su propia entrada por el componente real
 * al integrar sus rutas (T048, T061, T082, T108); hasta entonces apunta a
 * `PaginaEnConstruccionComponent` para que el shell sea navegable desde el
 * primer momento (T023).
 */
export const routes: Routes = [
  { path: '', redirectTo: 'inicio', pathMatch: 'full' },
  { path: 'inicio', component: PaginaEnConstruccionComponent, title: 'Hoy' },
  { path: 'ejercicios', component: BibliotecaListadoComponent, title: 'Mis ejercicios' },
  { path: 'ejercicios/categorias', component: CategoriaGestionComponent, title: 'Categorías' },
  { path: 'ejercicios/nuevo', component: EjercicioFormularioComponent, title: 'Nuevo ejercicio' },
  { path: 'buscar', component: PaginaEnConstruccionComponent, title: 'Buscar' },
  { path: 'planificacion', component: PaginaEnConstruccionComponent, title: 'Planificación' },
  { path: 'sincronizacion', component: PaginaEnConstruccionComponent, title: 'Sincronización' },
  { path: '**', redirectTo: 'inicio' },
];
