from fastapi import FastAPI, APIRouter, HTTPException, Request
from fastapi.responses import HTMLResponse, JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from typing import List, Dict, Optional
from datetime import datetime, timezone
import random

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'mathmaster')]

# Create the main app
app = FastAPI(
    title="MathMaster Pro API",
    description="API for math training app",
    version="2.0.0"
)

# Store db in app state for access in routes
app.state.db = db

# ==================== UNIVERSAL LINKS ====================

# Apple App Site Association (iOS Universal Links)
APPLE_APP_SITE_ASSOCIATION = {
    "applinks": {
        "apps": [],
        "details": [
            {
                "appIDs": ["X49K463P2S.com.mathmaster.pro"],
                "paths": ["/challenge/*", "/group/*", "/invite/*"]
            }
        ]
    },
    "webcredentials": {
        "apps": ["X49K463P2S.com.mathmaster.pro"]
    }
}

# Android Asset Links
ASSET_LINKS = [
    {
        "relation": ["delegate_permission/common.handle_all_urls"],
        "target": {
            "namespace": "android_app",
            "package_name": "com.mathmaster.pro",
            "sha256_cert_fingerprints": ["SHA256_FINGERPRINT_HERE"]
        }
    }
]

@app.get("/.well-known/apple-app-site-association")
async def apple_app_site_association():
    return JSONResponse(content=APPLE_APP_SITE_ASSOCIATION)

@app.get("/apple-app-site-association")
async def apple_app_site_association_root():
    return JSONResponse(content=APPLE_APP_SITE_ASSOCIATION)

@app.get("/.well-known/assetlinks.json")
async def asset_links():
    return JSONResponse(content=ASSET_LINKS)

@app.get("/challenge/{challenge_id}", response_class=HTMLResponse)
async def challenge_redirect(challenge_id: str):
    """Redirect page for challenge deep links"""
    html = f'''<!DOCTYPE html>
<html lang="sv">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MathMaster Pro - Utmaning</title>
    <meta name="apple-itunes-app" content="app-id=YOUR_APP_ID, app-argument=mathmaster://challenge/{challenge_id}">
    <meta property="og:title" content="MathMaster Pro - Du har blivit utmanad!">
    <meta property="og:description" content="Acceptera utmaningen och tävla i matte!">
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            padding: 20px;
        }}
        .container {{ text-align: center; max-width: 400px; }}
        .icon {{ font-size: 80px; margin-bottom: 24px; }}
        h1 {{ font-size: 28px; margin-bottom: 12px; color: #4ecdc4; }}
        p {{ font-size: 16px; opacity: 0.8; margin-bottom: 32px; line-height: 1.5; }}
        .buttons {{ display: flex; flex-direction: column; gap: 12px; }}
        .btn {{
            display: flex; align-items: center; justify-content: center; gap: 10px;
            padding: 16px 24px; border-radius: 12px; text-decoration: none;
            font-weight: 600; font-size: 16px;
        }}
        .btn-ios {{ background: #007AFF; color: white; }}
        .btn-android {{ background: #34A853; color: white; }}
        .loading {{ margin-top: 24px; font-size: 14px; opacity: 0.6; }}
        .spinner {{
            display: inline-block; width: 16px; height: 16px;
            border: 2px solid rgba(255,255,255,0.3); border-top-color: white;
            border-radius: 50%; animation: spin 1s linear infinite;
            margin-right: 8px; vertical-align: middle;
        }}
        @keyframes spin {{ to {{ transform: rotate(360deg); }} }}
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">🏆</div>
        <h1>Du har blivit utmanad!</h1>
        <p>Ladda ner MathMaster Pro för att acceptera utmaningen och tävla i matte med dina vänner.</p>
        <div class="buttons">
            <a href="https://apps.apple.com/app/mathmaster-pro/id123456789" class="btn btn-ios" id="ios-btn">App Store</a>
            <a href="https://play.google.com/store/apps/details?id=com.mathmaster.pro" class="btn btn-android" id="android-btn">Google Play</a>
        </div>
        <p class="loading"><span class="spinner"></span>Försöker öppna appen...</p>
    </div>
    <script>
        const deepLink = 'mathmaster://challenge/{challenge_id}';
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const isAndroid = /Android/.test(navigator.userAgent);
        setTimeout(() => {{ window.location.href = deepLink; }}, 500);
        setTimeout(() => {{
            if (isIOS) window.location.href = 'https://apps.apple.com/app/mathmaster-pro/id123456789';
            else if (isAndroid) window.location.href = 'https://play.google.com/store/apps/details?id=com.mathmaster.pro';
        }}, 2500);
        if (isIOS) document.getElementById('android-btn').style.display = 'none';
        else if (isAndroid) document.getElementById('ios-btn').style.display = 'none';
    </script>
</body>
</html>'''
    return HTMLResponse(content=html)

