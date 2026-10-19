export interface EntradaMenuPrincipal {
  etiqueta: string;
  ruta: string;
  icono: string;
}

/**
 * Configuración del menú principal del shell. Las rutas apuntan a las vistas
 * funcionales registradas en `app.routes.ts`.
 */
export const MENU_PRINCIPAL: EntradaMenuPrincipal[] = [
  { etiqueta: 'Hoy', ruta: '/inicio', icono: 'today' },
  { etiqueta: 'Buscar', ruta: '/buscar', icono: 'search' },
  { etiqueta: 'Planificación', ruta: '/planificacion', icono: 'calendar_month' },
  { etiqueta: 'Sincronización', ruta: '/sincronizacion', icono: 'sync' },
  { etiqueta: 'Nuevo ejercicio', ruta: '/ejercicios/nuevo', icono: 'add' },
  { etiqueta: 'Gestionar categorías', ruta: '/ejercicios/categorias', icono: 'category' },
];
