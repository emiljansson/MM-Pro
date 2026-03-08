import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../hooks/useTheme';

interface FractionInputProps {
  value: { numerator: string; denominator: string };
  onChange: (value: { numerator: string; denominator: string }) => void;
  size?: 'small' | 'medium' | 'large';
  editable?: boolean;
  autoFocus?: boolean;
}

export const FractionInput: React.FC<FractionInputProps> = ({
  value,
  onChange,
  size = 'medium',
  editable = true,
  autoFocus = true,
}) => {
  const theme = useTheme();
  const numeratorRef = useRef<TextInput>(null);
  const denominatorRef = useRef<TextInput>(null);

  const sizes = {
    small: { fontSize: 28, lineWidth: 40, lineHeight: 3, inputHeight: 40 },
    medium: { fontSize: 36, lineWidth: 56, lineHeight: 4, inputHeight: 50 },
    large: { fontSize: 44, lineWidth: 72, lineHeight: 5, inputHeight: 60 },
  };

  const s = sizes[size];

  useEffect(() => {
    if (autoFocus && editable) {
      setTimeout(() => {
        numeratorRef.current?.focus();
      }, 100);
    }
  }, [autoFocus, editable]);

  const handleNumeratorChange = (text: string) => {
    // Only allow numbers
    const cleaned = text.replace(/[^0-9]/g, '');
    onChange({ ...value, numerator: cleaned });
    
    // Auto-move to denominator when entering a number
    if (cleaned.length > 0 && value.numerator.length === 0) {
      // Don't auto-move, let user control
    }
  };

  const handleDenominatorChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    onChange({ ...value, denominator: cleaned });
  };

  const handleNumeratorSubmit = () => {
    denominatorRef.current?.focus();
  };

  return (
    <View style={styles.container}>
      {/* Numerator (Top) */}
      <TextInput
        ref={numeratorRef}
        style={[
          styles.input,
          {
            fontSize: s.fontSize,
            height: s.inputHeight,
            minWidth: s.lineWidth,
            color: theme.text,
            borderColor: theme.primary,
          },
        ]}
        value={value.numerator}
        onChangeText={handleNumeratorChange}
        keyboardType="number-pad"
        maxLength={3}
        editable={editable}
        placeholder="?"
        placeholderTextColor={theme.textMuted}
        textAlign="center"
        onSubmitEditing={handleNumeratorSubmit}
        returnKeyType="next"
        selectTextOnFocus
      />
      
      {/* Fraction line */}
      <View
        style={[
          styles.fractionLine,
          {
            backgroundColor: theme.text,
            width: s.lineWidth,
            height: s.lineHeight,
          },
        ]}
      />
      
      {/* Denominator (Bottom) */}
      <TextInput
        ref={denominatorRef}
        style={[
          styles.input,
          {
            fontSize: s.fontSize,
            height: s.inputHeight,
            minWidth: s.lineWidth,
            color: theme.text,
            borderColor: theme.primary,
          },
        ]}
        value={value.denominator}
        onChangeText={handleDenominatorChange}
        keyboardType="number-pad"
        maxLength={3}
        editable={editable}
        placeholder="?"
        placeholderTextColor={theme.textMuted}
        textAlign="center"
        selectTextOnFocus
      />
    </View>
  );
};

// Fraction keyboard component - numeric keys only for fraction input
interface FractionKeyboardProps {
  onNumeratorKey: (key: string) => void;
  onDenominatorKey: (key: string) => void;
  onDelete: (field: 'numerator' | 'denominator') => void;
  onSubmit: () => void;
  submitLabel: string;
  activeField: 'numerator' | 'denominator';
  onFieldSwitch: (field: 'numerator' | 'denominator') => void;
  compact?: boolean;
  large?: boolean;
  disabled?: boolean;
}

