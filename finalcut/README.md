# FinalCut - Video Editor Chat

A React-based video editing application with AI chat capabilities using xAI's Grok API and FFmpeg WebAssembly.

## Features

- Upload and edit videos in the browser
- AI-powered video editing through natural language chat
- Video operations:
  - Resize video
  - Crop video
  - Rotate video
  - Add text overlays
  - Trim video
  - Adjust playback speed
  - Add or replace audio tracks
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
- Powered by FFmpeg WebAssembly
- Integration with xAI's Grok API for intelligent editing assistance

## Development

### Prerequisites

- Node.js 18 or higher
- npm
- xAI API token (get one from https://console.x.ai/)

### Installation

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

The xAI API token is now securely stored on the server side and never exposed to the client. The token is read from the `.env` file and used by the Node.js proxy server to authenticate requests to the xAI API.

## Mobile/Safari Compatibility

This app uses FFmpeg WebAssembly in **single-threaded mode** (`@ffmpeg/core-st`) for maximum compatibility with mobile browsers, especially Safari. This version:

- ✅ Works on Safari iOS/iPadOS
- ✅ Works on Safari macOS
- ✅ Doesn't require SharedArrayBuffer
- ✅ Doesn't require special CORS headers
- ⚠️ Slightly slower than multi-threaded version on desktop

### Deployment Notes

While the app uses single-threaded FFmpeg to avoid CORS header requirements, for optimal performance on desktop browsers, you can optionally configure your server to send these headers:

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

**Note**: GitHub Pages doesn't support custom headers, but the single-threaded version works without them.

## Technology Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **FFmpeg WebAssembly** - Video processing
- **xAI Grok API** - AI-powered editing assistance
- **Vitest** - Testing framework
- **React Testing Library** - Component testing

## Project Structure

```
finalcut/
├── src/
│   ├── App.jsx           # Main React component
│   ├── main.jsx          # Application entry point
│   ├── ffmpeg.js         # FFmpeg initialization and utilities
│   ├── tools.js          # Tool definitions for AI
│   ├── toolFunctions.js  # Video editing function implementations
│   └── test/             # Test files
├── index.html            # HTML entry point
├── package.json          # Dependencies and scripts
└── vite.config.js        # Vite configuration
```

## Deployment

For production deployment to DigitalOcean with DNS configuration on GoDaddy, see the comprehensive guides:

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Complete step-by-step deployment guide
- **[QUICK-REFERENCE.md](./QUICK-REFERENCE.md)** - Quick reference for common tasks
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
