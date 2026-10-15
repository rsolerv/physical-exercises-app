export interface EntradaMenuPrincipal {
  etiqueta: string;
  ruta: string;
  icono: string;
}

/**
 * Configuración del menú principal del shell. Cada historia de usuario
 * registra su propia ruta real en `app.routes.ts`; hasta entonces, la ruta
 * apunta a `PaginaEnConstruccionComponent` (ver app.routes.ts).
 */
export const MENU_PRINCIPAL: EntradaMenuPrincipal[] = [
  { etiqueta: 'Hoy', ruta: '/inicio', icono: 'today' },
  { etiqueta: 'Mis ejercicios', ruta: '/ejercicios', icono: 'fitness_center' },
  { etiqueta: 'Buscar', ruta: '/buscar', icono: 'search' },
  { etiqueta: 'Planificación', ruta: '/planificacion', icono: 'calendar_month' },
  { etiqueta: 'Sincronización', ruta: '/sincronizacion', icono: 'sync' },
];
