import {
  absoluteUrl,
  captureScreen,
  clearAuthFlowSeed,
  createMobilePage,
  ensureOutputDir,
  launchBrowser,
  seedAuthFlow,
  writeReport,
} from './core.mjs';

const SCREEN_SPECS = [
  {
    key: 'signup1-email',
    figmaNode: '2644:15591',
    route: '/signup/email?next=%2F',
    waitForText: '개인 정보 등록',
    requiredTexts: ['개인 정보 등록'],
    seed: {},
  },
  {
    key: 'signup2-identity',
    figmaNode: '2644:15608',
    route: '/signup/identity?next=%2F',
    waitForText: '개인 정보 등록',
    requiredTexts: ['개인 정보 등록', '생년월일 및 성별', '본인 인증하기'],
    seed: {
      email: 'harness@example.com',
    },
  },
  {
    key: 'signup3-identity-details',
    figmaNode: '2644:15628',
    route: '/signup/identity/details?next=%2F',
    waitForText: '개인 정보 등록',
    requiredTexts: ['개인 정보 등록', '생년월일 및 성별', '이름', '본인 인증하기'],
    seed: {
      email: '텍스트텍스트',
      identityCode: '0000003',
    },
  },
  {
    key: 'signup4-verify',
    figmaNode: '2156:9483',
    route: '/signup/verify?next=%2F',
    waitForText: '이메일 인증',
    requiredTexts: ['이메일 인증'],
    seed: {
      email: 'harness@example.com',
      verificationSent: true,
      verificationMessage: 'dev verification code: 123456',
    },
  },
  {
    key: 'signup5-username',
    figmaNode: '2156:9527',
    route: '/signup/username?next=%2F',
    waitForText: '아이디 설정',
    requiredTexts: ['아이디 설정', '아이디', '중복확인', '다음으로'],
    seed: {
      email: '텍스트텍스트',
      identityCode: '0000003',
      fullName: '홍길동',
    },
  },
  {
    key: 'signup6-password',
    figmaNode: '2156:9505',
    route: '/signup/password?next=%2F',
    waitForText: '비밀번호 설정',
    requiredTexts: ['비밀번호 설정'],
    seed: {
      email: 'harness@example.com',
      verificationConfirmed: true,
    },
  },
  {
    key: 'signup7-profile',
    figmaNode: '2793:18399',
    route: '/signup/nickname?next=%2F&mode=social',
    waitForText: '프로필 설정',
    requiredTexts: ['프로필 설정', '닉네임', '중복확인', '다음으로'],
    seed: {
      signupMode: 'social',
      nickname: 'harness',
      nicknameChecked: false,
    },
  },
  {
    key: 'signup8-region',
    figmaNode: '2156:8743',
    route: '/signup/region?next=%2F&mode=social',
    waitForText: '거주지 설정',
    requiredTexts: ['거주지 설정'],
    seed: {
      signupMode: 'social',
      nickname: 'harness',
    },
  },
  {
    key: 'signup9-employment',
    figmaNode: '2156:8774',
    route: '/signup/employment?next=%2F&mode=social',
    waitForText: '경험 여부',
    requiredTexts: ['경험 여부'],
    seed: {
      signupMode: 'social',
      nickname: 'harness',
      region: '서울',
    },
  },
  {
    key: 'signup10-purpose',
    figmaNode: '2156:8805',
    route: '/signup/purpose?next=%2F&mode=social',
    waitForText: '서비스 목적',
    requiredTexts: ['서비스 목적'],
    seed: {
      signupMode: 'social',
      nickname: 'harness',
      region: '서울',
      experienceStatus: 'HAS_EXPERIENCE',
    },
  },
];

function pickScreens() {
  const requested = process.env.SIDEPICK_SIGNUP_SCREEN;
  if (!requested || requested === 'all') {
    return SCREEN_SPECS;
  }

  const matched = SCREEN_SPECS.filter((screen) => screen.key === requested);
  if (!matched.length) {
    throw new Error(
      `Unknown SIDEPICK_SIGNUP_SCREEN="${requested}". Available: ${SCREEN_SPECS.map((screen) => screen.key).join(', ')}`,
    );
  }

  return matched;
}

const browser = await launchBrowser();
const page = await createMobilePage(browser);
const outputDir = await ensureOutputDir('signup-review');
const report = [];

try {
  for (const screen of pickScreens()) {
    await clearAuthFlowSeed(page);
    await seedAuthFlow(page, screen.seed);
    await page.goto(absoluteUrl(screen.route), { waitUntil: 'networkidle' });
    await page.getByText(screen.waitForText).waitFor({ state: 'visible', timeout: 10000 });

    const bodyText = await page.locator('body').innerText();
    const missingTexts = screen.requiredTexts.filter((text) => !bodyText.includes(text));
    const screenshotPath = await captureScreen(page, outputDir, `${screen.key}.png`);

    report.push({
      screen: screen.key,
      figmaNode: screen.figmaNode,
      route: screen.route,
      url: page.url(),
      ok: missingTexts.length === 0,
      missingTexts,
      screenshotPath,
    });
  }

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
    report,
  });
  console.error(
    JSON.stringify(
      {
        ok: false,
        message: error instanceof Error ? error.message : String(error),
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
