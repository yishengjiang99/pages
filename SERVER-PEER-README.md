# Server-Peer Video Streaming

This directory contains a simple Node.js server (`server-peer.mjs`) that serves video files with proper HTTP range request support for streaming.

## The Issue

The original problem was that `server-peer.mjs` was missing and not sending the `demo.mp4` video file. This has been resolved by creating a proper video streaming server.

## Solution Components

### 1. server-peer.mjs
A Node.js Express server that:
- Serves video files with HTTP range request support (essential for video seeking)
- Returns 206 Partial Content responses for range requests
- Returns 200 OK for full file requests
- Includes proper CORS headers for cross-origin requests
- Provides helpful error messages when demo.mp4 is missing
- Includes a web-based player interface at the root URL

### 2. demo.mp4
The video file served by the server. Due to file size, this is not committed to git (see `.gitignore`).

To obtain demo.mp4, either:
- Download Big Buck Bunny: `curl -o demo.mp4 "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"`
- Use your own MP4 file and name it `demo.mp4`
- Create a test video with FFmpeg: `ffmpeg -f lavfi -i testsrc=duration=10:size=640x480:rate=30 -pix_fmt yuv420p demo.mp4`

### 3. server-peer-demo.html
A comprehensive demo page that:
- Tests server connectivity
- Displays the video with HTML5 video player
- Shows server status and video metadata
- Provides setup instructions
- Includes test buttons for debugging

## How to Use

### Start the Server

```bash
npm run server
```

Or directly:

```bash
node server-peer.mjs
```

The server will start on http://localhost:3002

### Test the Server

1. **Health Check:**
   ```bash
   curl http://localhost:3002/health
   ```
   
2. **Video Endpoint (full file):**
   ```bash
   curl -I http://localhost:3002/demo.mp4
   ```
   
3. **Video Endpoint (range request):**
   ```bash
   curl -H "Range: bytes=0-999" -I http://localhost:3002/demo.mp4
   ```

4. **Web Player:**
   Open http://localhost:3002/ in your browser

### Expected Responses

#### Full File Request
```
HTTP/1.1 200 OK
Content-Type: video/mp4
Content-Length: [file-size]
Accept-Ranges: bytes
```

#### Range Request
```
HTTP/1.1 206 Partial Content
Content-Type: video/mp4
Content-Range: bytes 0-999/[total-size]
Content-Length: 1000
Accept-Ranges: bytes
```

## Technical Details

### HTTP Range Requests

The server implements proper HTTP range request handling:

1. **Client sends range header:**
   ```
   Range: bytes=0-999
   ```

2. **Server responds with partial content:**
   ```
   HTTP/1.1 206 Partial Content
   Content-Range: bytes 0-999/1048576
   ```

This allows:
- Video seeking (jumping to different parts of the video)
- Bandwidth-efficient streaming
- Resume downloads
- Browser optimization

### CORS Support

The server enables CORS for all routes:
```javascript
res.header('Access-Control-Allow-Origin', '*');
res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
res.header('Access-Control-Allow-Headers', 'Range, Content-Type');
```

This allows the video to be embedded in pages served from different origins.

## Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Web player interface with instructions |
| `/demo.mp4` | GET | Video file with range request support |
| `/health` | GET | Server health check |

## Troubleshooting

### Server won't start
- Check if port 3002 is already in use
- Ensure Node.js is installed (v18+ recommended)
- Verify express is installed: `npm install`

### Video won't play
- Ensure demo.mp4 exists in the root directory
- Check file permissions
- Verify the file is a valid MP4
- Check browser console for errors

### Range requests not working
- Some browsers may not support range requests
- Check that Accept-Ranges header is present
- Verify Content-Range format in 206 responses

## Files

- `server-peer.mjs` - Main server file (ES module format)
- `demo.mp4` - Video file (not in git, see .gitignore)
- `demo.mp4.README.md` - Instructions for obtaining demo.mp4
- `server-peer-demo.html` - Demo/test page
- `package.json` - Updated with express dependency and server script

## Package.json Changes

The `package.json` file was updated with:

1. **Express Dependency**: Added `express` for the HTTP server

2. **Server Script**: Added `npm run server` command to start the video server

Note: The server uses the `.mjs` extension to enable ES6 import/export syntax without affecting other scripts in the project that use CommonJS.

## Dependencies

```json
{
  "express": "^4.18.2"
}
```

Install with:
```bash
npm install
```

## Implementation Details

### Efficient Streaming
The server uses Node.js streams (`fs.createReadStream`) instead of loading entire files into memory:
- **Memory efficient**: Only reads requested chunks from disk
- **Scalable**: Can handle large video files without memory issues
- **Performance**: Stream directly to response without intermediate buffers

### Range Request Validation
Comprehensive validation ensures proper HTTP compliance:
- **Format validation**: Ensures range header contains valid numbers
- **Bounds checking**: Verifies start and end are within file size
- **Logical validation**: Ensures start ≤ end
- **Error responses**:
  - `400 Bad Request` for invalid format (e.g., "bytes=abc-def")
  - `416 Range Not Satisfiable` for invalid ranges (e.g., start > end, out of bounds)

### Error Handling
- Stream error handlers prevent crashes
- 404 responses for missing files
- 416 responses for invalid ranges
- 500 responses for server errors
- Helpful error messages

## Why This Matters

Video streaming requires special handling because:

1. **Large file sizes** - Videos can be hundreds of MB or more
2. **Seeking** - Users need to jump to different parts of the video
3. **Bandwidth** - Only the needed portion should be sent
4. **Browser optimization** - Modern browsers use range requests for better performance

Without proper range request support:
- Video seeking wouldn't work
- Entire file would need to download before playback
- Poor user experience
- Wasted bandwidth

## Testing Checklist

- [x] Server starts without errors
- [x] Health endpoint returns 200 OK
- [x] Video endpoint returns 200 OK for full requests
- [x] Video endpoint returns 206 for range requests
- [x] Content-Range header is correct
- [x] Accept-Ranges header is present
- [x] CORS headers are set
- [x] Error handling for missing file works
- [x] Web interface loads correctly

## Next Steps

To use this in production:
1. Add authentication if needed
2. Implement rate limiting
3. Add video transcoding for multiple formats
4. Implement caching headers
5. Add video upload capabilities
6. Monitor performance and bandwidth usage