# ==================== END UNIVERSAL LINKS ====================

# Import routes
from routes import auth_router, languages_router, games_router, groups_router, leaderboard_router, challenges_router
from routes.admin import router as admin_router

# Include routers
app.include_router(auth_router)
app.include_router(languages_router)
app.include_router(games_router)
app.include_router(groups_router)
app.include_router(leaderboard_router)
app.include_router(challenges_router)
app.include_router(admin_router)

# Legacy API router for backwards compatibility
legacy_router = APIRouter(prefix="/api")

# ==================== TRANSLATIONS DATA (Legacy support) ====================

TRANSLATIONS = {
    "app_title_part1": {
        "sv": "Matematik", "en": "Math", "ar": "ماث",
        "fi": "Matematiikka", "es": "Mate", "so": "Xisaab"
    },
    "app_title_part2": {
        "sv": "Mästaren Pro", "en": "Master Pro", "ar": "ماستر برو",
        "fi": "Mestari Pro", "es": "Maestro Pro", "so": "Sare Pro"
    },
    "app_title": {
        "sv": "MatematikMästaren Pro", "en": "MathMaster Pro", "ar": "ماث ماستر برو",
        "fi": "MatematiikkaMestari Pro", "es": "MateMaestro Pro", "so": "XisaabSare Pro"
    },
    "tagline": {
        "sv": "Bli trygg i matematik.", "en": "Become confident in math.",
        "ar": "كن واثقًا في الرياضيات.", "fi": "Tule varmaksi matematiikassa.",
        "es": "Siéntete seguro en matemáticas.", "so": "Ku kalsoonow xisaabta."
    },
    "select_operation": {
        "sv": "Välj räknesätt (ett eller flera)", "en": "Select operation (one or more)",
        "ar": "اختر العملية (واحدة أو أكثر)", "fi": "Valitse laskutoimitus (yksi tai useampi)",
        "es": "Selecciona operación (una o más)", "so": "Dooro hawlgal (mid ama ka badan)"
    },
    "addition": {
        "sv": "Addition", "en": "Addition", "ar": "الجمع",
        "fi": "Yhteenlasku", "es": "Suma", "so": "Isku-dar"
    },
    "subtraction": {
        "sv": "Subtraktion", "en": "Subtraction", "ar": "الطرح",
        "fi": "Vähennyslasku", "es": "Resta", "so": "Ka-jar"
    },
    "multiplication": {
        "sv": "Multiplikation", "en": "Multiplication", "ar": "الضرب",
        "fi": "Kertolasku", "es": "Multiplicación", "so": "Isku-dhufasho"
    },
    "division": {
        "sv": "Division", "en": "Division", "ar": "القسمة",
        "fi": "Jakolasku", "es": "División", "so": "Qeybinta"
    },
    "fractions": {
        "sv": "Bråk", "en": "Fractions", "ar": "الكسور",
        "fi": "Murtoluvut", "es": "Fracciones", "so": "Jabjibin"
    },
    "equations": {
        "sv": "Ekvationer", "en": "Equations", "ar": "المعادلات",
        "fi": "Yhtälöt", "es": "Ecuaciones", "so": "Isleynta"
    },
    "geometry": {
        "sv": "Geometri", "en": "Geometry", "ar": "الهندسة",
        "fi": "Geometria", "es": "Geometría", "so": "Joomitiri"
    },
    "percentage": {
        "sv": "Procent", "en": "Percentage", "ar": "النسبة المئوية",
        "fi": "Prosentti", "es": "Porcentaje", "so": "Boqolkiiba"
    },
    "units": {
        "sv": "Enheter", "en": "Units", "ar": "الوحدات",
        "fi": "Yksiköt", "es": "Unidades", "so": "Unugyada"
    },
    "rounding": {
        "sv": "Avrundning", "en": "Rounding", "ar": "التقريب",
        "fi": "Pyöristys", "es": "Redondeo", "so": "Wareegga"
    },
    "angles": {
        "sv": "Vinklar", "en": "Angles", "ar": "الزوايا",
        "fi": "Kulmat", "es": "Ángulos", "so": "Xagalaha"
    },
    "probability": {
        "sv": "Sannolikhet", "en": "Probability", "ar": "الاحتمالية",
        "fi": "Todennäköisyys", "es": "Probabilidad", "so": "Suurtagalnimo"
    },
    "diagrams": {
        "sv": "Diagram", "en": "Charts", "ar": "الرسوم البيانية",
        "fi": "Kaaviot", "es": "Gráficos", "so": "Jaantuska"
    },
    "difficulty": {
        "sv": "Svårighetsgrad", "en": "Difficulty", "ar": "مستوى الصعوبة",
        "fi": "Vaikeustaso", "es": "Dificultad", "so": "Heerka adkaanta"
    },
    "easy": {
        "sv": "Lätt", "en": "Easy", "ar": "سهل",
        "fi": "Helppo", "es": "Fácil", "so": "Fudud"
    },
    "easy_desc": {
        "sv": "Tal 1-10", "en": "Numbers 1-10", "ar": "أرقام 1-10",
        "fi": "Luvut 1-10", "es": "Números 1-10", "so": "Tirooyinka 1-10"
    },
    "medium": {
        "sv": "Medel", "en": "Medium", "ar": "متوسط",
        "fi": "Keskitaso", "es": "Medio", "so": "Dhexe"
    },
    "medium_desc": {
        "sv": "Tal 10-50", "en": "Numbers 10-50", "ar": "أرقام 10-50",
        "fi": "Luvut 10-50", "es": "Números 10-50", "so": "Tirooyinka 10-50"
    },
    "hard": {
        "sv": "Svår", "en": "Hard", "ar": "صعب",
        "fi": "Vaikea", "es": "Difícil", "so": "Adag"
    },
    "hard_desc": {
        "sv": "Tal 50-100", "en": "Numbers 50-100", "ar": "أرقام 50-100",
        "fi": "Luvut 50-100", "es": "Números 50-100", "so": "Tirooyinka 50-100"
    },
    "question_count": {
        "sv": "Antal frågor", "en": "Number of questions", "ar": "عدد الأسئلة",
        "fi": "Kysymysten määrä", "es": "Número de preguntas", "so": "Tirada su'aalaha"
    },
    "start_game": {
        "sv": "Starta spelet", "en": "Start game", "ar": "ابدأ اللعبة",
        "fi": "Aloita peli", "es": "Iniciar juego", "so": "Bilow ciyaarta"
    },
    "submit": {
        "sv": "Svara", "en": "Submit", "ar": "إرسال",
        "fi": "Lähetä", "es": "Enviar", "so": "Dir"
    },
    "results": {
        "sv": "Resultat", "en": "Results", "ar": "النتائج",
        "fi": "Tulokset", "es": "Resultados", "so": "Natiijooyinka"
    },
    "score": {
        "sv": "Poäng", "en": "Score", "ar": "النقاط",
        "fi": "Pisteet", "es": "Puntuación", "so": "Dhibcaha"
    },
    "correct": {
        "sv": "Rätt", "en": "Correct", "ar": "صحيح",
        "fi": "Oikein", "es": "Correcto", "so": "Sax"
    },
    "incorrect": {
        "sv": "Fel", "en": "Incorrect", "ar": "خطأ",
        "fi": "Väärin", "es": "Incorrecto", "so": "Khalad"
    },
    "time": {
        "sv": "Tid", "en": "Time", "ar": "الوقت",
        "fi": "Aika", "es": "Tiempo", "so": "Waqtiga"
    },
    "play_again": {
        "sv": "Spela igen", "en": "Play again", "ar": "العب مرة أخرى",
        "fi": "Pelaa uudelleen", "es": "Jugar de nuevo", "so": "Ciyaar mar kale"
    },
    "back_to_menu": {
        "sv": "Tillbaka till menyn", "en": "Back to menu", "ar": "العودة إلى القائمة",
        "fi": "Takaisin valikkoon", "es": "Volver al menú", "so": "Ku noqo liiska"
    },
    "question": {
        "sv": "Fråga", "en": "Question", "ar": "سؤال",
        "fi": "Kysymys", "es": "Pregunta", "so": "Su'aal"
    },
    "of": {
        "sv": "av", "en": "of", "ar": "من",
        "fi": "/", "es": "de", "so": "ka mid ah"
    },
    "great_job": {
        "sv": "Bra jobbat!", "en": "Great job!", "ar": "عمل رائع!",
        "fi": "Hienoa!", "es": "¡Buen trabajo!", "so": "Shaqo wanaagsan!"
    },
    "keep_trying": {
        "sv": "Fortsätt försöka!", "en": "Keep trying!", "ar": "استمر في المحاولة!",
        "fi": "Jatka yrittämistä!", "es": "¡Sigue intentando!", "so": "Sii wad isku dayga!"
    },
    "perfect_score": {
        "sv": "Perfekt resultat!", "en": "Perfect score!", "ar": "نتيجة مثالية!",
        "fi": "Täydellinen tulos!", "es": "¡Puntuación perfecta!", "so": "Natiijo qumman!"
    },
    "select_one_operation": {
        "sv": "Välj minst ett räknesätt", "en": "Select at least one operation",
        "ar": "اختر عملية واحدة على الأقل", "fi": "Valitse vähintään yksi laskutoimitus",
        "es": "Selecciona al menos una operación", "so": "Dooro ugu yaraan hal hawlgal"
    },
    "login": {
        "sv": "Logga in", "en": "Login", "ar": "تسجيل الدخول",
        "fi": "Kirjaudu", "es": "Iniciar sesión", "so": "Gal"
    },
    "register": {
        "sv": "Registrera", "en": "Register", "ar": "تسجيل",
        "fi": "Rekisteröidy", "es": "Registrarse", "so": "Isdiiwaangeli"
    },
    "logout": {
        "sv": "Logga ut", "en": "Logout", "ar": "تسجيل الخروج",
        "fi": "Kirjaudu ulos", "es": "Cerrar sesión", "so": "Ka bax"
    },
    "email": {
        "sv": "E-post", "en": "Email", "ar": "البريد الإلكتروني",
        "fi": "Sähköposti", "es": "Correo electrónico", "so": "Iimaylka"
    },
    "password": {
        "sv": "Lösenord", "en": "Password", "ar": "كلمة المرور",
        "fi": "Salasana", "es": "Contraseña", "so": "Erayga sirta ah"
    },
    "display_name": {
        "sv": "Visningsnamn", "en": "Display name", "ar": "اسم العرض",
        "fi": "Näyttönimi", "es": "Nombre para mostrar", "so": "Magaca muuqda"
    },
    "forgot_password": {
        "sv": "Glömt lösenord?", "en": "Forgot password?", "ar": "نسيت كلمة المرور؟",
        "fi": "Unohditko salasanan?", "es": "¿Olvidaste la contraseña?", "so": "Ma ilowday erayga sirta ah?"
    },
    "continue_with_google": {
        "sv": "Fortsätt med Google", "en": "Continue with Google", "ar": "المتابعة مع Google",
        "fi": "Jatka Googlella", "es": "Continuar con Google", "so": "Ku sii wad Google"
    },
    "or": {
        "sv": "eller", "en": "or", "ar": "أو",
        "fi": "tai", "es": "o", "so": "ama"
    },
    "profile": {
        "sv": "Profil", "en": "Profile", "ar": "الملف الشخصي",
        "fi": "Profiili", "es": "Perfil", "so": "Astaanta"
    },
    "settings": {
        "sv": "Inställningar", "en": "Settings", "ar": "الإعدادات",
        "fi": "Asetukset", "es": "Configuración", "so": "Dejinta"
    },
    "history": {
        "sv": "Historik", "en": "History", "ar": "السجل",
        "fi": "Historia", "es": "Historial", "so": "Taariikhda"
    },
    "groups": {
        "sv": "Grupper", "en": "Groups", "ar": "المجموعات",
        "fi": "Ryhmät", "es": "Grupos", "so": "Kooxaha"
    },
    "leaderboard": {
        "sv": "Topplista", "en": "Leaderboard", "ar": "لوحة المتصدرين",
        "fi": "Tulostaulukko", "es": "Clasificación", "so": "Liiska hogaamiyaha"
    },
    "achievements": {
        "sv": "Prestationer", "en": "Achievements", "ar": "الإنجازات",
        "fi": "Saavutukset", "es": "Logros", "so": "Guulaha"
    },
    "challenges": {
        "sv": "Utmaningar", "en": "Challenges", "ar": "التحديات",
        "fi": "Haasteet", "es": "Desafíos", "so": "Caqabadaha"
    },
    "pro_required": {
        "sv": "Pro-version krävs", "en": "Pro version required", "ar": "مطلوب النسخة الاحترافية",
        "fi": "Pro-versio vaaditaan", "es": "Se requiere versión Pro", "so": "Nooca Pro ayaa loo baahan yahay"
    },
    "upgrade_to_pro": {
        "sv": "Uppgradera till Pro", "en": "Upgrade to Pro", "ar": "الترقية إلى Pro",
        "fi": "Päivitä Pro-versioon", "es": "Actualizar a Pro", "so": "U kor u qaad Pro"
    },
    "login_subtitle": {
        "sv": "Välkommen tillbaka!", "en": "Welcome back!", "ar": "مرحبًا بعودتك!",
        "fi": "Tervetuloa takaisin!", "es": "¡Bienvenido de nuevo!", "so": "Ku soo dhawoow!"
    },
    "register_subtitle": {
        "sv": "Skapa ditt konto", "en": "Create your account", "ar": "أنشئ حسابك",
        "fi": "Luo tilisi", "es": "Crea tu cuenta", "so": "Samee akoonkaaga"
    },
    "email_placeholder": {
        "sv": "Ange din e-post", "en": "Enter your email", "ar": "أدخل بريدك الإلكتروني",
        "fi": "Syötä sähköpostisi", "es": "Introduce tu correo", "so": "Geli iimaylkaaga"
    },
    "password_placeholder": {
        "sv": "Ange ditt lösenord", "en": "Enter your password", "ar": "أدخل كلمة المرور",
        "fi": "Syötä salasanasi", "es": "Introduce tu contraseña", "so": "Geli eraygaaga sirta ah"
    },
    "display_name_placeholder": {
        "sv": "Ange ditt namn", "en": "Enter your name", "ar": "أدخل اسمك",
        "fi": "Syötä nimesi", "es": "Introduce tu nombre", "so": "Geli magacaaga"
    },
    "confirm_password": {
        "sv": "Bekräfta lösenord", "en": "Confirm password", "ar": "تأكيد كلمة المرور",
        "fi": "Vahvista salasana", "es": "Confirmar contraseña", "so": "Xaqiiji erayga sirta ah"
    },
    "confirm_password_placeholder": {
        "sv": "Bekräfta ditt lösenord", "en": "Confirm your password", "ar": "أكد كلمة المرور",
        "fi": "Vahvista salasanasi", "es": "Confirma tu contraseña", "so": "Xaqiiji eraygaaga sirta ah"
    },
    "no_account": {
        "sv": "Har du inget konto?", "en": "Don't have an account?", "ar": "ليس لديك حساب؟",
        "fi": "Eikö sinulla ole tiliä?", "es": "¿No tienes cuenta?", "so": "Ma haysatid akoon?"
    },
    "have_account": {
        "sv": "Har du redan ett konto?", "en": "Already have an account?", "ar": "لديك حساب بالفعل؟",
        "fi": "Onko sinulla jo tili?", "es": "¿Ya tienes cuenta?", "so": "Ma haysataa akoon?"
    },
    "enter_email_password": {
        "sv": "Ange e-post och lösenord", "en": "Please enter email and password", "ar": "الرجاء إدخال البريد وكلمة المرور",
        "fi": "Syötä sähköposti ja salasana", "es": "Introduce email y contraseña", "so": "Geli iimaylka iyo erayga sirta ah"
    },
    "fill_all_fields": {
        "sv": "Fyll i alla fält", "en": "Please fill in all fields", "ar": "الرجاء ملء جميع الحقول",
        "fi": "Täytä kaikki kentät", "es": "Por favor, rellena todos los campos", "so": "Buuxi dhammaan meelaha"
    },
    "passwords_not_match": {
        "sv": "Lösenorden matchar inte", "en": "Passwords do not match", "ar": "كلمات المرور غير متطابقة",
        "fi": "Salasanat eivät täsmää", "es": "Las contraseñas no coinciden", "so": "Erayada sirta ah ma iswaafaqaan"
    },
    "password_too_short": {
        "sv": "Lösenordet måste vara minst 6 tecken", "en": "Password must be at least 6 characters", "ar": "يجب أن تكون كلمة المرور 6 أحرف على الأقل",
        "fi": "Salasanan tulee olla vähintään 6 merkkiä", "es": "La contraseña debe tener al menos 6 caracteres", "so": "Erayga sirta ah waa inuu ahaadaa ugu yaraan 6 xaraf"
    },
    "cancel": {
        "sv": "Avbryt", "en": "Cancel", "ar": "إلغاء",
        "fi": "Peruuta", "es": "Cancelar", "so": "Jooji"
    },
    "logout_confirm": {
        "sv": "Är du säker på att du vill logga ut?", "en": "Are you sure you want to logout?", "ar": "هل أنت متأكد من تسجيل الخروج؟",
        "fi": "Haluatko varmasti kirjautua ulos?", "es": "¿Seguro que quieres cerrar sesión?", "so": "Ma hubtaa inaad rabto inaad ka baxdo?"
    },
    "statistics": {
        "sv": "Statistik", "en": "Statistics", "ar": "الإحصائيات",
        "fi": "Tilastot", "es": "Estadísticas", "so": "Tirakoobka"
    },
    "games_played": {
        "sv": "Spel spelade", "en": "Games played", "ar": "الألعاب التي لعبتها",
        "fi": "Pelatut pelit", "es": "Juegos jugados", "so": "Ciyaarooyinka la ciyaaray"
    },
    "correct_answers": {
        "sv": "Rätta svar", "en": "Correct answers", "ar": "الإجابات الصحيحة",
        "fi": "Oikeat vastaukset", "es": "Respuestas correctas", "so": "Jawaabaha saxda ah"
    },
    "accuracy": {
        "sv": "Träffsäkerhet", "en": "Accuracy", "ar": "الدقة",
        "fi": "Tarkkuus", "es": "Precisión", "so": "Saxnaanta"
    },
    "best_streak": {
        "sv": "Bästa svit", "en": "Best streak", "ar": "أفضل سلسلة",
        "fi": "Paras putki", "es": "Mejor racha", "so": "Isku xigxigga ugu fiican"
    },
    "pro_features_desc": {
        "sv": "Lås upp alla matematikkategorier", "en": "Unlock all math categories", "ar": "افتح جميع فئات الرياضيات",
        "fi": "Avaa kaikki matematiikkakategoriat", "es": "Desbloquea todas las categorías", "so": "Fur dhammaan qaybaha xisaabta"
    },
    # Achievement translations
    "ach_first_game": {
        "sv": "Första spelet", "en": "First Game", "ar": "اللعبة الأولى",
        "fi": "Ensimmäinen peli", "es": "Primer juego", "so": "Ciyaarta koowaad"
    },
    "ach_first_game_desc": {
        "sv": "Spela ditt första spel", "en": "Play your first game", "ar": "العب لعبتك الأولى",
        "fi": "Pelaa ensimmäinen pelisi", "es": "Juega tu primer juego", "so": "Ciyaar ciyaartaada koowaad"
    },
    "ach_ten_games": {
        "sv": "Tio spel", "en": "Ten Games", "ar": "عشر ألعاب",
        "fi": "Kymmenen peliä", "es": "Diez juegos", "so": "Toban ciyaarood"
    },
    "ach_ten_games_desc": {
        "sv": "Spela 10 spel", "en": "Play 10 games", "ar": "العب 10 ألعاب",
        "fi": "Pelaa 10 peliä", "es": "Juega 10 juegos", "so": "Ciyaar 10 ciyaarood"
    },
    "ach_hundred_games": {
        "sv": "Hundra spel", "en": "Hundred Games", "ar": "مئة لعبة",
        "fi": "Sata peliä", "es": "Cien juegos", "so": "Boqol ciyaarood"
    },
    "ach_hundred_games_desc": {
        "sv": "Spela 100 spel", "en": "Play 100 games", "ar": "العب 100 لعبة",
        "fi": "Pelaa 100 peliä", "es": "Juega 100 juegos", "so": "Ciyaar 100 ciyaarood"
    },
    "ach_perfect_game": {
        "sv": "Perfekt spel", "en": "Perfect Game", "ar": "لعبة مثالية",
        "fi": "Täydellinen peli", "es": "Juego perfecto", "so": "Ciyaar qumman"
    },
    "ach_perfect_game_desc": {
        "sv": "Få 100% rätt i ett spel", "en": "Get 100% correct in a game", "ar": "احصل على 100% صحيح في لعبة",
        "fi": "Saa 100% oikein pelissä", "es": "Obtén 100% correcto en un juego", "so": "Hel 100% sax ciyaarta"
    },
    "ach_streak_5": {
        "sv": "5 i rad", "en": "5 in a Row", "ar": "5 على التوالي",
        "fi": "5 peräkkäin", "es": "5 seguidos", "so": "5 isku xiga"
    },
    "ach_streak_5_desc": {
        "sv": "Svara rätt på 5 frågor i rad", "en": "Answer 5 questions correctly in a row", "ar": "أجب على 5 أسئلة صحيحة على التوالي",
        "fi": "Vastaa 5 kysymykseen oikein peräkkäin", "es": "Responde 5 preguntas correctamente seguidas", "so": "Ka jawaab 5 su'aalood si sax ah isku xigta"
    },
    "ach_streak_10": {
        "sv": "10 i rad", "en": "10 in a Row", "ar": "10 على التوالي",
        "fi": "10 peräkkäin", "es": "10 seguidos", "so": "10 isku xiga"
    },
    "ach_streak_10_desc": {
        "sv": "Svara rätt på 10 frågor i rad", "en": "Answer 10 questions correctly in a row", "ar": "أجب على 10 أسئلة صحيحة على التوالي",
        "fi": "Vastaa 10 kysymykseen oikein peräkkäin", "es": "Responde 10 preguntas correctamente seguidas", "so": "Ka jawaab 10 su'aalood si sax ah isku xigta"
    },
    "ach_math_master": {
        "sv": "Matematikmästare", "en": "Math Master", "ar": "سيد الرياضيات",
        "fi": "Matematiikan mestari", "es": "Maestro de matemáticas", "so": "Sayidka xisaabta"
    },
    "ach_math_master_desc": {
        "sv": "Spela alla 13 kategorier", "en": "Play all 13 categories", "ar": "العب جميع الفئات الـ 13",
        "fi": "Pelaa kaikki 13 kategoriaa", "es": "Juega todas las 13 categorías", "so": "Ciyaar dhammaan 13 qaybood"
    },
    "earned": {
        "sv": "Uppnått", "en": "Earned", "ar": "تم الحصول عليها",
        "fi": "Ansaittu", "es": "Obtenido", "so": "La helay"
    },
    "not_earned": {
        "sv": "Inte uppnått", "en": "Not earned", "ar": "لم يتم الحصول عليها",
        "fi": "Ei ansaittu", "es": "No obtenido", "so": "Lama helin"
    },
    "points": {
        "sv": "poäng", "en": "points", "ar": "نقاط",
        "fi": "pistettä", "es": "puntos", "so": "dhibco"
    },
}


