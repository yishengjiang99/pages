import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Mock @ffmpeg/ffmpeg
vi.mock('@ffmpeg/ffmpeg', () => ({
  FFmpeg: vi.fn().mockImplementation(() => ({
    load: vi.fn(),
    exec: vi.fn(),
    writeFile: vi.fn(),
    readFile: vi.fn(),
    loaded: false,
  })),
}));

// Mock @ffmpeg/util
vi.mock('@ffmpeg/util', () => ({
  toBlobURL: vi.fn((url) => Promise.resolve(url)),
}));

afterEach(() => {
  cleanup();
});
