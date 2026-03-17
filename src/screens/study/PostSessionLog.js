// PostSessionLog.jsx
import React, { useState, useRef, useEffect } from 'react'; // FIX 2: restored useEffect
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

// FIX 1: DifficultyTile moved OUT of JSX, back to module scope
function DifficultyTile({ n, isSelected, bgColor, textColor, shadowColor, onPress }) {
  const scale = useRef(new Animated.Value(isSelected ? 1.1 : 1)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue:         isSelected ? 1.1 : 1,
      useNativeDriver: true,
      tension:         300,
      friction:        15,
    }).start();
  }, [isSelected, scale]);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Animated.View style={{
        width:           52,
        height:          52,
        borderRadius:    26,
        backgroundColor: bgColor,
        alignItems:      'center',
        justifyContent:  'center',
        transform:       [{ scale }],
        ...Platform.select({
          ios: {
            shadowColor:   shadowColor,
            shadowOffset:  { width: 0, height: isSelected ? 6 : 0 },
            shadowOpacity: isSelected ? 0.4 : 0,
            shadowRadius:  isSelected ? 12 : 0,
          },
          android: { elevation: isSelected ? 6 : 1 },
        }),
      }}>
        <Text style={{
          fontSize:      18,
          fontWeight:    '800',
          color:         textColor,
          letterSpacing: -0.5,
        }}>
          {n}
        </Text>
      </Animated.View>
    </TouchableOpacity>
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

