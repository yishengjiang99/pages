import React, { useState, useRef, useEffect } from 'react';
import { fetchFile } from './ffmpeg.js';
import { tools, systemPrompt } from './tools.js';
import { toolFunctions } from './toolFunctions.js';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('xaiToken') || '');
  const [showTokenPrompt, setShowTokenPrompt] = useState(!localStorage.getItem('xaiToken'));
  const [tempToken, setTempToken] = useState('');
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

  const handleSetToken = () => {
    if (tempToken) {
      setToken(tempToken);
      localStorage.setItem('xaiToken', tempToken);
      setShowTokenPrompt(false);
    }
  };

  const addMessage = (text, isUser = false, videoUrl = null) => {
    setMessages(prev => [...prev, { role: isUser ? 'user' : 'assistant', content: text, videoUrl }]);
  };

  const callAPI = async (currentMessages) => {
    try {
      const response = await fetch('https://api.grok.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
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
      addMessage('Uploading video...', true);
      const data = await fetchFile(file);
      setVideoFileData(data);
      const url = URL.createObjectURL(file);
      setOriginalVideoUrl(url);
      addMessage('Original video uploaded:', false, url);
      const newMessages = [...messages, { role: 'user', content: 'Video uploaded and ready for editing.' }];
      setMessages(newMessages);
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
    addMessage(text, true);
    setChatInput('');
    const newMessages = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    await callAPI(newMessages);
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', margin: 0, padding: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f0f0f0' }}>
      <main style={{ width: '100%', maxWidth: '100vw', height: '100vh', backgroundColor: 'white', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', alignItems: 'center', gap: '10px', zIndex: 10, flexWrap: 'wrap' }}>
          <span style={{ color: token ? 'green' : 'red', fontSize: '12px' }}>{token ? 'Token set' : 'No token'}</span>
          <button onClick={() => setShowTokenPrompt(true)} style={{ padding: '6px 12px', fontSize: '14px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}>Set Token</button>
        </div>
        {showTokenPrompt && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', zIndex: 20, width: '90%', maxWidth: '400px' }}>
            <input type="text" value={tempToken} onChange={(e) => setTempToken(e.target.value)} placeholder="Enter xAI API token" style={{ width: '100%', padding: '8px', marginBottom: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '16px' }} />
            <button onClick={handleSetToken} style={{ padding: '8px 16px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', width: '100%', WebkitTapHighlightColor: 'transparent' }}>Save</button>
          </div>
        )}
        <div ref={chatWindowRef} style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '16px', paddingTop: '50px', WebkitOverflowScrolling: 'touch' }}>
          {messages.slice(1).map((msg, index) => (
            <div key={index} style={{ marginBottom: '12px', padding: '8px 12px', borderRadius: '8px', maxWidth: '80%', alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', marginLeft: msg.role === 'user' ? 'auto' : 0, marginRight: msg.role === 'user' ? 0 : 'auto', backgroundColor: msg.role === 'user' ? '#007bff' : '#e9ecef', color: msg.role === 'user' ? 'white' : 'black', wordWrap: 'break-word' }}>
              <p style={{ margin: 0 }}>{msg.content}</p>
              {msg.videoUrl && <video src={msg.videoUrl} controls playsInline style={{ width: '100%', maxWidth: '300px', marginTop: '8px', borderRadius: '4px' }} />}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', padding: '12px', gap: '8px', borderTop: '1px solid #ddd', backgroundColor: 'white' }}>
          <input type="file" onChange={handleUpload} accept="video/*,video/mp4,video/quicktime" capture="environment" style={{ width: '100%', padding: '8px', fontSize: '16px' }} />
          <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSend()} placeholder="Describe the video edit..." style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '16px' }} />
          <button onClick={handleSend} disabled={!videoFileData} style={{ padding: '10px 16px', backgroundColor: videoFileData ? '#007bff' : '#ccc', color: 'white', border: 'none', borderRadius: '4px', cursor: videoFileData ? 'pointer' : 'not-allowed', fontSize: '16px', WebkitTapHighlightColor: 'transparent' }}>Send</button>
        </div>
        {originalVideoUrl && (
          <div style={{ position: 'absolute', bottom: '180px', left: '10px', backgroundColor: 'rgba(255,255,255,0.9)', padding: '10px', borderRadius: '4px', maxWidth: 'calc(100vw - 20px)', boxSizing: 'border-box' }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '12px' }}>Original Video Preview:</p>
            <video src={originalVideoUrl} controls playsInline style={{ width: '100%', maxWidth: '200px' }} />
          </div>
        )}
      </main>
    </div>
  );
}
