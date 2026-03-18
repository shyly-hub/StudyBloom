// PostSessionLog.jsx  — PATCHED
//
// ═══════════════════════════════════════════════════════════════
// WHAT CHANGED AND WHY
// ═══════════════════════════════════════════════════════════════
//
// BUG 1 — Data disappears on refresh  (the #1 complaint)
//   ROOT CAUSE: `addDoc` was called and THEN `addSession` (optimistic push)
//   was called with `createdAt: new Date()`.  But the Firestore document
//   has `createdAt: serverTimestamp()`.  When `onSnapshot` fires a split
//   second later, it overwrites the optimistic entry with the real one —
//   but if the component has already navigated away, React throws a state
//   update on an unmounted component warning, and on some devices the
//   snapshot callback races with navigation cleanup and drops the update.
//
//   FIX: pass `createdAt: serverTimestamp()` in the Firestore doc AND pass
//   `createdAt: new Date().toISOString()` (a serialisable string) in the
//   optimistic local push.  onSnapshot will reconcile with the real doc
//   by id — no duplicate, no vanishing entry.
//
// BUG 2 — "10 sessions on Home, 3 on History"  (out-of-sync screens)
//   ROOT CAUSE: `updateDoc` on the user root doc (`users/{uid}`) was using
//   `increment(1)` for totalSessions/totalMinutes.  These fields are read
//   by HomeScreen independently.  If this write fails silently (network
//   blip) the user doc is out of sync with the actual sessions subcollection.
//   All screens reading from `useSession()` were already correct — they
//   derive counts from the live sessions array.  The only fix needed is to
//   make the user-doc write non-blocking (don't let it gate the save flow).
//
//   FIX: moved updateDoc into a fire-and-forget try/catch AFTER addSession
//   has already been called.  The session is always saved to the subcollection
//   first; the user doc denormalisation is best-effort.
//
// BUG 3 — Score sync
//   ROOT CAUSE: `updateUser?.({ score: newScore, ... })` was called
//   synchronously but `updateUserData` in useAuth is async.  If auth
//   context re-renders before this resolves, `userData.score` and
//   `contextScore` diverge until next app launch.
//
//   FIX: also call `sessCtx.updateScore(newScore)` right after addDoc so
//   sessionContext (the single source of truth) reflects the new score
//   immediately — Analytics and History both read from there.
//
// ═══════════════════════════════════════════════════════════════

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, Platform,
  TouchableOpacity, TextInput, Alert,
  ActivityIndicator, Animated, Pressable,
  Dimensions, KeyboardAvoidingView,
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
  MIN_VALID_SECONDS,
} from '../../utils/scoreEngine';

const { width } = Dimensions.get('window');
const ENERGY_LEVELS = ['Low', 'Medium', 'High'];