@legacy_router.get("/")
async def root():
    return {"message": "MathMaster Pro API", "version": "2.0.0"}


@legacy_router.get("/translations")
async def get_all_translations():
    """Get all translations (legacy endpoint)"""
    return TRANSLATIONS


@legacy_router.get("/translations/{language}")
async def get_translations_by_language(language: str):
    """Get translations for a specific language (legacy endpoint)"""
    # First try to get from database
    translations = await db.translations.find(
        {"language_code": language},
        {"_id": 0}
    ).to_list(5000)
    
    if translations:
        result = {}
        for trans in translations:
            result[trans["key"]] = trans["text"]
        return result
    
    # Fallback to hardcoded translations
    result = {}
    for key, trans_dict in TRANSLATIONS.items():
        if language in trans_dict:
            result[key] = trans_dict[language]
        elif "en" in trans_dict:
            result[key] = trans_dict["en"]
        else:
            result[key] = key
    return result


@legacy_router.get("/languages")
async def get_languages():
    """Get list of supported languages (legacy endpoint)"""
    return {
        "languages": [
            {"code": "sv", "name": "Svenska", "native": "Svenska"},
            {"code": "en", "name": "English", "native": "English"},
            {"code": "ar", "name": "Arabic", "native": "العربية", "rtl": True},
            {"code": "fi", "name": "Finnish", "native": "Suomi"},
            {"code": "es", "name": "Spanish", "native": "Español"},
            {"code": "so", "name": "Somali", "native": "Soomaali"}
        ]
    }


