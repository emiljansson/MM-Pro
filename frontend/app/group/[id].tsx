import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
  Share,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useTheme, useTranslation } from '../../src/hooks/useTheme';
import { useAuth } from '../../src/contexts';

const PRODUCTION_API = 'https://mm-pro-production.up.railway.app';
const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || PRODUCTION_API;

interface GroupMember {
  user_id: string;
  display_name: string;
  email: string;
  role: string;
  statistics?: {
    games_played: number;
    total_correct: number;
    total_questions: number;
  };
}

interface Challenge {
  challenge_id: string;
  name: string;
  description?: string;
  categories: string[];
  difficulty: string;
  question_count: number;
  start_date: string;
  end_date: string;
  daily_challenge: boolean;
  creator_id: string;
  participants: {
    user_id: string;
    display_name: string;
    score: number;
  }[];
  active: boolean;
}

interface Group {
  group_id: string;
  name: string;
  description?: string;
  invite_code: string;
  creator_id: string;
  members: GroupMember[];
  created_at: string;
}

const CATEGORIES = [
  { key: 'addition', label: 'Addition', icon: 'add-circle', color: '#81D4FA' },
  { key: 'subtraction', label: 'Subtraktion', icon: 'remove-circle', color: '#FFB74D' },
  { key: 'multiplication', label: 'Multiplikation', icon: 'close-circle', color: '#CE93D8' },
  { key: 'division', label: 'Division', icon: 'git-compare', color: '#A5D6A7' },
  { key: 'fractions', label: 'Bråk', icon: 'pie-chart', color: '#F48FB1' },
  { key: 'equations', label: 'Ekvationer', icon: 'code-working', color: '#90CAF9' },
  { key: 'geometry', label: 'Geometri', icon: 'shapes', color: '#B39DDB' },
  { key: 'percentage', label: 'Procent', icon: 'analytics', color: '#FFCC80' },
  { key: 'units', label: 'Enheter', icon: 'resize', color: '#80DEEA' },
  { key: 'rounding', label: 'Avrundning', icon: 'swap-horizontal', color: '#BCAAA4' },
  { key: 'angles', label: 'Vinklar', icon: 'compass', color: '#EF9A9A' },
  { key: 'probability', label: 'Sannolikhet', icon: 'dice', color: '#C5E1A5' },
  { key: 'diagrams', label: 'Diagram', icon: 'bar-chart', color: '#FFF59D' },
];

const DIFFICULTIES = [
  { key: 'easy', label: 'Lätt' },
  { key: 'medium', label: 'Medel' },
  { key: 'hard', label: 'Svår' },
];

