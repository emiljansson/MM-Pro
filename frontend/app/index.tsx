import React, { useEffect, useState, useRef } from 'react';
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
  Image,
  ScrollView,
  Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useGameStore } from '../src/stores/gameStore';
import { useTheme, useTranslation, useEffectiveTheme } from '../src/hooks/useTheme';
import { useAuth } from '../src/contexts';
import {
  DifficultySelector,
  QuestionCountSelector,
  LanguageSelector,
} from '../src/components';

// All 13 categories with their properties - All categories are free
const ALL_CATEGORIES = [
  { key: 'addition', symbol: '+', icon: 'add-circle', color: '#81D4FA' },
  { key: 'subtraction', symbol: '−', icon: 'remove-circle', color: '#FFB74D' },
  { key: 'multiplication', symbol: '×', icon: 'close-circle', color: '#CE93D8' },
  { key: 'division', symbol: '÷', icon: 'git-compare', color: '#A5D6A7' },
  { key: 'fractions', symbol: '½', icon: 'pie-chart', color: '#F48FB1' },
  { key: 'equations', symbol: 'x', icon: 'code-working', color: '#90CAF9' },
  { key: 'geometry', symbol: '△', icon: 'shapes', color: '#B39DDB' },
  { key: 'percentage', symbol: '%', icon: 'analytics', color: '#FFCC80' },
  { key: 'units', symbol: 'm', icon: 'resize', color: '#80DEEA' },
  { key: 'rounding', symbol: '≈', icon: 'swap-horizontal', color: '#BCAAA4' },
  { key: 'angles', symbol: '∠', icon: 'compass', color: '#EF9A9A' },
  { key: 'probability', symbol: 'P', icon: 'dice', color: '#C5E1A5' },
  { key: 'diagrams', symbol: '📊', icon: 'bar-chart', color: '#FFF59D' },
];

const QUESTION_COUNTS = [15, 30, 60, 120];
const ITEMS_PER_PAGE_PHONE = 4;
const ITEMS_PER_PAGE_TABLET = 10;