# Legacy question generation for backwards compatibility
from pydantic import BaseModel
from utils.questions import generate_questions


class LegacyGenerateRequest(BaseModel):
    operations: List[str]
    difficulty: str = "easy"
    count: int = 15
    language: str = "sv"


@legacy_router.post("/generate-questions")
async def legacy_generate_questions(request: Request, body: LegacyGenerateRequest):
    """Generate questions (legacy endpoint)"""
    # Get language from body or Accept-Language header
    language = body.language
    if language == "sv":
        accept_lang = request.headers.get("Accept-Language", "sv")
        lang_code = accept_lang.split(",")[0].split("-")[0].lower()
        if lang_code in ["sv", "en", "ar", "fi", "es", "so"]:
            language = lang_code
    
    questions = generate_questions(
        category=body.operations[0] if body.operations else "addition",
        difficulty=body.difficulty,
        count=body.count,
        operations=body.operations,
        language=language
    )
    return {"questions": questions}


# Include legacy router
app.include_router(legacy_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def startup_event():
    """Initialize database with default data"""
    logger.info("Starting Matematikmästaren API...")
    
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("user_id", unique=True)
    await db.user_sessions.create_index("session_token")
    await db.user_sessions.create_index("user_id")
    await db.translations.create_index([("key", 1), ("language_code", 1)], unique=True)
    await db.game_sessions.create_index("user_id")
    await db.game_sessions.create_index("created_at")
    
    # Initialize default superadmin if not exists
    admin_exists = await db.users.find_one({"role": "superadmin"})
    if not admin_exists:
        from utils.auth import hash_password
        import uuid
        
        admin_user = {
            "user_id": f"user_{uuid.uuid4().hex[:12]}",
            "email": "admin@mathmaster.app",
            "display_name": "Super Admin",
            "password_hash": hash_password("admin123"),  # Change in production!
            "role": "superadmin",
            "language": "sv",
            "is_pro": True,
            "auth_provider": "email",
            "statistics": {
                "games_played": 0,
                "total_correct": 0,
                "total_questions": 0,
                "best_streak": 0,
                "current_streak": 0,
                "total_time_played": 0.0,
                "category_stats": {}
            },
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        await db.users.insert_one(admin_user)
        logger.info("Created default superadmin user: admin@mathmaster.app")
    
    # Initialize translations if empty
    trans_count = await db.translations.count_documents({})
    if trans_count == 0:
        logger.info("Initializing default translations...")
        translations_to_insert = []
        for key, lang_dict in TRANSLATIONS.items():
            for lang_code, text in lang_dict.items():
                translations_to_insert.append({
                    "key": key,
                    "language_code": lang_code,
                    "text": text,
                    "category": "ui",
                    "updated_at": datetime.now(timezone.utc)
                })
        
        if translations_to_insert:
            await db.translations.insert_many(translations_to_insert)
            logger.info(f"Inserted {len(translations_to_insert)} translations")
    
    logger.info("Matematikmästaren API started successfully!")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()



# Health check endpoint for deployment platforms
@app.get("/api/health")
async def health_check():
    """Health check endpoint for monitoring and deployment platforms"""
    try:
        # Test database connection
        await db.command('ping')
        return {
            "status": "healthy",
            "database": "connected",
            "version": "2.0.0"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e)
        }
