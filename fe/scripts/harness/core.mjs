import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { chromium } from 'playwright';

export const BASE_URL = process.env.SIDEPICK_QA_BASE_URL ?? 'http://127.0.0.1:4173';
export const EDGE_PATH =
  process.env.SIDEPICK_QA_BROWSER ??
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
export const OUTPUT_ROOT = path.resolve(os.tmpdir(), 'sidepick-harness');
export const MOBILE_VIEWPORT = { width: 375, height: 812 };
export const FIGMA_COMPARISON_RULES = {
  viewport: MOBILE_VIEWPORT,
  deviceScaleFactor: 1,
  locale: 'ko-KR',
  timezoneId: 'Asia/Seoul',
  colorScheme: 'light',
  reducedMotion: 'reduce',
  screenshotAnimations: 'disabled',
  screenshotCaret: 'hide',
  settleDelayMs: 150,
};

const HARNESS_STORAGE_KEY = 'sidepick.authFlowHarnessSeed';

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

export async function launchBrowser() {
  const executablePath = await pathExists(EDGE_PATH) ? EDGE_PATH : undefined;

  return chromium.launch({
    headless: process.env.SIDEPICK_QA_HEADLESS !== 'false',
    executablePath,
  });
}

export async function createMobilePage(browser) {
  return browser.newPage({
    viewport: FIGMA_COMPARISON_RULES.viewport,
    deviceScaleFactor: FIGMA_COMPARISON_RULES.deviceScaleFactor,
    locale: FIGMA_COMPARISON_RULES.locale,
    timezoneId: FIGMA_COMPARISON_RULES.timezoneId,
    colorScheme: FIGMA_COMPARISON_RULES.colorScheme,
    reducedMotion: FIGMA_COMPARISON_RULES.reducedMotion,
  });
}

export async function ensureOutputDir(name) {
  const targetDir = path.join(OUTPUT_ROOT, name);
  await fs.mkdir(targetDir, { recursive: true });
  return targetDir;
}

export async function seedAuthFlow(page, seed = {}) {
  await page.addInitScript(
    ({ storageKey, payload }) => {
      window.localStorage.setItem(storageKey, JSON.stringify(payload));
    },
    { storageKey: HARNESS_STORAGE_KEY, payload: seed },
  );
}

export async function clearAuthFlowSeed(page) {
  await page.addInitScript((storageKey) => {
    window.localStorage.removeItem(storageKey);
  }, HARNESS_STORAGE_KEY);
}

export async function prepareFigmaComparison(page) {
  await page.addInitScript(() => {
    const style = document.createElement('style');
    style.setAttribute('data-sidepick-harness', 'true');
    style.textContent = `
      *,
      *::before,
      *::after {
        animation: none !important;
        transition: none !important;
        caret-color: transparent !important;
        scroll-behavior: auto !important;
      }
      html {
        scrollbar-gutter: stable both-edges;
      }
      body {
        text-rendering: geometricPrecision;
        -webkit-font-smoothing: antialiased;
      }
    `;
    document.documentElement.appendChild(style);
  });
}

export async function waitForStableRender(page) {
  await page.waitForLoadState('networkidle');
  await page.evaluate(async () => {
    if (document.fonts?.ready) {
      await document.fonts.ready;
    }

    const images = Array.from(document.images ?? []);
    await Promise.all(
      images.map((image) => {
        if (image.complete) {
          return Promise.resolve();
        }

        return new Promise((resolve) => {
          image.addEventListener('load', resolve, { once: true });
          image.addEventListener('error', resolve, { once: true });
        });
      }),
    );
  });
  await page.waitForTimeout(FIGMA_COMPARISON_RULES.settleDelayMs);
}

export async function captureScreen(page, outputDir, fileName) {
  const targetPath = path.join(outputDir, fileName);
  await page.screenshot({
    path: targetPath,
    fullPage: true,
    animations: FIGMA_COMPARISON_RULES.screenshotAnimations,
    caret: FIGMA_COMPARISON_RULES.screenshotCaret,
  });
  return targetPath;
}

export async function writeReport(outputDir, fileName, payload) {
  const targetPath = path.join(outputDir, fileName);
  await fs.writeFile(targetPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  return targetPath;
}

export function absoluteUrl(routePath) {
  return `${BASE_URL}${routePath}`;
}
