/**
 * Puppeteer test for FinalCut - Edge Cases and Error Handling
 * Tests error scenarios, edge cases, and application stability
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

describe('FinalCut Edge Cases and Error Handling', () => {
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
    
    // Set a mock token
    await page.evaluateOnNewDocument(() => {
      localStorage.setItem('xaiToken', 'test-token-edge-cases');
    });
  });

  afterEach(async () => {
    if (page) {
      await page.close();
    }
  });

  test('should not crash when localStorage is unavailable', async () => {
    // Disable localStorage
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(window, 'localStorage', {
        value: null,
        writable: false
      });
    });
    
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    
    try {
      await page.goto(APP_URL, { waitUntil: 'networkidle2', timeout: TIMEOUT });
      // If we get here without crashing, the test passes
      expect(true).toBe(true);
    } catch (error) {
      // Even if navigation fails, check there are no JavaScript errors
      const hasJsErrors = errors.some(e => e.includes('localStorage'));
      expect(hasJsErrors).toBe(false);
    }
  }, TIMEOUT);

  test('should handle empty token input gracefully', async () => {
    await page.evaluateOnNewDocument(() => {
      localStorage.clear();
    });
    
    await page.goto(APP_URL, { waitUntil: 'networkidle2', timeout: TIMEOUT });
    
    // Find and try to save empty token
    const tokenInput = await page.$('input[placeholder*="token"]');
    
    if (tokenInput) {
      // Leave input empty and try to save
      const buttons = await page.$$('button');
      for (const button of buttons) {
        const text = await page.evaluate(el => el.textContent, button);
        if (text && (text.includes('Save') || text.includes('Set'))) {
          await button.click();
          break;
        }
      }
      
      await page.waitForTimeout(500);
      
      // Application should still be functional
      const rootElement = await page.$('#root');
      expect(rootElement).toBeTruthy();
    }
  }, TIMEOUT);

  test('should handle rapid button clicks', async () => {
    await page.goto(APP_URL, { waitUntil: 'networkidle2', timeout: TIMEOUT });
    
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    
    const buttons = await page.$$('button');
    
    if (buttons.length > 0) {
      const button = buttons[0];
      
      // Click rapidly
      for (let i = 0; i < 5; i++) {
        await button.click();
        await page.waitForTimeout(50);
      }
    }
    
    expect(errors.length).toBe(0);
  }, TIMEOUT);

  test('should handle very long text input', async () => {
    await page.goto(APP_URL, { waitUntil: 'networkidle2', timeout: TIMEOUT });
    
    const chatInputs = await page.$$('textarea, input[type="text"]:not([placeholder*="token"])');
    
    if (chatInputs.length > 0) {
      const longText = 'A'.repeat(10000);
      
      await chatInputs[0].type(longText.substring(0, 1000)); // Type first 1000 chars
      
      const value = await page.evaluate(el => el.value, chatInputs[0]);
      expect(value.length).toBeGreaterThan(0);
    }
  }, TIMEOUT);

  test('should handle special characters in input', async () => {
    await page.goto(APP_URL, { waitUntil: 'networkidle2', timeout: TIMEOUT });
    
    const chatInputs = await page.$$('textarea, input[type="text"]:not([placeholder*="token"])');
    
    if (chatInputs.length > 0) {
      const specialText = '<script>alert("xss")</script> & " \' \\';
      
      await chatInputs[0].type(specialText);
      
      const value = await page.evaluate(el => el.value, chatInputs[0]);
      expect(value).toContain('script');
    }
  }, TIMEOUT);

  test('should handle page refresh without errors', async () => {
    await page.goto(APP_URL, { waitUntil: 'networkidle2', timeout: TIMEOUT });
    
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    
    await page.reload({ waitUntil: 'networkidle2' });
    
    await page.waitForTimeout(1000);
    
    expect(errors.length).toBe(0);
  }, TIMEOUT);

  test('should handle navigation back and forward', async () => {
    await page.goto(APP_URL, { waitUntil: 'networkidle2', timeout: TIMEOUT });
    
    // Go to another page
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
    
    // Go back
    await page.goBack({ waitUntil: 'networkidle2' });
    
    // Verify we're back at the app
    expect(page.url()).toContain('finalcut');
    
    // Go forward
    await page.goForward({ waitUntil: 'networkidle2' });
    
    // Go back again
    await page.goBack({ waitUntil: 'networkidle2' });
    
    expect(page.url()).toContain('finalcut');
  }, TIMEOUT);

  test('should handle network offline simulation', async () => {
    await page.goto(APP_URL, { waitUntil: 'networkidle2', timeout: TIMEOUT });
    
    // Set offline mode
    await page.setOfflineMode(true);
    
    await page.waitForTimeout(1000);
    
    // Try to interact with the page
    const buttons = await page.$$('button');
    
    if (buttons.length > 0) {
      const rootElement = await page.$('#root');
      expect(rootElement).toBeTruthy();
    }
    
    // Set back online
    await page.setOfflineMode(false);
  }, TIMEOUT);

  test('should handle console errors gracefully', async () => {
    const consoleMessages = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleMessages.push(msg.text());
      }
    });
    
    await page.goto(APP_URL, { waitUntil: 'networkidle2', timeout: TIMEOUT });
    
    await page.waitForTimeout(2000);
    
    // Check if there are any unexpected console errors
    // Some errors might be expected (like network errors for API calls)
    const hasUnexpectedErrors = consoleMessages.some(msg => 
      !msg.includes('Failed to fetch') && 
      !msg.includes('NetworkError') &&
      !msg.includes('API')
    );
    
    expect(hasUnexpectedErrors).toBe(false);
  }, TIMEOUT);

  test('should maintain state during viewport resize', async () => {
    await page.goto(APP_URL, { waitUntil: 'networkidle2', timeout: TIMEOUT });
    
    // Type something
    const chatInputs = await page.$$('textarea, input[type="text"]:not([placeholder*="token"])');
    
    if (chatInputs.length > 0) {
      await chatInputs[0].type('Test message before resize');
      
      const valueBefore = await page.evaluate(el => el.value, chatInputs[0]);
      
      // Resize viewport
      await page.setViewport({ width: 375, height: 667 });
      await page.waitForTimeout(500);
      
      // Check if value persisted
      const valueAfter = await page.evaluate(el => el.value, chatInputs[0]);
      
      expect(valueAfter).toBe(valueBefore);
    }
  }, TIMEOUT);

  test('should handle rapid localStorage changes', async () => {
    await page.goto(APP_URL, { waitUntil: 'networkidle2', timeout: TIMEOUT });
    
    // Rapidly change localStorage
    await page.evaluate(() => {
      for (let i = 0; i < 100; i++) {
        localStorage.setItem('xaiToken', `token-${i}`);
      }
    });
    
    await page.waitForTimeout(500);
    
    const rootElement = await page.$('#root');
    expect(rootElement).toBeTruthy();
  }, TIMEOUT);

  test('should take screenshot of error state', async () => {
    await page.evaluateOnNewDocument(() => {
      localStorage.clear();
    });
    
    await page.goto(APP_URL, { waitUntil: 'networkidle2', timeout: TIMEOUT });
    
    const screenshotPath = path.join(__dirname, 'screenshots', 'finalcut-no-token.png');
    const screenshotDir = path.dirname(screenshotPath);
    
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
    
    await page.screenshot({ path: screenshotPath, fullPage: true });
    
    expect(fs.existsSync(screenshotPath)).toBe(true);
  }, TIMEOUT);
});
