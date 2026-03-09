import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { Question, GameSettings, GameResult, AnswerRecord, ThemeMode } from '../types';
import { FALLBACK_TRANSLATIONS, SUPPORTED_LANGUAGES } from '../i18n/translations';
import * as Localization from 'expo-localization';

// Production URL as fallback
const PRODUCTION_API = 'https://api.mathematicsmaster.app';
const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || PRODUCTION_API;

// Helper function for safe storage operations
const safeGetItem = async (key: string): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(key);
  } catch (error) {
    console.warn('AsyncStorage getItem error:', error);
    return null;
  }
};

const safeSetItem = async (key: string, value: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (error) {
    console.warn('AsyncStorage setItem error:', error);
  }
};

interface GameStore {
  // Settings
  settings: GameSettings;
  updateSettings: (settings: Partial<GameSettings>) => void;
  
  // Game state
  questions: Question[];
  currentQuestionIndex: number;
  answers: AnswerRecord[];
  gameStartTime: number;
  questionStartTime: number;
  isPlaying: boolean;
  isLoading: boolean;
  
  // Game actions
  startGame: () => Promise<void>;
  submitAnswer: (answer: number | string | null) => void;
  endGame: () => GameResult;
  resetGame: () => void;
  
  // Theme
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
  
  // Language
  language: string;
  translations: Record<string, string>;
  setLanguage: (code: string) => Promise<void>;
  loadTranslations: () => Promise<void>;
  t: (key: string) => string;
  
  // Initialize
  initialize: () => Promise<void>;
}

