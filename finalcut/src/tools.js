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
  }
];

export const systemPrompt = 'You are a helpful video editing assistant. Use the provided tools to apply filters and edits to the uploaded video. Respond with descriptions of actions and call tools when appropriate to perform the edits.';
