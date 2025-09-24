const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const puppeteer = require('puppeteer');
const express = require('express');
const port = 3000;

// Initialize Express app for static file serving
const app = express();
app.use(express.static(process.cwd()));

// Function to recursively find all HTML files
async function findHtmlFiles(dir) {
  let htmlFiles = [];
  const files = await fs.readdir(dir, { withFileTypes: true });
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      htmlFiles = htmlFiles.concat(await findHtmlFiles(fullPath));
    } else if (file.isFile() && path.extname(file.name).toLowerCase() === '.html') {
      htmlFiles.push(fullPath);
    }
  }
  return htmlFiles;
}

// Function to generate screenshots using Puppeteer
async function generateScreenshots(htmlFiles) {
  const browser = await puppeteer.launch({ headless: 'new' });
  const screenshotsDir = path.join(process.cwd(), 'screenshots');
  await fs.mkdir(screenshotsDir, { recursive: true });

  for (const htmlFile of htmlFiles) {
    const page = await browser.newPage();
    const relativePath = path.relative(process.cwd(), htmlFile);
    const screenshotPath = path.join(screenshotsDir, `${path.basename(htmlFile, '.html')}.png`);
    
    try {
      await page.goto(`http://localhost:${port}/${relativePath}`, { waitUntil: 'networkidle2' });
      await page.setViewport({ width: 1280, height: 720 });
      await page.screenshot({ path: screenshotPath });
      console.log(`Screenshot generated for ${htmlFile}`);
    } catch (err) {
      console.error(`Error generating screenshot for ${htmlFile}:`, err);
    }
    await page.close();
  }
  await browser.close();
}

// Function to generate index.html with grid view
async function generateIndexHtml(htmlFiles) {
  const screenshotDir = path.join(process.cwd(), 'screenshots');
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HTML Files Preview</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      background-color: #f4f4f4;
    }
    .grid-container {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
      padding: 20px;
    }
    .grid-item {
      background-color: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      transition: transform 0.2s;
    }
    .grid-item:hover {
      transform: scale(1.05);
    }
    .grid-item img {
      width: 100%;
      height: auto;
      display: block;
    }
    .grid-item a {
      display: block;
      padding: 10px;
      text-align: center;
      text-decoration: none;
      color: #333;
      font-weight: bold;
    }
    .grid-item a:hover {
      background-color: #f0f0f0;
    }
    @media (max-width: 600px) {
      .grid-container {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <h1>HTML Files Preview</h1>
  <div class="grid-container">
    ${htmlFiles
      .map(file => {
        const relativePath = path.relative(process.cwd(), file);
        const screenshotPath = `screenshots/${path.basename(file, '.html')}.png`;
        return `
          <div class="grid-item">
            <a href="${relativePath}">
              <img src="${screenshotPath}" alt="Screenshot of ${path.basename(file)}">
              <span>${path.basename(file)}</span>
            </a>
          </div>
        `;
      })
      .join('')}
  </div>
</body>
</html>
  `;
  await fs.writeFile(path.join(process.cwd(), 'index.html'), htmlContent);
  console.log('index.html generated successfully');
}

// Main function to orchestrate the process
async function main() {
  // Start the HTTP server
  const server = http.createServer(app);
  server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });

  try {
    // Find all HTML files
    const htmlFiles = await findHtmlFiles(process.cwd());
    if (htmlFiles.length === 0) {
      console.log('No HTML files found in the current directory.');
      server.close();
      return;
    }

    // Generate screenshots
    await generateScreenshots(htmlFiles);

    // Generate index.html
    await generateIndexHtml(htmlFiles);

    console.log('Process completed. Visit http://localhost:3000/index.html to view the grid.');
  } catch (err) {
    console.error('Error:', err);
    server.close();
  }
}

// Run the main function
main().catch(err => console.error('Main error:', err));