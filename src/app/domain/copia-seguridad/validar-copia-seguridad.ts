import { ErrorValidacion } from '../errores/errores-dominio';
import { TAMANO_MAXIMO_IMAGEN_BYTES } from '../ejercicio/validar-ejercicio';
import type { EnlaceEjercicio } from '../ejercicio/ejercicio.entity';
import type { DiaPlanificacion } from '../planificacion/planificacion.entity';

export interface ImagenArchivoCopia {
  id: string;
  nombreArchivo: string;
  tipoMime: string;
  contenidoBase64: string;
}

export interface DatosCopiaSeguridad {
  version: number;
  ejercicios: EjercicioCopia[];
  categorias: CategoriaCopia[];
  planificaciones: PlanificacionCopia[];
  progresoDiario: ProgresoDiarioCopia[];
}

interface EjercicioCopia {
  id: string;
  nombre: string;
  descripcion: string;
  categoriaIds: string[];
  enlaces: EnlaceEjercicio[];
  imagenes: (
    | { id: string; tipo: 'url'; valorUrl: string }
    | { id: string; tipo: 'archivo'; ruta: string }
  )[];
  observaciones?: string;
}

interface CategoriaCopia {
  id: string;
  nombre: string;
  descripcion?: string;
}

interface PlanificacionCopia {
  id: string;
  nombre: string;
  fechaInicio?: string;
  dias: DiaPlanificacion[];
}

interface ProgresoDiarioCopia {
  fecha: string;
  ejercicioId: string;
  realizado: boolean;
}

export interface CopiaSeguridadValidada {
  datos: DatosCopiaSeguridad;
  imagenes: Record<string, ImagenArchivoCopia>;
}

const MENSAJE_INCOMPLETO = 'El fichero está dañado o incompleto.';
const MENSAJE_TAMANO = 'Cada imagen de archivo no puede superar los 5 MB.';

export function validarCopiaSeguridad(
  datosJson: string,
  archivosImagenes: Record<string, string>
): CopiaSeguridadValidada {
  const datos = parsearJson(datosJson);
  if (!esDatosCopia(datos)) {
    throw new ErrorValidacion(MENSAJE_INCOMPLETO);
  }

  const imagenes: Record<string, ImagenArchivoCopia> = Object.create(null);
  for (const [ruta, contenido] of Object.entries(archivosImagenes)) {
    const coincidencia = /^imagenes\/([^/\\]+)\.json$/.exec(ruta);
    if (!coincidencia || coincidencia[1] === '.' || coincidencia[1] === '..' || typeof contenido !== 'string') {
      throw new ErrorValidacion(MENSAJE_INCOMPLETO);
    }

    let imagen: unknown;
    try {
      imagen = JSON.parse(contenido);
    } catch {
      throw new ErrorValidacion(MENSAJE_INCOMPLETO);
    }
    if (!esImagenArchivo(imagen) || imagen.id !== coincidencia[1]) {
      throw new ErrorValidacion(MENSAJE_INCOMPLETO);
    }
    if (tamanoBase64EnBytes(imagen.contenidoBase64) > TAMANO_MAXIMO_IMAGEN_BYTES) {
      throw new ErrorValidacion(MENSAJE_TAMANO);
    }
    imagenes[ruta] = imagen;
  }

  for (const ejercicio of datos.ejercicios) {
    for (const imagen of ejercicio.imagenes) {
      if (imagen.tipo === 'archivo' && (imagen.ruta !== `imagenes/${imagen.id}.json` || !imagenes[imagen.ruta])) {
        throw new ErrorValidacion(MENSAJE_INCOMPLETO);
      }
    }
  }

  return { datos, imagenes };
}

function parsearJson(contenido: string): unknown {
  try {
    return JSON.parse(contenido);
  } catch {
    throw new ErrorValidacion('El fichero no es una copia de seguridad válida.');
  }
}

