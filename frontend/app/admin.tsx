import React, { useEffect, useState, useCallback } from 'react';
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
  RefreshControl,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useTranslation } from '../src/hooks/useTheme';
import { useAuth } from '../src/contexts';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface User {
  user_id: string;
  email: string;
  display_name: string;
  role: string;
  created_at: string;
  is_active?: boolean;
  statistics?: any;
}

interface Stats {
  users: {
    total: number;
    admins: number;
    by_role: Record<string, number>;
    new_this_week: number;
  };
  games: {
    total: number;
    this_week: number;
  };
  translations: {
    total: number;
    by_language: Record<string, number>;
  };
}

export default function AdminScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const { user, isAuthenticated, sessionToken } = useAuth();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
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
      Alert.alert('Åtkomst nekad', 'Adminbehörighet krävs');
      router.replace('/');
      return;
    }
    loadData();
  }, [isAuthenticated, activeTab, selectedLanguage]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'dashboard') {
        await loadStats();
      } else if (activeTab === 'users') {
        await loadUsers();
      } else if (activeTab === 'translations') {
        await loadTranslations();
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setIsLoading(false);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [activeTab, selectedLanguage]);

  const loadStats = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/stats`, {
        headers: { 'Authorization': `Bearer ${sessionToken}` },
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const query = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : '';
      const response = await fetch(`${API_URL}/api/admin/users?limit=100${query}`, {
        headers: { 'Authorization': `Bearer ${sessionToken}` },
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setUsersTotal(data.total);
      }
    } catch (error) {
      console.error('Error loading users:', error);
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

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ role: newRole }),
      });
      if (response.ok) {
        Alert.alert('Klart', 'Användarroll uppdaterad');
        loadUsers();
        setShowUserModal(false);
      } else {
        const data = await response.json();
        Alert.alert('Fel', data.detail || 'Kunde inte uppdatera');
      }
    } catch (error) {
      Alert.alert('Fel', 'Nätverksfel');
    }
  };

  const deleteUser = async (userId: string) => {
    Alert.alert(
      'Radera användare',
      'Är du säker? Detta kan inte ångras.',
      [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Radera',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${API_URL}/api/admin/users/${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${sessionToken}` },
              });
              if (response.ok) {
                Alert.alert('Klart', 'Användare raderad');
                loadUsers();
                setShowUserModal(false);
              } else {
                const data = await response.json();
                Alert.alert('Fel', data.detail || 'Kunde inte radera');
              }
            } catch (error) {
              Alert.alert('Fel', 'Nätverksfel');
            }
          }
        }
      ]
    );
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
        Alert.alert('Klart', 'Översättning sparad');
        loadTranslations();
        setEditingTrans(null);
        setNewTransKey('');
        setNewTransText('');
      }
    } catch (error) {
      Alert.alert('Fel', 'Kunde inte spara');
    }
  };

  const tabs = [
    { key: 'dashboard', icon: 'stats-chart', label: 'Dashboard' },
    { key: 'users', icon: 'people', label: 'Användare' },
    { key: 'translations', icon: 'language', label: 'Översättningar' },
  ];

  const renderDashboard = () => (
    <View>
      {/* Stats Cards */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: theme.card }]}>
          <View style={[styles.statIcon, { backgroundColor: theme.primary + '20' }]}>
            <Ionicons name="people" size={24} color={theme.primary} />
          </View>
          <Text style={[styles.statValue, { color: theme.text }]}>
            {stats?.users.total || 0}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
            Användare
          </Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: theme.card }]}>
          <View style={[styles.statIcon, { backgroundColor: theme.success + '20' }]}>
            <Ionicons name="game-controller" size={24} color={theme.success} />
          </View>
          <Text style={[styles.statValue, { color: theme.text }]}>
            {stats?.games.total || 0}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
            Spelsessioner
          </Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: theme.card }]}>
          <View style={[styles.statIcon, { backgroundColor: theme.warning + '20' }]}>
            <Ionicons name="person-add" size={24} color={theme.warning} />
          </View>
          <Text style={[styles.statValue, { color: theme.text }]}>
            {stats?.users.new_this_week || 0}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
            Nya denna vecka
          </Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: theme.card }]}>
          <View style={[styles.statIcon, { backgroundColor: '#9C27B0' + '20' }]}>
            <Ionicons name="text" size={24} color="#9C27B0" />
          </View>
          <Text style={[styles.statValue, { color: theme.text }]}>
            {stats?.translations.total || 0}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
            Översättningar
          </Text>
        </View>
      </View>

      {/* User Roles */}
      <View style={[styles.section, { backgroundColor: theme.card }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Användarroller</Text>
        {stats?.users.by_role && Object.entries(stats.users.by_role).map(([role, count]) => (
          <View key={role} style={styles.roleRow}>
            <View style={styles.roleInfo}>
              <Ionicons 
                name={role === 'superadmin' ? 'shield' : role === 'admin' ? 'key' : 'person'} 
                size={18} 
                color={role === 'superadmin' ? theme.error : role === 'admin' ? theme.warning : theme.primary} 
              />
              <Text style={[styles.roleName, { color: theme.text }]}>
                {role === 'superadmin' ? 'Superadmin' : role === 'admin' ? 'Admin' : 'Användare'}
              </Text>
            </View>
            <Text style={[styles.roleCount, { color: theme.textSecondary }]}>{count}</Text>
          </View>
        ))}
      </View>

      {/* Translations by Language */}
      <View style={[styles.section, { backgroundColor: theme.card }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Översättningar per språk</Text>
        {stats?.translations.by_language && Object.entries(stats.translations.by_language).map(([lang, count]) => (
          <View key={lang} style={styles.roleRow}>
            <Text style={[styles.roleName, { color: theme.text }]}>{lang.toUpperCase()}</Text>
            <Text style={[styles.roleCount, { color: theme.textSecondary }]}>{count}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderUsers = () => (
    <View>
      {/* Search */}
      <View style={[styles.searchContainer, { backgroundColor: theme.card }]}>
        <Ionicons name="search" size={20} color={theme.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Sök användare..."
          placeholderTextColor={theme.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={loadUsers}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => { setSearchQuery(''); loadUsers(); }}>
            <Ionicons name="close-circle" size={20} color={theme.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      <Text style={[styles.countText, { color: theme.textSecondary }]}>
        {usersTotal} användare totalt
      </Text>

      {/* User List */}
      {users.map((u) => (
        <TouchableOpacity
          key={u.user_id}
          style={[styles.userCard, { backgroundColor: theme.card }]}
          onPress={() => { setSelectedUser(u); setShowUserModal(true); }}
        >
          <View style={[styles.userAvatar, { backgroundColor: theme.primary + '20' }]}>
            <Text style={[styles.userInitial, { color: theme.primary }]}>
              {(u.display_name || u.email)[0].toUpperCase()}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: theme.text }]}>{u.display_name}</Text>
            <Text style={[styles.userEmail, { color: theme.textSecondary }]}>{u.email}</Text>
          </View>
          <View style={[
            styles.roleBadge,
            { backgroundColor: u.role === 'superadmin' ? theme.error + '20' : u.role === 'admin' ? theme.warning + '20' : theme.primary + '20' }
          ]}>
            <Text style={[
              styles.roleBadgeText,
              { color: u.role === 'superadmin' ? theme.error : u.role === 'admin' ? theme.warning : theme.primary }
            ]}>
              {u.role}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderTranslations = () => (
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
            onPress={() => setSelectedLanguage(code)}
          >
            <Text style={{ color: selectedLanguage === code ? '#FFF' : theme.text, fontWeight: '600' }}>
              {code.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Add New Translation */}
      <View style={[styles.section, { backgroundColor: theme.card }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Lägg till översättning</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
          placeholder="Nyckel (t.ex. welcome_message)"
          placeholderTextColor={theme.textMuted}
          value={newTransKey}
          onChangeText={setNewTransKey}
        />
        <TextInput
          style={[styles.input, styles.multilineInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
          placeholder="Text"
          placeholderTextColor={theme.textMuted}
          value={newTransText}
          onChangeText={setNewTransText}
          multiline
        />
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: theme.primary }]}
          onPress={() => newTransKey && newTransText && saveTranslation(newTransKey, newTransText)}
        >
          <Text style={styles.saveButtonText}>Spara</Text>
        </TouchableOpacity>
      </View>

      {/* Translations List */}
      <Text style={[styles.countText, { color: theme.textSecondary }]}>
        {translations.length} översättningar
      </Text>
      {translations.slice(0, 100).map((trans) => (
        <View key={trans.key} style={[styles.transItem, { backgroundColor: theme.card }]}>
          {editingTrans?.key === trans.key ? (
            <View>
              <Text style={[styles.transKey, { color: theme.primary }]}>{trans.key}</Text>
              <TextInput
                style={[styles.editInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                value={editingTrans.text}
                onChangeText={(text) => setEditingTrans({ ...editingTrans, text })}
                multiline
              />
              <View style={styles.editActions}>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: theme.card, borderColor: theme.border }]}
                  onPress={() => setEditingTrans(null)}
                >
                  <Text style={{ color: theme.textSecondary }}>Avbryt</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: theme.primary }]}
                  onPress={() => saveTranslation(trans.key, editingTrans.text, trans.category)}
                >
                  <Text style={{ color: '#FFF' }}>Spara</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity onPress={() => setEditingTrans({ ...trans })}>
              <Text style={[styles.transKey, { color: theme.primary }]}>{trans.key}</Text>
              <Text style={[styles.transText, { color: theme.text }]}>{trans.text}</Text>
              <Text style={[styles.transCategory, { color: theme.textMuted }]}>{trans.category}</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </View>
  );

  if (isLoading && !stats && !users.length && !translations.length) {
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
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Admin Panel</Text>
        <View style={styles.backButton} />
      </View>

      {/* Tabs - Scrollable */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={[styles.tabsContainer, { backgroundColor: theme.card, borderBottomColor: theme.border }]}
        contentContainerStyle={styles.tabsContent}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              activeTab === tab.key && { borderBottomColor: theme.primary, borderBottomWidth: 3 }
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
      </ScrollView>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} />
        }
      >
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'users' && renderUsers()}
        {activeTab === 'translations' && renderTranslations()}
      </ScrollView>

      {/* User Detail Modal */}
      <Modal
        visible={showUserModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowUserModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Användardetaljer</Text>
              <TouchableOpacity onPress={() => setShowUserModal(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            {selectedUser && (
              <View>
                <View style={[styles.userDetailAvatar, { backgroundColor: theme.primary + '20' }]}>
                  <Text style={[styles.userDetailInitial, { color: theme.primary }]}>
                    {(selectedUser.display_name || selectedUser.email)[0].toUpperCase()}
                  </Text>
                </View>
                <Text style={[styles.userDetailName, { color: theme.text }]}>
                  {selectedUser.display_name}
                </Text>
                <Text style={[styles.userDetailEmail, { color: theme.textSecondary }]}>
                  {selectedUser.email}
                </Text>

                {/* Role Selection */}
                <Text style={[styles.modalLabel, { color: theme.textSecondary }]}>Ändra roll:</Text>
                <View style={styles.roleButtons}>
                  {['user', 'admin', 'superadmin'].map((role) => (
                    <TouchableOpacity
                      key={role}
                      style={[
                        styles.roleButton,
                        { 
                          backgroundColor: selectedUser.role === role ? theme.primary : theme.background,
                          borderColor: theme.border
                        }
                      ]}
                      onPress={() => updateUserRole(selectedUser.user_id, role)}
                      disabled={user?.role !== 'superadmin' || selectedUser.user_id === user?.user_id}
                    >
                      <Text style={{ 
                        color: selectedUser.role === role ? '#FFF' : theme.text,
                        fontWeight: '600'
                      }}>
                        {role === 'superadmin' ? 'Superadmin' : role === 'admin' ? 'Admin' : 'Användare'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Delete Button */}
                {user?.role === 'superadmin' && selectedUser.user_id !== user?.user_id && (
                  <TouchableOpacity
                    style={[styles.deleteButton, { backgroundColor: theme.error }]}
                    onPress={() => deleteUser(selectedUser.user_id)}
                  >
                    <Ionicons name="trash" size={18} color="#FFF" />
                    <Text style={styles.deleteButtonText}>Radera användare</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>
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
  },
  tabsContainer: {
    borderBottomWidth: 1,
    flexGrow: 0,
  },
  tabsContent: {
    paddingHorizontal: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginHorizontal: 4,
    gap: 6,
  },
  tabText: { fontSize: 13, fontWeight: '600' },
  content: { flex: 1, padding: 16 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    width: '47%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: { fontSize: 24, fontWeight: '800' },
  statLabel: { fontSize: 12, marginTop: 4 },
  section: { padding: 16, borderRadius: 12, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  roleInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  roleName: { fontSize: 14, fontWeight: '500' },
  roleCount: { fontSize: 14, fontWeight: '600' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 12,
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 15 },
  countText: { fontSize: 12, marginBottom: 12, fontWeight: '500' },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInitial: { fontSize: 18, fontWeight: '700' },
  userInfo: { flex: 1, marginLeft: 12 },
  userName: { fontSize: 15, fontWeight: '600' },
  userEmail: { fontSize: 12, marginTop: 2 },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  roleBadgeText: { fontSize: 11, fontWeight: '600' },
  langSelector: { marginBottom: 16, flexGrow: 0 },
  langButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    marginRight: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    fontSize: 14,
    marginBottom: 12,
  },
  multilineInput: { minHeight: 80, textAlignVertical: 'top' },
  saveButton: {
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  transItem: { padding: 14, borderRadius: 10, marginBottom: 8 },
  transKey: { fontSize: 12, fontWeight: '700', marginBottom: 4 },
  transText: { fontSize: 14, lineHeight: 20 },
  transCategory: { fontSize: 10, marginTop: 6, textTransform: 'uppercase' },
  editInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginVertical: 10,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  editActions: { flexDirection: 'row', gap: 10 },
  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  userDetailAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  userDetailInitial: { fontSize: 32, fontWeight: '700' },
  userDetailName: { fontSize: 20, fontWeight: '700', textAlign: 'center' },
  userDetailEmail: { fontSize: 14, textAlign: 'center', marginTop: 4, marginBottom: 24 },
  modalLabel: { fontSize: 12, fontWeight: '600', marginBottom: 10, textTransform: 'uppercase' },
  roleButtons: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  roleButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 10,
    gap: 8,
    marginTop: 10,
  },
  deleteButtonText: { color: '#FFF', fontWeight: '700' },
});
