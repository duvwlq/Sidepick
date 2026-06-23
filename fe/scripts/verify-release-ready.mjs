import { chromium } from 'playwright';

const BASE_URL = process.env.SIDEPICK_QA_BASE_URL ?? 'http://127.0.0.1:4173';
const EDGE_PATH =
  process.env.SIDEPICK_QA_BROWSER ??
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

const mobileViewport = { width: 390, height: 1200 };

const mockUser = {
  id: 7,
  email: 'sidepick@gmail.com',
  nickname: '닉네임',
  fullName: '홍길동',
  birthDate: '1998-01-01',
  gender: 'FEMALE',
  region: '서울',
  signupPurposes: ['실패 사례 탐색'],
  experienceStatus: 'HAS_EXPERIENCE',
  ageGroup: '20S',
  profileImage: null,
  authProvider: 'KAKAO',
  emailVerified: true,
  profileCompleted: true,
  createdAt: '2026-06-01T09:00:00Z',
};

const categories = [
  { id: 1, name: '온라인 판매·이커머스', slug: 'online-commerce', color: '#5A876E', type: 'business_field' },
  { id: 2, name: '콘텐츠·SNS 기반', slug: 'content-sns', color: '#5A876E', type: 'business_field' },
  { id: 3, name: '디지털 상품·지식 판매', slug: 'digital-products', color: '#5A876E', type: 'business_field' },
  { id: 4, name: '플랫폼 기반 노동형', slug: 'platform-labor', color: '#5A876E', type: 'business_field' },
  { id: 5, name: '재능 판매·프리랜서', slug: 'talent-freelance', color: '#5A876E', type: 'business_field' },
  { id: 6, name: '투자·재테크', slug: 'investment', color: '#5A876E', type: 'business_field' },
  { id: 7, name: '오프라인 기반 부업', slug: 'offline-sidejob', color: '#5A876E', type: 'business_field' },
];

const sampleDate = '2026.00.00';

const sampleBodies = {
  short: '본문 텍스트 미리보기 본문 텍스트 미리보기 본문 텍스트 미리보기 본문...',
  long:
    '본문 텍스트 미리보기 본문 텍스트 미리보기 본문 텍스트 미리보기 본문 텍스트 미리보기 본문 텍스트 미리보기 본문...',
};

const sampleAnalysis = {
  structuredSummary: '카테고리 내에서 자주 보이는 실패 원인을 간단히 정리한 요약입니다.',
  extractedPatterns: ['시장 검증 부족', '광고 효율 저하'],
  keywords: ['고객 확보(마케팅)', '수익 구조 이해'],
  failureCategory: '시장 조사 부족',
  riskLevel: 'HIGH',
  riskFactors: ['광고 비용 부담'],
  successFactors: ['작은 실험', '상세페이지 개선'],
  confidenceScore: 0.99,
};

function makeExperience(id, overrides = {}) {
  return {
    id,
    author: mockUser,
    category: categories[0],
    caseStatus: 'FAILURE',
    title: '제목',
    content: sampleBodies.long,
    businessType: '스마트스토어',
    investmentAmount: 1000000,
    durationMonths: 6,
    weeklyHours: 20,
    averageDailyHours: '3~4시간',
    isConcurrentWithMainJob: true,
    monthlyRevenue: 1000000,
    failureReason: '시장 조사 부족',
    failureReasons: ['시장 조사 부족'],
    difficulties: ['고객 확보(마케팅)', '수익 구조 이해'],
    difficultyEtc: null,
    difficultyExtra: null,
    targetMarket: '20대 여성',
    marketingChannels: ['인스타그램', '스마트스토어 광고'],
    lessonsLearned: '작게 실험하고 반응을 본 다음 예산을 써야 합니다.',
    wouldRetry: true,
    analysis: sampleAnalysis,
    structuredData: {},
    viewCount: 999,
    likeCount: 999,
    bookmarkCount: 999,
    hasPatternAnalysis: true,
    createdAt: sampleDate,
    updatedAt: sampleDate,
    ...overrides,
  };
}

const experiences = [
  makeExperience(1),
  makeExperience(2, {
    category: categories[1],
    title: '제목',
    content: sampleBodies.short,
  }),
  makeExperience(3, {
    caseStatus: 'SUCCESS',
    title: '제목',
    content: sampleBodies.short,
    likeCount: 999,
    bookmarkCount: 999,
  }),
];

const writtenExperiences = [
  experiences[0],
  experiences[1],
  ...Array.from({ length: 997 }, (_, index) =>
    makeExperience(100 + index, {
      title: '제목',
      content: sampleBodies.short,
      viewCount: 999,
      likeCount: 999,
      bookmarkCount: 999,
      createdAt: sampleDate,
      updatedAt: sampleDate,
    }),
  ),
];

