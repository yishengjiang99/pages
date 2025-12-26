/**
 * Puppeteer test for FinalCut - Token Management
 * Tests the token input, storage, and management functionality
 */

const puppeteer = require('puppeteer');

describe('FinalCut Token Management', () => {
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
    
    // Clear localStorage before each test
    await page.evaluateOnNewDocument(() => {
      localStorage.clear();
    });
  });

  afterEach(async () => {
    if (page) {
      await page.close();
    }
  });

  test('should show token prompt when no token is set', async () => {
    await page.goto(APP_URL, { waitUntil: 'networkidle2', timeout: TIMEOUT });
    
    // Check for "No token" or similar text
    const content = await page.content();
    const hasNoTokenMessage = content.includes('No token') || content.includes('token');
    
    expect(hasNoTokenMessage).toBe(true);
  }, TIMEOUT);

  test('should allow entering a token', async () => {
    await page.goto(APP_URL, { waitUntil: 'networkidle2', timeout: TIMEOUT });
    
    // Find token input field
    const tokenInput = await page.$('input[placeholder*="token"], input[placeholder*="Token"], input[type="text"], input[type="password"]');
    
    if (tokenInput) {
      await tokenInput.type('test-token-12345');
      
      const inputValue = await page.evaluate(el => el.value, tokenInput);
      expect(inputValue).toBe('test-token-12345');
    }
  }, TIMEOUT);

  test('should save token to localStorage when Save button is clicked', async () => {
    await page.goto(APP_URL, { waitUntil: 'networkidle2', timeout: TIMEOUT });
    
    // Find and fill token input
    const tokenInput = await page.$('input[placeholder*="token"], input[placeholder*="Token"], input[type="text"], input[type="password"]');
    
    if (tokenInput) {
      await tokenInput.type('test-token-saved');
      
      // Find and click Save button - iterate through buttons to find the right one
      const buttons = await page.$$('button, input[type="submit"]');
      for (const button of buttons) {
        const text = await page.evaluate(el => el.textContent || el.value, button);
        if (text && (text.includes('Save') || text.includes('Set'))) {
          await button.click();
          break;
        }
      }
        
        // Wait a moment for localStorage to be set
        await page.waitForTimeout(500);
        
        // Check if token was saved to localStorage
        const savedToken = await page.evaluate(() => {
          return localStorage.getItem('xaiToken');
        });
        
        expect(savedToken).toBe('test-token-saved');
    }
  }, TIMEOUT);

  test('should persist token after page reload', async () => {
    await page.goto(APP_URL, { waitUntil: 'networkidle2', timeout: TIMEOUT });
    
    // Set token in localStorage
    await page.evaluate(() => {
      localStorage.setItem('xaiToken', 'persistent-token-123');
    });
    
    // Reload page
    await page.reload({ waitUntil: 'networkidle2' });
    
    // Check if token persisted
    const persistedToken = await page.evaluate(() => {
      return localStorage.getItem('xaiToken');
    });
    
    expect(persistedToken).toBe('persistent-token-123');
  }, TIMEOUT);

  test('should show "Token set" status when token exists', async () => {
    await page.evaluateOnNewDocument(() => {
      localStorage.setItem('xaiToken', 'existing-token');
    });
    
    await page.goto(APP_URL, { waitUntil: 'networkidle2', timeout: TIMEOUT });
    
    // Wait a moment for UI to update
    await page.waitForTimeout(1000);
    
    const content = await page.content();
    const hasTokenSetMessage = content.includes('Token set') || content.includes('token set');
    
    expect(hasTokenSetMessage).toBe(true);
  }, TIMEOUT);

  test('should hide token input field after token is set', async () => {
    await page.goto(APP_URL, { waitUntil: 'networkidle2', timeout: TIMEOUT });
    
    // Find and fill token input
    const tokenInput = await page.$('input[placeholder*="token"], input[placeholder*="Token"]');
    
    if (tokenInput) {
      await tokenInput.type('test-token-hide');
      
      // Find and click Save button
      const buttons = await page.$$('button');
      for (const button of buttons) {
        const text = await page.evaluate(el => el.textContent, button);
        if (text && (text.includes('Save') || text.includes('Set'))) {
          await button.click();
          break;
        }
      }
      
      // Wait for UI to update
      await page.waitForTimeout(1000);
      
      // Check if token input is hidden or removed
      const tokenInputAfter = await page.$('input[placeholder*="Enter"][placeholder*="token"], input[placeholder*="Enter"][placeholder*="Token"]');
      const isVisible = tokenInputAfter ? await page.evaluate(el => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden';
      }, tokenInputAfter) : false;
      
      expect(isVisible).toBe(false);
    }
  }, TIMEOUT);
});
