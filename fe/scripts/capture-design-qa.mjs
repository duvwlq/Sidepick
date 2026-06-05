import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const BASE_URL = process.env.SIDEPICK_QA_BASE_URL ?? 'http://127.0.0.1:4173';
const EDGE_PATH =
  process.env.SIDEPICK_QA_BROWSER ??
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

const OUTPUT_DIR = path.resolve(process.cwd(), '..', '.qa', 'figma-react');

const desktopViewport = { width: 1440, height: 1600 };
const mobileViewports = [
  { width: 375, height: 1400, suffix: 'mobile-375' },
  { width: 390, height: 1400, suffix: 'mobile-390' },
  { width: 412, height: 1400, suffix: 'mobile-412' },
];

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

const categories = {
  ecommerce: {
    id: 1,
    name: '온라인 판매·이커머스',
    description: '',
    icon: '',
    color: '#5A876E',
    slug: 'online-commerce',
    type: 'business_field',
  },
  content: {
    id: 2,
    name: '콘텐츠·SNS 기반',
    description: '',
    icon: '',
    color: '#5A876E',
    slug: 'content-sns',
    type: 'business_field',
  },
};

const sampleDate = '2026.00.00';

const sampleBodies = {
  short: '본문 텍스트 미리보기 본문 텍스트 미리보기 본문 텍스트 미리보기 본문...',
  long:
    '본문 텍스트 미리보기 본문 텍스트 미리보기 본문 텍스트 미리보기 본문 텍스트 미리보기 본문 텍스트 미리보기 본문...',
};

const sampleAnalysis = {
  structuredSummary: '카테고리 내에서 자주 보이는 실패 원인을 간단히 정리한 요약입니다.',
  extractedPatterns: ['시장 조사 부족', '광고 효율 저하'],
  keywords: ['고객 확보(마케팅)', '수익 구조 이해 부족'],
  failureCategory: '시장 조사 부족',
  riskLevel: 'HIGH',
  riskFactors: ['시장 경쟁 심화', '광고 비용 부담'],
  successFactors: ['소규모 테스트', '상세페이지 개선'],
  confidenceScore: 0.99,
};

