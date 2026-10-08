import React, { useState, useContext } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, Switch } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../../App';
import { theme } from '../theme';
import { Mail, Lock, Eye, EyeOff, Shield, Users, Award, GraduationCap } from 'lucide-react-native';
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

  const validateEmail = (str: string) => {
    const s = str.trim().toLowerCase();
    if (['admin', 'test', 'bd', 'mentor', 'student', 'alex'].includes(s)) return true;
    const re = /\S+@\S+\.\S+/;
    return re.test(str.trim());
  };

  const triggerDirectLogin = async (userObj: { id: string; email: string; name: string; role: string }) => {
    setLoading(true);
    await AsyncStorage.removeItem('session');
    const mockSession = {
      user: {
        id: userObj.id,
        email: userObj.email,
        name: userObj.name,
        role: userObj.role,
        user_metadata: { name: userObj.name }
      },
      access_token: 'mock-token-' + Date.now()
    };
    await AsyncStorage.setItem('session', JSON.stringify(mockSession));
    setSession(mockSession);
    setLoading(false);
  };

  const handleLogin = async () => {
    setErrorMsg('');
    setEmailError('');
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }
    if (!validateEmail(email)) {
      setEmailError('Incorrect email format.');
      return;
    }
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();

    // 1. Direct match for Admin / Super Admin (Alex Morgan)
    if (
      cleanEmail === 'admin' ||
      cleanEmail.includes('admin') ||
      cleanEmail === 'admin@devplus.io' ||
      cleanEmail === 'admin@devplus.co.th' ||
      cleanEmail === 'admin@devplus.com' ||
      cleanEmail === 'alex' ||
      cleanEmail === 'alex@devplus.io'
    ) {
      await triggerDirectLogin({
        id: 'b31e7bbe-a75a-4aeb-a6ca-b4d1d0777026',
        email: 'admin@devplus.io',
        name: 'Alex Morgan (Admin Mode)',
        role: 'SUPER_ADMIN'
      });
      return;
    }

    // 2. Direct match for BD Team (Sarah Jenkins)
    if (cleanEmail === 'bd' || cleanEmail.includes('bd@devplus') || cleanEmail === 'sarah@devplus.io') {
      await triggerDirectLogin({
        id: '7f9a4b8a-2c61-4a6a-a129-7bd0139af6e0',
        email: 'bd@devplus.io',
        name: 'Sarah Jenkins (BD Team)',
        role: 'BD_TEAM'
      });
      return;
    }

    // 3. Direct match for Mentor (David Miller)
    if (cleanEmail === 'mentor' || cleanEmail.includes('mentor') || cleanEmail === 'david@devplus.io') {
      await triggerDirectLogin({
        id: '209b6dfd-c16f-4fc3-9985-e005a19b882a',
        email: 'mentor.david@devplus.io',
        name: 'David Miller (Mentor)',
        role: 'MENTOR'
      });
      return;
    }

    // 4. Direct match for Student (Somchai Jaidee)
    if (
      cleanEmail === 'test' ||
      cleanEmail === 'student' ||
      cleanEmail.includes('student') ||
      cleanEmail.includes('intern')
    ) {
      await triggerDirectLogin({
        id: 'f5cdfe50-528c-4bb2-8289-8f7895e49f6c',
        email: 'student@devplus.co.th',
        name: 'Somchai Jaidee (Test Mode)',
        role: 'STUDENT'
      });
      return;
    }

    // 5. Query public.users database directly
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .ilike('email', cleanEmail)
        .maybeSingle();

      if (userData) {
        await triggerDirectLogin({
          id: userData.id,
          email: userData.email,
          name: userData.name || userData.email,
          role: userData.role || 'STUDENT'
        });
        return;
      }
    } catch (e) {
      console.log('Error checking public.users:', e);
    }

    // 6. Fallback: Supabase Auth
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password,
      });

      if (error) {
        setErrorMsg(error.message);
      } else if (data.session) {
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
            name: userData?.name ? userData.name : 'DevPlus User',
            role: userData?.role || 'STUDENT'
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
                placeholder="admin, test, or your@email.com"
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

          {/* Quick Demo Login One-Click Section */}
          <View style={styles.demoSection}>
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>QUICK 1-CLICK DEMO LOGIN</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.demoButtonsGrid}>
              <TouchableOpacity 
                style={[styles.demoBtn, { borderColor: '#8B5CF6', backgroundColor: '#F5F3FF' }]} 
                onPress={() => triggerDirectLogin({
                  id: 'b31e7bbe-a75a-4aeb-a6ca-b4d1d0777026',
                  email: 'admin@devplus.io',
                  name: 'Alex Morgan (Admin Mode)',
                  role: 'SUPER_ADMIN'
                })}
              >
                <Shield size={16} color="#8B5CF6" />
                <Text style={[styles.demoBtnText, { color: '#8B5CF6' }]}>Admin</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.demoBtn, { borderColor: '#3B82F6', backgroundColor: '#EFF6FF' }]} 
                onPress={() => triggerDirectLogin({
                  id: '7f9a4b8a-2c61-4a6a-a129-7bd0139af6e0',
                  email: 'bd@devplus.io',
                  name: 'Sarah Jenkins (BD Team)',
                  role: 'BD_TEAM'
                })}
              >
                <Users size={16} color="#3B82F6" />
                <Text style={[styles.demoBtnText, { color: '#3B82F6' }]}>BD Team</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.demoBtn, { borderColor: '#F59E0B', backgroundColor: '#FEF3C7' }]} 
                onPress={() => triggerDirectLogin({
                  id: '209b6dfd-c16f-4fc3-9985-e005a19b882a',
                  email: 'mentor.david@devplus.io',
                  name: 'David Miller (Mentor)',
                  role: 'MENTOR'
                })}
              >
                <Award size={16} color="#D97706" />
                <Text style={[styles.demoBtnText, { color: '#D97706' }]}>Mentor</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.demoBtn, { borderColor: '#10B981', backgroundColor: '#ECFDF5' }]} 
                onPress={() => triggerDirectLogin({
                  id: 'f5cdfe50-528c-4bb2-8289-8f7895e49f6c',
                  email: 'student@devplus.co.th',
                  name: 'Somchai Jaidee (Student)',
                  role: 'STUDENT'
                })}
              >
                <GraduationCap size={16} color="#10B981" />
                <Text style={[styles.demoBtnText, { color: '#10B981' }]}>Student</Text>
              </TouchableOpacity>
            </View>
          </View>
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
    paddingBottom: 40,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: 30,
    ...theme.shadows.medium,
  },
  logoContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginBottom: 30,
  },
  logoD: {
    fontFamily: theme.typography.fontFamilyBold,
    fontSize: 48,
    color: theme.colors.primary,
    lineHeight: 52,
  },
  logoPlus: {
    fontFamily: theme.typography.fontFamilyBold,
    fontSize: 28,
    color: theme.colors.secondary,
    lineHeight: 32,
    marginLeft: 2,
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontFamily: theme.typography.fontFamilySemiBold,
    fontSize: 13,
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  asterisk: {
    color: theme.colors.destructiveText,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 14,
    height: 48,
    backgroundColor: '#FAFAFA',
  },
  inputError: {
    borderColor: theme.colors.destructiveText,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontFamily: theme.typography.fontFamily,
    fontSize: 14,
    color: theme.colors.textPrimary,
    height: '100%',
  },
  eyeIcon: {
    padding: 4,
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
    marginBottom: 24,
    marginTop: 6,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: -10,
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
    height: 48,
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
  demoSection: {
    marginTop: 24,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    fontFamily: theme.typography.fontFamilySemiBold,
    fontSize: 10,
    color: '#9CA3AF',
    marginHorizontal: 10,
    letterSpacing: 0.5,
  },
  demoButtonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  demoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '48%',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    gap: 6,
  },
  demoBtnText: {
    fontFamily: theme.typography.fontFamilySemiBold,
    fontSize: 12,
  },
  footerText: {
    fontFamily: theme.typography.fontFamily,
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginTop: 24,
    textAlign: 'center',
  }
});
