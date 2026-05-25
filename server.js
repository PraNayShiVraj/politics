const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Serve static assets from the current directory
app.use(express.static(path.join(__dirname)));

// API endpoint to proxy chat requests to Mistral AI API
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid request: "messages" must be an array.' });
    }

    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      console.warn('Warning: MISTRAL_API_KEY environment variable is not set on the server.');
      return res.status(500).json({ 
        error: 'API key missing', 
        message: 'The server MISTRAL_API_KEY is not configured. Please set the environment variable or use the frontend Fallback API Key setting in ElectIQ settings (cog icon).' 
      });
    }

    // Call Mistral Chat Completions API
    let fetchFn;
    if (typeof fetch === 'function') {
      fetchFn = fetch;
    } else {
      const fetchModule = await import('node-fetch');
      fetchFn = fetchModule.default;
    }

    console.log(`Sending request to Mistral API using model: mistral-small-latest`);
    const apiResponse = await fetchFn('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'mistral-small-latest',
        messages: [
          {
            role: 'system',
            content: 'You are ElectIQ, a friendly and strictly non-partisan election process guide. Explain election stages, timelines, terminology, and steps in clear simple language. Use bold for key terms. Never take political sides. Keep answers to 2–4 short paragraphs.'
          },
          ...messages
        ]
      })
    });

    const data = await apiResponse.json();

    if (!apiResponse.ok) {
      console.error('Mistral API error response:', data);
      return res.status(apiResponse.status).json({ 
        error: 'Mistral API Error', 
        message: data.message || 'Error communicating with Mistral API' 
      });
    }

    // Adapt Mistral OpenAI-style response to match frontend expectations
    if (data.choices && data.choices[0] && data.choices[0].message) {
      res.json({
        content: [
          {
            text: data.choices[0].message.content
          }
        ]
      });
    } else {
      res.status(502).json({
        error: 'Mistral API Error',
        message: 'Unexpected payload structure from Mistral AI API'
      });
    }
  } catch (error) {
    console.error('Internal server error proxying chat:', error);
    res.status(500).json({ error: 'Server Error', message: error.message });
  }
});

// Fallback to index.html for single-page routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`  ElectIQ Local Server running at http://localhost:${PORT}`);
  console.log(`  Serving static files from: ${__dirname}`);
  if (process.env.MISTRAL_API_KEY) {
    console.log(`  MISTRAL_API_KEY detected! Ready for secure proxying.`);
  } else {
    console.log(`  [Notice] MISTRAL_API_KEY is not set.`);
    console.log(`           Use the settings cog on the frontend to input one directly.`);
  }
  console.log(`=======================================================`);
});

