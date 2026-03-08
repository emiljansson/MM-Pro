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
import { NumericKeyboard, FractionExpression, containsFraction, FractionKeyboard, Fraction, BarChart, isDiagramQuestion, extractChartData } from '../src/components';
import { LineGraph, isGraphQuestion, extractGraphData } from '../src/components/LineGraph';
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
  const [fractionInput, setFractionInput] = useState({ numerator: '', denominator: '' });
  const [activeFractionField, setActiveFractionField] = useState<'numerator' | 'denominator'>('numerator');
  const [choiceAnswer, setChoiceAnswer] = useState('');
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

  const handleFractionDelete = (field: 'numerator' | 'denominator') => {
    setFractionInput((prev) => ({
      ...prev,
      [field]: prev[field].slice(0, -1),
    }));
  };

  const handleFractionKeyPress = (field: 'numerator' | 'denominator', key: string) => {
    setFractionInput((prev) => {
      const current = prev[field];
      if (current.length < 3) {
        return { ...prev, [field]: current + key };
      }
      return prev;
    });
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

    // Reset and animate with scale effect
    feedbackOpacity.setValue(1);
    scaleAnim.setValue(0.5);
    
    // First animate scale up
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 100,
      useNativeDriver: true,
    }).start();
    
    // Then fade out after a delay
    setTimeout(() => {
      Animated.timing(feedbackOpacity, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }).start(() => {
        setShowFeedback(false);
        scaleAnim.setValue(1);
      });
    }, 1200); // Show for 1.2 seconds before fading
  };

  const handleSubmit = () => {
    const isFractionQuestion = currentQuestion.input_type === 'fraction';
    const isChoiceQuestion = currentQuestion.input_type === 'choice';
    
    // Check for empty input
    if (isChoiceQuestion) {
      if (choiceAnswer === '') return;
    } else if (isFractionQuestion) {
      if (!fractionInput.numerator || !fractionInput.denominator) return;
    } else {
      if (userInput === '') return;
    }

    let isCorrect = false;
    let userAnswer: string | number;
    
    if (isChoiceQuestion) {
      // Choice question - compare directly
      userAnswer = choiceAnswer;
      isCorrect = choiceAnswer === currentQuestion.correct_answer;
    } else if (isFractionQuestion) {
      // Create user's fraction string
      userAnswer = `${fractionInput.numerator}/${fractionInput.denominator}`;
      const correctAnswer = currentQuestion.correct_answer;
      
      // Compare fractions by their decimal value
      const userNum = parseInt(fractionInput.numerator, 10);
      const userDenom = parseInt(fractionInput.denominator, 10);
      const userValue = userNum / userDenom;
      
      // Parse correct answer (can be "3/4" or a number)
      let correctValue: number;
      if (typeof correctAnswer === 'string' && correctAnswer.includes('/')) {
        const [correctNum, correctDenom] = correctAnswer.split('/').map(Number);
        correctValue = correctNum / correctDenom;
      } else {
        correctValue = parseFloat(String(correctAnswer));
      }
      
      // Check if values match (with small epsilon for floating point)
      isCorrect = Math.abs(userValue - correctValue) < 0.001;
    } else if (currentQuestion.input_type === 'text') {
      // Text input - compare strings directly (for π answers like "25π")
      userAnswer = userInput.trim();
      const correctAnswer = String(currentQuestion.correct_answer).trim();
      
      // Normalize both answers (handle π variations)
      const normalizeAnswer = (ans: string): string => {
        return ans.toLowerCase()
          .replace(/pi/gi, 'π')
          .replace(/\s+/g, '')
          .trim();
      };
      
      isCorrect = normalizeAnswer(userAnswer) === normalizeAnswer(correctAnswer);
    } else {
      const numAnswer = parseFloat(userInput);
      userAnswer = numAnswer;
      
      // Handle both numeric and string correct_answer
      const correctAnswer = currentQuestion.correct_answer;
      let correctValue: number;
      
      if (typeof correctAnswer === 'string' && correctAnswer.includes('/')) {
        // Handle fraction answer for non-fraction input mode
        const [num, denom] = correctAnswer.split('/').map(Number);
        correctValue = num / denom;
      } else {
        correctValue = parseFloat(String(correctAnswer));
      }
      
      isCorrect = Math.abs(numAnswer - correctValue) < 0.001;
    }

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
    submitAnswer(typeof userAnswer === 'number' ? userAnswer : userAnswer);
    
    // Reset inputs
    setUserInput('');
    setFractionInput({ numerator: '', denominator: '' });
    setActiveFractionField('numerator');
    setChoiceAnswer('');
  };

  if (!currentQuestion) {
    return null;
  }

  const progress = ((currentQuestionIndex) / questions.length) * 100;
  const correctCount = answers.filter(a => a.isCorrect).length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
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
              onPress={() => {
                // Just go back without resetting game state
                router.back();
              }}
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
            isLargeScreen && { paddingHorizontal: 36 },
            isGraphQuestion(currentQuestion) && styles.questionAreaGraph
          ]}>
            <Animated.View style={[
              styles.questionCard, 
              { backgroundColor: theme.card, transform: [{ scale: scaleAnim }] },
              isSmallScreen && styles.questionCardCompact,
              isVerySmallScreen && styles.questionCardVeryCompact,
              isLargeScreen && { paddingVertical: 32, paddingHorizontal: 28, borderRadius: 24 },
              isGraphQuestion(currentQuestion) && styles.questionCardGraph
            ]}>
              {/* Check if question is a diagram question */}
              {isDiagramQuestion(currentQuestion) ? (
                <View style={styles.diagramQuestionContainer}>
                  {/* Render the bar chart */}
                  {(() => {
                    const chartData = extractChartData(currentQuestion);
                    if (chartData) {
                      return (
                        <BarChart
                          labels={chartData.labels}
                          values={chartData.values}
                          size={isSmallScreen ? 'small' : isLargeScreen ? 'large' : 'medium'}
                          showValues={true}
                        />
                      );
                    }
                    return null;
                  })()}
                  {/* Extract the question text (after the emoji and chart data) */}
                  {currentQuestion.display && currentQuestion.display.includes('\n') && (
                    <Text style={[
                      styles.diagramQuestionText,
                      { color: theme.primary },
                      isSmallScreen && { fontSize: 16 },
                      isLargeScreen && { fontSize: 20 }
                    ]}>
                      {currentQuestion.display.split('\n').pop()}
                    </Text>
                  )}
                </View>
              ) : isGraphQuestion(currentQuestion) ? (
                <View style={styles.graphQuestionContainer}>
                  {/* Render the line graph - large */}
                  {(() => {
                    const graphData = extractGraphData(currentQuestion);
                    if (graphData) {
                      return (
                        <LineGraph
                          points={graphData.points}
                          xMin={graphData.xMin}
                          xMax={graphData.xMax}
                          yMin={graphData.yMin}
                          yMax={graphData.yMax}
                          size="large"
                        />
                      );
                    }
                    return null;
                  })()}
                  {/* Question text below graph */}
                  <Text style={[
                    styles.graphQuestionText,
                    { color: theme.primary },
                    isSmallScreen && { fontSize: 16 },
                    isLargeScreen && { fontSize: 20 }
                  ]}>
                    {currentQuestion.display}
                  </Text>
                </View>
              ) : currentQuestion.display && containsFraction(currentQuestion.display) ? (
                <View style={styles.fractionQuestionContainer}>
                  {/* Check if this is a comparison question (has ? between fractions) */}
                  {currentQuestion.input_type === 'choice' && currentQuestion.display.includes('?') ? (
                    <>
                      {currentQuestion.hint && (
                        <Text style={[
                          styles.fractionPrefixText,
                          { color: theme.textSecondary, marginBottom: 8 },
                          isSmallScreen && { fontSize: 14 }
                        ]}>
                          {currentQuestion.hint}
                        </Text>
                      )}
                      <FractionExpression
                        expression={currentQuestion.display}
                        size={isSmallScreen ? 'small' : isLargeScreen ? 'large' : 'medium'}
                        color={theme.text}
                      />
                    </>
                  ) : (
                    <>
                      {/* Extract prefix text (like "Simplify:" or "Förenkla:") */}
                      {currentQuestion.display.includes(':') && (
                        <Text style={[
                          styles.fractionPrefixText,
                          { color: theme.textSecondary },
                          isSmallScreen && { fontSize: 14 }
                        ]}>
                          {currentQuestion.display.split(':')[0]}:
                        </Text>
                      )}
                      <FractionExpression
                        expression={currentQuestion.display.includes(':') 
                          ? currentQuestion.display.split(':')[1].replace('= ?', '').replace('?', '').trim()
                          : currentQuestion.display.replace('= ?', '').replace('?', '').trim()
                        }
                        size={isSmallScreen ? 'small' : isLargeScreen ? 'large' : 'medium'}
                        color={theme.text}
                      />
                      <Text style={[
                        styles.questionText,
                        { color: theme.text },
                        isSmallScreen && { fontSize: 28 }
                      ]}>=</Text>
                    </>
                  )}
                </View>
              ) : (
                <Text 
                  style={[
                    styles.questionText, 
                    { color: theme.text, textAlign: 'center' },
                    isSmallScreen && styles.questionTextCompact,
                    isVerySmallScreen && styles.questionTextVeryCompact,
                    isLargeScreen && { fontSize: 52, marginBottom: 24 }
                  ]}
                  numberOfLines={3}
                  adjustsFontSizeToFit
                  minimumFontScale={0.5}
                >
                  {currentQuestion.display 
                    ? currentQuestion.display.replace('= ?', '=').replace(' ?', '') 
                    : '?'}
                </Text>
              )}
            {/* Answer input area */}
            {currentQuestion.input_type === 'choice' ? (
              <View style={styles.choiceButtonsContainer}>
                {['>', '=', '<'].map((choice) => (
                  <TouchableOpacity
                    key={choice}
                    style={[
                      styles.choiceButton,
                      { 
                        backgroundColor: choiceAnswer === choice ? theme.primary : theme.surface,
                        borderColor: theme.primary,
                      },
                      isSmallScreen && { paddingVertical: 12, paddingHorizontal: 24 },
                      isLargeScreen && { paddingVertical: 20, paddingHorizontal: 40 }
                    ]}
                    onPress={() => setChoiceAnswer(choice)}
                  >
                    <Text style={[
                      styles.choiceButtonText,
                      { color: choiceAnswer === choice ? '#FFFFFF' : theme.text },
                      isSmallScreen && { fontSize: 28 },
                      isLargeScreen && { fontSize: 48 }
                    ]}>
                      {choice}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : currentQuestion.input_type === 'fraction' ? (
              <View style={[
                styles.answerBox, 
                { borderColor: theme.primary, backgroundColor: theme.surface },
                isSmallScreen && styles.answerBoxCompact,
                isVerySmallScreen && styles.answerBoxVeryCompact,
                isLargeScreen && { paddingVertical: 18, paddingHorizontal: 28, borderRadius: 16, borderWidth: 3 }
              ]}>
                <View style={styles.fractionInputContainer}>
                  {/* Numerator */}
                  <Text style={[
                    styles.fractionInputText,
                    { 
                      color: fractionInput.numerator ? theme.text : theme.textMuted,
                      fontSize: isSmallScreen ? 24 : isLargeScreen ? 40 : 32,
                      backgroundColor: activeFractionField === 'numerator' ? theme.primaryLight : 'transparent',
                    },
                  ]}>
                    {fractionInput.numerator || '?'}
                  </Text>
                  {/* Fraction line */}
                  <View style={[
                    styles.fractionInputLine,
                    { 
                      backgroundColor: theme.text,
                      width: isSmallScreen ? 50 : isLargeScreen ? 80 : 60,
                    }
                  ]} />
                  {/* Denominator */}
                  <Text style={[
                    styles.fractionInputText,
                    { 
                      color: fractionInput.denominator ? theme.text : theme.textMuted,
                      fontSize: isSmallScreen ? 24 : isLargeScreen ? 40 : 32,
                      backgroundColor: activeFractionField === 'denominator' ? theme.primaryLight : 'transparent',
                    },
                  ]}>
                    {fractionInput.denominator || '?'}
                  </Text>
                </View>
              </View>
            ) : (
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
            )}
          </Animated.View>

          {/* Feedback Overlay */}
          {showFeedback && (
            <Animated.View style={[
              styles.feedbackOverlay, 
              { 
                opacity: feedbackOpacity,
                transform: [{ scale: scaleAnim }],
              }
            ]}>
              <View style={[
                styles.feedbackIcon,
                { 
                  backgroundColor: lastAnswerCorrect ? theme.success : theme.error,
                  shadowColor: lastAnswerCorrect ? theme.success : theme.error,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.4,
                  shadowRadius: 12,
                  elevation: 8,
                },
              ]}>
                <Ionicons
                  name={lastAnswerCorrect ? 'checkmark' : 'close'}
                  size={80}
                  color="#FFFFFF"
                />
              </View>
              <Text style={[
                styles.feedbackText,
                { color: lastAnswerCorrect ? theme.success : theme.error }
              ]}>
                {lastAnswerCorrect ? '✓ Rätt!' : '✗ Fel'}
              </Text>
            </Animated.View>
          )}
        </View>

        {/* Keyboard Container */}
        <View style={styles.keyboardContainer}>
          {currentQuestion.input_type === 'choice' ? (
            // Choice questions don't need keyboard, just the buttons above
            null
          ) : currentQuestion.input_type === 'fraction' ? (
            <FractionKeyboard
              onNumeratorKey={(key) => handleFractionKeyPress('numerator', key)}
              onDenominatorKey={(key) => handleFractionKeyPress('denominator', key)}
              onDelete={handleFractionDelete}
              onSubmit={handleSubmit}
              submitLabel={t('submit')}
              activeField={activeFractionField}
              onFieldSwitch={setActiveFractionField}
              compact={isSmallScreen}
              large={isLargeScreen}
            />
          ) : (
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
              showNegative={currentQuestion.operation === 'subtraction' || currentQuestion.operation === 'equations' || currentQuestion.operation === 'graphs'}
              showPi={currentQuestion.input_type === 'text' && currentQuestion.operation === 'geometry'}
              compact={isSmallScreen}
              large={isLargeScreen}
              mini={isGraphQuestion(currentQuestion)}
            />
          )}
        </View>
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
    justifyContent: 'flex-end',
  },
  centeredWrapper: {
    flex: 1,
    justifyContent: 'space-between',
  },
  keyboardContainer: {
    paddingTop: 10,
    paddingBottom: 0,
    justifyContent: 'flex-end',
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
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  questionAreaCompact: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  questionCard: {
    flex: 1,
    width: '100%',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 12,
  },
  questionTextCompact: {
    fontSize: 20,
    marginBottom: 10,
  },
  questionTextVeryCompact: {
    fontSize: 18,
    marginBottom: 8,
  },
  fractionQuestionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 8,
  },
  fractionPrefixText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    width: '100%',
    textAlign: 'center',
  },
  choiceButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginVertical: 12,
  },
  choiceButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 2,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceButtonText: {
    fontSize: 36,
    fontWeight: '700',
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
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 999,
  },
  feedbackIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedbackIconCompact: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  feedbackText: {
    fontSize: 28,
    fontWeight: '800',
    marginTop: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  fractionInputContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fractionInputText: {
    fontWeight: '700',
    textAlign: 'center',
    minWidth: 40,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  fractionInputLine: {
    height: 3,
    marginVertical: 4,
    borderRadius: 2,
  },
  diagramQuestionContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  diagramQuestionText: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: -4,
    textAlign: 'center',
  },
  graphQuestionContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 5,
    paddingBottom: 0,
    borderWidth: 2,
    borderColor: 'red',
  },
  graphQuestionText: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
    textAlign: 'center',
  },
  questionAreaGraph: {
    flex: 0,
    paddingTop: 5,
    paddingBottom: 0,
    paddingHorizontal: 8,
    alignSelf: 'flex-start',
    width: '100%',
    borderWidth: 2,
    borderColor: 'blue',
  },
  questionCardGraph: {
    flex: 0,
    paddingTop: 5,
    paddingBottom: 4,
    paddingHorizontal: 8,
    justifyContent: 'flex-start',
    borderWidth: 2,
    borderColor: 'green',
  },
});
