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
          name: '\uC628\uB77C\uC778 \uD310\uB9E4 \u00B7 \uC774\uCEE4\uBA38\uC2A4',
          description: '',
          icon: '',
          color: '#5A876E',
          slug: 'online-commerce',
          type: 'business_field',
        },
        caseStatus: 'FAILURE',
        title: '\uC2DC\uC7A5 \uAC80\uC99D\uC774 \uBD80\uC871\uD588\uB358 \uC628\uB77C\uC778 \uD310\uB9E4 \uC0AC\uB840',
        content:
          '\uCD08\uAE30 \uC218\uC694 \uD655\uC778 \uC5C6\uC774 \uC0C1\uD488\uC744 \uBA3C\uC800 \uC62C\uB838\uB2E4\uAC00 \uC720\uC785\uACFC \uC804\uD658\uC774 \uBAA8\uB450 \uB0AE\uC558\uB358 \uACBD\uD5D8\uC785\uB2C8\uB2E4.',
        businessType: '\uC2A4\uB9C8\uD2B8\uC2A4\uD1A0\uC5B4',
        investmentAmount: 300000,
        durationMonths: 4,
        weeklyHours: 12,
        averageDailyHours: null,
        isConcurrentWithMainJob: true,
        monthlyRevenue: null,
        failureReason: '\uC2DC\uC7A5 \uC870\uC0AC \uBD80\uC871',
        failureReasons: ['\uC2DC\uC7A5 \uC870\uC0AC \uBD80\uC871'],
        difficulties: ['\uB9C8\uCF00\uD305'],
        difficultyEtc: null,
        difficultyExtra: null,
        targetMarket: null,
        marketingChannels: [],
        lessonsLearned: null,
        wouldRetry: true,
        analysis: {
          structuredSummary: '',
          extractedPatterns: [],
          keywords: ['\uC2DC\uC7A5 \uC870\uC0AC \uBD80\uC871', '\uB9C8\uCF00\uD305'],
          failureCategory: '\uC2DC\uC7A5 \uC870\uC0AC \uBD80\uC871',
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
    labelKo: '\uC628\uB77C\uC778 \uD310\uB9E4/\uC774\uCEE4\uBA38\uC2A4',
    total: 12,
    sufficientData: true,
    summary:
      '\uC628\uB77C\uC778 \uD310\uB9E4/\uC774\uCEE4\uBA38\uC2A4 \uCE74\uD14C\uACE0\uB9AC\uC5D0\uC11C \uC2DC\uC7A5 \uC870\uC0AC \uBD80\uC871 \uBE44\uC911\uC774 \uAC00\uC7A5 \uB192\uC2B5\uB2C8\uB2E4.',
    explanation: {
      chartType: 'pattern_ratio',
      totalCases: 12,
      dataSource: 'ai/data/failure_pattern.json',
      lastUpdated: '2026-06-02T16:55:20+09:00',
      sufficientData: true,
      minSampleSize: 10,
    },
    patterns: [
      { label: '\uC2DC\uC7A5 \uC870\uC0AC \uBD80\uC871', count: 6, percent: 50.0 },
      { label: '\uB9C8\uCF00\uD305 \uBD80\uC871', count: 6, percent: 50.0 },
      { label: '\uC2E4\uD589\uB825 \uBD80\uC871', count: 3, percent: 25.0 },
      { label: '\uC790\uBCF8 \uBD80\uC871', count: 3, percent: 25.0 },
      { label: '\uC2DC\uAC04 \uBD80\uC871', count: 2, percent: 16.7 },
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
    summary:
      '\uC628\uB77C\uC778 \uD310\uB9E4/\uC774\uCEE4\uBA38\uC2A4 \uCE74\uD14C\uACE0\uB9AC\uC758 1\uB144 \uC774\uC0C1 \uAD6C\uAC04\uC5D0\uC11C \uC2E4\uD328\uAC00 \uC9D1\uC911\uB429\uB2C8\uB2E4.',
    explanation: {
      chartType: 'timing_distribution',
      totalCases: 12,
      dataSource: 'ai/data/failure_timing.json',
      lastUpdated: '2026-06-02T16:55:20+09:00',
      sufficientData: true,
      minSampleSize: 10,
    },
    peakBucket: 'over-1y',
    distribution: [
      { bucket: 'under-1m', label: '1\uAC1C\uC6D4 \uBBF8\uB9CC', order: 1, count: 1, percent: 8.3 },
      { bucket: '1-3m', label: '1~3\uAC1C\uC6D4', order: 2, count: 0, percent: 0.0 },
      { bucket: '3-6m', label: '3~6\uAC1C\uC6D4', order: 3, count: 2, percent: 16.7 },
      { bucket: '6-12m', label: '6\uAC1C\uC6D4~1\uB144', order: 4, count: 3, percent: 25.0 },
      { bucket: 'over-1y', label: '1\uB144 \uC774\uC0C1', order: 5, count: 6, percent: 50.0 },
    ],
  },
  timestamp: '2026-06-12T00:00:00Z',
};

