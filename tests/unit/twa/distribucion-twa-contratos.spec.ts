import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const leer = (ruta: string): string => readFileSync(join(process.cwd(), ruta), 'utf8');
const indexHtml = leer('src/index.html');
const manifestRaw = leer('public/manifest.webmanifest');
const twaManifestRaw = leer('twa/twa-manifest.json');
const assetLinksRaw = leer('public/.well-known/assetlinks.json');
const privacyRaw = leer('public/politica-privacidad.html');
const shellRaw = leer('src/app/presentation/compartido/shell/shell.component.html');
const panelRaw = leer('src/app/presentation/compartido/shell/shell.component.ts');
const syncRaw = leer('src/app/presentation/sincronizacion/configuracion/configuracion-sincronizacion.component.html');

interface IconoManifiestoWeb {
  src: string;
  sizes: string;
  type: string;
  purpose: string;
}

interface ManifiestoWeb {
  name: string;
  short_name: string;
  description: string;
  lang: string;
  dir: string;
  start_url: string;
  scope: string;
  display: string;
  orientation: string;
  background_color: string;
  theme_color: string;
  icons: IconoManifiestoWeb[];
}

describe('Contrato de distribución web instalable (Phase 2)', () => {
  it('define en public/manifest.webmanifest los metadatos e iconos en español de España', () => {
    const manifest = JSON.parse(manifestRaw) as ManifiestoWeb;

    expect(manifest.name).toBe('Gestión de Ejercicios Físicos');
    expect(manifest.short_name).toBe('Ejercicios');
    expect(manifest.short_name.length).toBeLessThanOrEqual(12);
    expect(manifest.lang).toBe('es-ES');
    expect(manifest.dir).toBe('ltr');
    expect(manifest.start_url).toBe('./');
    expect(manifest.scope).toBe('./');
    expect(manifest.display).toBe('standalone');
    expect(manifest.background_color).toBe('#f6f3ee');
    expect(manifest.theme_color).toBe('#00696b');
    expect(manifest.icons).toEqual([
      {
        src: 'assets/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: 'assets/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: 'assets/icons/icon-maskable-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ]);
  });

  it('enlaza manifest.webmanifest, idioma español y color de tema en src/index.html', () => {
    expect(indexHtml).toContain('<html lang="es">');
    expect(indexHtml).toContain('<title>Gestión de Ejercicios Físicos</title>');
    expect(indexHtml).toContain('name="theme-color" content="#00696b"');
    expect(indexHtml).toContain('rel="manifest" href="manifest.webmanifest"');
    expect(indexHtml).toContain('rel="apple-touch-icon" href="assets/icons/icon-192x192.png"');
  });

  it('mantiene la identidad TWA y Digital Asset Links coherentes', () => {
    const twa = JSON.parse(twaManifestRaw) as Record<string, unknown>;
    const links = JSON.parse(assetLinksRaw) as Array<{
      target: { package_name: string; sha256_cert_fingerprints: string[] };
    }>;
    expect(twa).toMatchObject({
      packageId: 'io.github.rsolerv.physicalexercises',
      host: 'rsolerv.github.io',
      startUrl: '/physical-exercises-app/',
      display: 'standalone',
      fallbackType: 'customtabs',
      enableNotifications: false,
    });
    expect(links[0].target.package_name).toBe(twa['packageId']);
    expect(links[0].target.sha256_cert_fingerprints).toHaveLength(2);
  });

  it('deja explícito el bloqueo hasta registrar las huellas externas reales', () => {
    const fingerprints = (JSON.parse(assetLinksRaw) as Array<{
      target: { sha256_cert_fingerprints: string[] };
    }>)[0].target.sha256_cert_fingerprints;
    const format = /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/;
    expect(fingerprints.some((fingerprint) => !format.test(fingerprint))).toBe(true);
    expect(assetLinksRaw).not.toMatch(/PRIVATE KEY|password/i);
  });

  it('documenta la privacidad de la web, Android, sincronización y catálogo común', () => {
    expect(privacyRaw).toMatch(/lang="es"/);
    expect(privacyRaw).toContain('rsolerv/common-data-physical-exercises');
    expect(privacyRaw).toContain('drive.appdata');
    expect(privacyRaw).toMatch(/aplicación Android|versión Android/);
    expect(privacyRaw).toMatch(/retirar|revoca/);
    expect(privacyRaw).toMatch(/elimina|eliminar/);
    expect(privacyRaw).toContain('href="./"');
  });

  it('ofrece el acceso a privacidad desde todos los puntos de entrada', () => {
    expect(shellRaw).toContain('href="politica-privacidad.html"');
    expect(panelRaw).toContain('Política de privacidad');
    expect(syncRaw).toContain('Consultar la política de privacidad');
  });
});
