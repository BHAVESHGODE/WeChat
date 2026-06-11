# WeGift — Deployment Configuration Report

> Every input, secret, and configuration value required for production deployment.

---

## 1. Frontend (React)

### 1.1 Environment Variables

| Variable | Mandatory | Example Value | Where to Set | Description |
|----------|-----------|---------------|--------------|-------------|
| `REACT_APP_API_URL` | **YES** | `https://wegift-api.onrender.com` | `client/.env` or Netlify/Vercel dashboard | Backend API root URL (no trailing slash). Used by all pages for fetch calls. |

**File: `client/.env`**
```
REACT_APP_API_URL=https://wegift-api.onrender.com
```

> **Warning:** After changing this value, re-run `npm run build` to bake it into the production bundle.

### 1.2 Hosting Provider Settings

#### Option A — Netlify

| Setting | Value |
|---------|-------|
| Build command | `cd client && npm ci && npm run build` |
| Publish directory | `client/build` |
| Node version | 18.x or 20.x (set via `.nvmrc` or Netlify env: `NODE_VERSION=20`) |

**Redirects file (`client/public/_redirects`):**
```
/* /index.html 200
```
This ensures React Router handles all routes (study-room, music, venting-room, games, etc.) instead of Netlify returning 404.

#### Option B — Vercel

| Setting | Value |
|---------|-------|
| Framework preset | Create React App |
| Root directory | `client` |
| Build command | `npm run build` |
| Output directory | `build` |
| Node version | 20.x (set in `vercel.json`) |

**`vercel.json` (place in `client/`):**
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

---

## 2. Backend (Express + Node.js)

### 2.1 Required Environment Variables

| Variable | Mandatory | Example Value | Where to Set | Description |
|----------|-----------|---------------|--------------|-------------|
| `PORT` | **YES** | `5000` | `server/.env` or Render dashboard | Port the Express server listens on. Render/Heroku inject this automatically. |
| `MONGO_URI` | **YES** | `mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/wegift` | `server/.env` or Render dashboard | MongoDB Atlas connection string. |
| `AI_API_KEY` | Optional | `sk-proj-xxxxxxxxxxxx` | `server/.env` or Render dashboard | OpenAI or Groq API key. Leave **empty** to use built-in fallback responses (10 canned empathetic replies). |

### 2.2 Optional Environment Variables

| Variable | Mandatory | Example Value | Where to Set | Description |
|----------|-----------|---------------|--------------|-------------|
| `AI_API_URL` | Optional | `https://api.openai.com/v1/chat/completions` | `server/.env` | API endpoint for AI. Defaults to OpenAI. Use `https://api.groq.com/openai/v1/chat/completions` for Groq. |
| `AI_MODEL` | Optional | `gpt-3.5-turbo` | `server/.env` | Model name passed to the AI API. |
| `JWT_SECRET` | Optional | `a-random-64-char-string` | `server/.env` | Not currently used by the app (auth is name-based). Add for future JWT auth. |

### 2.3 CORS Configuration

Current setting in `server.js`:
```js
app.use(cors());
```

This allows **all origins** (`Access-Control-Allow-Origin: *`). For production, restrict to your frontend domain:

```js
app.use(cors({ origin: 'https://wegift.netlify.app' }));
```

Or for multiple origins:
```js
const allowedOrigins = [
  'https://wegift.netlify.app',
  'https://wegift.vercel.app',
  'http://localhost:3000',
];
app.use(cors({ origin: allowedOrigins }));
```

### 2.4 Static File Serving (Production)

The server already serves the React build (`client/build/`) automatically in production:
```js
const clientBuild = path.join(__dirname, '..', 'client', 'build');
app.use(express.static(clientBuild));
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    return res.sendFile(path.join(clientBuild, 'index.html'));
  }
  res.status(404).json({ error: 'API route not found' });
});
```

This means:
- **Single-server deployment:** Upload both `server/` and `client/build/`, then run `node server.js`. Express handles both API and frontend.
- **Separated deployment:** Deploy client to Netlify/Vercel and server to Render. In this case, delete the static serving code from `server.js` and point `REACT_APP_API_URL` to the Render URL.

### 2.5 Hosting Provider Settings

