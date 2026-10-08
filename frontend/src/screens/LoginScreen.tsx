import React, { useState, useContext } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, Switch } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../../App';
import { theme } from '../theme';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { supabase } from '../lib/supabase';

export default function LoginScreen() {
  const { setSession } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const validateEmail = (email: string) => {
    const re = /\S+@\S+\.\S+/;
    return re.test(email);
  };

  const handleLogin = async () => {
    setErrorMsg('');
    setEmailError('');
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }
    if (!validateEmail(email) && email !== 'test' && email !== 'admin') {
      setEmailError('Incorrect email format.');
      return;
    }
    setLoading(true);

    // --- DEVELOPER BYPASS FOR TESTING ---
    if (email === 'test' || email === 'test@devplus.com') {
      // Explicitly clear old session to prevent caching conflicts
      await AsyncStorage.removeItem('session');

      // Proceed with creating mock session
      const mockSession = {
        user: {
          id: 'f5cdfe50-528c-4bb2-8289-8f7895e49f6c',
          email: 'student@devplus.co.th',
          name: 'Somchai Jaidee (Test Mode)',
          role: 'STUDENT',
          user_metadata: { name: 'Somchai Jaidee (Test Mode)' }
        },
        access_token: 'mock-token-' + Date.now()
      };
      await AsyncStorage.setItem('session', JSON.stringify(mockSession));
      setSession(mockSession);
      setLoading(false);
      return;
    }

    if (email === 'admin' || email === 'admin@devplus.io') {
      await AsyncStorage.removeItem('session');
      const mockSession = {
        user: {
          id: 'b31e7bbe-a75a-4aeb-a6ca-b4d1d0777026',
          email: 'admin@devplus.io',
          name: 'Alex Morgan (Admin Mode)',
          role: 'SUPER_ADMIN',
          user_metadata: { name: 'Alex Morgan (Admin Mode)' }
        },
        access_token: 'mock-token-admin-' + Date.now()
      };
      await AsyncStorage.setItem('session', JSON.stringify(mockSession));
      setSession(mockSession);
      setLoading(false);
      return;
    }
    // ------------------------------------
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        setErrorMsg(error.message);
      } else if (data.session) {
        // Fetch user details from users table to get role/name
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.session.user.id)
          .single();

        const sessionData = {
          access_token: data.session.access_token,
          user: {
            id: data.session.user.id,
            email: data.session.user.email || '',
            name: userData?.firstName ? `${userData.firstName} ${userData.lastName}` : 'DevPlus Student',
            role: userData?.role || 'student'
          }
        };
        await AsyncStorage.setItem('session', JSON.stringify(sessionData));
        setSession(sessionData);
      }
    } catch (error) {
      setErrorMsg('Network error. Please try again later.');
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.topHeader}>
        <Text style={styles.welcomeText}>Welcome Back</Text>
        <Text style={styles.subtitleText}>Sign in to continue your internship journey</Text>
      </View>

      <View style={styles.cardContainer}>
        <View style={styles.card}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoD}>D</Text>
            <Text style={styles.logoPlus}>+</Text>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address <Text style={styles.asterisk}>*</Text></Text>
            <View style={[styles.inputWrapper, emailError ? styles.inputError : null]}>
              <Mail color={theme.colors.textSecondary} size={20} style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="your@email.com"
                placeholderTextColor={theme.colors.textSecondary}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (emailError) setEmailError('');
                }}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password <Text style={styles.asterisk}>*</Text></Text>
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
            <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
              <Text style={styles.primaryButtonText}>Sign In</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.footerText}>© 2026 DevPlus. All rights reserved.</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  topHeader: {
    backgroundColor: theme.colors.primary,
    height: '35%',
    width: '100%',
    paddingTop: 80,
    paddingHorizontal: 30,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  welcomeText: {
    fontFamily: theme.typography.fontFamilyBold,
    fontSize: 28,
    color: theme.colors.surface,
    marginBottom: 8,
  },
  subtitleText: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 14,
    color: theme.colors.surface,
    opacity: 0.9,
  },
  cardContainer: {
    flex: 1,
    alignItems: 'center',
    marginTop: -80,
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: 30,
    ...theme.shadows.medium,
  },
  logoContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginBottom: 40,
  },
  logoD: {
    fontFamily: theme.typography.fontFamilyBold,
    fontSize: 48,
    color: theme.colors.primary,
    lineHeight: 56,
  },
  logoPlus: {
    fontFamily: theme.typography.fontFamilyBold,
    fontSize: 24,
    color: theme.colors.primary,
    marginTop: 2,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontFamily: theme.typography.fontFamilyBold,
    color: theme.colors.text,
    fontSize: 12,
    marginBottom: 8,
  },
  asterisk: {
    color: theme.colors.destructiveText,
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
    fontSize: 14,
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
    marginTop: 10,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: -10, // Adjust for switch padding
  },
  rememberText: {
    fontFamily: theme.typography.fontFamily,
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginLeft: 0,
  },
  forgotText: {
    fontFamily: theme.typography.fontFamilyBold,
    color: theme.colors.primary,
    fontSize: 12,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    height: 50,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.subtle,
  },
  primaryButtonText: {
    fontFamily: theme.typography.fontFamilyBold,
    color: theme.colors.surface,
    fontSize: 16,
  },
  loader: {
    marginVertical: 10,
  },
  footerText: {
    fontFamily: theme.typography.fontFamily,
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginTop: 30,
  }
});
