import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useTranslation } from '../src/hooks/useTheme';
import { useAuth } from '../src/contexts';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function AchievementsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const { user, isAuthenticated, sessionToken, isLoading: authLoading } = useAuth();

  const [achievements, setAchievements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAchievements();
  }, [isAuthenticated]);

  const loadAchievements = async () => {
    try {
      const response = await fetch(`${API_URL}/api/achievements/my`, {
        headers: { 'Authorization': `Bearer ${sessionToken}` },
      });
      if (response.ok) {
        const data = await response.json();
        setAchievements(data);
      } else {
        // Fallback to all achievements if not authenticated
        const allResponse = await fetch(`${API_URL}/api/achievements`);
        if (allResponse.ok) {
          const data = await allResponse.json();
          setAchievements(data.map((a: any) => ({ ...a, earned: false })));
        }
      }
    } catch (error) {
      console.error('Error loading achievements:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze': return '#CD7F32';
      case 'silver': return '#C0C0C0';
      case 'gold': return '#FFD700';
      case 'platinum': return '#E5E4E2';
      default: return theme.textMuted;
    }
  };

  const earnedCount = achievements.filter(a => a.earned).length;
  const totalPoints = achievements.filter(a => a.earned).reduce((sum, a) => sum + a.points, 0);

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: theme.card }]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          {t('achievements')}
        </Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadAchievements(); }} />
        }
      >
        {/* Summary Card */}
        <View style={[styles.summaryCard, { backgroundColor: theme.primary }]}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{earnedCount}/{achievements.length}</Text>
            <Text style={styles.summaryLabel}>{t('earned') || 'Uppnådda'}</Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: 'rgba(255,255,255,0.3)' }]} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{totalPoints}</Text>
            <Text style={styles.summaryLabel}>{t('points') || 'Poäng'}</Text>
          </View>
        </View>

        {/* Achievements Grid */}
        <View style={styles.achievementsGrid}>
          {achievements.map((achievement) => (
            <View
              key={achievement.key}
              style={[
                styles.achievementCard,
                { backgroundColor: theme.card },
                !achievement.earned && styles.achievementLocked
              ]}
            >
              <View style={[
                styles.achievementIcon,
                { backgroundColor: achievement.earned ? getTierColor(achievement.tier) + '30' : theme.border }
              ]}>
                <Ionicons
                  name={achievement.icon as any}
                  size={28}
                  color={achievement.earned ? getTierColor(achievement.tier) : theme.textMuted}
                />
                {!achievement.earned && (
                  <View style={styles.lockOverlay}>
                    <Ionicons name="lock-closed" size={14} color={theme.textMuted} />
                  </View>
                )}
              </View>
              <Text style={[
                styles.achievementName,
                { color: achievement.earned ? theme.text : theme.textMuted }
              ]}>
                {t(achievement.name_key) || achievement.name_key}
              </Text>
              <Text style={[
                styles.achievementDesc,
                { color: theme.textSecondary }
              ]} numberOfLines={2}>
                {t(achievement.description_key) || achievement.description_key}
              </Text>
              <View style={styles.achievementMeta}>
                <View style={[
                  styles.tierBadge,
                  { backgroundColor: getTierColor(achievement.tier) + '30' }
                ]}>
                  <Text style={[styles.tierText, { color: getTierColor(achievement.tier) }]}>
                    {achievement.tier}
                  </Text>
                </View>
                <Text style={[styles.pointsText, { color: theme.textSecondary }]}>
                  +{achievement.points}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  content: { flex: 1, paddingHorizontal: 16 },
  summaryCard: {
    flexDirection: 'row',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { fontSize: 28, fontWeight: '800', color: '#FFFFFF' },
  summaryLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  summaryDivider: { width: 1, marginHorizontal: 16 },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  achievementCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  achievementLocked: { opacity: 0.7 },
  achievementIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  lockOverlay: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 4,
  },
  achievementName: { fontSize: 14, fontWeight: '600', textAlign: 'center', marginBottom: 4 },
  achievementDesc: { fontSize: 11, textAlign: 'center', marginBottom: 8 },
  achievementMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tierBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  tierText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  pointsText: { fontSize: 12, fontWeight: '600' },
});
