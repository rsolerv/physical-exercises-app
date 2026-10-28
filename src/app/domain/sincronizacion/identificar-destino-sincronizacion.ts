export function identificarDestinoSincronizacion(
  metodo: 'github' | 'google' | null,
  cuentaGoogle: string | null,
  repositorioGitHub: string | null
): string | null {
  if (metodo === 'github' && repositorioGitHub) return `github:${repositorioGitHub}`;
  if (metodo === 'google' && cuentaGoogle) return `google:${cuentaGoogle.toLowerCase()}`;
  return null;
}
