/** Aviso para cuando una descarga se completa sin algunas imágenes cuyo documento remoto era inválido. */
export function textoImagenesOmitidas(cantidad: number): string {
  return cantidad === 1
    ? 'Se ha omitido 1 imagen porque su archivo en el repositorio no es válido.'
    : `Se han omitido ${cantidad} imágenes porque sus archivos en el repositorio no son válidos.`;
}
