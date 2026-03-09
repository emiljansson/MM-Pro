import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Modal,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';

const { width, height } = Dimensions.get('window');

interface Achievement {
  key: string;
  name: string;
  description: string;
  icon: string;
  tier: string;
  points: number;
}

interface AchievementPopupProps {
  achievement: Achievement | null;
  visible: boolean;
  onClose: () => void;
}

const TIER_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  bronze: { bg: '#CD7F32', border: '#8B5A2B', text: '#FFFFFF' },
  silver: { bg: '#C0C0C0', border: '#A0A0A0', text: '#333333' },
  gold: { bg: '#FFD700', border: '#DAA520', text: '#333333' },
  platinum: { bg: '#E5E4E2', border: '#B8B8B8', text: '#333333' },
  diamond: { bg: '#B9F2FF', border: '#00CED1', text: '#333333' },
};

// Simple confetti particle
const Confetti = ({ delay, color }: { delay: number; color: string }) => {
  const translateY = useRef(new Animated.Value(-50)).current;
  const translateX = useRef(new Animated.Value(Math.random() * width)).current;
  const rotation = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animate = () => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: height + 50,
          duration: 3000,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(rotation, {
          toValue: 360,
          duration: 3000,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 3000,
          delay,
          useNativeDriver: true,
        }),
      ]).start();
    };
    animate();
  }, []);

  const rotateInterpolate = rotation.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.confetti,
        {
          backgroundColor: color,
          transform: [
            { translateY },
            { translateX },
            { rotate: rotateInterpolate },
          ],
          opacity,
        },
      ]}
    />
  );
};

export default function AchievementPopup({ achievement, visible, onClose }: AchievementPopupProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const [showConfetti, setShowConfetti] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    if (visible && achievement) {
      // Reset animations
      scaleAnim.setValue(0);
      rotateAnim.setValue(0);
      setShowConfetti(true);

      // Haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Play celebration animation
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1.2,
          tension: 100,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start();

      // Icon rotation
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start();

      // Auto-close after 4 seconds
      const timeout = setTimeout(() => {
        onClose();
        setShowConfetti(false);
      }, 4000);

      return () => clearTimeout(timeout);
    }
  }, [visible, achievement]);

  if (!visible || !achievement) return null;

  const tierColors = TIER_COLORS[achievement.tier] || TIER_COLORS.bronze;
  
  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const confettiColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Confetti */}
        {showConfetti && (
          <View style={styles.confettiContainer}>
            {Array.from({ length: 30 }).map((_, i) => (
              <Confetti
                key={i}
                delay={i * 100}
                color={confettiColors[i % confettiColors.length]}
              />
            ))}
          </View>
        )}

        <TouchableOpacity
          style={styles.container}
          activeOpacity={0.9}
          onPress={onClose}
        >
          <Animated.View
            style={[
              styles.popup,
              {
                backgroundColor: tierColors.bg,
                borderColor: tierColors.border,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            {/* Applause emoji */}
            <View style={styles.applauseContainer}>
              <Text style={styles.applause}>👏</Text>
              <Text style={styles.applause}>🎉</Text>
              <Text style={styles.applause}>👏</Text>
            </View>

            {/* Achievement icon */}
            <Animated.View
              style={[
                styles.iconContainer,
                { transform: [{ rotate: rotateInterpolate }] },
              ]}
            >
              <Ionicons
                name={achievement.icon as any}
                size={60}
                color={tierColors.text}
              />
            </Animated.View>

            {/* Title */}
            <Text style={[styles.title, { color: tierColors.text }]}>
              Prestation upplåst!
            </Text>

            {/* Achievement name */}
            <Text style={[styles.achievementName, { color: tierColors.text }]}>
              {achievement.name}
            </Text>

            {/* Description */}
            <Text style={[styles.description, { color: tierColors.text }]}>
              {achievement.description}
            </Text>

            {/* Points */}
            <View style={[styles.pointsBadge, { backgroundColor: 'rgba(0,0,0,0.2)' }]}>
              <Ionicons name="star" size={16} color={tierColors.text} />
              <Text style={[styles.points, { color: tierColors.text }]}>
                +{achievement.points} poäng
              </Text>
            </View>

            {/* Tier badge */}
            <View style={[styles.tierBadge, { backgroundColor: 'rgba(255,255,255,0.3)' }]}>
              <Text style={[styles.tierText, { color: tierColors.text }]}>
                {achievement.tier.toUpperCase()}
              </Text>
            </View>

            <Text style={[styles.tapHint, { color: tierColors.text }]}>
              Tryck för att stänga
            </Text>
          </Animated.View>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confettiContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  confetti: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  popup: {
    width: width * 0.85,
    maxWidth: 350,
    borderRadius: 24,
    borderWidth: 4,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  applauseContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  applause: {
    fontSize: 40,
    marginHorizontal: 8,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  achievementName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    opacity: 0.9,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    marginBottom: 12,
  },
  points: {
    fontSize: 16,
    fontWeight: '700',
  },
  tierBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 16,
  },
  tierText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  tapHint: {
    fontSize: 12,
    opacity: 0.7,
  },
});
