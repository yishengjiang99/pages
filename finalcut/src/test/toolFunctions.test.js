import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toolFunctions } from '../toolFunctions.js';

// Mock ffmpeg module
vi.mock('../ffmpeg.js', () => ({
  ffmpeg: {
    writeFile: vi.fn(),
    exec: vi.fn(),
    readFile: vi.fn(() => new Uint8Array([1, 2, 3, 4])),
  },
  loadFFmpeg: vi.fn(),
}));

describe('toolFunctions', () => {
  let mockAddMessage;
  let mockSetVideoFileData;
  let mockVideoFileData;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAddMessage = vi.fn();
    mockSetVideoFileData = vi.fn();
    mockVideoFileData = new Uint8Array([1, 2, 3]);
    global.URL.createObjectURL = vi.fn(() => 'mock-url');
    global.Blob = vi.fn();
  });

  describe('resize_video', () => {
    it('should validate width and height are provided', async () => {
      const result = await toolFunctions.resize_video(
        { width: null, height: 100 },
        mockVideoFileData,
        mockSetVideoFileData,
        mockAddMessage
      );
      expect(result).toContain('Failed to resize video');
      expect(mockAddMessage).toHaveBeenCalledWith(
        expect.stringContaining('Error resizing video'),
        false
      );
    });

    it('should validate width and height are positive', async () => {
      const result = await toolFunctions.resize_video(
        { width: 0, height: 100 },
        mockVideoFileData,
        mockSetVideoFileData,
        mockAddMessage
      );
      expect(result).toContain('Failed to resize video');
    });

    it('should validate height is positive', async () => {
      const result = await toolFunctions.resize_video(
        { width: 100, height: -1 },
        mockVideoFileData,
        mockSetVideoFileData,
        mockAddMessage
      );
      expect(result).toContain('Failed to resize video');
    });
  });

  describe('crop_video', () => {
    it('should allow x=0 and y=0 as valid coordinates', async () => {
      const { ffmpeg, loadFFmpeg } = await import('../ffmpeg.js');
      const result = await toolFunctions.crop_video(
        { x: 0, y: 0, width: 100, height: 100 },
        mockVideoFileData,
        mockSetVideoFileData,
        mockAddMessage
      );
      expect(result).toBe('Video cropped successfully.');
      expect(ffmpeg.exec).toHaveBeenCalled();
    });

    it('should validate all required parameters', async () => {
      const result = await toolFunctions.crop_video(
        { x: 10, y: 10, width: null, height: 100 },
        mockVideoFileData,
        mockSetVideoFileData,
        mockAddMessage
      );
      expect(result).toContain('Failed to crop video');
    });

    it('should reject negative dimensions', async () => {
      const result = await toolFunctions.crop_video(
        { x: -1, y: 10, width: 100, height: 100 },
        mockVideoFileData,
        mockSetVideoFileData,
        mockAddMessage
      );
      expect(result).toContain('Failed to crop video');
    });
  });

  describe('rotate_video', () => {
    it('should validate angle parameter exists', async () => {
      const result = await toolFunctions.rotate_video(
        {},
        mockVideoFileData,
        mockSetVideoFileData,
        mockAddMessage
      );
      expect(result).toContain('Failed to rotate video');
    });

    it('should allow angle=0 as valid input', async () => {
      const { ffmpeg, loadFFmpeg } = await import('../ffmpeg.js');
      const result = await toolFunctions.rotate_video(
        { angle: 0 },
        mockVideoFileData,
        mockSetVideoFileData,
        mockAddMessage
      );
      expect(result).toBe('Video rotated successfully.');
      expect(ffmpeg.exec).toHaveBeenCalled();
    });

    it('should handle negative angles', async () => {
      const { ffmpeg, loadFFmpeg } = await import('../ffmpeg.js');
      const result = await toolFunctions.rotate_video(
        { angle: -90 },
        mockVideoFileData,
        mockSetVideoFileData,
        mockAddMessage
      );
      expect(result).toBe('Video rotated successfully.');
    });
  });

  describe('add_text', () => {
    it('should validate text parameter is provided', async () => {
      const result = await toolFunctions.add_text(
        {},
        mockVideoFileData,
        mockSetVideoFileData,
        mockAddMessage
      );
      expect(result).toContain('Failed to add text');
    });

    it('should handle special characters in text', async () => {
      const { ffmpeg } = await import('../ffmpeg.js');
      const result = await toolFunctions.add_text(
        { text: "Test's \"quoted\" text: with:colon" },
        mockVideoFileData,
        mockSetVideoFileData,
        mockAddMessage
      );
      expect(result).toBe('Text added to video successfully.');
      const execCall = ffmpeg.exec.mock.calls[0][0];
      const vfArg = execCall.find(arg => arg.includes('drawtext'));
      expect(vfArg).toBeDefined();
    });
  });

  describe('trim_video', () => {
    it('should validate start and end times are provided', async () => {
      const result = await toolFunctions.trim_video(
        { start: null, end: '10' },
        mockVideoFileData,
        mockSetVideoFileData,
        mockAddMessage
      );
      expect(result).toContain('Failed to trim video');
    });

    it('should allow start=0 as valid input', async () => {
      const { ffmpeg, loadFFmpeg } = await import('../ffmpeg.js');
      const result = await toolFunctions.trim_video(
        { start: '0', end: '10' },
        mockVideoFileData,
        mockSetVideoFileData,
        mockAddMessage
      );
      expect(result).toBe('Video trimmed successfully.');
      expect(ffmpeg.exec).toHaveBeenCalled();
    });

    it('should allow numeric start times', async () => {
      const { ffmpeg, loadFFmpeg } = await import('../ffmpeg.js');
      const result = await toolFunctions.trim_video(
        { start: 0, end: 10 },
        mockVideoFileData,
        mockSetVideoFileData,
        mockAddMessage
      );
      expect(result).toBe('Video trimmed successfully.');
    });
  });

  describe('adjust_speed', () => {
    it('should validate speed parameter is provided', async () => {
      const result = await toolFunctions.adjust_speed(
        {},
        mockVideoFileData,
        mockSetVideoFileData,
        mockAddMessage
      );
      expect(result).toContain('Failed to adjust video speed');
    });

    it('should reject zero or negative speed', async () => {
      const result = await toolFunctions.adjust_speed(
        { speed: 0 },
        mockVideoFileData,
        mockSetVideoFileData,
        mockAddMessage
      );
      expect(result).toContain('Failed to adjust video speed');
    });

    it('should handle speeds within normal range (0.5-2.0)', async () => {
      const { ffmpeg } = await import('../ffmpeg.js');
      const result = await toolFunctions.adjust_speed(
        { speed: 1.5 },
        mockVideoFileData,
        mockSetVideoFileData,
        mockAddMessage
      );
      expect(result).toBe('Video speed adjusted successfully.');
      expect(ffmpeg.exec).toHaveBeenCalled();
    });

    it('should handle slow speeds (< 0.5)', async () => {
      const { ffmpeg } = await import('../ffmpeg.js');
      const result = await toolFunctions.adjust_speed(
        { speed: 0.25 },
        mockVideoFileData,
        mockSetVideoFileData,
        mockAddMessage
      );
      expect(result).toBe('Video speed adjusted successfully.');
      expect(ffmpeg.exec).toHaveBeenCalled();
    });

    it('should handle fast speeds (> 2.0)', async () => {
      const { ffmpeg } = await import('../ffmpeg.js');
      const result = await toolFunctions.adjust_speed(
        { speed: 4.0 },
        mockVideoFileData,
        mockSetVideoFileData,
        mockAddMessage
      );
      expect(result).toBe('Video speed adjusted successfully.');
      expect(ffmpeg.exec).toHaveBeenCalled();
    });
  });

  describe('add_audio_track', () => {
    it('should validate audioFile parameter is provided', async () => {
      const result = await toolFunctions.add_audio_track(
        {},
        mockVideoFileData,
        mockSetVideoFileData,
        mockAddMessage
      );
      expect(result).toContain('Failed to add audio track');
      expect(mockAddMessage).toHaveBeenCalledWith(
        expect.stringContaining('Error adding audio track'),
        false
      );
    });

    it('should reject empty audioFile string', async () => {
      const result = await toolFunctions.add_audio_track(
        { audioFile: '' },
        mockVideoFileData,
        mockSetVideoFileData,
        mockAddMessage
      );
      expect(result).toContain('Failed to add audio track');
    });

    it('should validate mode parameter', async () => {
      const mockAudioData = new Uint8Array([1, 2, 3, 4, 5]);
      const result = await toolFunctions.add_audio_track(
        { audioFile: mockAudioData, mode: 'invalid' },
        mockVideoFileData,
        mockSetVideoFileData,
        mockAddMessage
      );
      expect(result).toContain('Failed to add audio track');
      expect(mockAddMessage).toHaveBeenCalledWith(
        expect.stringContaining('Mode must be either "replace" or "mix"'),
        false
      );
    });

    it('should validate volume parameter range', async () => {
      const mockAudioData = new Uint8Array([1, 2, 3, 4, 5]);
      const result = await toolFunctions.add_audio_track(
        { audioFile: mockAudioData, volume: 3.0 },
        mockVideoFileData,
        mockSetVideoFileData,
        mockAddMessage
      );
      expect(result).toContain('Failed to add audio track');
      expect(mockAddMessage).toHaveBeenCalledWith(
        expect.stringContaining('Volume must be between 0.0 and 2.0'),
        false
      );
    });

    it('should accept negative volume values within valid range', async () => {
      const mockAudioData = new Uint8Array([1, 2, 3, 4, 5]);
      const result = await toolFunctions.add_audio_track(
        { audioFile: mockAudioData, volume: -0.5 },
        mockVideoFileData,
        mockSetVideoFileData,
        mockAddMessage
      );
      expect(result).toContain('Failed to add audio track');
    });

    it('should replace audio track with default parameters', async () => {
      const { ffmpeg } = await import('../ffmpeg.js');
      const mockAudioData = new Uint8Array([1, 2, 3, 4, 5]);
      const result = await toolFunctions.add_audio_track(
        { audioFile: mockAudioData },
        mockVideoFileData,
        mockSetVideoFileData,
        mockAddMessage
      );
      expect(result).toBe('Audio track replaced successfully.');
      expect(ffmpeg.writeFile).toHaveBeenCalledWith('input.mp4', mockVideoFileData);
      expect(ffmpeg.writeFile).toHaveBeenCalledWith('audio.mp3', mockAudioData);
      expect(ffmpeg.exec).toHaveBeenCalled();
    });

    it('should replace audio track with custom volume', async () => {
      const { ffmpeg } = await import('../ffmpeg.js');
      const mockAudioData = new Uint8Array([1, 2, 3, 4, 5]);
      const result = await toolFunctions.add_audio_track(
        { audioFile: mockAudioData, mode: 'replace', volume: 0.5 },
        mockVideoFileData,
        mockSetVideoFileData,
        mockAddMessage
      );
      expect(result).toBe('Audio track replaced successfully.');
      expect(ffmpeg.exec).toHaveBeenCalled();
      const execCall = ffmpeg.exec.mock.calls[0][0];
      expect(execCall).toContain('-filter:a');
      expect(execCall).toContain('volume=0.5');
    });

    it('should mix audio tracks', async () => {
      const { ffmpeg } = await import('../ffmpeg.js');
      const mockAudioData = new Uint8Array([1, 2, 3, 4, 5]);
      const result = await toolFunctions.add_audio_track(
        { audioFile: mockAudioData, mode: 'mix', volume: 0.8 },
        mockVideoFileData,
        mockSetVideoFileData,
        mockAddMessage
      );
      expect(result).toBe('Audio track mixed successfully.');
      expect(ffmpeg.exec).toHaveBeenCalled();
      const execCall = ffmpeg.exec.mock.calls[0][0];
      expect(execCall).toContain('-filter_complex');
    });

    it('should handle base64 encoded audio data', async () => {
      const { ffmpeg } = await import('../ffmpeg.js');
      // Create a simple base64 encoded string
      const base64Audio = 'data:audio/mp3;base64,SGVsbG8gV29ybGQ=';
      const result = await toolFunctions.add_audio_track(
        { audioFile: base64Audio, mode: 'replace' },
        mockVideoFileData,
        mockSetVideoFileData,
        mockAddMessage
      );
      expect(result).toBe('Audio track replaced successfully.');
      expect(ffmpeg.writeFile).toHaveBeenCalledWith('audio.mp3', expect.any(Uint8Array));
    });

    it('should handle Uint8Array audio data', async () => {
      const { ffmpeg } = await import('../ffmpeg.js');
      const mockAudioData = new Uint8Array([72, 101, 108, 108, 111]);
      const result = await toolFunctions.add_audio_track(
        { audioFile: mockAudioData, mode: 'replace' },
        mockVideoFileData,
        mockSetVideoFileData,
        mockAddMessage
      );
      expect(result).toBe('Audio track replaced successfully.');
      expect(ffmpeg.writeFile).toHaveBeenCalledWith('audio.mp3', mockAudioData);
    });
  });
});
