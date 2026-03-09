import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  DifficultySelector,
  QuestionCountSelector,
  LanguageSelector,
} from '../index';

interface HomeLayoutIOSProps {
  // Theme & Translation
  theme: any;
  t: (key: string) => string;
  
  // Screen info
  isSmallScreen: boolean;
  isCompact: boolean;
  isTablet: boolean;
  isLargeScreen: boolean;
  scale: number;
  dynamicSpacing: any;
  insets: any;
  
  // User
  user: any;
  isAuthenticated: boolean;
  
  // Categories
  categories: any[];
  currentPage: number;
  totalPages: number;
  selectedCategory: any;
  scrollViewRef: any;
  scrollX: any;
  itemsPerPage: number;
  
  // Settings
  settings: any;
  
  // Handlers
  onCategorySelect: (category: any) => void;
  onPageChange: (direction: 'prev' | 'next') => void;
  onScroll: (event: any) => void;
  onDifficultyChange: (difficulty: string) => void;
  onQuestionCountChange: (count: number) => void;
  onStartGame: () => void;
  onProfilePress: () => void;
  
  // Constants
  questionCounts: number[];
}

export const HomeLayoutIOS: React.FC<HomeLayoutIOSProps> = ({
  theme,
  t,
  isSmallScreen,
  isCompact,
  isTablet,
  isLargeScreen,
  scale,
  dynamicSpacing,
  insets,
  user,
  isAuthenticated,
  categories,
  currentPage,
  totalPages,
  selectedCategory,
  scrollViewRef,
  scrollX,
  itemsPerPage,
  settings,
  onCategorySelect,
  onPageChange,
  onScroll,
  onDifficultyChange,
  onQuestionCountChange,
  onStartGame,
  onProfilePress,
  questionCounts,
}) => {
  const cardWidth = isTablet ? 90 : isSmallScreen ? 70 : 80;
  const cardHeight = isTablet ? 100 : isSmallScreen ? 80 : 90;
  
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[
        styles.header,
        isCompact && styles.headerCompact,
        isTablet && { paddingHorizontal: 24 }
      ]}>
        <LanguageSelector compact={isCompact} />
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={onProfilePress}
            style={[styles.profileButton, { backgroundColor: theme.surface }]}
          >
            {isAuthenticated && user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.profileImage} />
            ) : (
              <Ionicons
                name={isAuthenticated ? "person" : "person-outline"}
                size={isCompact ? 20 : 24}
                color={theme.primary}
              />
            )}
          </TouchableOpacity>
        </View>
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

        {/* Spacer */}
        <View style={{ height: 20 }} />

        {/* Categories Section */}
        <View style={[
          styles.section, 
          isCompact && styles.sectionCompact,
          isTablet && { marginBottom: dynamicSpacing.sectionMargin }
        ]}>
          <Text style={[
            styles.sectionTitle, 
            { color: theme.textSecondary }, 
            isCompact && styles.sectionTitleCompact,
            isTablet && { fontSize: 13 * scale }
          ]}>
            {t('select_operation')}
          </Text>
          
          {/* Category ScrollView */}
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
            style={styles.categoriesScroll}
            contentContainerStyle={styles.categoriesContent}
          >
            {Array.from({ length: totalPages }).map((_, pageIndex) => (
              <View key={pageIndex} style={styles.categoryPage}>
                {categories
                  .slice(pageIndex * itemsPerPage, (pageIndex + 1) * itemsPerPage)
                  .map((category) => (
                    <TouchableOpacity
                      key={category.key}
                      onPress={() => onCategorySelect(category)}
                      style={[
                        styles.categoryCard,
                        {
                          width: cardWidth,
                          height: cardHeight,
                          backgroundColor: theme.surface,
                          borderColor: selectedCategory?.key === category.key ? category.color : theme.border,
                          borderWidth: selectedCategory?.key === category.key ? 2 : 1,
                        },
                      ]}
                    >
                      <View style={[
                        styles.categoryIconBg,
                        { backgroundColor: category.color + '30' }
                      ]}>
                        <Text style={[
                          styles.categorySymbol,
                          { color: category.color },
                          isSmallScreen && { fontSize: 20 }
                        ]}>
                          {category.symbol}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.categoryName,
                          { color: theme.text },
                          isSmallScreen && styles.categoryNameCompact
                        ]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                      >
                        {t(category.key)}
                      </Text>
                    </TouchableOpacity>
                  ))}
              </View>
            ))}
          </ScrollView>

          {/* Navigation */}
          <View style={styles.navigationContainer}>
            <TouchableOpacity
              onPress={() => onPageChange('prev')}
              disabled={currentPage === 0}
              style={[
                styles.navArrow,
                { backgroundColor: theme.surface },
                currentPage === 0 && styles.navArrowDisabled,
              ]}
            >
              <Ionicons name="chevron-back" size={24} color={theme.text} />
            </TouchableOpacity>

            <View style={styles.pageIndicators}>
              {Array.from({ length: totalPages }).map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.pageIndicator,
                    {
                      backgroundColor: index === currentPage ? theme.primary : theme.border,
                      width: index === currentPage ? 20 : 8,
                    },
                  ]}
                />
              ))}
            </View>

            <TouchableOpacity
              onPress={() => onPageChange('next')}
              disabled={currentPage === totalPages - 1}
              style={[
                styles.navArrow,
                { backgroundColor: theme.surface },
                currentPage === totalPages - 1 && styles.navArrowDisabled,
              ]}
            >
              <Ionicons name="chevron-forward" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Fixed Bottom Section */}
      <View style={[
        styles.fixedBottomSection,
        { backgroundColor: theme.background },
        isTablet && { paddingHorizontal: 24 }
      ]}>
        {/* Difficulty */}
        <View style={[styles.section, isCompact && styles.sectionCompact, { marginBottom: isTablet ? 8 : 6 }]}>
          <Text style={[
            styles.sectionTitle,
            { color: theme.textSecondary },
            isCompact && styles.sectionTitleCompact
          ]}>
            {t('difficulty')}
          </Text>
          <DifficultySelector
            value={settings.difficulty}
            onChange={onDifficultyChange}
            compact={isCompact}
            large={isLargeScreen}
          />
        </View>

        {/* Question Count */}
        <View style={[styles.section, isCompact && styles.sectionCompact, { marginBottom: isTablet ? 20 : 12 }]}>
          <Text style={[
            styles.sectionTitle,
            { color: theme.textSecondary },
            isCompact && styles.sectionTitleCompact
          ]}>
            {t('question_count')}
          </Text>
          <QuestionCountSelector
            counts={questionCounts}
            value={settings.questionCount}
            onChange={onQuestionCountChange}
            compact={isCompact}
            large={isLargeScreen}
          />
        </View>

        {/* Start Button */}
        <TouchableOpacity
          style={[
            styles.startButton,
            { backgroundColor: theme.primary },
            isCompact && styles.startButtonCompact,
            isTablet && { paddingVertical: 18, borderRadius: 16 }
          ]}
          onPress={onStartGame}
        >
          <Ionicons name="play" size={isCompact ? 22 : 26} color="#FFFFFF" />
          <Text style={[
            styles.startButtonText,
            isCompact && styles.startButtonTextCompact
          ]}>
            {t('start_game')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerCompact: {
    paddingVertical: 4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    marginBottom: 16,
  },
  titleContainerCompact: {
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  titleCompact: {
    fontSize: 22,
  },
  tagline: {
    fontSize: 12,
    marginTop: 2,
  },
  taglineCompact: {
    fontSize: 10,
  },
  section: {
    marginBottom: 12,
  },
  sectionCompact: {
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    textAlign: 'center',
  },
  sectionTitleCompact: {
    fontSize: 10,
    marginBottom: 4,
  },
  categoriesScroll: {
    marginHorizontal: -16,
  },
  categoriesContent: {
    paddingHorizontal: 0,
  },
  categoryPage: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 16,
  },
  categoryCard: {
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  categorySymbol: {
    fontSize: 24,
    fontWeight: '700',
  },
  categoryName: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  categoryNameCompact: {
    fontSize: 9,
  },
  navigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -10,
    gap: 16,
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
    height: 8,
    borderRadius: 4,
  },
  fixedBottomSection: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 24,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 10,
  },
  startButtonCompact: {
    paddingVertical: 12,
    borderRadius: 12,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  startButtonTextCompact: {
    fontSize: 15,
  },
});
