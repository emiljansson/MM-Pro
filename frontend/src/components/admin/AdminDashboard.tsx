import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

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

interface AdminDashboardProps {
  stats: Stats | null;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ stats }) => {
  const theme = useTheme();

  return (
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
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Användare</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: theme.card }]}>
          <View style={[styles.statIcon, { backgroundColor: theme.success + '20' }]}>
            <Ionicons name="game-controller" size={24} color={theme.success} />
          </View>
          <Text style={[styles.statValue, { color: theme.text }]}>
            {stats?.games.total || 0}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Spelsessioner</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: theme.card }]}>
          <View style={[styles.statIcon, { backgroundColor: theme.warning + '20' }]}>
            <Ionicons name="person-add" size={24} color={theme.warning} />
          </View>
          <Text style={[styles.statValue, { color: theme.text }]}>
            {stats?.users.new_this_week || 0}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Nya denna vecka</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: theme.card }]}>
          <View style={[styles.statIcon, { backgroundColor: '#9C27B0' + '20' }]}>
            <Ionicons name="text" size={24} color="#9C27B0" />
          </View>
          <Text style={[styles.statValue, { color: theme.text }]}>
            {stats?.translations.total || 0}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Översättningar</Text>
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
};

const styles = StyleSheet.create({
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
});
