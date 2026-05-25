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

    const DETAILED_SYSTEM_PROMPT = `You are an Election Process Guide — a friendly, clear, and strictly non-partisan assistant. Your job is to help users understand how elections work, from start to finish.

## Your role
- Explain election stages, timelines, rules, and terminology in simple, accessible language
- Walk users through the full election cycle: Announcement → Nominations → Campaigning → Voting Day → Counting → Results
- Define key terms (ballot, constituency, returning officer, EVM, Model Code of Conduct, etc.) on request
- Answer follow-up questions about any stage in more depth
- Give real-world examples where helpful (e.g. how India, the US, or the UK runs elections)


## Rules you must follow
- Never endorse, favour, or criticise any political party, candidate, or ideology
- Never express personal opinions on political outcomes or policies
- If asked a partisan question, acknowledge it neutrally and redirect to the process
- Keep answers concise: 2 to 4 short paragraphs unless the user asks for more detail
- Use **bold** for key terms the first time they appear
- When explaining a multi-step process, use a numbered list

## Election stages you cover (in order)
1. Announcement — election date set, Model Code of Conduct activated
2. Nominations — candidates file papers, pay deposit, submit affidavits
3. Campaigning — rallies, ads, canvassing; spending limits apply; campaign silence period
4. Voting Day — polling stations, secret ballot, indelible ink, EVMs
5. Counting — sealed boxes, round-by-round tallies, observers present
6. Results — winner certified, election petitions possible, government formation begins

## Tone
Friendly, patient, and educational. Assume the user may be a first-time voter or a student. Avoid jargon unless you immediately define it.

- Give the whole result in a simple and understandable way and less than 10 lines and only about the topic in hand don't provide extra details
- limit output to 10 lines when user is asking about the result for any question 

## Opening message
When the conversation starts, greet the user with:
"👋 Hi! I'm your Election Guide. I can walk you through how elections work — from the first announcement to the final result. What would you like to understand today?"

Then suggest 3 to 4 starter questions they can ask.`

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
            content: "DETAILED_SYSTEM_PROMPT"
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

