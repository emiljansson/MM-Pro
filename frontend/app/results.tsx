import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useGameStore } from '../src/stores/gameStore';
import { useTheme, useTranslation } from '../src/hooks/useTheme';
import { GameResult } from '../src/types';
import { AchievementPopup } from '../src/components';
import { useAuth } from '../src/contexts';
import * as Haptics from 'expo-haptics';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://api.mathematicsmaster.app';

interface NewAchievement {
  key: string;
  name: string;
  description: string;
  icon: string;
  tier: string;
  points: number;
}

export default function ResultsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { endGame, resetGame, startGame, settings, questions } = useGameStore();
  const { sessionToken, isAuthenticated } = useAuth();

  const [result, setResult] = useState<GameResult | null>(null);
  const [newAchievements, setNewAchievements] = useState<NewAchievement[]>([]);
  const [currentAchievement, setCurrentAchievement] = useState<NewAchievement | null>(null);
  const [showAchievementPopup, setShowAchievementPopup] = useState(false);

  const scoreScale = useRef(new Animated.Value(0)).current;
  const statsOpacity = useRef(new Animated.Value(0)).current;

  const checkAchievements = async () => {
    if (!isAuthenticated || !sessionToken) return;
    
    try {
      const response = await fetch(`${API_URL}/api/achievements/check`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.new_achievements && data.new_achievements.length > 0) {
          // Translate achievement names
          const translated = data.new_achievements.map((ach: NewAchievement) => ({
            ...ach,
            name: t(ach.name) || ach.name,
            description: t(ach.description) || ach.description,
          }));
          setNewAchievements(translated);
        }
      }
    } catch (error) {
      console.error('Error checking achievements:', error);
    }
  };

  // Show achievements one by one
  useEffect(() => {
    if (newAchievements.length > 0 && !showAchievementPopup) {
      const [next, ...rest] = newAchievements;
      setCurrentAchievement(next);
      setShowAchievementPopup(true);
      setNewAchievements(rest);
    }
  }, [newAchievements, showAchievementPopup]);

  useEffect(() => {
    if (questions.length > 0) {
      const gameResult = endGame();
      setResult(gameResult);

      // Trigger celebration for perfect score
      if (gameResult.score === 100) {
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }

      // Animate
      Animated.sequence([
        Animated.delay(200),
        Animated.spring(scoreScale, {
          toValue: 1,
          damping: 10,
          useNativeDriver: true,
        }),
      ]).start();

      Animated.sequence([
        Animated.delay(400),
        Animated.timing(statsOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Check for new achievements after a short delay
      setTimeout(() => {
        checkAchievements();
      }, 1500);
    } else {
      router.replace('/');
    }
  }, []);

  const handlePlayAgain = async () => {
    resetGame();
    await startGame();
    router.replace('/game');
  };

  const handleBackToMenu = () => {
    resetGame();
    router.replace('/');
  };

  if (!result) {
    return null;
  }

  const isPerfect = result.score === 100;
  const isGreat = result.score >= 80;
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(40, insets.bottom + 16) }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>
            {t('results')}
          </Text>
        </View>

        {/* Score Circle */}
        <Animated.View style={[styles.scoreContainer, { transform: [{ scale: scoreScale }] }]}>
          <View
            style={[
              styles.scoreCircle,
              {
                backgroundColor: isPerfect
                  ? theme.success
                  : isGreat
                  ? theme.primary
                  : theme.secondary,
              },
            ]}
          >
            <Text style={styles.scoreValue}>{result.score}%</Text>
            <Text style={styles.scoreLabel}>{t('score')}</Text>
          </View>
          {isPerfect && (
            <View style={styles.medalContainer}>
              <Ionicons name="medal" size={40} color="#FFD700" />
            </View>
          )}
        </Animated.View>

        {/* Feedback Message */}
        <Text
          style={[
            styles.feedbackText,
            { color: isPerfect ? theme.success : isGreat ? theme.primary : theme.text },
          ]}
        >
          {isPerfect ? t('perfect_score') : isGreat ? t('great_job') : t('keep_trying')}
        </Text>

        {/* Stats Cards */}
        <Animated.View style={[styles.statsGrid, { opacity: statsOpacity }]}>
          <View style={[styles.statCard, { backgroundColor: theme.card }]}>
            <Ionicons name="checkmark-circle" size={32} color={theme.success} />
            <Text style={[styles.statValue, { color: theme.text }]}>
              {result.correctAnswers}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              {t('correct')}
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: theme.card }]}>
            <Ionicons name="close-circle" size={32} color={theme.error} />
            <Text style={[styles.statValue, { color: theme.text }]}>
              {result.totalQuestions - result.correctAnswers}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              {t('incorrect')}
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: theme.card }]}>
            <Ionicons name="time" size={32} color={theme.primary} />
            <Text style={[styles.statValue, { color: theme.text }]}>
              {formatTime(result.totalTime)}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              {t('time')}
            </Text>
          </View>
        </Animated.View>

        {/* Answer Review */}
        <View style={styles.reviewSection}>
          <Text style={[styles.reviewTitle, { color: theme.textSecondary }]}>
            {t('results')}
          </Text>
          {result.answers.map((answer, index) => (
            <View
              key={index}
              style={[
                styles.answerRow,
                {
                  backgroundColor: theme.card,
                  borderLeftColor: answer.isCorrect ? theme.success : theme.error,
                },
              ]}
            >
              <View style={styles.answerContent}>
                {/* Question + Correct Answer */}
                <Text style={[styles.answerQuestion, { color: theme.text }]}>
                  {answer.question.num1} {answer.question.symbol} {answer.question.num2} = {answer.question.correct_answer}
                </Text>
                {/* User's Answer */}
                <View style={styles.answerDetails}>
                  <Text style={[styles.yourAnswerLabel, { color: theme.textSecondary }]}>
                    {t('your_answer') || 'Ditt svar'}:
                  </Text>
                  <Text
                    style={[
                      styles.answerValue,
                      { color: answer.isCorrect ? theme.success : theme.error },
                    ]}
                  >
                    {answer.userAnswer !== null ? answer.userAnswer : '-'}
                  </Text>
                </View>
              </View>
              <Ionicons
                name={answer.isCorrect ? 'checkmark-circle' : 'close-circle'}
                size={28}
                color={answer.isCorrect ? theme.success : theme.error}
              />
            </View>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: theme.primary }]}
            onPress={handlePlayAgain}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh" size={24} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>{t('play_again')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: theme.border }]}
            onPress={handleBackToMenu}
            activeOpacity={0.7}
          >
            <Ionicons name="home" size={24} color={theme.text} />
            <Text style={[styles.secondaryButtonText, { color: theme.text }]}>
              {t('back_to_menu')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      {/* Achievement Popup */}
      <AchievementPopup
        achievement={currentAchievement}
        visible={showAchievementPopup}
        onClose={() => setShowAchievementPopup(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40, // Base padding, additional safe area added dynamically
  },
  header: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  scoreContainer: {
    alignItems: 'center',
    marginVertical: 24,
    position: 'relative',
  },
  scoreCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  scoreLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  medalContainer: {
    position: 'absolute',
    top: -10,
    right: '25%',
  },
  feedbackText: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  reviewSection: {
    marginBottom: 24,
  },
  reviewTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  answerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    marginBottom: 8,
  },
  answerContent: {
    flex: 1,
  },
  answerQuestion: {
    fontSize: 16,
    fontWeight: '600',
  },
  answerDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 8,
  },
  yourAnswerLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  answerValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  correctAnswer: {
    fontSize: 14,
  },
  actions: {
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryButton: {
    flexDirection: 'row',
    height: 56,
    borderRadius: 16,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
});
