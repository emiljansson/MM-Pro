import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useGameStore } from '../src/stores/gameStore';
import { useTheme, useTranslation } from '../src/hooks/useTheme';
import { NumericKeyboard } from '../src/components';
import * as Haptics from 'expo-haptics';

export default function GameScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const {
    questions,
    currentQuestionIndex,
    submitAnswer,
    isPlaying,
    answers,
  } = useGameStore();

  const [userInput, setUserInput] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState(false);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const feedbackOpacity = useRef(new Animated.Value(0)).current;

  // Calculate available height and determine if it's a small screen
  const availableHeight = height - insets.top - insets.bottom;
  const isTablet = width > 600;
  const isLargeScreen = isTablet;
  // Only use compact on very small phones (< 700px height)
  const isSmallScreen = availableHeight < 700 && !isTablet;
  const isVerySmallScreen = availableHeight < 650;

  useEffect(() => {
    if (!isPlaying && questions.length === 0) {
      // Use setTimeout to avoid navigation during render
      const timeout = setTimeout(() => {
        router.replace('/');
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [isPlaying, questions]);

  useEffect(() => {
    if (currentQuestionIndex >= questions.length && questions.length > 0) {
      router.replace('/results');
    }
  }, [currentQuestionIndex, questions]);

  const currentQuestion = questions[currentQuestionIndex];

  const handleKeyPress = (key: string) => {
    if (key === '.' && userInput.includes('.')) return;
    if (userInput.length < 10) {
      setUserInput((prev) => prev + key);
    }
  };

  const handleDelete = () => {
    setUserInput((prev) => prev.slice(0, -1));
  };

  const showAnswerFeedback = (isCorrect: boolean) => {
    setLastAnswerCorrect(isCorrect);
    setShowFeedback(true);
    
    if (Platform.OS !== 'web') {
      if (isCorrect) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }

    feedbackOpacity.setValue(1);
    Animated.timing(feedbackOpacity, {
      toValue: 0,
      duration: 800,
      useNativeDriver: true,
    }).start(() => {
      setShowFeedback(false);
    });
  };

  const handleSubmit = () => {
    if (userInput === '') return;

    const numAnswer = parseFloat(userInput);
    const isCorrect = Math.abs(numAnswer - currentQuestion.correct_answer) < 0.001;

    // Animate scale
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    showAnswerFeedback(isCorrect);
    submitAnswer(numAnswer);
    setUserInput('');
  };

  if (!currentQuestion) {
    return null;
  }

  const progress = ((currentQuestionIndex) / questions.length) * 100;
  const correctCount = answers.filter(a => a.isCorrect).length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Full width wrapper */}
        <View style={styles.centeredWrapper}>
          {/* Header */}
          <View style={[
            styles.header, 
            isSmallScreen && styles.headerCompact,
            isLargeScreen && { paddingHorizontal: 28, paddingVertical: 10 }
          ]}>
            <TouchableOpacity
              style={[
                styles.backButton, 
                { backgroundColor: theme.card },
                isSmallScreen && styles.backButtonCompact,
                isLargeScreen && { width: 48, height: 48, borderRadius: 24 }
              ]}
              onPress={() => router.replace('/')}
            >
              <Ionicons name="close" size={isLargeScreen ? 28 : (isSmallScreen ? 20 : 24)} color={theme.text} />
            </TouchableOpacity>

            <View style={styles.progressInfo}>
              <Text style={[
                styles.questionNumber, 
                { color: theme.text },
                isSmallScreen && styles.questionNumberCompact,
                isLargeScreen && { fontSize: 20 }
              ]}>
                {t('question')} {currentQuestionIndex + 1} {t('of')} {questions.length}
              </Text>
              <Text style={[
                styles.scoreText, 
                { color: theme.success },
                isSmallScreen && styles.scoreTextCompact,
                isLargeScreen && { fontSize: 18 }
              ]}>
                {correctCount} {t('correct')}
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={[
            styles.progressBar, 
            { backgroundColor: theme.border },
            isSmallScreen && styles.progressBarCompact,
            isLargeScreen && { height: 8, marginHorizontal: 28 }
          ]}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: theme.primary,
                  width: `${progress}%`,
                },
              ]}
            />
          </View>

          {/* Question Area */}
          <View style={[
            styles.questionArea, 
            isSmallScreen && styles.questionAreaCompact,
            isLargeScreen && { paddingHorizontal: 36 }
          ]}>
            <Animated.View style={[
              styles.questionCard, 
              { backgroundColor: theme.card, transform: [{ scale: scaleAnim }] },
              isSmallScreen && styles.questionCardCompact,
              isVerySmallScreen && styles.questionCardVeryCompact,
              isLargeScreen && { paddingVertical: 32, paddingHorizontal: 28, borderRadius: 24 }
            ]}>
              <Text style={[
                styles.questionText, 
                { color: theme.text },
                isSmallScreen && styles.questionTextCompact,
                isVerySmallScreen && styles.questionTextVeryCompact,
                isLargeScreen && { fontSize: 52, marginBottom: 24 }
              ]}>
                {currentQuestion.num1} {currentQuestion.symbol} {currentQuestion.num2} =
            </Text>
            <View style={[
              styles.answerBox, 
              { borderColor: theme.primary, backgroundColor: theme.surface },
              isSmallScreen && styles.answerBoxCompact,
              isVerySmallScreen && styles.answerBoxVeryCompact,
              isLargeScreen && { paddingVertical: 18, paddingHorizontal: 28, borderRadius: 16, borderWidth: 3 }
            ]}>
              <Text style={[
                styles.answerText,
                { color: userInput ? theme.text : theme.textMuted },
                isSmallScreen && styles.answerTextCompact,
                isVerySmallScreen && styles.answerTextVeryCompact,
                isLargeScreen && { fontSize: 44 }
              ]}>
                {userInput || '?'}
              </Text>
            </View>
          </Animated.View>

          {/* Feedback Overlay */}
          {showFeedback && (
            <Animated.View style={[styles.feedbackOverlay, { opacity: feedbackOpacity }]}>
              <View style={[
                styles.feedbackIcon,
                { backgroundColor: lastAnswerCorrect ? theme.success : theme.error },
                isSmallScreen && styles.feedbackIconCompact,
                isLargeScreen && { width: 100, height: 100, borderRadius: 50 }
              ]}>
                <Ionicons
                  name={lastAnswerCorrect ? 'checkmark' : 'close'}
                  size={isLargeScreen ? 60 : (isSmallScreen ? 36 : 48)}
                  color="#FFFFFF"
                />
              </View>
            </Animated.View>
          )}
        </View>

        {/* Keyboard */}
        <NumericKeyboard
          onKeyPress={handleKeyPress}
          onDelete={handleDelete}
          onSubmit={handleSubmit}
          submitLabel={t('submit')}
          mode={
            currentQuestion.operation === 'division' ? 'decimal' :
            currentQuestion.operation === 'fractions' ? 'fraction' :
            currentQuestion.operation === 'equations' ? 'equation' :
            'standard'
          }
          showDecimal={currentQuestion.operation === 'division' || currentQuestion.operation === 'percentage'}
          showFraction={currentQuestion.operation === 'fractions'}
          showNegative={currentQuestion.operation === 'subtraction' || currentQuestion.operation === 'equations'}
          compact={isSmallScreen}
          large={isLargeScreen}
        />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  centeredWrapper: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerCompact: {
    paddingVertical: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonCompact: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  progressInfo: {
    flex: 1,
    marginLeft: 12,
  },
  questionNumber: {
    fontSize: 14,
    fontWeight: '600',
  },
  questionNumberCompact: {
    fontSize: 13,
  },
  scoreText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  scoreTextCompact: {
    fontSize: 11,
    marginTop: 0,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  progressBarCompact: {
    height: 3,
    marginHorizontal: 10,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  questionArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  questionAreaCompact: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  questionCard: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  questionCardCompact: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  questionCardVeryCompact: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  questionText: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 12,
  },
  questionTextCompact: {
    fontSize: 28,
    marginBottom: 10,
  },
  questionTextVeryCompact: {
    fontSize: 24,
    marginBottom: 8,
  },
  answerBox: {
    width: '70%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  answerBoxCompact: {
    width: '65%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 2,
  },
  answerBoxVeryCompact: {
    width: '60%',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  answerText: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  answerTextCompact: {
    fontSize: 24,
  },
  answerTextVeryCompact: {
    fontSize: 22,
  },
  feedbackOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedbackIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedbackIconCompact: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
});