// ── Shadow helper ─────────────────────────
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
    plannedMinutes  = 25,
    completed       = false,
    quitReason      = null,
    distractions    = [],
    startTime       = new Date().toISOString(),
    studiedOnTime   = false,
    plannedToStudy  = false,
    currentScore    = userData?.score ?? 0,
  } = route?.params || {};

  // FIX 3: derive from durationSeconds, don't trust param
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

  // Use real elapsed seconds — even 1s or 5s is valid to save.
  // safeDuration keeps 0 from being stored (a true 0s session means nothing ran).
  const safeDuration   = Math.max(durationSeconds, 1);
  const isShortSession = durationSeconds < MIN_VALID_SECONDS;   // < 60s — history only, no score

  const { delta: previewDelta } = calculateScoreDelta({
    completed, distractions, studiedOnTime, plannedToStudy,
    durationSeconds: safeDuration,
  });

  const handleSave = async () => {
    if (!user?.uid) { Alert.alert('Not signed in'); return; }
    if (saving) return; // FIX 4: duplicate save guard
    setSaving(true);
    try {
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
        durationSeconds: safeDuration,
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
    const isShort     = isShortSession;
    const isPositive  = result.delta >= 0;
    const accentColor = isShort ? '#94a3b8' : isPositive ? '#34d399' : '#f87171';
    const accentGlow  = isShort ? 'rgba(148,163,184,0.10)' : isPositive ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)';

    return (
      <Animated.View style={{
        flex:              1,
        backgroundColor:   '#0a0a0a',
        paddingHorizontal: 24,
        paddingTop:        Platform.OS === 'ios' ? 80 : 60,
        paddingBottom:     Platform.OS === 'ios' ? 48 : 32,
        opacity:           fadeAnim,
      }}>
        <View style={{
          position:        'absolute',
          width:           320,
          height:          320,
          borderRadius:    160,
          backgroundColor: isShort ? 'rgba(148,163,184,0.05)' : isPositive ? 'rgba(245,200,66,0.07)' : 'rgba(248,113,113,0.07)',
          top:             20,
          alignSelf:       'center',
        }} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between' }}
        >
          <View style={{
            backgroundColor: '#161616',
            borderRadius:    28,
            padding:         28,
            alignItems:      'center',
            marginBottom:    16,
            ...Platform.select({
              ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 20 },
              android: { elevation: 8 },
            }),
          }}>
            <Text style={{ fontSize: 52, marginBottom: 12 }}>{isShort ? '📋' : completed ? '🎉' : '💪'}</Text>

            <Text style={{
              fontSize:      26,
              fontWeight:    '800',
              color:         '#f0ece0',
              letterSpacing: -0.8,
              lineHeight:    32,
              textAlign:     'center',
              marginBottom:  6,
            }}>
              {isShort ? 'Saved to History' : completed ? 'Session Complete!' : 'Session Saved'}
            </Text>
            <Text style={{ fontSize: 13, color: '#555', marginBottom: 28, letterSpacing: 0.2, lineHeight: 18 }}>
              {formatDuration(durationSeconds)} · {subject}
            </Text>

            {/* Score impact block — hidden for short sessions */}
            {isShort ? (
              <View style={{
                flexDirection:     'row',
                alignItems:        'center',
                gap:               14,
                backgroundColor:   'rgba(148,163,184,0.08)',
                borderRadius:      20,
                paddingVertical:   18,
                paddingHorizontal: 24,
                width:             '100%',
                marginBottom:      20,
                borderWidth:       1,
                borderColor:       'rgba(148,163,184,0.15)',
              }}>
                <Text style={{ fontSize: 30 }}>⏱</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#94a3b8', letterSpacing: -0.2, lineHeight: 20 }}>
                    No Score Impact
                  </Text>
                  <Text style={{ fontSize: 11, color: '#555', marginTop: 3, lineHeight: 17 }}>
                    Sessions need 1+ min to count toward your Discipline Score.
                  </Text>
                </View>
              </View>
            ) : (
              <View style={{
                flexDirection:     'row',
                alignItems:        'center',
                gap:               16,
                backgroundColor:   accentGlow,
                borderRadius:      20,
                paddingVertical:   18,
                paddingHorizontal: 24,
                width:             '100%',
                marginBottom:      20,
              }}>
                <Text style={{ fontSize: 52, fontWeight: '900', color: accentColor, letterSpacing: -2, lineHeight: 56 }}>
                  {isPositive ? '+' : ''}{result.delta}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: accentColor, letterSpacing: -0.2, lineHeight: 20 }}>
                    Discipline Score
                  </Text>
                  <Text style={{ fontSize: 12, color: '#555', marginTop: 2, lineHeight: 17 }}>
                    from this session
                  </Text>
                </View>
              </View>
            )}

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
                ios:     { shadowColor: '#f5c842', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.35, shadowRadius: 14 },
                android: { elevation: 4 },
              }),
            }}>
              <Text style={{ fontSize: 7, fontWeight: '800', color: '#555', letterSpacing: 2, textTransform: 'uppercase' }}>Score</Text>
              <Text style={{ fontSize: 30, fontWeight: '900', color: '#f5c842', letterSpacing: -1, lineHeight: 34 }}>
                {result.newScore}
              </Text>
              {result.rank?.title ? (
                <Text style={{ fontSize: 9, color: '#666', letterSpacing: 0.2 }}>{result.rank.title}</Text>
              ) : null}
            </View>

            {result.reasons.length > 0 && (
              <View style={{ gap: 6, alignSelf: 'stretch' }}>
                {result.reasons.map((r, i) => (
                  <View key={i} style={{
                    flexDirection:     'row',
                    alignItems:        'center',
                    gap:               8,
                    paddingVertical:   6,
                    paddingHorizontal: 12,
                    borderRadius:      10,
                    backgroundColor:   r.startsWith('+') ? 'rgba(52,211,153,0.06)' : 'rgba(248,113,113,0.06)',
                  }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: r.startsWith('+') ? '#34d399' : '#f87171' }} />
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

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation?.reset?.({ index: 0, routes: [{ name: 'Tabs' }] })}
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
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#1a0f00', letterSpacing: 0.2 }}>
                Back to Dashboard
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
    );
  }

  // ── Log form ──────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 36, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ marginBottom: 24 }}>
          <Text style={{
            fontSize:      11,
            color:         C.muted,
            fontWeight:    '600',
            letterSpacing: 1.8,
            textTransform: 'uppercase',
            marginBottom:  8,
            lineHeight:    16,
          }}>
            {completed ? 'Great work!' : 'Session ended'}
          </Text>
          <Text style={{
            fontSize:      24,
            fontWeight:    '700',
            color:         C.text,
            letterSpacing: -0.5,
            lineHeight:    30,
          }}>
            Session Summary
          </Text>
        </View>

        <View style={{
          flexDirection:   'row',
          alignItems:      'center',
          gap:             14,
          borderRadius:    24,
          padding:         20,
          marginBottom:    24,
          backgroundColor: sBg(subject),
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

        <SLabel C={C}>How did it feel?</SLabel>
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
          <View style={{
            flex:            1,
            borderRadius:    24,
            padding:         18,
            backgroundColor: C.card || '#FFFFFF',
            ...Platform.select({
              ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 12 },
              android: { elevation: 2 },
            }),
          }}>
            <Text style={{ fontSize: 10, fontWeight: '800', color: C.muted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14, lineHeight: 14 }}>
              Mood
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
              {MOODS.map((emoji, i) => (
                <ScalePress key={i} onPress={() => setMood(i)}>
                  <View style={{
                    width:           40,
                    height:          40,
                    borderRadius:    12,
                    backgroundColor: mood === i ? '#f5c84230' : C.bgRaised,
                    alignItems:      'center',
                    justifyContent:  'center',
                    borderWidth:     mood === i ? 1.5 : 0,
                    borderColor:     '#f5c842',
                    ...softShadow(),
                  }}>
                    <Text style={{ fontSize: 20, opacity: mood === i ? 1 : 0.35 }}>{emoji}</Text>
                  </View>
                </ScalePress>
              ))}
            </View>
          </View>

          <View style={{
            flex:            1,
            borderRadius:    24,
            padding:         18,
            backgroundColor: C.card || '#FFFFFF',
            ...Platform.select({
              ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 12 },
              android: { elevation: 2 },
            }),
          }}>
            <Text style={{ fontSize: 10, fontWeight: '800', color: C.muted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14, lineHeight: 14 }}>
              Energy
            </Text>
            <View style={{ gap: 8 }}>
              {ENERGY_LEVELS.map(lvl => {
                const ec  = energyColor(lvl);
                const isOn = energy === lvl;
                return (
                  <ScalePress key={lvl} onPress={() => setEnergy(lvl)}>
                    <View style={{
                      paddingVertical:  11,
                      borderRadius:     14,
                      backgroundColor:  isOn ? ec + '20' : C.bgRaised,
                      alignItems:       'center',
                      flexDirection:    'row',
                      justifyContent:   'center',
                      gap:              7,
                      borderWidth:      isOn ? 1.5 : 0,
                      borderColor:      ec,
                    }}>
                      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: isOn ? ec : C.border }} />
                      <Text style={{ fontSize: 12, fontWeight: '700', color: isOn ? ec : C.muted, letterSpacing: -0.2 }}>
                        {lvl}
                      </Text>
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

          <View style={{ flexDirection: 'row', marginBottom: 8, paddingHorizontal: 4 }}>
            <Text style={{ flex: 1, fontSize: 9, color: C.muted, textAlign: 'center', letterSpacing: 0.3 }}>Easy</Text>
            <View style={{ flex: 1 }} />
            <View style={{ flex: 1 }} />
            <View style={{ flex: 1 }} />
            <Text style={{ flex: 1, fontSize: 9, color: C.muted, textAlign: 'center', letterSpacing: 0.3 }}>Hard</Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 }}>
            {[1, 2, 3, 4, 5].map(n => {
              const isSelected = n === difficulty;
              const isFilled   = n <= difficulty;

              const bgColor = isSelected
                ? n <= 2 ? '#34d399' : n === 3 ? '#f5c842' : '#f87171'
                : isFilled
                ? n <= 2 ? '#34d39930' : n === 3 ? '#f5c84230' : '#f8717130'
                : C.bgRaised;

              const textColor = isSelected
                ? n === 3 ? '#1a1000' : '#fff'
                : isFilled
                ? n <= 2 ? '#34d399' : n === 3 ? '#C9A84C' : '#f87171'
                : C.muted;

              const shadowColor = isSelected
                ? n <= 2 ? '#34d399' : n === 3 ? '#f5c842' : '#f87171'
                : 'transparent';

              return (
                <DifficultyTile
                  key={n}
                  n={n}
                  isSelected={isSelected}
                  bgColor={bgColor}
                  textColor={textColor}
                  shadowColor={shadowColor}
                  onPress={() => setDifficulty(n)}
                />
              );
            })}
          </View>

          <Text style={{
            fontSize:      11,
            color:         C.muted,
            textAlign:     'center',
            marginTop:     12,
            letterSpacing: -0.2,
            lineHeight:    15,
          }}>
            {['', 'Very Easy', 'Easy', 'Medium', 'Hard', 'Very Hard'][difficulty]}
          </Text>
        </View>

        {/* ── Reflection ── */}
        <View style={{ marginBottom: 24 }}>
          <SLabel C={C}>Reflection</SLabel>
          <View style={{
            backgroundColor:   '#FDFAF4',
            borderRadius:      20,
            paddingHorizontal: 18,
            paddingTop:        16,
            paddingBottom:     12,
            minHeight:         120,
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

        {/* ── Score preview / short-session notice ── */}
        {isShortSession ? (
          <View style={{
            backgroundColor: 'rgba(148,163,184,0.08)',
            borderRadius:    24,
            padding:         20,
            marginBottom:    8,
            borderWidth:     1,
            borderColor:     'rgba(148,163,184,0.18)',
            flexDirection:   'row',
            alignItems:      'center',
            gap:             14,
            ...Platform.select({
              ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 10 },
              android: { elevation: 1 },
            }),
          }}>
            <Text style={{ fontSize: 30 }}>📋</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: C.text, letterSpacing: -0.2, marginBottom: 4 }}>
                Saved to History
              </Text>
              <Text style={{ fontSize: 12, color: C.muted, lineHeight: 17 }}>
                Sessions under 1 minute are recorded but don't affect your Discipline Score. Keep going next time!
              </Text>
            </View>
          </View>
        ) : (
          <View style={{
            backgroundColor: previewDelta >= 0 ? 'rgba(52,211,153,0.07)' : 'rgba(248,113,113,0.07)',
            borderRadius:    24,
            padding:         20,
            marginBottom:    8,
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
        )}

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
              : <Text style={{ fontSize: 16, fontWeight: '700', color: '#1a0f00', letterSpacing: 0.3 }}>Save Session</Text>
            }
          </LinearGradient>
        </ScalePress>
      </View>
    </View>
  );
}