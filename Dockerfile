# Pin to exact Playwright version matching your package.json
# Update this whenever you run: npm update playwright
# Check required version with: node -e "console.log(require('playwright/package.json').version)"
FROM mcr.microsoft.com/playwright:v1.59.1-noble

WORKDIR /app

# Copy lockfile first — Docker cache skips npm ci if dependencies unchanged
COPY package*.json ./

# ci installs exact versions from lockfile, faster and deterministic
RUN npm ci --omit=dev

# Copy application code
COPY . .

# Tell Playwright where browsers live in the official image
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# Your Express server port
EXPOSE 3001

# Direct node invocation — no npm overhead
CMD ["node", "server.js"]