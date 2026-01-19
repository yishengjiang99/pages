import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

export const ffmpeg = new FFmpeg();
let loaded = false;

export async function loadFFmpeg() {
  if (loaded) return;

  // Official CORS-friendly CDN (recommended)
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd';

  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    // Optional but recommended for better performance
    workerURL: await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, 'text/javascript'),
  });

  loaded = true;
}