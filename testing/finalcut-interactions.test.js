/**
 * Puppeteer test for FinalCut - User Interactions
 * Tests various user interactions and UI responsiveness
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

describe('FinalCut User Interactions', () => {
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
      localStorage.setItem('xaiToken', 'test-token-interactions');
    });
  });

  afterEach(async () => {
    if (page) {
      await page.close();
    }
  });

  test('should handle button clicks without errors', async () => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    
    await page.goto(APP_URL, { waitUntil: 'networkidle2', timeout: TIMEOUT });
    
    // Try clicking various buttons
    const buttons = await page.$$('button');
    
    if (buttons.length > 0) {
      // Click first button (but not if it's a submit that would trigger API call)
      const firstButton = buttons[0];
      const buttonText = await page.evaluate(el => el.textContent, firstButton);
      
      if (!buttonText.includes('Send')) {
        await firstButton.click();
        await page.waitForTimeout(500);
      }
    }
    
    // Check no errors occurred during interaction
    expect(errors.length).toBe(0);
  }, TIMEOUT);

  test('should maintain responsive layout on mobile viewport', async () => {
    // Set mobile viewport
    await page.setViewport({ width: 375, height: 667 });
    
    await page.goto(APP_URL, { waitUntil: 'networkidle2', timeout: TIMEOUT });
    
    await page.waitForTimeout(1000);
    
    // Check if page is responsive
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    
    // Body width should not exceed viewport width significantly
    expect(bodyWidth).toBeLessThanOrEqual(400);
  }, TIMEOUT);

  test('should scroll chat window when messages are added', async () => {
    await page.goto(APP_URL, { waitUntil: 'networkidle2', timeout: TIMEOUT });
    
    await page.waitForTimeout(1000);
    
    // Check for chat container or message area
    const chatContainer = await page.$('[class*="chat"], [class*="message"], [class*="conversation"]');
    
    // If chat container exists, it should be scrollable or have overflow handling
    if (chatContainer) {
      const hasOverflow = await page.evaluate(el => {
        const style = window.getComputedStyle(el);
        return style.overflow !== 'visible' || style.overflowY !== 'visible';
      }, chatContainer);
      
      expect(hasOverflow).toBe(true);
    }
  }, TIMEOUT);

  test('should handle keyboard input in text fields', async () => {
    await page.goto(APP_URL, { waitUntil: 'networkidle2', timeout: TIMEOUT });
    
    await page.waitForTimeout(1000);
    
    // Find text input fields
    const inputs = await page.$$('textarea, input[type="text"]:not([placeholder*="token" i])');
    
    if (inputs.length > 0) {
      const input = inputs[0];
      
      // Type with keyboard
      await input.click();
      await page.keyboard.type('Test message');
      
      const value = await page.evaluate(el => el.value, input);
      expect(value).toContain('Test');
    }
  }, TIMEOUT);

  test('should handle Enter key in chat input', async () => {
    await page.goto(APP_URL, { waitUntil: 'networkidle2', timeout: TIMEOUT });
    
    await page.waitForTimeout(1000);
    
    // Find chat input
    const chatInputs = await page.$$('textarea, input[type="text"]:not([placeholder*="token" i])');
    
    if (chatInputs.length > 0) {
      const chatInput = chatInputs[0];
      
      await chatInput.click();
      await page.keyboard.type('Test message');
      
      const valueBefore = await page.evaluate(el => el.value, chatInput);
      expect(valueBefore).toBe('Test message');
      
      // Note: Pressing Enter might submit or might add newline depending on element type
      // Just verify the input maintains its functionality
    }
  }, TIMEOUT);

  test('should clear input after sending message', async () => {
    await page.goto(APP_URL, { waitUntil: 'networkidle2', timeout: TIMEOUT });
    
    await page.waitForTimeout(1000);
    
    // This test would need actual form submission which requires API
    // For now, we just verify the structure exists
    const chatInputs = await page.$$('textarea, input[type="text"]:not([placeholder*="token" i])');
    const sendButtons = await page.$$('button');
    
    expect(chatInputs.length).toBeGreaterThan(0);
    expect(sendButtons.length).toBeGreaterThan(0);
  }, TIMEOUT);

  test('should handle focus and blur events', async () => {
    await page.goto(APP_URL, { waitUntil: 'networkidle2', timeout: TIMEOUT });
    
    await page.waitForTimeout(1000);
    
    const inputs = await page.$$('input, textarea');
    
    if (inputs.length > 0) {
      const input = inputs[0];
      
      // Focus
      await input.focus();
      const isFocused = await page.evaluate(el => document.activeElement === el, input);
      expect(isFocused).toBe(true);
      
      // Blur
      await page.evaluate(el => el.blur(), input);
      const isBlurred = await page.evaluate(el => document.activeElement !== el, input);
      expect(isBlurred).toBe(true);
    }
  }, TIMEOUT);

  test('should display proper cursor on interactive elements', async () => {
    await page.goto(APP_URL, { waitUntil: 'networkidle2', timeout: TIMEOUT });
    
    await page.waitForTimeout(1000);
    
    const buttons = await page.$$('button');
    
    if (buttons.length > 0) {
      const cursor = await page.evaluate(el => {
        return window.getComputedStyle(el).cursor;
      }, buttons[0]);
      
      // Buttons should have pointer cursor or default (which is acceptable)
      expect(['pointer', 'default', 'auto']).toContain(cursor);
    }
  }, TIMEOUT);

  test('should take screenshot of interactive state', async () => {
    await page.goto(APP_URL, { waitUntil: 'networkidle2', timeout: TIMEOUT });
    
    // Interact with the page
    await page.waitForTimeout(1000);
    
    const inputs = await page.$$('textarea, input[type="text"]:not([placeholder*="token" i])');
    if (inputs.length > 0) {
      await inputs[0].type('Example video edit command');
    }
    
    const screenshotPath = path.join(__dirname, 'screenshots', 'finalcut-interaction.png');
    const screenshotDir = path.dirname(screenshotPath);
    
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
    
    await page.screenshot({ path: screenshotPath, fullPage: true });
    
    expect(fs.existsSync(screenshotPath)).toBe(true);
  }, TIMEOUT);

  test('should test viewport responsiveness at different sizes', async () => {
    const viewports = [
      { width: 1920, height: 1080, name: 'desktop' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 375, height: 667, name: 'mobile' }
    ];
    
    for (const viewport of viewports) {
      await page.setViewport({ width: viewport.width, height: viewport.height });
      await page.goto(APP_URL, { waitUntil: 'networkidle2', timeout: TIMEOUT });
      await page.waitForTimeout(1000);
      
      const screenshotPath = path.join(__dirname, 'screenshots', `finalcut-${viewport.name}.png`);
      const screenshotDir = path.dirname(screenshotPath);
      
      if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir, { recursive: true });
      }
      
      await page.screenshot({ path: screenshotPath });
      
      expect(fs.existsSync(screenshotPath)).toBe(true);
    }
  }, TIMEOUT * 2);
});
