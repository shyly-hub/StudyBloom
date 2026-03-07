import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  KeyboardAvoidingView, Platform, ScrollView, Alert 
} from 'react-native';

import { useAuth } from '../../hooks/useAuth';
import { C, EDU_LEVELS } from '../../themes'; 
import { PrimaryButton, PillButton } from '../../components'; // ✅ Fixed Import

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [education, setEducation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { register, error } = useAuth();

  async function handleRegister() {
    if (!name.trim()) { Alert.alert('Missing', 'Enter your name'); return; }
    if (!email.trim()) { Alert.alert('Missing', 'Enter your email'); return; }
    if (password.length < 6) { Alert.alert('Weak', 'Password needs 6+ chars'); return; }
    if (password !== confirmPassword) { Alert.alert('Error', 'Passwords mismatch'); return; }
    if (!education) { Alert.alert('Missing', 'Select education level'); return; }
    
    setLoading(true);
    try { 
      await register(email.trim(), password, name.trim(), education); 
      // Auth check in App.js will handle the navigation once user state updates
    } catch (err) { 
      Alert.alert('Failed', err.message); 
    } finally { 
      setLoading(false); 
    }
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.logo}>StudyBloom</Text>
          <Text style={styles.tagline}>Start your journey</Text>
        </View>

        <Text style={styles.title}>Create Account</Text>
        
        {/* Name Field */}
        <View style={styles.field}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput 
            style={styles.input} 
            value={name} 
            onChangeText={setName} 
            placeholder="Your name" 
            placeholderTextColor={C.subtext} 
          />
        </View>

        {/* Email Field */}
        <View style={styles.field}>
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
        </View>
        
        {/* Education Level - Now using your PillButtons! */}
        <View style={styles.field}>
          <Text style={styles.label}>Education Level</Text>
          <View style={styles.pillRow}>
            {EDU_LEVELS.map(level => (
              <PillButton 
                key={level}
                label={level}
                active={education === level}
                onPress={() => setEducation(level)}
                style={styles.pillMargin}
              />
            ))}
          </View>
        </View>

        {/* Password Fields */}
        <View style={styles.field}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordBox}>
            <TextInput 
              style={styles.passwordInput} 
              value={password} 
              onChangeText={setPassword} 
              placeholder="6+ characters" 
              placeholderTextColor={C.subtext} 
              secureTextEntry={!showPassword} 
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Text style={styles.toggle}>{showPassword ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Confirm Password</Text>
          <TextInput 
            style={styles.input} 
            value={confirmPassword} 
            onChangeText={setConfirmPassword} 
            placeholder="Re-enter password" 
            placeholderTextColor={C.subtext} 
            secureTextEntry={!showPassword} 
          />
        </View>

        {error && <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>}

        {/* Primary Button - Correctly imported from components */}
        <PrimaryButton 
          label="Create Account" 
          onPress={handleRegister} 
          loading={loading} 
          style={styles.btn} 
        />
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.link}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll: { padding: 24, paddingTop: 60 },
  header: { alignItems: 'center', marginBottom: 32 },
  logo: { fontSize: 32, fontWeight: '800', color: C.blue },
  tagline: { fontSize: 14, color: C.muted, marginTop: 4 },
  title: { fontSize: 26, fontWeight: '700', color: C.text, marginBottom: 24 },
  field: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 },
  input: { backgroundColor: C.card, borderRadius: 14, padding: 16, fontSize: 16, color: C.text, borderWidth: 1, borderColor: C.border },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pillMargin: { marginBottom: 4 },
  passwordBox: { flexDirection: 'row', backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
  passwordInput: { flex: 1, padding: 16, fontSize: 16, color: C.text },
  toggle: { paddingRight: 16, color: C.blue, fontWeight: '700' },
  errorBox: { backgroundColor: '#fee2e2', padding: 12, borderRadius: 10, marginBottom: 16 },
  errorText: { color: '#ef4444', textAlign: 'center', fontSize: 13, fontWeight: '600' },
  btn: { marginTop: 10, marginBottom: 30 },
  footer: { flexDirection: 'row', justifyContent: 'center', paddingBottom: 40 },
  footerText: { fontSize: 15, color: C.muted },
  link: { fontSize: 15, color: C.blue, fontWeight: '700' },
});