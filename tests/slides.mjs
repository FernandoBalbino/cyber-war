// Prints de cada slide da aula (/slide). Uso: PW_CHANNEL=msedge node tests/slides.mjs [url]
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const URL = process.argv[2] ?? 'http://localhost:5173/slide';
mkdirSync('docs/prints', { recursive: true });
const browser = await chromium.launch({ channel: process.env.PW_CHANNEL });
const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(URL);
await page.waitForSelector('.slide');
const total = await page.locator('.sl-dots i').count();
for (let i = 1; i <= total; i++) {
  await page.waitForTimeout(2200); // espera as animações de entrada
  await page.screenshot({ path: `docs/prints/slide-${String(i).padStart(2, '0')}.png` });
  await page.keyboard.press('ArrowRight');
}
console.log(`${total} slides`, errors.length ? `ERROS: ${errors.join(' | ')}` : 'sem erros');
await browser.close();
