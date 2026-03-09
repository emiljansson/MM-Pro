// Production URL as fallback
const PRODUCTION_API = 'https://api.mathematicsmaster.app';
const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || PRODUCTION_API;

export interface GameCategory {
  key: string;
  name_key: string;
  description_key: string;
  icon: string;
  color: string;
  pro_only: boolean;
  order: number;
  locked?: boolean;
  levels: {
    key: string;
    name_key: string;
    description_key: string;
    min_value: number;
    max_value: number;
    time_bonus: number;
  }[];
}

export const apiService = {
  // Get all game categories
  async getCategories(token?: string): Promise<GameCategory[]> {
    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${API_URL}/api/games/categories`, { headers });
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
    return [];
  },

  // Generate questions
  async generateQuestions(
    category: string,
    difficulty: string,
    count: number,
    operations?: string[],
    token?: string
  ) {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}/api/games/generate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          category,
          difficulty,
          count,
          operations,
        }),
      });

      if (response.ok) {
        return await response.json();
      }
      
      // Check if pro required
      if (response.status === 403) {
        throw new Error('PRO_REQUIRED');
      }
    } catch (error) {
      throw error;
    }
    return { questions: [] };
  },

  // Save game session
  async saveGameSession(
    sessionData: {
      category: string;
      difficulty: string;
      question_count: number;
      score: number;
      correct_answers: number;
      total_time: number;
      answers: any[];
    },
    token?: string
  ) {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}/api/games/sessions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(sessionData),
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Error saving game session:', error);
    }
    return null;
  },

  // Get game history
  async getGameHistory(
    token: string,
    category?: string,
    difficulty?: string,
    limit: number = 50
  ) {
    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (difficulty) params.append('difficulty', difficulty);
      params.append('limit', limit.toString());

      const response = await fetch(`${API_URL}/api/games/history?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Error fetching game history:', error);
    }
    return [];
  },

  // Get user stats
  async getUserStats(token: string) {
    try {
      const response = await fetch(`${API_URL}/api/games/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
    return null;
  },

  // Get translations
  async getTranslations(languageCode: string) {
    try {
      const response = await fetch(`${API_URL}/api/translations/${languageCode}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Error fetching translations:', error);
    }
    return {};
  },

  // Get languages
  async getLanguages() {
    try {
      const response = await fetch(`${API_URL}/api/languages/`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Error fetching languages:', error);
    }
    return [];
  },
};
