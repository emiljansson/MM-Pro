import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useTranslation } from '../hooks/useTheme';

interface StartButtonProps {
  onPress: () => void;
  isLoading: boolean;
  hasSelectedCategories: boolean;
  isCompact?: boolean;
}

export const StartButton: React.FC<StartButtonProps> = ({
  onPress,
  isLoading,
  hasSelectedCategories,
  isCompact = false,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <TouchableOpacity
      style={[
        styles.startButton,
        {
          backgroundColor: hasSelectedCategories ? theme.success : theme.textMuted,
          opacity: hasSelectedCategories ? 1 : 0.6,
        },
        isCompact && styles.startButtonCompact,
      ]}
      onPress={onPress}
      disabled={isLoading || !hasSelectedCategories}
    >
      {isLoading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <>
          <Ionicons name="play" size={isCompact ? 20 : 24} color="#FFFFFF" />
          <Text style={[styles.startButtonText, isCompact && styles.startButtonTextCompact]}>
            {hasSelectedCategories ? t('start_game') : t('select_category')}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    marginHorizontal: 16,
    marginTop: 8,
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
    fontSize: 16,
  },
});
