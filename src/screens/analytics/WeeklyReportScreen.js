// src/screens/analytics/WeeklyReportScreen.js
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { View, Text, ScrollView, Animated, Image, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView }        from 'react-native-safe-area-context';
import { LinearGradient }  from 'expo-linear-gradient';
import Svg, { Circle }     from 'react-native-svg';
import { useTheme }        from '../../context/ThemeContext';
import { useSession }      from '../../context/sessionContext';
import { useAuth }         from '../../hooks/useAuth';
import { SUBJECT_ICONS, sColor, sBg } from '../../themes';
import { Avatar }          from '../../components';

const MIN_SESSIONS = 1;

// ── Avatar source ──────────────────────────────────────────────
function getAvatarSource(avatarId) {
  const map = {
    boy1:  require('../../../assets/boy1.jpg'),
    boy2:  require('../../../assets/boy2.jpg'),
    boy3:  require('../../../assets/boy3.jpg'),
    girl1: require('../../../assets/girl1.jpg'),
    girl2: require('../../../assets/girl2.jpg'),
    girl3: require('../../../assets/girl3.jpg'),
    girl4: require('../../../assets/girl4.jpg'),
  };
  return avatarId && map[avatarId] ? map[avatarId] : null;
}

// ── Animated CircleGauge ───────────────────────────────────────
// FIX: was two separate Svg elements causing flicker; merged into one.
// FIX: gauge now animates on mount using Animated spring.
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function CircleGauge({ value = 0, size = 80, color, label, C }) {
  const anim    = useRef(new Animated.Value(0)).current;
  const radius  = (size - 14) / 2;
  const circumf = 2 * Math.PI * radius;
  const clamped = Math.min(Math.max(value, 0), 100);

  const dashOffset = anim.interpolate({
    inputRange:  [0, 100],
    outputRange: [circumf, circumf - (clamped / 100) * circumf],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    Animated.spring(anim, {
      toValue: clamped, useNativeDriver: false,
      tension: 40, friction: 8, delay: 300,
    }).start();
  }, [clamped]);

  return (
    <View style={{ alignItems: 'center', gap: 6 }}>
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={size} height={size} style={{ position: 'absolute' }}>
          {/* Track ring */}
          <Circle
            cx={size / 2} cy={size / 2} r={radius}
            stroke={C.border} strokeWidth={7} fill="none"
          />
          {/* Animated fill ring */}
          <AnimatedCircle
            cx={size / 2} cy={size / 2} r={radius}
            stroke={clamped > 0 ? color : C.border}
            strokeWidth={7} fill="none"
            strokeDasharray={circumf}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            rotation="-90"
            origin={`${size / 2}, ${size / 2}`}
          />
        </Svg>
        {/* Center value */}
        <Text style={{ fontSize: size * 0.20, fontWeight: '800', color: clamped > 0 ? C.text : C.muted }}>
          {clamped}%
        </Text>
      </View>
      {label ? (
        <Text style={{ fontSize: 10, fontWeight: '600', color: C.muted, textAlign: 'center', maxWidth: size + 10, lineHeight: 14 }} numberOfLines={2}>
          {label}
        </Text>
      ) : null}
    </View>
  );
}

// ── Typewriter ─────────────────────────────────────────────────
function Typewriter({ text, style, speed = 25 }) {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    setDisplayed('');
    let i = 0;
    const t = setInterval(() => {
      if (i < text.length) { setDisplayed(text.slice(0, i + 1)); i++; }
      else clearInterval(t);
    }, speed);
    return () => clearInterval(t);
  }, [text, speed]);
  return <Text style={style}>{displayed}</Text>;
}

// ── Pulse wrapper ──────────────────────────────────────────────
function PulseView({ children }) {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1.06, duration: 900, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1,    duration: 900, useNativeDriver: true }),
    ])).start();
  }, []);
  return <Animated.View style={{ transform: [{ scale: pulse }] }}>{children}</Animated.View>;
}

