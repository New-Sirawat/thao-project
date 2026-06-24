import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, Switch } from 'react-native';
import { supabase } from '../lib/supabase';
import { theme } from '../theme';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async () => {
    setErrorMsg('');
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg('Username or password incorrect');
    }
    setLoading(false);
  };

  const handleSignUp = async () => {
    setErrorMsg('');
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setErrorMsg('Sign up failed: ' + error.message);
    } else {
      setErrorMsg('Success! Account created.');
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.headerContainer}>
        <Text style={styles.welcomeText}>Welcome Back</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.logoText}>Devplus</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email Address *</Text>
          <View style={[styles.inputWrapper, errorMsg ? styles.inputError : null]}>
            <Mail color={theme.colors.textSecondary} size={20} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="student@devplus.com"
              placeholderTextColor={theme.colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password *</Text>
          <View style={[styles.inputWrapper, errorMsg ? styles.inputError : null]}>
            <Lock color={theme.colors.textSecondary} size={20} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={theme.colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
              {showPassword ? (
                <EyeOff color={theme.colors.textSecondary} size={20} />
              ) : (
                <Eye color={theme.colors.textSecondary} size={20} />
              )}
            </TouchableOpacity>
          </View>
          {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
        </View>

        <View style={styles.optionsRow}>
          <View style={styles.rememberRow}>
            <Switch
              value={rememberMe}
              onValueChange={setRememberMe}
              trackColor={{ false: '#D1D5DB', true: theme.colors.primary }}
              thumbColor="#FFFFFF"
              style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
            />
            <Text style={styles.rememberText}>Remember me</Text>
          </View>
          <TouchableOpacity>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
        ) : (
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
              <Text style={styles.primaryButtonText}>Sign In</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={handleSignUp}>
              <Text style={styles.secondaryButtonText}>Create Account</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  headerContainer: {
    width: '100%',
    maxWidth: 400,
    marginBottom: 20,
  },
  welcomeText: {
    fontFamily: theme.typography.fontFamilyBold,
    fontSize: 32,
    color: theme.colors.text,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: 30,
    ...theme.shadows.medium,
  },
  logoText: {
    fontFamily: theme.typography.fontFamilyBold,
    fontSize: 28,
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: 30,
    letterSpacing: -0.5,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontFamily: theme.typography.fontFamilySemiBold,
    color: theme.colors.text,
    fontSize: 14,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 12,
    height: 50,
  },
  inputError: {
    borderColor: theme.colors.destructiveText,
  },
  icon: {
    marginRight: 10,
  },
  eyeIcon: {
    padding: 5,
  },
  input: {
    flex: 1,
    fontFamily: theme.typography.fontFamily,
    color: theme.colors.text,
    fontSize: 16,
    height: '100%',
  },
  errorText: {
    fontFamily: theme.typography.fontFamily,
    color: theme.colors.destructiveText,
    fontSize: 12,
    marginTop: 6,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rememberText: {
    fontFamily: theme.typography.fontFamily,
    color: theme.colors.textSecondary,
    fontSize: 14,
    marginLeft: 4,
  },
  forgotText: {
    fontFamily: theme.typography.fontFamilySemiBold,
    color: theme.colors.primary,
    fontSize: 14,
  },
  buttonContainer: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    height: 50,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.subtle,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    height: 50,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  secondaryButtonText: {
    fontFamily: theme.typography.fontFamilySemiBold,
    color: theme.colors.textSecondary,
    fontSize: 16,
  },
  primaryButtonText: {
    fontFamily: theme.typography.fontFamilyBold,
    color: theme.colors.surface,
    fontSize: 16,
  },
  loader: {
    marginVertical: 10,
  },
});
