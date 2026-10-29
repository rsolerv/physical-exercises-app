import type { CategoriaComun, EjercicioComunArchivo } from '../../../app/application/ports/repositorio-comun.port';
import type { Categoria } from '../../../app/domain/categoria/categoria.entity';

/** Categorías comunes de demostración (categorias.json del repositorio común). */
export const CATEGORIAS_COMUNES_DEMO: CategoriaComun[] = [
  { id: 'comun-hombro', nombre: 'Hombro' },
  { id: 'comun-rodilla', nombre: 'Rodilla' },
  { id: 'comun-cadera', nombre: 'Cadera' },
  { id: 'comun-espalda', nombre: 'Espalda' },
  { id: 'comun-movilidad', nombre: 'Movilidad general' },
];

/** Ejercicios comunes de demostración (ejercicios/<id>.json del repositorio común). */
export const EJERCICIOS_COMUNES_DEMO: EjercicioComunArchivo[] = [
  {
    id: 'almeja',
    nombre: 'Almeja',
    descripcion:
      'Túmbate de lado con las rodillas flexionadas y separa la rodilla superior manteniendo los pies juntos, activando el glúteo medio.',
    categoriaIds: ['comun-cadera'],
    enlaces: [],
    imagenes: [],
  },
  {
    id: 'puente-gluteo',
    nombre: 'Puente de glúteo',
    descripcion:
      'Desde tumbado boca arriba con las rodillas flexionadas, eleva la cadera apretando los glúteos y mantén la posición antes de bajar con control.',
    categoriaIds: ['comun-cadera'],
    enlaces: [],
    imagenes: [],
  },
  {
    id: 'sentadilla-bulgara',
    nombre: 'Sentadilla búlgara',
    descripcion:
      'Con un pie apoyado detrás sobre un banco, desciende con la pierna delantera controlando el recorrido de la rodilla.',
    categoriaIds: ['comun-rodilla'],
    enlaces: [],
    imagenes: [],
  },
  {
    id: 'zancada-caminando',
    nombre: 'Zancada caminando',
    descripcion: 'Avanza alternando piernas y desciende hasta formar un ángulo de 90 grados en ambas rodillas.',
    categoriaIds: ['comun-rodilla'],
    enlaces: [],
    imagenes: [],
  },
  {
    id: 'elevacion-lateral-hombro',
    nombre: 'Elevación lateral de hombro',
    descripcion: 'De pie con mancuernas ligeras, eleva los brazos hasta la altura del hombro sin encoger el cuello.',
    categoriaIds: ['comun-hombro'],
    enlaces: [],
    imagenes: [],
  },
  {
    id: 'rotacion-externa-banda',
    nombre: 'Rotación externa con banda',
    descripcion:
      'Con el codo pegado al cuerpo, gira el antebrazo hacia fuera venciendo la resistencia de la banda elástica.',
    categoriaIds: ['comun-hombro'],
    enlaces: [],
    imagenes: [],
  },
  {
    id: 'face-pull-polea',
    nombre: 'Face pull con polea',
    descripcion: 'Tira de la cuerda hacia la cara separando los codos para trabajar la musculatura posterior del hombro.',
    categoriaIds: ['comun-hombro'],
    enlaces: [],
    imagenes: [],
  },
  {
    id: 'plancha-lateral',
    nombre: 'Plancha lateral',
    descripcion: 'Apóyate sobre el antebrazo y el lateral del pie manteniendo el cuerpo alineado y la cadera elevada.',
    categoriaIds: ['comun-espalda'],
    enlaces: [],
    imagenes: [],
  },
  {
    id: 'remo-invertido',
    nombre: 'Remo invertido',
    descripcion: 'Suspendido bajo una barra, tira del pecho hacia la barra manteniendo el cuerpo recto.',
    categoriaIds: ['comun-espalda'],
    enlaces: [],
    imagenes: [],
  },
  {
    id: 'movilidad-toracica',
    nombre: 'Movilidad torácica en cuadrupedia',
    descripcion: 'En cuadrupedia, lleva una mano a la nuca y rota el tronco abriendo el pecho hacia el techo.',
    categoriaIds: ['comun-movilidad'],
    enlaces: [],
    imagenes: [],
  },
];

/** Categorías propias del usuario que solo reconocen "Rodilla" y "Hombro" (dejan Cadera/Espalda/Movilidad sin mapear). */
export const CATEGORIAS_PROPIAS_PARCIALES_DEMO: Categoria[] = [
  { id: 'local-rodilla', nombre: 'Rodilla' },
  { id: 'local-hombro', nombre: 'Hombro' },
];

/** Catálogo completo de categorías propias, sin ninguna pendiente de mapear. */
export const CATEGORIAS_PROPIAS_COMPLETAS_DEMO: Categoria[] = [
  { id: 'local-rodilla', nombre: 'Rodilla' },
  { id: 'local-hombro', nombre: 'Hombro' },
  { id: 'local-cadera', nombre: 'Cadera' },
  { id: 'local-espalda', nombre: 'Espalda' },
  { id: 'local-movilidad', nombre: 'Movilidad' },
];

export type ComportamientoBusquedaComunDemo = 'normal' | 'vacio' | 'error' | 'pendiente';

/** Adaptador de demostración de `RepositorioComunPort`, con comportamiento configurable por historia. */
export function crearRepositorioComunDemo(comportamiento: ComportamientoBusquedaComunDemo = 'normal') {
  return {
    listarCategorias: async () => CATEGORIAS_COMUNES_DEMO,
    buscarEjercicios: async (texto: string, categoriaId: string | null): Promise<EjercicioComunArchivo[]> => {
      if (comportamiento === 'pendiente') return new Promise<EjercicioComunArchivo[]>(() => undefined);
      if (comportamiento === 'error') {
        throw new Error('No se ha podido conectar con el repositorio común. Comprueba tu conexión e inténtalo de nuevo.');
      }
      if (comportamiento === 'vacio') return [];

      const textoNormalizado = texto.trim().toLowerCase();
      return EJERCICIOS_COMUNES_DEMO.filter((ejercicio) => {
        const coincideTexto =
          !textoNormalizado ||
          ejercicio.nombre.toLowerCase().includes(textoNormalizado) ||
          ejercicio.descripcion.toLowerCase().includes(textoNormalizado);
        const coincideCategoria = !categoriaId || ejercicio.categoriaIds.includes(categoriaId);
        return coincideTexto && coincideCategoria;
      });
    },
    leerImagen: async () => {
      throw new Error('No implementado en el prototipo de Storybook.');
    },
    existeEjercicioPorNombre: async () => false,
    subirEjercicio: async () => undefined,
  };
}

/** Adaptador de demostración de `CategoriaRepositoryPort` (solo lectura, usado por este prototipo). */
export function crearCategoriaRepositoryDemo(categorias: Categoria[]) {
  return {
    listarTodas: async () => categorias,
  };
}

/** Adaptador de demostración de `EjercicioRepositoryPort` (solo creación, usada al completar la importación). */
export function crearEjercicioRepositoryDemo() {
  let contador = 0;
  return {
    crear: async (datos: Record<string, unknown>) => {
      contador += 1;
      return { ...datos, id: `importado-demo-${contador}`, subidoRepositorioComun: false };
    },
  };
}

/** Adaptador de demostración de `AjustesRepositoryPort` (solo el método usado al importar). */
export function crearAjustesRepositoryDemo() {
  return {
    marcarCambiosLocalesPendientes: async () => undefined,
  };
}