const bookmarkedExperiences = [
  experiences[0],
  experiences[1],
  experiences[2],
  ...Array.from({ length: 996 }, (_, index) =>
    makeExperience(2000 + index, {
      caseStatus: index % 2 === 0 ? 'SUCCESS' : 'FAILURE',
      title: '제목',
      content: sampleBodies.short,
      viewCount: 999,
      likeCount: 999,
      bookmarkCount: 999,
      createdAt: sampleDate,
      updatedAt: sampleDate,
    }),
  ),
];

const recentExperiences = [
  experiences[1],
  experiences[0],
  ...Array.from({ length: 997 }, (_, index) =>
    makeExperience(3000 + index, {
      title: '제목',
      content: sampleBodies.short,
      viewCount: 999,
      likeCount: 999,
      bookmarkCount: 999,
      createdAt: sampleDate,
      updatedAt: sampleDate,
    }),
  ),
];

const listPayload = {
  experiences,
  pagination: {
    page: 0,
    size: 10,
    totalElements: experiences.length,
    totalPages: 1,
    hasNext: false,
  },
};

const comparePayload = {
  experiences: [experiences[0], experiences[2]],
  commonPatterns: ['시장 반응 확인 전에 예산을 집행함'],
  differences: ['성공 사례는 작은 테스트 후 상세페이지를 조정함'],
  recommendations: ['광고보다 시장 반응 테스트를 먼저 진행하세요'],
};

const failurePatternPayload = {
  category: 'online-commerce',
  labelKo: '온라인 판매·이커머스',
  total: 12,
  sufficientData: true,
  explanation: '카테고리의 50%가 시장 조사 부족을 주요 원인으로 나타내고 있어요.',
  patterns: [
    { label: '시장 조사 부족', count: 6, percent: 50 },
    { label: '수익 구조 이해 부족', count: 4, percent: 33.3 },
    { label: '광고 과잉', count: 3, percent: 25 },
    { label: '고객 확보(마케팅)', count: 2, percent: 16.7 },
    { label: '운영 지속성', count: 2, percent: 16.7 },
  ],
};

const failureTimingPayload = {
  category: 'online-commerce',
  total: 12,
  sufficientData: true,
  explanation: '실패는 6개월~1년 구간에 가장 많이 모여 있어요.',
  peakBucket: '6-12m',
  distribution: [
    { bucket: 'under-1m', label: '1개월 미만', order: 1, count: 1, percent: 8.3 },
    { bucket: '1-3m', label: '1~3개월', order: 2, count: 2, percent: 16.7 },
    { bucket: '3-6m', label: '3~6개월', order: 3, count: 3, percent: 25 },
    { bucket: '6-12m', label: '6개월~1년', order: 4, count: 4, percent: 33.3 },
    { bucket: 'over-1y', label: '1년 이상', order: 5, count: 2, percent: 16.7 },
  ],
};

function jsonResponse(body) {
  return {
    status: 200,
    contentType: 'application/json; charset=utf-8',
    body: JSON.stringify({
      success: true,
      message: 'OK',
      data: body,
      timestamp: new Date().toISOString(),
    }),
  };
}

