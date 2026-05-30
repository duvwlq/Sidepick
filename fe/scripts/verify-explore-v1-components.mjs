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
  loaded: false,
  categoryFilterWorked: false,
  sortWorked: false,
  failureFeedWorked: false,
  successFeedWorked: false,
  detailNavigationWorked: false,
  searchModeWorked: false,
  createGuardWorked: false,
};

try {
  await page.goto(`${BASE_URL}/v1/explore`, { waitUntil: 'networkidle' });
  await page.getByText('사례 탐색', { exact: true }).waitFor({ state: 'visible', timeout: 10000 });
  report.loaded = true;

  await page.getByRole('button', { name: '온라인 판매·이커머스' }).click();
  await page.waitForTimeout(250);
  assert(page.url().includes('categoryId=1'), `카테고리 URL 반영 실패: ${page.url()}`);
  report.categoryFilterWorked = true;

  await page.getByRole('button', { name: '최신순' }).click();
  await page.getByRole('button', { name: '조회수순' }).waitFor({ state: 'visible', timeout: 5000 });
  await page.getByRole('button', { name: '조회수순' }).click();
  await page.waitForTimeout(250);
  await page.getByRole('button', { name: '조회수순' }).first().waitFor({ state: 'visible', timeout: 5000 });
  report.sortWorked = true;

  await page.locator('button[aria-pressed]').filter({ hasText: '실패' }).click();
  await page.waitForTimeout(250);
  assert(page.url().includes('feed=failure'), `실패 피드 URL 반영 실패: ${page.url()}`);
  report.failureFeedWorked = true;

  await page.locator('button[aria-pressed]').filter({ hasText: '성공' }).click();
  await page.waitForTimeout(250);
  assert(page.url().includes('feed=success'), `성공 피드 URL 반영 실패: ${page.url()}`);
  const successCtaCount = await page.getByRole('button', { name: '성공 사례 보기' }).count();
  assert(successCtaCount === 0, `성공 피드에서 성공 사례 보기 CTA 잔존: ${successCtaCount}`);
  report.successFeedWorked = true;

  const firstCard = page.locator('a[href^="/experiences/"]').first();
  await firstCard.waitFor({ state: 'visible', timeout: 5000 });
  await firstCard.click();
  await page.waitForLoadState('networkidle');
  assert(/\/experiences\/\d+/.test(page.url()), `카드 상세 이동 실패: ${page.url()}`);
  report.detailNavigationWorked = true;

  await page.goto(`${BASE_URL}/v1/explore`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: '검색' }).first().click();
  const searchInput = page.getByLabel('검색어 입력');
  await searchInput.waitFor({ state: 'visible', timeout: 5000 });
  await searchInput.fill('부업');
  await searchInput.press('Enter');
  await page.waitForLoadState('networkidle');
  assert(page.url().includes('q=%EB%B6%80%EC%97%85'), `검색 모드 전환 실패: ${page.url()}`);
  report.searchModeWorked = true;

  await page.goto(`${BASE_URL}/v1/explore`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: '경험 작성' }).click();
  await page.waitForLoadState('networkidle');
  assert(page.url().includes('/auth?next=%2Fcreate'), `작성 가드 실패: ${page.url()}`);
  report.createGuardWorked = true;

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
