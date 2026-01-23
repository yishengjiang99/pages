import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import crypto from 'crypto';

const unlinkAsync = promisify(fs.unlink);
const mkdirAsync = promisify(fs.mkdir);

// Create temp directory if it doesn't exist
const TEMP_DIR = path.join(process.cwd(), 'temp');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Helper to generate unique filenames
function generateTempFilename(extension = 'mp4') {
  const randomBytes = crypto.randomBytes(16).toString('hex');
  return path.join(TEMP_DIR, `${Date.now()}-${randomBytes}.${extension}`);
}

// Helper to clean up temp files
async function cleanupFile(filepath) {
  try {
    if (filepath && fs.existsSync(filepath)) {
      await unlinkAsync(filepath);
    }
  } catch (error) {
    console.error('Error cleaning up file:', filepath, error);
  }
}

// Aspect ratio presets for social media platforms
const ASPECT_RATIO_PRESETS = {
  '9:16': { width: 1080, height: 1920, description: 'Stories, Reels, & TikToks' },
  '16:9': { width: 1920, height: 1080, description: 'YT thumbnails & Cinematic widescreen' },
  '1:1': { width: 1080, height: 1080, description: 'X feed posts & Profile pics' },
  '2:3': { width: 1080, height: 1620, description: 'Posters, Pinterest & Tall Portraits' },
  '3:2': { width: 1620, height: 1080, description: 'Classic photography, Landscape' }
};

