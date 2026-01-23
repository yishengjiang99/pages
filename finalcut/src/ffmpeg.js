// ffmpeg-loader.js
// Complete module for loading @ffmpeg/ffmpeg with reliable single-thread core
// Usage: import { ffmpeg, loadFFmpeg, fetchFile } from './ffmpeg-loader.js';

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile as utilFetchFile, toBlobURL } from '@ffmpeg/util';

export const ffmpeg = new FFmpeg();

// Optional: listen to logs/progress (very useful for debugging)
ffmpeg.on('log', ({ message }) => {
  console.log('[ffmpeg log]', message);
});

ffmpeg.on('progress', ({ progress, time }) => {
  console.log(`[ffmpeg progress] ${Math.round(progress * 100)}% - time: ${time}`);
});

let isLoaded = false;

/**
 * Load FFmpeg with single-threaded core for maximum compatibility
 * Uses fallback CDNs for improved reliability
 */
export async function loadFFmpeg({
  log = true,                    // enable verbose logging
  coreVersion = '0.12.6',        // single-thread version (@ffmpeg/core)
} = {}) {
  if (isLoaded) return;

  if (log) {
    console.log('[ffmpeg] Starting load with single-threaded core for maximum compatibility...');
  }

  // Define CDN sources with fallbacks for reliability
  const cdnProviders = [
    {
      name: 'jsDelivr',
      baseURL: `https://cdn.jsdelivr.net/npm/@ffmpeg/core@${coreVersion}/dist/umd`
    },
    {
      name: 'unpkg',
      baseURL: `https://unpkg.com/@ffmpeg/core@${coreVersion}/dist/umd`
    }
  ];

  let lastError = null;

  // Try each CDN provider
  for (const provider of cdnProviders) {
    try {
      if (log) {
        console.log(`[ffmpeg] Attempting to load from ${provider.name}...`);
      }

      const coreURL = await toBlobURL(
        `${provider.baseURL}/ffmpeg-core.js`,
        'text/javascript'
      );
      const wasmURL = await toBlobURL(
        `${provider.baseURL}/ffmpeg-core.wasm`,
        'application/wasm'
      );

      await ffmpeg.load({
        coreURL,
        wasmURL,
      });

      isLoaded = true;
      if (log) {
        console.log(`[ffmpeg] Successfully loaded from ${provider.name} (single-threaded mode)`);
      }
      return;

    } catch (err) {
      lastError = err;
      console.warn(`[ffmpeg] Failed to load from ${provider.name}:`, err.message);
      
      // Continue to next CDN provider
      if (provider !== cdnProviders[cdnProviders.length - 1]) {
        console.log('[ffmpeg] Trying alternative CDN...');
      }
    }
  }

  // All CDN providers failed
  console.error('[ffmpeg] All CDN providers failed. Last error:', lastError);
  throw new Error(
    `Failed to load FFmpeg from all CDN providers. ` +
    `Please check your internet connection and try again. ` +
    `Last error: ${lastError?.message || 'Unknown error'}`
  );
}

/**
 * Helper to convert File/Blob/URL to Uint8Array (compatible with ffmpeg FS)
 * Re-exported from @ffmpeg/util for convenience
 */
export const fetchFile = utilFetchFile;

// Example usage (uncomment to test):
/*
async function example() {
  await loadFFmpeg({ log: true });

  // Write a file to in-memory FS
  await ffmpeg.writeFile('input.mp4', await fetchFile('https://example.com/video.mp4'));

  // Run command
  await ffmpeg.exec(['-i', 'input.mp4', '-c:v', 'copy', 'output.mp4']);

  // Read result
  const data = await ffmpeg.readFile('output.mp4');
  console.log('Output size:', data.length);

  // Create downloadable Blob
  const blob = new Blob([data.buffer], { type: 'video/mp4' });
  const url = URL.createObjectURL(blob);
  console.log('Download URL:', url);
}

example().catch(console.error);
*/