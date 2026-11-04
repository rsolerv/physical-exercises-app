import { describe, expect, it } from 'vitest';
import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate';
import { crearCatalogoPaginacion } from './crear-catalogo-paginacion';

describe('datos sintéticos importables de paginación', () => {
  it.each([51, 125, 1000] as const)('genera %i ejercicios reproducibles en el formato de copia vigente', (cantidad) => {
    const { datos, archivos, imagenes, ejerciciosLocales } = crearCatalogoPaginacion(cantidad);
    const zip = unzipSync(zipSync(Object.fromEntries(
      Object.entries(archivos).map(([ruta, contenido]) => [ruta, strToU8(contenido)])
    )));
    expect(JSON.parse(strFromU8(zip['datos.json']))).toEqual(datos);
    expect(Object.keys(zip).sort()).toEqual(Object.keys(archivos).sort());
    expect(datos.version).toBe(1);
    expect(datos.ejercicios).toHaveLength(cantidad);
    expect(new Set(datos.ejercicios.map((ejercicio) => ejercicio.id)).size).toBe(cantidad);
    expect(ejerciciosLocales).toHaveLength(cantidad);
    expect(datos.ejercicios[4].nombre).toBe(datos.ejercicios[5].nombre);
    expect(datos.ejercicios.filter((ejercicio) => ejercicio.categoriaIds.includes('cat-49'))).toHaveLength(49);
    expect(datos.ejercicios.filter((ejercicio) => ejercicio.categoriaIds.includes('cat-50'))).toHaveLength(50);
    expect(datos.ejercicios.filter((ejercicio) => ejercicio.categoriaIds.includes('cat-general'))).toHaveLength(cantidad);
    expect(datos.ejercicios.filter((ejercicio) => ejercicio.categoriaIds.includes('cat-inexistente'))).toHaveLength(0);
    expect(datos.planificaciones[0].dias[0].ejercicioIds).toContain(datos.ejercicios[cantidad - 1].id);
    expect(datos.progresoDiario[0].ejercicioId).toBe(datos.ejercicios[cantidad - 1].id);
    expect(datos.ejercicios[cantidad - 1]).toMatchObject({
      series: 3, repeticiones: 12, observaciones: 'Mantener la postura.',
      imagenes: [{ tipo: 'archivo' }, { tipo: 'url' }],
    });
    for (const [ruta, imagen] of Object.entries(imagenes)) {
      expect(JSON.parse(strFromU8(zip[ruta]))).toEqual(imagen);
    }
    expect(crearCatalogoPaginacion(cantidad).archivos).toEqual(archivos);
  });

  it('incluye un ejercicio con medios y varias categorías después de los 100 primeros', () => {
    const { datos } = crearCatalogoPaginacion(125);
    expect(datos.ejercicios[119].categoriaIds).toContain('cat-extra');
    expect(datos.ejercicios[119].imagenes).toHaveLength(2);
    expect(datos.ejercicios[119].enlaces).toHaveLength(1);
  });
});
