import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface FractionProps {
  numerator: number | string;
  denominator: number | string;
  size?: 'small' | 'medium' | 'large';
  color?: string;
}

/**
 * Displays a fraction with numerator above and denominator below a horizontal line.
 * Example: 
 *    5
 *   ---
 *    6
 */
export const Fraction: React.FC<FractionProps> = ({
  numerator,
  denominator,
  size = 'medium',
  color,
}) => {
  const theme = useTheme();
  const textColor = color || theme.text;

  const sizes = {
    small: { fontSize: 18, lineWidth: 24, lineHeight: 2 },
    medium: { fontSize: 28, lineWidth: 36, lineHeight: 3 },
    large: { fontSize: 42, lineWidth: 52, lineHeight: 4 },
  };

  const { fontSize, lineWidth, lineHeight } = sizes[size];

  return (
    <View style={styles.container}>
      <Text style={[styles.number, { fontSize, color: textColor }]}>
        {numerator}
      </Text>
      <View style={[styles.line, { width: lineWidth, height: lineHeight, backgroundColor: textColor }]} />
      <Text style={[styles.number, { fontSize, color: textColor }]}>
        {denominator}
      </Text>
    </View>
  );
};

interface FractionExpressionProps {
  expression: string; // e.g., "1/4 + 2/4" or "5/6 × 5/4"
  size?: 'small' | 'medium' | 'large';
  color?: string;
}

/**
 * Parses and displays a fraction expression with proper visual formatting.
 * Supports: +, -, ×, ·, =, ?, <, >, fractions like "1/4"
 */
export const FractionExpression: React.FC<FractionExpressionProps> = ({
  expression,
  size = 'medium',
  color,
}) => {
  const theme = useTheme();
  const textColor = color || theme.text;

  const sizes = {
    small: { fontSize: 18, operatorSize: 20 },
    medium: { fontSize: 28, operatorSize: 32 },
    large: { fontSize: 42, operatorSize: 48 },
  };

  const { fontSize, operatorSize } = sizes[size];

  // Parse the expression into tokens
  const parseExpression = (expr: string): Array<{ type: 'fraction' | 'operator' | 'number' | 'text', value: string, num?: string, denom?: string }> => {
    const tokens: Array<{ type: 'fraction' | 'operator' | 'number' | 'text', value: string, num?: string, denom?: string }> = [];
    
    // Split by spaces and operators while keeping operators
    const parts = expr.split(/(\s+|[+\-×·÷=?<>])/g).filter(p => p.trim());
    
    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      
      // Check if it's a fraction (contains /)
      if (trimmed.includes('/') && !trimmed.startsWith('/') && !trimmed.endsWith('/')) {
        const [num, denom] = trimmed.split('/');
        if (num && denom && !isNaN(Number(num)) && !isNaN(Number(denom))) {
          tokens.push({ type: 'fraction', value: trimmed, num, denom });
          continue;
        }
      }
      
      // Check if it's an operator
      if (['+', '-', '−', '×', '·', '÷', '=', '?', '<', '>'].includes(trimmed)) {
        tokens.push({ type: 'operator', value: trimmed });
        continue;
      }
      
      // Check if it's a number
      if (!isNaN(Number(trimmed))) {
        tokens.push({ type: 'number', value: trimmed });
        continue;
      }
      
      // Otherwise it's text
      tokens.push({ type: 'text', value: trimmed });
    }
    
    return tokens;
  };

  const tokens = parseExpression(expression);

  return (
    <View style={styles.expressionContainer}>
      {tokens.map((token, index) => {
        if (token.type === 'fraction' && token.num && token.denom) {
          return (
            <View key={index} style={styles.tokenWrapper}>
              <Fraction
                numerator={token.num}
                denominator={token.denom}
                size={size}
                color={textColor}
              />
            </View>
          );
        }
        
        if (token.type === 'operator') {
          return (
            <Text
              key={index}
              style={[styles.operator, { fontSize: operatorSize, color: textColor }]}
            >
              {token.value}
            </Text>
          );
        }
        
        if (token.type === 'number') {
          return (
            <Text
              key={index}
              style={[styles.number, { fontSize, color: textColor }]}
            >
              {token.value}
            </Text>
          );
        }
        
        // Text
        return (
          <Text
            key={index}
            style={[styles.text, { fontSize: fontSize * 0.6, color: textColor }]}
          >
            {token.value}
          </Text>
        );
      })}
    </View>
  );
};

/**
 * Helper function to check if a string contains a fraction
 */
export const containsFraction = (text: string): boolean => {
  // Match patterns like "1/4", "12/16", etc.
  return /\d+\/\d+/.test(text);
};

/**
 * Extract fraction parts from a display string
 */
export const extractFractionParts = (display: string): {
  hasFraction: boolean;
  beforeFraction?: string;
  fractions?: Array<{ num: string; denom: string }>;
  operators?: string[];
  afterFraction?: string;
} => {
  if (!containsFraction(display)) {
    return { hasFraction: false };
  }

  // Match fractions and operators
  const fractionRegex = /(\d+)\/(\d+)/g;
  const fractions: Array<{ num: string; denom: string }> = [];
  let match;
  
  while ((match = fractionRegex.exec(display)) !== null) {
    fractions.push({ num: match[1], denom: match[2] });
  }

  // Find operators between fractions
  const operatorMatch = display.match(/[+\-−×·÷=?<>]/g);
  const operators = operatorMatch || [];

  // Get text before first fraction
  const firstFractionIndex = display.search(/\d+\/\d+/);
  const beforeFraction = firstFractionIndex > 0 ? display.substring(0, firstFractionIndex).trim() : undefined;

  // Get text after last fraction
  const lastMatch = display.match(/\d+\/\d+/g);
  if (lastMatch) {
    const lastFraction = lastMatch[lastMatch.length - 1];
    const lastIndex = display.lastIndexOf(lastFraction) + lastFraction.length;
    const afterFraction = display.substring(lastIndex).trim();
    
    return {
      hasFraction: true,
      beforeFraction,
      fractions,
      operators,
      afterFraction: afterFraction || undefined,
    };
  }

  return {
    hasFraction: true,
    beforeFraction,
    fractions,
    operators,
  };
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  number: {
    fontWeight: '700',
    textAlign: 'center',
    minWidth: 20,
  },
  line: {
    marginVertical: 2,
    borderRadius: 1,
  },
  expressionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  tokenWrapper: {
    marginHorizontal: 4,
  },
  operator: {
    fontWeight: '600',
    marginHorizontal: 8,
  },
  text: {
    fontWeight: '500',
    marginHorizontal: 4,
  },
});
