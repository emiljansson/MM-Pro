import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useGameStore } from '../stores/gameStore';

interface NetworkBannerProps {
  style?: object;
}

export const NetworkBanner: React.FC<NetworkBannerProps> = ({ style }) => {
  const { isConnected, isInternetReachable, isLoading, refresh } = useNetworkStatus();
  const { t } = useGameStore();
  
  // Don't show anything while loading or if connected
  if (isLoading || (isConnected && isInternetReachable)) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.content}>
        <Ionicons name="cloud-offline" size={20} color="#FFF" />
        <Text style={styles.text}>
          {t('no_internet') || 'Ingen internetanslutning'}
        </Text>
      </View>
      <TouchableOpacity onPress={refresh} style={styles.retryButton}>
        <Ionicons name="refresh" size={18} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#E53935',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  text: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  retryButton: {
    padding: 6,
  },
});
