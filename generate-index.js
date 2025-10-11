const fs = require('fs');
const path = require('path');
const http = require('http');
const url = require('url');
const puppeteer = require('puppeteer');

const PORT = 3098;
const CWD = process.cwd();

// MIME types
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

// Recursive search for .html (excluding node_modules)
function findHtmlFiles(dir) {
  let results = [];
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file === 'node_modules') return;
      results = results.concat(findHtmlFiles(fullPath));
    } else if (path.extname(file).toLowerCase() === '.html') {
      results.push(fullPath);
    }
  });
  return results;
}

// Simple static server
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url);
  let pathname = decodeURI(parsedUrl.pathname);
  if (pathname === '/') pathname = '/index.html';

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

server.listen(PORT, async () => {
  console.log(`Server running at http://localhost:${PORT}`);

  // Collect HTML files
  let htmlFiles = findHtmlFiles(CWD).filter(
    file => path.basename(file).toLowerCase() !== 'index.html'
  );

  if (htmlFiles.length === 0) {
    console.log('No HTML files found.');
    server.close();
    return;
  }

  // Create a single placeholder.png
  const placeholderPath = path.join(CWD, 'placeholder.png');
  if (!fs.existsSync(placeholderPath)) {
    const pngHeader = Buffer.from(
      '89504E470D0A1A0A0000000D4948445200000001000000010806000000' +
      '1F15C4890000000A49444154789C63600000020001000502A2D40000000049454E44AE426082',
      'hex'
    );
    fs.writeFileSync(placeholderPath, pngHeader);
  }

  // Build navigation list for drawer
  const navItems = htmlFiles.map(file => ({
    relPath: path.relative(CWD, file).replace(/\\/g, '/'),
    name: path.basename(file)
  }));

  // Launch Puppeteer
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const items = [];

  for (const file of htmlFiles) {
    const relPath = path.relative(CWD, file).replace(/\\/g, '/');
    const localUrl = `http://localhost:${PORT}/${relPath}`;
    const page = await browser.newPage();
    const relScreenshot = relPath + '.png';
    const screenshotPath = file + '.png';
    try {
      await page.setViewport({ width: 800, height: 600 });
      await page.goto(localUrl, { waitUntil: 'networkidle2' });

      // File upload auto-fill
      const hasFileInput = await page.$('input[type="file"]');
      if (hasFileInput) {
        await hasFileInput.uploadFile(placeholderPath);
        console.log(`Uploaded placeholder file to ${relPath}`);
        const submitButton = await page.$('button[type="submit"], input[type="submit"]');
        if (submitButton) {
          await submitButton.click();
          console.log(`Clicked submit on ${relPath}`);
          try { await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 5000 }); } catch { }
        }
      }

      await page.screenshot({ path: screenshotPath }); items.push({ relPath, relScreenshot });
      console.log(`Processed ${relPath}`);
    } catch (err) {
      console.error(`Error with ${relPath}: ${err}`);
    }

    await page.close();
  }

  await browser.close();

  // Inject header + drawer into each HTML
  for (const file of htmlFiles) {
    let content = fs.readFileSync(file, 'utf8');
    const relPath = path.relative(CWD, file).replace(/\\/g, '/');

    // Avoid reinjecting if already done
    if (content.includes('<!-- NAVIGATION INJECTED -->')) continue;

    const navList = navItems.map(
      item => `<a href="${item.relPath}">${item.name}</a>`
    ).join('\n');

    const headerAndDrawer = `
<!-- NAVIGATION INJECTED -->
<style>
  body { margin: 0; font-family: Arial, sans-serif; }
  header {
    background: #333; color: white; padding: 10px 20px;
    display: flex; justify-content: space-between; align-items: center;
    position: sticky; top: 0; z-index: 1000;
  }
  header a { color: white; text-decoration: none; font-weight: bold; }
  .menu-btn { background: none; border: none; color: white; font-size: 1.5em; cursor: pointer; }
  .drawer {
    height: 100%; width: 250px; position: fixed; top: 0; left: -250px;
    background: #444; overflow-x: hidden; transition: 0.3s; padding-top: 60px;
    z-index: 999;
  }
  .drawer.open { left: 0; }
  .drawer a {
    padding: 10px 20px; text-decoration: none; color: white; display: block;
  }
  .drawer a:hover { background: #575757; }
  main { margin: 20px; }
</style>
<header>
  <a href="/index.html">← Back to Index</a>
  <button class="menu-btn" onclick="toggleDrawer()">☰ Menu</button>
</header>
<div id="drawer" class="drawer">
  ${navList}
</div>
<script>
  function toggleDrawer() {
    document.getElementById('drawer').classList.toggle('open');
  }
</script>
`;

    // Inject before </body> or at start
    if (content.includes('</body>')) {
      content = content.replace('</body>', `${headerAndDrawer}</body>`);
    } else {
      content = `${headerAndDrawer}\n${content}`;
    }

    fs.writeFileSync(file, content, 'utf8');
    console.log(`Injected navigation into ${relPath}`);
  }

  // Generate index.html
  const indexHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HTML Index</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .container { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px; }
    .item { border: 1px solid #ddd; border-radius: 8px; overflow: hidden; text-align: center; background: #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .item img { width: 100%; height: auto; display: block; }
    .item a { display: block; padding: 10px; text-decoration: none; color: #333; }
    .item a:hover { background: #f0f0f0; }
  </style>
</head>
<body>
  <h1>HTML Files Index</h1>
  <div class="container">
    ${items.map(item => `
      <div class="item">
        <a href="${item.relPath}">
          <img src="placeholder.png" alt="${item.relPath}">
          <span>${item.relPath}</span>
        </a>
      </div>
    `).join('')}
  </div>
</body>
</html>`;

  fs.writeFileSync(path.join(CWD, 'index.html'), indexHtml.trim());
  console.log('index.html generated.');
  server.close(() => console.log('Server closed.'));
});
