
import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Switch, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C, GOALS, STUDY_TIMES } from '../../themes';
import { Avatar, Card } from '../../components';
import { useAuth } from '../../hooks/useAuth';
import { SAMPLE_USER } from '../../data/sampleData';

function Divider() {
  return <View style={{ height: 1, backgroundColor: C.border }} />;
}

function ToggleRow({ label, description, value, onChange, color }) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1, marginRight: 16 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        {description && <Text style={styles.rowDesc}>{description}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: C.border, true: (color || C.blue) + '66' }}
        thumbColor={value ? (color || C.blue) : '#fff'}
        ios_backgroundColor={C.border}
      />
    </View>
  );
}

function SettingRow({ label, value, onPress, danger = false }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.row} activeOpacity={0.7}>
      <Text style={[styles.rowLabel, danger && { color: C.red }]}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {value && <Text style={styles.rowValue}>{value}</Text>}
        <Text style={{ fontSize: 20, color: C.subtext }}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function SettingsScreen({ navigation }) {
  let userData = SAMPLE_USER;
  let logout   = null;
  try {
    const ctx = useAuth();
    if (ctx?.userData) userData = ctx.userData;
    if (ctx?.logout)   logout   = ctx.logout;
  } catch (e) {}

  const name  = userData?.name  || 'Student';
  const email = userData?.email || '';
  const score = userData?.score || userData?.disciplineScore || 72;

  const [darkMode,      setDarkMode]      = useState(false);
  const [sound,         setSound]         = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [goal,          setGoal]          = useState(userData?.goal      || GOALS[0]);
  const [studyTime,     setStudyTime]     = useState(userData?.studyTime || 'Night');
  const [dailyHours,    setDailyHours]    = useState(userData?.dailyHours || 2);

  const handleReset = () => {
    Alert.alert('Reset All Data', 'This deletes all sessions and resets your score. Cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset',  style: 'destructive', onPress: () => Alert.alert('Done', 'All data cleared.') },
    ]);
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out', style: 'destructive',
        onPress: () => logout
          ? logout().catch(() => Alert.alert('Error', 'Failed to log out'))
          : navigation?.navigate?.('Login'),
      },
    ]);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerSub}>Your preferences</Text>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      {/* Profile card */}
      <LinearGradient
        colors={[C.blueDark, C.blue]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.profileCard}
      >
        <Avatar name={name} size={64} />
        <View style={{ flex: 1 }}>
          <Text style={styles.profileName}>{name}</Text>
          <Text style={styles.profileEmail}>{email}</Text>
          <View style={styles.profileGoalBadge}>
            <Text style={styles.profileGoalText}>{goal}</Text>
          </View>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.profileScore}>{score}</Text>
          <Text style={styles.profileScoreLabel}>Score</Text>
        </View>
      </LinearGradient>

      {/* Appearance */}
      <Text style={styles.sectionLabel}>APPEARANCE</Text>
      <Card style={styles.sectionCard}>
        <ToggleRow label="Dark Mode"     description="Switch to dark theme"         value={darkMode} onChange={setDarkMode} color={C.purple} />
        <Divider />
        <ToggleRow label="Sound Effects" description="Play sounds on session events" value={sound}    onChange={setSound}    color={C.blue}   />
      </Card>

      {/* Notifications */}
      <Text style={styles.sectionLabel}>NOTIFICATIONS</Text>
      <Card style={styles.sectionCard}>
        <ToggleRow label="Study Reminders" description="Get reminded to study daily" value={notifications} onChange={setNotifications} color={C.green} />
        <Divider />
        <SettingRow label="Reminder Time" value="8:00 PM" onPress={() => Alert.alert('Set Time', 'Time picker coming soon!')} />
      </Card>

      {/* Goals */}
      <Text style={styles.sectionLabel}>GOALS</Text>
      <Card style={styles.sectionCard}>
        <View style={styles.goalSection}>
          <Text style={styles.goalLabel}>Main Goal</Text>
          <View style={styles.chipRow}>
            {GOALS.map(g => (
              <TouchableOpacity
                key={g} onPress={() => setGoal(g)}
                style={[styles.chip, goal === g && { backgroundColor: C.blue, borderColor: C.blue }]}
              >
                <Text style={[styles.chipText, goal === g && { color: '#fff' }]}>{g}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <Divider />
        <View style={styles.goalSection}>
          <Text style={styles.goalLabel}>Preferred Study Time</Text>
          <View style={styles.chipRow}>
            {STUDY_TIMES.map(t => (
              <TouchableOpacity
                key={t} onPress={() => setStudyTime(t)}
                style={[styles.chip, studyTime === t && { backgroundColor: C.blue, borderColor: C.blue }]}
              >
                <Text style={[styles.chipText, studyTime === t && { color: '#fff' }]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <Divider />
        <View style={[styles.row, { paddingHorizontal: 16, paddingVertical: 14 }]}>
          <Text style={styles.goalLabel}>Daily Target Hours</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <TouchableOpacity onPress={() => setDailyHours(h => Math.max(1, h - 1))} style={styles.hoursBtn}>
              <Text style={styles.hoursBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.hoursVal}>{dailyHours}h</Text>
            <TouchableOpacity onPress={() => setDailyHours(h => Math.min(12, h + 1))} style={styles.hoursBtn}>
              <Text style={styles.hoursBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Card>

      {/* Data */}
      <Text style={styles.sectionLabel}>DATA & PRIVACY</Text>
      <Card style={styles.sectionCard}>
        <SettingRow label="Export Data"    value="CSV" onPress={() => Alert.alert('Export', 'Coming soon!')} />
        <Divider />
        <SettingRow label="Privacy Policy"             onPress={() => Alert.alert('Privacy', 'Coming soon!')} />
        <Divider />
        <SettingRow label="Reset All Data"             onPress={handleReset} danger />
      </Card>

      {/* About */}
      <Text style={styles.sectionLabel}>ABOUT</Text>
      <Card style={styles.sectionCard}>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>App Version</Text>
          <Text style={styles.rowValue}>1.0.0</Text>
        </View>
        <Divider />
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Made by</Text>
          <Text style={styles.rowValue}>Team StudyBloom</Text>
        </View>
      </Card>

      {/* Logout */}
      <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn} activeOpacity={0.85}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>

      <Text style={{ textAlign: 'center', fontSize: 12, color: C.subtext, marginBottom: 20 }}>
        StudyBloom v1.0.0 · Spark Plan
      </Text>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: C.bg },
  content: { padding: 20, paddingBottom: 100 },

  header:      { marginBottom: 20, paddingTop: 8 },
  headerSub:   { fontSize: 12, color: C.muted, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 2 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: C.text },

  profileCard:      { borderRadius: 24, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 },
  profileName:      { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 2 },
  profileEmail:     { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginBottom: 8 },
  profileGoalBadge: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 6, paddingVertical: 3, paddingHorizontal: 8, alignSelf: 'flex-start' },
  profileGoalText:  { fontSize: 11, fontWeight: '700', color: '#fff' },
  profileScore:     { fontSize: 28, fontWeight: '800', color: '#fff' },
  profileScoreLabel: { fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: '500' },

  sectionLabel: { fontSize: 11, fontWeight: '800', color: C.muted, letterSpacing: 1.5, marginBottom: 8, marginLeft: 4 },
  sectionCard:  { marginBottom: 20, padding: 0, overflow: 'hidden' },

  row:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  rowLabel: { fontSize: 15, fontWeight: '600', color: C.text },
  rowDesc:  { fontSize: 12, color: C.muted, marginTop: 2 },
  rowValue: { fontSize: 14, color: C.muted, fontWeight: '500' },

  goalSection: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 },
  goalLabel:   { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 10 },
  chipRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  chip:        { paddingVertical: 7, paddingHorizontal: 14, borderRadius: 20, backgroundColor: C.blueSoft, borderWidth: 1, borderColor: C.border },
  chipText:    { fontSize: 12, fontWeight: '600', color: C.muted },

  hoursBtn:     { width: 34, height: 34, borderRadius: 10, backgroundColor: C.blueSoft, alignItems: 'center', justifyContent: 'center' },
  hoursBtnText: { fontSize: 18, fontWeight: '600', color: C.text },
  hoursVal:     { fontSize: 18, fontWeight: '800', color: C.text, minWidth: 32, textAlign: 'center' },

  logoutBtn:  { backgroundColor: C.card, borderRadius: 16, height: 54, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: C.red, marginBottom: 16 },
  logoutText: { fontSize: 16, fontWeight: '700', color: C.red },
});