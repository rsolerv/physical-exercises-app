export function identificarDestinoSincronizacion(
  metodo: 'github' | 'google' | null,
  cuentaGoogle: string | null
): string | null {
  if (metodo === 'github') return 'github';
  if (metodo === 'google' && cuentaGoogle) return `google:${cuentaGoogle}`;
  return null;
}
