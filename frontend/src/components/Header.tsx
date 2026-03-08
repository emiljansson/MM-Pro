import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme, useTranslation } from '../hooks/useTheme';
import { useGameStore } from '../stores/gameStore';
import { useAuth } from '../contexts';

interface HeaderProps {
  onToggleTheme: () => void;
  onOpenLanguageSelector: () => void;
  isCompact?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleTheme,
  onOpenLanguageSelector,
  isCompact = false,
}) => {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const themeMode = useGameStore((state) => state.theme);
  const { isAuthenticated } = useAuth();

  return (
    <View style={[styles.header, isCompact && styles.headerCompact]}>
      <View style={styles.headerTop}>
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: theme.card }]}
          onPress={onToggleTheme}
        >
          <Ionicons
            name={themeMode === 'dark' ? 'sunny' : 'moon'}
            size={isCompact ? 20 : 24}
            color={theme.primary}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: theme.card }]}
          onPress={onOpenLanguageSelector}
        >
          <Ionicons name="language" size={isCompact ? 20 : 24} color={theme.primary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: theme.card }]}
          onPress={() => router.push(isAuthenticated ? '/profile' : '/login')}
        >
          <Ionicons
            name={isAuthenticated ? 'person' : 'log-in-outline'}
            size={isCompact ? 20 : 24}
            color={theme.primary}
          />
        </TouchableOpacity>
      </View>

      <View style={[styles.titleContainer, isCompact && styles.titleContainerCompact]}>
        <Text style={[styles.title, isCompact && styles.titleCompact]}>
          <Text style={{ color: theme.primary }}>Math</Text>
          <Text style={{ color: theme.secondary }}>Master Pro</Text>
        </Text>
        <Text style={[styles.tagline, { color: theme.textSecondary }, isCompact && styles.taglineCompact]}>
          {t('tagline')}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  headerCompact: {
    paddingTop: 4,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 12,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  titleContainerCompact: {
    marginBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1,
  },
  titleCompact: {
    fontSize: 26,
  },
  tagline: {
    fontSize: 14,
    marginTop: 4,
  },
  taglineCompact: {
    fontSize: 12,
    marginTop: 2,
  },
});
