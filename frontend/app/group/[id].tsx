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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
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

interface Group {
  group_id: string;
  name: string;
  description?: string;
  join_code: string;
  owner_id: string;
  members: GroupMember[];
  created_at: string;
}

export default function GroupDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const { t } = useTranslation();
  const { user, sessionToken, isAuthenticated } = useAuth();

  const [group, setGroup] = useState<Group | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (id && sessionToken) {
      loadGroup();
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

  const copyJoinCode = () => {
    if (group?.join_code) {
      Alert.alert('Kopplingskod', `Koden är: ${group.join_code}\n\nDela denna kod med andra för att de ska kunna gå med i gruppen.`);
    }
  };

  const isOwner = group?.owner_id === user?.user_id;

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
        <TouchableOpacity onPress={copyJoinCode} style={styles.headerButton}>
          <Ionicons name="share-outline" size={24} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadGroup(); }} />
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
              <Text style={[styles.codeText, { color: theme.primary }]}>{group.join_code}</Text>
              <Ionicons name="copy-outline" size={16} color={theme.primary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Medlemmar:</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>{group.members?.length || 0}</Text>
          </View>
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
                      {member.user_id === group.owner_id && (
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
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 2,
  },
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
});
