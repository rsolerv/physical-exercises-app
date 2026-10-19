import { Routes } from '@angular/router';
import { EjercicioFormularioComponent } from './presentation/biblioteca-ejercicios/ejercicio-formulario.component';
import { EjercicioFichaComponent } from './presentation/biblioteca-ejercicios/ejercicio-ficha.component';
import { CategoriaGestionComponent } from './presentation/biblioteca-ejercicios/categorias/categoria-gestion.component';
import { BusquedaEjerciciosComponent } from './presentation/busqueda-ejercicios/busqueda-ejercicios.component';
import { DiaActualComponent } from './presentation/planificacion-semanal/dia-actual/dia-actual.component';
import { CalendarioSemanalComponent } from './presentation/planificacion-semanal/calendario/calendario-semanal.component';
import { PlanificacionConstructorComponent } from './presentation/planificacion-semanal/constructor/planificacion-constructor.component';
import { ConfiguracionSincronizacionComponent } from './presentation/sincronizacion/configuracion/configuracion-sincronizacion.component';
import { ResolucionConflictoComponent } from './presentation/sincronizacion/conflicto/resolucion-conflicto.component';

/**
 * Cada historia de usuario sustituye su propia entrada por el componente real
 * al integrar sus rutas (T048, T061, T082, T108).
 */
export const routes: Routes = [
  { path: '', redirectTo: 'inicio', pathMatch: 'full' },
  { path: 'inicio', component: DiaActualComponent, title: 'Hoy' },
  { path: 'ejercicios', redirectTo: 'buscar', pathMatch: 'full' },
  { path: 'ejercicios/categorias', component: CategoriaGestionComponent, title: 'Categorías' },
  { path: 'ejercicios/nuevo', component: EjercicioFormularioComponent, title: 'Nuevo ejercicio' },
  { path: 'ejercicios/:id/editar', component: EjercicioFormularioComponent, title: 'Editar ejercicio' },
  { path: 'ejercicios/:id', component: EjercicioFichaComponent, title: 'Ejercicio' },
  { path: 'buscar', component: BusquedaEjerciciosComponent, title: 'Buscar' },
  { path: 'planificacion', component: CalendarioSemanalComponent, title: 'Planificación' },
  { path: 'planificacion/nueva', component: PlanificacionConstructorComponent, title: 'Nueva planificación' },
  { path: 'planificacion/:id', component: PlanificacionConstructorComponent, title: 'Editar planificación' },
  { path: 'sincronizacion', component: ConfiguracionSincronizacionComponent, title: 'Sincronización' },
  { path: 'sincronizacion/conflicto', component: ResolucionConflictoComponent, title: 'Conflicto de sincronización' },
  { path: '**', redirectTo: 'inicio' },
];
