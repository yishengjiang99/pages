# FinalCut - Video Editor Chat

A React-based video editing application with AI chat capabilities using xAI's Grok API and server-side FFmpeg processing.

## Features

- Upload and edit videos in the browser
- AI-powered video editing through natural language chat
- **Server-side video processing** using native FFmpeg for better performance
- Video operations:
  - Get video dimensions and metadata (resolution, duration, codec, frame rate)
  - Resize video
  - Crop video
  - Rotate video
  - Add text overlays
  - Trim video
  - Adjust playback speed
  - Add or replace audio tracks
  - Convert video formats
  - Extract audio from video
- Audio filters:
  - Adjust audio volume
  - Audio fade in/out effects
  - High-pass filter (remove low frequencies)
  - Low-pass filter (remove high frequencies)
  - Echo effect
  - Bass adjustment
  - Treble adjustment
  - Parametric equalizer
  - Audio normalization
  - Audio delay/sync
  - Convert audio formats
- Color grading:
  - Adjust brightness
  - Adjust hue
  - Adjust saturation
- Powered by native FFmpeg on the server
- Integration with xAI's Grok API for intelligent editing assistance

## Development

### Prerequisites

- Node.js 18 or higher
- npm
- **FFmpeg installed on the server** (required for video processing)
- xAI API token (get one from https://console.x.ai/)

### Installation

1. **Install FFmpeg** (if not already installed):

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y ffmpeg

# macOS
brew install ffmpeg

# Verify installation
ffmpeg -version
```

2. **Install Node.js dependencies:**

```bash
npm install
```

### Configuration

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` and add your xAI API token:
```bash
XAI_API_TOKEN=your_actual_token_here
```

**Important**: Never commit your `.env` file to version control. It's already included in `.gitignore`.

### Development Server

You need to run both the proxy server and the Vite dev server:

**Terminal 1 - Start the proxy server:**
```bash
npm run server
```

**Terminal 2 - Start the Vite dev server:**
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

The proxy server runs on `http://localhost:3001` and handles xAI API calls securely.

### Build

```bash
npm run build
```

The built files will be in the `dist/` directory.

### Testing

```bash
npm test
```

Run tests with Vitest.

## Usage

1. Start the proxy server (see Development Server above)
2. Upload a video file
3. Describe the edits you want in natural language
4. The AI will apply the appropriate filters and transformations

## Security

The xAI API token is securely stored on the server side and never exposed to the client. The token is read from the `.env` file and used by the Node.js proxy server to authenticate requests to the xAI API.

Video files are processed server-side using native FFmpeg, which provides better performance and security compared to client-side processing.

## Architecture

### Server-Side Video Processing

The application uses a **server-side architecture** for video processing:

1. **Client Upload**: User uploads a video file through the web interface
2. **Server Processing**: Video is sent to the Node.js server and processed using native FFmpeg via `fluent-ffmpeg`
3. **Temporary Storage**: Videos are temporarily stored in the `temp/` directory during processing
4. **Result Delivery**: Processed video is sent back to the client and displayed
5. **Cleanup**: Temporary files are automatically cleaned up after processing

### Benefits of Server-Side Processing

- ✅ **Better Performance**: Native FFmpeg is faster than WebAssembly
- ✅ **No Browser Limitations**: No memory constraints or CORS issues
- ✅ **Broader Compatibility**: Works on all devices and browsers
- ✅ **More Features**: Full access to FFmpeg's capabilities
- ✅ **Better Security**: Video processing happens server-side

## Technology Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Express** - Node.js web server
- **FFmpeg** - Native video processing (via fluent-ffmpeg)
- **Multer** - File upload handling
- **xAI Grok API** - AI-powered editing assistance
- **Vitest** - Testing framework
- **React Testing Library** - Component testing

## Project Structure

```
finalcut/
├── src/
│   ├── App.jsx           # Main React component
│   ├── main.jsx          # Application entry point
│   ├── tools.js          # Tool definitions for AI
│   ├── toolFunctions.js  # Video editing function implementations (client-side)
│   └── test/             # Test files
├── server.js             # Express server with API endpoints
├── videoProcessor.js     # Server-side video processing with FFmpeg
├── temp/                 # Temporary video storage (auto-created)
├── index.html            # HTML entry point
├── package.json          # Dependencies and scripts
└── vite.config.js        # Vite configuration
```

## Deployment

For production deployment to DigitalOcean with DNS configuration on GoDaddy, see the comprehensive guides:

- **[DEPLOYMENT.md](./docs/DEPLOYMENT.md)** - Complete step-by-step deployment guide
- **[QUICK-REFERENCE.md](./docs/QUICK-REFERENCE.md)** - Quick reference for common tasks
- **[deploy.sh](./deploy.sh)** - Automated deployment script
- **[setup-server.sh](./setup-server.sh)** - Server setup script

### Quick Deploy

For initial server setup:
```bash
wget https://raw.githubusercontent.com/yishengjiang99/pages/main/finalcut/setup-server.sh
chmod +x setup-server.sh
sudo ./setup-server.sh
```

For application updates:
```bash
cd /home/finalcut/apps/pages/finalcut
./deploy.sh
```

## License

This project is part of the yishengjiang99/pages repository.
