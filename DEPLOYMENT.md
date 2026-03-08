# MathMaster Pro - Deployment Guide

## Översikt

Denna guide beskriver hur du deployer MathMaster Pro till produktion.

## Arkitektur

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Expo App       │────▶│  FastAPI        │────▶│  MongoDB        │
│  (iOS/Android)  │     │  (Railway/      │     │  (Atlas)        │
│                 │     │   Render)       │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Steg 1: MongoDB Atlas

1. Gå till https://www.mongodb.com/atlas
2. Skapa ett gratis konto
3. Skapa ett nytt Cluster (välj M0 Free Tier)
4. Under "Database Access" - skapa en användare
5. Under "Network Access" - tillåt alla IP (0.0.0.0/0)
6. Klicka "Connect" → "Drivers" och kopiera connection string

```
mongodb+srv://<username>:<password>@cluster.xxxxx.mongodb.net/mathmaster
```

## Steg 2: Deploy Backend till Railway

### Option A: Railway (Rekommenderat)

1. Gå till https://railway.app
2. Skapa konto (gratis tier finns)
3. "New Project" → "Deploy from GitHub repo"
4. Välj din repo och `/backend` som root
5. Lägg till miljövariabler:

| Variabel | Värde |
|----------|-------|
| `MONGO_URL` | Din MongoDB Atlas connection string |
| `DB_NAME` | `mathmaster` |
| `JWT_SECRET` | Generera en lång random sträng |
| `RESEND_API_KEY` | (valfritt) För email |

6. Deploy!

### Option B: Render

1. Gå till https://render.com
2. "New Web Service" → Connect GitHub
3. Settings:
   - Root Directory: `backend`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn server:app --host 0.0.0.0 --port $PORT`
4. Lägg till miljövariabler (samma som Railway)
5. Deploy!

## Steg 3: Seed databas

Efter deploy, kör seed-scriptet:

```bash
# Lokalt med MongoDB Atlas URL
export MONGO_URL="mongodb+srv://..."
export DB_NAME="mathmaster"
python seed_database.py
```

Eller importera `db_export.json` via MongoDB Compass.

## Steg 4: Uppdatera Expo App

1. Öppna `/frontend/src/config/api.ts`
2. Ändra `PRODUCTION_URL`:

```typescript
const PRODUCTION_URL = 'https://your-app.railway.app';
```

3. Bygg appen:

```bash
# iOS
eas build --platform ios --profile production

# Android  
eas build --platform android --profile production
```

4. Ladda upp till App Store / Google Play

## Miljövariabler - Backend

| Variabel | Beskrivning | Obligatorisk |
|----------|-------------|--------------|
| `MONGO_URL` | MongoDB connection string | ✅ |
| `DB_NAME` | Databasnamn (default: mathmaster) | ❌ |
| `JWT_SECRET` | Hemlig nyckel för JWT tokens | ✅ |
| `RESEND_API_KEY` | API-nyckel för email (Resend) | ❌ |

## Miljövariabler - Frontend

| Variabel | Beskrivning |
|----------|-------------|
| `EXPO_PUBLIC_BACKEND_URL` | Backend API URL |

## Verifiera deployment

```bash
# Test health endpoint
curl https://your-api.railway.app/api/health

# Test login
curl -X POST https://your-api.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@mathmaster.app","password":"admin123"}'
```

## Felsökning

### "Network Error" i appen
- Kontrollera att backend URL är korrekt
- Verifiera att backend körs med health endpoint
- Kolla att CORS är korrekt konfigurerat

### "Invalid credentials"
- Kör seed_database.py för att skapa användare
- Kontrollera att rätt databas används (DB_NAME)

### MongoDB connection failed
- Verifiera MONGO_URL
- Kontrollera Network Access i Atlas (0.0.0.0/0)
- Verifiera användarnamn/lösenord

## Support

- Emergent: support@emergent.sh
- MongoDB Atlas: https://docs.atlas.mongodb.com/
- Railway: https://docs.railway.app/
