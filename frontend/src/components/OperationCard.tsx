import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import * as Haptics from 'expo-haptics';

interface OperationCardProps {
  operation: string;
  label: string;
  symbol: string;
  selected: boolean;
  onPress: () => void;
  color: string;
  compact?: boolean;
  large?: boolean;
}

export const OperationCard: React.FC<OperationCardProps> = ({
  operation,
  label,
  symbol,
  selected,
  onPress,
  color,
  compact = false,
  large = false,
}) => {
  const theme = useTheme();

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: selected ? color : theme.card,
          borderColor: selected ? color : theme.border,
        },
        compact && styles.cardCompact,
        large && styles.cardLarge,
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={[
        styles.iconContainer,
        { backgroundColor: selected ? 'rgba(255,255,255,0.3)' : `${color}20` },
        compact && styles.iconContainerCompact,
        large && styles.iconContainerLarge,
      ]}>
        <Text style={[
          styles.symbolText,
          { color: selected ? '#FFFFFF' : color },
          compact && styles.symbolTextCompact,
          large && styles.symbolTextLarge,
        ]}>
          {symbol}
        </Text>
      </View>
      <Text
        style={[
          styles.label,
          { color: selected ? '#FFFFFF' : theme.text },
          compact && styles.labelCompact,
          large && styles.labelLarge,
        ]}
      >
        {label}
      </Text>
      {selected && (
        <View style={[styles.checkmark, large && styles.checkmarkLarge]}>
          <Ionicons name="checkmark-circle" size={large ? 28 : (compact ? 16 : 20)} color="#FFFFFF" />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '47%',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 8,
    alignItems: 'center',
    position: 'relative',
  },
  cardCompact: {
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: 10,
    marginBottom: 6,
  },
  cardLarge: {
    paddingVertical: 18,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 3,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  iconContainerCompact: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginBottom: 2,
  },
  iconContainerLarge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginBottom: 8,
  },
  symbolText: {
    fontSize: 24,
    fontWeight: '700',
  },
  symbolTextCompact: {
    fontSize: 20,
  },
  symbolTextLarge: {
    fontSize: 34,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  labelCompact: {
    fontSize: 11,
  },
  labelLarge: {
    fontSize: 18,
  },
  checkmark: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  checkmarkLarge: {
    top: 12,
    right: 12,
  },
});
