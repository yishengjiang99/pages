/**
 * Puppeteer test for FinalCut - Basic page loading and rendering
 * Tests the basic functionality of the FinalCut video editor application
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

describe('FinalCut Basic Functionality', () => {
  let browser;
  let page;
  const APP_URL = 'http://localhost:3000/finalcut/dist/';
  const TIMEOUT = 30000;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  beforeEach(async () => {
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
  });

  afterEach(async () => {
    if (page) {
      await page.close();
    }
  });

  test('should load the application without errors', async () => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    
    await page.goto(APP_URL, { waitUntil: 'networkidle2', timeout: TIMEOUT });
    
    expect(errors).toEqual([]);
    expect(page.url()).toContain('finalcut');
  }, TIMEOUT);

  test('should display the main application container', async () => {
    await page.goto(APP_URL, { waitUntil: 'networkidle2', timeout: TIMEOUT });
    
    const rootElement = await page.$('#root');
    expect(rootElement).toBeTruthy();
    
    const hasContent = await page.evaluate(() => {
      const root = document.querySelector('#root');
      return root && root.children.length > 0;
    });
    
    expect(hasContent).toBe(true);
  }, TIMEOUT);

  test('should display token prompt when no token is set', async () => {
    // Clear localStorage before test
    await page.evaluateOnNewDocument(() => {
      localStorage.clear();
    });
    
    await page.goto(APP_URL, { waitUntil: 'networkidle2', timeout: TIMEOUT });
    
    // Wait for token prompt to appear
    await page.waitForSelector('input[placeholder*="token"], input[placeholder*="Token"]', { timeout: TIMEOUT / 6 });
    
    const tokenInput = await page.$('input[placeholder*="token"], input[placeholder*="Token"]');
    expect(tokenInput).toBeTruthy();
  }, TIMEOUT);

  test('should have a file upload input', async () => {
    await page.goto(APP_URL, { waitUntil: 'networkidle2', timeout: TIMEOUT });
    
    const fileInput = await page.$('input[type="file"]');
    expect(fileInput).toBeTruthy();
  }, TIMEOUT);

  test('should have a chat input field', async () => {
    await page.goto(APP_URL, { waitUntil: 'networkidle2', timeout: TIMEOUT });
    
    const chatInput = await page.$('textarea, input[placeholder*="edit"], input[placeholder*="Edit"], input[placeholder*="describe"], input[placeholder*="Describe"]');
    expect(chatInput).toBeTruthy();
  }, TIMEOUT);

  test('should take screenshot of the application', async () => {
    await page.goto(APP_URL, { waitUntil: 'networkidle2', timeout: TIMEOUT });
    
    const screenshotPath = path.join(__dirname, 'screenshots', 'finalcut-basic.png');
    const screenshotDir = path.dirname(screenshotPath);
    
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
    
    await page.screenshot({ path: screenshotPath, fullPage: true });
    
    expect(fs.existsSync(screenshotPath)).toBe(true);
  }, TIMEOUT);
});
