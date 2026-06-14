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

const outputDir = await ensureOutputDir('explore-stats-review');
const browser = await launchBrowser();
const page = await createMobilePage(browser);

const report = [];

const experiencesPayload = {
  success: true,
  message: 'OK',
  data: {
    experiences: [
      {
        id: 101,
        author: {
          id: 1,
          email: 'harness@example.com',
          nickname: 'harness',
          fullName: null,
          birthDate: null,
          gender: null,
          region: null,
          signupPurposes: [],
          experienceStatus: null,
          ageGroup: '20s',
          profileImage: null,
          authProvider: 'LOCAL',
          emailVerified: true,
          profileCompleted: true,
          createdAt: '2026-01-01T00:00:00',
        },
        category: {
          id: 1,
          name: '온라인 판매 · 이커머스',
          description: '',
          icon: '',
          color: '#5A876E',
          slug: 'online-commerce',
          type: 'business_field',
        },
        caseStatus: 'FAILURE',
        title: '시장 검증이 부족했던 온라인 판매 사례',
        content: '초기 수요 확인 없이 상품을 먼저 올렸다가 유입과 전환이 모두 낮았던 경험입니다.',
        businessType: '스마트스토어',
        investmentAmount: 300000,
        durationMonths: 4,
        weeklyHours: 12,
        averageDailyHours: null,
        isConcurrentWithMainJob: true,
        monthlyRevenue: null,
        failureReason: '시장 조사 부족',
        failureReasons: ['시장 조사 부족'],
        difficulties: ['마케팅'],
        difficultyEtc: null,
        difficultyExtra: null,
        targetMarket: null,
        marketingChannels: [],
        lessonsLearned: null,
        wouldRetry: true,
        analysis: {
          structuredSummary: '',
          extractedPatterns: [],
          keywords: ['시장 조사 부족', '마케팅'],
          failureCategory: '시장 조사 부족',
          riskLevel: 'HIGH',
          riskFactors: [],
          successFactors: [],
          confidenceScore: 0.82,
        },
        structuredData: {},
        viewCount: 12,
        likeCount: 4,
        hasPatternAnalysis: true,
        createdAt: '2026-06-01T00:00:00',
        updatedAt: '2026-06-01T00:00:00',
      },
    ],
    pagination: {
      page: 0,
      size: 30,
      totalElements: 1,
      totalPages: 1,
      hasNext: false,
    },
  },
  timestamp: '2026-06-12T00:00:00Z',
};

const sufficientPatternStats = {
  success: true,
  message: 'OK',
  data: {
    category: 'online-commerce',
    labelKo: '온라인 판매/이커머스',
    total: 12,
    sufficientData: true,
    summary: '온라인 판매/이커머스 카테고리에서는 시장 조사 부족 비중이 가장 높습니다.',
    explanation: {
      chartType: 'pattern_ratio',
      totalCases: 12,
      dataSource: 'ai/data/failure_pattern.json',
      lastUpdated: '2026-06-02T16:55:20+09:00',
      sufficientData: true,
      minSampleSize: 10,
      debug: {
        category: 'online-commerce',
        source: 'ai/data/failure_pattern.json',
      },
    },
    patterns: [
      { label: '시장 조사 부족', count: 6, percent: 50.0 },
      { label: '마케팅 부족', count: 6, percent: 50.0 },
      { label: '실행력 부족', count: 3, percent: 25.0 },
      { label: '자본 부족', count: 3, percent: 25.0 },
      { label: '시간 부족', count: 2, percent: 16.7 },
    ],
  },
  timestamp: '2026-06-12T00:00:00Z',
};

const sufficientTimingStats = {
  success: true,
  message: 'OK',
  data: {
    category: 'online-commerce',
    total: 12,
    sufficientData: true,
    summary: '온라인 판매/이커머스 카테고리는 1년 이상 구간에 실패가 집중됩니다.',
    explanation: {
      chartType: 'timing_distribution',
      totalCases: 12,
      dataSource: 'ai/data/failure_timing.json',
      lastUpdated: '2026-06-02T16:55:20+09:00',
      sufficientData: true,
      minSampleSize: 10,
      debug: {
        category: 'online-commerce',
        source: 'ai/data/failure_timing.json',
      },
    },
    peakBucket: 'over-1y',
    distribution: [
      { bucket: 'under-1m', label: '1개월 미만', order: 1, count: 1, percent: 8.3 },
      { bucket: '1-3m', label: '1~3개월', order: 2, count: 0, percent: 0.0 },
      { bucket: '3-6m', label: '3~6개월', order: 3, count: 2, percent: 16.7 },
      { bucket: '6-12m', label: '6개월~1년', order: 4, count: 3, percent: 25.0 },
      { bucket: 'over-1y', label: '1년 이상', order: 5, count: 6, percent: 50.0 },
    ],
  },
  timestamp: '2026-06-12T00:00:00Z',
};

const insufficientPatternStats = {
  success: true,
  message: 'OK',
  data: {
    category: 'talent-freelance',
    labelKo: '재능 판매/프리랜서',
    total: 9,
    sufficientData: false,
    summary: '아직 통계 데이터가 충분하지 않습니다.',
    explanation: {
      chartType: 'pattern_ratio',
      totalCases: 9,
      dataSource: 'ai/data/failure_pattern.json',
      lastUpdated: '2026-06-02T16:55:20+09:00',
      sufficientData: false,
      minSampleSize: 10,
      insufficientMessage: '데이터를 수집 중이에요 (10건 이상 모이면 차트를 표시해요).',
      debug: {
        category: 'talent-freelance',
        source: 'ai/data/failure_pattern.json',
      },
    },
    patterns: [
      { label: '실행력 부족', count: 5, percent: 55.6 },
    ],
  },
  timestamp: '2026-06-12T00:00:00Z',
};

