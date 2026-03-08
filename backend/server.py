from fastapi import FastAPI, APIRouter, HTTPException, Request
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
    title="Matematikmästaren API",
    description="API för matematikträning",
    version="2.0.0"
)

# Store db in app state for access in routes
app.state.db = db

# Import routes
from routes import auth_router, languages_router, games_router, groups_router, leaderboard_router

# Include routers
app.include_router(auth_router)
app.include_router(languages_router)
app.include_router(games_router)
app.include_router(groups_router)
app.include_router(leaderboard_router)

# Legacy API router for backwards compatibility
legacy_router = APIRouter(prefix="/api")

# ==================== TRANSLATIONS DATA (Legacy support) ====================

TRANSLATIONS = {
    "app_title_part1": {
        "sv": "Matematik", "en": "Math", "ar": "بطل",
        "fi": "Matikka", "es": "Maestro de", "so": "Xirfadlaha"
    },
    "app_title_part2": {
        "sv": "Mästaren", "en": "Master", "ar": "الرياضيات",
        "fi": "mestari", "es": "Matemáticas", "so": "Xisaabta"
    },
    "app_title": {
        "sv": "MatematikMästaren", "en": "MathMaster", "ar": "بطل الرياضيات",
        "fi": "Matikkamestari", "es": "Maestro de Matemáticas", "so": "Xirfadlaha Xisaabta"
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
}


@legacy_router.get("/")
async def root():
    return {"message": "Matematikmästaren API", "version": "2.0.0"}


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


@legacy_router.post("/generate-questions")
async def legacy_generate_questions(request: LegacyGenerateRequest):
    """Generate questions (legacy endpoint)"""
    questions = generate_questions(
        category=request.operations[0] if request.operations else "addition",
        difficulty=request.difficulty,
        count=request.count,
        operations=request.operations
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
