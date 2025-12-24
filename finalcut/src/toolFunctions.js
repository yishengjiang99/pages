import { ffmpeg, loadFFmpeg } from './ffmpeg.js';

export const toolFunctions = {
  resize_video: async (args, videoFileData, setVideoFileData, addMessage) => {
    try {
      // Validate inputs
      if (args.width === null || args.width === undefined || args.height === null || args.height === undefined) {
        throw new Error('Width and height are required');
      }
      if (args.width <= 0 || args.height <= 0) {
        throw new Error('Width and height must be positive numbers');
      }
      
      await loadFFmpeg();
      await ffmpeg.writeFile('input.mp4', videoFileData);
      await ffmpeg.exec(['-i', 'input.mp4', '-vf', `scale=${args.width}:${args.height}`, '-c:a', 'copy', 'output.mp4']);
      const data = await ffmpeg.readFile('output.mp4');
      const newVideoData = new Uint8Array(data);
      setVideoFileData(newVideoData);
      const videoUrl = URL.createObjectURL(new Blob([data], { type: 'video/mp4' }));
      addMessage('Processed video (resized):', false, videoUrl);
      return 'Video resized successfully.';
    } catch (error) {
      addMessage('Error resizing video: ' + error.message, false);
      return 'Failed to resize video: ' + error.message;
    }
  },
  crop_video: async (args, videoFileData, setVideoFileData, addMessage) => {
    try {
      // Validate inputs - use strict equality to allow 0 values
      if (args.x === null || args.x === undefined || args.y === null || args.y === undefined || args.width === null || args.width === undefined || args.height === null || args.height === undefined) {
        throw new Error('x, y, width, and height are required for cropping');
      }
      if (args.x < 0 || args.y < 0 || args.width <= 0 || args.height <= 0) {
        throw new Error('Crop dimensions must be valid positive numbers');
      }
      
      await loadFFmpeg();
      await ffmpeg.writeFile('input.mp4', videoFileData);
      await ffmpeg.exec(['-i', 'input.mp4', '-vf', `crop=${args.width}:${args.height}:${args.x}:${args.y}`, '-c:a', 'copy', 'output.mp4']);
      const data = await ffmpeg.readFile('output.mp4');
      const newVideoData = new Uint8Array(data);
      setVideoFileData(newVideoData);
      const videoUrl = URL.createObjectURL(new Blob([data], { type: 'video/mp4' }));
      addMessage('Processed video (cropped):', false, videoUrl);
      return 'Video cropped successfully.';
    } catch (error) {
      addMessage('Error cropping video: ' + error.message, false);
      return 'Failed to crop video: ' + error.message;
    }
  },
  rotate_video: async (args, videoFileData, setVideoFileData, addMessage) => {
    try {
      // Validate inputs
      if (args.angle === null || args.angle === undefined) {
        throw new Error('Angle is required for rotation');
      }
      
      await loadFFmpeg();
      await ffmpeg.writeFile('input.mp4', videoFileData);
      await ffmpeg.exec(['-i', 'input.mp4', '-vf', `rotate=${args.angle}*PI/180`, '-c:a', 'copy', 'output.mp4']);
      const data = await ffmpeg.readFile('output.mp4');
      const newVideoData = new Uint8Array(data);
      setVideoFileData(newVideoData);
      const videoUrl = URL.createObjectURL(new Blob([data], { type: 'video/mp4' }));
      addMessage('Processed video (rotated):', false, videoUrl);
      return 'Video rotated successfully.';
    } catch (error) {
      addMessage('Error rotating video: ' + error.message, false);
      return 'Failed to rotate video: ' + error.message;
    }
  },
  add_text: async (args, videoFileData, setVideoFileData, addMessage) => {
    try {
      // Validate inputs - explicitly reject empty strings along with null/undefined
      if (typeof args.text !== 'string' || args.text === '') {
        throw new Error('Text is required and cannot be empty');
      }
      
      await loadFFmpeg();
      // Escape special characters in text to prevent injection
      // Replace single quotes with escaped version and handle other special chars
      const escapedText = args.text
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/:/g, '\\:')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '')
        .replace(/\t/g, '\\t');
      await ffmpeg.writeFile('input.mp4', videoFileData);
      await ffmpeg.exec(['-i', 'input.mp4', '-vf', `drawtext=text='${escapedText}':x=${args.x || 10}:y=${args.y || 10}:fontsize=${args.fontsize || 24}:fontcolor=${args.color || 'white'}`, '-c:a', 'copy', 'output.mp4']);
      const data = await ffmpeg.readFile('output.mp4');
      const newVideoData = new Uint8Array(data);
      setVideoFileData(newVideoData);
      const videoUrl = URL.createObjectURL(new Blob([data], { type: 'video/mp4' }));
      addMessage('Processed video (text added):', false, videoUrl);
      return 'Text added to video successfully.';
    } catch (error) {
      addMessage('Error adding text to video: ' + error.message, false);
      return 'Failed to add text to video: ' + error.message;
    }
  },
  trim_video: async (args, videoFileData, setVideoFileData, addMessage) => {
    try {
      // Validate inputs - use strict equality to allow 0 as a valid start time
      if (args.start === null || args.start === undefined || args.end === null || args.end === undefined) {
        throw new Error('Start and end times are required for trimming');
      }
      
      await loadFFmpeg();
      await ffmpeg.writeFile('input.mp4', videoFileData);
      await ffmpeg.exec(['-i', 'input.mp4', '-ss', args.start, '-to', args.end, '-c', 'copy', 'output.mp4']);
      const data = await ffmpeg.readFile('output.mp4');
      const newVideoData = new Uint8Array(data);
      setVideoFileData(newVideoData);
      const videoUrl = URL.createObjectURL(new Blob([data], { type: 'video/mp4' }));
      addMessage('Processed video (trimmed):', false, videoUrl);
      return 'Video trimmed successfully.';
    } catch (error) {
      addMessage('Error trimming video: ' + error.message, false);
      return 'Failed to trim video: ' + error.message;
    }
  },
  adjust_speed: async (args, videoFileData, setVideoFileData, addMessage) => {
    try {
      // Validate inputs
      if (args.speed === null || args.speed === undefined || args.speed <= 0) {
        throw new Error('Speed must be a positive number');
      }
      
      await loadFFmpeg();
      await ffmpeg.writeFile('input.mp4', videoFileData);
      
      // atempo filter only supports values between 0.5 and 2.0
      // For values outside this range, we need to chain multiple atempo filters
      let audioFilter = '';
      let speed = args.speed;
      
      if (speed >= 0.5 && speed <= 2.0) {
        audioFilter = `atempo=${speed}`;
      } else if (speed < 0.5) {
        // Chain atempo filters for slow speeds
        let remainingSpeed = speed;
        const filters = [];
        while (remainingSpeed < 0.5) {
          filters.push('atempo=0.5');
          remainingSpeed *= 2;
        }
        if (remainingSpeed !== 1.0) {
          filters.push(`atempo=${remainingSpeed}`);
        }
        audioFilter = filters.join(',');
      } else {
        // Chain atempo filters for fast speeds
        let remainingSpeed = speed;
        const filters = [];
        while (remainingSpeed > 2.0) {
          filters.push('atempo=2.0');
          remainingSpeed /= 2;
        }
        if (remainingSpeed !== 1.0) {
          filters.push(`atempo=${remainingSpeed}`);
        }
        audioFilter = filters.join(',');
      }
      
      await ffmpeg.exec(['-i', 'input.mp4', '-filter:v', `setpts=PTS/${args.speed}`, '-filter:a', audioFilter, 'output.mp4']);
      const data = await ffmpeg.readFile('output.mp4');
      const newVideoData = new Uint8Array(data);
      setVideoFileData(newVideoData);
      const videoUrl = URL.createObjectURL(new Blob([data], { type: 'video/mp4' }));
      addMessage('Processed video (speed adjusted):', false, videoUrl);
      return 'Video speed adjusted successfully.';
    } catch (error) {
      addMessage('Error adjusting video speed: ' + error.message, false);
      return 'Failed to adjust video speed: ' + error.message;
    }
  },
  add_audio_track: async (args, videoFileData, setVideoFileData, addMessage) => {
    try {
      // Validate inputs
      if (!args.audioFile || args.audioFile === '') {
        throw new Error('Audio file is required');
      }
      
      const mode = args.mode || 'replace';
      const volume = args.volume !== undefined ? args.volume : 1.0;
      
      // Validate mode
      if (mode !== 'replace' && mode !== 'mix') {
        throw new Error('Mode must be either "replace" or "mix"');
      }
      
      // Validate volume
      if (volume < 0 || volume > 2.0) {
        throw new Error('Volume must be between 0.0 and 2.0');
      }
      
      await loadFFmpeg();
      await ffmpeg.writeFile('input.mp4', videoFileData);
      
      // Assume audioFile is a Uint8Array
      let audioData;
      if (typeof args.audioFile === 'string') {
        // If it's a base64 string, decode it
        const base64Data = args.audioFile.split(',')[1] || args.audioFile;
        const binaryString = atob(base64Data);
        audioData = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          audioData[i] = binaryString.charCodeAt(i);
        }
      } else if (args.audioFile instanceof Uint8Array) {
        audioData = args.audioFile;
      } else {
        throw new Error('Audio file must be a base64 string or Uint8Array');
      }
      
      await ffmpeg.writeFile('audio.mp3', audioData);
      
      // Build FFmpeg command based on mode
      if (mode === 'replace') {
        // Replace audio: use video from first input, audio from second input
        await ffmpeg.exec([
          '-i', 'input.mp4',
          '-i', 'audio.mp3',
          '-map', '0:v',
          '-map', '1:a',
          '-filter:a', `volume=${volume}`,
          '-c:v', 'copy',
          '-shortest',
          'output.mp4'
        ]);
      } else {
        // Mix audio: combine both audio tracks
        await ffmpeg.exec([
          '-i', 'input.mp4',
          '-i', 'audio.mp3',
          '-filter_complex', `[0:a]volume=1.0[a0];[1:a]volume=${volume}[a1];[a0][a1]amix=inputs=2:duration=shortest`,
          '-map', '0:v',
          '-c:v', 'copy',
          'output.mp4'
        ]);
      }
      
      const data = await ffmpeg.readFile('output.mp4');
      const newVideoData = new Uint8Array(data);
      setVideoFileData(newVideoData);
      const videoUrl = URL.createObjectURL(new Blob([data], { type: 'video/mp4' }));
      addMessage(`Processed video (audio track ${mode === 'replace' ? 'replaced' : 'mixed'}):`, false, videoUrl);
      return `Audio track ${mode === 'replace' ? 'replaced' : 'mixed'} successfully.`;
    } catch (error) {
      addMessage('Error adding audio track: ' + error.message, false);
      return 'Failed to add audio track: ' + error.message;
    }
  }
};