const detectLanguage = (): string => {
  const locales = Localization.getLocales();
  if (locales && locales.length > 0) {
    const deviceLang = locales[0].languageCode?.toLowerCase() || 'en';
    // Check if device language is supported
    const supported = SUPPORTED_LANGUAGES.find(l => l.code === deviceLang);
    if (supported) return deviceLang;
  }
  // Fallback priority: Swedish -> English
  return 'sv';
};

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial settings
  settings: {
    operations: [],  // No category selected by default
    difficulty: 'easy',
    questionCount: 15,
  },
  
  // Game state
  questions: [],
  currentQuestionIndex: 0,
  answers: [],
  gameStartTime: 0,
  questionStartTime: 0,
  isPlaying: false,
  isLoading: false,
  
  // Theme
  theme: 'light',
  
  // Language
  language: 'sv',
  translations: {},
  
  updateSettings: (newSettings) => {
    set((state) => ({
      settings: { ...state.settings, ...newSettings }
    }));
  },
  
  startGame: async () => {
    const { settings, language } = get();
    set({ isLoading: true });
    
    try {
      const response = await fetch(`${API_URL}/api/generate-questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': language,
        },
        body: JSON.stringify({
          operations: settings.operations,
          difficulty: settings.difficulty,
          count: settings.questionCount,
          language: language,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to generate questions');
      
      const data = await response.json();
      const now = Date.now();
      
      set({
        questions: data.questions,
        currentQuestionIndex: 0,
        answers: [],
        gameStartTime: now,
        questionStartTime: now,
        isPlaying: true,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error starting game:', error);
      // Generate questions locally as fallback
      const questions = generateQuestionsLocally(settings);
      const now = Date.now();
      
      set({
        questions,
        currentQuestionIndex: 0,
        answers: [],
        gameStartTime: now,
        questionStartTime: now,
        isPlaying: true,
        isLoading: false,
      });
    }
  },
  
  submitAnswer: (answer) => {
    const { questions, currentQuestionIndex, answers, questionStartTime } = get();
    const question = questions[currentQuestionIndex];
    const timeSpent = (Date.now() - questionStartTime) / 1000;
    
    // Handle both numeric and string answers (fractions)
    let isCorrect = false;
    if (answer !== null) {
      const correctAnswer = question.correct_answer;
      
      if (typeof answer === 'string' && typeof correctAnswer === 'string') {
        // Both are strings - compare as fractions or exact match
        if (answer.includes('/') && correctAnswer.includes('/')) {
          // Compare fraction values
          const [userNum, userDenom] = answer.split('/').map(Number);
          const [correctNum, correctDenom] = correctAnswer.split('/').map(Number);
          const userVal = userNum / userDenom;
          const correctVal = correctNum / correctDenom;
          isCorrect = Math.abs(userVal - correctVal) < 0.001;
        } else {
          // Direct string comparison
          isCorrect = answer === correctAnswer;
        }
      } else if (typeof answer === 'number') {
        // Numeric answer
        if (typeof correctAnswer === 'string' && correctAnswer.includes('/')) {
          // Compare number to fraction
          const [num, denom] = correctAnswer.split('/').map(Number);
          const correctVal = num / denom;
          isCorrect = Math.abs(answer - correctVal) < 0.001;
        } else {
          // Both numeric
          const correctVal = typeof correctAnswer === 'string' 
            ? parseFloat(correctAnswer) 
            : correctAnswer;
          isCorrect = Math.abs(answer - correctVal) < 0.001;
        }
      }
    }
    
    const newAnswer: AnswerRecord = {
      question,
      userAnswer: answer,
      isCorrect,
      timeSpent,
    };
    
    const newAnswers = [...answers, newAnswer];
    const nextIndex = currentQuestionIndex + 1;
    
    if (nextIndex >= questions.length) {
      set({
        answers: newAnswers,
        currentQuestionIndex: nextIndex,
      });
    } else {
      set({
        answers: newAnswers,
        currentQuestionIndex: nextIndex,
        questionStartTime: Date.now(),
      });
    }
  },
  
  endGame: () => {
    const { answers, gameStartTime, settings } = get();
    const totalTime = (Date.now() - gameStartTime) / 1000;
    const correctAnswers = answers.filter(a => a.isCorrect).length;
    const score = Math.round((correctAnswers / answers.length) * 100);
    
    // Save game session to backend
    AsyncStorage.getItem('session_token').then(token => {
      const category = settings.operations.length > 0 ? settings.operations[0] : 'mixed';
      
      fetch(`${API_URL}/api/games/sessions`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          category: category,
          difficulty: settings.difficulty,
          question_count: settings.questionCount,
          score,
          correct_answers: correctAnswers,
          total_time: totalTime,
          answers: answers.map(a => ({
            question: a.question,
            userAnswer: a.userAnswer,
            correctAnswer: a.correctAnswer,
            isCorrect: a.isCorrect,
            timeTaken: a.timeTaken,
          })),
        }),
      }).catch(error => {
        console.error('Error saving game session:', error);
      });
    }).catch(error => {
      console.error('Error getting token:', error);
    });
    
    return {
      score,
      correctAnswers,
      totalQuestions: answers.length,
      totalTime,
      answers,
    };
  },
  
  resetGame: () => {
    set({
      questions: [],
      currentQuestionIndex: 0,
      answers: [],
      gameStartTime: 0,
      questionStartTime: 0,
      isPlaying: false,
    });
  },
  
  toggleTheme: () => {
    const currentTheme = get().theme;
    // Cycle through: auto -> light -> dark -> auto
    let newTheme: ThemeMode;
    if (currentTheme === 'auto') {
      newTheme = 'light';
    } else if (currentTheme === 'light') {
      newTheme = 'dark';
    } else {
      newTheme = 'auto';
    }
    set({ theme: newTheme });
    safeSetItem('theme', newTheme);
  },
  
  setTheme: (theme) => {
    set({ theme });
    safeSetItem('theme', theme);
  },
  
  setLanguage: async (code) => {
    set({ language: code });
    await safeSetItem('language', code);
    await get().loadTranslations();
  },
  
  loadTranslations: async () => {
    const { language } = get();
    
    try {
      const response = await fetch(`${API_URL}/api/translations/${language}`);
      if (response.ok) {
        const data = await response.json();
        set({ translations: data });
        return;
      }
    } catch (error) {
      console.error('Error loading translations:', error);
    }
    
    // Fallback to local translations
    const fallback: Record<string, string> = {};
    Object.keys(FALLBACK_TRANSLATIONS).forEach(key => {
      fallback[key] = FALLBACK_TRANSLATIONS[key][language] || FALLBACK_TRANSLATIONS[key]['en'] || key;
    });
    set({ translations: fallback });
  },
  
  t: (key) => {
    const { translations, language } = get();
    if (translations[key]) return translations[key];
    if (FALLBACK_TRANSLATIONS[key]?.[language]) return FALLBACK_TRANSLATIONS[key][language];
    if (FALLBACK_TRANSLATIONS[key]?.['en']) return FALLBACK_TRANSLATIONS[key]['en'];
    return key;
  },
  
  initialize: async () => {
    try {
      // Load saved language or detect
      const savedLang = await safeGetItem('language');
      const language = savedLang || detectLanguage();
      
      // Load saved theme
      const savedTheme = await safeGetItem('theme') as ThemeMode | null;
      const theme = savedTheme || 'light';
      
      set({ language, theme });
      await get().loadTranslations();
    } catch (error) {
      console.error('Error initializing store:', error);
      set({ language: 'sv', theme: 'light' });
      await get().loadTranslations();
    }
  },
}));

// Local question generation fallback
function generateQuestionsLocally(settings: GameSettings): Question[] {
  const { operations, difficulty, questionCount } = settings;
  const questions: Question[] = [];
  
  const ranges = {
    easy: { min: 1, max: 10 },
    medium: { min: 10, max: 50 },
    hard: { min: 50, max: 100 },
  };
  
  const { min, max } = ranges[difficulty];
  
  const operationSymbols: Record<string, string> = {
    addition: '+',
    subtraction: '-',
    multiplication: '×',
    division: '÷',
  };
  
  for (let i = 0; i < questionCount; i++) {
    const operation = operations[Math.floor(Math.random() * operations.length)];
    let num1 = Math.floor(Math.random() * (max - min + 1)) + min;
    let num2 = Math.floor(Math.random() * (max - min + 1)) + min;
    let answer: number;
    
    switch (operation) {
      case 'subtraction':
        if (num1 < num2) [num1, num2] = [num2, num1];
        answer = num1 - num2;
        break;
      case 'multiplication':
        num1 = Math.floor(Math.random() * 10) + 1;
        num2 = Math.floor(Math.random() * 10) + 1;
        answer = num1 * num2;
        break;
      case 'division':
        num2 = Math.floor(Math.random() * 9) + 1;
        answer = Math.floor(Math.random() * 10) + 1;
        num1 = num2 * answer;
        break;
      default: // addition
        answer = num1 + num2;
    }
    
    const symbol = operationSymbols[operation] || '+';
    
    questions.push({
      num1,
      num2,
      operation,
      symbol,
      correct_answer: answer,
      display: `${num1} ${symbol} ${num2} = ?`,
    });
  }
  
  return questions;
}
