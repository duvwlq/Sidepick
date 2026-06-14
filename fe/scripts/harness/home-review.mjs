import {
  absoluteUrl,
  captureScreen,
  createMobilePage,
  ensureOutputDir,
  launchBrowser,
  prepareFigmaComparison,
  waitForStableRender,
  writeReport,
} from './core.mjs';

const outputDir = await ensureOutputDir('home-review');
const browser = await launchBrowser();
const page = await createMobilePage(browser);

const report = [];

async function recordScenario(name, action) {
  await action();
  await waitForStableRender(page);
  const screenshotPath = await captureScreen(page, outputDir, `${name}.png`);
  report.push({
    scenario: name,
    ok: true,
    screenshotPath,
    url: page.url(),
  });
}

try {
  await prepareFigmaComparison(page);

  await page.goto(absoluteUrl('/v1/home'), { waitUntil: 'networkidle' });
  await waitForStableRender(page);

  await recordScenario('home-default', async () => {});

  await recordScenario('home-categories-expanded', async () => {
    await page.getByRole('button', { name: '펼쳐 보기' }).click();
  });

  const ok = report.every((entry) => entry.ok);
  await writeReport(outputDir, 'report.json', {
    ok,
    generatedAt: new Date().toISOString(),
    report,
  });
  console.log(JSON.stringify({ ok, report }, null, 2));
  if (!ok) {
    process.exitCode = 1;
  }
} catch (error) {
  await writeReport(outputDir, 'report.json', {
    ok: false,
    generatedAt: new Date().toISOString(),
    error: error instanceof Error ? error.message : String(error),
    lastBodyText: await page.locator('body').innerText().catch(() => ''),
    report,
  });
  console.error(
    JSON.stringify(
      {
        ok: false,
        message: error instanceof Error ? error.message : String(error),
        lastBodyText: await page.locator('body').innerText().catch(() => ''),
        report,
      },
      null,
      2,
    ),
  );
  process.exitCode = 1;
} finally {
  await browser.close();
}
