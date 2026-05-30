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
  landedOnHomeV1: false,
  coreSectionsVisible: false,
  searchFlowWorked: false,
  categoryExpandWorked: false,
  allViewFlowWorked: false,
  popularTabWorked: false,
  sortToggleWorked: false,
  cardNavigationWorked: false,
  fabGuardWorked: false,
  bottomNavWorked: false,
};

try {
  await page.goto(`${BASE_URL}/v1/home`, { waitUntil: 'networkidle' });
  report.landedOnHomeV1 = /\/v1\/home$/.test(page.url());

  await page.getByRole('heading', { name: '부업 카테고리' }).waitFor({ state: 'visible', timeout: 10000 });
  await page.getByRole('heading', { name: '인기 부업' }).waitFor({ state: 'visible', timeout: 10000 });
  await page.getByRole('heading', { name: '탐색' }).waitFor({ state: 'visible', timeout: 10000 });
  report.coreSectionsVisible = true;

  await page.getByLabel('검색창 열기').click();
  await page.waitForLoadState('networkidle');
  assert(page.url().includes('/v1/explore?mode=search'), `검색창 이동이 실패했습니다: ${page.url()}`);
  report.searchFlowWorked = true;

  await page.goto(`${BASE_URL}/v1/home`, { waitUntil: 'networkidle' });

  let categoryCards = page.locator('a[href^="/v1/explore?categoryId="]');
  const initialCount = await categoryCards.count();
  assert(initialCount === 4, `초기 카테고리 카드 수가 4개가 아닙니다: ${initialCount}`);

  const expandButton = page.getByRole('button', { name: '펼쳐 보기' });
  await expandButton.click();
  await page.waitForTimeout(250);
  categoryCards = page.locator('a[href^="/v1/explore?categoryId="]');
  const expandedCount = await categoryCards.count();
  assert(expandedCount === 8, `펼쳐 보기 후 카테고리 카드 수가 8개가 아닙니다: ${expandedCount}`);
  report.categoryExpandWorked = true;

  await page.getByRole('button', { name: '전체보기' }).click();
  await page.waitForLoadState('networkidle');
  assert(page.url().includes('/v1/explore'), `전체보기 이동이 실패했습니다: ${page.url()}`);
  report.allViewFlowWorked = true;

  await page.goto(`${BASE_URL}/v1/home`, { waitUntil: 'networkidle' });
  const shoppingMallTab = page.getByRole('button', { name: '쇼핑몰' });
  await shoppingMallTab.click();
  await page.waitForTimeout(250);
  assert((await shoppingMallTab.getAttribute('aria-pressed')) === 'true', '인기 부업 탭 전환이 동작하지 않습니다.');
  report.popularTabWorked = true;

  const popularCaseTab = page.getByRole('button', { name: '인기 사례' });
  await popularCaseTab.click();
  await page.waitForTimeout(250);
  assert((await popularCaseTab.getAttribute('aria-pressed')) === 'true', '탐색 세그먼트 전환이 동작하지 않습니다.');
  report.sortToggleWorked = true;

  const firstCard = page.locator('a[href^="/experiences/"]').first();
  await firstCard.waitFor({ state: 'visible', timeout: 10000 });
  await firstCard.click();
  await page.waitForLoadState('networkidle');
  assert(/\/experiences\/\d+/.test(page.url()), `카드 상세 이동이 실패했습니다: ${page.url()}`);
  report.cardNavigationWorked = true;

  await page.goto(`${BASE_URL}/v1/home`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: '경험 작성' }).click();
  await page.waitForLoadState('networkidle');
  assert(page.url().includes('/auth?next=%2Fcreate'), `작성 FAB 로그인 가드가 실패했습니다: ${page.url()}`);
  report.fabGuardWorked = true;

  await page.goto(`${BASE_URL}/v1/home`, { waitUntil: 'networkidle' });
  const exploreNav = page.getByRole('button', { name: '탐색' }).last();
  await exploreNav.click();
  await page.waitForLoadState('networkidle');
  assert(page.url().includes('/v1/explore'), `하단 네비 이동이 실패했습니다: ${page.url()}`);
  report.bottomNavWorked = true;

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
