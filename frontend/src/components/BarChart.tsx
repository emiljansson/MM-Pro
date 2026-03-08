import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface BarChartProps {
  labels: string[];
  values: number[];
  size?: 'small' | 'medium' | 'large';
  showValues?: boolean;
  highlightMax?: boolean;
  highlightMin?: boolean;
}

export const BarChart: React.FC<BarChartProps> = ({
  labels,
  values,
  size = 'medium',
  showValues = true,
  highlightMax = false,
  highlightMin = false,
}) => {
  const theme = useTheme();
  
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);
  
  // Size configurations
  const sizes = {
    small: { barWidth: 32, maxHeight: 80, fontSize: 10, labelSize: 9, gap: 6 },
    medium: { barWidth: 44, maxHeight: 120, fontSize: 12, labelSize: 11, gap: 10 },
    large: { barWidth: 56, maxHeight: 160, fontSize: 14, labelSize: 13, gap: 14 },
  };
  
  const s = sizes[size];
  
  // Color palette for bars - retro pastels
  const barColors = [
    '#7EC8E3', // Baby blue
    '#F9B4AB', // Peach
    '#B5EAD7', // Mint
    '#C9B1FF', // Lavender
    '#FFD93D', // Yellow
    '#FF9B9B', // Coral
    '#98D8C8', // Teal
  ];
  
  return (
    <View style={styles.container}>
      {/* Chart area */}
      <View style={[styles.chartArea, { height: s.maxHeight + 60 }]}>
        {/* Y-axis labels */}
        <View style={styles.yAxis}>
          <Text style={[styles.yLabel, { color: theme.textMuted, fontSize: s.labelSize - 1 }]}>
            {maxValue}
          </Text>
          <Text style={[styles.yLabel, { color: theme.textMuted, fontSize: s.labelSize - 1 }]}>
            {Math.round(maxValue / 2)}
          </Text>
          <Text style={[styles.yLabel, { color: theme.textMuted, fontSize: s.labelSize - 1 }]}>
            0
          </Text>
        </View>
        
        {/* Bars container */}
        <View style={styles.barsContainer}>
          {/* Grid lines */}
          <View style={[styles.gridLine, { top: 0, backgroundColor: theme.border }]} />
          <View style={[styles.gridLine, { top: '50%', backgroundColor: theme.border }]} />
          <View style={[styles.gridLine, { bottom: 0, backgroundColor: theme.border }]} />
          
          {/* Bars */}
          <View style={[styles.barsRow, { gap: s.gap }]}>
            {values.map((value, index) => {
              const heightPercent = maxValue > 0 ? (value / maxValue) * 100 : 0;
              const isMax = value === maxValue;
              const isMin = value === minValue;
              const barColor = barColors[index % barColors.length];
              
              // Determine if this bar should be highlighted
              let borderColor = 'transparent';
              let borderWidth = 0;
              if (highlightMax && isMax) {
                borderColor = theme.success;
                borderWidth = 3;
              } else if (highlightMin && isMin) {
                borderColor = theme.error;
                borderWidth = 3;
              }
              
              return (
                <View key={index} style={[styles.barColumn, { width: s.barWidth }]}>
                  {/* Value label above bar */}
                  {showValues && (
                    <Text style={[
                      styles.valueLabel,
                      { 
                        color: theme.text,
                        fontSize: s.fontSize,
                        fontWeight: (isMax || isMin) ? '700' : '600',
                      }
                    ]}>
                      {value}
                    </Text>
                  )}
                  
                  {/* Bar */}
                  <View style={[styles.barWrapper, { height: s.maxHeight }]}>
                    <View
                      style={[
                        styles.bar,
                        {
                          width: s.barWidth,
                          height: `${heightPercent}%`,
                          backgroundColor: barColor,
                          borderColor,
                          borderWidth,
                        },
                      ]}
                    />
                  </View>
                  
                  {/* X-axis label */}
                  <Text style={[
                    styles.xLabel,
                    { 
                      color: theme.text,
                      fontSize: s.labelSize,
                    }
                  ]}>
                    {labels[index]}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
};

// Helper to check if question is a diagram question
export const isDiagramQuestion = (question: any): boolean => {
  return question?.type === 'diagrams' && question?.chart_data;
};

// Helper to extract chart data from question
export const extractChartData = (question: any): { labels: string[]; values: number[] } | null => {
  if (!question?.chart_data) return null;
  return {
    labels: question.chart_data.labels || [],
    values: question.chart_data.values || [],
  };
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    overflow: 'visible',
  },
  chartArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingBottom: 8,
  },
  yAxis: {
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: 6,
    height: '100%',
    paddingBottom: 24,
  },
  yLabel: {
    fontWeight: '500',
  },
  barsContainer: {
    flex: 1,
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    opacity: 0.5,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: '100%',
    paddingBottom: 24,
  },
  barColumn: {
    alignItems: 'center',
  },
  valueLabel: {
    marginBottom: 4,
    textAlign: 'center',
  },
  barWrapper: {
    justifyContent: 'flex-end',
  },
  bar: {
    borderRadius: 6,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  xLabel: {
    marginTop: 6,
    fontWeight: '600',
    textAlign: 'center',
  },
});