export default function GroupDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const { t } = useTranslation();
  const { user, sessionToken, isAuthenticated } = useAuth();

  const [group, setGroup] = useState<Group | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Challenge creation state
  const [showCreateChallenge, setShowCreateChallenge] = useState(false);
  const [challengeName, setChallengeName] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['mixed']);
  const [selectedDifficulty, setSelectedDifficulty] = useState('medium');
  const [questionCount, setQuestionCount] = useState(15);
  const [isCreatingChallenge, setIsCreatingChallenge] = useState(false);

  useEffect(() => {
    if (id && sessionToken) {
      loadGroup();
      loadChallenges();
    }
  }, [id, sessionToken]);

  const loadGroup = async () => {
    try {
      const response = await fetch(`${API_URL}/api/groups/${id}`, {
        headers: { 'Authorization': `Bearer ${sessionToken}` },
      });
      if (response.ok) {
        const data = await response.json();
        setGroup(data);
      } else {
        Alert.alert('Fel', 'Kunde inte ladda gruppen');
        router.back();
      }
    } catch (error) {
      console.error('Error loading group:', error);
      Alert.alert('Fel', 'Kunde inte ladda gruppen');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const loadChallenges = async () => {
    try {
      const response = await fetch(`${API_URL}/api/groups/${id}/challenges`, {
        headers: { 'Authorization': `Bearer ${sessionToken}` },
      });
      if (response.ok) {
        const data = await response.json();
        setChallenges(data);
      }
    } catch (error) {
      console.error('Error loading challenges:', error);
    }
  };

  const leaveGroup = async () => {
    Alert.alert(
      'Lämna grupp',
      `Är du säker på att du vill lämna ${group?.name}?`,
      [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Lämna',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${API_URL}/api/groups/${id}/leave`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${sessionToken}` },
              });
              if (response.ok) {
                router.back();
              } else {
                Alert.alert('Fel', 'Kunde inte lämna gruppen');
              }
            } catch (error) {
              console.error('Error leaving group:', error);
              Alert.alert('Fel', 'Kunde inte lämna gruppen');
            }
          },
        },
      ]
    );
  };

  const copyJoinCode = async () => {
    if (group?.invite_code) {
      await Clipboard.setStringAsync(group.invite_code);
      Alert.alert('Kopierad!', `Kopplingskoden ${group.invite_code} har kopierats till urklipp.`);
    }
  };

  const shareGroup = async () => {
    if (!group?.invite_code) return;
    
    try {
      const message = `Gå med i min MathMaster-grupp "${group.name}"!\n\nAnvänd kopplingskod: ${group.invite_code}`;
      
      await Share.share({
        message: message,
        title: `Gå med i ${group.name}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
      // Fallback to copy
      copyJoinCode();
    }
  };

  const shareChallenge = async (challenge: Challenge) => {
    try {
      // Deep link URL for the challenge
      const challengeUrl = `https://mathmaster.app/challenge/${challenge.challenge_id}`;
      
      const message = `🏆 Utmaning: ${challenge.name}\n\nJag utmanar dig i matte!\n\n📊 ${challenge.question_count} frågor\n⚡ ${
        challenge.difficulty === 'easy' ? 'Lätt' :
        challenge.difficulty === 'medium' ? 'Medel' : 'Svår'
      } svårighetsgrad\n\nKlicka för att acceptera:\n${challengeUrl}`;
      
      await Share.share({
        message: message,
        title: `MathMaster Utmaning: ${challenge.name}`,
        url: challengeUrl, // iOS will use this as the shareable link
      });
    } catch (error) {
      console.error('Error sharing challenge:', error);
      Alert.alert('Delningsfel', 'Kunde inte dela utmaningen');
    }
  };

  const createChallenge = async () => {
    if (!challengeName.trim()) {
      Alert.alert('Fel', 'Ange ett namn för utmaningen');
      return;
    }
    
    if (selectedCategories.length === 0) {
      Alert.alert('Fel', 'Välj minst en kategori');
      return;
    }

    setIsCreatingChallenge(true);
    
    try {
      const now = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 7); // 1 week challenge

      const response = await fetch(`${API_URL}/api/groups/${id}/challenges`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          name: challengeName.trim(),
          categories: selectedCategories,
          difficulty: selectedDifficulty,
          question_count: questionCount,
          start_date: now.toISOString(),
          end_date: endDate.toISOString(),
          daily_challenge: false,
        }),
      });

      if (response.ok) {
        setShowCreateChallenge(false);
        setChallengeName('');
        setSelectedCategories(['mixed']);
        setSelectedDifficulty('medium');
        setQuestionCount(15);
        loadChallenges();
        Alert.alert('Utmaning skapad!', 'Din utmaning är nu aktiv.');
      } else {
        const error = await response.json();
        Alert.alert('Fel', error.detail || 'Kunde inte skapa utmaning');
      }
    } catch (error) {
      console.error('Error creating challenge:', error);
      Alert.alert('Fel', 'Kunde inte skapa utmaning');
    } finally {
      setIsCreatingChallenge(false);
    }
  };

  const joinChallenge = async (challengeId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/groups/${id}/challenges/${challengeId}/join`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${sessionToken}` },
      });

      if (response.ok) {
        loadChallenges();
        Alert.alert('Gick med!', 'Du deltar nu i utmaningen.');
      } else {
        const error = await response.json();
        Alert.alert('Fel', error.detail || 'Kunde inte gå med');
      }
    } catch (error) {
      console.error('Error joining challenge:', error);
      Alert.alert('Fel', 'Kunde inte gå med i utmaningen');
    }
  };

  const toggleCategory = (key: string) => {
    setSelectedCategories(prev => 
      prev.includes(key) 
        ? prev.filter(c => c !== key)
        : [...prev, key]
    );
  };

  const isOwner = group?.creator_id === user?.user_id;

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!group) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.text }]}>Gruppen hittades inte</Text>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: theme.primary }]}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Tillbaka</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
          {group.name}
        </Text>
        <TouchableOpacity onPress={shareGroup} style={styles.headerButton}>
          <Ionicons name="share-outline" size={24} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadGroup(); loadChallenges(); }} />
        }
      >
        {/* Group Info */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle-outline" size={20} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Information</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Kopplingskod:</Text>
            <TouchableOpacity onPress={copyJoinCode} style={styles.codeContainer}>
              <Text style={[styles.codeText, { color: theme.primary }]}>{group.invite_code}</Text>
              <Ionicons name="copy-outline" size={16} color={theme.primary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Medlemmar:</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>{group.members?.length || 0}</Text>
          </View>
        </View>

        {/* Challenges Section */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="trophy-outline" size={20} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Utmaningar</Text>
          </View>
          
          {/* Create Challenge Button */}
          <TouchableOpacity
            style={[styles.createChallengeButton, { backgroundColor: theme.primary }]}
            onPress={() => setShowCreateChallenge(true)}
          >
            <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
            <Text style={styles.createChallengeButtonText}>Skapa utmaning</Text>
          </TouchableOpacity>

          {/* Challenges List */}
          {challenges.length === 0 ? (
            <View style={styles.emptyChallenges}>
              <Text style={[styles.emptyChallengesText, { color: theme.textSecondary }]}>
                Inga utmaningar än. Skapa en för att tävla med gruppen!
              </Text>
            </View>
          ) : (
            challenges.map((challenge) => {
              const isParticipant = challenge.participants?.some(p => p.user_id === user?.user_id);
              const endDate = new Date(challenge.end_date);
              const isExpired = endDate < new Date();
              
              return (
                <View 
                  key={challenge.challenge_id}
                  style={[styles.challengeCard, { backgroundColor: theme.background, borderColor: theme.border }]}
                >
                  <View style={styles.challengeHeader}>
                    <Text style={[styles.challengeName, { color: theme.text }]}>
                      {challenge.name}
                    </Text>
                    {isExpired ? (
                      <View style={[styles.statusBadge, { backgroundColor: theme.textMuted + '30' }]}>
                        <Text style={[styles.statusText, { color: theme.textMuted }]}>Avslutad</Text>
                      </View>
                    ) : (
                      <View style={[styles.statusBadge, { backgroundColor: theme.success + '30' }]}>
                        <Text style={[styles.statusText, { color: theme.success }]}>Aktiv</Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.challengeDetails}>
                    <Text style={[styles.challengeDetail, { color: theme.textSecondary }]}>
                      <Ionicons name="help-circle-outline" size={14} /> {challenge.question_count} frågor
                    </Text>
                    <Text style={[styles.challengeDetail, { color: theme.textSecondary }]}>
                      <Ionicons name="speedometer-outline" size={14} /> {
                        challenge.difficulty === 'easy' ? 'Lätt' :
                        challenge.difficulty === 'medium' ? 'Medel' : 'Svår'
                      }
                    </Text>
                    <Text style={[styles.challengeDetail, { color: theme.textSecondary }]}>
                      <Ionicons name="people-outline" size={14} /> {challenge.participants?.length || 0} deltagare
                    </Text>
                  </View>

                  {/* Leaderboard preview */}
                  {challenge.participants && challenge.participants.length > 0 && (
                    <View style={styles.leaderboardPreview}>
                      {challenge.participants
                        .sort((a, b) => b.score - a.score)
                        .slice(0, 3)
                        .map((p, index) => (
                          <View key={p.user_id} style={styles.leaderboardRow}>
                            <Text style={[styles.leaderboardRank, { color: theme.primary }]}>
                              {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                            </Text>
                            <Text style={[styles.leaderboardName, { color: theme.text }]} numberOfLines={1}>
                              {p.display_name}
                            </Text>
                            <Text style={[styles.leaderboardScore, { color: theme.textSecondary }]}>
                              {p.score} poäng
                            </Text>
                          </View>
                        ))}
                    </View>
                  )}

                  {!isParticipant && !isExpired && (
                    <TouchableOpacity
                      style={[styles.joinChallengeButton, { backgroundColor: theme.success }]}
                      onPress={() => joinChallenge(challenge.challenge_id)}
                    >
                      <Text style={styles.joinChallengeButtonText}>Gå med i utmaningen</Text>
                    </TouchableOpacity>
                  )}

                  {/* Share Challenge Button */}
                  {!isExpired && (
                    <TouchableOpacity
                      style={[styles.shareChallengeButton, { borderColor: theme.primary }]}
                      onPress={() => shareChallenge(challenge)}
                    >
                      <Ionicons name="share-social-outline" size={18} color={theme.primary} />
                      <Text style={[styles.shareChallengeButtonText, { color: theme.primary }]}>
                        Dela utmaning via SMS
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })
          )}
        </View>

        {/* Members List */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="people-outline" size={20} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Medlemmar</Text>
          </View>
          
          {group.members?.map((member, index) => {
            const stats = member.statistics || { games_played: 0, total_correct: 0, total_questions: 0 };
            const accuracy = stats.total_questions > 0 
              ? Math.round((stats.total_correct / stats.total_questions) * 100) 
              : 0;
            
            return (
              <View 
                key={member.user_id} 
                style={[
                  styles.memberRow,
                  index < group.members.length - 1 && { borderBottomColor: theme.border, borderBottomWidth: 1 }
                ]}
              >
                <View style={styles.memberInfo}>
                  <View style={[styles.avatar, { backgroundColor: theme.primary + '30' }]}>
                    <Text style={[styles.avatarText, { color: theme.primary }]}>
                      {member.display_name?.[0]?.toUpperCase() || '?'}
                    </Text>
                  </View>
                  <View style={styles.memberDetails}>
                    <Text style={[styles.memberName, { color: theme.text }]}>
                      {member.display_name}
                      {member.user_id === group.creator_id && (
                        <Text style={{ color: theme.primary }}> (Admin)</Text>
                      )}
                    </Text>
                    <Text style={[styles.memberStats, { color: theme.textSecondary }]}>
                      {stats.games_played} spel • {accuracy}% rätt
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* Leave Group Button */}
        {!isOwner && (
          <TouchableOpacity
            style={[styles.leaveButton, { borderColor: theme.error }]}
            onPress={leaveGroup}
          >
            <Ionicons name="exit-outline" size={20} color={theme.error} />
            <Text style={[styles.leaveButtonText, { color: theme.error }]}>Lämna grupp</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Create Challenge Modal */}
      {showCreateChallenge && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Skapa utmaning</Text>
              <TouchableOpacity onPress={() => setShowCreateChallenge(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {/* Challenge Name */}
              <Text style={[styles.inputLabel, { color: theme.text }]}>Namn</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                placeholder="T.ex. Veckans utmaning"
                placeholderTextColor={theme.textMuted}
                value={challengeName}
                onChangeText={setChallengeName}
              />

              {/* Categories */}
              <Text style={[styles.inputLabel, { color: theme.text }]}>Kategorier</Text>
              <View style={styles.categoriesGrid}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.key}
                    style={[
                      styles.categoryChip,
                      { 
                        backgroundColor: selectedCategories.includes(cat.key) 
                          ? cat.color 
                          : theme.background,
                        borderColor: selectedCategories.includes(cat.key) ? cat.color : theme.border,
                      }
                    ]}
                    onPress={() => toggleCategory(cat.key)}
                  >
                    <Ionicons 
                      name={cat.icon as any} 
                      size={16} 
                      color={selectedCategories.includes(cat.key) ? '#333' : theme.text} 
                    />
                    <Text style={[
                      styles.categoryChipText,
                      { color: selectedCategories.includes(cat.key) ? '#333' : theme.text }
                    ]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Difficulty */}
              <Text style={[styles.inputLabel, { color: theme.text }]}>Svårighetsgrad</Text>
              <View style={styles.difficultyRow}>
                {DIFFICULTIES.map((diff) => (
                  <TouchableOpacity
                    key={diff.key}
                    style={[
                      styles.difficultyChip,
                      { 
                        backgroundColor: selectedDifficulty === diff.key 
                          ? theme.primary 
                          : theme.background,
                        borderColor: theme.border,
                      }
                    ]}
                    onPress={() => setSelectedDifficulty(diff.key)}
                  >
                    <Text style={[
                      styles.difficultyChipText,
                      { color: selectedDifficulty === diff.key ? '#FFFFFF' : theme.text }
                    ]}>
                      {diff.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Question Count */}
              <Text style={[styles.inputLabel, { color: theme.text }]}>Antal frågor</Text>
              <View style={styles.questionCountRow}>
                {[10, 15, 20, 30].map((count) => (
                  <TouchableOpacity
                    key={count}
                    style={[
                      styles.questionCountChip,
                      { 
                        backgroundColor: questionCount === count 
                          ? theme.primary 
                          : theme.background,
                        borderColor: theme.border,
                      }
                    ]}
                    onPress={() => setQuestionCount(count)}
                  >
                    <Text style={[
                      styles.questionCountText,
                      { color: questionCount === count ? '#FFFFFF' : theme.text }
                    ]}>
                      {count}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[
                styles.createButton, 
                { backgroundColor: theme.primary },
                isCreatingChallenge && { opacity: 0.7 }
              ]}
              onPress={createChallenge}
              disabled={isCreatingChallenge}
            >
              {isCreatingChallenge ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.createButtonText}>Skapa utmaning</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    marginBottom: 20,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  codeText: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 2,
  },
  // Challenges
  createChallengeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 10,
    gap: 8,
    marginBottom: 12,
  },
  createChallengeButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
  emptyChallenges: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyChallengesText: {
    textAlign: 'center',
    fontSize: 14,
  },
  challengeCard: {
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  challengeName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  challengeDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 10,
  },
  challengeDetail: {
    fontSize: 13,
  },
  leaderboardPreview: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  leaderboardRank: {
    fontSize: 16,
    width: 28,
  },
  leaderboardName: {
    flex: 1,
    fontSize: 14,
  },
  leaderboardScore: {
    fontSize: 13,
    fontWeight: '600',
  },
  joinChallengeButton: {
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  joinChallengeButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  shareChallengeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
    gap: 6,
  },
  shareChallengeButtonText: {
    fontWeight: '600',
    fontSize: 14,
  },
  // Members
  memberRow: {
    paddingVertical: 12,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
  },
  memberStats: {
    fontSize: 13,
    marginTop: 2,
  },
  leaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    gap: 8,
    marginTop: 8,
    marginBottom: 32,
  },
  leaveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Modal
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    width: '100%',
    maxHeight: '85%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalContent: {
    padding: 16,
    maxHeight: 400,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  difficultyRow: {
    flexDirection: 'row',
    gap: 8,
  },
  difficultyChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  difficultyChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  questionCountRow: {
    flexDirection: 'row',
    gap: 8,
  },
  questionCountChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  questionCountText: {
    fontSize: 15,
    fontWeight: '600',
  },
  createButton: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