// ── Glass card ─────────────────────────────────────────────────
function GlassCard({ children, color }) {
  return (
    <View style={{ borderRadius: 16, borderWidth: 1, borderColor: color + '40', backgroundColor: color + '12', padding: 16, marginBottom: 10 }}>
      {children}
    </View>
  );
}

// ── Subject row ────────────────────────────────────────────────
// FIX: reads durationSeconds first, falls back to duration (minutes)
function SubjectRow({ subject, sessions, C }) {
  const completed = sessions.filter(s => s.completed).length;
  const totalMins = sessions.reduce((a, s) =>
    a + (s.durationSeconds != null ? Math.floor(s.durationSeconds / 60) : (s.duration ?? 0)), 0);
  const score = sessions.length > 0 ? Math.round((completed / sessions.length) * 100) : 0;
  const color = sColor(subject);
  const icon  = SUBJECT_ICONS?.[subject] || '📌';
  return (
    <View style={{ flexDirection: 'row', gap: 12, marginBottom: 14 }}>
      <View style={{ width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0, backgroundColor: sBg(subject) }}>
        <Text style={{ fontSize: 18 }}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: C.text, letterSpacing: -0.3 }}>{subject}</Text>
          <Text style={{ fontSize: 14, fontWeight: '800', color }}>{score}%</Text>
        </View>
        <View style={{ height: 5, borderRadius: 3, backgroundColor: C.border, overflow: 'hidden' }}>
          <View style={{ width: `${score}%`, height: '100%', backgroundColor: color, borderRadius: 3 }} />
        </View>
        <Text style={{ fontSize: 11, color: C.muted, marginTop: 5, lineHeight: 16 }}>
          {Math.floor(totalMins / 60)}h {totalMins % 60}m · {sessions.length} session{sessions.length !== 1 ? 's' : ''}
        </Text>
      </View>
    </View>
  );
}

// ── Generate insight ───────────────────────────────────────────
// FIX: consistent duration reading with durationSeconds fallback
function generateInsight(sessions = []) {
  const completed   = sessions.filter(s => s.completed);
  const completePct = sessions.length > 0
    ? Math.round((completed.length / sessions.length) * 100) : 0;
  const totalMins   = sessions.reduce((a, s) =>
    a + (s.durationSeconds != null ? Math.floor(s.durationSeconds / 60) : (s.duration ?? 0)), 0);
  const distrTotal  = sessions.reduce((a, s) => a + (s.distractions?.length || 0), 0);
  const consistency = completePct >= 75 ? 'consistent' : completePct >= 50 ? 'moderately consistent' : 'inconsistent';
  const distracted  = distrTotal === 0 ? 'highly focused' : distrTotal <= 3 ? 'occasionally distracted' : 'frequently distracted';
  return {
    summary: sessions.length === 0
      ? 'No valid sessions yet this week.'
      : `You are ${consistency} this week with ${completePct}% completion.`,
    detail: sessions.length === 0
      ? 'Complete at least 1 minute per session to build your report.'
      : `You were ${distracted} across ${sessions.length} sessions, totaling ${Math.floor(totalMins / 60)}h ${totalMins % 60}m of focus time.`,
    completePct,
    totalMins,
  };
}

// ── Focus consistency ──────────────────────────────────────────
function calcFocusConsistency(sessions) {
  // Focus Consistency = how often you completed sessions WITHOUT distractions.
  // This is more meaningful than duration variance which gives false 100%
  // when sessions happen to be the same length.
  // Formula: (completed sessions with 0 distractions) / (all completed) * 100
  const completed = sessions.filter(s => s.completed);
  if (completed.length < 2) return 0;
  const cleanSessions = completed.filter(s => !s.distractions?.length);
  return Math.round((cleanSessions.length / completed.length) * 100);
}

