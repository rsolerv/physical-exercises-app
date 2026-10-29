const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  page.on('console', (msg) => console.log('CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', (err) => console.log('PAGEERROR:', err.message));
  await page.goto('http://localhost:6006/iframe.html?viewMode=story&id=physical-exercises-importar-ejercicios--inicial', { waitUntil: 'networkidle' });
  for (let i = 0; i < 6; i++) {
    await page.waitForTimeout(1000);
    const info = await page.evaluate(() => ({
      innerWidth: window.innerWidth,
      hasDesktopNav: !!document.querySelector('.shell__menu-escritorio'),
      hasMobileNav: !!document.querySelector('.shell__barra-inferior'),
      hasRiel: !!document.querySelector('.shell__riel-lateral'),
    }));
    console.log(i, JSON.stringify(info));
  }
  await page.screenshot({ path: path.resolve(__dirname, 'test-mine-debug.png'), fullPage: true });
  await browser.close();
})();
