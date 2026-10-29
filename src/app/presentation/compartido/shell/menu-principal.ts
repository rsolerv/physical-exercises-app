export type GrupoMenu = 'entrenar' | 'biblioteca' | 'sistema';

export interface EntradaMenuPrincipal {
  etiqueta: string;
  ruta: string;
  icono: string;
  grupo: GrupoMenu;
}

export interface SeccionMenuPrincipal {
  etiqueta: string;
  clase: GrupoMenu;
  entradas: EntradaMenuPrincipal[];
}

const hoy: EntradaMenuPrincipal = { etiqueta: 'Hoy', ruta: '/inicio', icono: 'today', grupo: 'entrenar' };
const planificacion: EntradaMenuPrincipal = {
  etiqueta: 'Planificación',
  ruta: '/planificacion',
  icono: 'calendar_month',
  grupo: 'entrenar',
};
const buscar: EntradaMenuPrincipal = { etiqueta: 'Buscar', ruta: '/buscar', icono: 'search', grupo: 'biblioteca' };
const categorias: EntradaMenuPrincipal = {
  etiqueta: 'Gestionar categorías',
  ruta: '/ejercicios/categorias',
  icono: 'category',
  grupo: 'biblioteca',
};
const importar: EntradaMenuPrincipal = {
  etiqueta: 'Importar ejercicios',
  ruta: '/ejercicios/importar',
  icono: 'download',
  grupo: 'biblioteca',
};
const sincronizacion: EntradaMenuPrincipal = {
  etiqueta: 'Sincronización',
  ruta: '/sincronizacion',
  icono: 'sync',
  grupo: 'sistema',
};

export const MENU_PRINCIPAL: EntradaMenuPrincipal[] = [hoy, planificacion, buscar, importar, categorias, sincronizacion];

export const MENU_MOVIL: EntradaMenuPrincipal[] = [hoy, planificacion, buscar];

export const SECCIONES_MENU: SeccionMenuPrincipal[] = [
  { etiqueta: 'Entrenar', clase: 'entrenar', entradas: [hoy, planificacion] },
  { etiqueta: 'Biblioteca', clase: 'biblioteca', entradas: [buscar, importar, categorias] },
  { etiqueta: 'Sistema', clase: 'sistema', entradas: [sincronizacion] },
];

export const ACCESO_NUEVO_EJERCICIO: EntradaMenuPrincipal = {
  etiqueta: 'Nuevo ejercicio',
  ruta: '/ejercicios/nuevo',
  icono: 'add',
  grupo: 'biblioteca',
};
