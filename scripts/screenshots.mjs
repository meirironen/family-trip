/**
 * Captures the manifest screenshots from the running app.
 *
 *   npm run build && npm run preview      # in one terminal
 *   npx playwright install chromium       # once
 *   npm run screenshots                   # in another
 *
 * Sizes must match what public/manifest.webmanifest declares, or Chrome
 * warns about a mismatch.
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const URL = process.env.PREVIEW_URL ?? 'http://localhost:4173';
const OUT = 'public/screenshots';

const SHOTS = [
  { file: 'wide-1280x800.png', width: 1280, height: 800, mobile: false },
  { file: 'narrow-390x844.png', width: 390, height: 844, mobile: true },
];

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();

for (const shot of SHOTS) {
  const page = await browser.newPage({
    viewport: { width: shot.width, height: shot.height },
    isMobile: shot.mobile,
    hasTouch: shot.mobile,
    deviceScaleFactor: 1,
  });
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200); // let the board settle
  await page.screenshot({ path: `${OUT}/${shot.file}` });
  await page.close();
  console.log(`captured ${shot.file}`);
}

await browser.close();
