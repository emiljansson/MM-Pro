import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../src/hooks/useTheme';
import { useAuth } from '../src/contexts';

export default function AuthCallbackScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { loginWithGoogle } = useAuth();

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      // Get session_id from URL hash
      let sessionId = '';
      
      if (typeof window !== 'undefined') {
        const hash = window.location.hash;
        console.log('Auth callback - Full URL:', window.location.href);
        console.log('Auth callback - Hash:', hash);
        
        if (hash && hash.includes('session_id=')) {
          sessionId = hash.split('session_id=')[1]?.split('&')[0] || '';
          console.log('Auth callback - Extracted session_id:', sessionId);
        }
        
        // Also check URL params (some redirects use query params)
        const urlParams = new URLSearchParams(window.location.search);
        if (!sessionId && urlParams.has('session_id')) {
          sessionId = urlParams.get('session_id') || '';
          console.log('Auth callback - Session ID from query params:', sessionId);
        }
      }

      if (sessionId) {
        console.log('Auth callback - Calling loginWithGoogle...');
        const result = await loginWithGoogle(sessionId);
        console.log('Auth callback - Result:', result);
        
        if (result.success) {
          // Clear the hash and navigate to home
          if (typeof window !== 'undefined') {
            window.history.replaceState(null, '', window.location.pathname);
          }
          router.replace('/');
        } else {
          console.error('Auth callback - Login failed:', result.error);
          router.replace('/login');
        }
      } else {
        console.log('Auth callback - No session_id found, redirecting to login');
        router.replace('/login');
      }
    } catch (error) {
      console.error('Auth callback error:', error);
      router.replace('/login');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ActivityIndicator size="large" color={theme.primary} />
      <Text style={[styles.text, { color: theme.textSecondary }]}>
        Loggar in...
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  text: {
    fontSize: 16,
  },
});
