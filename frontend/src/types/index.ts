export interface Question {
  num1?: number;
  num2?: number;
  operation: string;
  symbol?: string;
  correct_answer: number | string;
  display: string;
  type?: string;
  input_type?: string;
  options?: string[];
  hint?: string;
  answer?: number | string;
}

export interface GameSettings {
  operations: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  questionCount: number;
}

export interface GameResult {
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  totalTime: number;
  answers: AnswerRecord[];
}

export interface AnswerRecord {
  question: Question;
  userAnswer: number | string | null;
  isCorrect: boolean;
  timeSpent: number;
}

export interface Language {
  code: string;
  name: string;
  native: string;
  rtl?: boolean;
}

export type ThemeMode = 'light' | 'dark';
