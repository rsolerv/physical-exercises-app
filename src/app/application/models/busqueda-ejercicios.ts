import type { EjercicioResumen } from '../../domain/ejercicio/ejercicio.entity';

export interface CriteriosBusquedaEjercicios {
  texto: string;
  categoriaIds: string[];
  pagina: number;
  tamanoPagina: number;
}

export interface PaginaEjercicios {
  resultados: EjercicioResumen[];
  total: number;
}
