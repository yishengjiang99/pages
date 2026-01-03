import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const XAI_API_TOKEN = process.env.XAI_API_TOKEN;

if (!XAI_API_TOKEN) {
  console.error('ERROR: XAI_API_TOKEN environment variable is not set');
  console.error('Please create a .env file with XAI_API_TOKEN=your_token_here');
  process.exit(1);
}

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Proxy endpoint for xAI API
app.post('/api/chat', async (req, res) => {
  try {
    const response = await fetch('https://api.grok.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${XAI_API_TOKEN}`
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('xAI API Error:', response.status, data);
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
  console.log(`XAI API Token: ${XAI_API_TOKEN ? '✓ Set' : '✗ Missing'}`);
});
