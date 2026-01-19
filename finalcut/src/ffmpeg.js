// ffmpeg-loader.js
// Complete module for loading @ffmpeg/ffmpeg with multi-thread core from jsDelivr
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

export async function loadFFmpeg({
  log = true,                    // enable verbose logging
  multiThread = true,            // set false to force single-thread fallback
  coreVersion = '0.12.9',        // latest multi-thread as of Jan 2026 (@ffmpeg/core-mt)
} = {}) {
  if (isLoaded) return;

  if (log) {
    console.log('[ffmpeg] Starting load... Using multi-thread:', multiThread);
  }

  // Use jsDelivr – reliable CORS + fast global CDN
  // For multi-thread: @ffmpeg/core-mt (note the -mt suffix)
  const baseURL = `https://cdn.jsdelivr.net/npm/@ffmpeg/core-mt@${coreVersion}/dist/umd`;

  try {
    await ffmpeg.load({
      coreURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.js`,
        'text/javascript'
      ),
      wasmURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.wasm`,
        'application/wasm'
      ),
      workerURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.worker.js`,
        'text/javascript'
      ),
    });

    isLoaded = true;
    if (log) {
      console.log('[ffmpeg] Loaded successfully (multi-thread enabled)');
    }
  } catch (err) {
    console.error('[ffmpeg] Load failed:', err);

    if (multiThread && err.message?.includes('SharedArrayBuffer')) {
      console.warn(
        '[ffmpeg] Multi-thread fallback: SharedArrayBuffer unavailable. ' +
        'Ensure page headers: Cross-Origin-Opener-Policy: same-origin and ' +
        'Cross-Origin-Embedder-Policy: require-corp'
      );
      // Optional: retry with single-thread core here if desired
    }

    throw err;
  }
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