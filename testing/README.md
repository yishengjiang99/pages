# FinalCut Puppeteer Tests

This directory contains end-to-end Puppeteer tests for the FinalCut video editor application.

## Overview

The test suite covers:

1. **Basic Functionality** (`finalcut-basic.test.js`)
   - Application loading and rendering
   - Main container display
   - Token prompt display
   - File upload input presence
   - Chat interface elements
   - Screenshot generation

2. **Token Management** (`finalcut-token.test.js`)
   - Token prompt display when not set
   - Token input functionality
   - Token persistence in localStorage
   - Token status display
   - UI updates after token is set

3. **File Upload and Video** (`finalcut-upload.test.js`)
   - File input element presence
   - File selection functionality
   - Video preview elements
   - Chat interface for video editing
   - Multiple file upload handling

4. **User Interactions** (`finalcut-interactions.test.js`)
   - Button click handling
   - Responsive layout testing
   - Keyboard input handling
   - Focus and blur events
   - Viewport responsiveness at different screen sizes

5. **Edge Cases and Error Handling** (`finalcut-edge-cases.test.js`)
   - localStorage unavailability handling
   - Empty token input handling
   - Rapid button clicks
   - Long text input handling
   - Special characters in input
   - Page refresh handling
   - Navigation back/forward
   - Network offline simulation
   - State persistence during viewport resize

## Prerequisites

- Node.js 18 or higher
- npm
- The FinalCut application must be built (`npm run build` in the finalcut directory)
- A local server must be running on port 3000 serving the application

## Installation

```bash
npm install
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm test:watch
```

### Run tests with coverage
```bash
npm test:coverage
```

## Test Configuration

Tests are configured to:
- Run in headless mode by default
- Use `--no-sandbox` and `--disable-setuid-sandbox` flags for CI/CD compatibility
- Set a 30-second timeout for each test
- Use a viewport size of 1280x720 (desktop) or smaller for mobile tests

## Server Setup

Before running tests, ensure a local development server is running:

```bash
# From the repository root
npm start
```

This will start a server on `http://localhost:3000` serving the FinalCut application at `/finalcut/dist/`.

## Screenshots

Tests automatically generate screenshots in the `screenshots/` directory for visual verification:
- `finalcut-basic.png` - Basic application state
- `finalcut-video-interface.png` - Video editor interface
- `finalcut-interaction.png` - Interactive state
- `finalcut-desktop.png` - Desktop viewport
- `finalcut-tablet.png` - Tablet viewport
- `finalcut-mobile.png` - Mobile viewport

## Test Files

Test files are created in `test-files/` during test execution and cleaned up automatically.

## Notes

- Tests use mock tokens to bypass API authentication
- Some tests mock file uploads with text files for simplicity
- The test suite runs serially (`--runInBand`) to avoid conflicts
- Tests clear localStorage before each run to ensure consistent state

## Troubleshooting

If tests fail:
1. Ensure the FinalCut app is built: `cd ../finalcut && npm run build`
2. Ensure the server is running: `npm start` from repository root
3. Check that port 3000 is not in use by another process
4. Verify puppeteer is installed correctly: `npm list puppeteer`

## CI/CD Integration

These tests can be integrated into CI/CD pipelines. Make sure to:
- Build the FinalCut application before running tests
- Start the server in the background
- Set appropriate timeouts for slower CI environments
- Use headless mode (default)
