import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useTranslation } from '../hooks/useTheme';
import { ALL_CATEGORIES, ITEMS_PER_PAGE } from '../constants';

interface CategoryGridProps {
  selectedOperations: string[];
  onToggleOperation: (operation: string) => void;
  currentPage: number;
  onPageChange: (page: number) => void;
  scrollViewRef: React.RefObject<ScrollView>;
  pageWidth: number;
  isCompact?: boolean;
  isLargeScreen?: boolean;
}

export const CategoryGrid: React.FC<CategoryGridProps> = ({
  selectedOperations,
  onToggleOperation,
  currentPage,
  onPageChange,
  scrollViewRef,
  pageWidth,
  isCompact = false,
  isLargeScreen = false,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  
  const totalPages = Math.ceil(ALL_CATEGORIES.length / ITEMS_PER_PAGE);

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const newPage = Math.round(offsetX / pageWidth);
    if (newPage !== currentPage && newPage >= 0 && newPage < totalPages) {
      onPageChange(newPage);
    }
  };

  const goToPage = (page: number) => {
    if (page >= 0 && page < totalPages) {
      onPageChange(page);
      scrollViewRef.current?.scrollTo({ x: page * pageWidth, animated: true });
    }
  };

  const renderCategoryCard = (category: typeof ALL_CATEGORIES[0]) => {
    const isSelected = selectedOperations.includes(category.key);
    const cardWidth = (pageWidth - 48) / 2;

    return (
      <TouchableOpacity
        key={category.key}
        style={[
          styles.categoryCard,
          {
            width: cardWidth,
            backgroundColor: isSelected ? category.color : theme.card,
            borderColor: isSelected ? category.color : theme.border,
          },
        ]}
        onPress={() => onToggleOperation(category.key)}
        activeOpacity={0.7}
      >
        {isSelected && (
          <View style={styles.selectedBadge}>
            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
          </View>
        )}
        <View style={[styles.categoryIconContainer, { backgroundColor: isSelected ? 'rgba(255,255,255,0.3)' : category.color + '30' }]}>
          <Text style={[styles.categorySymbol, { color: isSelected ? '#FFFFFF' : category.color }]}>
            {category.symbol}
          </Text>
        </View>
        <Text style={[styles.categoryName, { color: isSelected ? '#FFFFFF' : theme.text }]}>
          {t(category.key) || category.key}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderPage = (pageIndex: number) => {
    const startIdx = pageIndex * ITEMS_PER_PAGE;
    const pageCategories = ALL_CATEGORIES.slice(startIdx, startIdx + ITEMS_PER_PAGE);

    return (
      <View key={pageIndex} style={[styles.page, { width: pageWidth }]}>
        <View style={styles.categoryGrid}>
          {pageCategories.map(renderCategoryCard)}
        </View>
      </View>
    );
  };

  return (
    <View>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        style={styles.categoriesScroll}
      >
        {Array.from({ length: totalPages }).map((_, idx) => renderPage(idx))}
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navigationContainer}>
        <TouchableOpacity
          style={[styles.navArrow, { backgroundColor: theme.card }, currentPage === 0 && styles.navArrowDisabled]}
          onPress={() => goToPage(currentPage - 1)}
          disabled={currentPage === 0}
        >
          <Ionicons name="chevron-back" size={24} color={currentPage === 0 ? theme.textMuted : theme.primary} />
        </TouchableOpacity>

        <View style={styles.pageIndicators}>
          {Array.from({ length: totalPages }).map((_, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => goToPage(idx)}
              style={[styles.pageIndicator, { backgroundColor: idx === currentPage ? theme.primary : theme.border }]}
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.navArrow, { backgroundColor: theme.card }, currentPage === totalPages - 1 && styles.navArrowDisabled]}
          onPress={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages - 1}
        >
          <Ionicons name="chevron-forward" size={24} color={currentPage === totalPages - 1 ? theme.textMuted : theme.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  categoriesScroll: {
    flexGrow: 0,
  },
  page: {
    paddingHorizontal: 16,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  categoryCard: {
    aspectRatio: 1.3,
    borderRadius: 16,
    borderWidth: 2,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
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
  categoryName: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  navigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -12,
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
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
