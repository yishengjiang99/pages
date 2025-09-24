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
  // Add more if needed
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

  // Find HTML files, exclude index.html in root
  let htmlFiles = findHtmlFiles(CWD).filter(file => path.basename(file).toLowerCase() !== 'index.html');

  if (htmlFiles.length === 0) {
    console.log('No HTML files found.');
    server.close();
    return;
  }

  // Launch Puppeteer
  const browser = await puppeteer.launch({ headless: true });
  
  const items = [];

  for (const file of htmlFiles) {
    const page = await browser.newPage();
    const relPath = path.relative(CWD, file).replace(/\\/g, '/');
    const localUrl = `http://localhost:${PORT}/${relPath}`;
    const screenshotPath = file + '.png';
    const relScreenshot = relPath + '.png';

    try {
      await page.setViewport({ width: 800, height: 600 });
      await page.goto(localUrl, { waitUntil: 'networkidle2' });
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
```​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​