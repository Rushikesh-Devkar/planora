# Planora – Deploy Guide

## Local run
Backend:  cd backend && npm install && npx prisma migrate deploy && npm run dev
Frontend: cd frontend && npm install && npm run dev

## Production
Backend  -> Render (Web Service, root dir: backend)
  Build:  npm install && npm run build
  Start:  npm start
  Env:    DATABASE_URL, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
Frontend -> Netlify / Vercel (root dir: frontend)
  Build:  npm run build     Output: dist
  Env:    VITE_API_URL = https://<your-backend>.onrender.com/api
