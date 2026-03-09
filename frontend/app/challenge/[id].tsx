import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { useAuth } from '../../src/contexts';

const PRODUCTION_API = 'https://api.mathematicsmaster.app';
const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || PRODUCTION_API;

// App Store / Play Store URLs
const APP_STORE_URL = 'https://apps.apple.com/app/mathmaster-pro/id123456789'; // Update with real ID
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.mathmaster.pro';

interface Challenge {
  challenge_id: string;
  name: string;
  description?: string;
  categories: string[];
  difficulty: string;
  question_count: number;
  start_date: string;
  end_date: string;
  group_id: string;
  creator_id: string;
  participants: {
    user_id: string;
    display_name: string;
    score: number;
  }[];
}

interface Group {
  group_id: string;
  name: string;
  invite_code: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  addition: 'Addition',
  subtraction: 'Subtraktion',
  multiplication: 'Multiplikation',
  division: 'Division',
  fractions: 'Bråk',
  equations: 'Ekvationer',
  geometry: 'Geometri',
  percentage: 'Procent',
  units: 'Enheter',
  rounding: 'Avrundning',
  angles: 'Vinklar',
  probability: 'Sannolikhet',
  diagrams: 'Diagram',
};

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: 'Lätt',
  medium: 'Medel',
  hard: 'Svår',
};

export default function ChallengeAcceptScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const { user, sessionToken, isAuthenticated, isLoading: authLoading } = useAuth();

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (isAuthenticated && sessionToken) {
        loadChallengeData();
      } else {
        // Not logged in - redirect to login with return URL
        router.replace({
          pathname: '/login',
          params: { returnTo: `/challenge/${id}` }
        });
      }
    }
  }, [id, sessionToken, isAuthenticated, authLoading]);

  const loadChallengeData = async () => {
    try {
      // First, we need to find which group this challenge belongs to
      // The challenge ID contains info we can use
      const response = await fetch(`${API_URL}/api/challenges/${id}`, {
        headers: { 'Authorization': `Bearer ${sessionToken}` },
      });

      if (response.ok) {
        const data = await response.json();
        setChallenge(data.challenge);
        setGroup(data.group);
      } else if (response.status === 404) {
        setError('Utmaningen hittades inte');
      } else {
        setError('Kunde inte ladda utmaningen');
      }
    } catch (err) {
      console.error('Error loading challenge:', err);
      setError('Nätverksfel - försök igen');
    } finally {
      setIsLoading(false);
    }
  };

  const acceptChallenge = async () => {
    if (!challenge || !group) return;

    setIsJoining(true);
    try {
      // First, join the group if not already a member
      const joinGroupResponse = await fetch(`${API_URL}/api/groups/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ invite_code: group.invite_code }),
      });

      // It's OK if we're already a member (400 error)
      if (!joinGroupResponse.ok && joinGroupResponse.status !== 400) {
        throw new Error('Kunde inte gå med i gruppen');
      }

      // Then join the challenge
      const joinChallengeResponse = await fetch(
        `${API_URL}/api/groups/${group.group_id}/challenges/${challenge.challenge_id}/join`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${sessionToken}` },
        }
      );

      if (joinChallengeResponse.ok || joinChallengeResponse.status === 400) {
        // Success! Go to group page to see the challenge in the list
        Alert.alert(
          'Utmaning accepterad!',
          'Du har gått med i utmaningen. Du hittar den i gruppsidan och kan spela när du vill.',
          [{ text: 'OK', onPress: () => router.replace(`/group/${group.group_id}`) }]
        );
      } else {
        throw new Error('Kunde inte gå med i utmaningen');
      }
    } catch (err: any) {
      console.error('Error accepting challenge:', err);
      Alert.alert('Fel', err.message || 'Något gick fel');
    } finally {
      setIsJoining(false);
    }
  };

  const openStore = () => {
    const url = Platform.OS === 'ios' ? APP_STORE_URL : PLAY_STORE_URL;
    Linking.openURL(url);
  };

  if (authLoading || isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Laddar utmaning...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.centerContent}>
          <Ionicons name="alert-circle-outline" size={64} color={theme.error} />
          <Text style={[styles.errorTitle, { color: theme.text }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primary }]}
            onPress={() => router.replace('/')}
          >
            <Text style={styles.buttonText}>Gå till startsidan</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!challenge || !group) {
    return null;
  }

  const isAlreadyParticipant = challenge.participants?.some(p => p.user_id === user?.user_id);
  const endDate = new Date(challenge.end_date);
  const isExpired = endDate < new Date();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        {/* Challenge Icon */}
        <View style={[styles.iconContainer, { backgroundColor: theme.primary + '20' }]}>
          <Ionicons name="trophy" size={48} color={theme.primary} />
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: theme.text }]}>
          Du har blivit utmanad!
        </Text>

        {/* Challenge Card */}
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <Text style={[styles.challengeName, { color: theme.text }]}>
            {challenge.name}
          </Text>
          
          <Text style={[styles.groupName, { color: theme.textSecondary }]}>
            Grupp: {group.name}
          </Text>

          <View style={styles.divider} />

          {/* Challenge Details */}
          <View style={styles.detailRow}>
            <Ionicons name="grid-outline" size={20} color={theme.primary} />
            <Text style={[styles.detailText, { color: theme.text }]}>
              {challenge.categories.map(c => CATEGORY_LABELS[c] || c).join(', ')}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="speedometer-outline" size={20} color={theme.primary} />
            <Text style={[styles.detailText, { color: theme.text }]}>
              {DIFFICULTY_LABELS[challenge.difficulty] || challenge.difficulty}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="help-circle-outline" size={20} color={theme.primary} />
            <Text style={[styles.detailText, { color: theme.text }]}>
              {challenge.question_count} frågor
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="people-outline" size={20} color={theme.primary} />
            <Text style={[styles.detailText, { color: theme.text }]}>
              {challenge.participants?.length || 0} deltagare
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        {isExpired ? (
          <View style={[styles.expiredBadge, { backgroundColor: theme.error + '20' }]}>
            <Ionicons name="time-outline" size={20} color={theme.error} />
            <Text style={[styles.expiredText, { color: theme.error }]}>
              Utmaningen har avslutats
            </Text>
          </View>
        ) : isAlreadyParticipant ? (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primary }]}
            onPress={() => router.replace({
              pathname: '/game',
              params: {
                challengeId: challenge.challenge_id,
                groupId: group.group_id,
                categories: challenge.categories.join(','),
                difficulty: challenge.difficulty,
                questionCount: challenge.question_count.toString(),
              }
            })}
          >
            <Ionicons name="play" size={24} color="#FFFFFF" />
            <Text style={styles.buttonText}>Spela utmaningen</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.success }, isJoining && styles.buttonDisabled]}
            onPress={acceptChallenge}
            disabled={isJoining}
          >
            {isJoining ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
                <Text style={styles.buttonText}>Acceptera utmaningen</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.secondaryButton, { borderColor: theme.border }]}
          onPress={() => router.replace('/')}
        >
          <Text style={[styles.secondaryButtonText, { color: theme.text }]}>
            Inte nu
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 24,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  challengeName: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  groupName: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  detailText: {
    fontSize: 15,
    flex: 1,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: 16,
    borderRadius: 12,
    gap: 10,
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  secondaryButton: {
    width: '100%',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
  },
  expiredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  expiredText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
