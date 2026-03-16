import React, { useState, useRef } from 'react';
import {
  View, Text, ScrollView, Platform,
  TouchableOpacity, TextInput, Alert,
  ActivityIndicator, Animated, Pressable,
  Dimensions,
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

// ── Format duration ───────────────────────
function formatDuration(seconds) {
  if (!seconds || seconds < 1) return '0s';
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

// ── Section label ─────────────────────────
function SLabel({ children, C }) {
  return (
    <Text style={{
      fontSize:      9,
      fontWeight:    '800',
      color:         C?.muted || '#94a3b8',
      letterSpacing: 2,
      textTransform: 'uppercase',
      marginBottom:  12,
    }}>
      {children}
    </Text>
  );
}

// ── Shadow style helper ───────────────────
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
  const sessCtx    = useSession?.() || {};
  const addSession = sessCtx.addSession || null;

  const {
    subject         = 'Math',
    durationSeconds = 0,
    durationMinutes = 0,
    plannedMinutes  = 25,
    completed       = false,
    quitReason      = null,
    distractions    = [],
    startTime       = new Date().toISOString(),
    studiedOnTime   = false,
    plannedToStudy  = false,
    currentScore    = userData?.score ?? 0,
  } = route?.params || {};

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

  const handleSave = async () => {
    if (!user?.uid) { Alert.alert('Not signed in'); return; }
    setSaving(true);
    try {
      const sessionDoc = {
        subject,
        durationSeconds: Math.max(durationSeconds, 1),
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
        createdAt:       serverTimestamp(),
        userId:          user.uid,
      };

      const ref = await addDoc(
        collection(db, 'users', user.uid, 'sessions'),
        sessionDoc
      );
      if (addSession) addSession({ id: ref.id, ...sessionDoc, createdAt: new Date() });

      const { delta, reasons } = calculateScoreDelta({
        completed, distractions, studiedOnTime, plannedToStudy,
      });
      const newScore = applyScoreDelta(currentScore, delta);

      await updateDoc(doc(db, 'users', user.uid), {
        score:           newScore,
        disciplineScore: newScore,
        totalSessions:   increment(1),
        totalMinutes:    increment(Math.max(Math.ceil(durationSeconds / 60), 1)),
        lastSessionAt:   serverTimestamp(),
      });

      updateUser?.({ score: newScore, totalSessions: (userData?.totalSessions || 0) + 1 });

      setResult({ delta, newScore, reasons, rank: getRankFromScore(newScore) });
      setDone(true);
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();

    } catch (e) {
      Alert.alert('Save Failed', 'Could not save your session. Try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── Result screen ─────────────────────────
  if (done && result) {
    const isPositive = result.delta >= 0;
    const accentColor = isPositive ? '#34d399' : '#f87171';
    const accentGlow  = isPositive ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)';
    return (
      <Animated.View style={{
        flex:              1,
        backgroundColor:   '#0a0a0a',
        paddingHorizontal: 24,
        paddingTop:        Platform.OS === 'ios' ? 80 : 60,
        paddingBottom:     Platform.OS === 'ios' ? 48 : 32,
        opacity:           fadeAnim,
      }}>
        {/* Ambient glow blob */}
        <View style={{
          position:        'absolute',
          width:           340,
          height:          340,
          borderRadius:    170,
          backgroundColor: isPositive ? 'rgba(245,200,66,0.07)' : 'rgba(248,113,113,0.07)',
          top:             20,
          alignSelf:       'center',
        }} />

        {/* ── Main card ── */}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between' }}>
        <View style={{
          backgroundColor: '#161616',
          borderRadius:    28,
          padding:         28,
          alignItems:      'center',
          borderWidth:     0,
          marginBottom:    16,
          ...Platform.select({
            ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 20 },
            android: { elevation: 8 },
          }),
        }}>
          {/* Emoji + title */}
          <Text style={{ fontSize: 52, marginBottom: 12 }}>{completed ? '🎉' : '💪'}</Text>
          <Text style={{
            fontSize:      28,
            fontWeight:    '800',
            color:         '#f0ece0',
            letterSpacing: -0.8,
            lineHeight:    34,
            textAlign:     'center',
            marginBottom:  6,
          }}>
            {completed ? 'Session Complete!' : 'Session Saved'}
          </Text>
          <Text style={{ fontSize: 13, color: '#555', marginBottom: 28, letterSpacing: 0.2 }}>
            {formatDuration(durationSeconds)} · {subject}
          </Text>

          {/* Score delta row */}
          <View style={{
            flexDirection:   'row',
            alignItems:      'center',
            gap:             16,
            backgroundColor: accentGlow,
            borderRadius:    20,
            paddingVertical:  18,
            paddingHorizontal: 24,
            width:           '100%',
            marginBottom:    20,
          }}>
            <Text style={{ fontSize: 52, fontWeight: '900', color: accentColor, letterSpacing: -2, lineHeight: 56 }}>
              {isPositive ? '+' : ''}{result.delta}
            </Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: accentColor, letterSpacing: -0.2 }}>Discipline Score</Text>
              <Text style={{ fontSize: 12, color: '#555', marginTop: 2 }}>from this session</Text>
            </View>
          </View>

          {/* Score ring */}
          <View style={{
            width:           88,
            height:          88,
            borderRadius:    44,
            borderWidth:     3,
            borderColor:     '#f5c842',
            alignItems:      'center',
            justifyContent:  'center',
            marginBottom:    20,
            backgroundColor: 'rgba(245,200,66,0.06)',
            ...Platform.select({
              ios: { shadowColor: '#f5c842', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.35, shadowRadius: 14 },
              android: { elevation: 4 },
            }),
          }}>
            <Text style={{ fontSize: 7, fontWeight: '800', color: '#555', letterSpacing: 2, textTransform: 'uppercase' }}>Score</Text>
            <Text style={{ fontSize: 30, fontWeight: '900', color: '#f5c842', letterSpacing: -1, lineHeight: 34 }}>{result.newScore}</Text>
            {result.rank?.title ? (
              <Text style={{ fontSize: 9, color: '#666', letterSpacing: 0.2 }}>{result.rank.title}</Text>
            ) : null}
          </View>

          {/* Reason breakdown */}
          {result.reasons.length > 0 && (
            <View style={{ gap: 6, alignSelf: 'stretch' }}>
              {result.reasons.map((r, i) => (
                <View key={i} style={{
                  flexDirection:   'row',
                  alignItems:      'center',
                  gap:             8,
                  paddingVertical: 6,
                  paddingHorizontal: 12,
                  borderRadius:    10,
                  backgroundColor: r.startsWith('+') ? 'rgba(52,211,153,0.06)' : 'rgba(248,113,113,0.06)',
                }}>
                  <View style={{
                    width: 6, height: 6, borderRadius: 3,
                    backgroundColor: r.startsWith('+') ? '#34d399' : '#f87171',
                  }} />
                  <Text style={{
                    fontSize:      12,
                    fontWeight:    '600',
                    color:         r.startsWith('+') ? '#34d399' : '#f87171',
                    letterSpacing: -0.2,
                    lineHeight:    18,
                    flex:          1,
                  }}>
                    {r}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ── Back to Dashboard — full width gold pill ── */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation?.reset?.({ index: 0, routes: [{ name: 'Tabs' }] })}
          style={{ alignSelf: 'stretch' }}
        >
          <LinearGradient
            colors={['#f5c842', '#d4a017']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={{
              height:         56,
              borderRadius:   28,
              alignItems:     'center',
              justifyContent: 'center',
              ...Platform.select({
                ios:     { shadowColor: '#f5c842', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 20 },
                android: { elevation: 8 },
              }),
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#1a0f00', letterSpacing: 0.2, fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif' }}>
              Back to Dashboard
            </Text>
          </LinearGradient>
        </TouchableOpacity>
        </ScrollView>
      </Animated.View>
    );
  }

  // ── Log form ──────────────────────────────
  const { delta: previewDelta } = calculateScoreDelta({
    completed, distractions, studiedOnTime, plannedToStudy,
  });

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 52, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Header ── */}
        <View style={{ marginBottom: 28 }}>
          <Text style={{ fontSize: 11, color: C.muted, fontWeight: '600', letterSpacing: 1.8, textTransform: 'uppercase', marginBottom: 8, lineHeight: 16 }}>
            {completed ? 'Great work!' : 'Session ended'}
          </Text>
          <Text style={{
            fontSize:    36,
            fontWeight:  '300',
            fontFamily:  Platform.OS === 'ios' ? 'Georgia' : 'serif',
            color:       C.text,
            letterSpacing: 0.2,
            lineHeight:  42,
          }}>
            Session{'\n'}Summary
          </Text>
        </View>

        {/* ── Session info card ── */}
        <View style={{
          flexDirection:   'row',
          alignItems:      'center',
          gap:             14,
          borderRadius:    24,
          padding:         20,
          marginBottom:    24,
          backgroundColor: sBg(subject),
          borderWidth:     0,
          ...Platform.select({
            ios:     { shadowColor: sColor(subject), shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12 },
            android: { elevation: 2 },
          }),
        }}>
          <View style={{ width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: sColor(subject) + '25' }}>
            <Text style={{ fontSize: 26 }}>{SUBJECT_ICONS[subject] || '📌'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 17, fontWeight: '800', color: sColor(subject), letterSpacing: -0.5, marginBottom: 4, lineHeight: 22 }}>
              {subject}
            </Text>
            <Text style={{ fontSize: 13, color: C.muted, fontWeight: '500', letterSpacing: -0.2, lineHeight: 18 }}>
              {formatDuration(durationSeconds)} · {completed ? 'Completed ✓' : `Quit — ${quitReason || 'early'}`}
            </Text>
            {distractions.length > 0 && (
              <Text style={{ fontSize: 11, color: '#f97316', fontWeight: '600', marginTop: 4, lineHeight: 15 }}>
                {distractions.length} distraction{distractions.length > 1 ? 's' : ''}
              </Text>
            )}
          </View>
          <View style={{ alignItems: 'center', gap: 5 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: completed ? '#34d399' : '#f87171' }} />
            <Text style={{ fontSize: 9, fontWeight: '700', color: completed ? '#34d399' : '#f87171', letterSpacing: 0.5 }}>
              {completed ? 'DONE' : 'QUIT'}
            </Text>
          </View>
        </View>

        {/* ── Bento: Mood + Energy ── */}
        <SLabel C={C}>How did it feel?</SLabel>
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>

          {/* Mood card */}
          <View style={{
            flex:            1,
            borderRadius:    24,
            padding:         18,
            backgroundColor: C.card || '#FFFFFF',
            borderWidth:     0,
            ...Platform.select({
              ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 12 },
              android: { elevation: 2 },
            }),
          }}>
            <Text style={{ fontSize: 10, fontWeight: '800', color: C.muted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14, lineHeight: 14 }}>Mood</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
              {MOODS.map((emoji, i) => (
                <ScalePress key={i} onPress={() => setMood(i)}>
                  <View style={{
                    width:           40,
                    height:          40,
                    borderRadius:    12,
                    backgroundColor: mood === i ? C.blueSoft : C.bgRaised,
                    alignItems:      'center',
                    justifyContent:  'center',
                    ...softShadow(),
                  }}>
                    <Text style={{ fontSize: 20, opacity: mood === i ? 1 : 0.35 }}>{emoji}</Text>
                  </View>
                </ScalePress>
              ))}
            </View>
          </View>

          {/* Energy card */}
          <View style={{
            flex:            1,
            borderRadius:    24,
            padding:         18,
            backgroundColor: C.card || '#FFFFFF',
            borderWidth:     0,
            ...Platform.select({
              ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 12 },
              android: { elevation: 2 },
            }),
          }}>
            <Text style={{ fontSize: 10, fontWeight: '800', color: C.muted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14, lineHeight: 14 }}>Energy</Text>
            <View style={{ gap: 8 }}>
              {ENERGY_LEVELS.map(lvl => {
                const ec  = energyColor(lvl);
                const isOn = energy === lvl;
                return (
                  <ScalePress key={lvl} onPress={() => setEnergy(lvl)}>
                    <View style={{
                      paddingVertical:  11,
                      borderRadius:     14,
                      backgroundColor:  isOn ? ec + '18' : C.bgRaised,
                      alignItems:       'center',
                      flexDirection:    'row',
                      justifyContent:   'center',
                      gap:              7,
                      ...softShadow(ec),
                    }}>
                      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: isOn ? ec : C.border }} />
                      <Text style={{ fontSize: 12, fontWeight: '700', color: isOn ? ec : C.muted, letterSpacing: -0.2 }}>{lvl}</Text>
                    </View>
                  </ScalePress>
                );
              })}
            </View>
          </View>
        </View>

        {/* ── Difficulty ── */}
        <View style={{ marginBottom: 24 }}>
          <SLabel C={C}>Difficulty</SLabel>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[1,2,3,4,5].map(n => (
              <ScalePress key={n} onPress={() => setDifficulty(n)} style={{ flex: 1 }}>
                <View style={{
                  height:          52,
                  borderRadius:    16,
                  backgroundColor: n <= difficulty ? C.blueSoft : C.card,
                  alignItems:      'center',
                  justifyContent:  'center',
                  borderWidth:     0,
                  ...Platform.select({
                    ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8 },
                    android: { elevation: 1 },
                  }),
                }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: n <= difficulty ? C.blueDark : C.muted }}>
                    {n}
                  </Text>
                </View>
              </ScalePress>
            ))}
          </View>
          <Text style={{ fontSize: 11, color: C.muted, textAlign: 'center', marginTop: 8, letterSpacing: -0.2, lineHeight: 15 }}>
            {['', 'Very Easy', 'Easy', 'Medium', 'Hard', 'Very Hard'][difficulty]}
          </Text>
        </View>

        {/* ── Notes — soft tinted, no border ── */}
        <View style={{ marginBottom: 24 }}>
          <SLabel C={C}>Reflection</SLabel>
          <View style={{
            backgroundColor:  '#FDFAF4',
            borderRadius:     20,
            paddingHorizontal: 18,
            paddingTop:       16,
            paddingBottom:    12,
            minHeight:        120,
            ...Platform.select({
              ios:     { shadowColor: '#d4a017', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12 },
              android: { elevation: 2 },
            }),
          }}>
            <TextInput
              style={{
                fontSize:      15,
                color:         '#1a1a1a',
                lineHeight:    23,
                letterSpacing: -0.2,
                minHeight:     80,
                fontWeight:    '400',
              }}
              placeholder="Any reflections on this session..."
              placeholderTextColor="#c8c0b0"
              value={notes}
              onChangeText={setNotes}
              multiline
              maxLength={200}
              textAlignVertical="top"
              selectionColor="#d4a017"
            />
            <Text style={{
              fontSize:      10,
              color:         notes.length > 180 ? '#d4a017' : '#c8c0b0',
              textAlign:     'right',
              marginTop:     6,
              letterSpacing: 0.4,
              fontWeight:    '500',
            }}>
              {notes.length}/200
            </Text>
          </View>
        </View>

        {/* ── Score preview ── */}
        <View style={{
          backgroundColor: previewDelta >= 0 ? 'rgba(52,211,153,0.07)' : 'rgba(248,113,113,0.07)',
          borderRadius:    24,
          padding:         20,
          marginBottom:    8,
          borderWidth:     0,
          ...Platform.select({
            ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 10 },
            android: { elevation: 1 },
          }),
        }}>
          <Text style={{ fontSize: 10, fontWeight: '700', color: C.muted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8, lineHeight: 14 }}>
            Score Impact
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Text style={{ fontSize: 32, fontWeight: '900', color: previewDelta >= 0 ? '#34d399' : '#f87171', letterSpacing: -1 }}>
              {previewDelta >= 0 ? '+' : ''}{previewDelta}
            </Text>
            <Text style={{ fontSize: 13, color: C.muted, letterSpacing: -0.2, lineHeight: 18 }}>
              points this session
            </Text>
          </View>
        </View>

      </ScrollView>

      {/* ── Floating save pill ── */}
      <View style={{
        position:          'absolute',
        bottom:            0,
        left:              0,
        right:             0,
        paddingHorizontal: 16,
        paddingBottom:     Platform.OS === 'ios' ? 44 : 24,
        paddingTop:        12,
        backgroundColor:   C.bg + 'F5',
      }}>
        <ScalePress onPress={handleSave} disabled={saving}>
          <LinearGradient
            colors={saving ? ['#ccc', '#bbb'] : ['#f5c842', '#d4a017']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={{
              height:         58,
              borderRadius:   29,
              alignItems:     'center',
              justifyContent: 'center',
              ...Platform.select({
                ios:     { shadowColor: '#f5c842', shadowOffset: { width: 0, height: 8 }, shadowOpacity: saving ? 0 : 0.35, shadowRadius: 18 },
                android: { elevation: saving ? 2 : 8 },
              }),
            }}
          >
            {saving
              ? <ActivityIndicator color="#1a0f00" size="small" />
              : <Text style={{ fontSize: 16, fontWeight: '700', color: '#1a0f00', letterSpacing: 0.3, fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif' }}>
                  Save Session ✓
                </Text>
            }
          </LinearGradient>
        </ScalePress>
      </View>
    </View>
  );
}