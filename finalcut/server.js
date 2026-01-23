import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { videoProcessors, cleanupFile } from './videoProcessor.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const XAI_API_TOKEN = process.env.XAI_API_TOKEN;

if (!XAI_API_TOKEN) {
  console.error('ERROR: XAI_API_TOKEN environment variable is not set');
  console.error('Please create a .env file with XAI_API_TOKEN=your_token_here');
  process.exit(1);
}

// Configure multer for file uploads
const upload = multer({ 
  dest: 'temp/',
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

// Create temp directory if it doesn't exist
if (!fs.existsSync('temp')) {
  fs.mkdirSync('temp', { recursive: true });
}

// app.use(cors({
//   origin: process.env.NODE_ENV === 'production' 
//     ? process.env.ALLOWED_ORIGINS?.split(',') || []
//     : ['http://localhost:5173', 'http://localhost:3000']
// }));
app.use(express.json({ limit: '50mb' }));

// Proxy endpoint for xAI API
app.post('/api/chat', async (req, res) => {
  try {
    // Basic request validation
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    if (!req.body.messages || !Array.isArray(req.body.messages)) {
      return res.status(400).json({ error: 'Invalid messages format' });
    }

    // Update the model to grok-3
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${XAI_API_TOKEN}`
      },
      body: JSON.stringify({
        ...req.body,
        model: 'grok-3' // Specify the new model here
      })
    });

    if (!response.ok) {
      const error = await response.json();
      return res.status(response.status).json({ error: error.message });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error in /api/chat:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Video processing endpoint
app.post('/api/process-video', upload.single('video'), async (req, res) => {
  let inputPath = null;
  let outputPath = null;

  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file uploaded' });
    }

    inputPath = req.file.path;
    const { operation, args } = req.body;

    if (!operation || !videoProcessors[operation]) {
      return res.status(400).json({ error: 'Invalid operation' });
    }

    // Parse args if it's a string
    const parsedArgs = typeof args === 'string' ? JSON.parse(args) : args;

    // Process the video
    outputPath = await videoProcessors[operation](inputPath, parsedArgs);

    // Send the processed video back
    res.sendFile(path.resolve(outputPath), async (err) => {
      // Clean up files after sending
      await cleanupFile(inputPath);
      await cleanupFile(outputPath);
      
      if (err) {
        console.error('Error sending file:', err);
      }
    });

  } catch (error) {
    console.error('Error processing video:', error);
    
    // Clean up files on error
    if (inputPath) await cleanupFile(inputPath);
    if (outputPath) await cleanupFile(outputPath);
    
    res.status(500).json({ 
      error: 'Failed to process video',
      message: error.message 
    });
  }
});

// Get video metadata endpoint
app.post('/api/video-info', upload.single('video'), async (req, res) => {
  let inputPath = null;

  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file uploaded' });
    }

    inputPath = req.file.path;

    // Get video dimensions
    const info = await videoProcessors.get_video_dimensions(inputPath);

    // Clean up
    await cleanupFile(inputPath);

    res.json(info);

  } catch (error) {
    console.error('Error getting video info:', error);
    
    if (inputPath) await cleanupFile(inputPath);
    
    res.status(500).json({ 
      error: 'Failed to get video info',
      message: error.message 
    });
  }
});

// Serve processed videos from temp directory
app.use('/temp', express.static('temp'));

app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
  console.log('Configuration loaded successfully');
});
