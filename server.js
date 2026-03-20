// ═══════════════════════════════════════════════════════
//  KaamDost AI Backend Server
//  Deploy this on Render.com (free tier)
//  This proxies requests from your website to Claude API
// ═══════════════════════════════════════════════════════

const express = require('express');
const cors = require('cors');
const app = express();

// ── MIDDLEWARE ──────────────────────────────────────────
app.use(express.json());

// Allow requests from your Netlify website
app.use(cors({
  origin: [
    'https://kaamdost.netlify.app',
    'https://kaamdost.in',
    'http://localhost:3000',
    'http://127.0.0.1:5500',
    // Allow all origins during testing — tighten later
    '*'
  ],
  methods: ['POST', 'GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

// ── HEALTH CHECK ────────────────────────────────────────
// Visit https://your-app.onrender.com/health to confirm server is running
app.get('/health', (req, res) => {
  res.json({
    status: 'KaamDost AI Backend is running! 🤝',
    time: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'KaamDost AI Backend — Active',
    endpoint: 'POST /chat',
    status: 'healthy'
  });
});

// ── MAIN CHAT ENDPOINT ──────────────────────────────────
// Your website calls: POST https://your-app.onrender.com/chat
app.post('/chat', async (req, res) => {

  // Get API key from environment variable (set in Render dashboard)
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: 'API key not configured. Please add ANTHROPIC_API_KEY in Render environment variables.'
    });
  }

  // Get data from website request
  const { messages, system, language } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid request — messages array required' });
  }

  // System prompts for each language
  const systemPrompts = {
    en: `You are KaamDost AI — India's most advanced emotionally intelligent business assistant. Key capabilities:
1) Detect anger/frustration/urgency/happiness and adapt tone immediately. For anger: acknowledge deeply, apologise sincerely, offer immediate help.
2) Understand voice notes in 5 Indian languages.
3) Generate UPI payment links inside WhatsApp.
4) Auto follow-up on cold leads.
5) Handle competitor objections with business-specific counter.
6) Upsell add-ons contextually post-booking.
Respond in English. Max 3 sentences. Warm, smart, natural emojis.
Pricing: Starter ₹999/mo, Business ₹2,999/mo, Enterprise ₹9,999/mo — flat rate, ZERO per-message fees, 14-day free trial.
WhatsApp: +91 94980 23562. Website: kaamdost.netlify.app
Always end with a short helpful question.`,

    hi: `आप KaamDost AI हैं — India का सबसे advanced emotional business assistant। हिंदी में जवाब दें। 2-3 sentence max। गुस्से को detect करके शांत करें। Pricing: ₹999/₹2999/₹9999 flat, कोई per-message fee नहीं, 14 दिन free trial। WhatsApp: +91 94980 23562। अंत में एक सवाल।`,

    ta: `நீங்கள் KaamDost AI — India's most advanced emotional business assistant. தமிழில் பதிலளியுங்கள். 2-3 வாக்யம். கோபத்தை detect செய்து calm செய்யுங்கள். Pricing: ₹999/₹2999/₹9999 flat, per-message fee இல்லை, 14 நாள் free trial. WhatsApp: +91 94980 23562. கேள்வியோடு முடிக்கவும்.`,

    ml: `നിങ്ങൾ KaamDost AI — India's most advanced emotional business assistant. മലയാളത്തിൽ മറുപടി. 2-3 വാക്യം. ദേഷ്യം detect ചെയ്ത് calm ആക്കൂ. Pricing: ₹999/₹2999/₹9999 flat, per-message fee ഇല്ല, 14 ദിവസ free trial. WhatsApp: +91 94980 23562. ഒരു ചോദ്യത്തോടെ അവസാനിക്കൂ.`,

    te: `మీరు KaamDost AI — India's most advanced emotional business assistant. తెలుగులో సమాధానం. 2-3 వాక్యాలు. కోపాన్ని detect చేసి calm చేయండి. Pricing: ₹999/₹2999/₹9999 flat, per-message fee లేదు, 14 రోజుల free trial. WhatsApp: +91 94980 23562. ప్రశ్నతో ముగించండి.`
  };

  const selectedSystem = system || systemPrompts[language] || systemPrompts.en;

  try {
    // Call Claude API from server (no CORS issues here!)
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300, // Keep responses short for chat
        system: selectedSystem,
        messages: messages
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Anthropic API error:', errorData);
      return res.status(response.status).json({
        error: 'AI service error',
        details: errorData.error?.message || 'Unknown error'
      });
    }

    const data = await response.json();
    const reply = data.content?.map(c => c.text || '').join('') || 'Sorry, could not generate a response.';

    // Send reply back to website
    res.json({ reply });

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({
      error: 'Server error — please try again',
      message: error.message
    });
  }
});

// ── START SERVER ────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ KaamDost AI Backend running on port ${PORT}`);
  console.log(`🤝 Health check: http://localhost:${PORT}/health`);
  console.log(`💬 Chat endpoint: POST http://localhost:${PORT}/chat`);
});
