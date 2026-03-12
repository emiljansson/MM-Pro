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
import { ThemeMode } from '../src/types';

// Get version directly from app.json
import appJson from '../app.json';
const appVersion = appJson.expo.version;

// Theme selector button component
const ThemeButton = ({
  mode,
  currentMode,
  label,
  icon,
  onPress,
  theme,
}: {
  mode: ThemeMode;
  currentMode: ThemeMode;
  label: string;
  icon: string;
  onPress: () => void;
  theme: any;
}) => {
  const isSelected = currentMode === mode;
  return (
    <TouchableOpacity
      style={[
        styles.themeButton,
        {
          backgroundColor: isSelected ? theme.primary : theme.surface,
          borderColor: isSelected ? theme.primary : theme.border,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons
        name={icon as any}
        size={24}
        color={isSelected ? '#FFFFFF' : theme.text}
      />
      <Text
        style={[
          styles.themeButtonText,
          { color: isSelected ? '#FFFFFF' : theme.text },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

export default function SettingsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const { user, isAuthenticated, logout } = useAuth();
  const { theme: themeMode, setTheme, setLanguage } = useGameStore();

  const handleThemeChange = (mode: ThemeMode) => {
    setTheme(mode);
  };

  const accountItems = [
    {
      icon: 'log-in',
      label: t('login') || 'Logga in',
      onPress: () => router.push('/login'),
      hidden: isAuthenticated,
    },
  ];

  const adminItems = user?.role === 'superadmin' || user?.role === 'admin' ? [
    {
      icon: 'settings',
      label: 'Admin Panel',
      onPress: () => router.push('/admin'),
    },
  ] : [];

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

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Theme Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            {t('appearance') || 'Utseende'}
          </Text>
          <View style={[styles.themeSelector, { backgroundColor: theme.card }]}>
            <Text style={[styles.themeSelectorLabel, { color: theme.text }]}>
              {t('theme') || 'Tema'}
            </Text>
            <View style={styles.themeButtons}>
              <ThemeButton
                mode="auto"
                currentMode={themeMode}
                label="Auto"
                icon="phone-portrait-outline"
                onPress={() => handleThemeChange('auto')}
                theme={theme}
              />
              <ThemeButton
                mode="light"
                currentMode={themeMode}
                label={t('light') || 'Ljus'}
                icon="sunny"
                onPress={() => handleThemeChange('light')}
                theme={theme}
              />
              <ThemeButton
                mode="dark"
                currentMode={themeMode}
                label={t('dark') || 'Mörk'}
                icon="moon"
                onPress={() => handleThemeChange('dark')}
                theme={theme}
              />
            </View>
            <Text style={[styles.themeDescription, { color: theme.textMuted }]}>
              {themeMode === 'auto' 
                ? 'Följer enhetens inställning (dag/natt)'
                : themeMode === 'light' 
                  ? 'Alltid ljust tema'
                  : 'Alltid mörkt tema'}
            </Text>
          </View>
        </View>

        {/* Account Section - Only show for non-authenticated users */}
        {!isAuthenticated && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              {t('account') || 'Konto'}
            </Text>
            <View style={[styles.sectionContent, { backgroundColor: theme.card }]}>
              {accountItems
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
                    <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
                  </TouchableOpacity>
                ))}
            </View>
          </View>
        )}

        {/* Admin Section */}
        {adminItems.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              Admin
            </Text>
            <View style={[styles.sectionContent, { backgroundColor: theme.card }]}>
              {adminItems.map((item) => (
                <TouchableOpacity
                  key={item.label}
                  style={styles.settingItem}
                  onPress={item.onPress}
                >
                  <View style={styles.settingLeft}>
                    <Ionicons name={item.icon as any} size={22} color={theme.primary} />
                    <Text style={[styles.settingLabel, { color: theme.text }]}>
                      {item.label}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={{ fontSize: 24, fontWeight: '800', letterSpacing: -0.5 }}>
            <Text style={{ color: '#9B59B6' }}>Matematik</Text>
            <Text style={{ color: '#D8BFD8' }}>Mästaren Pro</Text>
          </Text>
          <Text style={[styles.appVersion, { color: theme.textMuted }]}>Version {appVersion}</Text>
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
  themeSelector: {
    borderRadius: 12,
    padding: 16,
  },
  themeSelectorLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  themeButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  themeButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 2,
    gap: 6,
  },
  themeButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  themeDescription: {
    fontSize: 12,
    marginTop: 12,
    textAlign: 'center',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingLabel: { fontSize: 16 },
  appInfo: { alignItems: 'center', marginTop: 32, marginBottom: 48 },
  appName: { fontSize: 16, fontWeight: '600' },
  appVersion: { fontSize: 12, marginTop: 4 },
});
