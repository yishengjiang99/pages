const fs = require('fs');
const path = require('path');
const http = require('http');
const url = require('url');
const puppeteer = require('puppeteer');

const PORT = 3000;
const CWD = process.cwd();

// Simple MIME types
const mimeTypes = {
  '.html': 'text/html',
  '.htm': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.txt': 'text/plain',
};

// Recursive function to find all .html files
function findHtmlFiles(dir) {
  let results = [];
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(findHtmlFiles(fullPath));
    } else if (path.extname(file).toLowerCase() === '.html') {
      results.push(fullPath);
    }
  });
  return results;
}

// Create static server
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url);
  let pathname = decodeURI(parsedUrl.pathname);
  if (pathname === '/') pathname = '/index.html'; // But won't exist yet

  const filePath = path.join(CWD, pathname);
  fs.stat(filePath, (err, stat) => {
    if (err || stat.isDirectory()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
      }
    });
  });
});

// Start server and perform tasks
server.listen(PORT, async () => {
  console.log(`Server running at http://localhost:${PORT}`);

  // Create symlink for finalcut.html -> finalcut/dist/index.html
  const finalcutSymlink = path.join(CWD, 'finalcut.html');
  const finalcutTarget = path.join(CWD, 'finalcut', 'dist', 'index.html');
  
  // Remove existing symlink if it exists
  if (fs.existsSync(finalcutSymlink)) {
    fs.unlinkSync(finalcutSymlink);
  }
  
  // Create the symlink if the target exists
  if (fs.existsSync(finalcutTarget)) {
    fs.symlinkSync(finalcutTarget, finalcutSymlink);
    console.log(`Created symlink: finalcut.html -> finalcut/dist/index.html`);
  } else {
    console.log(`Warning: finalcut/dist/index.html does not exist, symlink not created`);
  }

  // Find HTML files, exclude index.html in root
  let htmlFiles = findHtmlFiles(CWD).filter(file => path.basename(file).toLowerCase() !== 'index.html');

  if (htmlFiles.length === 0) {
    console.log('No HTML files found.');
    server.close();
    return;
  }

  // Launch Puppeteer with --no-sandbox
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const items = [];

  for (const file of htmlFiles) {
    if (file.includes('node_modules')) continue; // Skip node_modules
    if (file.includes("_test_")) continue; // Skip test files
    const page = await browser.newPage();
    const relPath = path.relative(CWD, file).replace(/\\/g, '/');
    const localUrl = `http://localhost:${PORT}/${relPath}`;
    const screenshotPath = file + '.png';
    const relScreenshot = relPath + '.png';

    try {
      await page.setViewport({ width: 800, height: 600 });
      await page.goto(localUrl, { waitUntil: 'networkidle2' });

      // --- NEW: Handle file inputs and submit buttons ---
      const hasFileInput = await page.$('input[type="file"]');
      if (hasFileInput) {
        const tmpFilePath = path.join(CWD, 'placeholder_upload.png');

        // Create a small placeholder PNG if it doesn't exist
        if (!fs.existsSync(tmpFilePath)) {
          const pngHeader = Buffer.from(
            '89504E470D0A1A0A0000000D4948445200000001000000010806000000' +
            '1F15C4890000000A49444154789C6360000002000100' +
            '0502A2D40000000049454E44AE426082', 'hex'
          );
          fs.writeFileSync(tmpFilePath, pngHeader);
        }

        // Upload file to input
        await hasFileInput.uploadFile(tmpFilePath);
        console.log(`Uploaded placeholder file to ${relPath}`);

        // Look for a submit button
        const submitButton = await page.$('button[type="submit"], input[type="submit"]');
        if (submitButton) {
          await submitButton.click();
          console.log(`Clicked submit on ${relPath}`);
          // Wait briefly for navigation or response
          try {
            await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 5000 });
          } catch {
            // Ignore timeout — some forms might not navigate
          }
        }
      }
      // --- END NEW ---

      await page.screenshot({ path: screenshotPath });
      items.push({ relPath, relScreenshot });
      console.log(`Screenshot generated for ${relPath}`);
    } catch (err) {
      console.error(`Error screenshotting ${relPath}: ${err}`);
    }

    await page.close();
  }

  await browser.close();

  // Generate index.html
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HTML Index</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .container {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 20px;
    }
    .item {
      border: 1px solid #ddd;
      border-radius: 8px;
      overflow: hidden;
      text-align: center;
      background: #fff;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .item img {
      width: 100%;
      height: auto;
      display: block;
    }
    .item a {
      display: block;
      padding: 10px;
      text-decoration: none;
      color: #333;
    }
    .item a:hover {
      background: #f0f0f0;
    }
    @media (max-width: 600px) {
      .container {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <h1>HTML Files Index</h1>
  <div class="container">
    ${items.map(item => `
      <div class="item">
        <a href="${item.relPath}">
          <img src="${item.relScreenshot}" alt="${item.relPath}">
          <span>${item.relPath}</span>
        </a>
      </div>
    `).join('')}
  </div>
</body>
</html>
  `;

  const indexPath = path.join(CWD, 'index.html');
  fs.writeFileSync(indexPath, htmlContent.trim());
  console.log('index.html generated.');

  // Close server
  server.close(() => {
    console.log('Server closed.');
  });
});