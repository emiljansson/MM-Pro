import React, { useState } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useTranslation } from '../src/hooks/useTheme';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

type Step = 'email' | 'code' | 'newPassword' | 'success';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleRequestReset = async () => {
    if (!email.trim()) {
      setError(t('enter_email') || 'Please enter your email');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/auth/password-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (response.ok) {
        setStep('code');
      } else {
        const data = await response.json();
        setError(data.detail || 'Failed to send reset email');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }

    setIsLoading(false);
  };

  const handleVerifyCode = async () => {
    if (!resetCode.trim()) {
      setError(t('enter_code') || 'Please enter the reset code');
      return;
    }
    // Move to new password step - code will be verified when setting password
    setStep('newPassword');
    setError('');
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      setError(t('fill_all_fields') || 'Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('passwords_not_match') || 'Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError(t('password_too_short') || 'Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/auth/password-reset/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: resetCode.trim(),
          new_password: newPassword,
        }),
      });

      if (response.ok) {
        setStep('success');
      } else {
        const data = await response.json();
        setError(data.detail || 'Failed to reset password');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }

    setIsLoading(false);
  };

  const renderEmailStep = () => (
    <>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.primary }]}>
          {t('forgot_password_title') || 'Reset Password'}
        </Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          {t('forgot_password_desc') || 'Enter your email to receive a reset code'}
        </Text>
      </View>

      {error ? (
        <View style={[styles.errorContainer, { backgroundColor: theme.errorLight }]}>
          <Ionicons name="alert-circle" size={20} color={theme.error} />
          <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.form}>
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

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.primary }]}
          onPress={handleRequestReset}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>{t('send_code') || 'Send Reset Code'}</Text>
          )}
        </TouchableOpacity>
      </View>
    </>
  );

  const renderCodeStep = () => (
    <>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.primary }]}>
          {t('enter_code_title') || 'Enter Code'}
        </Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          {t('enter_code_desc') || 'We sent a code to your email. Enter it below.'}
        </Text>
      </View>

      {error ? (
        <View style={[styles.errorContainer, { backgroundColor: theme.errorLight }]}>
          <Ionicons name="alert-circle" size={20} color={theme.error} />
          <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>
            {t('reset_code') || 'Reset Code'}
          </Text>
          <View style={[styles.inputWrapper, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Ionicons name="key-outline" size={20} color={theme.textMuted} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder={t('enter_code') || 'Enter reset code'}
              placeholderTextColor={theme.textMuted}
              value={resetCode}
              onChangeText={setResetCode}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.primary }]}
          onPress={handleVerifyCode}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>{t('verify') || 'Verify'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => setStep('email')}
        >
          <Text style={[styles.linkText, { color: theme.primary }]}>
            {t('resend_code') || 'Resend code'}
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const renderNewPasswordStep = () => (
    <>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.primary }]}>
          {t('new_password_title') || 'New Password'}
        </Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          {t('new_password_desc') || 'Enter your new password'}
        </Text>
      </View>

      {error ? (
        <View style={[styles.errorContainer, { backgroundColor: theme.errorLight }]}>
          <Ionicons name="alert-circle" size={20} color={theme.error} />
          <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>
            {t('new_password') || 'New Password'}
          </Text>
          <View style={[styles.inputWrapper, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Ionicons name="lock-closed-outline" size={20} color={theme.textMuted} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder={t('enter_new_password') || 'Enter new password'}
              placeholderTextColor={theme.textMuted}
              value={newPassword}
              onChangeText={setNewPassword}
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

        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>
            {t('confirm_password')}
          </Text>
          <View style={[styles.inputWrapper, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Ionicons name="lock-closed-outline" size={20} color={theme.textMuted} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder={t('confirm_password_placeholder') || 'Confirm password'}
              placeholderTextColor={theme.textMuted}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.primary }]}
          onPress={handleResetPassword}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>{t('reset_password') || 'Reset Password'}</Text>
          )}
        </TouchableOpacity>
      </View>
    </>
  );

  const renderSuccessStep = () => (
    <View style={styles.successContainer}>
      <View style={[styles.successIcon, { backgroundColor: theme.successLight }]}>
        <Ionicons name="checkmark-circle" size={64} color={theme.success} />
      </View>
      <Text style={[styles.title, { color: theme.primary, textAlign: 'center' }]}>
        {t('password_reset_success_title') || 'Password Reset!'}
      </Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary, textAlign: 'center' }]}>
        {t('password_reset_success_desc') || 'Your password has been reset. You can now log in.'}
      </Text>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: theme.primary, marginTop: 32 }]}
        onPress={() => router.replace('/login')}
      >
        <Text style={styles.buttonText}>{t('go_to_login') || 'Go to Login'}</Text>
      </TouchableOpacity>
    </View>
  );

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
          {step !== 'success' && (
            <TouchableOpacity
              style={[styles.backButton, { backgroundColor: theme.card }]}
              onPress={() => {
                if (step === 'email') {
                  router.back();
                } else if (step === 'code') {
                  setStep('email');
                } else if (step === 'newPassword') {
                  setStep('code');
                }
              }}
            >
              <Ionicons name="arrow-back" size={24} color={theme.text} />
            </TouchableOpacity>
          )}

          {/* Progress Indicator */}
          {step !== 'success' && (
            <View style={styles.progress}>
              <View style={[styles.progressDot, { backgroundColor: theme.primary }]} />
              <View style={[styles.progressLine, { backgroundColor: step !== 'email' ? theme.primary : theme.border }]} />
              <View style={[styles.progressDot, { backgroundColor: step !== 'email' ? theme.primary : theme.border }]} />
              <View style={[styles.progressLine, { backgroundColor: step === 'newPassword' ? theme.primary : theme.border }]} />
              <View style={[styles.progressDot, { backgroundColor: step === 'newPassword' ? theme.primary : theme.border }]} />
            </View>
          )}

          {step === 'email' && renderEmailStep()}
          {step === 'code' && renderCodeStep()}
          {step === 'newPassword' && renderNewPasswordStep()}
          {step === 'success' && renderSuccessStep()}
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
    marginBottom: 16,
  },
  progress: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  progressLine: {
    width: 40,
    height: 3,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
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
  button: {
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  linkButton: {
    alignItems: 'center',
    marginTop: 16,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  successIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
});