export const FractionKeyboard: React.FC<FractionKeyboardProps> = ({
  onNumeratorKey,
  onDenominatorKey,
  onDelete,
  onSubmit,
  submitLabel,
  activeField,
  onFieldSwitch,
  compact = false,
  large = false,
  disabled = false,
}) => {
  const theme = useTheme();

  const keyHeight = large ? 54 : (compact ? 38 : 48);
  const keyFontSize = large ? 28 : (compact ? 18 : 22);
  const bottomPadding = large ? 24 : 16;

  const handleKeyPress = (key: string) => {
    if (disabled) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (activeField === 'numerator') {
      onNumeratorKey(key);
    } else {
      onDenominatorKey(key);
    }
  };

  const handleDelete = () => {
    if (disabled) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onDelete(activeField);
  };

  const handleSubmit = () => {
    if (disabled) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    onSubmit();
  };

  const switchField = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onFieldSwitch(activeField === 'numerator' ? 'denominator' : 'numerator');
  };

  const renderKey = (value: string) => (
    <TouchableOpacity
      key={value}
      style={[
        styles.key,
        { 
          backgroundColor: theme.keyboard,
          height: keyHeight,
          opacity: disabled ? 0.5 : 1,
        },
      ]}
      onPress={() => handleKeyPress(value)}
      activeOpacity={0.7}
      disabled={disabled}
    >
      <Text style={[styles.keyText, { color: theme.keyboardText, fontSize: keyFontSize }]}>
        {value}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.keyboardContainer, { backgroundColor: theme.surface, paddingBottom: bottomPadding }]}>
      {/* Field toggle indicator */}
      <View style={[styles.fieldToggle, { marginBottom: compact ? 6 : 10 }]}>
        <TouchableOpacity
          style={[
            styles.fieldButton,
            { 
              backgroundColor: activeField === 'numerator' ? theme.primary : theme.card,
              borderColor: theme.border,
            },
          ]}
          onPress={() => onFieldSwitch('numerator')}
        >
          <Ionicons 
            name="arrow-up" 
            size={compact ? 14 : 16} 
            color={activeField === 'numerator' ? '#FFFFFF' : theme.text} 
          />
          <Text style={[
            styles.fieldLabel, 
            { 
              color: activeField === 'numerator' ? '#FFFFFF' : theme.text,
              fontSize: compact ? 11 : 13,
            }
          ]}>
            Täljare
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.fieldButton,
            { 
              backgroundColor: activeField === 'denominator' ? theme.primary : theme.card,
              borderColor: theme.border,
            },
          ]}
          onPress={() => onFieldSwitch('denominator')}
        >
          <Ionicons 
            name="arrow-down" 
            size={compact ? 14 : 16} 
            color={activeField === 'denominator' ? '#FFFFFF' : theme.text} 
          />
          <Text style={[
            styles.fieldLabel, 
            { 
              color: activeField === 'denominator' ? '#FFFFFF' : theme.text,
              fontSize: compact ? 11 : 13,
            }
          ]}>
            Nämnare
          </Text>
        </TouchableOpacity>
      </View>

      {/* Number keys */}
      <View style={styles.row}>
        {renderKey('1')}
        {renderKey('2')}
        {renderKey('3')}
      </View>
      <View style={styles.row}>
        {renderKey('4')}
        {renderKey('5')}
        {renderKey('6')}
      </View>
      <View style={styles.row}>
        {renderKey('7')}
        {renderKey('8')}
        {renderKey('9')}
      </View>
      <View style={styles.row}>
        {/* Switch field button */}
        <TouchableOpacity
          style={[
            styles.key,
            { backgroundColor: theme.card, height: keyHeight, opacity: disabled ? 0.5 : 1 },
          ]}
          onPress={switchField}
          activeOpacity={0.7}
          disabled={disabled}
        >
          <Ionicons 
            name="swap-vertical" 
            size={keyFontSize} 
            color={theme.primary} 
          />
        </TouchableOpacity>
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
          <Ionicons name="backspace" size={keyFontSize} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Submit button */}
      <TouchableOpacity
        style={[
          styles.submitButton,
          { 
            backgroundColor: theme.success, 
            height: compact ? 42 : 52,
            opacity: disabled ? 0.5 : 1,
          },
        ]}
        onPress={handleSubmit}
        activeOpacity={0.8}
        disabled={disabled}
      >
        <Text style={[styles.submitText, { fontSize: compact ? 16 : 18 }]}>{submitLabel}</Text>
        <Ionicons name="arrow-forward" size={compact ? 18 : 20} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    fontWeight: '700',
    paddingHorizontal: 8,
    borderWidth: 0,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  fractionLine: {
    marginVertical: 4,
    borderRadius: 2,
  },
  keyboardContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 10,
    paddingHorizontal: 16,
  },
  fieldToggle: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  fieldButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  fieldLabel: {
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
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
