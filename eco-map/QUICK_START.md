# 🚀 Quick Start - Local Hosting

## Simplest Way to Get Running

### 1. Prerequisites
```bash
# Ensure you have these installed
docker --version      # Docker Desktop
docker-compose --version
node --version        # Node.js 18+
npm --version
```

### 2. Start Everything (One Command)

**Terminal 1 - Backend + Database:**
```bash
cd /Users/eoin/Documents/GitHub/eco-mapping/eco-map
docker-compose up --build
```

**Terminal 2 - Frontend:**
```bash
cd /Users/eoin/Documents/GitHub/eco-mapping/eco-map/frontend
npm install
npm run dev
```

**That's it!** Your app is now running locally:
- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## Make It Public (Optional)

Want to share with others or access from your phone?

### Install ngrok
```bash
brew install ngrok
```

### Create Public URLs

**Terminal 3 - Expose Backend:**
```bash
ngrok http 8000
# Copy the URL: https://xxx-xxx-xxx.ngrok.io
```

**Terminal 4 - Expose Frontend:**
```bash
ngrok http 5173
# Copy the URL: https://yyy-yyy-yyy.ngrok.io
```

### Update Your App

Edit `backend/.env`:
```
ALLOWED_ORIGINS=https://yyy-yyy-yyy.ngrok.io,http://localhost:5173
```

Edit `frontend/.env.local`:
```
VITE_API_URL=https://xxx-xxx-xxx.ngrok.io
```

Then restart frontend:
```bash
# Ctrl+C to stop npm run dev
cd /Users/eoin/Documents/GitHub/eco-mapping/eco-map/frontend
npm run dev
```

**Share the ngrok frontend URL** → Anyone can access your app!

---

## 🛑 Stop Everything

```bash
# Terminal with npm run dev
Ctrl+C

# Terminal with docker-compose
Ctrl+C

# Or run
docker-compose down
```

---

## 📝 Notes

- ngrok URLs change every 30 seconds unless you have a paid account
- Keep all terminals open while running
- Your machine must stay on for others to access it
- For production: consider Railway instead (~$5/month)

**Questions?** See [LOCAL_HOSTING_GUIDE.md](./LOCAL_HOSTING_GUIDE.md) for detailed setup.
