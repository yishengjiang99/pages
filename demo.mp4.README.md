# Demo Video Setup

This directory needs a `demo.mp4` file for the video server to work.

## Option 1: Download a sample video

Download Big Buck Bunny (a popular test video):

```bash
curl -o demo.mp4 "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
```

## Option 2: Use your own video

Place any MP4 video file here and rename it to `demo.mp4`.

## Option 3: Create a test video with FFmpeg

If you have FFmpeg installed, you can create a test video:

```bash
ffmpeg -f lavfi -i testsrc=duration=10:size=640x480:rate=30 -pix_fmt yuv420p demo.mp4
```

## File Size Note

The demo.mp4 file is excluded from git (see .gitignore) because video files are typically large binary files that shouldn't be committed to the repository.
