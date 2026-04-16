# Sweater Analyser Backend Setup Guide

## Problem Fixed ✅

Your site was calling the Claude API directly from the browser, which caused:
- CORS (Cross-Origin) blocking errors
- API key exposure in browser code
- Rate limiting issues
- "Failed to fetch" errors

This backend solution fixes all of these.

---

## What's Included

1. **server.js** - Node.js backend that securely calls Claude API
2. **package.json** - Dependencies (Express, CORS, dotenv)
3. **sweater-analyser.html** - Updated HTML that calls your backend instead
4. **.env.example** - Template for environment variables

---

## Setup Steps

### Step 1: Create Folder Structure on Hostinger

Your GitHub repo should look like this:

```
knitwear-site/
├── index.html                 (your main site)
├── sweater-analyser.html      (NEW - updated version)
├── knitwear-site__3_.html     (your calculator, if separate)
├── style.css                  (if separate)
├── server.js                  (NEW)
├── package.json               (NEW)
├── .env                       (NEW - don't commit to GitHub!)
├── .env.example               (NEW - for documentation)
├── node_modules/              (auto-generated, add to .gitignore)
└── public/                    (optional - static files)
```

### Step 2: Add to .gitignore

Create a `.gitignore` file in your repo root:

```
node_modules/
.env
.DS_Store
```

This prevents your API key from being uploaded to GitHub.

### Step 3: Create .env File Locally & on Hostinger

**On your local machine:**
1. Copy `.env.example` to `.env`
2. Add your Anthropic API key:
   ```
   ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx
   PORT=3000
   ```

**On Hostinger (via control panel or SSH):**
1. Create a `.env` file in your project root
2. Add the same values

### Step 4: Install Dependencies Locally (for testing)

```bash
npm install
```

This creates `node_modules/` folder (which won't be pushed to GitHub thanks to `.gitignore`).

### Step 5: Test Locally

```bash
npm start
```

Your server should run on `http://localhost:3000`. Visit and test the sweater analyser.

### Step 6: Push to GitHub

```bash
git add .
git commit -m "Add Node.js backend for sweater analysis"
git push origin main
```

### Step 7: Configure Hostinger

#### Option A: Using Hostinger's App Manager (Easiest)

1. Log into Hostinger control panel
2. Go to **App Manager** or **Node.js**
3. Create a new Node.js application:
   - **Entry point**: `server.js`
   - **Port**: `3000`
   - **Root directory**: `/` (or wherever your repo is)

4. Add environment variables:
   - Click **Environment Variables**
   - Add: `ANTHROPIC_API_KEY` = your-actual-api-key

5. Deploy (Hostinger will handle `npm install` and starting the server)

#### Option B: Manual Setup via SSH

```bash
# SSH into your Hostinger server
ssh user@yourhost.com

# Navigate to your project
cd public_html/knitwear-site

# Pull latest code
git pull origin main

# Install dependencies
npm install

# Create .env file (using nano editor)
nano .env

# Paste this (replace with your actual key):
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx
PORT=3000

# Exit nano: Ctrl+X, then Y, then Enter

# Test the server
npm start

# If it works, keep it running in background with PM2 (optional but recommended)
npm install -g pm2
pm2 start server.js --name "knitwear-api"
pm2 save
```

---

## Verify It's Working

### Local Testing
```bash
curl -X POST http://localhost:3000/api/analyze-sweater \
  -H "Content-Type: application/json" \
  -d '{"imageBase64":"...","imageMimeType":"image/jpeg"}'
```

### On Hostinger
Visit `https://yourdomain.com/api/health` - should return `{"status":"ok"}`

---

## Important: Update Your HTML

The key change in `sweater-analyser.html` is on **line ~510**:

**BEFORE (broken):**
```javascript
const res = await fetch('https://api.anthropic.com/v1/messages', {
  headers: { 'x-api-key': YOUR_API_KEY }, // ❌ Exposed!
  ...
});
```

**AFTER (fixed):**
```javascript
const res = await fetch('/api/analyze-sweater', {
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ imageBase64, imageMimeType })
});
```

---

## File Structure Summary

| File | Purpose |
|------|---------|
| `server.js` | Node.js backend server |
| `package.json` | Node.js dependencies |
| `.env` | Your secret API key (never push to GitHub) |
| `.env.example` | Template for others |
| `sweater-analyser.html` | Updated frontend |
| `.gitignore` | Prevents node_modules & .env from Git |

---

## Common Issues

### "Cannot find module 'express'"
→ Run `npm install`

### "API key is not set"
→ Check your `.env` file has `ANTHROPIC_API_KEY=...`

### "CORS error" still happening
→ Your frontend is still calling Anthropic API directly. Make sure you're using the updated `sweater-analyser.html`

### "Port 3000 already in use"
→ Change PORT in `.env` to 3001, 3002, etc.

### "Connection refused"
→ Hostinger may need the server restarted. Check App Manager or restart via SSH.

---

## Deployment Checklist

- [ ] Files pushed to GitHub (without .env)
- [ ] `.env` file created on Hostinger with API key
- [ ] `npm install` ran successfully
- [ ] Server starts without errors
- [ ] Health endpoint returns `{"status":"ok"}`
- [ ] Sweater analyser calls `/api/analyze-sweater`
- [ ] Image upload and analysis works
- [ ] Results display with confidence scores

---

## Next Steps

Once this is working:
1. Test with multiple sweater photos
2. Monitor API usage to stay within rate limits
3. Consider adding image caching to prevent re-analyzing the same image
4. Add user analytics to track which features are popular

---

**Need help?** Check your Hostinger control panel for server logs or SSH in and run:
```bash
pm2 logs knitwear-api
```
