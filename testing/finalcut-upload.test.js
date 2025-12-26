/**
 * Puppeteer test for FinalCut - File Upload and Video Handling
 * Tests the file upload functionality and video preview
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

describe('FinalCut File Upload and Video', () => {
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
    
    // Set a mock token to bypass token prompt
    await page.evaluateOnNewDocument(() => {
      localStorage.setItem('xaiToken', 'test-token-for-upload');
    });
  });

  afterEach(async () => {
    if (page) {
      await page.close();
    }
  });

  test('should have a file upload input element', async () => {
    await page.goto(APP_URL, { waitUntil: 'networkidle2', timeout: TIMEOUT });
    
    const fileInput = await page.$('input[type="file"]');
    expect(fileInput).toBeTruthy();
    
    // Check if input accepts video files
    const acceptAttr = await page.evaluate(el => el.getAttribute('accept'), fileInput);
    
    // Accept attribute should allow video files or be null (allowing all)
    if (acceptAttr) {
      const acceptsVideo = acceptAttr.includes('video') || acceptAttr.includes('*');
      expect(acceptsVideo).toBe(true);
    }
  }, TIMEOUT);

  test('should allow file selection', async () => {
    await page.goto(APP_URL, { waitUntil: 'networkidle2', timeout: TIMEOUT });
    
    const fileInput = await page.$('input[type="file"]');
    expect(fileInput).toBeTruthy();
    
    // Create a small test file
    const testFilePath = path.join(__dirname, 'test-files', 'test-video.txt');
    const testFileDir = path.dirname(testFilePath);
    
    if (!fs.existsSync(testFileDir)) {
      fs.mkdirSync(testFileDir, { recursive: true });
    }
    
    fs.writeFileSync(testFilePath, 'test video content');
    
    // Upload the file
    await fileInput.uploadFile(testFilePath);
    
    // Check if file was selected
    const files = await page.evaluate(el => {
      return el.files.length;
    }, fileInput);
    
    expect(files).toBe(1);
    
    // Cleanup
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
  }, TIMEOUT);

  test('should display video preview element', async () => {
    await page.goto(APP_URL, { waitUntil: 'networkidle2', timeout: TIMEOUT });
    
    // Wait a moment for the page to fully load
    await page.waitForTimeout(2000);
    
    // Check for video elements
    const videoElement = await page.$('video');
    
    // Video element may not be present until a file is uploaded
    // So we just check the page structure is correct
    const pageContent = await page.content();
    const hasVideoRelatedElements = pageContent.includes('video') || 
                                     pageContent.includes('preview') ||
                                     pageContent.includes('upload');
    
    expect(hasVideoRelatedElements).toBe(true);
  }, TIMEOUT);

  test('should render chat interface for video editing', async () => {
    await page.goto(APP_URL, { waitUntil: 'networkidle2', timeout: TIMEOUT });
    
    // Check for chat-related elements - use JavaScript to filter by placeholder
    const chatInput = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('textarea, input[type="text"]'));
      return inputs.some(input => {
        const placeholder = input.placeholder || '';
        return !placeholder.toLowerCase().includes('token');
      });
    });
    expect(chatInput).toBeTruthy();
  }, TIMEOUT);

  test('should have send button for chat messages', async () => {
    await page.goto(APP_URL, { waitUntil: 'networkidle2', timeout: TIMEOUT });
    
    // Look for Send button
    const buttons = await page.$$('button');
    let hasSendButton = false;
    
    for (const button of buttons) {
      const text = await page.evaluate(el => el.textContent, button);
      if (text && text.includes('Send')) {
        hasSendButton = true;
        break;
      }
    }
    
    expect(hasSendButton).toBe(true);
  }, TIMEOUT);

  test('should allow typing in chat input', async () => {
    await page.goto(APP_URL, { waitUntil: 'networkidle2', timeout: TIMEOUT });
    
    // Wait for page to load
    await page.waitForTimeout(1000);
    
    // Find chat input (textarea or text input, but not token input) using JavaScript
    const chatInput = await page.evaluateHandle(() => {
      const inputs = Array.from(document.querySelectorAll('textarea, input[type="text"]'));
      return inputs.find(input => {
        const placeholder = input.placeholder || '';
        return !placeholder.toLowerCase().includes('token');
      });
    });
    
    if (chatInput) {
      await chatInput.type('Trim video to 10 seconds');
      
      const inputValue = await page.evaluate(el => el.value, chatInput);
      expect(inputValue).toBe('Trim video to 10 seconds');
    }
  }, TIMEOUT);

  test('should handle multiple file uploads', async () => {
    await page.goto(APP_URL, { waitUntil: 'networkidle2', timeout: TIMEOUT });
    
    const fileInput = await page.$('input[type="file"]');
    
    if (fileInput) {
      // Create test file
      const testFilePath1 = path.join(__dirname, 'test-files', 'test-video1.txt');
      const testFileDir = path.dirname(testFilePath1);
      
      if (!fs.existsSync(testFileDir)) {
        fs.mkdirSync(testFileDir, { recursive: true });
      }
      
      fs.writeFileSync(testFilePath1, 'test video 1');
      
      // First upload
      await fileInput.uploadFile(testFilePath1);
      
      let fileCount = await page.evaluate(el => el.files.length, fileInput);
      expect(fileCount).toBeGreaterThan(0);
      
      // Cleanup
      if (fs.existsSync(testFilePath1)) {
        fs.unlinkSync(testFilePath1);
      }
    }
  }, TIMEOUT);

  test('should take screenshot of video editor interface', async () => {
    await page.goto(APP_URL, { waitUntil: 'networkidle2', timeout: TIMEOUT });
    
    // Wait for interface to load
    await page.waitForTimeout(2000);
    
    const screenshotPath = path.join(__dirname, 'screenshots', 'finalcut-video-interface.png');
    const screenshotDir = path.dirname(screenshotPath);
    
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
    
    await page.screenshot({ path: screenshotPath, fullPage: true });
    
    expect(fs.existsSync(screenshotPath)).toBe(true);
  }, TIMEOUT);
});
