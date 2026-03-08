import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useTranslation } from '../src/hooks/useTheme';
import { useAuth } from '../src/contexts';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function EditProfileScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const { user, isAuthenticated, sessionToken, logout, refreshUser } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    // Initialize form with user data when available
    if (user) {
      setDisplayName(user.display_name || '');
      setFirstName(user.first_name || '');
      setLastName(user.last_name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  // Redirect if not authenticated (separate effect)
  useEffect(() => {
    if (!isAuthenticated && !user) {
      // Small delay to allow auth context to initialize
      const timer = setTimeout(() => {
        if (!isAuthenticated) {
          router.replace('/login');
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user]);

  const handleSave = async () => {
    if (!displayName.trim()) {
      Alert.alert('Fel', 'Visningsnamn kan inte vara tomt');
      return;
    }
    if (!email.trim()) {
      Alert.alert('Fel', 'E-postadress kan inte vara tom');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/update-profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          display_name: displayName.trim(),
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim(),
        }),
      });

      if (response.ok) {
        // Refresh user data
        if (refreshUser) {
          await refreshUser();
        }
        Alert.alert('Sparat', 'Din profil har uppdaterats', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        const data = await response.json();
        Alert.alert('Fel', data.detail || 'Kunde inte spara profilen');
      }
    } catch (error) {
      console.error('Save profile error:', error);
      Alert.alert('Fel', 'Ett fel uppstod. Försök igen.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Radera konto',
      'Är du säker på att du vill radera ditt konto? Detta kan inte ångras och all din data kommer att försvinna.',
      [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Radera',
          style: 'destructive',
          onPress: confirmDeleteAccount,
        },
      ]
    );
  };

  const confirmDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/delete-account`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
        },
      });

      if (response.ok) {
        await logout();
        Alert.alert('Konto raderat', 'Ditt konto har raderats.', [
          { text: 'OK', onPress: () => router.replace('/') }
        ]);
      } else {
        const data = await response.json();
        Alert.alert('Fel', data.detail || 'Kunde inte radera kontot');
      }
    } catch (error) {
      console.error('Delete account error:', error);
      Alert.alert('Fel', 'Ett fel uppstod. Försök igen.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!user) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: theme.card }]}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Redigera profil
          </Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Avatar */}
          <View style={styles.avatarSection}>
            <View style={[styles.avatarContainer, { backgroundColor: theme.primary }]}>
              <Text style={styles.avatarText}>
                {displayName.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
          </View>

          {/* Form Fields */}
          <View style={[styles.formSection, { backgroundColor: theme.card }]}>
            {/* Display Name */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>
                Visningsnamn
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: theme.surface,
                    color: theme.text,
                    borderColor: theme.border,
                  }
                ]}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Ditt visningsnamn"
                placeholderTextColor={theme.textMuted}
                autoCapitalize="words"
              />
            </View>

            {/* First Name */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>
                Förnamn
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: theme.surface,
                    color: theme.text,
                    borderColor: theme.border,
                  }
                ]}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Ditt förnamn"
                placeholderTextColor={theme.textMuted}
                autoCapitalize="words"
              />
            </View>

            {/* Last Name */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>
                Efternamn
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: theme.surface,
                    color: theme.text,
                    borderColor: theme.border,
                  }
                ]}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Ditt efternamn"
                placeholderTextColor={theme.textMuted}
                autoCapitalize="words"
              />
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>
                E-postadress
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: theme.surface,
                    color: theme.text,
                    borderColor: theme.border,
                  }
                ]}
                value={email}
                onChangeText={setEmail}
                placeholder="din@email.se"
                placeholderTextColor={theme.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: theme.primary }]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Spara ändringar</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Delete Account Button */}
          <TouchableOpacity
            style={[styles.deleteButton, { backgroundColor: theme.errorLight }]}
            onPress={handleDeleteAccount}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color={theme.error} />
            ) : (
              <>
                <Ionicons name="trash-outline" size={20} color={theme.error} />
                <Text style={[styles.deleteButtonText, { color: theme.error }]}>
                  Radera konto
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Warning text */}
          <Text style={[styles.warningText, { color: theme.textMuted }]}>
            Varning: Att radera kontot är permanent och kan inte ångras.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  formSection: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  input: {
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  warningText: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 32,
  },
});
