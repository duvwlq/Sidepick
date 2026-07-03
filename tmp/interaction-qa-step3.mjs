import { chromium } from '../fe/node_modules/playwright/index.mjs';

const baseUrl = 'http://127.0.0.1:4173';
const widths = [375, 390, 412];
const failures = [];
const notes = [];
const queryWord = '\uC804\uC790\uCC45';
const fixtureQuery = '\uAC80\uC0C9\uC5B4';

function recordFailure(item) {
  failures.push(item);
}

function recordNote(message) {
  notes.push(message);
}

async function collectPageIssues(page, context) {
  const consoleIssues = [];
  const requestFailures = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      consoleIssues.push(`${msg.type()}: ${msg.text()}`);
    }
  });
  page.on('requestfailed', (request) => {
    requestFailures.push(`${request.method()} ${request.url()} :: ${request.failure()?.errorText ?? 'unknown'}`);
  });

  await context(page, { consoleIssues, requestFailures });
}

async function assertNoHorizontalOverflow(page, width) {
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  if (metrics.scrollWidth > metrics.clientWidth) {
    recordFailure({
      component: 'Mobile Layout',
      action: `Viewport ${width}px`,
      steps: `Open screen at width ${width}px.`,
      expected: 'No horizontal overflow.',
      actual: `scrollWidth ${metrics.scrollWidth}px > clientWidth ${metrics.clientWidth}px.`,
      impact: 'Controls can clip or become inaccessible on target widths.',
      requiredFix: 'Constrain page and fixed controls to the active mobile viewport.',
      priority: 'P2',
    });
  }
}

async function runSearchScreenAudit(browser) {
  const page = await browser.newPage({ viewport: { width: 375, height: 815 } });
  await collectPageIssues(page, async (currentPage, { consoleIssues, requestFailures }) => {
    await currentPage.goto(`${baseUrl}/search`, { waitUntil: 'networkidle' });

    const input = currentPage.locator('input').first();
    await input.fill(queryWord);
    await input.press('Enter');
    await currentPage.waitForURL(/\/explore\?q=.*mode=search/, { timeout: 5000 });
    const exploreUrl = currentPage.url();
    if (!exploreUrl.includes(encodeURIComponent(queryWord))) {
      recordFailure({
        component: 'Search Input',
        action: 'Submit keyword',
        steps: '1. Open /search. 2. Type a keyword. 3. Press Enter.',
        expected: 'The exact keyword should be reflected in the result route.',
        actual: `Navigated to ${exploreUrl}.`,
        impact: 'Search route cannot reliably restore typed state.',
        requiredFix: 'Preserve the exact query in the explore route.',
        priority: 'P1',
      });
    }

    await currentPage.goto(`${baseUrl}/search`, { waitUntil: 'networkidle' });
    const recentChip = currentPage.locator('button').filter({ hasText: queryWord }).first();
    if (!(await recentChip.count())) {
      recordFailure({
        component: 'Recent Searches',
        action: 'Restore recent search',
        steps: '1. Search once from /search. 2. Return to /search.',
        expected: 'The submitted keyword should appear in recent searches.',
        actual: 'The submitted keyword is not shown in recent searches.',
        impact: 'Search persistence is broken.',
        requiredFix: 'Persist submitted search terms and reload them on the search screen.',
        priority: 'P1',
      });
    } else {
      await recentChip.click();
      await currentPage.waitForURL(/\/explore\?q=.*mode=search/, { timeout: 5000 });
      await currentPage.goto(`${baseUrl}/search`, { waitUntil: 'networkidle' });
    }

    const removableChip = currentPage.locator('button').filter({ hasText: queryWord }).first();
    if (await removableChip.count()) {
      const beforeCount = await currentPage.locator('button').filter({ hasText: queryWord }).count();
      await removableChip.locator('svg').first().click();
      await currentPage.waitForTimeout(300);
      const afterCount = await currentPage.locator('button').filter({ hasText: queryWord }).count();
      if (afterCount >= beforeCount) {
        recordFailure({
          component: 'Recent Search Chip',
          action: 'Remove chip',
          steps: '1. Open /search with a recent keyword chip. 2. Tap the remove icon.',
          expected: 'The chip should be removed immediately.',
          actual: 'The chip remains visible after the remove action.',
          impact: 'Recent search state becomes inconsistent.',
          requiredFix: 'Update recent-search state on remove.',
          priority: 'P2',
        });
      }
    }

    if (consoleIssues.length > 0) {
      recordNote(`Search screen console issues: ${consoleIssues.join(' | ')}`);
    }
    if (requestFailures.length > 0) {
      recordNote(`Search screen request failures: ${requestFailures.join(' | ')}`);
    }
  });
  await page.close();
}

