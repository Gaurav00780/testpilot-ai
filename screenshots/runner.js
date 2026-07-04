const { chromium, firefox, webkit, devices } = require('playwright');
const path = require('path');
const fs = require('fs');

const url = process.argv[2];
const browserList = process.argv[3] ? process.argv[3].split(',') : ['chromium'];
const runId = process.argv[4] || 'latest';
const OUTPUT_DIR = path.join(__dirname);

if (!url) { console.error('Usage: node runner.js <url> [browser1,browser2,...] [runId]'); process.exit(1); }

const launchers = { chromium, firefox, webkit, 'mobile-chrome': chromium };

(async () => {
  for (const browserType of browserList) {
    const launcher = launchers[browserType.toLowerCase()];
    if (!launcher) { console.warn(`Unknown browser: ${browserType}`); continue; }
    const isMobile = browserType.toLowerCase() === 'mobile-chrome';
    console.log(isMobile ? `Running mobile on ${browserType}` : `Running on ${browserType}`);
    
    const browserArgs = browserType.toLowerCase() === 'chromium' || browserType.toLowerCase() === 'mobile-chrome' 
      ? ['--disable-dev-shm-usage', '--no-sandbox', '--disable-setuid-sandbox'] 
      : [];
    const browser = await launcher.launch({ headless: true, args: browserArgs });
    try {
      const contextOptions = isMobile 
        ? { ...devices['Pixel 5'] } 
        : { viewport: { width: 1280, height: 720 } };
        
      const context = await browser.newContext(contextOptions);
      const page = await context.newPage();
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      const outputPath = path.join(OUTPUT_DIR, `${runId}_${browserType.toLowerCase()}.png`);
      await page.screenshot({ path: outputPath, fullPage: true });
      console.log(`Screenshot saved: ${runId}_${browserType.toLowerCase()}.png`);
    } finally {
      await browser.close();
    }
  }
  console.log('All screenshots complete');
})().catch(err => { console.error('Runner error:', err); process.exit(1); });
