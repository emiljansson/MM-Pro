import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import * as Haptics from 'expo-haptics';

interface DifficultyOption {
  key: 'easy' | 'medium' | 'hard';
  label: string;
  description: string;
}

interface DifficultySelectorProps {
  difficulty: 'easy' | 'medium' | 'hard';
  onSelect: (difficulty: 'easy' | 'medium' | 'hard') => void;
  options: DifficultyOption[];
  compact?: boolean;
  large?: boolean;
}

export const DifficultySelector: React.FC<DifficultySelectorProps> = ({
  difficulty,
  onSelect,
  options,
  compact = false,
  large = false,
}) => {
  const theme = useTheme();

  const handleSelect = (key: 'easy' | 'medium' | 'hard') => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onSelect(key);
  };

  return (
    <View style={styles.container}>
      {options.map((option) => (
        <TouchableOpacity
          key={option.key}
          style={[
            styles.option,
            {
              backgroundColor: difficulty === option.key ? theme.primary : theme.card,
              borderColor: difficulty === option.key ? theme.primary : theme.border,
            },
            compact && styles.optionCompact,
            large && styles.optionLarge,
          ]}
          onPress={() => handleSelect(option.key)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.label,
              { color: difficulty === option.key ? '#FFFFFF' : theme.text },
              compact && styles.labelCompact,
              large && styles.labelLarge,
            ]}
          >
            {option.label}
          </Text>
          <Text
            style={[
              styles.description,
              { color: difficulty === option.key ? 'rgba(255,255,255,0.8)' : theme.textSecondary },
              compact && styles.descriptionCompact,
              large && styles.descriptionLarge,
            ]}
          >
            {option.description}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  option: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    borderWidth: 2,
    marginHorizontal: 2,
    alignItems: 'center',
  },
  optionCompact: {
    paddingVertical: 6,
    paddingHorizontal: 3,
    borderRadius: 6,
  },
  optionLarge: {
    paddingVertical: 16,
    paddingHorizontal: 10,
    borderRadius: 14,
    marginHorizontal: 6,
    borderWidth: 3,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 1,
  },
  labelCompact: {
    fontSize: 11,
  },
  labelLarge: {
    fontSize: 18,
    marginBottom: 2,
  },
  description: {
    fontSize: 10,
    fontWeight: '500',
  },
  descriptionCompact: {
    fontSize: 9,
  },
  descriptionLarge: {
    fontSize: 14,
  },
});