const insufficientTimingStats = {
  success: true,
  message: 'OK',
  data: {
    category: 'talent-freelance',
    total: 9,
    sufficientData: false,
    summary: '아직 실패 시점 분포를 보여주기에는 표본이 부족합니다.',
    explanation: {
      chartType: 'timing_distribution',
      totalCases: 9,
      dataSource: 'ai/data/failure_timing.json',
      lastUpdated: '2026-06-02T16:55:20+09:00',
      sufficientData: false,
      minSampleSize: 10,
      insufficientMessage: '데이터를 수집 중이에요 (10건 이상 모이면 차트를 표시해요).',
      debug: {
        category: 'talent-freelance',
        source: 'ai/data/failure_timing.json',
      },
    },
    peakBucket: 'over-1y',
    distribution: [
      { bucket: 'under-1m', label: '1개월 미만', order: 1, count: 1, percent: 11.1 },
      { bucket: '1-3m', label: '1~3개월', order: 2, count: 2, percent: 22.2 },
      { bucket: '3-6m', label: '3~6개월', order: 3, count: 0, percent: 0.0 },
      { bucket: '6-12m', label: '6개월~1년', order: 4, count: 1, percent: 11.1 },
      { bucket: 'over-1y', label: '1년 이상', order: 5, count: 5, percent: 55.6 },
    ],
  },
  timestamp: '2026-06-12T00:00:00Z',
};

async function installApiMocks() {
  await page.route('**/api/experiences**', async (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify(experiencesPayload),
      });
    }

    return route.fallback();
  });

  await page.route('**/api/stats/failure-pattern**', async (route) => {
    const url = new URL(route.request().url());
    const category = url.searchParams.get('category');
    const body = category === 'talent-freelance' ? insufficientPatternStats : sufficientPatternStats;
    return route.fulfill({
      status: 200,
      contentType: 'application/json; charset=utf-8',
      body: JSON.stringify(body),
    });
  });

  await page.route('**/api/stats/failure-timing**', async (route) => {
    const url = new URL(route.request().url());
    const category = url.searchParams.get('category');
    const body = category === 'talent-freelance' ? insufficientTimingStats : sufficientTimingStats;
    return route.fulfill({
      status: 200,
      contentType: 'application/json; charset=utf-8',
      body: JSON.stringify(body),
    });
  });
}

async function openStatsSection(categoryLabel) {
  await page
    .locator('button[aria-expanded]', { hasText: `${categoryLabel} 통계` })
    .click({ position: { x: 24, y: 20 } });
}

async function waitForStatsContent() {
  await Promise.race([
    page.getByText('실패 요인 TOP3').waitFor({ state: 'visible', timeout: 10000 }),
    page.getByText('데이터 수집 중이에요').waitFor({ state: 'visible', timeout: 10000 }),
    page.getByText('카테고리 통계를 불러오지 못했습니다.').waitFor({ state: 'visible', timeout: 10000 }),
  ]);
}

try {
  await installApiMocks();
  await prepareFigmaComparison(page);

  await page.goto(absoluteUrl('/explore?categoryId=1'), { waitUntil: 'networkidle' });
  await waitForStableRender(page);
  await page.locator('button[aria-expanded]').first().waitFor({ state: 'visible', timeout: 10000 });
  await openStatsSection('온라인 판매 · 이커머스');
  await waitForStatsContent();
  await page.getByText('실패 요인 TOP3').waitFor({ state: 'visible', timeout: 10000 });

  const chartsPath = await captureScreen(page, outputDir, 'explore-stats-charts.png');
  report.push({
    scenario: 'charts',
    ok: true,
    screenshotPath: chartsPath,
    url: page.url(),
  });

  await page.locator('button[aria-label="온라인 판매 · 이커머스 통계 설명 열기"]').click();
  await page.getByRole('dialog', { name: '온라인 판매 · 이커머스 통계 설명' }).waitFor({ state: 'visible', timeout: 10000 });
  await waitForStableRender(page);
  const modalPath = await captureScreen(page, outputDir, 'explore-stats-modal.png');
  report.push({
    scenario: 'modal',
    ok: true,
    screenshotPath: modalPath,
    url: page.url(),
  });

  await page.locator('button[aria-label="닫기"]').click();

  await page.goto(absoluteUrl('/explore?categoryId=5'), { waitUntil: 'networkidle' });
  await waitForStableRender(page);
  await page.locator('button[aria-expanded]').first().waitFor({ state: 'visible', timeout: 10000 });
  await openStatsSection('재능 판매 · 프리랜서');
  await waitForStatsContent();
  await page.getByText('데이터 수집 중이에요').waitFor({ state: 'visible', timeout: 10000 });
  await waitForStableRender(page);
  const insufficientPath = await captureScreen(page, outputDir, 'explore-stats-insufficient.png');
  report.push({
    scenario: 'insufficient',
    ok: true,
    screenshotPath: insufficientPath,
    url: page.url(),
  });

  const ok = report.every((entry) => entry.ok);
  await writeReport(outputDir, 'report.json', { ok, generatedAt: new Date().toISOString(), report });
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
