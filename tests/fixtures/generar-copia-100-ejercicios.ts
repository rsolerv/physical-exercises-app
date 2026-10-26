const fs = require('node:fs');
const path = require('node:path');
const { strToU8, zipSync } = require('fflate');

const directorio = __dirname;
const base64Imagen = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/6ZsAAAAASUVORK5CYII=';
const categorias = Array.from({ length: 10 }, (_, indice) => ({
  id: `categoria-${indice + 1}`,
  nombre: `Categoría ${indice + 1}`,
}));
const imagenes = Array.from({ length: 100 }, (_, indice) => ({
  id: `imagen-${indice + 1}`,
  nombreArchivo: `ejercicio-${indice + 1}.png`,
  tipoMime: 'image/png',
  contenidoBase64: base64Imagen,
}));
const ejercicios = Array.from({ length: 100 }, (_, indice) => ({
  id: `ejercicio-${indice + 1}`,
  nombre: `Ejercicio de prueba ${indice + 1}`,
  descripcion: 'Ejercicio de prueba generado para validar la sincronización.',
  categoriaIds: [`categoria-${(indice % categorias.length) + 1}`],
  enlaces: [],
  imagenes: [{ id: `imagen-${indice + 1}`, tipo: 'archivo', ruta: `imagenes/imagen-${indice + 1}.json` }],
}));

const archivos = {
  'datos.json': strToU8(JSON.stringify({
    version: 1,
    ejercicios,
    categorias,
    planificaciones: [],
    progresoDiario: [],
  })),
  ...Object.fromEntries(imagenes.map((imagen) => [
    `imagenes/${imagen.id}.json`,
    strToU8(JSON.stringify(imagen)),
  ])),
};

fs.writeFileSync(path.join(directorio, 'copia-100-ejercicios.zip'), zipSync(archivos));
