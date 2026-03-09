# MathMaster Pro - Universal Links Setup

## Översikt
Detta dokument beskriver hur du konfigurerar mathematicsmaster.app för att hantera deep links.

## Filer som behöver laddas upp till mathematicsmaster.app

### 1. Apple App Site Association (iOS)
**Fil:** `/.well-known/apple-app-site-association`
**Content-Type:** `application/json` (INGEN .json ändelse!)

```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appIDs": ["TEAM_ID.com.mathmaster.pro"],
        "paths": ["/challenge/*", "/group/*", "/invite/*"]
      }
    ]
  },
  "webcredentials": {
    "apps": ["TEAM_ID.com.mathmaster.pro"]
  }
}
```

**⚠️ VIKTIGT:** Ersätt `TEAM_ID` med ditt Apple Developer Team ID (hittas i Apple Developer Portal).

### 2. Android Asset Links (Android)
**Fil:** `/.well-known/assetlinks.json`

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.mathmaster.pro",
      "sha256_cert_fingerprints": ["SHA256_FINGERPRINT"]
    }
  }
]
```

**⚠️ VIKTIGT:** Ersätt `SHA256_FINGERPRINT` med din app-signaturs fingerprint.
Hämta den med: `keytool -list -v -keystore your-keystore.jks`

### 3. Redirect-sida för webbläsare
**Fil:** `/challenge/index.html` (eller konfigureras via routing)

Kopiera innehållet från `frontend/public/challenge.html`

---

## Server-konfiguration

### Nginx exempel:
```nginx
server {
    listen 443 ssl;
    server_name mathematicsmaster.app www.mathematicsmaster.app;
    
    # SSL-certifikat
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # Apple App Site Association - måste serveras utan .json
    location /.well-known/apple-app-site-association {
        default_type application/json;
        alias /var/www/mathmaster/.well-known/apple-app-site-association;
    }
    
    # Android Asset Links
    location /.well-known/assetlinks.json {
        default_type application/json;
    }
    
    # Challenge redirect-sida
    location /challenge/ {
        try_files $uri /challenge.html;
    }
    
    root /var/www/mathmaster;
}
```

### Vercel/Netlify:
Lägg till en `_redirects` eller `vercel.json`:

**vercel.json:**
```json
{
  "rewrites": [
    { "source": "/challenge/:id", "destination": "/challenge.html" }
  ],
  "headers": [
    {
      "source": "/.well-known/apple-app-site-association",
      "headers": [
        { "key": "Content-Type", "value": "application/json" }
      ]
    }
  ]
}
```

---

## Hitta ditt Apple Team ID

1. Logga in på https://developer.apple.com
2. Gå till Account → Membership
3. Ditt Team ID visas där (t.ex. "ABC123XYZ")

## Hitta Android SHA256 Fingerprint

```bash
# För debug-nyckel:
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android

# För release-nyckel:
keytool -list -v -keystore your-release-key.keystore
```

---

## Testa Universal Links

### iOS:
1. Bygg appen med EAS Build
2. Installera på en riktig enhet
3. Skicka en länk via SMS: `https://mathematicsmaster.app/challenge/test123`
4. Klicka på länken - appen ska öppnas

### Android:
1. Bygg appen med EAS Build
2. Installera på en riktig enhet
3. Öppna länken: `https://mathematicsmaster.app/challenge/test123`
4. Android ska fråga om du vill öppna i appen

### Debug:
- iOS: Använd Apples validator: https://search.developer.apple.com/appsearch-validation-tool/
- Android: `adb shell am start -W -a android.intent.action.VIEW -d "https://mathematicsmaster.app/challenge/test123"`

---

## Flödet

```
SMS med länk
    ↓
https://mathematicsmaster.app/challenge/chal_abc123
    ↓
┌─────────────────────────────────────┐
│  App installerad?                    │
│  ├── JA → Öppna appen direkt        │
│  │         → /challenge/[id].tsx     │
│  │         → Visa accept-skärm       │
│  │                                   │
│  └── NEJ → Visa challenge.html      │
│            → Redirect till App Store │
│            → Efter installation,     │
│              öppna appen med länken  │
└─────────────────────────────────────┘
```

## App Store IDs (uppdatera efter publicering)

- **iOS App Store ID:** `id123456789` → Ersätt med riktigt ID
- **Google Play ID:** `com.mathmaster.pro` ✓

---

## Checklist

- [ ] Köp/konfigurera domänen mathematicsmaster.app
- [ ] Ladda upp `.well-known/apple-app-site-association`
- [ ] Ladda upp `.well-known/assetlinks.json`
- [ ] Ladda upp redirect-sidan `challenge.html`
- [ ] Ersätt TEAM_ID med ditt Apple Team ID
- [ ] Ersätt SHA256_FINGERPRINT med din Android-signatur
- [ ] Testa på iOS-enhet
- [ ] Testa på Android-enhet
- [ ] Uppdatera App Store ID efter publicering
