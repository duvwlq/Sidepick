import { chromium } from 'playwright';

const BASE_URL = 'http://127.0.0.1:4173';
const EDGE_PATH = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const EXPECTED_COLORS = new Set(['rgb(90, 135, 110)', 'rgb(208, 123, 72)', 'rgb(138, 138, 138)']);

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
  searchInputVisible: false,
  enteredSearch: false,
  similarityVisible: false,
  similarityColorsValid: false,
  feedToggleWorked: false,
  detailNavigationWorked: false,
};

try {
  await page.goto(`${BASE_URL}/explore`, { waitUntil: 'networkidle' });

  const searchInput = page.getByLabel('검색어');
  await searchInput.waitFor({ state: 'visible', timeout: 10000 });
  report.searchInputVisible = true;

  await searchInput.fill('쇼핑몰');
  await searchInput.press('Enter');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(400);
  report.enteredSearch = true;

  const bodyText = await page.locator('body').innerText();
  const similarityMatches = bodyText.match(/\d+%/g) ?? [];
  const similarityCount = similarityMatches.length;
  assert(similarityCount > 0, '유사도 점수가 표시되지 않았습니다.');
  report.similarityVisible = true;

  const sampledColors = [];
  for (const match of similarityMatches) {
    const locator = page.getByText(match, { exact: true });
    const count = await locator.count();
    if (count === 1) {
      sampledColors.push(await locator.first().evaluate((node) => getComputedStyle(node).color));
    }
  }
  assert(sampledColors.length > 0, '유사도 색상을 읽지 못했습니다.');
  assert(sampledColors.every((color) => EXPECTED_COLORS.has(color)), `유사도 색상이 기준과 다릅니다: ${sampledColors.join(', ')}`);
  report.similarityColorsValid = true;

  const successTab = page.getByRole('button', { name: '성공' });
  await successTab.click();
  await page.waitForTimeout(300);
  const successPressed = await successTab.getAttribute('aria-pressed');
  assert(successPressed === 'true', '성공 세그먼트 활성화에 실패했습니다.');
  report.feedToggleWorked = true;

  const allButtons = page.getByRole('button', { name: '전체' });
  assert((await allButtons.count()) >= 2, '전체 버튼 후보를 충분히 찾지 못했습니다.');
  const allTab = allButtons.nth(1);
  await allTab.click();
  await page.waitForTimeout(300);

  const firstCard = page.locator('a[href^="/experiences/"]').first();
  await firstCard.waitFor({ state: 'visible', timeout: 10000 });
  await firstCard.click();
  await page.waitForLoadState('networkidle');
  assert(/\/experiences\/\d+/.test(page.url()), `상세 페이지 이동 실패: ${page.url()}`);
  report.detailNavigationWorked = true;

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
