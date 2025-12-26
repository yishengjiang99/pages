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
- Powered by FFmpeg WebAssembly
- Integration with xAI's Grok API for intelligent editing assistance

## Development

### Prerequisites

- Node.js 18 or higher
- npm

### Installation

```bash
npm install
```

### Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

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

1. Set your xAI API token when prompted
2. Upload a video file
3. Describe the edits you want in natural language
4. The AI will apply the appropriate filters and transformations

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

## License

This project is part of the yishengjiang99/pages repository.
