import {
  absoluteUrl,
  captureScreen,
  createMobilePage,
  ensureOutputDir,
  launchBrowser,
  writeReport,
} from './core.mjs';

const outputDir = await ensureOutputDir('signup-smoke');
const browser = await launchBrowser();
const page = await createMobilePage(browser);

const report = {
  landedOnSignup: false,
  movedToIdentity: false,
  movedToIdentityDetails: false,
  movedToVerify: false,
  movedToUsername: false,
  movedToPassword: false,
  finalUrl: '',
};

const LABEL_VERIFY = '\uBCF8\uC778 \uC778\uC99D\uD558\uAE30';
const LABEL_NEXT = '\uB2E4\uC74C\uC73C\uB85C';
const LABEL_CHECK_DUPLICATE = '\uC911\uBCF5\uD655\uC778';

async function installApiMocks() {
  await page.route('**/api/auth/email-verifications', async (route) => {
    if (route.request().method() === 'POST') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify({
          success: true,
          message: 'OK',
          data: {
            email: 'harness@example.com',
            status: 'PENDING',
            verificationCode: '123456',
            expiresAt: '2099-01-01T00:00:00Z',
          },
          timestamp: new Date().toISOString(),
        }),
      });
    }

    return route.fallback();
  });

  await page.route('**/api/auth/email-verifications/confirm', async (route) => {
    if (route.request().method() === 'POST') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify({
          success: true,
          message: 'OK',
          data: {
            email: 'harness@example.com',
            status: 'CONFIRMED',
            verificationCode: null,
            expiresAt: '2099-01-01T00:00:00Z',
          },
          timestamp: new Date().toISOString(),
        }),
      });
    }

    return route.fallback();
  });
}

try {
  await installApiMocks();

  await page.goto(absoluteUrl('/signup/email?next=%2F'), { waitUntil: 'networkidle' });
  report.landedOnSignup = page.url().includes('/signup/email');
  await page.locator('input[type="email"]').fill('harness@example.com');
  await page.getByRole('button', { name: LABEL_VERIFY }).click();

  await page.waitForURL(/signup\/identity/, { timeout: 10000 });
  report.movedToIdentity = page.url().includes('/signup/identity');
  await page.locator('input[type="text"]').fill('0101013');
  await page.getByRole('button', { name: LABEL_VERIFY }).click();

  await page.waitForURL(/signup\/identity\/details/, { timeout: 10000 });
  report.movedToIdentityDetails = page.url().includes('/signup/identity/details');
  await page.locator('input[autocomplete="name"]').fill('\uD14C\uC2A4\uD2B8');
  await page.getByRole('button', { name: LABEL_VERIFY }).click();

  await page.waitForURL(/signup\/verify/, { timeout: 10000 });
  report.movedToVerify = page.url().includes('/signup/verify');
  await captureScreen(page, outputDir, 'signup-verify.png');

  await page.locator('input').first().fill('123456');
  await page.getByRole('button', { name: LABEL_NEXT }).click();

  await page.waitForURL(/signup\/username/, { timeout: 10000 });
  report.movedToUsername = page.url().includes('/signup/username');
  await page.locator('input[type="text"]').fill('harnessId');
  await page.getByRole('button', { name: LABEL_CHECK_DUPLICATE }).click();
  await page.getByRole('button', { name: LABEL_NEXT }).click();

  await page.waitForURL(/signup\/password/, { timeout: 10000 });
  report.movedToPassword = page.url().includes('/signup/password');
  report.finalUrl = page.url();
  await captureScreen(page, outputDir, 'signup-password.png');

  const ok =
    report.landedOnSignup &&
    report.movedToIdentity &&
    report.movedToIdentityDetails &&
    report.movedToVerify &&
    report.movedToUsername &&
    report.movedToPassword;
  await writeReport(outputDir, 'report.json', { ok, generatedAt: new Date().toISOString(), report });
  console.log(JSON.stringify({ ok, report }, null, 2));
  if (!ok) {
    process.exitCode = 1;
  }
} catch (error) {
  await writeReport(outputDir, 'report.json', {
    ok: false,
    generatedAt: new Date().toISOString(),
    report,
    error: error instanceof Error ? error.message : String(error),
  });
  console.error(
    JSON.stringify(
      {
        ok: false,
        report,
        message: error instanceof Error ? error.message : String(error),
      },
      null,
      2,
    ),
  );
  process.exitCode = 1;
} finally {
  await browser.close();
}
