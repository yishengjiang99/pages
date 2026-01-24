import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Mock window.matchMedia for dark mode detection
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock @ffmpeg/ffmpeg
vi.mock('@ffmpeg/ffmpeg', () => ({
  FFmpeg: vi.fn().mockImplementation(() => ({
    load: vi.fn(),
    exec: vi.fn(),
    writeFile: vi.fn(),
    readFile: vi.fn(),
    on: vi.fn(),
    terminate: vi.fn(),
    loaded: false,
  })),
}));

// Mock @ffmpeg/util
vi.mock('@ffmpeg/util', () => ({
  toBlobURL: vi.fn((url, mimeType, useCache, progressCallback) => {
    // Simulate progress callback if provided
    if (progressCallback) {
      progressCallback({ url, received: 1000 });
    }
    return Promise.resolve(url);
  }),
  fetchFile: vi.fn(),
}));

afterEach(() => {
  cleanup();
});
