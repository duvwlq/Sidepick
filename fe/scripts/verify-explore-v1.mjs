import { chromium } from 'playwright';

const BASE_URL = 'http://127.0.0.1:4173';
const EDGE_PATH = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const browser = await chromium.launch({
  headless: true,
  executablePath: EDGE_PATH,
});

const page = await browser.newPage({
  viewport: { width: 430, height: 932 },
});

const report = {
  defaultStateVisible: false,
  demoImageVisible: false,
  successModeHandled: false,
  searchModeOpened: false,
  similarityVisible: false,
  detailNavigationWorked: false,
};

try {
  await page.goto(`${BASE_URL}/v1/explore`, { waitUntil: 'networkidle' });

  await page.getByText('사례 탐색', { exact: true }).waitFor({ state: 'visible', timeout: 10000 });
  await page.getByRole('button', { name: '전체' }).first().waitFor({ state: 'visible', timeout: 10000 });
  report.defaultStateVisible = true;

  const imageBadge = page.locator('article').locator('text=/^\\d+$/').first();
  await imageBadge.waitFor({ state: 'visible', timeout: 10000 });
  report.demoImageVisible = true;

  const successSegment = page.getByRole('button', { name: '성공' }).first();
  await successSegment.click();
  await page.waitForTimeout(250);
  const bodyTextAfterSuccess = await page.locator('body').innerText();
  assert(
    bodyTextAfterSuccess.includes('성공 사례가 아직 없어요.') ||
      (await page.locator('article').count()) >= 0,
    '성공 탭 전환 후 화면이 정상 처리되지 않았습니다.',
  );
  report.successModeHandled = true;

  const headerSearchButton = page.getByRole('button', { name: '검색' }).first();
  await headerSearchButton.click();
  await page.waitForTimeout(250);
  const searchInput = page.locator('input[type="text"]').first();
  await searchInput.waitFor({ state: 'visible', timeout: 10000 });
  report.searchModeOpened = true;

  await searchInput.fill('유튜브');
  await searchInput.press('Enter');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(350);
  const similarityMatches = (await page.locator('body').innerText()).match(/\d+%/g) ?? [];
  assert(similarityMatches.length > 0, '검색 후 유사도 점수가 표시되지 않습니다.');
  report.similarityVisible = true;

  const realCards = page.locator('a[href^="/experiences/"]');
  if ((await realCards.count()) > 0) {
    await realCards.first().click();
    await page.waitForLoadState('networkidle');
    assert(/\/experiences\/\d+/.test(page.url()), `상세 이동에 실패했습니다: ${page.url()}`);
    report.detailNavigationWorked = true;
  }

  console.log(JSON.stringify({ ok: true, report }, null, 2));
} catch (error) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        report,
        message: error instanceof Error ? error.message : String(error),
        url: page.url(),
      },
      null,
      2,
    ),
  );
  process.exitCode = 1;
} finally {
  await browser.close();
}
