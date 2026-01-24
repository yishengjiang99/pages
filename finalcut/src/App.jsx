import React, { useState, useRef, useEffect } from 'react';
import { tools, systemPrompt } from './tools.js';
import { toolFunctions } from './toolFunctions.js';
import VideoPreview from './VideoPreview.jsx';

export default function App() {
  const [showLanding, setShowLanding] = useState(true); // Show landing page initially
  const [loaded, setLoaded] = useState(true); // Server-side processing doesn't require loading
  const videoRef = useRef(null);
  const messageRef = useRef(null);
  const [messages, setMessages] = useState([{ role: 'system', content: systemPrompt, id: 0 }]);
  const [chatInput, setChatInput] = useState('');
  const [videoFileData, setVideoFileData] = useState(null);
  const [fileType, setFileType] = useState('video'); // 'video' or 'audio'
  const [fileMimeType, setFileMimeType] = useState(''); // Store MIME type for proper detection
  const messageIdCounterRef = useRef(1); // Counter for unique message IDs
  const chatWindowRef = useRef(null);

  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages]);

  const addMessage = (text, isUser = false, videoUrl = null, videoType = 'processed', mimeType = null) => {
    const id = messageIdCounterRef.current++;
    setMessages(prev => [...prev, { role: isUser ? 'user' : 'assistant', content: text, videoUrl, videoType, mimeType, id }]);
  };

  const getVideoTitle = (videoType) => {
    return videoType === 'original' ? 'Original Video' : 'Processed Video';
  };

  const callAPI = async (currentMessages) => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'grok-beta',
          messages: currentMessages,
          tools: tools,
          tool_choice: 'auto'
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.choices || !data.choices[0]) {
        throw new Error('Invalid response format from API');
      }

      const msg = data.choices[0].message;

      if (msg.content) {
        addMessage(msg.content, false);
        currentMessages.push({ role: 'assistant', content: msg.content, id: messageIdCounterRef.current++ });
      }

      if (msg.tool_calls) {
        currentMessages.push({ role: 'assistant', content: null, tool_calls: msg.tool_calls, id: messageIdCounterRef.current++ });
        
        // Server-side processing - no need to load FFmpeg
        
        for (const call of msg.tool_calls) {
          const funcName = call.function.name;
          const args = JSON.parse(call.function.arguments);
          const result = await toolFunctions[funcName](args, videoFileData, setVideoFileData, addMessage);
          currentMessages.push({
            role: 'tool',
            tool_call_id: call.id,
            name: funcName,
            content: result,
            id: messageIdCounterRef.current++
          });
        }
        await callAPI(currentMessages);
      }
    } catch (error) {
      addMessage('Error communicating with xAI API: ' + error.message, false);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      // Determine if it's audio or video
      const isAudio = file.type.startsWith('audio/');
      const isVideo = file.type.startsWith('video/');

      if (!isAudio && !isVideo) {
        addMessage('Error: Please upload a valid audio or video file.', false);
        return;
      }

      setFileType(isAudio ? 'audio' : 'video');
      setFileMimeType(file.type); // Store MIME type for later use

      // Show uploading status
      const uploadingMessage = { role: 'user', content: `Uploading ${isAudio ? 'audio' : 'video'}...`, id: messageIdCounterRef.current++ };
      setMessages(prev => [...prev, uploadingMessage]);

      // Read file as array buffer for server-side processing
      const arrayBuffer = await file.arrayBuffer();
      const data = new Uint8Array(arrayBuffer);
      setVideoFileData(data);
      const url = URL.createObjectURL(file);

      // Show selected video on user (right) side
      const uploadedMessage = { role: 'user', content: `Selected ${isAudio ? 'audio' : 'video'}:`, videoUrl: url, videoType: 'original', mimeType: file.type, id: messageIdCounterRef.current++ };
      const userMessage = { role: 'user', content: `${isAudio ? 'Audio' : 'Video'} uploaded and ready for editing.`, id: messageIdCounterRef.current++ };

      // Build complete message history for API call
      // Since messages is the state before any updates in this function, we include all three new messages
      const messagesForAPI = [...messages, uploadingMessage, uploadedMessage, userMessage];

      // Update UI state with the remaining two messages (uploadingMessage was already added)
      setMessages(prev => [...prev, uploadedMessage, userMessage]);

      await callAPI(messagesForAPI);
    } catch (error) {
      addMessage('Error uploading file: ' + error.message, false);
    }
  };

  const handleSend = async () => {
    const text = chatInput.trim();
    if (!text || !videoFileData) {
      if (!videoFileData) alert('Please upload a video or audio file first.');
      return;
    }
    setChatInput('');
    const newMessage = { role: 'user', content: text, id: messageIdCounterRef.current++ };
    const newMessages = [...messages, newMessage];
    setMessages(newMessages);
    await callAPI(newMessages);
  };

  const handleGetStarted = () => {
    setShowLanding(false);
  };

  const loadSampleVideo = async () => {
    setShowLanding(false);
    // Use a sample video URL - this could be hosted or a placeholder
    const sampleVideoUrl = '/sample-video.mp4';
    
    try {
      // Fetch the sample video
      const response = await fetch(sampleVideoUrl);
      if (!response.ok) {
        // If sample video doesn't exist, just show a message
        addMessage('Sample video not available. Please upload your own video.', false);
        return;
      }
      
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const data = new Uint8Array(arrayBuffer);
      setVideoFileData(data);
      const url = URL.createObjectURL(blob);
      
      setFileType('video');
      setFileMimeType('video/mp4');
      
      // Show selected video
      const uploadedMessage = { role: 'user', content: 'Selected sample video:', videoUrl: url, videoType: 'original', mimeType: 'video/mp4', id: messageIdCounterRef.current++ };
      const userMessage = { role: 'user', content: 'Sample video loaded and ready for editing.', id: messageIdCounterRef.current++ };
      
      const messagesForAPI = [...messages, uploadedMessage, userMessage];
      setMessages(prev => [...prev, uploadedMessage, userMessage]);
      
      await callAPI(messagesForAPI);
    } catch (error) {
      addMessage('Error loading sample video. Please upload your own video.', false);
    }
  };

  // Landing page component
  if (showLanding) {
    return (
      <div style={{ fontFamily: 'Arial, sans-serif', margin: 0, padding: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#0d1117' }}>
        <div style={{ maxWidth: '800px', padding: '40px 20px', color: '#c9d1d9' }}>
          <h1 style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '20px', color: '#ffffff', textAlign: 'center' }}>
            FinalCut Video Editor
          </h1>
          <p style={{ fontSize: '20px', marginBottom: '40px', textAlign: 'center', color: '#8b949e' }}>
            AI-powered video and audio editing at your fingertips
          </p>

          <div style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '28px', marginBottom: '20px', color: '#ffffff' }}>Available Tools</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
              <div style={{ padding: '20px', backgroundColor: '#161b22', borderRadius: '8px', border: '1px solid #30363d' }}>
                <h3 style={{ fontSize: '18px', marginBottom: '10px', color: '#58a6ff' }}>✂️ Video Editing</h3>
                <p style={{ fontSize: '14px', color: '#8b949e', margin: 0 }}>Trim, crop, resize, and rotate videos with precision</p>
              </div>
              <div style={{ padding: '20px', backgroundColor: '#161b22', borderRadius: '8px', border: '1px solid #30363d' }}>
                <h3 style={{ fontSize: '18px', marginBottom: '10px', color: '#58a6ff' }}>🎨 Visual Effects</h3>
                <p style={{ fontSize: '14px', color: '#8b949e', margin: 0 }}>Adjust brightness, hue, saturation, and add text overlays</p>
              </div>
              <div style={{ padding: '20px', backgroundColor: '#161b22', borderRadius: '8px', border: '1px solid #30363d' }}>
                <h3 style={{ fontSize: '18px', marginBottom: '10px', color: '#58a6ff' }}>🎵 Audio Tools</h3>
                <p style={{ fontSize: '14px', color: '#8b949e', margin: 0 }}>Volume control, fade effects, equalizer, and audio filters</p>
              </div>
              <div style={{ padding: '20px', backgroundColor: '#161b22', borderRadius: '8px', border: '1px solid #30363d' }}>
                <h3 style={{ fontSize: '18px', marginBottom: '10px', color: '#58a6ff' }}>⚡ Speed Control</h3>
                <p style={{ fontSize: '14px', color: '#8b949e', margin: 0 }}>Speed up or slow down your videos and audio</p>
              </div>
              <div style={{ padding: '20px', backgroundColor: '#161b22', borderRadius: '8px', border: '1px solid #30363d' }}>
                <h3 style={{ fontSize: '18px', marginBottom: '10px', color: '#58a6ff' }}>📱 Social Media</h3>
                <p style={{ fontSize: '14px', color: '#8b949e', margin: 0 }}>Preset formats for Instagram, TikTok, YouTube, and more</p>
              </div>
              <div style={{ padding: '20px', backgroundColor: '#161b22', borderRadius: '8px', border: '1px solid #30363d' }}>
                <h3 style={{ fontSize: '18px', marginBottom: '10px', color: '#58a6ff' }}>🔄 Format Conversion</h3>
                <p style={{ fontSize: '14px', color: '#8b949e', margin: 0 }}>Convert between MP4, WebM, MOV, and other formats</p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' }}>
            <button 
              onClick={handleGetStarted}
              style={{ 
                padding: '15px 40px', 
                fontSize: '18px', 
                fontWeight: 'bold',
                backgroundColor: '#1f6feb', 
                color: '#ffffff', 
                border: 'none', 
                borderRadius: '8px', 
                cursor: 'pointer',
                width: '300px',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#1a5cd7'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#1f6feb'}
            >
              Get Started
            </button>
            <button 
              onClick={loadSampleVideo}
              style={{ 
                padding: '12px 40px', 
                fontSize: '16px', 
                backgroundColor: '#21262d', 
                color: '#c9d1d9', 
                border: '1px solid #30363d', 
                borderRadius: '8px', 
                cursor: 'pointer',
                width: '300px',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#30363d'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#21262d'}
            >
              Try with Sample Video
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', margin: 0, padding: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#0d1117' }}>
      <main style={{ width: '100%', maxWidth: '100vw', height: '100vh', backgroundColor: '#0d1117', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <div ref={chatWindowRef} style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '16px', paddingTop: '50px', WebkitOverflowScrolling: 'touch' }}>
          {messages.slice(1).map((msg) => (
            <div key={msg.id} style={{ marginBottom: '12px', padding: '8px 12px', borderRadius: '8px', maxWidth: '80%', alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', marginLeft: msg.role === 'user' ? 'auto' : 0, marginRight: msg.role === 'user' ? 0 : 'auto', backgroundColor: msg.role === 'user' ? '#1f6feb' : '#21262d', color: msg.role === 'user' ? '#ffffff' : '#c9d1d9', wordWrap: 'break-word' }}>
              <p style={{ margin: 0 }}>{msg.content}</p>
              {msg.videoUrl && (
                <div style={{ marginTop: '8px' }}>
                  {msg.videoUrl}
                  <VideoPreview
                    key={`preview-${msg.id}`}
                    videoUrl={msg.videoUrl}
                    title={getVideoTitle(msg.videoType)}
                    mimeType={msg.mimeType}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', padding: '12px', gap: '8px', borderTop: '1px solid #30363d', backgroundColor: '#161b22' }}>
          <input type="file" onChange={handleUpload} accept="video/*,audio/*,video/mp4,video/quicktime,audio/mpeg,audio/wav,audio/mp3,audio/ogg,audio/aac" capture="environment" style={{ width: '100%', padding: '8px', fontSize: '16px', backgroundColor: '#0d1117', color: '#c9d1d9', border: '1px solid #30363d', borderRadius: '4px' }} />
          <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSend()} placeholder="Describe the video edit..." style={{ width: '100%', padding: '10px', border: '1px solid #30363d', borderRadius: '4px', fontSize: '16px', backgroundColor: '#0d1117', color: '#c9d1d9' }} />
          <button onClick={handleSend} disabled={!videoFileData} style={{ padding: '10px 16px', backgroundColor: videoFileData ? '#1f6feb' : '#21262d', color: videoFileData ? '#ffffff' : '#6e7681', border: 'none', borderRadius: '4px', cursor: videoFileData ? 'pointer' : 'not-allowed', fontSize: '16px', WebkitTapHighlightColor: 'transparent' }}>Send</button>
        </div>
      </main>
    </div>
  );
}
