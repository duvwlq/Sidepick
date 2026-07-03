import { chromium } from '../fe/node_modules/playwright/index.mjs';

const specs = [
  ['search', 375, 815, 'http://127.0.0.1:4173/search'],
  ['search', 390, 815, 'http://127.0.0.1:4173/search'],
  ['search', 412, 815, 'http://127.0.0.1:4173/search'],
  ['explore', 375, 815, 'http://127.0.0.1:4173/explore?q=%EA%B2%80%EC%83%89%EC%96%B4&mode=search'],
  ['explore', 390, 815, 'http://127.0.0.1:4173/explore?q=%EA%B2%80%EC%83%89%EC%96%B4&mode=search'],
  ['explore', 412, 815, 'http://127.0.0.1:4173/explore?q=%EA%B2%80%EC%83%89%EC%96%B4&mode=search'],
];

const browser = await chromium.launch({ headless: true, chromiumSandbox: false });

try {
  for (const [name, width, height, url] of specs) {
    const page = await browser.newPage({
      viewport: { width, height, deviceScaleFactor: 1 },
    });
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.screenshot({
      path: `tmp/${name}-${width}.png`,
      fullPage: true,
    });
    console.log(`saved tmp/${name}-${width}.png`);
    await page.close();
  }
} finally {
  await browser.close();
}
