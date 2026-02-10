import express from 'express';
import { promises as fs, createReadStream } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3002;

// Enable CORS for all routes
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Range, Content-Type');
  next();
});

// Serve demo.mp4 with proper video streaming support (byte range requests)
// This must come BEFORE express.static to override default file serving
app.get('/demo.mp4', async (req, res) => {
  const videoPath = path.join(__dirname, 'demo.mp4');
  
  try {
    const stat = await fs.stat(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      // Parse range header
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      // Validate range values
      if (isNaN(start) || isNaN(end)) {
        return res.status(400).json({ error: 'Invalid range format' });
      }
      
      if (start < 0 || end >= fileSize || start > end) {
        return res.status(416).json({ 
          error: 'Range not satisfiable',
          message: `Valid range: 0-${fileSize - 1}` 
        });
      }

      const chunkSize = (end - start) + 1;

      // Stream the video chunk directly from disk (efficient for large files)
      const stream = createReadStream(videoPath, { start, end });

      // Send partial content response
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': 'video/mp4',
      });
      
      // Handle stream errors
      stream.on('error', (err) => {
        console.error('Stream error:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to stream video' });
        }
      });
      
      stream.pipe(res);
    } else {
      // Stream full video directly from disk (efficient for large files)
      const stream = createReadStream(videoPath);
      
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
        'Accept-Ranges': 'bytes'
      });
      
      // Handle stream errors
      stream.on('error', (err) => {
        console.error('Stream error:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to stream video' });
        }
      });
      
      stream.pipe(res);
    }
  } catch (error) {
    console.error('Error serving video:', error);
    if (error.code === 'ENOENT') {
      res.status(404).json({ 
        error: 'demo.mp4 not found',
        message: 'Please place a demo.mp4 file in the root directory or download it from a sample video source'
      });
    } else {
      res.status(500).json({ error: 'Failed to serve video' });
    }
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Serve static files from current directory (after specific routes)
app.use(express.static(__dirname));

// Root endpoint with instructions
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Video Server</title>
      <style>
        body {
          font-family: system-ui, -apple-system, sans-serif;
          max-width: 800px;
          margin: 40px auto;
          padding: 20px;
          background: #0f1115;
          color: #eef1f7;
        }
        h1 { color: #4da3ff; }
        video {
          width: 100%;
          max-width: 640px;
          display: block;
          margin: 20px auto;
          background: #000;
          border-radius: 8px;
        }
        .error {
          background: #ff4444;
          color: white;
          padding: 15px;
          border-radius: 8px;
          margin: 20px 0;
        }
        .info {
          background: #1b2333;
          padding: 15px;
          border-radius: 8px;
          margin: 20px 0;
          border: 1px solid #2a3346;
        }
        code {
          background: #0f1827;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <h1>Video Server - Demo Player</h1>
      
      <div class="info">
        <h3>Available Endpoints:</h3>
        <ul>
          <li><code>GET /demo.mp4</code> - Stream the demo video</li>
          <li><code>GET /health</code> - Health check endpoint</li>
        </ul>
      </div>

      <h2>Video Player</h2>
      <video id="videoPlayer" controls>
        <source src="/demo.mp4" type="video/mp4">
        Your browser does not support the video tag.
      </video>
      
      <div id="errorMessage" class="error" style="display: none;">
        Failed to load video. Please ensure demo.mp4 exists in the root directory.
      </div>

      <div class="info">
        <h3>Setup Instructions:</h3>
        <p>If the video doesn't play, you need to add a <code>demo.mp4</code> file to the root directory.</p>
        <p>You can download a sample video with:</p>
        <code style="display: block; padding: 10px; margin-top: 10px;">
          curl -o demo.mp4 "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
        </code>
      </div>

      <script>
        const video = document.getElementById('videoPlayer');
        const errorMessage = document.getElementById('errorMessage');
        
        video.addEventListener('error', () => {
          errorMessage.style.display = 'block';
          console.error('Video load error');
        });
        
        video.addEventListener('loadeddata', () => {
          errorMessage.style.display = 'none';
          console.log('Video loaded successfully');
        });
      </script>
    </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`Video server running on http://localhost:${PORT}`);
  console.log(`Video endpoint: http://localhost:${PORT}/demo.mp4`);
  console.log(`Web player: http://localhost:${PORT}/`);
  console.log('\nNote: Make sure demo.mp4 exists in the root directory');
});
