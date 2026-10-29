// Script temporal (no forma parte de la aplicación) para generar capturas de las
// historias de Storybook "Importar ejercicios" en los tres anchos de referencia.
const { chromium } = require('playwright');
const path = require('path');

const BASE = 'http://localhost:6006/iframe.html?viewMode=story&id=';
const OUT_DIR = path.resolve(__dirname, 'tmp-capturas-importar');

const DEVICES = {
  movil: { width: 390, height: 844 },
  tablet: { width: 834, height: 1112 },
  escritorio: { width: 1280, height: 900 },
};

const CAPTURAS = [
  { storyId: 'physical-exercises-importar-ejercicios--inicial', dispositivo: 'escritorio', archivo: '01-inicial-escritorio.png' },
  { storyId: 'physical-exercises-importar-ejercicios--inicial-tablet', dispositivo: 'tablet', archivo: '02-inicial-tablet.png' },
  { storyId: 'physical-exercises-importar-ejercicios--inicial-movil', dispositivo: 'movil', archivo: '03-inicial-movil.png' },

  { storyId: 'physical-exercises-importar-ejercicios--con-resultados', dispositivo: 'escritorio', archivo: '04-con-resultados-escritorio.png' },
  { storyId: 'physical-exercises-importar-ejercicios--con-resultados-tablet', dispositivo: 'tablet', archivo: '05-con-resultados-tablet.png' },
  { storyId: 'physical-exercises-importar-ejercicios--con-resultados-movil', dispositivo: 'movil', archivo: '06-con-resultados-movil.png' },

  { storyId: 'physical-exercises-importar-ejercicios--vacio', dispositivo: 'escritorio', archivo: '07-vacio-escritorio.png' },
  { storyId: 'physical-exercises-importar-ejercicios--vacio-movil', dispositivo: 'movil', archivo: '08-vacio-movil.png' },

  { storyId: 'physical-exercises-importar-ejercicios--cargando', dispositivo: 'escritorio', archivo: '09-cargando-escritorio.png' },
  { storyId: 'physical-exercises-importar-ejercicios--cargando-movil', dispositivo: 'movil', archivo: '10-cargando-movil.png' },

  { storyId: 'physical-exercises-importar-ejercicios--error-conexion', dispositivo: 'escritorio', archivo: '11-error-escritorio.png' },
  { storyId: 'physical-exercises-importar-ejercicios--error-conexion-movil', dispositivo: 'movil', archivo: '12-error-movil.png' },

  { storyId: 'physical-exercises-importar-ejercicios--dialogo-asignar-categoria', dispositivo: 'escritorio', archivo: '13-dialogo-asignar-categoria-escritorio.png' },
  { storyId: 'physical-exercises-importar-ejercicios--dialogo-asignar-categoria-tablet', dispositivo: 'tablet', archivo: '14-dialogo-asignar-categoria-tablet.png' },
  { storyId: 'physical-exercises-importar-ejercicios--dialogo-asignar-categoria-movil', dispositivo: 'movil', archivo: '15-dialogo-asignar-categoria-movil.png' },

  { storyId: 'physical-exercises-importar-ejercicios--bloqueo-sin-categorias', dispositivo: 'escritorio', archivo: '16-bloqueo-sin-categorias-escritorio.png' },
  { storyId: 'physical-exercises-importar-ejercicios--bloqueo-sin-categorias-movil', dispositivo: 'movil', archivo: '17-bloqueo-sin-categorias-movil.png' },
];

(async () => {
  const browser = await chromium.launch();
  for (const captura of CAPTURAS) {
    const device = DEVICES[captura.dispositivo];
    const context = await browser.newContext({ viewport: device });
    const page = await context.newPage();
    await page.goto(BASE + captura.storyId, { waitUntil: 'networkidle' });
    // Espera a que Angular + SQLite WASM terminen de inicializar y renderizar.
    await page.waitForSelector('app-shell, .shell, h1', { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(2500);
    await page.screenshot({ path: path.join(OUT_DIR, captura.archivo), fullPage: true });
    console.log('OK ->', captura.archivo);
    await context.close();
  }
  await browser.close();
})();
