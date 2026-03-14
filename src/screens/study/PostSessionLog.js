

import React, { useState, useRef } from 'react';
import {
  View, Text, ScrollView,
  TouchableOpacity, TextInput, Alert,
  ActivityIndicator, Animated, Pressable,
} from 'react-native';
import { LinearGradient }   from 'expo-linear-gradient';
import {
  collection, addDoc, doc, updateDoc,
  serverTimestamp, increment,
} from 'firebase/firestore';
import { db }               from '../../config/firebase';
import { useAuth }          from '../../hooks/useAuth';
import { useTheme }         from '../../context/ThemeContext';
import { useSession }       from '../../context/sessionContext';
import { MOODS, sBg, sColor, SUBJECT_ICONS } from '../../themes';
import {
  calculateScoreDelta, applyScoreDelta, getRankFromScore,
} from '../../utils/scoreEngine';

const ENERGY_LEVELS = ['Low', 'Medium', 'High'];

function Tap({ onPress, children, style, disabled }) {
  const scale = useRef(new Animated.Value(1)).current;
  const down  = () => Animated.spring(scale, { toValue: 0.95, useNativeDriver: true, tension: 400, friction: 18 }).start();
  const up    = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, tension: 300, friction: 14 }).start();
  if (disabled) return <View style={style}>{children}</View>;
  return (
    <Pressable onPressIn={down} onPressOut={up} onPress={onPress}>
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

// ── Format seconds for display ──────────────────────────────────
function formatDuration(seconds) {
  if (!seconds || seconds < 1) return '0s';
  if (seconds < 60)  return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

export default function PostSessionLog({ navigation, route }) {
  const { C }        = useTheme();
  const auth         = useAuth?.()    || {};
  const user         = auth.user      || null;
  const userData     = auth.userData  || null;
  const updateUser   = auth.updateUserData || null;
  const sessCtx      = useSession?.() || {};
  const addSession   = sessCtx.addSession || null;   // ← context method

  const {
    subject          = 'Math',
    durationSeconds  = 0,      // ← actual seconds spent
    durationMinutes  = 0,      // ← for display
    plannedMinutes   = 25,
    completed        = false,
    quitReason       = null,
    distractions     = [],
    startTime        = new Date().toISOString(),
    studiedOnTime    = false,
    plannedToStudy   = false,
    currentScore     = userData?.score ?? 0,
  } = route?.params || {};

  const [mood,       setMood]       = useState(2);
  const [energy,     setEnergy]     = useState('Medium');
  const [difficulty, setDifficulty] = useState(3);
  const [notes,      setNotes]      = useState('');
  const [saving,     setSaving]     = useState(false);
  const [done,       setDone]       = useState(false);
  const [result,     setResult]     = useState(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const handleSave = async () => {
    if (!user?.uid) { Alert.alert('Not signed in'); return; }
    setSaving(true);
    try {
      // ── Build the session document ──────────────────────────
      const sessionDoc = {
        subject,
        // Store BOTH for flexibility
        durationSeconds: Math.max(durationSeconds, 1),   // primary — always seconds
        duration:        durationMinutes,                  // legacy minutes field kept for old queries
        plannedMinutes,
        completed,
        quitReason:      quitReason   || null,
        distractions:    distractions || [],
        mood,
        moodEmoji:       MOODS[mood],
        energy,
        difficulty,
        notes:           notes.trim(),
        date:            startTime,
        studiedOnTime,
        plannedToStudy,
        createdAt:       serverTimestamp(),
        userId:          user.uid,
      };

      // ── 1. Save to Firestore ────────────────────────────────
      const ref = await addDoc(
        collection(db, 'users', user.uid, 'sessions'),
        sessionDoc
      );

      // ── 2. Add to sessionContext immediately ───────────────
      // This is what makes History update right away without reload
      if (addSession) {
        addSession({ id: ref.id, ...sessionDoc, createdAt: new Date() });
      }

      // ── 3. Calculate score ─────────────────────────────────
      const { delta, reasons } = calculateScoreDelta({
        completed,
        distractions,
        studiedOnTime,
        plannedToStudy,
      });
      const newScore = applyScoreDelta(currentScore, delta);

      // ── 4. Update user doc ─────────────────────────────────
      await updateDoc(doc(db, 'users', user.uid), {
        score:            newScore,
        disciplineScore:  newScore,
        totalSessions:    increment(1),
        // increment totalMinutes using actual seconds → minutes
        totalMinutes:     increment(Math.max(Math.ceil(durationSeconds / 60), 1)),
        lastSessionAt:    serverTimestamp(),
      });

      // Also update local auth state if available
      updateUser?.({
        score:         newScore,
        totalSessions: (userData?.totalSessions || 0) + 1,
      });

      // ── 5. Show result ─────────────────────────────────────
      setResult({ delta, newScore, reasons, rank: getRankFromScore(newScore) });
      setDone(true);
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();

    } catch (e) {
      Alert.alert('Save Failed', 'Could not save your session. Try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── Result screen ─────────────────────────────────────────────
  if (done && result) {
    const isPositive = result.delta >= 0;
    return (
      <Animated.View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', padding: 24, opacity: fadeAnim }}>
        <View style={{ position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: isPositive ? C.blueSoft : C.redSoft, top: 80 }} />
        <View style={{ backgroundColor: C.card, borderRadius: 24, padding: 28, width: '100%', alignItems: 'center', borderWidth: 1, borderColor: C.border }}>
          <Text style={{ fontSize: 48, marginBottom: 8 }}>{completed ? '🎉' : '💪'}</Text>
          <Text style={{ fontSize: 22, fontWeight: '800', color: C.text, marginBottom: 6 }}>
            {completed ? 'Session Complete!' : 'Session Saved'}
          </Text>
          {/* Show actual time in seconds if under 1 min */}
          <Text style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>
            {formatDuration(durationSeconds)} · {subject}
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <Text style={{ fontSize: 42, fontWeight: '900', color: isPositive ? C.green : C.red, letterSpacing: -1 }}>
              {isPositive ? '+' : ''}{result.delta}
            </Text>
            <Text style={{ fontSize: 13, color: C.muted, fontWeight: '600' }}>Discipline Score</Text>
          </View>

          <View style={{ width: 100, height: 100, borderRadius: 50, borderWidth: 6, borderColor: C.blue, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <Text style={{ fontSize: 9, fontWeight: '900', color: C.muted, letterSpacing: 2, marginBottom: 2 }}>SCORE</Text>
            <Text style={{ fontSize: 36, fontWeight: '900', color: C.text, letterSpacing: -1 }}>{result.newScore}</Text>
            <Text style={{ fontSize: 10, color: C.muted }}>{result.rank.title}</Text>
          </View>

          <View style={{ gap: 4, alignSelf: 'stretch', marginBottom: 24 }}>
            {result.reasons.map((r, i) => (
              <Text key={i} style={{ fontSize: 12, fontWeight: '600', textAlign: 'center', color: r.startsWith('+') ? C.green : C.red }}>{r}</Text>
            ))}
          </View>

          <Tap onPress={() => navigation?.reset?.({ index: 0, routes: [{ name: 'Tabs' }] })} style={{ width: '100%' }}>
            <LinearGradient colors={['#f5c842', '#e8b020']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={{ height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#2a2000' }}>Back to Dashboard</Text>
            </LinearGradient>
          </Tap>
        </View>
      </Animated.View>
    );
  }

  // ── Log form ──────────────────────────────────────────────────
  const { delta: previewDelta } = calculateScoreDelta({ completed, distractions, studiedOnTime, plannedToStudy });

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 20, paddingTop: 52, paddingBottom: 60 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

      {/* Session summary */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 18, padding: 16, marginBottom: 24, borderWidth: 1, backgroundColor: sBg(subject), borderColor: sColor(subject) + '50' }}>
        <View style={{ width: 50, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: sBg(subject) }}>
          <Text style={{ fontSize: 26 }}>{SUBJECT_ICONS[subject] || '📌'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '800', color: sColor(subject), letterSpacing: -0.3, marginBottom: 2 }}>{subject}</Text>
          {/* Shows seconds — "4s" not "0 min" */}
          <Text style={{ fontSize: 12, color: C.muted, fontWeight: '500' }}>
            {formatDuration(durationSeconds)} · {completed ? 'Completed ✓' : `Quit — ${quitReason || 'early'}`}
          </Text>
          {distractions.length > 0 && (
            <Text style={{ fontSize: 11, color: C.orange, fontWeight: '600', marginTop: 2 }}>{distractions.length} distraction{distractions.length > 1 ? 's' : ''}</Text>
          )}
        </View>
      </View>

      <Text style={{ fontSize: 20, fontWeight: '800', color: C.text, letterSpacing: -0.4, marginBottom: 18 }}>How did it feel?</Text>

      {/* Mood */}
      <Text style={{ fontSize: 8, fontWeight: '800', color: C.muted, letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 10 }}>MOOD</Text>
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20, justifyContent: 'center' }}>
        {MOODS.map((emoji, i) => (
          <Tap key={i} onPress={() => setMood(i)}>
            <View style={{ width: 52, height: 52, borderRadius: 16, borderWidth: 1.5, borderColor: mood === i ? C.blue : C.border, backgroundColor: mood === i ? C.blueSoft : C.card, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 26, opacity: mood === i ? 1 : 0.45 }}>{emoji}</Text>
            </View>
          </Tap>
        ))}
      </View>

      {/* Energy */}
      <Text style={{ fontSize: 8, fontWeight: '800', color: C.muted, letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 10 }}>ENERGY LEVEL</Text>
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
        {ENERGY_LEVELS.map(lvl => (
          <Tap key={lvl} onPress={() => setEnergy(lvl)} style={{ flex: 1 }}>
            <View style={{ flex: 1, paddingVertical: 11, borderRadius: 12, borderWidth: 1.5, borderColor: energy === lvl ? C.blue : C.border, backgroundColor: energy === lvl ? C.blueSoft : C.card, alignItems: 'center' }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: energy === lvl ? C.blueDark : C.muted }}>{lvl}</Text>
            </View>
          </Tap>
        ))}
      </View>

      {/* Difficulty */}
      <Text style={{ fontSize: 8, fontWeight: '800', color: C.muted, letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 10 }}>DIFFICULTY</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 }}>
        {[1,2,3,4,5].map(n => (
          <Tap key={n} onPress={() => setDifficulty(n)}>
            <Text style={{ fontSize: 30, opacity: n <= difficulty ? 1 : 0.25, color: C.blue }}>★</Text>
          </Tap>
        ))}
        <Text style={{ fontSize: 12, color: C.muted, fontWeight: '600', marginLeft: 6 }}>{difficulty}/5</Text>
      </View>

      {/* Notes */}
      <Text style={{ fontSize: 8, fontWeight: '800', color: C.muted, letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 10 }}>NOTES (optional)</Text>
      <View style={{ backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 12, marginBottom: 20, minHeight: 90 }}>
        <TextInput style={{ fontSize: 14, color: C.text, minHeight: 60, lineHeight: 20 }} value={notes} onChangeText={setNotes} placeholder="Any reflections..." placeholderTextColor={C.subtext} multiline maxLength={200} textAlignVertical="top" selectionColor={C.blue} />
        <Text style={{ fontSize: 10, color: C.subtext, textAlign: 'right', marginTop: 4 }}>{notes.length}/200</Text>
      </View>

      {/* Score preview */}
      <View style={{ backgroundColor: C.blueSoft, borderRadius: 14, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: C.blue + '50' }}>
        <Text style={{ fontSize: 11, fontWeight: '700', color: C.blueDark, marginBottom: 6 }}>Score Change Preview</Text>
        <Text style={{ fontSize: 22, fontWeight: '900', color: previewDelta >= 0 ? C.green : C.red }}>
          {previewDelta >= 0 ? '+' : ''}{previewDelta} points
        </Text>
      </View>

      {/* Save */}
      <Tap onPress={handleSave} disabled={saving}>
        <LinearGradient colors={saving ? [C.muted, C.subtext] : ['#f5c842', '#e8b020']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={{ height: 54, borderRadius: 14, alignItems: 'center', justifyContent: 'center', shadowColor: 'rgba(245,200,66,0.4)', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 1, shadowRadius: 12, elevation: 6 }}>
          {saving ? <ActivityIndicator color="#2a2000" size="small" /> : <Text style={{ fontSize: 16, fontWeight: '800', color: '#2a2000', letterSpacing: 0.3 }}>Save Session</Text>}
        </LinearGradient>
      </Tap>

    </ScrollView>
  );
}