async function installApiMocks(page, auth = true) {
  if (auth) {
    await page.addInitScript((user) => {
      localStorage.setItem('sidepick.accessToken', 'mock-access-token');
      localStorage.setItem('sidepick.refreshToken', 'mock-refresh-token');
      localStorage.setItem('sidepick.user', JSON.stringify(user));
    }, mockUser);
  } else {
    await page.addInitScript(() => {
      localStorage.removeItem('sidepick.accessToken');
      localStorage.removeItem('sidepick.refreshToken');
      localStorage.removeItem('sidepick.user');
    });
  }

  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const method = request.method();
    const url = new URL(request.url());
    const pathname = url.pathname;

    if (pathname.endsWith('/users/me') && method === 'GET') {
      return route.fulfill(jsonResponse({ user: mockUser }));
    }
    if (pathname.endsWith('/users/me/experiences')) {
      return route.fulfill(jsonResponse(writtenExperiences));
    }
    if (pathname.endsWith('/users/me/bookmarks')) {
      return route.fulfill(jsonResponse(bookmarkedExperiences));
    }
    if (pathname.endsWith('/users/me/recent-views')) {
      return route.fulfill(jsonResponse(recentExperiences));
    }
    if (pathname.endsWith('/users/me/analysis-history')) {
      return route.fulfill(
        jsonResponse([
          {
            experienceId: 1,
            analysisId: 1001,
            reportStatus: 'READY',
            title: experiences[0].title,
            summary: experiences[0].analysis.structuredSummary,
            failureCategory: experiences[0].analysis.failureCategory,
            riskLevel: experiences[0].analysis.riskLevel,
            processedAt: '2026-06-05T00:00:00Z',
            createdAt: experiences[0].createdAt,
          },
        ]),
      );
    }
    if (pathname.endsWith('/users/me/home-feed')) {
      return route.fulfill(jsonResponse({ strategy: 'personalized', preferredCategoryIds: [1, 2], experiences: experiences.slice(0, 2) }));
    }
    if (pathname.endsWith('/users/me/account-settings') && method === 'PUT') {
      return route.fulfill(jsonResponse({ user: mockUser }));
    }
    if (pathname.endsWith('/auth/login') && method === 'POST') {
      return route.fulfill(jsonResponse({ accessToken: 'mock-access-token', refreshToken: 'mock-refresh-token', user: mockUser }));
    }
    if (pathname.endsWith('/auth/email/verify/send') && method === 'POST') {
      return route.fulfill(jsonResponse({ email: 'sidepick@gmail.com', verificationToken: 'verify-token' }));
    }
    if (pathname.endsWith('/auth/email/verify/confirm') && method === 'POST') {
      return route.fulfill(jsonResponse({ verified: true }));
    }
    if (pathname.endsWith('/auth/nickname/check') && method === 'POST') {
      return route.fulfill(jsonResponse({ available: true, normalizedNickname: '사이드픽' }));
    }
    if (pathname.endsWith('/auth/signup') && method === 'POST') {
      return route.fulfill(jsonResponse({ accessToken: 'mock-access-token', refreshToken: 'mock-refresh-token', user: mockUser }));
    }
    if (pathname.endsWith('/auth/oauth/state') && method === 'POST') {
      return route.fulfill(jsonResponse({ state: 'mock-oauth-state', expiresAt: '2026-06-05T12:00:00Z' }));
    }
    if (pathname.endsWith('/categories') && method === 'GET') {
      return route.fulfill(jsonResponse(categories));
    }
    if (pathname.endsWith('/experiences') && method === 'GET') {
      return route.fulfill(jsonResponse(listPayload));
    }
    if (pathname.endsWith('/experiences') && method === 'POST') {
      return route.fulfill(jsonResponse({ ...experiences[0], id: 99 }));
    }
    if (pathname.endsWith('/experiences/search') && method === 'GET') {
      return route.fulfill(jsonResponse(listPayload));
    }
    if (pathname.endsWith('/stats/failure-pattern') || pathname.endsWith('/stats/failure-patterns')) {
      return route.fulfill(jsonResponse(failurePatternPayload));
    }
    if (pathname.endsWith('/stats/failure-timing')) {
      return route.fulfill(jsonResponse(failureTimingPayload));
    }
    if (pathname.endsWith('/experiences/compare') && method === 'POST') {
      return route.fulfill(jsonResponse(comparePayload));
    }
    if (/\/experiences\/\d+\/success-cases$/.test(pathname)) {
      return route.fulfill(jsonResponse([experiences[2]]));
    }
    if (/\/experiences\/\d+\/bookmarks\/me$/.test(pathname)) {
      return route.fulfill(jsonResponse({ experienceId: 1, bookmarked: true, bookmarkCount: 12 }));
    }
    if (/\/experiences\/\d+\/bookmarks$/.test(pathname)) {
      return route.fulfill(jsonResponse({ experienceId: 1, bookmarked: method === 'POST', bookmarkCount: 12 }));
    }
    if (/\/experiences\/\d+\/reactions\/me$/.test(pathname)) {
      return route.fulfill(jsonResponse({ experienceId: 1, heartCount: 4, tearCount: 7, myReactions: ['HEART'] }));
    }
    if (/\/experiences\/\d+\/reactions(\/(HEART|TEAR))?$/.test(pathname)) {
      return route.fulfill(jsonResponse({ experienceId: 1, heartCount: 4, tearCount: 7, myReactions: ['HEART'] }));
    }
    const updateMatch = pathname.match(/\/experiences\/(\d+)$/);
    if (updateMatch && method === 'PUT') {
      const id = Number(updateMatch[1]);
      return route.fulfill(jsonResponse({ ...experiences[0], id }));
    }
    if (updateMatch && method === 'GET') {
      const id = Number(updateMatch[1]);
      return route.fulfill(jsonResponse(experiences.find((item) => item.id === id) ?? experiences[0]));
    }

    return route.continue();
  });
}

function createCounters() {
  return {
    deadLink: 0,
    deadButton: 0,
    deadMenu: 0,
    failures: [],
  };
}

async function expectNavigation(counters, action, expectedPath, type = 'link') {
  try {
    await action();
  } catch (error) {
    if (type === 'menu') counters.deadMenu += 1;
    else if (type === 'button') counters.deadButton += 1;
    else counters.deadLink += 1;
    counters.failures.push(`${type}: ${expectedPath} (${error instanceof Error ? error.message : String(error)})`);
    return;
  }
}

