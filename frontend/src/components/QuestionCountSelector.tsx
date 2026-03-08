import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import * as Haptics from 'expo-haptics';

interface QuestionCountSelectorProps {
  count: number;
  onSelect: (count: number) => void;
  options: number[];
  compact?: boolean;
  large?: boolean;
}

export const QuestionCountSelector: React.FC<QuestionCountSelectorProps> = ({
  count,
  onSelect,
  options,
  compact = false,
  large = false,
}) => {
  const theme = useTheme();

  const handleSelect = (value: number) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onSelect(value);
  };

  return (
    <View style={styles.container}>
      {options.map((option) => (
        <TouchableOpacity
          key={option}
          style={[
            styles.option,
            {
              backgroundColor: count === option ? theme.primary : theme.card,
              borderColor: count === option ? theme.primary : theme.border,
            },
            compact && styles.optionCompact,
            large && styles.optionLarge,
          ]}
          onPress={() => handleSelect(option)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.label,
              { color: count === option ? '#FFFFFF' : theme.text },
              compact && styles.labelCompact,
              large && styles.labelLarge,
            ]}
          >
            {option}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  option: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionCompact: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  optionLarge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
  },
  labelCompact: {
    fontSize: 12,
  },
  labelLarge: {
    fontSize: 20,
  },
});
