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
  const { login, googleLogin } = useAuth();

  async function handleLogin() {
    if (!email.trim() || !password) {
      Alert.alert('Missing Information', 'Please enter both email and password.');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      Alert.alert('Login Failed', err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        
        <View style={styles.header}>
          <Text style={styles.logo}>StudyBloom</Text>
          <Text style={styles.tagline}>Focus. Achieve. Grow.</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="your@email.com"
            placeholderTextColor={C.subtext} 
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordWrapper}>
            <TextInput
              style={styles.input} // Reusing base input style
              value={password}
              onChangeText={setPassword}
              placeholder="Enter password"
              placeholderTextColor={C.subtext}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eye}>
              <Text style={styles.eyeText}>{showPassword ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
          </View>

          <PrimaryButton label="Log In" onPress={handleLogin} loading={loading} style={styles.btnSpacer} />
          
          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.or}>OR</Text>
            <View style={styles.line} />
          </View>

          <SecondaryButton label="Continue with Google" onPress={() => googleLogin()} />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.link}>Sign Up</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scrollContent: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 40 },
  logo: { fontSize: 36, fontWeight: '800', color: C.blue },
  tagline: { fontSize: 14, color: C.muted, marginTop: 4 },
  
  form: { backgroundColor: C.card, borderRadius: 20, padding: 20, borderWeight: 1, borderColor: C.border },
  label: { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 8, marginTop: 16, textTransform: 'uppercase', letterSpacing: 1 },
  input: { backgroundColor: C.bg, borderRadius: 12, padding: 16, fontSize: 16, color: C.text, borderWidth: 1, borderColor: C.border, width: '100%' },
  
  passwordWrapper: { justifyContent: 'center' },
  eye: { position: 'absolute', right: 16 },
  eyeText: { color: C.blue, fontWeight: '700', fontSize: 13 },
  
  btnSpacer: { marginTop: 24 },
  
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  line: { flex: 1, height: 1, backgroundColor: C.border },
  or: { marginHorizontal: 12, color: C.subtext, fontSize: 12, fontWeight: '600' },
  
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
  footerText: { color: C.muted, fontSize: 15 },
  link: { color: C.blue, fontSize: 15, fontWeight: '700' },
});