async function runExploreScreenAudit(browser) {
  const page = await browser.newPage({ viewport: { width: 375, height: 815 } });
  await collectPageIssues(page, async (currentPage, { consoleIssues, requestFailures }) => {
    await currentPage.goto(`${baseUrl}/explore?q=${encodeURIComponent(fixtureQuery)}&mode=search`, { waitUntil: 'networkidle' });

    const accordionTrigger = currentPage.locator('button[aria-expanded]').first();
    await accordionTrigger.click();
    await currentPage.waitForTimeout(400);
    const expandedText = currentPage.getByText('\uC2E4\uD328 \uC694\uC778 TOP3').first();
    if ((await accordionTrigger.getAttribute('aria-expanded')) !== 'true' || !(await expandedText.isVisible().catch(() => false))) {
      recordFailure({
        component: 'Statistics Accordion',
        action: 'Expand accordion',
        steps: '1. Open the explore result screen. 2. Tap the statistics row.',
        expected: 'Expanded statistics content should become visible.',
        actual: 'Expanded statistics content did not appear.',
        impact: 'A primary information block cannot be opened.',
        requiredFix: 'Render the expanded statistics panel on toggle.',
        priority: 'P1',
      });
    }
    await accordionTrigger.click();
    await currentPage.waitForTimeout(300);
    if ((await accordionTrigger.getAttribute('aria-expanded')) !== 'false') {
      recordFailure({
        component: 'Statistics Accordion',
        action: 'Collapse accordion',
        steps: '1. Expand the statistics row. 2. Tap the row again.',
        expected: 'Expanded statistics content should collapse.',
        actual: 'Accordion state did not return to collapsed.',
        impact: 'Accordion state becomes inconsistent.',
        requiredFix: 'Synchronize collapse state with the trigger and panel visibility.',
        priority: 'P2',
      });
    }

    const sortTrigger = currentPage.locator('button').filter({ hasText: '\uCD5C\uC2E0\uC21C' }).first();
    await sortTrigger.click();
    await currentPage.waitForTimeout(300);
    if ((await currentPage.locator('div.absolute.right-0.top-\\[25px\\] button').count()) === 0) {
      recordFailure({
        component: 'Sort Dropdown',
        action: 'Open sort menu',
        steps: '1. Open the explore result screen. 2. Tap the sort trigger.',
        expected: 'Sort options should appear.',
        actual: 'Sort options did not become visible.',
        impact: 'Visible filter control is non-functional.',
        requiredFix: 'Render the dropdown menu and expose sort options.',
        priority: 'P1',
      });
    } else {
      await currentPage.getByText('\uCD94\uCC9C\uC21C').last().click();
      await currentPage.waitForTimeout(300);
    }

    const firstCard = currentPage.locator('a[href^="/experiences/"]').first();
    if (!(await firstCard.count())) {
      recordFailure({
        component: 'Result Card',
        action: 'Open detail',
        steps: '1. Open the explore result screen. 2. Tap the first visible card.',
        expected: 'A detail route should open.',
        actual: 'No clickable experience card link was rendered.',
        impact: 'Users cannot continue from list to detail.',
        requiredFix: 'Render cards with valid detail links.',
        priority: 'P1',
      });
    } else {
      await firstCard.click();
      await currentPage.waitForURL(/\/experiences\//, { timeout: 5000 });
      await currentPage.goBack({ waitUntil: 'networkidle' });
      if (!currentPage.url().includes('/explore')) {
        recordFailure({
          component: 'Back Navigation',
          action: 'Return from detail',
          steps: '1. Open a detail page from the result list. 2. Use browser back.',
          expected: 'Return to the same explore result state.',
          actual: `Returned to ${currentPage.url()}.`,
          impact: 'List-to-detail return flow is broken.',
          requiredFix: 'Preserve and restore the originating explore route on back navigation.',
          priority: 'P1',
        });
      }
    }

    const bookmarkButton = currentPage.locator('button[aria-label*="\uBD81\uB9C8\uD06C"]').first();
    if (await bookmarkButton.count()) {
      await bookmarkButton.click();
      await currentPage.waitForTimeout(500);
      if (!currentPage.url().includes('/auth')) {
        recordFailure({
          component: 'Bookmark Button',
          action: 'Save without login',
          steps: '1. Open the explore result screen as a logged-out user. 2. Tap bookmark.',
          expected: 'The user should be redirected to auth.',
          actual: `Stayed on ${currentPage.url()}.`,
          impact: 'Protected action does not enforce auth navigation.',
          requiredFix: 'Redirect unauthenticated bookmark actions to auth with a return path.',
          priority: 'P1',
        });
      }
      await currentPage.goBack({ waitUntil: 'networkidle' }).catch(() => {});
      if (!currentPage.url().includes('/explore')) {
        await currentPage.goto(`${baseUrl}/explore?q=${encodeURIComponent(fixtureQuery)}&mode=search`, { waitUntil: 'networkidle' });
      }
    }

    const fabTrigger = currentPage.locator('button[aria-label="경험 작성"], button[aria-label="경험 작성 닫기"]').first();
    if (await fabTrigger.count()) {
      await fabTrigger.click();
      await currentPage.waitForTimeout(300);
      if (!(await currentPage.locator('button[aria-label="경험 작성 열기"]').count())) {
        recordFailure({
          component: 'FAB',
          action: 'Expand compose actions',
          steps: '1. Open the explore result screen. 2. Tap the FAB.',
          expected: 'Expanded compose action should appear.',
          actual: 'Expanded FAB state did not render.',
          impact: 'Primary create action is partially broken.',
          requiredFix: 'Render the expanded compose control on toggle.',
          priority: 'P2',
        });
      }
    }

    const homeNav = currentPage.locator('button').filter({ hasText: '\uD648' }).first();
    if (await homeNav.count()) {
      await homeNav.click();
      await currentPage.waitForTimeout(500);
      if (!/\/$|\/home/.test(new URL(currentPage.url()).pathname)) {
        recordFailure({
          component: 'Bottom Navigation',
          action: 'Move to home',
          steps: '1. Open explore. 2. Tap 홈 in the bottom navigation.',
          expected: 'Navigate to the home screen.',
          actual: `Reached ${currentPage.url()}.`,
          impact: 'Primary tab navigation is unreliable.',
          requiredFix: 'Bind the home tab to the home route.',
          priority: 'P1',
        });
      }
    }

    if (consoleIssues.length > 0) {
      recordNote(`Explore screen console issues: ${consoleIssues.join(' | ')}`);
    }
    if (requestFailures.length > 0) {
      recordNote(`Explore screen request failures: ${requestFailures.join(' | ')}`);
    }
  });
  await page.close();
}

async function runViewportAudit(browser) {
  for (const width of widths) {
    const page = await browser.newPage({ viewport: { width, height: 815 } });
    await page.goto(`${baseUrl}/search`, { waitUntil: 'networkidle' });
    await assertNoHorizontalOverflow(page, width);
    await page.goto(`${baseUrl}/explore?q=${encodeURIComponent(fixtureQuery)}&mode=search`, { waitUntil: 'networkidle' });
    await assertNoHorizontalOverflow(page, width);
    await page.close();
  }
}

const browser = await chromium.launch({ headless: true, chromiumSandbox: false });

try {
  await runSearchScreenAudit(browser);
  await runExploreScreenAudit(browser);
  await runViewportAudit(browser);
  console.log(JSON.stringify({ failures, notes }, null, 2));
} finally {
  await browser.close();
}
