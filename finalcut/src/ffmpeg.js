import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

export const ffmpeg = new FFmpeg();
let loaded = false;

export async function loadFFmpeg() {
  if (!loaded) {
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });
    loaded = true;
  }
}

export async function fetchFile(file) {
  return new Uint8Array(await file.arrayBuffer());
}
