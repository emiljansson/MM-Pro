from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
import uuid
from datetime import datetime
import random

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ==================== MODELS ====================

class Translation(BaseModel):
    key: str
    translations: Dict[str, str]  # language_code -> text

class GameSession(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    operations: List[str]
    difficulty: str
    question_count: int
    score: int
    correct_answers: int
    total_time: float
    created_at: datetime = Field(default_factory=datetime.utcnow)
    language: str = "sv"

class GameSessionCreate(BaseModel):
    operations: List[str]
    difficulty: str
    question_count: int
    score: int
    correct_answers: int
    total_time: float
    language: str = "sv"

class MathQuestion(BaseModel):
    num1: int
    num2: int
    operation: str
    correct_answer: float
    display: str

# ==================== TRANSLATIONS DATA ====================

TRANSLATIONS = {
    # App title and tagline
    "app_title_part1": {
        "sv": "Matematik",
        "en": "Math",
        "ar": "بطل",
        "fi": "Matikka",
        "es": "Maestro de",
        "so": "Xirfadlaha"
    },
    "app_title_part2": {
        "sv": "Mästaren",
        "en": "Master",
        "ar": "الرياضيات",
        "fi": "mestari",
        "es": "Matemáticas",
        "so": "Xisaabta"
    },
    "app_title": {
        "sv": "MatematikMästaren",
        "en": "MathMaster",
        "ar": "بطل الرياضيات",
        "fi": "Matikkamestari",
        "es": "Maestro de Matemáticas",
        "so": "Xirfadlaha Xisaabta"
    },
    "tagline": {
        "sv": "Bli trygg i matematik.",
        "en": "Become confident in math.",
        "ar": "كن واثقًا في الرياضيات.",
        "fi": "Tule varmaksi matematiikassa.",
        "es": "Siéntete seguro en matemáticas.",
        "so": "Ku kalsoonow xisaabta."
    },
    
    # Operation labels
    "select_operation": {
        "sv": "Välj räknesätt (ett eller flera)",
        "en": "Select operation (one or more)",
        "ar": "اختر العملية (واحدة أو أكثر)",
        "fi": "Valitse laskutoimitus (yksi tai useampi)",
        "es": "Selecciona operación (una o más)",
        "so": "Dooro hawlgal (mid ama ka badan)"
    },
    "addition": {
        "sv": "Addition",
        "en": "Addition",
        "ar": "الجمع",
        "fi": "Yhteenlasku",
        "es": "Suma",
        "so": "Isku-dar"
    },
    "subtraction": {
        "sv": "Subtraktion",
        "en": "Subtraction",
        "ar": "الطرح",
        "fi": "Vähennyslasku",
        "es": "Resta",
        "so": "Ka-jar"
    },
    "multiplication": {
        "sv": "Multiplikation",
        "en": "Multiplication",
        "ar": "الضرب",
        "fi": "Kertolasku",
        "es": "Multiplicación",
        "so": "Isku-dhufasho"
    },
    "division": {
        "sv": "Division",
        "en": "Division",
        "ar": "القسمة",
        "fi": "Jakolasku",
        "es": "División",
        "so": "Qeybinta"
    },
    
    # Difficulty labels
    "difficulty": {
        "sv": "Svårighetsgrad",
        "en": "Difficulty",
        "ar": "مستوى الصعوبة",
        "fi": "Vaikeustaso",
        "es": "Dificultad",
        "so": "Heerka adkaanta"
    },
    "easy": {
        "sv": "Lätt",
        "en": "Easy",
        "ar": "سهل",
        "fi": "Helppo",
        "es": "Fácil",
        "so": "Fudud"
    },
    "easy_desc": {
        "sv": "Tal 1-10",
        "en": "Numbers 1-10",
        "ar": "أرقام 1-10",
        "fi": "Luvut 1-10",
        "es": "Números 1-10",
        "so": "Tirooyinka 1-10"
    },
    "medium": {
        "sv": "Medel",
        "en": "Medium",
        "ar": "متوسط",
        "fi": "Keskitaso",
        "es": "Medio",
        "so": "Dhexe"
    },
    "medium_desc": {
        "sv": "Tal 10-50",
        "en": "Numbers 10-50",
        "ar": "أرقام 10-50",
        "fi": "Luvut 10-50",
        "es": "Números 10-50",
        "so": "Tirooyinka 10-50"
    },
    "hard": {
        "sv": "Svår",
        "en": "Hard",
        "ar": "صعب",
        "fi": "Vaikea",
        "es": "Difícil",
        "so": "Adag"
    },
    "hard_desc": {
        "sv": "Tal 50-100",
        "en": "Numbers 50-100",
        "ar": "أرقام 50-100",
        "fi": "Luvut 50-100",
        "es": "Números 50-100",
        "so": "Tirooyinka 50-100"
    },
    
    # Question count
    "question_count": {
        "sv": "Antal frågor",
        "en": "Number of questions",
        "ar": "عدد الأسئلة",
        "fi": "Kysymysten määrä",
        "es": "Número de preguntas",
        "so": "Tirada su'aalaha"
    },
    
    # Game buttons
    "start_game": {
        "sv": "Starta spelet",
        "en": "Start game",
        "ar": "ابدأ اللعبة",
        "fi": "Aloita peli",
        "es": "Iniciar juego",
        "so": "Bilow ciyaarta"
    },
    "next": {
        "sv": "Nästa",
        "en": "Next",
        "ar": "التالي",
        "fi": "Seuraava",
        "es": "Siguiente",
        "so": "Xiga"
    },
    "submit": {
        "sv": "Svara",
        "en": "Submit",
        "ar": "إرسال",
        "fi": "Lähetä",
        "es": "Enviar",
        "so": "Dir"
    },
    
    # Results
    "results": {
        "sv": "Resultat",
        "en": "Results",
        "ar": "النتائج",
        "fi": "Tulokset",
        "es": "Resultados",
        "so": "Natiijooyinka"
    },
    "score": {
        "sv": "Poäng",
        "en": "Score",
        "ar": "النقاط",
        "fi": "Pisteet",
        "es": "Puntuación",
        "so": "Dhibcaha"
    },
    "correct": {
        "sv": "Rätt",
        "en": "Correct",
        "ar": "صحيح",
        "fi": "Oikein",
        "es": "Correcto",
        "so": "Sax"
    },
    "incorrect": {
        "sv": "Fel",
        "en": "Incorrect",
        "ar": "خطأ",
        "fi": "Väärin",
        "es": "Incorrecto",
        "so": "Khalad"
    },
    "time": {
        "sv": "Tid",
        "en": "Time",
        "ar": "الوقت",
        "fi": "Aika",
        "es": "Tiempo",
        "so": "Waqtiga"
    },
    "play_again": {
        "sv": "Spela igen",
        "en": "Play again",
        "ar": "العب مرة أخرى",
        "fi": "Pelaa uudelleen",
        "es": "Jugar de nuevo",
        "so": "Ciyaar mar kale"
    },
    "back_to_menu": {
        "sv": "Tillbaka till menyn",
        "en": "Back to menu",
        "ar": "العودة إلى القائمة",
        "fi": "Takaisin valikkoon",
        "es": "Volver al menú",
        "so": "Ku noqo liiska"
    },
    
    # Game screen
    "question": {
        "sv": "Fråga",
        "en": "Question",
        "ar": "سؤال",
        "fi": "Kysymys",
        "es": "Pregunta",
        "so": "Su'aal"
    },
    "of": {
        "sv": "av",
        "en": "of",
        "ar": "من",
        "fi": "/",
        "es": "de",
        "so": "ka mid ah"
    },
    "your_answer": {
        "sv": "Ditt svar",
        "en": "Your answer",
        "ar": "إجابتك",
        "fi": "Vastauksesi",
        "es": "Tu respuesta",
        "so": "Jawaabtaada"
    },
    
    # Settings
    "settings": {
        "sv": "Inställningar",
        "en": "Settings",
        "ar": "الإعدادات",
        "fi": "Asetukset",
        "es": "Configuración",
        "so": "Dejinta"
    },
    "language": {
        "sv": "Språk",
        "en": "Language",
        "ar": "اللغة",
        "fi": "Kieli",
        "es": "Idioma",
        "so": "Luuqada"
    },
    "theme": {
        "sv": "Tema",
        "en": "Theme",
        "ar": "المظهر",
        "fi": "Teema",
        "es": "Tema",
        "so": "Mawduuca"
    },
    "dark_mode": {
        "sv": "Mörkt läge",
        "en": "Dark mode",
        "ar": "الوضع الداكن",
        "fi": "Tumma tila",
        "es": "Modo oscuro",
        "so": "Habka madow"
    },
    "light_mode": {
        "sv": "Ljust läge",
        "en": "Light mode",
        "ar": "الوضع الفاتح",
        "fi": "Vaalea tila",
        "es": "Modo claro",
        "so": "Habka nuurka"
    },
    
    # Feedback messages
    "great_job": {
        "sv": "Bra jobbat!",
        "en": "Great job!",
        "ar": "عمل رائع!",
        "fi": "Hienoa!",
        "es": "¡Buen trabajo!",
        "so": "Shaqo wanaagsan!"
    },
    "keep_trying": {
        "sv": "Fortsätt försöka!",
        "en": "Keep trying!",
        "ar": "استمر في المحاولة!",
        "fi": "Jatka yrittämistä!",
        "es": "¡Sigue intentando!",
        "so": "Sii wad isku dayga!"
    },
    "perfect_score": {
        "sv": "Perfekt resultat!",
        "en": "Perfect score!",
        "ar": "نتيجة مثالية!",
        "fi": "Täydellinen tulos!",
        "es": "¡Puntuación perfecta!",
        "so": "Natiijo qumman!"
    },
    
    # Validation messages
    "select_one_operation": {
        "sv": "Välj minst ett räknesätt",
        "en": "Select at least one operation",
        "ar": "اختر عملية واحدة على الأقل",
        "fi": "Valitse vähintään yksi laskutoimitus",
        "es": "Selecciona al menos una operación",
        "so": "Dooro ugu yaraan hal hawlgal"
    },
    "enter_answer": {
        "sv": "Ange ett svar",
        "en": "Enter an answer",
        "ar": "أدخل إجابة",
        "fi": "Anna vastaus",
        "es": "Ingresa una respuesta",
        "so": "Geli jawaab"
    }
}

# ==================== API ROUTES ====================

@api_router.get("/")
async def root():
    return {"message": "Matematikmästaren API", "version": "1.0.0"}

@api_router.get("/translations")
async def get_translations():
    """Get all translations"""
    return TRANSLATIONS

@api_router.get("/translations/{language}")
async def get_translations_by_language(language: str):
    """Get translations for a specific language"""
    result = {}
    for key, translations in TRANSLATIONS.items():
        if language in translations:
            result[key] = translations[language]
        elif "en" in translations:
            result[key] = translations["en"]
        else:
            result[key] = key
    return result

@api_router.get("/languages")
async def get_languages():
    """Get list of supported languages"""
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

class GenerateQuestionsRequest(BaseModel):
    operations: List[str]
    difficulty: str = "easy"
    count: int = 15

@api_router.post("/generate-questions")
async def generate_questions(request: GenerateQuestionsRequest):
    operations = request.operations
    difficulty = request.difficulty
    count = request.count
    """Generate math questions based on operations and difficulty"""
    
    # Define number ranges based on difficulty
    ranges = {
        "easy": (1, 10),
        "medium": (10, 50),
        "hard": (50, 100)
    }
    
    min_num, max_num = ranges.get(difficulty, (1, 10))
    questions = []
    
    operation_symbols = {
        "addition": "+",
        "subtraction": "-",
        "multiplication": "×",
        "division": "÷"
    }
    
    for _ in range(count):
        operation = random.choice(operations)
        num1 = random.randint(min_num, max_num)
        num2 = random.randint(min_num, max_num)
        
        if operation == "addition":
            answer = num1 + num2
        elif operation == "subtraction":
            # Ensure positive result
            if num1 < num2:
                num1, num2 = num2, num1
            answer = num1 - num2
        elif operation == "multiplication":
            # Limit multiplication for easier mental math
            if difficulty == "easy":
                num1 = random.randint(1, 10)
                num2 = random.randint(1, 10)
            elif difficulty == "medium":
                num1 = random.randint(1, 12)
                num2 = random.randint(1, 12)
            else:
                num1 = random.randint(1, 15)
                num2 = random.randint(1, 15)
            answer = num1 * num2
        elif operation == "division":
            # Ensure clean division
            num2 = random.randint(1, min(10, max_num))
            answer = random.randint(1, min(10, max_num))
            num1 = num2 * answer
        else:
            answer = num1 + num2
        
        symbol = operation_symbols.get(operation, "+")
        
        questions.append({
            "num1": num1,
            "num2": num2,
            "operation": operation,
            "symbol": symbol,
            "correct_answer": float(answer),
            "display": f"{num1} {symbol} {num2} = ?"
        })
    
    return {"questions": questions}

@api_router.post("/game-session", response_model=GameSession)
async def create_game_session(session: GameSessionCreate):
    """Save a game session"""
    session_dict = session.dict()
    session_obj = GameSession(**session_dict)
    await db.game_sessions.insert_one(session_obj.dict())
    return session_obj

@api_router.get("/game-sessions", response_model=List[GameSession])
async def get_game_sessions(limit: int = 20):
    """Get recent game sessions"""
    sessions = await db.game_sessions.find().sort("created_at", -1).limit(limit).to_list(limit)
    return [GameSession(**session) for session in sessions]

@api_router.get("/stats")
async def get_stats():
    """Get game statistics"""
    total_games = await db.game_sessions.count_documents({})
    
    if total_games == 0:
        return {
            "total_games": 0,
            "avg_score": 0,
            "best_score": 0,
            "total_correct": 0
        }
    
    pipeline = [
        {
            "$group": {
                "_id": None,
                "avg_score": {"$avg": "$score"},
                "best_score": {"$max": "$score"},
                "total_correct": {"$sum": "$correct_answers"}
            }
        }
    ]
    
    result = await db.game_sessions.aggregate(pipeline).to_list(1)
    
    if result:
        return {
            "total_games": total_games,
            "avg_score": round(result[0]["avg_score"], 1),
            "best_score": result[0]["best_score"],
            "total_correct": result[0]["total_correct"]
        }
    
    return {
        "total_games": total_games,
        "avg_score": 0,
        "best_score": 0,
        "total_correct": 0
    }

# Include the router in the main app
app.include_router(api_router)

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

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
