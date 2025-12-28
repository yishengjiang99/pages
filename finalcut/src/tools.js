export const tools = [
  {
    type: 'function',
    function: {
      name: 'resize_video',
      description: 'Resize the video to the specified width and height while maintaining aspect ratio if needed. This filter scales the video dimensions.',
      parameters: {
        type: 'object',
        properties: {
          width: { type: 'integer', description: 'The new width in pixels. Must be a positive even number for most codecs.' },
          height: { type: 'integer', description: 'The new height in pixels. Must be a positive even number for most codecs. Use -1 to auto-scale based on width.' }
        },
        required: ['width', 'height']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'crop_video',
      description: 'Crop a region of the video starting from the specified top-left corner with given width and height. Useful for removing borders or focusing on a part of the frame.',
      parameters: {
        type: 'object',
        properties: {
          x: { type: 'integer', description: 'The x-coordinate of the top-left corner of the crop area.' },
          y: { type: 'integer', description: 'The y-coordinate of the top-left corner of the crop area.' },
          width: { type: 'integer', description: 'The width of the crop area in pixels.' },
          height: { type: 'integer', description: 'The height of the crop area in pixels.' }
        },
        required: ['x', 'y', 'width', 'height']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'rotate_video',
      description: 'Rotate the video by the specified angle in degrees. Common for correcting orientation, e.g., 90 for clockwise, -90 for counter-clockwise.',
      parameters: {
        type: 'object',
        properties: {
          angle: { type: 'number', description: 'The rotation angle in degrees. Positive for clockwise, negative for counter-clockwise.' }
        },
        required: ['angle']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'add_text',
      description: 'Overlay text on the video at a specified position with customizable size and color. Note: This assumes a default font is available in FFmpeg.',
      parameters: {
        type: 'object',
        properties: {
          text: { type: 'string', description: 'The text to overlay on the video.' },
          x: { type: 'integer', description: 'The x-position for the text (default: 10).', default: 10 },
          y: { type: 'integer', description: 'The y-position for the text (default: 10).', default: 10 },
          fontsize: { type: 'integer', description: 'The font size (default: 24).', default: 24 },
          color: { type: 'string', description: 'The font color (default: white).', default: 'white' }
        },
        required: ['text']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'trim_video',
      description: 'Trim the video to keep only the portion between the start and end times. Times can be in seconds or HH:MM:SS format.',
      parameters: {
        type: 'object',
        properties: {
          start: { type: 'string', description: 'The start time (e.g., 00:00:10 or 10).' },
          end: { type: 'string', description: 'The end time (e.g., 00:00:30 or 30).' }
        },
        required: ['start', 'end']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'adjust_speed',
      description: 'Change the playback speed of the video and audio. A factor >1 speeds up, <1 slows down.',
      parameters: {
        type: 'object',
        properties: {
          speed: { type: 'number', description: 'The speed factor (e.g., 2 for double speed, 0.5 for half speed).' }
        },
        required: ['speed']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'add_audio_track',
      description: 'Add or replace the audio track in a video with a new audio file. This can be used to add background music, voiceovers, or replace the existing audio entirely.',
      parameters: {
        type: 'object',
        properties: {
          audioFile: { type: 'string', description: 'The audio file data (base64 encoded or file reference) to add to the video.' },
          mode: { 
            type: 'string', 
            description: 'The audio mixing mode: "replace" to replace existing audio, or "mix" to mix with existing audio.',
            enum: ['replace', 'mix'],
            default: 'replace'
          },
          volume: { 
            type: 'number', 
            description: 'Volume level for the new audio track (0.0 to 2.0, where 1.0 is original volume). Default is 1.0.',
            default: 1.0
          }
        },
        required: ['audioFile']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'adjust_audio_volume',
      description: 'Adjust the volume level of the audio track. Can be used to make audio louder or quieter.',
      parameters: {
        type: 'object',
        properties: {
          volume: { 
            type: 'number', 
            description: 'Volume multiplier (e.g., 0.5 for half volume, 2.0 for double volume, 1.0 for no change).',
            default: 1.0
          }
        },
        required: ['volume']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'audio_fade',
      description: 'Apply fade in or fade out effect to the audio. Useful for smooth transitions at the beginning or end of videos.',
      parameters: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            description: 'Type of fade: "in" for fade in at start, "out" for fade out at end.',
            enum: ['in', 'out']
          },
          duration: {
            type: 'number',
            description: 'Duration of the fade effect in seconds.',
            default: 3
          }
        },
        required: ['type', 'duration']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'audio_highpass',
      description: 'Apply a high-pass filter to remove low frequency sounds (bass). Useful for reducing rumble or bass noise.',
      parameters: {
        type: 'object',
        properties: {
          frequency: {
            type: 'number',
            description: 'Cutoff frequency in Hz. Frequencies below this will be attenuated. Typical values: 80-300 Hz.',
            default: 200
          }
        },
        required: ['frequency']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'audio_lowpass',
      description: 'Apply a low-pass filter to remove high frequency sounds (treble). Useful for reducing hiss or high-pitched noise.',
      parameters: {
        type: 'object',
        properties: {
          frequency: {
            type: 'number',
            description: 'Cutoff frequency in Hz. Frequencies above this will be attenuated. Typical values: 3000-8000 Hz.',
            default: 3000
          }
        },
        required: ['frequency']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'audio_echo',
      description: 'Add an echo effect to the audio. Creates a repetition of the sound with decay.',
      parameters: {
        type: 'object',
        properties: {
          delay: {
            type: 'number',
            description: 'Delay time in milliseconds for the echo effect. Typical values: 500-2000 ms.',
            default: 1000
          },
          decay: {
            type: 'number',
            description: 'Echo decay factor (0.0 to 1.0). Higher values create longer-lasting echoes.',
            default: 0.5
          }
        },
        required: ['delay', 'decay']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'adjust_bass',
      description: 'Adjust the bass (low frequency) level of the audio. Boost or cut bass frequencies.',
      parameters: {
        type: 'object',
        properties: {
          gain: {
            type: 'number',
            description: 'Bass gain in dB. Positive values boost bass, negative values reduce bass. Range: -20 to 20 dB.',
            default: 0
          }
        },
        required: ['gain']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'adjust_treble',
      description: 'Adjust the treble (high frequency) level of the audio. Boost or cut treble frequencies.',
      parameters: {
        type: 'object',
        properties: {
          gain: {
            type: 'number',
            description: 'Treble gain in dB. Positive values boost treble, negative values reduce treble. Range: -20 to 20 dB.',
            default: 0
          }
        },
        required: ['gain']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'audio_equalizer',
      description: 'Apply a parametric equalizer to adjust specific frequency bands. Useful for fine-tuning audio.',
      parameters: {
        type: 'object',
        properties: {
          frequency: {
            type: 'number',
            description: 'Center frequency in Hz to adjust. Common values: 100 (bass), 1000 (midrange), 10000 (treble).',
          },
          width: {
            type: 'number',
            description: 'Bandwidth of the frequency range in Hz. Wider values affect more frequencies.',
            default: 200
          },
          gain: {
            type: 'number',
            description: 'Gain in dB. Positive values boost, negative values cut. Range: -20 to 20 dB.',
            default: 0
          }
        },
        required: ['frequency', 'gain']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'normalize_audio',
      description: 'Normalize audio loudness to a standard level. Useful for ensuring consistent volume across different videos.',
      parameters: {
        type: 'object',
        properties: {
          target: {
            type: 'number',
            description: 'Target loudness in LUFS (Loudness Units relative to Full Scale). Standard values: -23 (broadcast), -16 (streaming).',
            default: -16
          }
        },
        required: ['target']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'audio_delay',
      description: 'Delay audio by a specified amount of time. Useful for syncing audio with video.',
      parameters: {
        type: 'object',
        properties: {
          delay: {
            type: 'number',
            description: 'Delay time in milliseconds. Positive values delay the audio.',
            default: 0
          }
        },
        required: ['delay']
      }
    }
  }
];

export const systemPrompt = 'You are a helpful video editing assistant. Use the provided tools to apply filters and edits to the uploaded video. Respond with descriptions of actions and call tools when appropriate to perform the edits.';
