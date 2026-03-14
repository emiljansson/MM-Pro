import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Linking, Platform } from 'react-native';
import React, { useEffect } from 'react';
import { AuthProvider, useAuth } from '../src/contexts';
import { NetworkBanner } from '../src/components/NetworkBanner';

function DeepLinkHandler() {
  const router = useRouter();
  const { loginWithGoogle } = useAuth();

  useEffect(() => {
    // Handle initial URL (app opened via deep link)
    const handleInitialURL = async () => {
      const url = await Linking.getInitialURL();
      if (url) {
        handleDeepLink(url);
      }
    };

    // Handle deep link while app is running
    const handleDeepLink = async (url: string) => {
      console.log('Deep link received:', url);
      
      // Check if it's an auth callback (handle both formats)
      // exp://host/--/auth-callback or mathmaster://auth-callback
      if (url.includes('auth-callback')) {
        let sessionId = '';
        
        // Extract session_id from URL (could be in hash # or query ?)
        if (url.includes('session_id=')) {
          // Handle both #session_id= and ?session_id=
          const match = url.match(/session_id=([^&\s]+)/);
          sessionId = match ? match[1] : '';
        }
        
        console.log('Auth callback - Session ID:', sessionId);
        
        if (sessionId) {
          const result = await loginWithGoogle(sessionId);
          console.log('Auth callback - Result:', result);
          
          if (result.success) {
            router.replace('/');
          } else {
            console.log('Auth callback - Login failed:', result.error);
            router.replace('/login');
          }
        } else {
          console.log('Auth callback - No session_id found');
          router.replace('/login');
        }
      }
    };

    // Only set up listeners on native
    if (Platform.OS !== 'web') {
      handleInitialURL();
      
      const subscription = Linking.addEventListener('url', (event) => {
        handleDeepLink(event.url);
      });

      return () => {
        subscription.remove();
      };
    }
  }, []);

  return null;
}

function AppContent() {
  return (
    <View style={{ flex: 1 }}>
      <NetworkBanner />
      <DeepLinkHandler />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="game" options={{ gestureEnabled: false }} />
        <Stack.Screen name="results" options={{ gestureEnabled: false }} />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="auth-callback" options={{ gestureEnabled: false }} />
        <Stack.Screen name="profile" />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <AppContent />
      </SafeAreaProvider>
    </AuthProvider>
  );
}
