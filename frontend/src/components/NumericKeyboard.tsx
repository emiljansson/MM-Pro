import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import * as Haptics from 'expo-haptics';

interface NumericKeyboardProps {
  onKeyPress: (key: string) => void;
  onDelete: () => void;
  onSubmit: () => void;
  submitLabel: string;
  showDecimal?: boolean;
  showDivision?: boolean;
  compact?: boolean;
  large?: boolean;
}

export const NumericKeyboard: React.FC<NumericKeyboardProps> = ({
  onKeyPress,
  onDelete,
  onSubmit,
  submitLabel,
  showDecimal = false,
  showDivision = false,
  compact = false,
  large = false,
}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  
  // Calculate bottom padding: safe area inset for navigation bar
  const bottomPadding = Math.max(12, insets.bottom) + 8;
  
  // Dynamic sizes based on screen size
  // iPhone normal: 52px keys, iPad large: 60px, small phones compact: 40px
  const keyHeight = large ? 60 : (compact ? 40 : 52);
  const keyFontSize = large ? 32 : (compact ? 20 : 24);
  const submitHeight = large ? 64 : (compact ? 42 : 54);
  const submitFontSize = large ? 22 : (compact ? 16 : 19);
  const iconSize = large ? 32 : (compact ? 20 : 26);
  const rowMargin = large ? 10 : (compact ? 4 : 8);
  const containerPadding = large ? 24 : 16;

  const handleKeyPress = (key: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onKeyPress(key);
  };

  const handleDelete = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onDelete();
  };

  const handleSubmit = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    onSubmit();
  };

  const renderKey = (value: string, isSpecial?: boolean) => (
    <TouchableOpacity
      key={value}
      style={[
        styles.key,
        { 
          backgroundColor: isSpecial ? theme.primary : theme.keyboard,
          height: keyHeight,
        },
      ]}
      onPress={() => handleKeyPress(value)}
      activeOpacity={0.7}
    >
      <Text style={[
        styles.keyText,
        { 
          color: isSpecial ? '#FFFFFF' : theme.keyboardText,
          fontSize: keyFontSize,
        },
      ]}>
        {value}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: theme.surface, 
        paddingBottom: bottomPadding,
        paddingTop: large ? 12 : (compact ? 6 : 8),
        paddingHorizontal: containerPadding,
      },
    ]}>
      <View style={[styles.row, { marginBottom: rowMargin }]}>
        {renderKey('1')}
        {renderKey('2')}
        {renderKey('3')}
      </View>
      <View style={[styles.row, { marginBottom: rowMargin }]}>
        {renderKey('4')}
        {renderKey('5')}
        {renderKey('6')}
      </View>
      <View style={[styles.row, { marginBottom: rowMargin }]}>
        {renderKey('7')}
        {renderKey('8')}
        {renderKey('9')}
      </View>
      <View style={[styles.row, { marginBottom: rowMargin }]}>
        {showDecimal ? (
          renderKey('.')
        ) : showDivision ? (
          renderKey('÷')
        ) : (
          <View style={[styles.key, { height: keyHeight }]} />
        )}
        {renderKey('0')}
        <TouchableOpacity
          style={[
            styles.key,
            { backgroundColor: theme.error, height: keyHeight },
          ]}
          onPress={handleDelete}
          activeOpacity={0.7}
        >
          <Ionicons name="backspace" size={iconSize} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={[
          styles.submitButton,
          { backgroundColor: theme.success, height: submitHeight },
        ]}
        onPress={handleSubmit}
        activeOpacity={0.8}
      >
        <Text style={[styles.submitText, { fontSize: submitFontSize }]}>{submitLabel}</Text>
        <Ionicons name="arrow-forward" size={compact ? 18 : 20} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // paddingHorizontal, paddingTop and paddingBottom are now dynamically set
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    // marginBottom is now dynamically set
  },
  key: {
    width: '31%',
    // height is now dynamically set
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyText: {
    // fontSize is now dynamically set
    fontWeight: '600',
  },
  submitButton: {
    flexDirection: 'row',
    // height is now dynamically set
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  submitText: {
    // fontSize is now dynamically set
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
