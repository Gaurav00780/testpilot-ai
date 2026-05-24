const fs = require('fs');
const PNG = require('pngjs').PNG;
const pixelmatch = require('pixelmatch').default || require('pixelmatch');

/**
 * Compares two PNG images and generates a visual diff.
 * 
 * @param {string} baselinePath - Path to the baseline (expected) image
 * @param {string} testPath - Path to the test (actual) image
 * @param {string} diffPath - Path where the diff image should be saved
 * @param {object} options - Options for pixelmatch (e.g. { threshold: 0.1 })
 * @returns {Promise<object>} Resolves with { mismatchedPixels, totalPixels, percentage, match }
 */
function compareImages(baselinePath, testPath, diffPath, options = { threshold: 0.1 }) {
    return new Promise((resolve, reject) => {
        try {
            if (!fs.existsSync(baselinePath)) {
                return reject(new Error(`Baseline image not found: ${baselinePath}`));
            }
            if (!fs.existsSync(testPath)) {
                return reject(new Error(`Test image not found: ${testPath}`));
            }

            // Read the PNG images into memory
            const img1 = PNG.sync.read(fs.readFileSync(baselinePath));
            const img2 = PNG.sync.read(fs.readFileSync(testPath));

            // Determine the maximum dimensions to handle images of different sizes
            const width = Math.max(img1.width, img2.width);
            const height = Math.max(img1.height, img2.height);

            // Function to pad an image to the target dimensions if it's smaller
            const adjustImage = (img, targetWidth, targetHeight) => {
                if (img.width === targetWidth && img.height === targetHeight) {
                    return img;
                }
                const newImg = new PNG({ width: targetWidth, height: targetHeight });
                // Fill with transparent/white background if needed, here it defaults to transparent black
                PNG.prototype.bitblt.call(img, newImg, 0, 0, img.width, img.height, 0, 0);
                return newImg;
            };

            const adjustedImg1 = adjustImage(img1, width, height);
            const adjustedImg2 = adjustImage(img2, width, height);
            
            // Create a blank image to hold the diff output
            const diff = new PNG({ width, height });

            // Run pixelmatch
            const mismatchedPixels = pixelmatch(
                adjustedImg1.data,
                adjustedImg2.data,
                diff.data,
                width,
                height,
                options
            );

            // Calculate differences
            const totalPixels = width * height;
            const percentage = (mismatchedPixels / totalPixels) * 100;
            const match = mismatchedPixels === 0;

            // Save the diff image
            fs.writeFileSync(diffPath, PNG.sync.write(diff));

            resolve({
                mismatchedPixels,
                totalPixels,
                percentage,
                match,
                dimensions: { width, height }
            });
        } catch (error) {
            reject(error);
        }
    });
}

module.exports = {
    compareImages
};