const insufficientPatternStats = {
  success: true,
  message: 'OK',
  data: {
    category: 'talent-freelance',
    labelKo: '\uC7AC\uB2A5 \uD310\uB9E4/\uD504\uB9AC\uB79C\uC11C',
    total: 9,
    sufficientData: false,
    summary: '\uC544\uC9C1 \uD1B5\uACC4 \uB370\uC774\uD130\uAC00 \uCDA9\uBD84\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.',
    explanation: {
      chartType: 'pattern_ratio',
      totalCases: 9,
      dataSource: 'ai/data/failure_pattern.json',
      lastUpdated: '2026-06-02T16:55:20+09:00',
      sufficientData: false,
      minSampleSize: 10,
      insufficientMessage:
        '\uB370\uC774\uD130\uB97C \uC218\uC9D1 \uC911\uC774\uC5D0\uC694 (10\uAC74 \uC774\uC0C1 \uBAA8\uC774\uBA74 \uCC28\uD2B8\uB97C \uD45C\uC2DC\uD574\uC694).',
    },
    patterns: [{ label: '\uC2E4\uD589\uB825 \uBD80\uC871', count: 5, percent: 55.6 }],
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
    summary:
      '\uC544\uC9C1 \uC2E4\uD328 \uC2DC\uC810 \uBD84\uD3EC\uB97C \uBCF4\uC5EC\uC8FC\uAE30\uC5D0\uB294 \uD45C\uBCF8\uC774 \uBD80\uC871\uD569\uB2C8\uB2E4.',
    explanation: {
      chartType: 'timing_distribution',
      totalCases: 9,
      dataSource: 'ai/data/failure_timing.json',
      lastUpdated: '2026-06-02T16:55:20+09:00',
      sufficientData: false,
      minSampleSize: 10,
      insufficientMessage:
        '\uB370\uC774\uD130\uB97C \uC218\uC9D1 \uC911\uC774\uC5D0\uC694 (10\uAC74 \uC774\uC0C1 \uBAA8\uC774\uBA74 \uCC28\uD2B8\uB97C \uD45C\uC2DC\uD574\uC694).',
    },
    peakBucket: 'over-1y',
    distribution: [
      { bucket: 'under-1m', label: '1\uAC1C\uC6D4 \uBBF8\uB9CC', order: 1, count: 1, percent: 11.1 },
      { bucket: '1-3m', label: '1~3\uAC1C\uC6D4', order: 2, count: 2, percent: 22.2 },
      { bucket: '3-6m', label: '3~6\uAC1C\uC6D4', order: 3, count: 0, percent: 0.0 },
      { bucket: '6-12m', label: '6\uAC1C\uC6D4~1\uB144', order: 4, count: 1, percent: 11.1 },
      { bucket: 'over-1y', label: '1\uB144 \uC774\uC0C1', order: 5, count: 5, percent: 55.6 },
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

async function openStatsSection() {
  await page.locator('button').filter({ hasText: '\uCE74\uD14C\uACE0\uB9AC' }).first().click();
}

async function selectCategory(label) {
  await page.locator('button').filter({ hasText: label }).first().click();
}

async function waitForChartsState() {
  await Promise.race([
    page.getByRole('heading', { name: '\uC2E4\uD328 \uC694\uC778 TOP3' }).waitFor({ state: 'visible', timeout: 10000 }),
    page.getByRole('heading', { name: '\uC2E4\uD328 \uD328\uD134' }).waitFor({ state: 'visible', timeout: 10000 }),
    page.getByRole('heading', { name: '\uC2E4\uD328 \uC2DC\uC810 \uBD84\uD3EC' }).waitFor({ state: 'visible', timeout: 10000 }),
  ]);
}

async function waitForInsufficientState() {
  await Promise.race([
    page.getByText('\uB370\uC774\uD130\uB97C \uC218\uC9D1 \uC911\uC774\uC5D0\uC694').waitFor({ state: 'visible', timeout: 10000 }),
    page.getByText('\uD1B5\uACC4 \uB370\uC774\uD130').waitFor({ state: 'visible', timeout: 10000 }),
  ]);
}

try {
  await installApiMocks();
  await prepareFigmaComparison(page);

  await page.goto(absoluteUrl('/explore?categoryId=1'), { waitUntil: 'networkidle' });
  await waitForStableRender(page);
  await page.locator('button').filter({ hasText: '\uCE74\uD14C\uACE0\uB9AC' }).first().waitFor({ state: 'visible', timeout: 10000 });
  await openStatsSection();
  await waitForChartsState();
  await waitForStableRender(page);
  const chartsPath = await captureScreen(page, outputDir, 'explore-stats-charts.png');
  report.push({
    scenario: 'charts',
    ok: true,
    screenshotPath: chartsPath,
    url: page.url(),
  });

  await page.goto(absoluteUrl('/explore'), { waitUntil: 'networkidle' });
  await waitForStableRender(page);
  await selectCategory('\uC7AC\uB2A5 \uD310\uB9E4 \u00B7 \uD504\uB9AC\uB79C\uC11C');
  await page.locator('button').filter({ hasText: '\uCE74\uD14C\uACE0\uB9AC' }).first().waitFor({ state: 'visible', timeout: 10000 });
  await openStatsSection();
  await waitForInsufficientState();
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
