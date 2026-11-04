import type { Ejercicio } from '../../src/app/domain/ejercicio/ejercicio.entity';
import type { ExportacionJSON, ImagenArchivoJSON } from '../../src/app/application/ports/github-sync.port';
import { crearDiasVacios } from '../../src/app/domain/planificacion/planificacion.entity';

export type TamanoCatalogo = 51 | 125 | 1000;

export interface CatalogoSintetico {
  datos: ExportacionJSON;
  imagenes: Record<string, ImagenArchivoJSON>;
  archivos: Record<string, string>;
  ejerciciosLocales: Ejercicio[];
}

/** Datos deterministas en el formato vigente de datos.json + imagenes/<id>.json. */
export function crearCatalogoPaginacion(cantidad: TamanoCatalogo): CatalogoSintetico {
  const categorias = [
    { id: 'cat-general', nombre: 'General' },
    { id: 'cat-49', nombre: 'Grupo de 49' },
    { id: 'cat-50', nombre: 'Grupo de 50' },
    { id: 'cat-extra', nombre: 'Movilidad' },
  ];
  const imagenes: Record<string, ImagenArchivoJSON> = {};
  const ejerciciosLocales: Ejercicio[] = Array.from({ length: cantidad }, (_, indice) => {
    const numero = indice + 1;
    const id = `ejercicio-${String(numero).padStart(4, '0')}`;
    const categoriaIds = [
      'cat-general',
      ...(numero <= 49 ? ['cat-49'] : []),
      ...(numero <= 50 ? ['cat-50'] : []),
      ...(numero > 100 && numero % 2 === 0 ? ['cat-extra'] : []),
    ];
    const imagenId = `imagen-${numero}`;
    const conMedios = numero === cantidad || (cantidad > 100 && numero === 120);
    if (conMedios) {
      imagenes[`imagenes/${imagenId}.json`] = {
        id: imagenId,
        nombreArchivo: `${id}.png`,
        tipoMime: 'image/png',
        contenidoBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/6ZsAAAAASUVORK5CYII=',
      };
    }
    return {
      id,
      nombre: numero === 5 || numero === 6 ? 'Nombre repetido' : `Ejercicio ${String(numero).padStart(4, '0')}`,
      descripcion: `Descripción sintética del ejercicio ${numero}.`,
      categoriaIds,
      enlaces: conMedios ? [{ tipo: 'web', url: `https://example.org/ejercicios/${numero}` }] : [],
      imagenes: conMedios ? [
        { tipo: 'archivo', ...imagenes[`imagenes/${imagenId}.json`] },
        { id: `url-${numero}`, tipo: 'url', valorUrl: `https://example.org/imagenes/${numero}.png` },
      ] : [],
      series: conMedios ? 3 : undefined,
      repeticiones: conMedios ? 12 : undefined,
      observaciones: conMedios ? 'Mantener la postura.' : undefined,
      subidoRepositorioComun: numero === cantidad,
    } satisfies Ejercicio;
  });
  const dias = crearDiasVacios();
  dias[0].ejercicioIds = [ejerciciosLocales[0].id, ejerciciosLocales[cantidad - 1].id];
  const datos: ExportacionJSON = {
    version: 1,
    categorias,
    ejercicios: ejerciciosLocales.map(({ id, nombre, descripcion, categoriaIds, enlaces, imagenes: medios,
      series, repeticiones, observaciones, subidoRepositorioComun }) => ({
      id, nombre, descripcion, categoriaIds, enlaces, series, repeticiones, observaciones, subidoRepositorioComun,
      imagenes: medios.map((imagen) => imagen.tipo === 'url'
        ? { id: imagen.id, tipo: 'url', valorUrl: imagen.valorUrl }
        : { id: imagen.id, tipo: 'archivo', ruta: `imagenes/${imagen.id}.json` }),
    })),
    planificaciones: [{ id: 'plan-semana', nombre: 'Semana sintética', fechaInicio: '2026-10-12', dias }],
    progresoDiario: [{ fecha: '2026-10-12', ejercicioId: ejerciciosLocales[cantidad - 1].id, realizado: true }],
  };
  const archivos = {
    'datos.json': JSON.stringify(datos),
    ...Object.fromEntries(Object.entries(imagenes).map(([ruta, imagen]) => [ruta, JSON.stringify(imagen)])),
  };
  return { datos, imagenes, archivos, ejerciciosLocales };
}
