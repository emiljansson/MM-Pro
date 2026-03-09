# MathMaster Pro - Universal Links Server

Denna server hanterar Universal Links för MathMaster Pro-appen.

## Endpoints

- `/.well-known/apple-app-site-association` - iOS Universal Links
- `/.well-known/assetlinks.json` - Android App Links
- `/challenge/:id` - Challenge redirect-sida
- `/` - Hemsida med app-länkar

## Deploy till Railway

1. Skapa nytt projekt på Railway
2. Koppla till detta repo (eller ladda upp filerna)
3. Lägg till custom domain: `pro.mathematicsmaster.app`
4. Deploy!

## Efter App Store publicering

Uppdatera App Store ID i `server.js`:
- Sök efter `id123456789` och ersätt med riktigt ID