export const videoProcessors = {
  resize_video: async (inputPath, args) => {
    const outputPath = generateTempFilename('mp4');
    
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .videoFilters(`scale=${args.width}:${args.height}`)
        .audioCodec('copy')
        .on('end', () => resolve(outputPath))
        .on('error', (err) => reject(err))
        .save(outputPath);
    });
  },

  crop_video: async (inputPath, args) => {
    const outputPath = generateTempFilename('mp4');
    
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .videoFilters(`crop=${args.width}:${args.height}:${args.x}:${args.y}`)
        .audioCodec('copy')
        .on('end', () => resolve(outputPath))
        .on('error', (err) => reject(err))
        .save(outputPath);
    });
  },

  rotate_video: async (inputPath, args) => {
    const outputPath = generateTempFilename('mp4');
    
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .videoFilters(`rotate=${args.angle}*PI/180`)
        .audioCodec('copy')
        .on('end', () => resolve(outputPath))
        .on('error', (err) => reject(err))
        .save(outputPath);
    });
  },

  add_text: async (inputPath, args) => {
    const outputPath = generateTempFilename('mp4');
    const escapedText = args.text
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/:/g, '\\:')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '')
      .replace(/\t/g, '\\t');
    
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .videoFilters(`drawtext=text='${escapedText}':x=${args.x || 10}:y=${args.y || 10}:fontsize=${args.fontsize || 24}:fontcolor=${args.color || 'white'}`)
        .audioCodec('copy')
        .on('end', () => resolve(outputPath))
        .on('error', (err) => reject(err))
        .save(outputPath);
    });
  },

  trim_video: async (inputPath, args) => {
    const outputPath = generateTempFilename('mp4');
    
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .setStartTime(args.start)
        .setDuration(parseFloat(args.end) - parseFloat(args.start))
        .on('end', () => resolve(outputPath))
        .on('error', (err) => reject(err))
        .save(outputPath);
    });
  },

  adjust_speed: async (inputPath, args) => {
    const outputPath = generateTempFilename('mp4');
    const speed = args.speed;
    const videoSpeed = 1 / speed;
    const audioSpeed = speed;
    
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .videoFilters(`setpts=${videoSpeed}*PTS`)
        .audioFilters(`atempo=${audioSpeed}`)
        .on('end', () => resolve(outputPath))
        .on('error', (err) => reject(err))
        .save(outputPath);
    });
  },

  adjust_audio_volume: async (inputPath, args) => {
    const outputPath = generateTempFilename('mp4');
    
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .audioFilters(`volume=${args.volume}`)
        .videoCodec('copy')
        .on('end', () => resolve(outputPath))
        .on('error', (err) => reject(err))
        .save(outputPath);
    });
  },

  audio_fade: async (inputPath, args) => {
    const outputPath = generateTempFilename('mp4');
    const fadeType = args.type === 'in' ? 'afade=t=in' : 'afade=t=out';
    
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .audioFilters(`${fadeType}:d=${args.duration}`)
        .videoCodec('copy')
        .on('end', () => resolve(outputPath))
        .on('error', (err) => reject(err))
        .save(outputPath);
    });
  },

  audio_highpass: async (inputPath, args) => {
    const outputPath = generateTempFilename('mp4');
    
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .audioFilters(`highpass=f=${args.frequency}`)
        .videoCodec('copy')
        .on('end', () => resolve(outputPath))
        .on('error', (err) => reject(err))
        .save(outputPath);
    });
  },

  audio_lowpass: async (inputPath, args) => {
    const outputPath = generateTempFilename('mp4');
    
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .audioFilters(`lowpass=f=${args.frequency}`)
        .videoCodec('copy')
        .on('end', () => resolve(outputPath))
        .on('error', (err) => reject(err))
        .save(outputPath);
    });
  },

  audio_echo: async (inputPath, args) => {
    const outputPath = generateTempFilename('mp4');
    const delay = args.delay;
    const decay = args.decay;
    
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .audioFilters(`aecho=0.8:0.88:${delay}:${decay}`)
        .videoCodec('copy')
        .on('end', () => resolve(outputPath))
        .on('error', (err) => reject(err))
        .save(outputPath);
    });
  },

  adjust_bass: async (inputPath, args) => {
    const outputPath = generateTempFilename('mp4');
    
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .audioFilters(`bass=g=${args.gain}`)
        .videoCodec('copy')
        .on('end', () => resolve(outputPath))
        .on('error', (err) => reject(err))
        .save(outputPath);
    });
  },

  adjust_treble: async (inputPath, args) => {
    const outputPath = generateTempFilename('mp4');
    
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .audioFilters(`treble=g=${args.gain}`)
        .videoCodec('copy')
        .on('end', () => resolve(outputPath))
        .on('error', (err) => reject(err))
        .save(outputPath);
    });
  },

  audio_equalizer: async (inputPath, args) => {
    const outputPath = generateTempFilename('mp4');
    
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .audioFilters(`equalizer=f=${args.frequency}:width_type=h:width=${args.width || 200}:g=${args.gain}`)
        .videoCodec('copy')
        .on('end', () => resolve(outputPath))
        .on('error', (err) => reject(err))
        .save(outputPath);
    });
  },

  normalize_audio: async (inputPath, args) => {
    const outputPath = generateTempFilename('mp4');
    
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .audioFilters(`loudnorm=I=${args.target}:LRA=11:TP=-1.5`)
        .videoCodec('copy')
        .on('end', () => resolve(outputPath))
        .on('error', (err) => reject(err))
        .save(outputPath);
    });
  },

  audio_delay: async (inputPath, args) => {
    const outputPath = generateTempFilename('mp4');
    
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .audioFilters(`adelay=${args.delay}|${args.delay}`)
        .videoCodec('copy')
        .on('end', () => resolve(outputPath))
        .on('error', (err) => reject(err))
        .save(outputPath);
    });
  },

  resize_video_preset: async (inputPath, args) => {
    const preset = ASPECT_RATIO_PRESETS[args.preset];
    if (!preset) {
      throw new Error(`Unknown preset: ${args.preset}`);
    }
    
    const outputPath = generateTempFilename('mp4');
    
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .videoFilters(`scale=${preset.width}:${preset.height}:force_original_aspect_ratio=decrease,pad=${preset.width}:${preset.height}:(ow-iw)/2:(oh-ih)/2`)
        .audioCodec('copy')
        .on('end', () => resolve(outputPath))
        .on('error', (err) => reject(err))
        .save(outputPath);
    });
  },

  adjust_brightness: async (inputPath, args) => {
    const outputPath = generateTempFilename('mp4');
    
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .videoFilters(`eq=brightness=${args.brightness}`)
        .audioCodec('copy')
        .on('end', () => resolve(outputPath))
        .on('error', (err) => reject(err))
        .save(outputPath);
    });
  },

  adjust_hue: async (inputPath, args) => {
    const outputPath = generateTempFilename('mp4');
    
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .videoFilters(`hue=h=${args.degrees}`)
        .audioCodec('copy')
        .on('end', () => resolve(outputPath))
        .on('error', (err) => reject(err))
        .save(outputPath);
    });
  },

  adjust_saturation: async (inputPath, args) => {
    const outputPath = generateTempFilename('mp4');
    
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .videoFilters(`eq=saturation=${args.saturation}`)
        .audioCodec('copy')
        .on('end', () => resolve(outputPath))
        .on('error', (err) => reject(err))
        .save(outputPath);
    });
  },

  get_video_dimensions: async (inputPath) => {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(inputPath, (err, metadata) => {
        if (err) {
          reject(err);
          return;
        }
        
        const videoStream = metadata.streams.find(s => s.codec_type === 'video');
        if (!videoStream) {
          reject(new Error('No video stream found'));
          return;
        }
        
        // Parse frame rate safely (e.g., "30/1" -> 30, "24000/1001" -> 23.976)
        let frameRate = 0;
        if (videoStream.r_frame_rate) {
          const [numerator, denominator] = videoStream.r_frame_rate.split('/').map(Number);
          if (numerator && denominator) {
            frameRate = numerator / denominator;
          }
        }
        
        resolve({
          width: videoStream.width,
          height: videoStream.height,
          duration: metadata.format.duration,
          codec: videoStream.codec_name,
          frameRate: frameRate
        });
      });
    });
  },

  convert_video_format: async (inputPath, args) => {
    const outputPath = generateTempFilename(args.format);
    
    return new Promise((resolve, reject) => {
      let command = ffmpeg(inputPath);
      
      if (args.codec && args.codec !== 'auto') {
        command = command.videoCodec(args.codec);
      }
      
      command
        .on('end', () => resolve(outputPath))
        .on('error', (err) => reject(err))
        .save(outputPath);
    });
  },

  convert_audio_format: async (inputPath, args) => {
    const outputPath = generateTempFilename(args.format);
    
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .audioBitrate(args.bitrate || '192k')
        .on('end', () => resolve(outputPath))
        .on('error', (err) => reject(err))
        .save(outputPath);
    });
  },

  extract_audio: async (inputPath, args) => {
    const outputPath = generateTempFilename(args.format || 'mp3');
    
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .noVideo()
        .audioBitrate(args.bitrate || '192k')
        .on('end', () => resolve(outputPath))
        .on('error', (err) => reject(err))
        .save(outputPath);
    });
  }
};

export { cleanupFile, generateTempFilename };
