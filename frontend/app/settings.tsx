import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useTranslation } from '../src/hooks/useTheme';
import { useAuth } from '../src/contexts';
import { useGameStore } from '../src/stores/gameStore';

export default function SettingsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const { user, isAuthenticated, logout } = useAuth();
  const { theme: themeMode, toggleTheme, setLanguage } = useGameStore();

  const settingsOptions = [
    {
      section: t('appearance') || 'Appearance',
      items: [
        {
          icon: themeMode === 'dark' ? 'sunny' : 'moon',
          label: t('theme') || 'Theme',
          value: themeMode === 'dark' ? t('dark') || 'Dark' : t('light') || 'Light',
          onPress: toggleTheme,
        },
      ],
    },
    {
      section: t('account') || 'Account',
      items: [
        {
          icon: 'person',
          label: t('profile') || 'Profile',
          onPress: () => router.push('/profile'),
          hidden: !isAuthenticated,
        },
        {
          icon: 'log-in',
          label: t('login') || 'Login',
          onPress: () => router.push('/login'),
          hidden: isAuthenticated,
        },
      ],
    },
  ];

  // Add admin option if user is admin
  if (user?.role === 'superadmin' || user?.role === 'admin') {
    settingsOptions.push({
      section: 'Admin',
      items: [
        {
          icon: 'settings',
          label: 'Admin Panel',
          onPress: () => router.push('/admin'),
        },
      ],
    });
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
          {t('settings')}
        </Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.content}>
        {settingsOptions.map((section) => (
          <View key={section.section} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              {section.section}
            </Text>
            <View style={[styles.sectionContent, { backgroundColor: theme.card }]}>
              {section.items
                .filter((item) => !item.hidden)
                .map((item, index, arr) => (
                  <TouchableOpacity
                    key={item.label}
                    style={[
                      styles.settingItem,
                      index < arr.length - 1 && { borderBottomWidth: 0.5, borderBottomColor: theme.border }
                    ]}
                    onPress={item.onPress}
                  >
                    <View style={styles.settingLeft}>
                      <Ionicons name={item.icon as any} size={22} color={theme.primary} />
                      <Text style={[styles.settingLabel, { color: theme.text }]}>
                        {item.label}
                      </Text>
                    </View>
                    <View style={styles.settingRight}>
                      {item.value && (
                        <Text style={[styles.settingValue, { color: theme.textSecondary }]}>
                          {item.value}
                        </Text>
                      )}
                      <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
                    </View>
                  </TouchableOpacity>
                ))}
            </View>
          </View>
        ))}

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={[styles.appName, { color: theme.primary }]}>MathMaster Pro</Text>
          <Text style={[styles.appVersion, { color: theme.textMuted }]}>Version 2.0.0</Text>
        </View>
      </ScrollView>
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
  content: { flex: 1, padding: 16 },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionContent: { borderRadius: 12, overflow: 'hidden' },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingLabel: { fontSize: 16 },
  settingRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  settingValue: { fontSize: 14 },
  appInfo: { alignItems: 'center', marginTop: 32, marginBottom: 48 },
  appName: { fontSize: 16, fontWeight: '600' },
  appVersion: { fontSize: 12, marginTop: 4 },
});
