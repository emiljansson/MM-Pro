/**
 * API Configuration
 * 
 * For production builds, set EXPO_PUBLIC_API_URL environment variable
 * or update the PRODUCTION_URL constant below.
 */

// Production API URL - UPDATE THIS before building for production
const PRODUCTION_URL = 'https://mm-pro-production.up.railway.app';

// Get API URL based on environment
const getApiUrl = (): string => {
  // Check for environment variable first
  const envUrl = process.env.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_API_URL;
  
  if (envUrl) {
    return envUrl;
  }
  
  // In development, use localhost
  if (__DEV__) {
    return 'http://localhost:8001';
  }
  
  // In production builds, use production URL
  return PRODUCTION_URL;
};

export const API_URL = getApiUrl();

export const API_ENDPOINTS = {
  // Auth
  login: `${API_URL}/api/auth/login`,
  register: `${API_URL}/api/auth/register`,
  logout: `${API_URL}/api/auth/logout`,
  me: `${API_URL}/api/auth/me`,
  
  // Game
  generateQuestions: `${API_URL}/api/generate-questions`,
  submitScore: `${API_URL}/api/scores`,
  
  // Translations
  translations: (lang: string) => `${API_URL}/api/translations/${lang}`,
  
  // Leaderboard
  leaderboard: `${API_URL}/api/leaderboard`,
  
  // Health
  health: `${API_URL}/api/health`,
};

export default {
  API_URL,
  API_ENDPOINTS,
};