function esDatosCopia(valor: unknown): valor is DatosCopiaSeguridad {
  return (
    esRegistro(valor) &&
    typeof valor['version'] === 'number' &&
    Array.isArray(valor['ejercicios']) &&
    valor['ejercicios'].every(esEjercicioCopia) &&
    Array.isArray(valor['categorias']) &&
    valor['categorias'].every(esCategoriaCopia) &&
    Array.isArray(valor['planificaciones']) &&
    valor['planificaciones'].every(esPlanificacionCopia) &&
    Array.isArray(valor['progresoDiario']) &&
    valor['progresoDiario'].every(esProgresoDiarioCopia)
  );
}

function esEjercicioCopia(valor: unknown): valor is EjercicioCopia {
  return (
    esRegistro(valor) &&
    typeof valor['id'] === 'string' &&
    typeof valor['nombre'] === 'string' &&
    typeof valor['descripcion'] === 'string' &&
    Array.isArray(valor['categoriaIds']) &&
    valor['categoriaIds'].every((id) => typeof id === 'string') &&
    Array.isArray(valor['enlaces']) &&
    valor['enlaces'].every(esEnlace) &&
    Array.isArray(valor['imagenes']) &&
    valor['imagenes'].every(esImagenEjercicio) &&
    (valor['observaciones'] === undefined || typeof valor['observaciones'] === 'string')
  );
}

function esEnlace(valor: unknown): valor is EnlaceEjercicio {
  return (
    esRegistro(valor) &&
    (valor['tipo'] === 'web' || valor['tipo'] === 'youtube') &&
    typeof valor['url'] === 'string'
  );
}

function esImagenEjercicio(
  valor: unknown
): valor is EjercicioCopia['imagenes'][number] {
  return (
    esRegistro(valor) &&
    typeof valor['id'] === 'string' &&
    ((valor['tipo'] === 'url' && typeof valor['valorUrl'] === 'string') ||
      (valor['tipo'] === 'archivo' && typeof valor['ruta'] === 'string'))
  );
}

function esCategoriaCopia(valor: unknown): valor is CategoriaCopia {
  return (
    esRegistro(valor) &&
    typeof valor['id'] === 'string' &&
    typeof valor['nombre'] === 'string' &&
    (valor['descripcion'] === undefined || typeof valor['descripcion'] === 'string')
  );
}

function esPlanificacionCopia(valor: unknown): valor is PlanificacionCopia {
  return (
    esRegistro(valor) &&
    typeof valor['id'] === 'string' &&
    typeof valor['nombre'] === 'string' &&
    (valor['fechaInicio'] === undefined || typeof valor['fechaInicio'] === 'string') &&
    Array.isArray(valor['dias']) &&
    valor['dias'].every(
      (dia) =>
        esRegistro(dia) &&
        typeof dia['diaSemana'] === 'string' &&
        Array.isArray(dia['ejercicioIds']) &&
        dia['ejercicioIds'].every((id) => typeof id === 'string')
    )
  );
}

function esProgresoDiarioCopia(valor: unknown): valor is ProgresoDiarioCopia {
  return (
    esRegistro(valor) &&
    typeof valor['fecha'] === 'string' &&
    typeof valor['ejercicioId'] === 'string' &&
    typeof valor['realizado'] === 'boolean'
  );
}

function esImagenArchivo(valor: unknown): valor is ImagenArchivoCopia {
  return (
    esRegistro(valor) &&
    typeof valor['id'] === 'string' &&
    typeof valor['nombreArchivo'] === 'string' &&
    typeof valor['tipoMime'] === 'string' &&
    typeof valor['contenidoBase64'] === 'string'
  );
}

function esRegistro(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

function tamanoBase64EnBytes(base64: string): number {
  const limpio = base64.replace(/[^A-Za-z0-9+/=]/g, '');
  const relleno = limpio.endsWith('==') ? 2 : limpio.endsWith('=') ? 1 : 0;
  return Math.floor((limpio.length * 3) / 4) - relleno;
}
