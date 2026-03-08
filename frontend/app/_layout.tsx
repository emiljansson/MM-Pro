import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import React from 'react';
import { AuthProvider } from '../src/contexts';

export default function RootLayout() {
  return (
    <AuthProvider>
      <SafeAreaProvider>
        <StatusBar style="auto" />
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
      </SafeAreaProvider>
    </AuthProvider>
  );
}
