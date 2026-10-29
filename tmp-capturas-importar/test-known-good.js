const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  await page.goto('http://localhost:6006/iframe.html?viewMode=story&id=physical-exercises-pantallas--buscar-ejercicios', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  const info = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    hasDesktopNav: !!document.querySelector('.shell__menu-escritorio'),
    hasMobileNav: !!document.querySelector('.shell__barra-inferior'),
  }));
  console.log(JSON.stringify(info));
  await page.screenshot({ path: path.resolve(__dirname, 'test-known-good.png'), fullPage: true });
  await browser.close();
})();
