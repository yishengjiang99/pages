import React, { useState, useRef, useEffect } from 'react';
import { tools, systemPrompt } from './tools.js';
import { toolFunctions } from './toolFunctions.js';
import VideoPreview from './VideoPreview.jsx';

export default function App() {
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
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Dark mode detection
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(mediaQuery.matches);
    
    const handleChange = (e) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages]);

  // Color theme
  const theme = {
    background: isDarkMode ? '#1a1a1a' : '#f0f0f0',
    surface: isDarkMode ? '#2d2d2d' : 'white',
    userMessageBg: isDarkMode ? '#0d6efd' : '#007bff',
    userMessageText: '#ffffff',
    assistantMessageBg: isDarkMode ? '#3a3a3a' : '#e9ecef',
    assistantMessageText: isDarkMode ? '#e0e0e0' : '#000000',
    inputBorder: isDarkMode ? '#404040' : '#ddd',
    inputBackground: isDarkMode ? '#3a3a3a' : 'white',
    inputText: isDarkMode ? '#e0e0e0' : '#000000',
    buttonPrimary: isDarkMode ? '#0d6efd' : '#007bff',
    buttonDisabled: isDarkMode ? '#4a4a4a' : '#ccc',
    borderColor: isDarkMode ? '#404040' : '#ddd',
  };

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

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', margin: 0, padding: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: theme.background }}>
      <main style={{ width: '100%', maxWidth: '100vw', height: '100vh', backgroundColor: theme.surface, overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <div ref={chatWindowRef} style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '16px', paddingTop: '50px', WebkitOverflowScrolling: 'touch' }}>
          {messages.slice(1).map((msg) => (
            <div key={msg.id} style={{ marginBottom: '12px', padding: '8px 12px', borderRadius: '8px', maxWidth: '80%', alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', marginLeft: msg.role === 'user' ? 'auto' : 0, marginRight: msg.role === 'user' ? 0 : 'auto', backgroundColor: msg.role === 'user' ? theme.userMessageBg : theme.assistantMessageBg, color: msg.role === 'user' ? theme.userMessageText : theme.assistantMessageText, wordWrap: 'break-word' }}>
              <p style={{ margin: 0 }}>{msg.content}</p>
              {msg.videoUrl && (
                <div style={{ marginTop: '8px' }}>
                  {msg.videoUrl}
                  <VideoPreview
                    key={`preview-${msg.id}`}
                    videoUrl={msg.videoUrl}
                    title={getVideoTitle(msg.videoType)}
                    mimeType={msg.mimeType}
                    isDarkMode={isDarkMode}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', padding: '12px', gap: '8px', borderTop: `1px solid ${theme.borderColor}`, backgroundColor: theme.surface }}>
          <input type="file" onChange={handleUpload} accept="video/*,audio/*,video/mp4,video/quicktime,audio/mpeg,audio/wav,audio/mp3,audio/ogg,audio/aac" capture="environment" style={{ width: '100%', padding: '8px', fontSize: '16px', backgroundColor: theme.inputBackground, color: theme.inputText, border: `1px solid ${theme.inputBorder}`, borderRadius: '4px' }} />
          <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSend()} placeholder="Describe the video edit..." style={{ width: '100%', padding: '10px', border: `1px solid ${theme.inputBorder}`, borderRadius: '4px', fontSize: '16px', backgroundColor: theme.inputBackground, color: theme.inputText }} />
          <button onClick={handleSend} disabled={!videoFileData} style={{ padding: '10px 16px', backgroundColor: videoFileData ? theme.buttonPrimary : theme.buttonDisabled, color: 'white', border: 'none', borderRadius: '4px', cursor: videoFileData ? 'pointer' : 'not-allowed', fontSize: '16px', WebkitTapHighlightColor: 'transparent' }}>Send</button>
        </div>
      </main>
    </div>
  );
}
