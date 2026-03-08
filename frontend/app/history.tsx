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
import { apiService } from '../src/services';

export default function HistoryScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const { user, isAuthenticated, sessionToken, isLoading: authLoading } = useAuth();

  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && sessionToken) {
      loadHistory();
    } else if (!authLoading && !isAuthenticated) {
      setIsLoading(false);
    }
  }, [isAuthenticated, selectedCategory, sessionToken]);

  const loadHistory = async () => {
    if (!sessionToken) return;
    try {
      const data = await apiService.getGameHistory(
        sessionToken,
        selectedCategory || undefined
      );
      setHistory(data);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('sv-SE', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (correct: number, total: number) => {
    const ratio = correct / total;
    if (ratio >= 0.9) return theme.success;
    if (ratio >= 0.7) return theme.warning;
    return theme.error;
  };

  const categories = [
    null, 'addition', 'subtraction', 'multiplication', 'division',
    'fractions', 'equations', 'geometry', 'percentage'
  ];

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
          {t('history')}
        </Text>
        <View style={styles.backButton} />
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterTabs}
        contentContainerStyle={styles.filterTabsContent}
      >
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat || 'all'}
            style={[
              styles.filterTab,
              { backgroundColor: selectedCategory === cat ? theme.primary : theme.card }
            ]}
            onPress={() => {
              setSelectedCategory(cat);
              setIsLoading(true);
            }}
          >
            <Text style={[
              styles.filterTabText,
              { color: selectedCategory === cat ? '#FFFFFF' : theme.text }
            ]}>
              {cat ? t(cat) : t('all') || 'Alla'}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* History List */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadHistory(); }} />
        }
      >
        {/* Summary Card */}
        <View style={[styles.summaryCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.summaryTitle, { color: theme.text }]}>
            {t('total_games') || 'Totalt'}: {history.length}
          </Text>
        </View>

        {history.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: theme.card }]}>
            <Ionicons name="time-outline" size={48} color={theme.textMuted} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              {t('no_history') || 'Ingen historik'}
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              {t('play_to_see_history') || 'Spela för att se din historik här!'}
            </Text>
          </View>
        ) : (
          history.map((session, index) => (
            <View
              key={session.session_id || index}
              style={[styles.historyCard, { backgroundColor: theme.card }]}
            >
              <View style={styles.historyHeader}>
                <View style={styles.categoryBadge}>
                  <Text style={[styles.categoryText, { color: theme.primary }]}>
                    {t(session.category)}
                  </Text>
                  <Text style={[styles.difficultyText, { color: theme.textSecondary }]}>
                    {t(session.difficulty)}
                  </Text>
                </View>
                <Text style={[styles.dateText, { color: theme.textMuted }]}>
                  {formatDate(session.created_at)}
                </Text>
              </View>
              <View style={styles.historyStats}>
                <View style={styles.statItem}>
                  <Text style={[
                    styles.statValue,
                    { color: getScoreColor(session.correct_answers, session.question_count) }
                  ]}>
                    {session.correct_answers}/{session.question_count}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                    {t('correct') || 'Rätt'}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.info }]}>
                    {session.score}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                    {t('score') || 'Poäng'}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.textSecondary }]}>
                    {formatTime(session.total_time)}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                    {t('time') || 'Tid'}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
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
  filterTabs: { flexGrow: 0, marginBottom: 16 },
  filterTabsContent: { paddingHorizontal: 16, gap: 8 },
  filterTab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16 },
  filterTabText: { fontSize: 13, fontWeight: '600' },
  content: { flex: 1, paddingHorizontal: 16 },
  summaryCard: { padding: 16, borderRadius: 12, marginBottom: 16 },
  summaryTitle: { fontSize: 16, fontWeight: '600' },
  emptyState: { padding: 32, borderRadius: 16, alignItems: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '600', marginTop: 16 },
  emptySubtitle: { fontSize: 14, textAlign: 'center', marginTop: 8 },
  historyCard: { padding: 16, borderRadius: 12, marginBottom: 12 },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  categoryBadge: {},
  categoryText: { fontSize: 16, fontWeight: '600' },
  difficultyText: { fontSize: 12, marginTop: 2 },
  dateText: { fontSize: 12 },
  historyStats: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '700' },
  statLabel: { fontSize: 11, marginTop: 2 },
});
