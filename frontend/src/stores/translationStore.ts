import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import { FALLBACK_TRANSLATIONS, SUPPORTED_LANGUAGES } from '../i18n/translations';
import { STORAGE_KEYS, SUPPORTED_LANGUAGE_CODES } from '../constants';

// Production URL as fallback
const PRODUCTION_API = 'https://mm-pro-production.up.railway.app';
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

interface TranslationStore {
  language: string;
  translations: Record<string, string>;
  isLoading: boolean;
  
  setLanguage: (code: string) => Promise<void>;
  loadTranslations: () => Promise<void>;
  t: (key: string) => string;
  initialize: () => Promise<void>;
}

const detectLanguage = (): string => {
  const locales = Localization.getLocales();
  if (locales && locales.length > 0) {
    const deviceLang = locales[0].languageCode?.toLowerCase() || 'en';
    if (SUPPORTED_LANGUAGE_CODES.includes(deviceLang)) {
      return deviceLang;
    }
  }
  return 'sv'; // Default to Swedish
};

export const useTranslationStore = create<TranslationStore>((set, get) => ({
  language: 'sv',
  translations: {},
  isLoading: false,

  setLanguage: async (code) => {
    set({ language: code, isLoading: true });
    await safeSetItem(STORAGE_KEYS.LANGUAGE, code);
    await get().loadTranslations();
    set({ isLoading: false });
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
    set({ isLoading: true });
    const savedLang = await safeGetItem(STORAGE_KEYS.LANGUAGE);
    const language = savedLang || detectLanguage();
    set({ language });
    await get().loadTranslations();
    set({ isLoading: false });
  },
}));