export default function HomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const effectiveTheme = useEffectiveTheme();
  const { t, language } = useTranslation();
  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated } = useAuth();
  const {
    settings,
    updateSettings,
    startGame,
    isLoading,
    setLanguage,
    initialize,
  } = useGameStore();

  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  // Calculate layout
  const availableHeight = height - insets.top - insets.bottom;
  const isTablet = width > 600;
  const isCompact = availableHeight < 700 && !isTablet;
  const isLargeScreen = isTablet;
  
  // Scale factor for different screen sizes
  const scale = isTablet ? Math.min(1.4, width / 600) : 1;
  
  // Dynamic spacing based on available height
  const dynamicSpacing = {
    sectionMargin: isTablet ? Math.min(8, availableHeight * 0.01) : (isCompact ? 8 : 12),
    titleMargin: isTablet ? Math.min(16, availableHeight * 0.02) : (isCompact ? 12 : 20),
    contentPadding: isTablet ? 24 : 16,
  };

  // Items per page: 6 for tablet (2x3 grid), 4 for phone (2x2 grid)
  const itemsPerPage = isTablet ? ITEMS_PER_PAGE_TABLET : ITEMS_PER_PAGE_PHONE;
  
  // Calculate pages - use full width for scroll container
  const totalPages = Math.ceil(ALL_CATEGORIES.length / itemsPerPage);
  const pageWidth = width; // Full screen width for paging

  useEffect(() => {
    const init = async () => {
      await initialize();
      setIsInitialized(true);
    };
    init();
  }, []);

  // Categories that don't support difficulty levels (mix only)
  const MIXED_DIFFICULTY_CATEGORIES = ['diagrams'];
  
  // Check if difficulty selector should be disabled
  const isDifficultyDisabled = settings.operations.length > 0 && 
    settings.operations.every(op => MIXED_DIFFICULTY_CATEGORIES.includes(op));

  const toggleOperation = (operation: string) => {
    // All categories are free - no pro check needed
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

  const goToPage = (page: number) => {
    if (page >= 0 && page < totalPages) {
      setCurrentPage(page);
      scrollViewRef.current?.scrollTo({ x: page * pageWidth, animated: true });
    }
  };

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const newPage = Math.round(offsetX / pageWidth);
    if (newPage !== currentPage && newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage);
    }
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

  // Render a single category card
  const renderCategoryCard = (category: typeof ALL_CATEGORIES[0], index: number) => {
    const isSelected = settings.operations.includes(category.key);
    // Calculate card width: (page width - 2*padding - gap) / 2 - 5px smaller
    const cardGap = isTablet ? 6 : 10;
    const cardWidth = (width - 32 - cardGap) / 2 - 5;
    // Use fixed height for tablets - for 5 rows
    const cardHeight = isTablet ? 95 : undefined;
    // Android: 1.3, iOS: 1.1 (taller cards)
    const cardAspectRatio = isTablet ? undefined : Platform.OS === 'android' ? 1.3 : 1.1;

    return (
      <TouchableOpacity
        key={category.key}
        style={[
          styles.categoryCard,
          {
            width: cardWidth,
            height: cardHeight,
            aspectRatio: cardAspectRatio,
            backgroundColor: isSelected ? category.color : theme.card,
            borderColor: isSelected ? category.color : theme.border,
            padding: isTablet ? 6 : 10,
          },
        ]}
        onPress={() => toggleOperation(category.key)}
        activeOpacity={0.7}
      >
        {isSelected && (
          <View style={styles.selectedBadge}>
            <Ionicons name="checkmark-circle" size={isTablet ? 14 : 18} color="#FFFFFF" />
          </View>
        )}
        <View style={[
          styles.categoryIconContainer,
          { 
            backgroundColor: isSelected ? 'rgba(255,255,255,0.3)' : category.color + '30',
            width: isTablet ? 48 : 48,
            height: isTablet ? 48 : 48,
            borderRadius: isTablet ? 24 : 24,
            marginBottom: isTablet ? 4 : 8,
          }
        ]}>
          {category.key === 'fractions' ? (
            // Custom vertical fraction display for fractions category
            <View style={styles.fractionIconContainer}>
              <Text style={[
                styles.fractionIconNumber,
                { color: isSelected ? '#FFFFFF' : category.color }
              ]}>1</Text>
              <View style={[
                styles.fractionIconLine,
                { backgroundColor: isSelected ? '#FFFFFF' : category.color }
              ]} />
              <Text style={[
                styles.fractionIconNumber,
                { color: isSelected ? '#FFFFFF' : category.color }
              ]}>2</Text>
            </View>
          ) : (
            <Text style={[
              styles.categorySymbol,
              { 
                color: isSelected ? '#FFFFFF' : category.color,
                fontSize: isTablet ? 24 : 24,
              }
            ]}>
              {category.symbol}
            </Text>
          )}
        </View>
        <Text style={[
          styles.categoryName,
          { 
            color: isSelected ? '#FFFFFF' : theme.text,
            fontSize: isTablet ? 20 : 13,
          }
        ]}>
          {t(category.key)}
        </Text>
      </TouchableOpacity>
    );
  };

  // Render a page of categories (10 items in 2x5 grid for tablet, 4 items in 2x2 grid for phone)
  const renderPage = (pageIndex: number) => {
    const startIndex = pageIndex * itemsPerPage;
    const pageCategories = ALL_CATEGORIES.slice(startIndex, startIndex + itemsPerPage);

    return (
      <View key={pageIndex} style={[
        styles.page, 
        { width: pageWidth },
        isTablet ? { paddingHorizontal: 16 } : { paddingLeft: 21, paddingRight: 16 }
      ]}>
        <View style={[
          styles.categoryGrid,
          isTablet && { gap: 6 }
        ]}>
          {pageCategories.map((cat, idx) => renderCategoryCard(cat, startIndex + idx))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <StatusBar barStyle={effectiveTheme === 'dark' ? 'light-content' : 'dark-content'} />

      <View style={styles.centeredWrapper}>
        {/* Header */}
        <View style={[styles.header, isCompact && styles.headerCompact]}>
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: theme.card }]}
            onPress={() => setShowLanguageSelector(true)}
          >
            <Ionicons name="language" size={isCompact ? 20 : 24} color={theme.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: theme.card }]}
            onPress={() => isAuthenticated ? router.push('/profile') : router.push('/login')}
          >
            {isAuthenticated && user?.picture ? (
              <Image source={{ uri: user.picture }} style={styles.profileImage} />
            ) : (
              <Ionicons 
                name={isAuthenticated ? 'person' : 'log-in-outline'} 
                size={isCompact ? 20 : 24} 
                color={theme.primary} 
              />
            )}
          </TouchableOpacity>
        </View>

        {/* Main Content */}
        <ScrollView 
          style={styles.mainScroll}
          contentContainerStyle={[
            styles.mainScrollContent,
            isTablet && { paddingHorizontal: dynamicSpacing.contentPadding }
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Title */}
          <View style={[
            styles.titleContainer, 
            isCompact && styles.titleContainerCompact,
            isTablet && { marginBottom: dynamicSpacing.titleMargin }
          ]}>
            <Text 
              style={[
                styles.title, 
                { color: theme.primary }, 
                isCompact && styles.titleCompact,
                isTablet && { fontSize: 32 * scale }
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.5}
            >
              <Text style={{ fontWeight: '400' }}>{t('app_title_part1')}</Text>
              <Text style={{ fontWeight: '800' }}>{t('app_title_part2')}</Text>
            </Text>
            <Text style={[
              styles.tagline, 
              { color: theme.textSecondary }, 
              isCompact && styles.taglineCompact,
              isTablet && { fontSize: 14 * scale }
            ]}>
              {t('tagline')}
            </Text>
          </View>

          {/* Spacer to push categories down */}
          <View style={{ height: Platform.OS === 'android' ? 5 : Platform.OS === 'ios' ? 5 : 20 }} />

          {/* Categories Section */}
          <View style={[
            styles.section, 
            isCompact && styles.sectionCompact,
            isTablet && { marginBottom: dynamicSpacing.sectionMargin }
          ]}>
            <Text style={[
              styles.sectionTitle, 
              { color: theme.textMuted }, 
              isCompact && styles.sectionTitleCompact,
              isTablet && { fontSize: 12, marginBottom: 8 }
            ]}>
              {t('select_operation')}
            </Text>
            
            {/* Horizontal Scroll */}
            <ScrollView
              ref={scrollViewRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={handleScroll}
              scrollEventThrottle={16}
              style={styles.categoriesScroll}
              contentContainerStyle={styles.categoriesScrollContent}
              snapToInterval={width}
              snapToAlignment="start"
              decelerationRate="fast"
            >
              {Array.from({ length: totalPages }).map((_, idx) => renderPage(idx))}
            </ScrollView>

            {/* Navigation Arrows & Page Indicators */}
            <View style={[
              styles.navigationContainer,
              isTablet && { marginTop: 8, marginBottom: 8 }
            ]}>
              <TouchableOpacity
                style={[
                  styles.navArrow,
                  { backgroundColor: theme.card },
                  currentPage === 0 && styles.navArrowDisabled,
                  isTablet && { width: 36, height: 36, borderRadius: 18 }
                ]}
                onPress={() => goToPage(currentPage - 1)}
                disabled={currentPage === 0}
              >
                <Ionicons 
                  name="chevron-back" 
                  size={isTablet ? 22 : 24} 
                  color={currentPage === 0 ? theme.textMuted : theme.primary} 
                />
              </TouchableOpacity>

              <View style={styles.pageIndicators}>
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => goToPage(idx)}
                    style={[
                      styles.pageIndicator,
                      { backgroundColor: idx === currentPage ? theme.primary : theme.border },
                      isTablet && { width: 8, height: 8, marginHorizontal: 4 }
                    ]}
                  />
                ))}
              </View>

              <TouchableOpacity
                style={[
                  styles.navArrow,
                  { backgroundColor: theme.card },
                  currentPage === totalPages - 1 && styles.navArrowDisabled,
                  isTablet && { width: 36, height: 36, borderRadius: 18 }
                ]}
                onPress={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages - 1}
              >
                <Ionicons 
                  name="chevron-forward" 
                  size={isTablet ? 28 : 24} 
                  color={currentPage === totalPages - 1 ? theme.textMuted : theme.primary} 
                />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Fixed bottom section - Difficulty, Question Count & Start Button */}
        <View style={[
          styles.fixedBottomSection,
          { backgroundColor: theme.background },
          isTablet && { paddingHorizontal: 24 }
        ]}>
          {/* Difficulty Section */}
          <View style={[
            styles.section, 
            isCompact && styles.sectionCompact,
            { marginBottom: isTablet ? 8 : 6 }
          ]}>
            <Text style={[
              styles.sectionTitle, 
              { color: isDifficultyDisabled ? theme.primary : theme.textMuted }, 
              isCompact && styles.sectionTitleCompact,
              isTablet && { fontSize: 12, marginBottom: 8 }
            ]}>
              {t('difficulty')}{isDifficultyDisabled ? ' (mix)' : ''}
            </Text>
            <DifficultySelector
              options={difficultyOptions}
              difficulty={settings.difficulty}
              onSelect={(difficulty) => updateSettings({ difficulty })}
              compact={isCompact}
              disabled={isDifficultyDisabled}
            />
          </View>

          {/* Question Count Section */}
          <View style={[
            styles.section, 
            isCompact && styles.sectionCompact,
            { marginBottom: isTablet ? 20 : 12 }
          ]}>
            <Text style={[
              styles.sectionTitle, 
              { color: theme.textMuted }, 
              isCompact && styles.sectionTitleCompact,
              isTablet && { fontSize: 12, marginBottom: 8 }
            ]}>
              {t('question_count')}: {settings.questionCount}
            </Text>
            <QuestionCountSelector
              options={QUESTION_COUNTS}
              count={settings.questionCount}
              onSelect={(count) => updateSettings({ questionCount: count })}
              compact={isCompact}
            />
          </View>

          {/* Start Button */}
          <TouchableOpacity
            style={[
              styles.startButton,
              { 
                backgroundColor: settings.operations.length > 0 ? theme.success : theme.textMuted,
                opacity: settings.operations.length > 0 ? 1 : 0.6,
              },
              isCompact && styles.startButtonCompact,
              Platform.OS === 'android' && { marginTop: 'auto' }
            ]}
            onPress={handleStartGame}
            disabled={isLoading || settings.operations.length === 0}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="play" size={isCompact ? 20 : 24} color="#FFFFFF" />
                <Text style={[styles.startButtonText, isCompact && styles.startButtonTextCompact]}>
                  {settings.operations.length > 0 
                    ? t('start_game') 
                    : t('select_category') || 'Välj kategori'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Language Selector Modal */}
      <LanguageSelector
        visible={showLanguageSelector}
        onClose={() => setShowLanguageSelector(false)}
        currentLanguage={language}
        onSelect={(code) => {
          setLanguage(code);
          setShowLanguageSelector(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centeredWrapper: {
    flex: 1,
    justifyContent: 'space-between',
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
  profileImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  mainScroll: {
    flex: 1,
  },
  mainScrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  titleContainerCompact: {
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center',
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
    marginBottom: 12,
    ...Platform.select({
      ios: {
        marginBottom: 4,
      },
    }),
  },
  sectionCompact: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  sectionTitleCompact: {
    fontSize: 10,
    marginBottom: 8,
  },
  categoriesScroll: {
    marginHorizontal: -16,
  },
  categoriesScrollContent: {
    // No padding here, handled by page
  },
  page: {
    alignItems: 'flex-start',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 10,
  },
  categoryCard: {
    aspectRatio: 1.7,
    borderRadius: 16,
    borderWidth: 2,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  lockedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
    padding: 4,
  },
  categoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categorySymbol: {
    fontSize: 24,
    fontWeight: '700',
  },
  fractionIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fractionIconNumber: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 16,
  },
  fractionIconLine: {
    width: 16,
    height: 2,
    marginVertical: 1,
    borderRadius: 1,
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  navigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    ...Platform.select({
      ios: {
        marginTop: 0,
      },
      android: {
        marginTop: 0,
      },
      default: {
        marginTop: 20,
      },
    }),
  },
  navArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navArrowDisabled: {
    opacity: 0.5,
  },
  pageIndicators: {
    flexDirection: 'row',
    gap: 8,
  },
  pageIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  fixedBottomSection: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 24,
    ...Platform.select({
      android: {
        marginTop: 0,
        paddingTop: 8,
        paddingBottom: 12,
      },
    }),
  },
  startButton: {
    flexDirection: 'row',
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 0,
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
