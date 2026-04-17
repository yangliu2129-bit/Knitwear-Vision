const express = require('express');
const cors = require('cors');
const path = require('path'); // ✅ ADD THIS
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// ✅ SERVE HTML FILES
app.use(express.static(__dirname));

// ✅ API ROUTE
app.post('/api/analyze-sweater', async (req, res) => {
  console.log("API HIT");
  res.json({ ok: true }); // temporary test
});

// ❗ KEEP THIS LAST
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});



// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());

// Serve static files (your HTML, CSS, JS)
app.use(express.static(path.join(__dirname)));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Main sweater analysis endpoint
app.post('/api/analyze-sweater', async (req, res) => {
  const { imageBase64, imageMimeType } = req.body;

  // Validation
  if (!imageBase64) {
    return res.status(400).json({ error: 'Missing imageBase64' });
  }

  if (!imageMimeType) {
    return res.status(400).json({ error: 'Missing imageMimeType' });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY is not set');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const prompt = `You are an expert knitting pattern analyst. Examine this sweater image closely and return ONLY a valid JSON object — no preamble, no markdown fences, no extra text.

JSON structure (use exact keys):
{
  "construction":  { "value": "drop|raglan|set-in",                                  "confidence": 0.0-1.0 },
  "style":         { "value": "oversized|classic|fit",                               "confidence": 0.0-1.0 },
  "neckline":      { "value": "crew|v-neck|turtleneck|cowl|boat|square|scoop",       "confidence": 0.0-1.0 },
  "neckdepth":     { "value": "high|standard|deep",                                  "confidence": 0.0-1.0 },
  "sleeve_length": { "value": "sleeveless|short|three-quarter|long",                 "confidence": 0.0-1.0 },
  "sleeve_shape":  { "value": "straight|tapered|balloon|flared|fitted",              "confidence": 0.0-1.0 },
  "stitch":        { "value": "stockinette|garter|ribbed|cable|colorwork|lace|moss", "confidence": 0.0-1.0 },
  "yarn_weight":   { "value": "lace|fingering|dk|worsted|bulky|super-bulky",         "confidence": 0.0-1.0 },
  "notes": "2-3 sentences of specific visual observations about this exact sweater."
}

Detection guidance:
- construction: drop = straight horizontal shoulder seam, raglan = diagonal seam from underarm to neck, set-in = curved fitted armhole
- style: oversized = lots of positive ease/drape, classic = relaxed, fit = close to body
- neckline: identify the opening shape
- neckdepth: high = near base of neck, standard = collarbone, deep = mid-chest or lower
- sleeve_length: sleeveless / short (above elbow) / three-quarter / long (to wrist)
- sleeve_shape: straight = uniform width, tapered = narrows toward wrist, balloon = gathered/puffed at shoulder or cuff, flared = widens toward cuff, fitted = close-fitting throughout
- stitch: dominant visible surface texture
- yarn_weight: judge from stitch scale, apparent thickness, and drape

Always provide a value — if uncertain pick the most likely option and lower the confidence score.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: imageMimeType,
                data: imageBase64
              }
            },
            {
              type: 'text',
              text: prompt
            }
          ]
        }]
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const errorMsg = error.error?.message || `API error ${response.status}`;
      
      // Handle rate limiting gracefully
      if (response.status === 429) {
        return res.status(429).json({ 
          error: 'Rate limit exceeded. Please try again in a few moments.',
          retryAfter: response.headers.get('retry-after') || '60'
        });
      }
      
      throw new Error(errorMsg);
    }

    const data = await response.json();
    const raw = data.content.map(b => b.text || '').join('');
    const result = JSON.parse(raw.replace(/```json|```/g, '').trim());

    res.json(result);

  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: error.message || 'Analysis failed' });
  }
});

// 404 fallback
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Sweater Analyser API running on port ${PORT}`);
});
