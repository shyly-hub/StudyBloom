import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { C } from '../../themes';
import { PrimaryButton, SecondaryButton } from '../../components';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, googleLogin, error } = useAuth();

  async function handleLogin() {
    if (!email.trim() || !password) { Alert.alert('Missing Information', 'Please enter both email and password.'); return; }
    setLoading(true);
    try {
      await login(email.trim(), password);
        navigation.replace("Main");
    } catch (err) {
      Alert.alert('Login Failed', err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setLoading(true);
    try { await googleLogin(); }
    catch (err) { Alert.alert('Google Sign-In Failed', err.message); }
    finally { setLoading(false); }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.logo}>StudyBloom</Text>
          <Text style={styles.tagline}>Build your study habits</Text>
        </View>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="your@email.com" placeholderTextColor={C.subtext} keyboardType="email-address" autoCapitalize="none" />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordBox}>
            <TextInput style={styles.passwordInput} value={password} onChangeText={setPassword} placeholder="Enter password" placeholderTextColor={C.subtext} secureTextEntry={!showPassword} />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}><Text style={styles.toggle}>{showPassword ? 'Hide' : 'Show'}</Text></TouchableOpacity>
          </View>
        </View>

        {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

        <PrimaryButton label="Sign In" onPress={handleLogin} loading={loading} style={styles.btn} />

        <View style={styles.divider}><View style={styles.line} /><Text style={styles.or}>or</Text><View style={styles.line} /></View>

        <SecondaryButton label="Continue with Google" onPress={handleGoogleLogin} style={styles.btn} />

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}><Text style={styles.link}>Sign Up</Text></TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scrollContent: { padding: 24, paddingTop: 60 },
  header: { alignItems: 'center', marginBottom: 40 },
  logo: { fontSize: 32, fontWeight: '800', color: C.blue },
  tagline: { fontSize: 14, color: C.muted, marginTop: 8 },
  title: { fontSize: 28, fontWeight: '700', color: C.text },
  subtitle: { fontSize: 16, color: C.muted, marginBottom: 32 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: C.text, marginBottom: 8 },
  input: { backgroundColor: C.card, borderRadius: 12, padding: 16, fontSize: 16, color: C.text, borderWidth: 1, borderColor: C.border },
  passwordBox: { flexDirection: 'row', backgroundColor: C.card, borderRadius: 12, borderWidth: 1, borderColor: C.border },
  passwordInput: { flex: 1, padding: 16, fontSize: 16, color: C.text },
  toggle: { padding: 16, color: C.blue, fontWeight: '600' },
  errorBox: { backgroundColor: C.redSoft, padding: 12, borderRadius: 8, marginBottom: 16 },
  errorText: { color: C.red, textAlign: 'center' },
  btn: { marginBottom: 24 },
  divider: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  line: { flex: 1, height: 1, backgroundColor: C.border },
  or: { paddingHorizontal: 16, color: C.muted },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
  footerText: { fontSize: 16, color: C.muted },
  link: { fontSize: 16, color: C.blue, fontWeight: '700' },
});