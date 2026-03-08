import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import * as Haptics from 'expo-haptics';

type KeyboardMode = 
  | 'standard'       // Just numbers
  | 'decimal'        // Numbers + decimal point
  | 'fraction'       // Numbers + fraction separator (/)
  | 'negative'       // Numbers + negative sign
  | 'equation'       // Numbers + operators (+, -, ×, ÷)
  | 'mixed';         // Numbers + decimal + negative

interface NumericKeyboardProps {
  onKeyPress: (key: string) => void;
  onDelete: () => void;
  onSubmit: () => void;
  submitLabel: string;
  showDecimal?: boolean;
  showDivision?: boolean;
  showNegative?: boolean;
  showFraction?: boolean;
  showOperators?: boolean;
  showPi?: boolean;
  mode?: KeyboardMode;
  compact?: boolean;
  large?: boolean;
  mini?: boolean;
  graph?: boolean;
  disabled?: boolean;
}

export const NumericKeyboard: React.FC<NumericKeyboardProps> = ({
  onKeyPress,
  onDelete,
  onSubmit,
  submitLabel,
  showDecimal = false,
  showDivision = false,
  showNegative = false,
  showFraction = false,
  showOperators = false,
  showPi = false,
  mode = 'standard',
  compact = false,
  large = false,
  mini = false,
  graph = false,
  disabled = false,
}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  
  // Calculate bottom padding: safe area inset for navigation bar
  const bottomPadding = mini ? 4 : Math.max(12, insets.bottom);
  
  // Dynamic sizes based on screen size
  const keyHeight = graph ? 47 : (mini ? 36 : (large ? 60 : (compact ? 40 : 52)));
  const keyFontSize = graph ? 25 : (mini ? 18 : (large ? 32 : (compact ? 20 : 24)));
  const submitHeight = graph ? 49 : (mini ? 38 : (large ? 64 : (compact ? 42 : 54)));
  const submitFontSize = graph ? 16 : (mini ? 14 : (large ? 22 : (compact ? 16 : 19)));
  const iconSize = graph ? 22 : (mini ? 18 : (large ? 32 : (compact ? 20 : 26)));
  const rowMargin = graph ? 5 : (mini ? 2 : (large ? 10 : (compact ? 4 : 8)));
  const containerPadding = graph ? 16 : (mini ? 8 : (large ? 24 : 16));

  // Determine special key based on mode or individual props
  // Always show decimal point by default
  const getSpecialKey = (): { value: string; icon?: string } | null => {
    if (showPi) return { value: 'π' };
    if (mode === 'fraction' || showFraction) return { value: '/' };
    if (mode === 'negative' || showNegative) return { value: '-' };
    if (showDivision) return { value: '÷' };
    // Default to decimal point
    return { value: '.' };
  };

  const specialKey = getSpecialKey();

  const handleKeyPress = (key: string) => {
    if (disabled) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onKeyPress(key);
  };

  const handleDelete = () => {
    if (disabled) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onDelete();
  };

  const handleSubmit = () => {
    if (disabled) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    onSubmit();
  };

  const renderKey = (value: string, isSpecial?: boolean, customIcon?: string) => (
    <TouchableOpacity
      key={value}
      style={[
        styles.key,
        { 
          backgroundColor: isSpecial ? theme.primary : theme.keyboard,
          height: keyHeight,
          opacity: disabled ? 0.5 : 1,
        },
      ]}
      onPress={() => handleKeyPress(value)}
      activeOpacity={0.7}
      disabled={disabled}
    >
      {customIcon ? (
        <MaterialCommunityIcons name={customIcon as any} size={keyFontSize} color={isSpecial ? '#FFFFFF' : theme.keyboardText} />
      ) : (
        <Text style={[
          styles.keyText,
          { 
            color: isSpecial ? '#FFFFFF' : theme.keyboardText,
            fontSize: keyFontSize,
          },
        ]}>
          {value}
        </Text>
      )}
    </TouchableOpacity>
  );

  // For equation mode, render additional operator row (smaller)
  const renderOperatorRow = () => (
    <View style={[styles.operatorRow, { marginBottom: rowMargin / 2 }]}>
      {['+', '-', '×', '÷'].map((op) => (
        <TouchableOpacity
          key={op}
          style={[
            styles.operatorKey,
            { backgroundColor: theme.primary }
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onKeyPress(op);
          }}
          disabled={disabled}
        >
          <Text style={styles.operatorKeyText}>{op}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: theme.surface, 
        paddingBottom: bottomPadding,
        paddingTop: mini ? 12 : 30,
        paddingHorizontal: containerPadding,
      },
    ]}>
      {showOperators && renderOperatorRow()}
      
      <View style={[styles.row, { marginTop: graph ? 20 : 0, marginBottom: rowMargin, gap: mini ? 6 : 0 }]}>
        {renderKey('1')}
        {renderKey('2')}
        {renderKey('3')}
      </View>
      <View style={[styles.row, { marginBottom: rowMargin, gap: mini ? 6 : 0 }]}>
        {renderKey('4')}
        {renderKey('5')}
        {renderKey('6')}
      </View>
      <View style={[styles.row, { marginBottom: rowMargin, gap: mini ? 6 : 0 }]}>
        {renderKey('7')}
        {renderKey('8')}
        {renderKey('9')}
      </View>
      <View style={[styles.row, { marginBottom: rowMargin, gap: mini ? 6 : 0 }]}>
        {/* Always show special key (usually decimal point) */}
        {renderKey(specialKey.value, false, specialKey.icon)}
        {renderKey('0')}
        <TouchableOpacity
          style={[
            styles.key,
            { backgroundColor: theme.error, height: keyHeight, opacity: disabled ? 0.5 : 1 },
          ]}
          onPress={handleDelete}
          activeOpacity={0.7}
          disabled={disabled}
        >
          <Ionicons name="backspace" size={iconSize} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={[
          styles.submitButton,
          { backgroundColor: theme.success, height: submitHeight, opacity: disabled ? 0.5 : 1 },
        ]}
        onPress={handleSubmit}
        activeOpacity={0.8}
        disabled={disabled}
      >
        <Text style={[styles.submitText, { fontSize: submitFontSize }]}>{submitLabel}</Text>
        <Ionicons name="arrow-forward" size={compact ? 18 : 20} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    justifyContent: 'flex-end',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  operatorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  operatorKey: {
    width: 50,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  operatorKeyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  key: {
    width: '31%',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyText: {
    fontWeight: '600',
  },
  submitButton: {
    flexDirection: 'row',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  submitText: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
