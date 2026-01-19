import React, { useState, useRef, useEffect } from 'react';

export default function VideoPreview({ videoUrl, title = 'Video Preview', defaultCollapsed = false }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [fps, setFps] = useState(30);
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      const video = videoRef.current;
      
      // Reset state when video URL changes
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      
      // Force the video element to load the new source
      video.load();
      
      const handleLoadedMetadata = () => {
        setDuration(video.duration);
      };
      
      const handleTimeUpdate = () => {
        setCurrentTime(video.currentTime);
      };
      
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('timeupdate', handleTimeUpdate);
      
      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('timeupdate', handleTimeUpdate);
      };
    }
  }, [videoUrl]);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const getFrameTime = () => 1 / fps;

  const handleFrameForward = () => {
    if (videoRef.current && duration > 0) {
      const frameTime = getFrameTime();
      const newTime = Math.min(currentTime + frameTime, duration);
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleFrameBackward = () => {
    if (videoRef.current) {
      const frameTime = getFrameTime();
      const newTime = Math.max(currentTime - frameTime, 0);
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleSliderChange = (e) => {
    const newTime = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const getCurrentFrame = () => {
    return Math.floor(currentTime * fps);
  };

  const getTotalFrames = () => {
    return Math.floor(duration * fps);
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const frames = Math.floor((time % 1) * fps);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${frames.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ 
      backgroundColor: 'rgba(255,255,255,0.95)', 
      padding: '12px', 
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      maxWidth: '100%',
      boxSizing: 'border-box'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: isCollapsed ? '0' : '8px'
      }}>
        <p style={{ margin: '0', fontSize: '14px', fontWeight: 'bold' }}>{title}</p>
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{
            padding: '4px 12px',
            fontSize: '12px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent'
          }}
        >
          {isCollapsed ? '▼ Expand' : '▲ Collapse'}
        </button>
      </div>
      
      {!isCollapsed && (
        <>
      <video 
        ref={videoRef}
        src={videoUrl} 
        playsInline 
        style={{ 
          width: '100%', 
          maxWidth: '400px', 
          borderRadius: '4px',
          display: 'block',
          marginBottom: '12px'
        }} 
      />
      
      {/* Meter/Slider control */}
      <div style={{ marginBottom: '12px' }}>
        <input 
          type="range"
          min="0"
          max={duration || 0}
          step={getFrameTime()}
          value={currentTime}
          onChange={handleSliderChange}
          style={{
            width: '100%',
            cursor: 'pointer',
            accentColor: '#007bff'
          }}
        />
      </div>
      
      {/* Time and Frame info */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        fontSize: '12px', 
        marginBottom: '12px',
        color: '#666'
      }}>
        <span>Time: {formatTime(currentTime)}</span>
        <span>Frame: {getCurrentFrame()} / {getTotalFrames()}</span>
      </div>
      
      {/* FPS selector */}
      <div style={{ marginBottom: '12px', fontSize: '12px' }}>
        <label style={{ marginRight: '8px' }}>FPS:</label>
        <select 
          value={fps} 
          onChange={(e) => setFps(Number(e.target.value))}
          style={{
            padding: '4px 8px',
            borderRadius: '4px',
            border: '1px solid #ddd',
            fontSize: '12px'
          }}
        >
          <option value={24}>24</option>
          <option value={25}>25</option>
          <option value={30}>30</option>
          <option value={60}>60</option>
        </select>
      </div>
      
      {/* Control buttons */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        <button 
          onClick={handleFrameBackward}
          disabled={currentTime <= 0}
          style={{
            padding: '8px 12px',
            fontSize: '14px',
            backgroundColor: currentTime <= 0 ? '#ccc' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: currentTime <= 0 ? 'not-allowed' : 'pointer',
            WebkitTapHighlightColor: 'transparent'
          }}
        >
          ◀ Frame
        </button>
        
        <button 
          onClick={handlePlayPause}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent'
          }}
        >
          {isPlaying ? '⏸ Pause' : '▶ Play'}
        </button>
        
        <button 
          onClick={handleFrameForward}
          disabled={currentTime >= duration}
          style={{
            padding: '8px 12px',
            fontSize: '14px',
            backgroundColor: currentTime >= duration ? '#ccc' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: currentTime >= duration ? 'not-allowed' : 'pointer',
            WebkitTapHighlightColor: 'transparent'
          }}
        >
          Frame ▶
        </button>
      </div>
        </>
      )}
    </div>
  );
}