// ══════════════════════════════════════════════════════════════════
//  MAIN SCREEN
// ══════════════════════════════════════════════════════════════════
export default function WeeklyReportScreen() {
  const { C, dark }                                        = useTheme();
  const { sessions: rawSessions, stats, loading: sessionsLoading } = useSession();
  const auth                                       = useAuth?.() || {};
  const userData                                   = auth.userData || null;

  const sessions = rawSessions || [];

  const name         = userData?.name || 'Student';
  const score        = userData?.score ?? userData?.disciplineScore ?? 0;
  const avatarId     = userData?.avatarId || null;
  const customAvatar = userData?.customAvatar || null;
  const avatarSource = customAvatar ? { uri: customAvatar } : getAvatarSource(avatarId);
  const weekNumber   = Math.ceil(new Date().getDate() / 7);
  const monthName    = new Date().toLocaleString('default', { month: 'long' });

  // Use stats from context — single source of truth
  // totalCount = all sessions (gate for unlock bar)
  // totalMinutes = shared with Home/Profile progress bars
  const allSessions = sessions;
  const { totalCount, totalMinutes: sharedTotalMins } = stats;

  const insight          = useMemo(() => generateInsight(allSessions), [allSessions]);
  const completedCount   = allSessions.filter(s => s.completed).length;
  const completePct      = insight.completePct;
  const noDistractionPct = allSessions.length > 0
    ? Math.round((allSessions.filter(s => !s.distractions?.length).length / allSessions.length) * 100)
    : 0;
  const focusConsistency = useMemo(() => calcFocusConsistency(allSessions), [allSessions]);

  const subjectGroups = useMemo(() => {
    const g = {};
    allSessions.forEach(s => { if (!g[s.subject]) g[s.subject] = []; g[s.subject].push(s); });
    return g;
  }, [allSessions]);

  // Unlock gate uses totalCount (same as History screen counts)
  const sessionsRemaining = Math.max(0, MIN_SESSIONS - totalCount);
  const hasEnoughData     = !sessionsLoading && totalCount >= MIN_SESSIONS;

  // FIX: RECS inside useMemo so C values are always current
  const RECS = useMemo(() => [
    { n: '01', title: 'Shorten Late-Night Sessions', text: 'Reduce sessions to 25 min after 10PM. Focus drops significantly.', color: C.blue,   pts: '+8 pts'  },
    { n: '02', title: 'Fix Overthinking',            text: 'Write 3 tasks before starting. Clears mental clutter 40%.',       color: C.red,    pts: '+12 pts' },
    { n: '03', title: 'Protect High-Energy Days',    text: 'When energy is High, tackle your hardest subject first.',         color: C.green,  pts: '+10 pts' },
    { n: '04', title: 'Rest After Intense Days',     text: 'Schedule lighter sessions after 2h+ study days.',                color: C.yellow, pts: '+6 pts'  },
  ], [C]);

  // FIX: card style inside component so C is always live
  const card = {
    backgroundColor: C.card, borderRadius: 20, padding: 20, marginBottom: 16,
    shadowColor: C.shadow, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 10, elevation: 2,
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: dark ? C.bg : '#F5F0E8' }} edges={['top']}>

    {/* ── Screen background — cream matching Home screen ── */}
    {!dark && (
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#F5F0E8' }} />
    )}

    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >

      {/* ── Profile-style mesh gradient header ── */}
      <LinearGradient
        colors={['#F5A623', '#A8D8A8', '#C3A8D8', '#87CEEB']}
        locations={[0, 0.35, 0.7, 1]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={{ paddingTop: 28, paddingBottom: 32, paddingHorizontal: 20, marginBottom: -16 }}
      >
        <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 }}>
          Week {weekNumber} · {monthName}
        </Text>
        <Text style={{ fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: -0.8 }}>
          Weekly Report
        </Text>
      </LinearGradient>

      {/* Content area with horizontal padding */}
      <View style={{ paddingHorizontal: 20, paddingTop: 28, paddingBottom: 20 }}>

      {/* ── LOADING STATE ────────────────────────────────────── */}
      {sessionsLoading && (
        <View style={{ alignItems: 'center', paddingVertical: 80, gap: 16 }}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={{ fontSize: 13, color: C.muted, letterSpacing: -0.2 }}>
            Loading your sessions…
          </Text>
        </View>
      )}

      {/* ── LOCKED STATE ─────────────────────────────────────── */}
      {!sessionsLoading && !hasEnoughData && (
        <View>

          {/* ── Main analysis card — soft white bento-style ── */}
          <View style={{
            borderRadius:    24,
            overflow:        'hidden',
            marginBottom:    16,
            backgroundColor: dark ? C.card : '#FFFFFF',
            borderWidth:     1,
            borderColor:     dark ? C.border : 'rgba(0,0,0,0.06)',
            ...Platform.select({
              ios: {
                shadowColor:   '#10B981',
                shadowOffset:  { width: 0, height: 4 },
                shadowOpacity: 0.10,
                shadowRadius:  16,
              },
              android: { elevation: 4 },
            }),
          }}>

            {/* Soft green top accent — matches 'Hours' stat color */}
            <LinearGradient
              colors={['#10B981', '#34D399', '#6EE7B7']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={{ height: 4, width: '100%' }}
            />

            <View style={{ alignItems: 'center', paddingHorizontal: 28, paddingTop: 28, paddingBottom: 28 }}>

              {/* Avatar with soft green ring */}
              <View style={{
                marginBottom: 14,
                ...Platform.select({
                  ios: { shadowColor: '#10B981', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 10 },
                  android: { elevation: 3 },
                }),
              }}>
                {avatarSource
                  ? <Image source={avatarSource} style={{ width: 64, height: 64, borderRadius: 32, borderWidth: 2.5, borderColor: '#10B981' }} />
                  : <Avatar name={name} size={64} />
                }
              </View>

              {/* ── Greeting — charcoal for light bg readability (Fix 5) ── */}
              <View style={{ alignItems: 'center', marginBottom: 20 }}>
                <Text style={{
                  fontSize:      9,
                  fontWeight:    '800',
                  letterSpacing: 3,
                  textTransform: 'uppercase',
                  color:         '#10B981',
                  marginBottom:  6,
                }}>
                  🌱 MIRRORMIND CALIBRATING
                </Text>
                <Text style={{
                  fontSize:      20,
                  fontWeight:    '800',
                  color:         dark ? C.text : '#1C1917',
                  textAlign:     'center',
                  letterSpacing: -0.5,
                  lineHeight:    28,
                }}>
                  Awaiting Data,{'\n'}{name}...
                </Text>
              </View>

              {/* Seedling icon — replaces lock, matches nature rank theme (Fix 3) */}
              <View style={{
                width:           54,
                height:          54,
                borderRadius:    27,
                alignItems:      'center',
                justifyContent:  'center',
                marginBottom:    14,
                backgroundColor: 'rgba(16,185,129,0.12)',
                borderWidth:     1.5,
                borderColor:     'rgba(16,185,129,0.35)',
              }}>
                <Text style={{ fontSize: 26 }}>🌱</Text>
              </View>

              <Text style={{
                fontSize:      15,
                fontWeight:    '800',
                color:         dark ? C.text : '#1C1917',
                textAlign:     'center',
                marginBottom:  6,
                letterSpacing: -0.3,
              }}>
                Analysis Locked
              </Text>
              <Text style={{ fontSize: 13, color: C.muted, textAlign: 'center', lineHeight: 20, marginBottom: 22 }}>
                Complete{' '}
                <Text style={{ fontWeight: '800', color: '#10B981' }}>
                  {sessionsRemaining} more session{sessionsRemaining !== 1 ? 's' : ''}
                </Text>
                {' '}to unlock your weekly analysis.
              </Text>

              {/* ── Soft-green growth progress bar (Fix 3) ── */}
              <View style={{ width: '100%', marginBottom: 14 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ fontSize: 11, color: C.muted, fontWeight: '600' }}>
                    {totalCount} / {MIN_SESSIONS} sessions
                  </Text>
                  <Text style={{
                    fontSize:   11,
                    fontWeight: '800',
                    color:      totalCount > 0 ? '#10B981' : C.muted,
                  }}>
                    {Math.round((totalCount / MIN_SESSIONS) * 100)}%
                  </Text>
                </View>
                {/* Track */}
                <View style={{
                  height:          8,
                  backgroundColor: 'rgba(16,185,129,0.12)',
                  borderRadius:    4,
                  overflow:        'hidden',
                }}>
                  {totalCount > 0 && (
                    <LinearGradient
                      colors={['#10B981', '#34D399']}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={{
                        width:        `${Math.min((totalCount / MIN_SESSIONS) * 100, 100)}%`,
                        height:       '100%',
                        borderRadius: 4,
                        ...Platform.select({
                          ios: { shadowColor: '#10B981', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 6 },
                        }),
                      }}
                    />
                  )}
                </View>
              </View>

              <Text style={{ fontSize: 11, color: C.muted, textAlign: 'center', fontStyle: 'italic', lineHeight: 16, marginBottom: 4 }}>
                Unlock to see which time of day you are most productive.
              </Text>
              <Text style={{
                fontSize:   11,
                fontWeight: '700',
                color:      '#10B981',
                textAlign:  'center',
              }}>
                {sessionsRemaining === 0 ? '🌸 Unlocking...' : `🌱 ${sessionsRemaining} more to go`}
              </Text>
            </View>
          </View>

          {/* ── What you'll unlock — bento-box micro-cards (Fix 4) ── */}
          <View style={{
            backgroundColor: dark ? C.card : '#FFFFFF',
            borderRadius:    20,
            padding:         18,
            marginBottom:    12,
            borderWidth:     1,
            borderColor:     dark ? C.border : 'rgba(0,0,0,0.06)',
            ...Platform.select({
              ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 10 },
              android: { elevation: 2 },
            }),
          }}>
            <Text style={{ fontSize: 14, fontWeight: '800', color: dark ? C.text : '#1C1917', marginBottom: 14, letterSpacing: -0.3 }}>
              What you'll unlock 🚀
            </Text>
            {[
              { icon: '📊', label: 'Performance Scores',   desc: 'Discipline, Stability, Focus gauges',       color: '#10B981' },
              { icon: '🧠', label: 'AI Pattern Detection', desc: 'Personalized study insights',               color: '#3B82F6' },
              { icon: '📈', label: 'Subject Breakdown',    desc: 'Time & score per subject',                  color: '#F59E0B' },
              { icon: '🎯', label: 'Weekly Target',        desc: 'Goal tracking with gradient progress bar',  color: '#EC4899' },
            ].map((item, i, arr) => (
              <View key={i} style={{
                flexDirection:     'row',
                alignItems:        'center',
                gap:               12,
                marginBottom:      i < arr.length - 1 ? 8 : 0,
                paddingVertical:   12,
                paddingHorizontal: 14,
                borderRadius:      16,
                borderWidth:       1,
                borderColor:       dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
                backgroundColor:   dark ? 'rgba(255,255,255,0.03)' : '#FAFAF9',
                ...Platform.select({
                  ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
                  android: { elevation: 1 },
                }),
              }}>
                {/* Fix 5: exact 40×40 — all icons uniformly sized */}
                <View style={{
                  width:           40,
                  height:          40,
                  borderRadius:    12,
                  alignItems:      'center',
                  justifyContent:  'center',
                  flexShrink:      0,
                  backgroundColor: item.color + '18',
                }}>
                  <Text style={{ fontSize: 18, lineHeight: 22, textAlign: 'center' }}>{item.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize:      13,
                    fontWeight:    '700',
                    color:         dark ? 'rgba(255,255,255,0.60)' : 'rgba(28,25,23,0.65)',
                    letterSpacing: -0.2,
                  }}>
                    {item.label}
                  </Text>
                  <Text style={{
                    fontSize:   11,
                    color:      dark ? 'rgba(255,255,255,0.35)' : 'rgba(28,25,23,0.42)',
                    lineHeight: 16,
                    marginTop:  2,
                  }}>
                    {item.desc}
                  </Text>
                </View>
                {/* Fix 3: flower bud replaces lock icon */}
                <Text style={{ fontSize: 14, flexShrink: 0, opacity: 0.5 }}>🌸</Text>
              </View>
            ))}
          </View>

          {/* Tips */}
          <View style={{
            backgroundColor: dark ? C.card : '#FFFFFF',
            borderRadius:    20,
            padding:         18,
            marginBottom:    12,
            borderWidth:     1,
            borderColor:     dark ? C.border : 'rgba(0,0,0,0.06)',
            ...Platform.select({
              ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 10 },
              android: { elevation: 2 },
            }),
          }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: dark ? C.text : '#1C1917', marginBottom: 14 }}>Tips to get started 💡</Text>
            {[
              'Start with a 25-minute session today',
              'Log how you feel after each session',
              'Try to complete sessions without distractions',
            ].map((tip, i, arr) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: i < arr.length - 1 ? 12 : 0 }}>
                <View style={{
                  width: 22, height: 22, borderRadius: 11,
                  backgroundColor: 'rgba(16,185,129,0.15)',
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
                }}>
                  <Text style={{ fontSize: 10, fontWeight: '800', color: '#10B981' }}>{i + 1}</Text>
                </View>
                <Text style={{ flex: 1, fontSize: 13, color: C.muted, lineHeight: 19 }}>{tip}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* ── FULL REPORT ─────────────────────────────────────── */}
      {!sessionsLoading && hasEnoughData && (
        <View>

          {/* System Analysis */}
          <LinearGradient
            colors={['#1a1a2e', '#16213e', '#0f3460']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={{ borderRadius: 24, padding: 22, marginBottom: 16 }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <PulseView>
                <View style={{ backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 6, paddingVertical: 4, paddingHorizontal: 10 }}>
                  <Text style={{ fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.8)', letterSpacing: 1.5 }}>● SYSTEM ANALYSIS</Text>
                </View>
              </PulseView>
              <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: '600' }}>Week {weekNumber}</Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              {avatarSource
                ? <Image source={avatarSource} style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' }} />
                : <Avatar name={name} size={44} />
              }
              <View>
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: -0.3 }}>{name}</Text>
                <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{userData?.education || 'Student'}</Text>
              </View>
            </View>

            <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginBottom: 16 }} />

            <Typewriter
              text={`"${insight.summary}"`}
              style={{ fontSize: 15, fontWeight: '700', color: '#fff', lineHeight: 22, marginBottom: 8, fontStyle: 'italic' }}
              speed={25}
            />
            <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 20, marginBottom: 20 }}>
              {insight.detail}
            </Text>

            <View style={{ flexDirection: 'row', justifyContent: 'space-around', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', paddingTop: 16 }}>
              {[
                { val: `${completePct}%`,                                                    lbl: 'Completion' },
                { val: sharedTotalMins < 60 ? `${sharedTotalMins}m` : `${Math.floor(sharedTotalMins / 60)}h ${sharedTotalMins % 60}m`, lbl: 'Focus Time' },
                { val: `${score}/100`,                                                       lbl: 'Score'      },
              ].map(s => (
                <View key={s.lbl} style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 17, fontWeight: '800', color: '#fff', letterSpacing: -0.5 }}>{s.val}</Text>
                  <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{s.lbl}</Text>
                </View>
              ))}
            </View>
          </LinearGradient>

          {/* Performance gauges */}
          <View style={card}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 20 }}>Performance Scores</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', flexWrap: 'wrap', gap: 20 }}>
              <CircleGauge value={score}            color={C.blue}   label={'Discipline\nScore'}  C={C} size={82} />
              <CircleGauge value={completePct}      color={C.green}  label={'Completion\nRate'}   C={C} size={82} />
              <CircleGauge value={focusConsistency} color={C.purple} label={'Focus\nConsistency'} C={C} size={82} />
              <CircleGauge value={noDistractionPct} color={C.yellow} label={'Zero\nDistraction'}  C={C} size={82} />
            </View>
            {focusConsistency === 0 && completedCount < 2 && (
              <View style={{ marginTop: 16, backgroundColor: C.bgRaised, borderRadius: 12, padding: 12 }}>
                <Text style={{ fontSize: 11, color: C.muted, textAlign: 'center', lineHeight: 16 }}>
                  📊 Complete{' '}
                  <Text style={{ fontWeight: '700', color: C.text }}>
                    {Math.max(0, 2 - completedCount)} more completed session{2 - completedCount !== 1 ? 's' : ''}
                  </Text>
                  {' '}to unlock Focus Consistency
                </Text>
              </View>
            )}
          </View>

          {/* Subject breakdown */}
          {Object.keys(subjectGroups).length > 0 && (
            <View style={card}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 14 }}>Subject Performance</Text>
              {Object.entries(subjectGroups).map(([subj, sess], i, arr) => (
                <View key={subj}>
                  <SubjectRow subject={subj} sessions={sess} C={C} />
                  {i < arr.length - 1 && <View style={{ height: 1, backgroundColor: C.border, marginBottom: 14 }} />}
                </View>
              ))}
            </View>
          )}

          {/* Recommendations */}
          <Text style={{ fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 14 }}>
            Recommendations for Next Week
          </Text>
          {RECS.map(r => (
            <GlassCard key={r.n} color={r.color}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: r.color + '30', borderWidth: 1, borderColor: r.color + '60', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Text style={{ fontSize: 10, fontWeight: '800', color: r.color }}>{r.n}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: r.color, flex: 1 }}>{r.title}</Text>
                    <View style={{ backgroundColor: r.color + '20', borderRadius: 8, paddingVertical: 2, paddingHorizontal: 7, borderWidth: 1, borderColor: r.color + '40' }}>
                      <Text style={{ fontSize: 10, fontWeight: '800', color: r.color }}>{r.pts}</Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 12, color: C.muted, lineHeight: 17 }}>{r.text}</Text>
                </View>
              </View>
            </GlassCard>
          ))}

          {/* Target card */}
          <LinearGradient
            colors={[C.text, '#2d3748']}
            style={{ borderRadius: 24, padding: 22, marginBottom: 20 }}
          >
            <Text style={{ fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.4)', letterSpacing: 2, marginBottom: 6 }}>
              TARGET FOR NEXT WEEK
            </Text>
            <Text style={{ fontSize: 42, fontWeight: '900', color: '#fff', letterSpacing: -2, marginBottom: 4 }}>
              Reach Score <Text style={{ color: C.blue }}>80</Text>
            </Text>
            <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 20, marginBottom: 20 }}>
              You need +{Math.max(0, 80 - score)} more points.{'\n'}
              Complete 5 sessions without quitting early.
            </Text>
            <View style={{ height: 10, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 5, overflow: 'hidden', marginBottom: 8 }}>
              <LinearGradient
                colors={[C.blue, C.mint]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{ width: `${Math.min(score, 100)}%`, height: '100%', borderRadius: 5 }}
              />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: '600' }}>Current: {score}</Text>
              <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: '600' }}>Target: 80</Text>
            </View>
          </LinearGradient>

        </View>
      )}

      </View>{/* end paddingHorizontal wrapper */}
    </ScrollView>
    </SafeAreaView>
  );
}