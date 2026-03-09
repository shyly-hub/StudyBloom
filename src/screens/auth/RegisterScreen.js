import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, Alert,
} from 'react-native';
import { useAuth }     from '../../hooks/useAuth';
import { C, EDU_LEVELS } from '../../themes';
import { PrimaryButton } from '../../components';

export default function RegisterScreen({ navigation }) {
  const [name,            setName]            = useState('');
  const [email,           setEmail]           = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [education,       setEducation]       = useState('');
  const [showPassword,    setShowPassword]    = useState(false);
  const [showPicker,      setShowPicker]      = useState(false);
  const [loading,         setLoading]         = useState(false);
  const { register, error } = useAuth();

  async function handleRegister() {
    if (!name.trim())            { Alert.alert('Missing', 'Enter your name');         return; }
    if (!email.trim())           { Alert.alert('Missing', 'Enter your email');        return; }
    if (password.length < 6)     { Alert.alert('Weak',    'Password needs 6+ chars'); return; }
    if (password !== confirmPassword) { Alert.alert('Error', 'Passwords mismatch');   return; }
    if (!education)              { Alert.alert('Missing', 'Select education level');  return; }

    setLoading(true);
    try {
      await register(email.trim(), password, name.trim(), education);
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

        {/* Logo */}
        <View style={styles.header}>
          <Text style={styles.logo}>StudyBloom</Text>
          <Text style={styles.tagline}>Start your journey</Text>
        </View>

        <Text style={styles.title}>Create Account</Text>

        {/* Name */}
        <View style={styles.field}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor={C.subtext} />
        </View>

        {/* Email */}
        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="your@email.com" placeholderTextColor={C.subtext} keyboardType="email-address" autoCapitalize="none" />
        </View>

        {/* Education */}
        <View style={styles.field}>
          <Text style={styles.label}>Education Level</Text>
          <TouchableOpacity style={styles.picker} onPress={() => setShowPicker(!showPicker)}>
            <Text style={[styles.pickerText, !education && styles.placeholder]}>
              {education || 'Select level'}
            </Text>
            <Text style={styles.arrow}>▼</Text>
          </TouchableOpacity>
          {showPicker && (
            <View style={styles.options}>
              {EDU_LEVELS.map(l => (
                <TouchableOpacity
                  key={l}
                  style={[styles.option, education === l && styles.optionActive]}
                  onPress={() => { setEducation(l); setShowPicker(false); }}
                >
                  <Text style={[styles.optionText, education === l && styles.optionTextActive]}>{l}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Password */}
        <View style={styles.field}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordBox}>
            <TextInput style={styles.passwordInput} value={password} onChangeText={setPassword} placeholder="6+ characters" placeholderTextColor={C.subtext} secureTextEntry={!showPassword} />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Text style={styles.toggle}>{showPassword ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Confirm Password */}
        <View style={styles.field}>
          <Text style={styles.label}>Confirm Password</Text>
          <TextInput style={styles.input} value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Re-enter password" placeholderTextColor={C.subtext} secureTextEntry={!showPassword} />
        </View>

        {/* Error */}
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <PrimaryButton label="Create Account" onPress={handleRegister} loading={loading} style={styles.btn} />

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
  container:       { flex: 1, backgroundColor: C.bg },
  scroll:          { padding: 24, paddingTop: 40 },
  header:          { alignItems: 'center', marginBottom: 32 },
  logo:            { fontSize: 32, fontWeight: '800', color: C.blue },
  tagline:         { fontSize: 14, color: C.muted, marginTop: 8 },
  title:           { fontSize: 28, fontWeight: '700', color: C.text, marginBottom: 24 },
  field:           { marginBottom: 16 },
  label:           { fontSize: 14, fontWeight: '600', color: C.text, marginBottom: 8 },
  input:           { backgroundColor: C.card, borderRadius: 12, padding: 16, fontSize: 16, color: C.text, borderWidth: 1, borderColor: C.border },
  picker:          { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: C.card, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: C.border },
  pickerText:      { fontSize: 16, color: C.text },
  placeholder:     { color: C.subtext },
  arrow:           { color: C.muted },
  options:         { backgroundColor: C.card, borderRadius: 12, marginTop: 8, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  option:          { padding: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  optionActive:    { backgroundColor: C.blueSoft },
  optionText:      { fontSize: 16, color: C.text },
  optionTextActive:{ color: C.blue, fontWeight: '600' },
  passwordBox:     { flexDirection: 'row', backgroundColor: C.card, borderRadius: 12, borderWidth: 1, borderColor: C.border },
  passwordInput:   { flex: 1, padding: 16, fontSize: 16, color: C.text },
  toggle:          { padding: 16, color: C.blue, fontWeight: '600' },
  errorBox:        { backgroundColor: C.redSoft, padding: 12, borderRadius: 8, marginBottom: 16 },
  errorText:       { color: C.red, textAlign: 'center' },
  btn:             { marginTop: 8, marginBottom: 24 },
  footer:          { flexDirection: 'row', justifyContent: 'center' },
  footerText:      { fontSize: 16, color: C.muted },
  link:            { fontSize: 16, color: C.blue, fontWeight: '700' },
});