function makeExperience(id, overrides = {}) {
  return {
    id,
    author: mockUser,
    category: categories.ecommerce,
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
    difficulties: ['수익 구조 이해 부족', '재고 과잉'],
    difficultyEtc: null,
    difficultyExtra: null,
    targetMarket: '20대 여성',
    marketingChannels: ['인스타그램', '스마트스토어 광고'],
    lessonsLearned: '작은 예산으로 반응을 먼저 확인하고 다음 단계로 넘어가야 했습니다.',
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
    category: categories.content,
    title: '제목',
    content: sampleBodies.short,
    businessType: '유튜브',
    failureReasons: ['고객 확보(마케팅)'],
    difficulties: ['수익 구조 이해 부족'],
    analysis: {
      ...sampleAnalysis,
      structuredSummary: '카테고리 내에서 자주 보이는 실패 원인을 간단히 정리한 요약입니다.',
      extractedPatterns: ['수익 구조 미설계'],
      keywords: ['고객 확보(마케팅)', '수익 구조 이해 부족'],
      failureCategory: '수익 구조 이해 부족',
      riskLevel: 'MEDIUM',
      riskFactors: ['광고 수익 의존'],
      successFactors: ['브랜드 제휴', '상품 연계'],
      confidenceScore: 0.99,
    },
    viewCount: 999,
  }),
  makeExperience(3, {
    caseStatus: 'SUCCESS',
    title: '제목',
    content: sampleBodies.short,
    likeCount: 999,
    bookmarkCount: 999,
    analysis: {
      ...sampleAnalysis,
      structuredSummary: '작은 실험을 반복해 성과를 만들었습니다.',
      extractedPatterns: ['상세페이지 개선', '소액 테스트'],
      keywords: ['키워드 테스트', '상세페이지 개선'],
      failureCategory: '전환율 개선',
      riskLevel: 'LOW',
      riskFactors: ['초기 반응 낮음'],
      successFactors: ['소액 테스트', '상품 정보 개선'],
      confidenceScore: 0.99,
    },
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

const failurePatternPayload = {
  category: 'online-commerce',
  labelKo: '온라인 판매·이커머스',
  total: 12,
  sufficientData: true,
  explanation: '카테고리의 50%가 시장 조사 부족을 주요 원인으로 나타나고 있어요.',
  patterns: [
    { label: '시장 조사 부족', count: 6, percent: 50 },
    { label: '수익 구조 이해 부족', count: 4, percent: 33.3 },
    { label: '재고 과잉', count: 3, percent: 25 },
    { label: '고객 확보(마케팅)', count: 2, percent: 16.7 },
    { label: '광고 효율 저하', count: 2, percent: 16.7 },
  ],
};

const failureTimingPayload = {
  category: 'online-commerce',
  total: 12,
  sufficientData: true,
  explanation: '실패는 6개월~1년 구간에 가장 많이 몰려 있어요.',
  peakBucket: '6-12m',
  distribution: [
    { bucket: 'under-1m', label: '1개월 미만', order: 1, count: 1, percent: 8.3 },
    { bucket: '1-3m', label: '1~3개월', order: 2, count: 2, percent: 16.7 },
    { bucket: '3-6m', label: '3~6개월', order: 3, count: 3, percent: 25 },
    { bucket: '6-12m', label: '6개월~1년', order: 4, count: 4, percent: 33.3 },
    { bucket: 'over-1y', label: '1년 이상', order: 5, count: 2, percent: 16.7 },
  ],
};

const comparePayload = {
  experiences: [experiences[0], experiences[2]],
  commonPatterns: ['시장 반응을 보기 전에 예산을 먼저 집행한 점이 공통으로 보입니다.'],
  differences: ['성공 사례는 소규모 테스트 후 상세페이지를 빠르게 조정했습니다.'],
  recommendations: ['광고보다 키워드와 상세페이지 실험을 먼저 진행해보세요.'],
};

const screens = [
  { key: 'login', path: '/login', auth: false, waitFor: '간편 로그인' },
  { key: 'signup', path: '/signup/email', auth: false, waitFor: '이메일로 본인 확인을 진행할게요' },
  { key: 'home', path: '/', auth: true, waitFor: '부업 카테고리' },
  { key: 'explore', path: '/explore', auth: true, waitFor: '사례 탐색' },
  { key: 'search', path: '/search', auth: true, waitFor: '최근 검색어' },
  { key: 'detail', path: '/experiences/1', auth: true, waitFor: '사례 상세' },
  { key: 'create-wizard', path: '/create', auth: true, waitFor: '1/4 단계' },
  { key: 'mypage-overview', path: '/mypage', auth: true, waitFor: '마이페이지' },
  { key: 'mypage-written', path: '/mypage/written', auth: true, waitFor: '저장됨' },
  { key: 'mypage-bookmarks', path: '/mypage/bookmarks', auth: true, waitFor: '저장됨' },
  { key: 'mypage-recent', path: '/mypage/recent', auth: true, waitFor: '저장됨' },
  { key: 'mypage-profile-edit', path: '/mypage/profile/edit', auth: true, waitFor: '프로필 수정' },
  { key: 'success-comparison', path: '/experiences/1/success-comparison', auth: true, waitFor: '공통 패턴' },
];

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

async function installApiMocks(page, { auth }) {
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

    if (pathname.endsWith('/health')) {
      return route.fulfill(jsonResponse({ status: 'ok' }));
    }
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
      return route.fulfill(
        jsonResponse({
          strategy: 'personalized',
          preferredCategoryIds: [1, 2],
          experiences: experiences.slice(0, 2),
        }),
      );
    }
    if (pathname.endsWith('/users/me/account-settings') && method === 'PUT') {
      return route.fulfill(jsonResponse({ user: mockUser }));
    }
    if (pathname.endsWith('/experiences') && method === 'GET') {
      return route.fulfill(jsonResponse(listPayload));
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
    if (/\/experiences\/\d+\/success-cases$/.test(pathname)) {
      return route.fulfill(jsonResponse([experiences[2]]));
    }
    if (pathname.endsWith('/experiences/compare') && method === 'POST') {
      return route.fulfill(jsonResponse(comparePayload));
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
    const experienceMatch = pathname.match(/\/experiences\/(\d+)$/);
    if (experienceMatch) {
      const id = Number(experienceMatch[1]);
      const experience = experiences.find((item) => item.id === id) ?? experiences[0];
      return route.fulfill(jsonResponse(experience));
    }

    return route.continue();
  });
}

async function captureScreen(browser, screen, viewport, suffix) {
  const page = await browser.newPage({ viewport });
  await installApiMocks(page, { auth: screen.auth });
  await page.goto(`${BASE_URL}${screen.path}`, { waitUntil: 'networkidle' });
  if (screen.waitFor) {
    await page.getByText(screen.waitFor, { exact: false }).first().waitFor({ state: 'visible', timeout: 10000 });
  }
  await page.screenshot({
    path: path.join(OUTPUT_DIR, `${screen.key}-${suffix}.png`),
    fullPage: true,
  });
  await page.close();
}

async function main() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    executablePath: EDGE_PATH,
  });

  try {
    for (const screen of screens) {
      await captureScreen(browser, screen, desktopViewport, 'desktop');
      for (const mobileViewport of mobileViewports) {
        await captureScreen(browser, screen, mobileViewport, mobileViewport.suffix);
      }
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