#### Option A — Render (Recommended for backend)

| Setting | Value |
|---------|-------|
| Runtime | Node |
| Build command | `npm install --prefix server` |
| Start command | `npm start --prefix server` |
| Root directory | (leave as repo root, or point to `server`) |
| Environment variables | Inject all vars from section 2.1 via Render dashboard |

#### Option B — Heroku

| Setting | Value |
|---------|-------|
| Buildpack | heroku/nodejs |
| Procfile (in `server/` OR root) | `web: npm start --prefix server` |
| Environment variables | `heroku config:set MONGO_URI=... AI_API_KEY=...` |

---

## 3. Database (MongoDB Atlas)

### 3.1 Cluster Setup

| Step | Action |
|------|--------|
| 1 | Create a free **M0** cluster at [cloud.mongodb.com](https://cloud.mongodb.com) |
| 2 | Choose a cloud provider (AWS) and region closest to your users |
| 3 | Under **Database Access** → Add a database user (username + password) |
| 4 | Under **Network Access** → Add IP allowlist entry `0.0.0.0/0` (allows all IPs) or your server's static IP |

### 3.2 Connection String

Format:
```
mongodb+srv://<dbUser>:<dbPassword>@<cluster>.xxxxx.mongodb.net/wegift?retryWrites=true&w=majority
```

Replace:
- `<dbUser>` — the database user you created
- `<dbPassword>` — the user's password (URL-encode special chars: `@` → `%40`, `#` → `%23`)
- `<cluster>` — your cluster name (e.g. `cluster0`)

Set this as `MONGO_URI` in `server/.env` or Render dashboard.

The `config/db.js` file checks `MONGODB_URI` first, then `MONGO_URI`, so either variable name works.

### 3.3 Seed Data

After connecting the database, seed the initial data:

```bash
cd server
node seed.js
```

This creates:
- **3 users:** Maverick (pioneer), Bell (strategist), Goju (guardian)
- **3 playlists:** Lofi (5 tracks), Motivation (5 tracks), Romantic (5 tracks)

No additional data setup is required for tasks, conversations, or scores — these are created on-the-fly as users interact with the app.

---

## 4. Third-Party Integrations

### 4.1 AI API (OpenAI / Groq) — Optional

The Venting Room ("Chalo Baat Karte Hai") uses AI to generate empathetic responses.

| Service | API URL to set as `AI_API_URL` | API Key source |
|---------|--------------------------------|----------------|
| **OpenAI** | `https://api.openai.com/v1/chat/completions` | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| **Groq** (free) | `https://api.groq.com/openai/v1/chat/completions` | [console.groq.com/keys](https://console.groq.com/keys) |

**Without an API key:** The app uses 10 built-in fallback responses (e.g., "I hear you. That sounds really tough."). The chat works fully, just without AI-generated variety.

### 4.2 YouTube IFrame API — No Key Required

The music player uses the YouTube IFrame API which is **free and does not require an API key**. It embeds YouTube videos by `videoId` directly. All video IDs are stored in the seeded playlists.

### 4.3 No Other Integrations

This project does **not** use Spotify, email/SMS services, analytics, or payment gateways. No additional keys are needed.

---

## 5. Deployment Architecture Options

### Option 1: All-in-One (Simplest)

```
[User] ←→ Express (server.js) ←→ MongoDB Atlas
              ↕
         client/build (static files)
```

- Run everything from one server
- Set `REACT_APP_API_URL` to the same domain (e.g., `https://wegift.onrender.com`)
- Deploy to Render with both server code and `client/build/`

### Option 2: Separated (Scalable)

```
[User] ←→ Netlify (React SPA) ←→ Express (Render) ←→ MongoDB Atlas
```

- Frontend on Netlify/Vercel
- Backend on Render/Heroku
- `REACT_APP_API_URL` points to the Render URL
- Delete static serving code from `server.js` or keep it (it won't interfere)

---

## 6. DNS / Custom Domain

### 6.1 Netlify Custom Domain
1. Buy domain from Namecheap/GoDaddy/Cloudflare
2. In Netlify dashboard → Domain settings → Add custom domain
3. Update your domain's DNS: add a CNAME record pointing `www` to `your-site.netlify.app`
4. Netlify auto-provisions SSL (Let's Encrypt)

### 6.2 Render Custom Domain
1. Render dashboard → Settings → Custom Domain
2. Add your domain (e.g., `api.yourdomain.com`)
3. Add a CNAME record at your DNS provider pointing to `your-service.onrender.com`
4. Render auto-provisions SSL

---

## 7. SSL Certificates

- **Netlify:** Free auto-renewing SSL (Let's Encrypt) — enabled by default for all *.netlify.app domains and custom domains.
- **Render:** Free auto-renewing SSL — enabled by default for all *.onrender.com domains and custom domains.
- **Heroku:** Free auto-renewing SSL (ACM) — enable in Settings → Manage SSL.
- **Self-hosted:** Use Certbot (Let's Encrypt) or Caddy for automatic SSL.

No manual SSL configuration is needed on any of the recommended platforms.

---

## 8. Production Checklist

### Pre-Deployment

- [ ] `REACT_APP_API_URL` in `client/.env` set to production backend URL (e.g., `https://wegift-api.onrender.com`)
- [ ] `MONGO_URI` in `server/.env` set to MongoDB Atlas connection string
- [ ] MongoDB Atlas IP allowlist includes `0.0.0.0/0` (or your server's IP)
- [ ] CORS origin restricted to frontend domain (optional but recommended)
- [ ] `JWT_SECRET` set if JWT auth is added later

### Build Verification

- [ ] `cd client && npm run build` succeeds (no errors)
- [ ] `client/build/` directory contains `index.html`, `static/js/`, `static/css/`
- [ ] All server files pass `node --check` (syntax check)

### No Hardcoded Localhost

- [ ] Run `grep -rn "localhost:5000" client/src/` — should return **zero results**
- [ ] Run `grep -rn "localhost:5000" server/` — should return **zero results**

### Seed Data

- [ ] `cd server && node seed.js` completes without errors
- [ ] Output confirms: `Seeded 3 users: Maverick, Bell, Goju`
- [ ] Output confirms: `Seeded 3 playlists: Lofi, Motivation, Romantic`

### Runtime Verification

- [ ] Login page loads at `/`
- [ ] Clicking **Maverick** navigates to `/maverick` — dashboard loads with name + role + date
- [ ] **Study Room** button → `/study-room?user=Maverick` — timer, lofi audio, quotes render
- [ ] **Music** button → `/music?user=Maverick` — playlists load, clicking a track plays audio
- [ ] **Chalo Baat Karte Hai** button → `/venting-room?user=Maverick` — chat UI works, sending a message gets a reply
- [ ] **Games** button → `/games?user=Maverick` — TicTacToe, RPS, Snake all playable
- [ ] Persistent player bar shows at bottom of music/games/venting pages when a track is playing
- [ ] All API routes respond with proper JSON:
  - `GET /api` → `"WeGift API is running"`
  - `GET /api/maverick` → `{ user: { name: "Maverick", role: "pioneer" } }`
  - `GET /api/playlists` → array of 3 playlists
  - `POST /api/tasks` → creates and returns task
  - `POST /api/conversation/Maverick` → returns `{ userMessage, aiMessage }`
  - `POST /api/scores` → saves and returns score

### Post-Deployment

- [ ] Visit live URL in incognito/private browser
- [ ] Test all 3 login buttons
- [ ] Test all 4 feature modules from each dashboard
- [ ] Test persistent music player across route navigation
- [ ] Verify AI fallback responses work (if no API key)
- [ ] Monitor server logs for errors

---

## 9. Quick-Start: Local Development

If you're running the project locally for the first time:

```bash
# 1. Install root dependencies (concurrently)
npm install

# 2. Install server dependencies
npm install --prefix server

# 3. Install client dependencies
npm install --prefix client

# 4. Make sure MongoDB is running locally (default port 27017)
#    On Windows: net start MongoDB
#    On macOS: brew services start mongodb-community
#    On Linux: sudo systemctl start mongod

# 5. Seed the database
npm run seed

# 6. Start both server (port 5000) and client (port 3000)
npm run dev
```

Then open `http://localhost:3000` and click any login button.
