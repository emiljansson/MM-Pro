import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Platform,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useGameStore } from '../src/stores/gameStore';
import { useTheme, useTranslation } from '../src/hooks/useTheme';
import {
  OperationCard,
  DifficultySelector,
  QuestionCountSelector,
  LanguageSelector,
} from '../src/components';

const OPERATIONS = [
  { key: 'addition', symbol: '+' },
  { key: 'subtraction', symbol: '−' },
  { key: 'multiplication', symbol: '×' },
  { key: 'division', symbol: '÷' },
];

const QUESTION_COUNTS = [15, 30, 60, 120];

export default function HomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t, language } = useTranslation();
  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const {
    settings,
    updateSettings,
    startGame,
    isLoading,
    toggleTheme,
    theme: themeMode,
    setLanguage,
    initialize,
  } = useGameStore();

  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Calculate if we need compact mode - also check width for tablets
  const availableHeight = height - insets.top - insets.bottom;
  const isTablet = width > 600;
  const isCompact = availableHeight < 700 && !isTablet; // Only compact on small phones
  const isLargeScreen = isTablet; // Use larger sizes on tablets
  
  // Scale factor for tablets (1.0 for phones, 1.3-1.5 for tablets)
  const scale = isTablet ? 1.4 : 1;

  useEffect(() => {
    const init = async () => {
      await initialize();
      setIsInitialized(true);
    };
    init();
  }, []);

  const operationColors = {
    addition: theme.addition,
    subtraction: theme.subtraction,
    multiplication: theme.multiplication,
    division: theme.division,
  };

  const toggleOperation = (operation: string) => {
    const newOperations = settings.operations.includes(operation)
      ? settings.operations.filter((op) => op !== operation)
      : [...settings.operations, operation];
    updateSettings({ operations: newOperations });
  };

  const handleStartGame = async () => {
    if (settings.operations.length === 0) {
      Alert.alert('', t('select_one_operation'));
      return;
    }
    await startGame();
    router.push('/game');
  };

  const difficultyOptions = [
    { key: 'easy' as const, label: t('easy'), description: t('easy_desc') },
    { key: 'medium' as const, label: t('medium'), description: t('medium_desc') },
    { key: 'hard' as const, label: t('hard'), description: t('hard_desc') },
  ];

  if (!isInitialized) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <StatusBar barStyle={themeMode === 'dark' ? 'light-content' : 'dark-content'} />
      
      {/* Full width wrapper */}
      <View style={styles.centeredWrapper}>
        {/* Header */}
        <View style={[
          styles.header, 
          isCompact && styles.headerCompact,
          isLargeScreen && { paddingHorizontal: 28, paddingVertical: 10 }
        ]}>
          <TouchableOpacity
            style={[
              styles.iconButton, 
              { backgroundColor: theme.card },
              isCompact && styles.iconButtonCompact,
              isLargeScreen && { width: 48, height: 48, borderRadius: 24 }
            ]}
            onPress={toggleTheme}
          >
            <Ionicons
              name={themeMode === 'dark' ? 'sunny' : 'moon'}
              size={isLargeScreen ? 28 : (isCompact ? 20 : 24)}
              color={theme.primary}
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.iconButton, 
              { backgroundColor: theme.card },
              isCompact && styles.iconButtonCompact,
              isLargeScreen && { width: 48, height: 48, borderRadius: 24 }
            ]}
            onPress={() => setShowLanguageSelector(true)}
          >
            <Ionicons name="language" size={isLargeScreen ? 28 : (isCompact ? 20 : 24)} color={theme.primary} />
          </TouchableOpacity>
        </View>

        {/* Main Content */}
        <View style={[
          styles.content, 
          isLargeScreen && { paddingHorizontal: 36, flex: 1, justifyContent: 'space-evenly' }
        ]}>
          {/* Title */}
          <View style={[
            styles.titleContainer, 
            isCompact && styles.titleContainerCompact,
            isLargeScreen && { marginBottom: 24 }
          ]}>
            <Text 
              style={[
                styles.title, 
                { color: theme.primary },
                isCompact && styles.titleCompact,
                isLargeScreen && { fontSize: 42 }
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {t('app_title_part1')}<Text style={{ color: theme.secondary }}>{t('app_title_part2')}</Text>
            </Text>
            <Text style={[
              styles.tagline, 
              { color: theme.textSecondary },
              isCompact && styles.taglineCompact,
              isLargeScreen && { fontSize: 18, marginTop: 8 }
            ]}>
              {t('tagline')}
            </Text>
          </View>

          {/* Operations Section */}
          <View style={[
            styles.section, 
            isCompact && styles.sectionCompact,
            isLargeScreen && { marginBottom: 24 }
          ]}>
            <Text style={[
              styles.sectionTitle, 
              { color: theme.textSecondary },
              isCompact && styles.sectionTitleCompact,
              isLargeScreen && { fontSize: 14, marginBottom: 12 }
            ]}>
              {t('select_operation')}
            </Text>
            <View style={styles.operationsGrid}>
              {OPERATIONS.map((op) => (
                <OperationCard
                  key={op.key}
                  operation={op.key}
                  label={t(op.key)}
                  symbol={op.symbol}
                  selected={settings.operations.includes(op.key)}
                  onPress={() => toggleOperation(op.key)}
                  color={operationColors[op.key as keyof typeof operationColors]}
                  compact={isCompact}
                  large={isLargeScreen}
                />
              ))}
            </View>
          </View>

          {/* Difficulty Section */}
          <View style={[
            styles.section, 
            isCompact && styles.sectionCompact,
            isLargeScreen && { marginBottom: 24 }
          ]}>
            <Text style={[
              styles.sectionTitle, 
              { color: theme.textSecondary },
              isCompact && styles.sectionTitleCompact,
              isLargeScreen && { fontSize: 14, marginBottom: 12 }
            ]}>
              {t('difficulty')}
            </Text>
            <DifficultySelector
              difficulty={settings.difficulty}
              onSelect={(d) => updateSettings({ difficulty: d })}
              options={difficultyOptions}
              compact={isCompact}
              large={isLargeScreen}
            />
          </View>

        {/* Question Count Section */}
        <View style={[
          styles.section, 
          isCompact && styles.sectionCompact,
          isLargeScreen && { marginBottom: 24 }
        ]}>
          <Text style={[
            styles.sectionTitle, 
            { color: theme.textSecondary },
            isCompact && styles.sectionTitleCompact,
            isLargeScreen && { fontSize: 14, marginBottom: 12 }
          ]}>
            {t('question_count')}: {settings.questionCount}
          </Text>
          <QuestionCountSelector
            count={settings.questionCount}
            onSelect={(c) => updateSettings({ questionCount: c })}
            options={QUESTION_COUNTS}
            compact={isCompact}
            large={isLargeScreen}
          />
        </View>

        {/* Start Button */}
        <TouchableOpacity
          style={[
            styles.startButton,
            {
              backgroundColor: settings.operations.length > 0 ? theme.primary : theme.textMuted,
            },
            isCompact && styles.startButtonCompact,
            isLargeScreen && { height: 64, borderRadius: 18 }
          ]}
          onPress={handleStartGame}
          disabled={isLoading || settings.operations.length === 0}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="play" size={isLargeScreen ? 32 : (isCompact ? 20 : 24)} color="#FFFFFF" />
              <Text style={[
                styles.startButtonText, 
                isCompact && styles.startButtonTextCompact,
                isLargeScreen && { fontSize: 24 }
              ]}>{t('start_game')}</Text>
            </>
          )}
        </TouchableOpacity>
        </View>
      </View>

      {/* Language Selector Modal */}
      <LanguageSelector
        visible={showLanguageSelector}
        currentLanguage={language}
        onSelect={(code) => {
          setLanguage(code);
          setShowLanguageSelector(false);
        }}
        onClose={() => setShowLanguageSelector(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centeredWrapper: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  headerCompact: {
    paddingVertical: 4,
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButtonCompact: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    justifyContent: 'space-between',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 10,
  },
  titleContainerCompact: {
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center',
    minWidth: '100%',
  },
  titleCompact: {
    fontSize: 24,
  },
  tagline: {
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  taglineCompact: {
    fontSize: 12,
    marginTop: 2,
  },
  section: {
    marginBottom: 16,
  },
  sectionCompact: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  sectionTitleCompact: {
    fontSize: 10,
    marginBottom: 6,
  },
  operationsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  startButton: {
    flexDirection: 'row',
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  startButtonCompact: {
    height: 44,
    borderRadius: 12,
  },
  startButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  startButtonTextCompact: {
    fontSize: 15,
  },
});
