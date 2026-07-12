const { chromium, firefox, webkit, devices } = require('playwright');
const path = require('path');
const fs = require('fs');

const url = process.argv[2];
const browserList = process.argv[3] ? process.argv[3].split(',') : ['chromium'];
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

  const type = browserType.toLowerCase();
  const launchOptions = { headless: true };

  if (type === 'chromium' || type === 'mobile-chrome') {
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
  } else if (type === 'firefox') {
    launchOptions.firefoxUserPrefs = {
      'browser.tabs.remote.autostart': false,
      'browser.tabs.remote.autostart.2': false,
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

    // Use 'load' instead of 'networkidle' — networkidle hangs on SPAs/sites
    // with analytics, ads, or persistent polling that never fully go quiet.
    // After 'load', wait up to 3s for JS-driven rendering to settle.
    await page.goto(url, { waitUntil: 'load', timeout: 60000 });

    // Give the page a moment to finish JS-driven rendering (capped at 3s)
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await new Promise(resolve => setTimeout(resolve, 2000));

    const outputPath = path.join(OUTPUT_DIR, `${runId}_${browserType.toLowerCase()}.png`);
    await page.screenshot({ path: outputPath, fullPage: true });
    console.log(`Screenshot saved: ${runId}_${browserType.toLowerCase()}.png`);
  } finally {
    await browser.close();
  }
}

(async () => {
  let anyError = false;
  for (const browserType of browserList) {
    const isFirefox = browserType.toLowerCase() === 'firefox';
    const timeoutMs = isFirefox ? 120000 : 90000;

    const executeWithTimeout = async () => {
      await Promise.race([
        runBrowser(browserType),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Browser "${browserType}" timed out after ${timeoutMs / 1000}s`)), timeoutMs)
        ),
      ]);
    };

    try {
      if (isFirefox) {
        try {
          await executeWithTimeout();
        } catch (err) {
          if (err.message.includes('timed out')) {
            console.warn('[Runner] Firefox timed out, retrying once...');
            await new Promise(r => setTimeout(r, 3000)); // 3s cooldown
            await executeWithTimeout();
          } else {
            throw err;
          }
        }
      } else {
        await executeWithTimeout();
      }
    } catch (err) {
      console.error(`Runner error for ${browserType}:`, err.message);
      anyError = true;
      // Continue with remaining browsers instead of aborting everything
    }
  }
  console.log('All screenshots complete');
  if (anyError) process.exit(1);
})();
