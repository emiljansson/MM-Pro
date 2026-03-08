import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useTranslation } from '../src/hooks/useTheme';
import { useAuth } from '../src/contexts';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

const CATEGORIES = [
  { key: 'overall', name: 'overall', icon: 'trophy' },
  { key: 'addition', name: 'addition', icon: 'add-circle' },
  { key: 'subtraction', name: 'subtraction', icon: 'remove-circle' },
  { key: 'multiplication', name: 'multiplication', icon: 'close-circle' },
  { key: 'division', name: 'division', icon: 'git-compare' },
];

export default function LeaderboardScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const { user } = useAuth();

  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('overall');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadLeaderboard();
  }, [selectedCategory]);

  const loadLeaderboard = async () => {
    try {
      const url = selectedCategory === 'overall'
        ? `${API_URL}/api/leaderboard`
        : `${API_URL}/api/leaderboard?category=${selectedCategory}`;
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data);
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return '#FFD700'; // Gold
    if (rank === 2) return '#C0C0C0'; // Silver
    if (rank === 3) return '#CD7F32'; // Bronze
    return theme.textSecondary;
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return 'medal';
    if (rank === 2) return 'medal-outline';
    if (rank === 3) return 'ribbon';
    return null;
  };

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
          {t('leaderboard')}
        </Text>
        <View style={styles.backButton} />
      </View>

      {/* Category Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryTabs}
        contentContainerStyle={styles.categoryTabsContent}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.key}
            style={[
              styles.categoryTab,
              { backgroundColor: selectedCategory === cat.key ? theme.primary : theme.card }
            ]}
            onPress={() => {
              setSelectedCategory(cat.key);
              setIsLoading(true);
            }}
          >
            <Ionicons
              name={cat.icon as any}
              size={18}
              color={selectedCategory === cat.key ? '#FFFFFF' : theme.textSecondary}
            />
            <Text style={[
              styles.categoryTabText,
              { color: selectedCategory === cat.key ? '#FFFFFF' : theme.text }
            ]}>
              {t(cat.name)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Leaderboard */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadLeaderboard(); }} />
          }
        >
          {leaderboard.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: theme.card }]}>
              <Ionicons name="podium-outline" size={48} color={theme.textMuted} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                {t('no_scores') || 'No scores yet'}
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                {t('be_first') || 'Be the first to play and get on the leaderboard!'}
              </Text>
            </View>
          ) : (
            leaderboard.map((entry, index) => (
              <View
                key={entry.user_id}
                style={[
                  styles.leaderboardEntry,
                  { backgroundColor: theme.card },
                  entry.user_id === user?.user_id && { borderColor: theme.primary, borderWidth: 2 }
                ]}
              >
                <View style={styles.rankContainer}>
                  {getRankIcon(entry.rank) ? (
                    <Ionicons name={getRankIcon(entry.rank) as any} size={24} color={getRankColor(entry.rank)} />
                  ) : (
                    <Text style={[styles.rankText, { color: theme.textSecondary }]}>#{entry.rank}</Text>
                  )}
                </View>
                <View style={[styles.avatarContainer, { backgroundColor: theme.primaryLight }]}>
                  {entry.picture ? (
                    <Image source={{ uri: entry.picture }} style={styles.avatar} />
                  ) : (
                    <Text style={[styles.avatarText, { color: theme.primary }]}>
                      {entry.display_name?.charAt(0)?.toUpperCase() || '?'}
                    </Text>
                  )}
                </View>
                <View style={styles.userInfo}>
                  <Text style={[styles.userName, { color: theme.text }]}>
                    {entry.display_name}
                    {entry.user_id === user?.user_id && ' (du)'}
                  </Text>
                  <Text style={[styles.gamesPlayed, { color: theme.textSecondary }]}>
                    {entry.games || 0} {t('games_played') || 'games'}
                  </Text>
                </View>
                <View style={styles.scoreContainer}>
                  <Text style={[styles.scoreValue, { color: theme.primary }]}>
                    {entry.score}
                  </Text>
                  <Text style={[styles.scoreLabel, { color: theme.textMuted }]}>
                    {t('points') || 'poäng'}
                  </Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  categoryTabs: { flexGrow: 0, marginBottom: 16 },
  categoryTabsContent: { paddingHorizontal: 16, gap: 8 },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  categoryTabText: { fontSize: 13, fontWeight: '600' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1, paddingHorizontal: 16 },
  emptyState: { padding: 32, borderRadius: 16, alignItems: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '600', marginTop: 16 },
  emptySubtitle: { fontSize: 14, textAlign: 'center', marginTop: 8 },
  leaderboardEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  rankContainer: { width: 40, alignItems: 'center' },
  rankText: { fontSize: 16, fontWeight: '700' },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarText: { fontSize: 18, fontWeight: '700' },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: '600' },
  gamesPlayed: { fontSize: 12, marginTop: 2 },
  scoreContainer: { alignItems: 'flex-end' },
  scoreValue: { fontSize: 20, fontWeight: '800' },
  scoreLabel: { fontSize: 11 },
});