async function runChecks(page, counters) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await expectNavigation(counters, async () => {
    await page.getByRole('link', { name: '회원가입' }).click();
    await page.waitForURL('**/signup/email**');
  }, '/login -> /signup/email');

  await expectNavigation(counters, async () => {
    await page.getByLabel('뒤로가기').click();
    await page.waitForURL((url) => url.pathname === '/auth' || url.pathname === '/login');
  }, '/signup/email -> /login', 'button');

  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
  await expectNavigation(counters, async () => {
    await page.getByLabel('검색창 열기').click();
    await page.waitForURL('**/search');
  }, '/ -> /search', 'button');

  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
  await expectNavigation(counters, async () => {
    await page.getByRole('button', { name: '탐색' }).click();
    await page.waitForURL('**/explore');
  }, '/ -> /explore', 'menu');

  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
  await expectNavigation(counters, async () => {
    await page.getByRole('button', { name: 'MY' }).click();
    await page.waitForURL('**/mypage');
  }, '/ -> /mypage', 'menu');

  await page.goto(`${BASE_URL}/explore`, { waitUntil: 'networkidle' });
  await expectNavigation(counters, async () => {
    await page.getByRole('link').filter({ hasText: experiences[0].title }).first().click();
    await page.waitForURL('**/experiences/1');
  }, '/explore -> /experiences/1');

  await page.goto(`${BASE_URL}/experiences/1`, { waitUntil: 'networkidle' });
  await expectNavigation(counters, async () => {
    await page.getByRole('button', { name: '성공 사례 비교' }).click();
    await page.waitForURL('**/success-comparison');
  }, '/detail -> /success-comparison', 'button');

  await page.goto(`${BASE_URL}/mypage`, { waitUntil: 'networkidle' });
  await expectNavigation(counters, async () => {
    await page.getByRole('banner').getByRole('button', { name: '프로필 수정' }).click();
    await page.waitForURL('**/mypage/profile/edit');
  }, '/mypage -> /mypage/profile/edit', 'button');

  await page.goto(`${BASE_URL}/mypage`, { waitUntil: 'networkidle' });
  await expectNavigation(counters, async () => {
    await page.getByRole('button', { name: '작성한 글' }).first().click();
    await page.waitForURL('**/mypage/written');
  }, '/mypage -> /mypage/written', 'button');

  await page.goto(`${BASE_URL}/mypage`, { waitUntil: 'networkidle' });
  await expectNavigation(counters, async () => {
    await page.getByRole('button', { name: '북마크' }).first().click();
    await page.waitForURL('**/mypage/bookmarks');
  }, '/mypage -> /mypage/bookmarks', 'button');

  await page.goto(`${BASE_URL}/mypage`, { waitUntil: 'networkidle' });
  await expectNavigation(counters, async () => {
    await page.getByRole('button', { name: '최근 본 글' }).first().click();
    await page.waitForURL('**/mypage/recent');
  }, '/mypage -> /mypage/recent', 'button');

  await page.goto(`${BASE_URL}/mypage/written`, { waitUntil: 'networkidle' });
  await expectNavigation(counters, async () => {
    await page.getByRole('button').filter({ hasText: experiences[0].title }).first().click();
    await page.waitForURL('**/experiences/1');
  }, '/mypage/written card -> /experiences/1', 'button');

  await page.goto(`${BASE_URL}/create`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: '온라인 판매·이커머스' }).click();
  await expectNavigation(counters, async () => {
    await page.getByRole('button', { name: /다음 단계|다음으로/ }).click();
    await page.getByText('2/4 단계').waitFor({ state: 'visible' });
  }, '/create step1 -> step2', 'button');

  await page.getByRole('button', { name: '선택 안 함' }).first().click();
  await page.getByRole('button', { name: '1개월 미만' }).click();
  await page.getByRole('button', { name: '선택 안 함' }).first().click();
  await page.getByRole('button', { name: '1시간 미만' }).click();
  await page.getByRole('button', { name: '네' }).click();
  await expectNavigation(counters, async () => {
    await page.getByRole('button', { name: /다음 단계|다음으로/ }).click();
    await page.getByText('3/4 단계').waitFor({ state: 'visible' });
  }, '/create step2 -> step3', 'button');

  await expectNavigation(counters, async () => {
    await page.locator('header button').first().click();
    await page.getByText('2/4 단계').waitFor({ state: 'visible' });
  }, '/create step3 -> step2 back', 'button');
}

async function main() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: EDGE_PATH,
  });
  const page = await browser.newPage({ viewport: mobileViewport });
  const counters = createCounters();

  try {
    await installApiMocks(page, true);
    await runChecks(page, counters);
  } finally {
    await browser.close();
  }

  console.log(JSON.stringify(counters, null, 2));
  if (counters.deadLink || counters.deadButton || counters.deadMenu) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
