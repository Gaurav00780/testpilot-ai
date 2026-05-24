const { chromium, firefox, webkit, devices } = require('playwright');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');

// Ensure screenshots folder exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR);
}

// Main function
async function runTest(url) {
    const browsers = {
        chromium,
        firefox,
        webkit
    };

    console.log(`🚀 Testing URL: ${url}\n`);

    for (const name in browsers) {
        const browserType = browsers[name];
        const browser = await browserType.launch();

        const context = await browser.newContext({
            viewport: { width: 1280, height: 800 }
        });

        const page = await context.newPage();

        // 📱 Mobile test (iPhone 13)
        const iPhone = devices['iPhone 13'];

        const mobileOptions = { ...iPhone };
        if (name === 'firefox') {
            delete mobileOptions.isMobile;
        }

        const mobileContext = await browser.newContext(mobileOptions);

        const mobilePage = await mobileContext.newPage();
        const mobilePath = path.join(SCREENSHOT_DIR, `${name}-mobile.png`);

        try {
            console.log(`📱 Running mobile on ${name}...`);
            await mobilePage.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
            await mobilePage.screenshot({
                path: mobilePath,
                fullPage: true
            });
            console.log(`📱 Mobile screenshot saved: ${mobilePath}`);
        } catch (err) {
            console.log(`❌ Error on mobile ${name}:`, err.message);
        }

        page.on('console', msg => {
            console.log(`[${name} console]:`, msg.text());
        });

        page.on('pageerror', err => {
            console.log(`[${name} error]:`, err.message);
        });

        await page.waitForTimeout(2000);


        try {
            console.log(`🌐 Running on ${name}...`);

            await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });

            const filePath = path.join(SCREENSHOT_DIR, `${name}.png`);

            await page.screenshot({
                path: filePath,
                fullPage: true
            });

            console.log(`✅ Screenshot saved: ${filePath}`);
        } catch (err) {
            console.log(`❌ Error on ${name}:`, err.message);
        }

        await browser.close();
    }

    console.log('\n🎉 Testing completed!');
}

// Run from terminal
const url = process.argv[2];

if (!url) {
    console.log('❗ Please provide a URL');
    console.log('Example: node runner.js https://example.com');
    process.exit(1);
}

runTest(url);