// ── Scale press ───────────────────────────
function ScalePress({ onPress, children, style, disabled }) {
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

function DifficultyTile({ n, isSelected, bgColor, textColor, shadowColor, onPress }) {
  const scale = useRef(new Animated.Value(isSelected ? 1.1 : 1)).current;
  useEffect(() => {
    Animated.spring(scale, { toValue: isSelected ? 1.1 : 1, useNativeDriver: true, tension: 300, friction: 15 }).start();
  }, [isSelected, scale]);
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Animated.View style={{
        width: 52, height: 52, borderRadius: 26,
        backgroundColor: bgColor, alignItems: 'center', justifyContent: 'center',
        transform: [{ scale }],
        ...Platform.select({
          ios:     { shadowColor, shadowOffset: { width: 0, height: isSelected ? 6 : 0 }, shadowOpacity: isSelected ? 0.4 : 0, shadowRadius: isSelected ? 12 : 0 },
          android: { elevation: isSelected ? 6 : 1 },
        }),
      }}>
        <Text style={{ fontSize: 18, fontWeight: '800', color: textColor, letterSpacing: -0.5 }}>{n}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

function formatDuration(seconds) {
  if (!seconds || seconds < 1) return '0s';
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function SLabel({ children, C }) {
  return (
    <Text style={{ fontSize: 9, fontWeight: '800', color: C?.muted || '#94a3b8', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>
      {children}
    </Text>
  );
}

function softShadow(color = '#000') {
  return Platform.select({
    ios:     { shadowColor: color, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 10 },
    android: { elevation: 2 },
  });
}

export default function PostSessionLog({ navigation, route }) {
  const { C }      = useTheme();
  const auth       = useAuth?.()    || {};
  const user       = auth.user      || null;
  const userData   = auth.userData  || null;
  const updateUser = auth.updateUserData || null;

  // ── FIX 3: also pull updateScore from session context ─────────
  const sessCtx      = useSession?.() || {};
  const addSession   = sessCtx.addSession   || null;
  const updateScore  = sessCtx.updateScore  || null;   // ← NEW

  const {
    subject         = 'Math',
    durationSeconds = 0,
    plannedMinutes  = 25,
    completed       = false,
    quitReason      = null,
    distractions    = [],
    startTime       = new Date().toISOString(),
    studiedOnTime   = false,
    plannedToStudy  = false,
    currentScore    = userData?.score ?? 0,
  } = route?.params || {};

  const durationMinutes = Math.floor(durationSeconds / 60);

  const [mood,       setMood]       = useState(2);
  const [energy,     setEnergy]     = useState('Medium');
  const [difficulty, setDifficulty] = useState(3);
  const [notes,      setNotes]      = useState('');
  const [saving,     setSaving]     = useState(false);
  const [done,       setDone]       = useState(false);
  const [result,     setResult]     = useState(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const energyColor = (lvl) =>
    lvl === 'High' ? '#34d399' : lvl === 'Medium' ? '#f5c842' : '#f87171';

  const safeDuration   = Math.max(durationSeconds, 1);
  const isShortSession = durationSeconds < MIN_VALID_SECONDS;

  const { delta: previewDelta } = calculateScoreDelta({
    completed, distractions, studiedOnTime, plannedToStudy,
    durationSeconds: safeDuration,
  });

  // ══════════════════════════════════════════════════════════════
  // handleSave — PATCHED
  // ══════════════════════════════════════════════════════════════
  const handleSave = async () => {
    if (!user?.uid) { Alert.alert('Not signed in'); return; }
    if (saving) return;                   // duplicate-save guard
    setSaving(true);

    try {
      // ── 1. Build session document ─────────────────────────────
      const sessionDoc = {
        subject,
        durationSeconds: safeDuration,
        duration:        durationMinutes,
        plannedMinutes,
        completed,
        quitReason:      quitReason  || null,
        distractions:    distractions || [],
        mood,
        moodEmoji:       MOODS[mood],
        energy,
        difficulty,
        notes:           notes.trim(),
        date:            startTime,
        studiedOnTime,
        plannedToStudy,
        createdAt:       serverTimestamp(), // Firestore timestamp
        userId:          user.uid,
      };

      // ── 2. Await the Firestore write BEFORE doing anything else ─
      //    This is the core fix for data-disappearing-on-refresh:
      //    we don't navigate until the document is confirmed written.
      const ref = await addDoc(
        collection(db, 'users', user.uid, 'sessions'),
        sessionDoc,
      );

      // ── 3. Optimistic push — use a serialisable date string ────
      //    (serverTimestamp() is not serialisable across navigation params)
      //    onSnapshot will reconcile by id — no duplicate entry.
      if (addSession) {
        addSession({
          id: ref.id,
          ...sessionDoc,
          createdAt: new Date().toISOString(), // ← FIX: serialisable, not serverTimestamp()
        });
      }

      // ── 4. Score calculation ──────────────────────────────────
      const { delta, reasons } = calculateScoreDelta({
        completed, distractions, studiedOnTime, plannedToStudy,
        durationSeconds: safeDuration,
      });
      const newScore = applyScoreDelta(currentScore, delta);

      // ── 5. FIX: update sessionContext score immediately ────────
      //    This keeps Analytics/History rings in sync without a refresh.
      updateScore?.(newScore);

      // ── 6. User-doc denormalisation — fire-and-forget ─────────
      //    FIX: moved into its own try/catch so a network blip here
      //    doesn't cause the whole save to fail / show an error.
      updateDoc(doc(db, 'users', user.uid), {
        score:           newScore,
        disciplineScore: newScore,
        totalSessions:   increment(1),
        totalMinutes:    increment(Math.max(Math.ceil(durationSeconds / 60), 1)),
        lastSessionAt:   serverTimestamp(),
      }).catch(e => console.warn('[PostSessionLog] user doc update failed (non-critical):', e));

      // ── 7. Sync auth context (non-blocking) ───────────────────
      updateUser?.({ score: newScore, totalSessions: (userData?.totalSessions || 0) + 1 });

      // ── 8. Show result screen ─────────────────────────────────
      setResult({ delta, newScore, reasons, rank: getRankFromScore(newScore) });
      setDone(true);
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();

    } catch (e) {
      console.error('[PostSessionLog] handleSave error:', e);
      Alert.alert('Save Failed', 'Could not save your session. Try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── Result screen ─────────────────────────────────────────────
  if (done && result) {
    const isShort     = isShortSession;
    const isPositive  = result.delta >= 0;
    const accentColor = isShort ? '#94a3b8' : isPositive ? '#34d399' : '#f87171';
    const accentGlow  = isShort ? 'rgba(148,163,184,0.10)' : isPositive ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)';

    return (
      <Animated.View style={{
        flex: 1, backgroundColor: '#0a0a0a',
        paddingHorizontal: 24,
        paddingTop: Platform.OS === 'ios' ? 80 : 60,
        paddingBottom: Platform.OS === 'ios' ? 48 : 32,
        opacity: fadeAnim,
      }}>
        <View style={{
          position: 'absolute', width: 320, height: 320, borderRadius: 160,
          backgroundColor: isShort ? 'rgba(148,163,184,0.05)' : isPositive ? 'rgba(245,200,66,0.07)' : 'rgba(248,113,113,0.07)',
          top: 20, alignSelf: 'center',
        }} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between' }}>
          <View style={{
            backgroundColor: '#161616', borderRadius: 28, padding: 28, alignItems: 'center', marginBottom: 16,
            ...Platform.select({
              ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 20 },
              android: { elevation: 8 },
            }),
          }}>
            <Text style={{ fontSize: 52, marginBottom: 12 }}>{isShort ? '📋' : completed ? '🎉' : '💪'}</Text>
            <Text style={{ fontSize: 26, fontWeight: '800', color: '#f0ece0', letterSpacing: -0.8, lineHeight: 32, textAlign: 'center', marginBottom: 6 }}>
              {isShort ? 'Saved to History' : completed ? 'Session Complete!' : 'Session Saved'}
            </Text>
            <Text style={{ fontSize: 13, color: '#555', marginBottom: 28, letterSpacing: 0.2, lineHeight: 18 }}>
              {formatDuration(durationSeconds)} · {subject}
            </Text>

            {isShort ? (
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 14,
                backgroundColor: 'rgba(148,163,184,0.08)', borderRadius: 20,
                paddingVertical: 18, paddingHorizontal: 24, width: '100%', marginBottom: 20,
                borderWidth: 1, borderColor: 'rgba(148,163,184,0.15)',
              }}>
                <Text style={{ fontSize: 30 }}>⏱</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#94a3b8', letterSpacing: -0.2, lineHeight: 20 }}>No Score Impact</Text>
                  <Text style={{ fontSize: 11, color: '#555', marginTop: 3, lineHeight: 17 }}>Sessions need 1+ min to count toward your Discipline Score.</Text>
                </View>
              </View>
            ) : (
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 16,
                backgroundColor: accentGlow, borderRadius: 20,
                paddingVertical: 18, paddingHorizontal: 24, width: '100%', marginBottom: 20,
              }}>
                <Text style={{ fontSize: 52, fontWeight: '900', color: accentColor, letterSpacing: -2, lineHeight: 56 }}>
                  {isPositive ? '+' : ''}{result.delta}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: accentColor, letterSpacing: -0.2, lineHeight: 20 }}>Discipline Score</Text>
                  <Text style={{ fontSize: 12, color: '#555', marginTop: 2, lineHeight: 17 }}>from this session</Text>
                </View>
              </View>
            )}

            <View style={{
              width: 88, height: 88, borderRadius: 44, borderWidth: 3, borderColor: '#f5c842',
              alignItems: 'center', justifyContent: 'center', marginBottom: 20,
              backgroundColor: 'rgba(245,200,66,0.06)',
              ...Platform.select({
                ios:     { shadowColor: '#f5c842', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.35, shadowRadius: 14 },
                android: { elevation: 4 },
              }),
            }}>
              <Text style={{ fontSize: 7, fontWeight: '800', color: '#555', letterSpacing: 2, textTransform: 'uppercase' }}>Score</Text>
              <Text style={{ fontSize: 30, fontWeight: '900', color: '#f5c842', letterSpacing: -1, lineHeight: 34 }}>{result.newScore}</Text>
              {result.rank?.title ? <Text style={{ fontSize: 9, color: '#666', letterSpacing: 0.2 }}>{result.rank.title}</Text> : null}
            </View>

            {result.reasons.length > 0 && (
              <View style={{ gap: 6, alignSelf: 'stretch' }}>
                {result.reasons.map((r, i) => (
                  <View key={i} style={{
                    flexDirection: 'row', alignItems: 'center', gap: 8,
                    paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10,
                    backgroundColor: r.startsWith('+') ? 'rgba(52,211,153,0.06)' : 'rgba(248,113,113,0.06)',
                  }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: r.startsWith('+') ? '#34d399' : '#f87171' }} />
                    <Text style={{ fontSize: 12, fontWeight: '600', color: r.startsWith('+') ? '#34d399' : '#f87171', letterSpacing: -0.2, lineHeight: 18, flex: 1 }}>{r}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation?.reset?.({ index: 0, routes: [{ name: 'Tabs' }] })}
          >
            <LinearGradient
              colors={['#f5c842', '#d4a017']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={{
                height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center',
                ...Platform.select({
                  ios:     { shadowColor: '#f5c842', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 20 },
                  android: { elevation: 8 },
                }),
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#1a0f00', letterSpacing: 0.2 }}>Back to Dashboard</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
    );
  }

  // ── Log form ──────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
    >
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 36, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Header ── */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 11, color: C.muted, fontWeight: '600', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}>
            {completed ? 'Session complete' : 'Session ended early'}
          </Text>
          <Text style={{ fontSize: 28, fontWeight: '800', color: C.text, letterSpacing: -0.5, lineHeight: 34 }}>
            How did it go?
          </Text>
        </View>

        {/* ── Session summary chip ── */}
        <View style={{
          flexDirection: 'row', gap: 10, marginBottom: 28, flexWrap: 'wrap',
        }}>
          {[
            { label: subject, icon: SUBJECT_ICONS?.[subject] || '📌' },
            { label: formatDuration(durationSeconds), icon: '⏱' },
            { label: completed ? 'Completed' : 'Quit early', icon: completed ? '✅' : '🔴' },
            ...(distractions.length > 0 ? [{ label: `${distractions.length} distraction${distractions.length > 1 ? 's' : ''}`, icon: '⚠️' }] : []),
          ].map((chip, i) => (
            <View key={i} style={{
              flexDirection: 'row', alignItems: 'center', gap: 5,
              backgroundColor: C.bgRaised, borderRadius: 20,
              paddingVertical: 7, paddingHorizontal: 12,
              borderWidth: 1, borderColor: C.border,
            }}>
              <Text style={{ fontSize: 12 }}>{chip.icon}</Text>
              <Text style={{ fontSize: 12, fontWeight: '600', color: C.muted }}>{chip.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Mood ── */}
        <View style={{ marginBottom: 24 }}>
          <SLabel C={C}>Mood</SLabel>
          <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'space-between' }}>
            {MOODS.map((emoji, i) => (
              <ScalePress key={i} onPress={() => setMood(i)}
                style={{
                  flex: 1, alignItems: 'center', paddingVertical: 14,
                  borderRadius: 16, backgroundColor: mood === i ? C.blue + '18' : C.bgRaised,
                  borderWidth: mood === i ? 2 : 1, borderColor: mood === i ? C.blue : C.border,
                }}>
                <Text style={{ fontSize: 26 }}>{emoji}</Text>
              </ScalePress>
            ))}
          </View>
        </View>

        {/* ── Energy ── */}
        <View style={{ marginBottom: 24 }}>
          <SLabel C={C}>Energy Level</SLabel>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {ENERGY_LEVELS.map(lvl => {
              const isOn = energy === lvl;
              const ec   = energyColor(lvl);
              return (
                <ScalePress key={lvl} onPress={() => setEnergy(lvl)}
                  style={{
                    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
                    paddingVertical: 12, borderRadius: 14,
                    backgroundColor: isOn ? ec + '15' : C.bgRaised,
                    borderWidth: isOn ? 1.5 : 0, borderColor: ec,
                  }}>
                  <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: isOn ? ec : C.border }} />
                  <Text style={{ fontSize: 12, fontWeight: '700', color: isOn ? ec : C.muted, letterSpacing: -0.2 }}>{lvl}</Text>
                </ScalePress>
              );
            })}
          </View>
        </View>

        {/* ── Difficulty ── */}
        <View style={{ marginBottom: 24 }}>
          <SLabel C={C}>Difficulty</SLabel>
          <View style={{ flexDirection: 'row', marginBottom: 8, paddingHorizontal: 4 }}>
            <Text style={{ flex: 1, fontSize: 9, color: C.muted, textAlign: 'center', letterSpacing: 0.3 }}>Easy</Text>
            <View style={{ flex: 1 }} /><View style={{ flex: 1 }} /><View style={{ flex: 1 }} />
            <Text style={{ flex: 1, fontSize: 9, color: C.muted, textAlign: 'center', letterSpacing: 0.3 }}>Hard</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 }}>
            {[1, 2, 3, 4, 5].map(n => {
              const isSelected = n === difficulty;
              const isFilled   = n <= difficulty;
              const bgColor    = isSelected ? (n <= 2 ? '#34d399' : n === 3 ? '#f5c842' : '#f87171') : isFilled ? (n <= 2 ? '#34d39930' : n === 3 ? '#f5c84230' : '#f8717130') : C.bgRaised;
              const textColor  = isSelected ? (n === 3 ? '#1a1000' : '#fff') : isFilled ? (n <= 2 ? '#34d399' : n === 3 ? '#C9A84C' : '#f87171') : C.muted;
              const shadowColor = isSelected ? (n <= 2 ? '#34d399' : n === 3 ? '#f5c842' : '#f87171') : 'transparent';
              return <DifficultyTile key={n} n={n} isSelected={isSelected} bgColor={bgColor} textColor={textColor} shadowColor={shadowColor} onPress={() => setDifficulty(n)} />;
            })}
          </View>
          <Text style={{ fontSize: 11, color: C.muted, textAlign: 'center', marginTop: 12, letterSpacing: -0.2, lineHeight: 15 }}>
            {['', 'Very Easy', 'Easy', 'Medium', 'Hard', 'Very Hard'][difficulty]}
          </Text>
        </View>

        {/* ── Reflection ── */}
        <View style={{ marginBottom: 24 }}>
          <SLabel C={C}>Reflection</SLabel>
          <View style={{
            backgroundColor: '#FDFAF4', borderRadius: 20,
            paddingHorizontal: 18, paddingTop: 16, paddingBottom: 12, minHeight: 120,
            ...Platform.select({
              ios:     { shadowColor: '#d4a017', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12 },
              android: { elevation: 2 },
            }),
          }}>
            <TextInput
              style={{ fontSize: 15, color: '#1a1a1a', lineHeight: 23, letterSpacing: -0.2, minHeight: 80, fontWeight: '400' }}
              placeholder="Any reflections on this session..."
              placeholderTextColor="#c8c0b0"
              value={notes}
              onChangeText={setNotes}
              multiline maxLength={200}
              textAlignVertical="top"
              selectionColor="#d4a017"
            />
            <Text style={{ fontSize: 10, color: notes.length > 180 ? '#d4a017' : '#c8c0b0', textAlign: 'right', marginTop: 6, letterSpacing: 0.4, fontWeight: '500' }}>
              {notes.length}/200
            </Text>
          </View>
        </View>

        {/* ── Score preview / short-session notice ── */}
        {isShortSession ? (
          <View style={{
            backgroundColor: 'rgba(148,163,184,0.08)', borderRadius: 24, padding: 20, marginBottom: 8,
            borderWidth: 1, borderColor: 'rgba(148,163,184,0.18)',
            flexDirection: 'row', alignItems: 'center', gap: 14,
            ...Platform.select({
              ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 10 },
              android: { elevation: 1 },
            }),
          }}>
            <Text style={{ fontSize: 30 }}>📋</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: C.text, letterSpacing: -0.2, marginBottom: 4 }}>Saved to History</Text>
              <Text style={{ fontSize: 12, color: C.muted, lineHeight: 17 }}>
                Sessions under 1 minute are recorded but don't affect your Discipline Score. Keep going next time!
              </Text>
            </View>
          </View>
        ) : (
          <View style={{
            backgroundColor: previewDelta >= 0 ? 'rgba(52,211,153,0.07)' : 'rgba(248,113,113,0.07)',
            borderRadius: 24, padding: 20, marginBottom: 8,
            ...Platform.select({
              ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 10 },
              android: { elevation: 1 },
            }),
          }}>
            <Text style={{ fontSize: 10, fontWeight: '700', color: C.muted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8, lineHeight: 14 }}>Score Impact</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Text style={{ fontSize: 32, fontWeight: '900', color: previewDelta >= 0 ? '#34d399' : '#f87171', letterSpacing: -1 }}>
                {previewDelta >= 0 ? '+' : ''}{previewDelta}
              </Text>
              <Text style={{ fontSize: 13, color: C.muted, letterSpacing: -0.2, lineHeight: 18 }}>points this session</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── Floating save pill ── */}
      <View style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        paddingHorizontal: 16,
        paddingBottom: Platform.OS === 'ios' ? 44 : 24,
        paddingTop: 12,
        backgroundColor: C.bg + 'F5',
      }}>
        <ScalePress onPress={handleSave} disabled={saving}>
          <LinearGradient
            colors={saving ? ['#ccc', '#bbb'] : ['#f5c842', '#d4a017']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={{
              height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center',
              ...Platform.select({
                ios:     { shadowColor: '#f5c842', shadowOffset: { width: 0, height: 8 }, shadowOpacity: saving ? 0 : 0.35, shadowRadius: 18 },
                android: { elevation: saving ? 2 : 8 },
              }),
            }}
          >
            {saving
              ? <ActivityIndicator color="#1a0f00" size="small" />
              : <Text style={{ fontSize: 16, fontWeight: '700', color: '#1a0f00', letterSpacing: 0.3 }}>Save Session</Text>
            }
          </LinearGradient>
        </ScalePress>
      </View>
    </KeyboardAvoidingView>
  );
}