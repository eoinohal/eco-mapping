# Local Self-Hosting Guide - Eco-Mapping

## 🏠 Host on Your Machine Publicly

This guide shows how to run eco-mapping locally and make it publicly accessible.

---

## Step 1: Verify Your Setup

### Check Requirements
```bash
# Verify Docker is installed
docker --version

# Verify Docker Compose
docker-compose --version

# Verify Node.js
node --version
npm --version
```

### Your Current Stack
- **Backend**: FastAPI on port 8000
- **Database**: PostgreSQL on port 5432 (via Docker)
- **Frontend**: React on port 5173

---

## Step 2: Run Locally (Private Network)

### Start Everything with Docker Compose

```bash
cd /Users/eoin/Documents/GitHub/eco-mapping/eco-map

# Start all services (backend + database)
docker-compose up --build

# In another terminal, start frontend dev server
cd frontend
npm run dev
```

**Access:**
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`
- API Docs: `http://localhost:8000/docs`

---

## Step 3: Make It Public (ngrok)

The easiest way to make your local app publicly accessible.

### Install ngrok

```bash
# Using Homebrew on Mac
brew install ngrok

# Or download from https://ngrok.com/download
```

### Expose Backend & Frontend

```bash
# Terminal 1: Backend tunnel
ngrok http 8000
# You'll see: https://abc123xyz.ngrok.io → http://localhost:8000

# Terminal 2: Frontend tunnel  
ngrok http 5173
# You'll see: https://def456uvw.ngrok.io → http://localhost:5173
```

### Update Your App for Public Access

Edit backend `.env`:
```bash
# Get ngrok URLs from the output above
ALLOWED_ORIGINS=https://def456uvw.ngrok.io,http://localhost:5173
```

Then update frontend to use the ngrok backend URL:

1. Create `frontend/.env.local`:
```
VITE_API_URL=https://abc123xyz.ngrok.io
```

2. Update `frontend/src/context/AuthContext.jsx`:
```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
// Use API_URL instead of hardcoded localhost
```

---

## Step 4: Keep It Running 24/7 (Optional)

If you want permanent hosting on your machine:

### Option A: Use PM2 (Node.js process manager)
```bash
# Install PM2
npm install -g pm2

# Create ecosystem.config.js in your project root
# (See template below)

# Start all processes
pm2 start ecosystem.config.js

# Monitor
pm2 monit

# View logs
pm2 logs
```

**ecosystem.config.js template:**
```javascript
module.exports = {
  apps: [
    {
      name: 'eco-mapping-backend',
      script: 'docker-compose up',
      cwd: '/Users/eoin/Documents/GitHub/eco-mapping/eco-map',
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      ignore_watch: ['/node_modules', '/.git'],
    }
  ]
};
```

### Option B: systemd Service (Linux/Mac)
Create a systemd service file to auto-start on boot.

---

## Step 5: Setup Domain (Optional)

To replace ngrok URLs with a custom domain:

1. **Buy a domain** (Namecheap, GoDaddy, etc.)
2. **Setup Dynamic DNS** (your IP changes, need to track it)
3. **Port forward** in your router (8000 → backend, 5173 → frontend)
4. **Use nginx** as reverse proxy

This is complex - **ngrok is recommended** for simplicity.

---

## 🚨 Important Security Notes

⚠️ **Running on your machine is NOT recommended for production:**
- Your home network is exposed
- No backups or redundancy
- ISPs often block inbound traffic
- No SSL by default (ngrok provides this)
- Machine must stay on 24/7
- Power outages = downtime

✅ **For production, use Railway instead** (~$5-10/month)

---

## 🔧 Troubleshooting

### Frontend can't connect to backend
- Check `ALLOWED_ORIGINS` in `.env`
- Check `VITE_API_URL` is set correctly
- Ensure ngrok URLs are current (they change on restart)

### Port already in use
```bash
# Kill process on port 8000
lsof -i :8000
kill -9 <PID>

# Kill process on port 5173
lsof -i :5173
kill -9 <PID>
```

### Database connection fails
```bash
# Restart Docker
docker-compose down
docker-compose up --build
```

---

## 📊 Quick Start Checklist

- [ ] Docker & Docker Compose installed
- [ ] Run `docker-compose up --build`
- [ ] Run `npm run dev` in frontend
- [ ] Visit `http://localhost:5173`
- [ ] Install ngrok
- [ ] Run `ngrok http 8000` and `ngrok http 5173`
- [ ] Update `.env` with ngrok URLs
- [ ] Share public ngrok URLs with others

**You're now hosting locally!** 🎉
