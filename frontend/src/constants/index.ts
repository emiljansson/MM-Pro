// App constants
export const APP_NAME = 'MathMaster Pro';
export const APP_VERSION = '2.0.0';

// Game settings
export const ITEMS_PER_PAGE = 4;
export const QUESTION_COUNTS = [15, 30, 60, 120];
export const DEFAULT_QUESTION_COUNT = 15;
export const DEFAULT_DIFFICULTY = 'easy';

// All available math categories
export const ALL_CATEGORIES = [
  { key: 'addition', symbol: '+', color: '#7EC8E3' },
  { key: 'subtraction', symbol: '−', color: '#F9B4AB' },
  { key: 'multiplication', symbol: '×', color: '#C9B1FF' },
  { key: 'division', symbol: '÷', color: '#B5EAD7' },
  { key: 'fractions', symbol: '½', color: '#FFD93D' },
  { key: 'equations', symbol: 'x', color: '#FF7B7B' },
  { key: 'geometry', symbol: '△', color: '#40C4AA' },
  { key: 'percentage', symbol: '%', color: '#B388FF' },
  { key: 'units', symbol: 'm', color: '#5DADE2' },
  { key: 'rounding', symbol: '≈', color: '#F4A460' },
  { key: 'angles', symbol: '∠', color: '#CE93D8' },
  { key: 'probability', symbol: 'P', color: '#81C784' },
  { key: 'diagrams', symbol: '📊', color: '#FFB74D' },
];

// Difficulty levels
export const DIFFICULTY_LEVELS = [
  { key: 'easy', range: '1-10' },
  { key: 'medium', range: '10-50' },
  { key: 'hard', range: '50-100' },
];

// API endpoints
export const API_ENDPOINTS = {
  TRANSLATIONS: '/api/translations',
  AUTH: '/api/auth',
  GAMES: '/api/games',
  ADMIN: '/api/admin',
  LEADERBOARD: '/api/leaderboard',
  ACHIEVEMENTS: '/api/achievements',
};

// Supported languages
export const SUPPORTED_LANGUAGE_CODES = ['sv', 'en', 'ar', 'fi', 'es', 'so'];

// Storage keys
export const STORAGE_KEYS = {
  THEME: 'theme',
  LANGUAGE: 'language',
  SESSION_TOKEN: 'session_token',
  USER_DATA: 'user_data',
};
