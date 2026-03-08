import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { SUPPORTED_LANGUAGES } from '../i18n/translations';
import * as Haptics from 'expo-haptics';

interface LanguageSelectorProps {
  visible: boolean;
  currentLanguage: string;
  onSelect: (code: string) => void;
  onClose: () => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  visible,
  currentLanguage,
  onSelect,
  onClose,
}) => {
  const theme = useTheme();

  const handleSelect = (code: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onSelect(code);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: theme.surface }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>Välj språk</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color={theme.text} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={SUPPORTED_LANGUAGES}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.languageItem,
                  {
                    backgroundColor: currentLanguage === item.code ? theme.primaryLight : theme.card,
                    borderColor: currentLanguage === item.code ? theme.primary : theme.border,
                  },
                ]}
                onPress={() => handleSelect(item.code)}
                activeOpacity={0.7}
              >
                <View style={styles.languageInfo}>
                  <Text style={[
                    styles.languageNative,
                    { color: currentLanguage === item.code ? '#FFFFFF' : theme.text },
                  ]}>
                    {item.native}
                  </Text>
                  <Text style={[
                    styles.languageName,
                    { color: currentLanguage === item.code ? 'rgba(255,255,255,0.8)' : theme.textSecondary },
                  ]}>
                    {item.name}
                  </Text>
                </View>
                {currentLanguage === item.code && (
                  <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    paddingBottom: 32,
    maxHeight: '70%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  languageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 6,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  languageInfo: {
    flex: 1,
  },
  languageNative: {
    fontSize: 18,
    fontWeight: '600',
  },
  languageName: {
    fontSize: 14,
    marginTop: 2,
  },
});
