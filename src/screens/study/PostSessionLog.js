
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, TextInput, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C, MOODS, QUIT_REASONS, SUBJECT_ICONS, sColor, sBg } from '../../themes';
import { useSession } from '../../context/sessionContext';

const ENERGY_LEVELS = [
  { label: 'Low',    color: C.red,    bg: '#fff1f2' },
  { label: 'Medium', color: C.yellow, bg: '#fefce8' },
  { label: 'High',   color: C.green,  bg: '#f0fdf4' },
];

export default function PostSessionLog({ navigation, route }) {
  const {
    subject      = 'Math',
    duration     = 25,
    completed    = true,
    distractions = [],
  } = route?.params || {};

  const [mood,       setMood]       = useState(2);
  const [energy,     setEnergy]     = useState('Medium');
  const [difficulty, setDifficulty] = useState(3);
  const [quitReason, setQuitReason] = useState(null);
  const [notes,      setNotes]      = useState('');
  const [saving,     setSaving]     = useState(false);

  // ✅ useSession from context — has userId already
  const { addSession } = useSession();

  const subjectColor = sColor(subject);
  const subjectBg    = sBg(subject);
  const subjectIcon  = SUBJECT_ICONS?.[subject] || '📌';

  const goHome = () => {
    navigation.reset({
      index:  0,
      routes: [{ name: 'Tabs' }],  // ✅ fixed: was 'Main'
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const sessionData = {
        subject,
        duration,
        completed,
        mood,
        energy,
        difficulty,
        distractions,
        quitReason: completed ? null : quitReason,
        notes:      notes.trim(),
      };
      await addSession(sessionData);
      goHome();
    } catch (err) {
      Alert.alert('Error', 'Could not save session. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const scoreDelta      = completed ? (distractions.length === 0 ? '+15' : '+10') : '-5';
  const displayDuration = duration < 1 ? '< 1' : duration;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerSub}>Session complete</Text>
        <Text style={styles.headerTitle}>How did it go?</Text>
      </View>

      {/* ── Summary card ── */}
      <LinearGradient
        colors={completed ? [C.blueDark, C.blue] : [C.red + 'cc', C.red]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.summaryCard}
      >
        <View style={styles.summaryTop}>
          <View style={[styles.summarySubject, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <Text style={styles.summaryIcon}>{subjectIcon}</Text>
            <Text style={styles.summarySubjectText}>{subject}</Text>
          </View>
          <View style={[styles.scoreDeltaBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <Text style={styles.scoreDeltaText}>{scoreDelta} pts</Text>
          </View>
        </View>

        <View style={styles.summaryBottom}>
          <View>
            <Text style={styles.summaryDuration}>{displayDuration} min</Text>
            <Text style={styles.summaryDurationSub}>focus time</Text>
          </View>
          <View style={styles.summaryStatus}>
            <View style={[styles.statusDot, { backgroundColor: completed ? '#86efac' : '#fca5a5' }]} />
            <Text style={styles.summaryStatusText}>
              {completed ? 'Completed ✓' : 'Quit Early'}
            </Text>
          </View>
        </View>

        {distractions.length > 0 && (
          <View style={styles.distrRow}>
            {distractions.slice(0, 4).map((d, i) => (
              <View key={i} style={styles.distrChip}>
                <Text style={styles.distrChipText}>{d.type || d}</Text>
              </View>
            ))}
            {distractions.length > 4 && (
              <View style={styles.distrChip}>
                <Text style={styles.distrChipText}>+{distractions.length - 4}</Text>
              </View>
            )}
          </View>
        )}
      </LinearGradient>

      {/* ── Mood ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How was your mood?</Text>
        <View style={styles.moodRow}>
          {MOODS.map((emoji, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => setMood(i)}
              style={[
                styles.moodBtn,
                mood === i && { backgroundColor: subjectBg, borderColor: subjectColor, borderWidth: 2 },
              ]}
              activeOpacity={0.8}
            >
              <Text style={[styles.moodEmoji, { opacity: mood === i ? 1 : 0.45 }]}>
                {emoji}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── Energy ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Energy level?</Text>
        <View style={styles.energyRow}>
          {ENERGY_LEVELS.map(e => (
            <TouchableOpacity
              key={e.label}
              onPress={() => setEnergy(e.label)}
              style={[styles.energyBtn, { backgroundColor: energy === e.label ? e.color : e.bg }]}
              activeOpacity={0.8}
            >
              <View style={[styles.energyDot, { backgroundColor: energy === e.label ? '#fff' : e.color }]} />
              <Text style={[styles.energyLabel, { color: energy === e.label ? '#fff' : e.color }]}>
                {e.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── Difficulty ── */}
      <View style={styles.section}>
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>How hard was it?</Text>
          <Text style={[styles.difficultyLabel, { color: subjectColor }]}>
            {['', 'Very Easy', 'Easy', 'Medium', 'Hard', 'Very Hard'][difficulty]}
          </Text>
        </View>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map(n => (
            <TouchableOpacity
              key={n}
              onPress={() => setDifficulty(n)}
              style={[
                styles.starBtn,
                {
                  backgroundColor: n <= difficulty ? subjectColor : C.border,
                  transform: [{ scale: n === difficulty ? 1.15 : 1 }],
                }
              ]}
              activeOpacity={0.8}
            >
              <Text style={styles.starText}>{n}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── Quit reason ── */}
      {!completed && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Why did you quit?</Text>
          <View style={styles.quitGrid}>
            {QUIT_REASONS.map(reason => (
              <TouchableOpacity
                key={reason}
                onPress={() => setQuitReason(quitReason === reason ? null : reason)}
                style={[
                  styles.quitChip,
                  quitReason === reason && { backgroundColor: C.red, borderColor: C.red },
                ]}
                activeOpacity={0.8}
              >
                <Text style={[styles.quitChipText, quitReason === reason && { color: '#fff' }]}>
                  {reason}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* ── Notes ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Any notes? (optional)</Text>
        <TextInput
          style={styles.notesInput}
          placeholder="What went well? What was hard?"
          placeholderTextColor={C.subtext}
          value={notes}
          onChangeText={setNotes}
          multiline
          maxLength={200}
        />
        <Text style={styles.charCount}>{notes.length}/200</Text>
      </View>

      {/* ── Save button ── */}
      <TouchableOpacity
        onPress={handleSave}
        disabled={saving}
        activeOpacity={0.85}
        style={styles.saveBtnWrapper}
      >
        <LinearGradient
          colors={saving ? [C.muted, C.subtext] : [C.blueDark, C.blue]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.saveBtn}
        >
          <Text style={styles.saveBtnText}>
            {saving ? 'Saving...' : 'Save Session'}
          </Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Skip */}
      <TouchableOpacity onPress={goHome} style={{ alignItems: 'center', paddingVertical: 16 }}>
        <Text style={{ fontSize: 14, color: C.muted, fontWeight: '500' }}>
          Skip & don't save
        </Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: C.bg },
  content: { padding: 24, paddingBottom: 40 },

  header:      { marginBottom: 20, paddingTop: 56 },
  headerSub:   { fontSize: 12, color: C.muted, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 2 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: C.text },

  summaryCard:        { borderRadius: 24, padding: 20, marginBottom: 24 },
  summaryTop:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  summarySubject:     { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 20, paddingVertical: 6, paddingHorizontal: 12 },
  summaryIcon:        { fontSize: 16 },
  summarySubjectText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  scoreDeltaBadge:    { borderRadius: 10, paddingVertical: 4, paddingHorizontal: 12 },
  scoreDeltaText:     { fontSize: 15, fontWeight: '800', color: '#fff' },
  summaryBottom:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 },
  summaryDuration:    { fontSize: 40, fontWeight: '800', color: '#fff', letterSpacing: -1 },
  summaryDurationSub: { fontSize: 13, color: 'rgba(255,255,255,0.65)' },
  summaryStatus:      { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot:          { width: 8, height: 8, borderRadius: 4 },
  summaryStatusText:  { fontSize: 14, fontWeight: '700', color: '#fff' },
  distrRow:           { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  distrChip:          { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10, paddingVertical: 4, paddingHorizontal: 10 },
  distrChipText:      { fontSize: 11, color: '#fff', fontWeight: '600' },

  section:         { marginBottom: 24 },
  sectionTitle:    { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 14 },
  sectionRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  difficultyLabel: { fontSize: 13, fontWeight: '700' },

  moodRow:    { flexDirection: 'row', justifyContent: 'space-between' },
  moodBtn:    { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: C.card, borderWidth: 1.5, borderColor: C.border },
  moodEmoji:  { fontSize: 28 },

  energyRow:   { flexDirection: 'row', gap: 10 },
  energyBtn:   { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 48, borderRadius: 14 },
  energyDot:   { width: 8, height: 8, borderRadius: 4 },
  energyLabel: { fontSize: 14, fontWeight: '700' },

  starsRow: { flexDirection: 'row', gap: 10 },
  starBtn:  { flex: 1, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  starText: { fontSize: 16, fontWeight: '800', color: '#fff' },

  quitGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quitChip:     { paddingVertical: 9, paddingHorizontal: 16, borderRadius: 20, backgroundColor: C.redSoft, borderWidth: 1.5, borderColor: C.red + '44' },
  quitChipText: { fontSize: 13, fontWeight: '600', color: C.red },

  notesInput: { backgroundColor: C.card, borderRadius: 16, padding: 16, fontSize: 14, color: C.text, borderWidth: 1, borderColor: C.border, minHeight: 100, textAlignVertical: 'top' },
  charCount:  { fontSize: 11, color: C.subtext, textAlign: 'right', marginTop: 6 },

  saveBtnWrapper: { borderRadius: 16, shadowColor: C.blue, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6, marginBottom: 8 },
  saveBtn:        { height: 58, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  saveBtnText:    { fontSize: 17, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
});