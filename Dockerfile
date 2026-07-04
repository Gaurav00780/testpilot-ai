# Use the official Playwright image which includes all browser dependencies
FROM mcr.microsoft.com/playwright:jammy

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json first to leverage Docker cache
COPY package*.json ./

# Install dependencies (this will install the exact versions from package-lock.json)
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port that the Express server runs on
EXPOSE 3001

# Command to run the application
CMD ["npm", "run", "server"]
