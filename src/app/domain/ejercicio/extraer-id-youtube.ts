/**
 * Extrae el identificador de un vídeo de YouTube a partir de una URL guardada
 * en un Ejercicio, admitiendo los formatos `youtube.com/watch?v=`,
 * `youtu.be/` y `youtube.com/embed/` (research.md § 8). Devuelve `null` si la
 * URL no es de YouTube o no tiene un formato reconocible.
 */
export function extraerIdYoutube(url: string): string | null {
  let analizada: URL;
  try {
    analizada = new URL(url);
  } catch {
    return null;
  }

  const host = analizada.hostname.replace(/^(www|m)\./, '');

  if (host === 'youtu.be') {
    const id = analizada.pathname.slice(1).split('/')[0];
    return id || null;
  }

  if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    if (analizada.pathname === '/watch') {
      return analizada.searchParams.get('v');
    }
    const coincidenciaEmbed = /^\/embed\/([^/]+)/.exec(analizada.pathname);
    if (coincidenciaEmbed) {
      return coincidenciaEmbed[1];
    }
  }

  return null;
}
