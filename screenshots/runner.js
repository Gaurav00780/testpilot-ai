const { chromium, firefox, webkit, devices } = require('playwright');
const path = require('path');
const fs = require('fs');

const url = process.argv[2];
const browserList = process.argv[3] ? process.argv[3].split(',') : ['chromium', 'webkit'];
const runId = process.argv[4] || 'latest';
const OUTPUT_DIR = path.join(__dirname);

// Memory logger
function logMemory(label) {
  try {
    const mem = process.memoryUsage();
    console.log(`[Memory] ${label}: RSS=${Math.round(mem.rss/1024/1024)}MB, Heap=${Math.round(mem.heapUsed/1024/1024)}MB`);
  } catch {}
}

if (!url) { console.error('Usage: node runner.js <url> [browser1,browser2,...] [runId]'); process.exit(1); }

const launchers = { chromium, firefox, webkit, 'mobile-chrome': chromium };

async function runBrowser(browserType) {
  const launcher = launchers[browserType.toLowerCase()];
  if (!launcher) { console.warn(`Unknown browser: ${browserType}`); return; }

  const isMobile = browserType.toLowerCase() === 'mobile-chrome';
  console.log(isMobile ? `Running mobile on ${browserType}` : `Running on ${browserType}`);

  // Log memory before launching
  logMemory(`before ${browserType.toLowerCase()} launch`);

  const browserName = browserType.toLowerCase();
  let launchOptions = { headless: true };

  if (browserName === 'chromium' || browserName === 'mobile-chrome') {
    launchOptions.args = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage', // critical - stops using /dev/shm which is tiny on Render
      '--disable-gpu',
      '--no-zygote',
      '--single-process', // biggest memory saving - runs in one process
      '--disable-extensions',
      '--disable-background-networking',
      '--memory-pressure-off'
    ];
  } else if (browserName === 'webkit') {
    launchOptions = {
      timeout: 60000,  // 60s launch timeout
      env: {
        ...process.env,
        // Disable WebKit GPU compositor on headless Linux
        WEBKIT_DISABLE_COMPOSITING_MODE: '1',
        WEBKIT_DISABLE_DMABUF_RENDERER: '1',
      }
    };
  }

  const browser = await launcher.launch(launchOptions);
  try {
    const contextOptions = isMobile
      ? { ...devices['Pixel 5'] }
      : { viewport: { width: 1280, height: 720 } };

    const context = await browser.newContext(contextOptions);
    const page = await context.newPage();

    // Set a default timeout for all page actions
    page.setDefaultTimeout(30000);

    const waitUntil = browserName === 'webkit' ? 'domcontentloaded' : 'networkidle';
    const screenshotTimeout = browserName === 'webkit' ? 90000 : 30000;

    console.log(`[Runner] ${browserName} goto options: waitUntil=${waitUntil}, screenshotTimeout=${screenshotTimeout}ms`);

    await page.goto(url, {
      waitUntil: browserName === 'webkit' ? 'domcontentloaded' : 'networkidle',
      timeout: 60000
    });

    if (browserName === 'webkit') {
      await page.waitForTimeout(2000); // let compositor settle
    }

    // Give the page a moment to finish JS-driven rendering (capped at 3s)
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await new Promise(resolve => setTimeout(resolve, 2000));

    const screenshotPath = path.join(OUTPUT_DIR, `${runId}_${browserName}.png`);
    await page.screenshot({
      path: screenshotPath,
      fullPage: true,
      timeout: browserName === 'webkit' ? 90000 : 30000
    });
    console.log(`Screenshot saved: ${runId}_${browserName}.png`);
  } finally {
    await browser.close();
  }
}

(async () => {
  console.log('[Runner] Browser targets:', browserList.join(', '));
  let anyError = false;
  for (const browserType of browserList) {
    const timeoutMs = 90000;
    try {
      await Promise.race([
        runBrowser(browserType),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Browser "${browserType}" timed out after ${timeoutMs / 1000}s`)), timeoutMs)
        ),
      ]);
    } catch (err) {
      console.error(`Runner error for ${browserType}:`, err.message);
      anyError = true;
      // Continue with remaining browsers instead of aborting everything
    }
  }
  console.log('All screenshots complete');
  if (anyError) process.exit(1);
})();
