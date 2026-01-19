import React, { useState, useRef, useEffect } from 'react';
import { fetchFile } from './ffmpeg.js';
import { tools, systemPrompt } from './tools.js';
import { toolFunctions } from './toolFunctions.js';
import VideoPreview from './VideoPreview.jsx';

export default function App() {
  const [messages, setMessages] = useState([{ role: 'system', content: systemPrompt }]);
  const [chatInput, setChatInput] = useState('');
  const [videoFileData, setVideoFileData] = useState(null);
  const [originalVideoUrl, setOriginalVideoUrl] = useState(null);
  const chatWindowRef = useRef(null);

  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages]);

  const addMessage = (text, isUser = false, videoUrl = null) => {
    setMessages(prev => [...prev, { role: isUser ? 'user' : 'assistant', content: text, videoUrl }]);
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
        currentMessages.push({ role: 'assistant', content: msg.content });
      }

      if (msg.tool_calls) {
        currentMessages.push({ role: 'assistant', content: null, tool_calls: msg.tool_calls });
        for (const call of msg.tool_calls) {
          const funcName = call.function.name;
          const args = JSON.parse(call.function.arguments);
          const result = await toolFunctions[funcName](args, videoFileData, setVideoFileData, addMessage);
          currentMessages.push({
            role: 'tool',
            tool_call_id: call.id,
            name: funcName,
            content: result
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
      const uploadingMessage = { role: 'user', content: 'Uploading video...' };
      setMessages(prev => [...prev, uploadingMessage]);
      
      const data = await fetchFile(file);
      setVideoFileData(data);
      const url = URL.createObjectURL(file);
      setOriginalVideoUrl(url);
      
      const uploadedMessage = { role: 'assistant', content: 'Original video uploaded:', videoUrl: url };
      const userMessage = { role: 'user', content: 'Video uploaded and ready for editing.' };
      setMessages(prev => [...prev, uploadedMessage, userMessage]);
      
      const newMessages = [...messages, uploadingMessage, uploadedMessage, userMessage];
      await callAPI(newMessages);
    } catch (error) {
      addMessage('Error uploading video: ' + error.message, false);
    }
  };

  const handleSend = async () => {
    const text = chatInput.trim();
    if (!text || !videoFileData) {
      if (!videoFileData) alert('Please upload a video first.');
      return;
    }
    setChatInput('');
    const newMessages = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    await callAPI(newMessages);
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', margin: 0, padding: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f0f0f0' }}>
      <main style={{ width: '100%', maxWidth: '100vw', height: '100vh', backgroundColor: 'white', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <div ref={chatWindowRef} style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '16px', paddingTop: '50px', WebkitOverflowScrolling: 'touch' }}>
          {messages.slice(1).map((msg, index) => (
            <div key={index} style={{ marginBottom: '12px', padding: '8px 12px', borderRadius: '8px', maxWidth: '80%', alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', marginLeft: msg.role === 'user' ? 'auto' : 0, marginRight: msg.role === 'user' ? 0 : 'auto', backgroundColor: msg.role === 'user' ? '#007bff' : '#e9ecef', color: msg.role === 'user' ? 'white' : 'black', wordWrap: 'break-word' }}>
              <p style={{ margin: 0 }}>{msg.content}</p>
              {msg.videoUrl && (
                <div style={{ marginTop: '8px' }}>
                  <VideoPreview videoUrl={msg.videoUrl} title="Edited Video" />
                </div>
              )}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', padding: '12px', gap: '8px', borderTop: '1px solid #ddd', backgroundColor: 'white' }}>
          <input type="file" onChange={handleUpload} accept="video/*,video/mp4,video/quicktime" capture="environment" style={{ width: '100%', padding: '8px', fontSize: '16px' }} />
          <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSend()} placeholder="Describe the video edit..." style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '16px' }} />
          <button onClick={handleSend} disabled={!videoFileData} style={{ padding: '10px 16px', backgroundColor: videoFileData ? '#007bff' : '#ccc', color: 'white', border: 'none', borderRadius: '4px', cursor: videoFileData ? 'pointer' : 'not-allowed', fontSize: '16px', WebkitTapHighlightColor: 'transparent' }}>Send</button>
        </div>
        {originalVideoUrl && (
          <div style={{ position: 'absolute', bottom: '180px', left: '10px', maxWidth: 'calc(100vw - 20px)', boxSizing: 'border-box' }}>
            <VideoPreview videoUrl={originalVideoUrl} title="Original Video Preview" defaultCollapsed={true} />
          </div>
        )}
      </main>
    </div>
  );
}
