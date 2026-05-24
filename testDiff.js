const path = require('path');
const { compareImages } = require('./services/diffEngine');

async function runTest() {
    console.log("Starting image comparison test...");
    
    // We'll use two existing screenshots from your previous runs
    const img1 = path.join(__dirname, 'screenshots', 'screenshots', 'chromium.png');
    const img2 = path.join(__dirname, 'screenshots', 'screenshots', 'firefox.png');
    const diffOut = path.join(__dirname, 'diff-output.png');

    try {
        const result = await compareImages(img1, img2, diffOut);
        console.log("✅ Comparison completed successfully!");
        console.log("📊 Stats:", JSON.stringify(result, null, 2));
        console.log("🖼️  Diff image saved to:", diffOut);
    } catch (err) {
        console.error("❌ Test failed:", err);
    }
}

runTest();
