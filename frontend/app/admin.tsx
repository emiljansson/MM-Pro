import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useTranslation } from '../src/hooks/useTheme';
import { useAuth } from '../src/contexts';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function AdminScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const { user, isAuthenticated, sessionToken } = useAuth();

  const [activeTab, setActiveTab] = useState('users');
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [languages, setLanguages] = useState<any[]>([]);
  const [translations, setTranslations] = useState<any[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState('sv');
  const [editingTrans, setEditingTrans] = useState<any>(null);
  const [newTransKey, setNewTransKey] = useState('');
  const [newTransText, setNewTransText] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (user?.role !== 'superadmin' && user?.role !== 'admin') {
      Alert.alert('Access Denied', 'Admin access required');
      router.replace('/');
      return;
    }
    loadData();
  }, [isAuthenticated, activeTab]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'users') {
        await loadUsers();
      } else if (activeTab === 'languages') {
        await loadLanguages();
      } else if (activeTab === 'translations') {
        await loadTranslations();
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setIsLoading(false);
  };

  const loadUsers = async () => {
    // Note: Would need a users list endpoint in backend
    setUsers([]);
  };

  const loadLanguages = async () => {
    try {
      const response = await fetch(`${API_URL}/api/languages/?active_only=false`, {
        headers: { 'Authorization': `Bearer ${sessionToken}` },
      });
      if (response.ok) {
        const data = await response.json();
        setLanguages(data);
      }
    } catch (error) {
      console.error('Error loading languages:', error);
    }
  };

  const loadTranslations = async () => {
    try {
      const response = await fetch(`${API_URL}/api/languages/translations/${selectedLanguage}/full`, {
        headers: { 'Authorization': `Bearer ${sessionToken}` },
      });
      if (response.ok) {
        const data = await response.json();
        setTranslations(data);
      }
    } catch (error) {
      console.error('Error loading translations:', error);
    }
  };

  const saveTranslation = async (key: string, text: string, category: string = 'ui') => {
    try {
      const response = await fetch(`${API_URL}/api/languages/translations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          key,
          language_code: selectedLanguage,
          text,
          category,
        }),
      });
      if (response.ok) {
        Alert.alert('Success', 'Translation saved');
        loadTranslations();
        setEditingTrans(null);
        setNewTransKey('');
        setNewTransText('');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not save translation');
    }
  };

  const tabs = [
    { key: 'users', icon: 'people', label: 'Users' },
    { key: 'languages', icon: 'language', label: 'Languages' },
    { key: 'translations', icon: 'text', label: 'Translations' },
  ];

  if (isLoading && !users.length && !languages.length && !translations.length) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.card }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Admin Panel
        </Text>
        <View style={styles.backButton} />
      </View>

      {/* Tabs */}
      <View style={[styles.tabs, { backgroundColor: theme.card }]}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              activeTab === tab.key && { borderBottomColor: theme.primary, borderBottomWidth: 2 }
            ]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Ionicons
              name={tab.icon as any}
              size={20}
              color={activeTab === tab.key ? theme.primary : theme.textMuted}
            />
            <Text style={[
              styles.tabText,
              { color: activeTab === tab.key ? theme.primary : theme.textMuted }
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content}>
        {/* Users Tab */}
        {activeTab === 'users' && (
          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>User Management</Text>
            <Text style={[styles.cardDesc, { color: theme.textSecondary }]}>
              User management requires direct database access or additional API endpoints.
            </Text>
          </View>
        )}

        {/* Languages Tab */}
        {activeTab === 'languages' && (
          <View>
            {languages.map((lang) => (
              <View
                key={lang.code}
                style={[styles.listItem, { backgroundColor: theme.card }]}
              >
                <View style={styles.listItemContent}>
                  <Text style={[styles.listItemTitle, { color: theme.text }]}>
                    {lang.native_name} ({lang.code})
                  </Text>
                  <Text style={[styles.listItemSubtitle, { color: theme.textSecondary }]}>
                    {lang.name} • Priority: {lang.priority}
                    {lang.rtl && ' • RTL'}
                  </Text>
                </View>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: lang.active ? theme.successLight : theme.errorLight }
                ]}>
                  <Text style={[styles.statusText, { color: lang.active ? theme.success : theme.error }]}>
                    {lang.active ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Translations Tab */}
        {activeTab === 'translations' && (
          <View>
            {/* Language Selector */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.langSelector}>
              {['sv', 'en', 'ar', 'fi', 'es', 'so'].map((code) => (
                <TouchableOpacity
                  key={code}
                  style={[
                    styles.langButton,
                    { backgroundColor: selectedLanguage === code ? theme.primary : theme.card }
                  ]}
                  onPress={() => {
                    setSelectedLanguage(code);
                    setIsLoading(true);
                  }}
                >
                  <Text style={{ color: selectedLanguage === code ? '#FFF' : theme.text }}>
                    {code.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Add New Translation */}
            <View style={[styles.card, { backgroundColor: theme.card }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Add Translation</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                placeholder="Key (e.g., welcome_message)"
                placeholderTextColor={theme.textMuted}
                value={newTransKey}
                onChangeText={setNewTransKey}
              />
              <TextInput
                style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                placeholder="Text"
                placeholderTextColor={theme.textMuted}
                value={newTransText}
                onChangeText={setNewTransText}
                multiline
              />
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: theme.primary }]}
                onPress={() => saveTranslation(newTransKey, newTransText)}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>

            {/* Translations List */}
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              {translations.length} translations
            </Text>
            {translations.slice(0, 50).map((trans) => (
              <View
                key={trans.key}
                style={[styles.transItem, { backgroundColor: theme.card }]}
              >
                {editingTrans?.key === trans.key ? (
                  <View style={styles.editContainer}>
                    <Text style={[styles.transKey, { color: theme.primary }]}>{trans.key}</Text>
                    <TextInput
                      style={[styles.editInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                      value={editingTrans.text}
                      onChangeText={(text) => setEditingTrans({ ...editingTrans, text })}
                      multiline
                    />
                    <View style={styles.editActions}>
                      <TouchableOpacity
                        style={[styles.editButton, { backgroundColor: theme.error }]}
                        onPress={() => setEditingTrans(null)}
                      >
                        <Text style={{ color: '#FFF' }}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.editButton, { backgroundColor: theme.success }]}
                        onPress={() => saveTranslation(trans.key, editingTrans.text, trans.category)}
                      >
                        <Text style={{ color: '#FFF' }}>Save</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.transContent}
                    onPress={() => setEditingTrans({ ...trans })}
                  >
                    <Text style={[styles.transKey, { color: theme.primary }]}>{trans.key}</Text>
                    <Text style={[styles.transText, { color: theme.text }]}>{trans.text}</Text>
                    <Text style={[styles.transCategory, { color: theme.textMuted }]}>
                      {trans.category}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
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
  backButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  tabText: { fontSize: 13, fontWeight: '600' },
  content: { flex: 1, padding: 16 },
  card: { padding: 16, borderRadius: 12, marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  cardDesc: { fontSize: 14 },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
  },
  listItemContent: { flex: 1 },
  listItemTitle: { fontSize: 15, fontWeight: '600' },
  listItemSubtitle: { fontSize: 12, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '600' },
  langSelector: { marginBottom: 16, flexGrow: 0 },
  langButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginBottom: 12,
  },
  saveButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: { color: '#FFF', fontWeight: '600' },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  transItem: { padding: 12, borderRadius: 8, marginBottom: 8 },
  transContent: {},
  transKey: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  transText: { fontSize: 14 },
  transCategory: { fontSize: 10, marginTop: 4 },
  editContainer: {},
  editInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginVertical: 8,
    minHeight: 60,
  },
  editActions: { flexDirection: 'row', gap: 8 },
  editButton: {
    flex: 1,
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
});
