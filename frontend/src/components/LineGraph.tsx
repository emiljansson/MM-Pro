import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface GraphPoint {
  x: number;
  y: number;
}

interface LineGraphProps {
  points: GraphPoint[];
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  size?: 'small' | 'medium' | 'large';
  highlightX?: number;
  highlightY?: number;
}

export const LineGraph: React.FC<LineGraphProps> = ({
  points,
  xMin,
  xMax,
  yMin,
  yMax,
  size = 'large',
  highlightX,
  highlightY,
}) => {
  const theme = useTheme();
  
  // Size configurations - focus on large graph
  const sizes = {
    small: { width: 200, height: 150, fontSize: 10, dotSize: 6 },
    medium: { width: 280, height: 200, fontSize: 11, dotSize: 8 },
    large: { width: 320, height: 260, fontSize: 12, dotSize: 10 },
  };
  
  const s = sizes[size];
  
  // Padding for axis labels
  const padding = { left: 35, right: 15, top: 15, bottom: 30 };
  const graphWidth = s.width - padding.left - padding.right;
  const graphHeight = s.height - padding.top - padding.bottom;
  
  // Extend range slightly for padding
  const yPadding = Math.max(1, Math.ceil((yMax - yMin) * 0.1));
  const displayYMin = Math.min(yMin - yPadding, 0);
  const displayYMax = yMax + yPadding;
  const yRange = displayYMax - displayYMin;
  const xRange = xMax - xMin;
  
  // Convert data point to pixel position
  const toPixelX = (x: number) => {
    return padding.left + ((x - xMin) / xRange) * graphWidth;
  };
  
  const toPixelY = (y: number) => {
    return padding.top + graphHeight - ((y - displayYMin) / yRange) * graphHeight;
  };
  
  // Generate axis ticks
  const xTicks: number[] = [];
  for (let x = xMin; x <= xMax; x++) {
    if (x % 1 === 0) xTicks.push(x);
  }
  
  const yTicks: number[] = [];
  const yStep = yRange > 10 ? 2 : 1;
  for (let y = Math.ceil(displayYMin); y <= displayYMax; y += yStep) {
    yTicks.push(y);
  }
  
  // Find zero line position
  const zeroY = toPixelY(0);
  const zeroX = toPixelX(0);
  
  // Sort points by x for line drawing
  const sortedPoints = [...points].sort((a, b) => a.x - b.x);
  
  return (
    <View style={[styles.container, { width: s.width, height: s.height }]}>
      {/* Background */}
      <View style={[styles.graphArea, { backgroundColor: theme.surface }]}>
        
        {/* Grid lines - horizontal */}
        {yTicks.map((y) => (
          <View
            key={`grid-h-${y}`}
            style={[
              styles.gridLine,
              {
                position: 'absolute',
                left: padding.left,
                right: padding.right,
                top: toPixelY(y),
                height: 1,
                backgroundColor: y === 0 ? theme.text : theme.border,
                opacity: y === 0 ? 0.5 : 0.3,
              },
            ]}
          />
        ))}
        
        {/* Grid lines - vertical */}
        {xTicks.map((x) => (
          <View
            key={`grid-v-${x}`}
            style={[
              styles.gridLine,
              {
                position: 'absolute',
                left: toPixelX(x),
                top: padding.top,
                bottom: padding.bottom,
                width: 1,
                backgroundColor: x === 0 ? theme.text : theme.border,
                opacity: x === 0 ? 0.5 : 0.3,
              },
            ]}
          />
        ))}
        
        {/* Y-axis labels */}
        {yTicks.map((y) => (
          <Text
            key={`y-${y}`}
            style={[
              styles.axisLabel,
              {
                position: 'absolute',
                left: 2,
                top: toPixelY(y) - 8,
                color: theme.textMuted,
                fontSize: s.fontSize,
                width: padding.left - 5,
                textAlign: 'right',
              },
            ]}
          >
            {y}
          </Text>
        ))}
        
        {/* X-axis labels */}
        {xTicks.map((x) => (
          <Text
            key={`x-${x}`}
            style={[
              styles.axisLabel,
              {
                position: 'absolute',
                left: toPixelX(x) - 10,
                bottom: 5,
                color: theme.textMuted,
                fontSize: s.fontSize,
                width: 20,
                textAlign: 'center',
              },
            ]}
          >
            {x}
          </Text>
        ))}
        
        {/* Line segments */}
        {sortedPoints.map((point, index) => {
          if (index === 0) return null;
          const prevPoint = sortedPoints[index - 1];
          
          const x1 = toPixelX(prevPoint.x);
          const y1 = toPixelY(prevPoint.y);
          const x2 = toPixelX(point.x);
          const y2 = toPixelY(point.y);
          
          // Calculate line length and angle
          const dx = x2 - x1;
          const dy = y2 - y1;
          const length = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx) * (180 / Math.PI);
          
          return (
            <View
              key={`line-${index}`}
              style={{
                position: 'absolute',
                left: x1,
                top: y1,
                width: length,
                height: 3,
                backgroundColor: theme.primary,
                transform: [{ rotate: `${angle}deg` }],
                borderRadius: 2,
              }}
            />
          );
        })}
        
        {/* Data points */}
        {sortedPoints.map((point, index) => {
          const isHighlighted = point.x === highlightX || point.y === highlightY;
          
          return (
            <View
              key={`point-${index}`}
              style={[
                styles.dataPoint,
                {
                  position: 'absolute',
                  left: toPixelX(point.x) - s.dotSize / 2,
                  top: toPixelY(point.y) - s.dotSize / 2,
                  width: s.dotSize,
                  height: s.dotSize,
                  backgroundColor: isHighlighted ? theme.error : theme.primary,
                  borderColor: '#FFFFFF',
                  borderWidth: isHighlighted ? 2 : 1,
                },
              ]}
            />
          );
        })}
        
        {/* Axis labels */}
        <Text style={[styles.axisTitle, { color: theme.text, bottom: 2, right: padding.right }]}>
          x
        </Text>
        <Text style={[styles.axisTitle, { color: theme.text, top: 2, left: padding.left - 5 }]}>
          y
        </Text>
      </View>
    </View>
  );
};

// Helper to check if question is a graph question
export const isGraphQuestion = (question: any): boolean => {
  return question?.type === 'graphs' && question?.graph_data;
};

// Helper to extract graph data from question
export const extractGraphData = (question: any) => {
  if (!question?.graph_data) return null;
  return {
    points: question.graph_data.points || [],
    xMin: question.graph_data.x_min ?? 0,
    xMax: question.graph_data.x_max ?? 5,
    yMin: question.graph_data.y_min ?? 0,
    yMax: question.graph_data.y_max ?? 10,
  };
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  graphArea: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  gridLine: {
    // Styles applied inline
  },
  axisLabel: {
    fontWeight: '500',
  },
  axisTitle: {
    position: 'absolute',
    fontSize: 14,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  dataPoint: {
    borderRadius: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
});
