import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import * as Linking from 'expo-linking';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useTranslation } from '../src/hooks/useTheme';
import { useAuth } from '../src/contexts';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';

export default function LoginScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const { login, loginWithGoogle, loginWithApple, isLoading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isAppleAvailable, setIsAppleAvailable] = useState(false);

  useEffect(() => {
    // Check if Apple Sign In is available (only on iOS)
    const checkAppleAuth = async () => {
      if (Platform.OS === 'ios') {
        try {
          const available = await AppleAuthentication.isAvailableAsync();
          setIsAppleAvailable(available);
        } catch (e) {
          console.log('Apple Auth check failed:', e);
          setIsAppleAvailable(false);
        }
      }
    };
    checkAppleAuth();
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError(t('enter_email_password') || 'Please enter email and password');
      return;
    }

    setIsLoading(true);
    setError('');

    const result = await login(email.trim(), password);

    if (result.success) {
      router.replace('/');
    } else {
      setError(result.error || 'Login failed');
    }

    setIsLoading(false);
  };

  const handleGoogleLogin = async () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    if (Platform.OS === 'web') {
      const redirectUrl = window.location.origin + '/auth-callback';
      window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
    } else {
      try {
        // For native apps (Expo Go), create a proper redirect URL using Linking
        // This creates an exp:// URL that Expo Go can handle
        const callbackUrl = Linking.createURL('auth-callback');
        
        console.log('Google login - Starting auth flow');
        console.log('Google login - Callback URL:', callbackUrl);
        
        const authUrl = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(callbackUrl)}`;
        console.log('Google login - Auth URL:', authUrl);
        
        // Use openAuthSessionAsync which properly handles the OAuth flow
        // and returns control to the app when complete
        const result = await WebBrowser.openAuthSessionAsync(authUrl, callbackUrl);
        
        console.log('Google login - Browser result:', JSON.stringify(result));
        
        if (result.type === 'success' && result.url) {
          // Extract session_id from the returned URL
          console.log('Google login - Success URL:', result.url);
          
          let sessionId = '';
          
          // Check for session_id in hash or query params
          if (result.url.includes('session_id=')) {
            const match = result.url.match(/session_id=([^&\s#]+)/);
            sessionId = match ? match[1] : '';
          }
          
          console.log('Google login - Extracted session_id:', sessionId);
          
          if (sessionId) {
            setIsLoading(true);
            const loginResult = await loginWithGoogle(sessionId);
            setIsLoading(false);
            
            console.log('Google login - Login result:', loginResult);
            
            if (loginResult.success) {
              router.replace('/');
            } else {
              setError(loginResult.error || 'Google-inloggning misslyckades');
            }
          } else {
            setError('Ingen session-ID mottagen från Google');
          }
        } else if (result.type === 'cancel') {
          console.log('Google login - User cancelled');
          // User cancelled, no action needed
        } else {
          console.log('Google login - Unexpected result type:', result.type);
        }
        
      } catch (error) {
        console.error('Google login error:', error);
        Alert.alert('Fel', 'Kunde inte öppna inloggning');
      }
    }
  };

  const handleAppleLogin = async () => {
    try {
      console.log('Apple login - Starting auth flow');
      
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      console.log('Apple login - Got credential:', JSON.stringify(credential, null, 2));

      if (credential.identityToken) {
        setIsLoading(true);
        
        // Extract user data (only available on first login)
        const userData = {
          given_name: credential.fullName?.givenName || '',
          family_name: credential.fullName?.familyName || '',
        };

        const result = await loginWithApple(credential.identityToken, userData);
        setIsLoading(false);

        console.log('Apple login - Login result:', result);

        if (result.success) {
          router.replace('/');
        } else {
          setError(result.error || 'Apple-inloggning misslyckades');
        }
      } else {
        setError('Ingen identitetstoken mottagen från Apple');
      }
    } catch (error: any) {
      console.error('Apple login error:', error);
      
      if (error.code === 'ERR_REQUEST_CANCELED') {
        // User cancelled, no action needed
        console.log('Apple login - User cancelled');
      } else {
        setError('Apple-inloggning misslyckades');
      }
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back Button */}
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: theme.card }]}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.primary }]}>
              {t('login')}
            </Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              {t('login_subtitle') || 'Welcome back!'}
            </Text>
          </View>

          {/* Error Message */}
          {error ? (
            <View style={[styles.errorContainer, { backgroundColor: theme.errorLight }]}>
              <Ionicons name="alert-circle" size={20} color={theme.error} />
              <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
            </View>
          ) : null}

          {/* Form */}
          <View style={styles.form}>
            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>
                {t('email')}
              </Text>
              <View style={[styles.inputWrapper, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Ionicons name="mail-outline" size={20} color={theme.textMuted} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder={t('email_placeholder') || 'Enter your email'}
                  placeholderTextColor={theme.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>
                {t('password')}
              </Text>
              <View style={[styles.inputWrapper, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Ionicons name="lock-closed-outline" size={20} color={theme.textMuted} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder={t('password_placeholder') || 'Enter your password'}
                  placeholderTextColor={theme.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={theme.textMuted}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot Password */}
            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={() => router.push('/forgot-password')}
            >
              <Text style={[styles.forgotPasswordText, { color: theme.primary }]}>
                {t('forgot_password')}
              </Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginButton, { backgroundColor: theme.primary }]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.loginButtonText}>{t('login')}</Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
              <Text style={[styles.dividerText, { color: theme.textMuted }]}>
                {t('or')}
              </Text>
              <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
            </View>

            {/* Google Login */}
            <TouchableOpacity
              style={[styles.googleButton, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={handleGoogleLogin}
            >
              <Ionicons name="logo-google" size={20} color="#DB4437" />
              <Text style={[styles.googleButtonText, { color: theme.text }]}>
                {t('continue_with_google')}
              </Text>
            </TouchableOpacity>

            {/* Apple Login - Only shown on iOS when available */}
            {isAppleAvailable && (
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                cornerRadius={12}
                style={styles.appleButton}
                onPress={handleAppleLogin}
              />
            )}
          </View>

          {/* Register Link */}
          <View style={styles.registerContainer}>
            <Text style={[styles.registerText, { color: theme.textSecondary }]}>
              {t('no_account') || "Don't have an account?"}
            </Text>
            <TouchableOpacity onPress={() => router.push('/register')}>
              <Text style={[styles.registerLink, { color: theme.primary }]}>
                {t('register')}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
  },
  form: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '600',
  },
  loginButton: {
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 14,
  },
  googleButton: {
    flexDirection: 'row',
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  appleButton: {
    width: '100%',
    height: 52,
    marginTop: 12,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  registerText: {
    fontSize: 14,
  },
  registerLink: {
    fontSize: 14,
    fontWeight: '700',
  },
});
