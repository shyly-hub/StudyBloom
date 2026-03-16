import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, Alert,
  Dimensions, Animated, StatusBar, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth }        from '../../hooks/useAuth';
import { SUBJECT_ICONS }  from '../../themes';

const { width, height } = Dimensions.get('window');
const RING_SIZE = width * 0.70;

const MESSAGES = [
  'Stay locked in.',
  'Every minute counts.',
  "You're doing great.",
  'No distractions.',
  'Focus is a skill.',
  'Build the habit.',
  'One session at a time.',
];

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ── Scale press ───────────────────────────
function ScalePress({ onPress, children, style }) {
  const scale = useRef(new Animated.Value(1)).current;
  const down  = () => Animated.spring(scale, { toValue: 0.95, useNativeDriver: true, tension: 400, friction: 20 }).start();
  const up    = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, tension: 300, friction: 15 }).start();
  return (
    <TouchableOpacity onPressIn={down} onPressOut={up} onPress={onPress} activeOpacity={1}>
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </TouchableOpacity>
  );
}

// ── Dark theme constants ──────────────────
const D = {
  bg:       '#121212',
  surface:  '#1e1e1e',
  surface2: '#2a2a2a',
  surface3: '#333333',
  gold:     '#f5c842',
  goldDim:  '#f5c84280',
  goldGlow: 'rgba(245,200,66,0.15)',
  text:     '#f0ece0',
  muted:    '#888',
  subtle:   '#555',
  orange:   '#f97316',
  green:    '#34d399',
};

export default function FocusScreen({ navigation, route }) {
  const auth         = useAuth?.() || {};
  const userData     = auth.userData || null;
  const currentScore = userData?.score ?? 0;

  const {
    subject     = 'Math',
    duration    = 25,
    sessionGoal = '',
  } = route?.params || {};

  const totalSeconds = duration * 60;
  const startTimeRef = useRef(new Date());
  const elapsedRef   = useRef(0);

  const [timeLeft,   setTimeLeft]   = useState(totalSeconds);
  const [isPaused,   setIsPaused]   = useState(false);
  const [distrCount, setDistrCount] = useState(0);
  const [msgIndex,   setMsgIndex]   = useState(0);

  const intervalRef  = useRef(null);
  const distractions = useRef([]);
  const pauseStart   = useRef(null);
  const totalPaused  = useRef(0);

  // Animations — all native driver
  const breatheAnim = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0.4)).current;
  const msgFade     = useRef(new Animated.Value(1)).current;
  const ringPulse   = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Background breathe
    Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, { toValue: 1.12, duration: 4000, useNativeDriver: true }),
        Animated.timing(breatheAnim, { toValue: 1,    duration: 4000, useNativeDriver: true }),
      ])
    ).start();

    // Glow opacity
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacity, { toValue: 0.9, duration: 2500, useNativeDriver: true }),
        Animated.timing(glowOpacity, { toValue: 0.4, duration: 2500, useNativeDriver: true }),
      ])
    ).start();

    // Ring pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(ringPulse, { toValue: 1.02, duration: 1500, useNativeDriver: true }),
        Animated.timing(ringPulse, { toValue: 1,    duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Message fade rotation
  useEffect(() => {
    const t = setInterval(() => {
      Animated.sequence([
        Animated.timing(msgFade, { toValue: 0, duration: 350, useNativeDriver: true }),
        Animated.timing(msgFade, { toValue: 1, duration: 350, useNativeDriver: true }),
      ]).start();
      setMsgIndex(i => (i + 1) % MESSAGES.length);
    }, 6000);
    return () => clearInterval(t);
  }, []);

  // Countdown
  useEffect(() => {
    if (isPaused) {
      clearInterval(intervalRef.current);
      pauseStart.current = Date.now();
      return;
    }
    if (pauseStart.current) {
      totalPaused.current += Math.floor((Date.now() - pauseStart.current) / 1000);
      pauseStart.current   = null;
    }
    intervalRef.current = setInterval(() => {
      setTimeLeft(t => {
        elapsedRef.current = Math.floor((Date.now() - startTimeRef.current) / 1000) - totalPaused.current;
        if (t <= 1) {
          clearInterval(intervalRef.current);
          navigateToPostSession(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [isPaused]);

  const buildParams = (completed, quitReason = null) => ({
    subject,
    durationSeconds: Math.max(elapsedRef.current, 1),
    durationMinutes: Math.max(Math.floor(elapsedRef.current / 60), 0),
    plannedMinutes:  duration,
    completed,
    quitReason,
    distractions:    distractions.current,
    startTime:       startTimeRef.current.toISOString(),
    currentScore,
    studiedOnTime:   false,
    plannedToStudy:  false,
  });

  const navigateToPostSession = (completed, quitReason = null) => {
    clearInterval(intervalRef.current);
    navigation.replace('PostSession', buildParams(completed, quitReason));
  };

  const handleDistraction = () => {
    setIsPaused(true);
    clearInterval(intervalRef.current);
    navigation.navigate('Distraction', {
      onAdd: (distraction) => {
        distractions.current.push(distraction);
        setDistrCount(c => c + 1);
        setIsPaused(false);
      },
    });
  };

  const handleQuit = () => {
    setIsPaused(true);
    clearInterval(intervalRef.current);
    Alert.alert(
      'Quit Session?',
      'This will be saved as an incomplete session.',
      [
        { text: 'Keep Going', style: 'cancel', onPress: () => setIsPaused(false) },
        {
          text: 'Quit', style: 'destructive',
          onPress: () => {
            Alert.alert('Why are you stopping?', '', [
              { text: 'Too Tired',       onPress: () => navigateToPostSession(false, 'Too Tired')       },
              { text: 'Got Bored',       onPress: () => navigateToPostSession(false, 'Got Bored')       },
              { text: 'Urgent Task',     onPress: () => navigateToPostSession(false, 'Urgent Task')     },
              { text: 'Lost Motivation', onPress: () => navigateToPostSession(false, 'Lost Motivation') },
              { text: 'Cancel', style: 'cancel', onPress: () => setIsPaused(false) },
            ]);
          },
        },
      ]
    );
  };

  const progress    = 1 - (timeLeft / totalSeconds);
  const ringDeg     = Math.round(progress * 360);
  const subjectIcon = SUBJECT_ICONS?.[subject] || '📌';

  const elapsedSec = Math.floor((Date.now() - startTimeRef.current) / 1000) - totalPaused.current;
  const elapsedDisplay = elapsedSec < 60
    ? `${elapsedSec}s elapsed`
    : `${Math.floor(elapsedSec / 60)}m ${elapsedSec % 60}s elapsed`;

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={D.bg} />

      {/* ── Background breathing glow ── */}
      <Animated.View style={{
        position:     'absolute',
        top:          height * 0.1,
        left:         width * 0.05,
        width:        width * 0.9,
        height:       width * 0.9,
        borderRadius: width * 0.45,
        transform:    [{ scale: breatheAnim }],
      }}>
        <Animated.View style={{
          flex:            1,
          borderRadius:    width * 0.45,
          backgroundColor: D.goldGlow,
          opacity:         glowOpacity,
        }} />
      </Animated.View>

      {/* ── Top bar ── */}
      <View style={{
        flexDirection:     'row',
        justifyContent:    'space-between',
        alignItems:        'center',
        paddingHorizontal: 20,
        paddingTop:        Platform.OS === 'ios' ? 64 : 48,
        paddingBottom:     8,
      }}>
        {/* Subject */}
        <View style={{
          flexDirection:    'row',
          alignItems:       'center',
          gap:              8,
          borderRadius:     20,
          paddingVertical:  8,
          paddingHorizontal: 14,
          backgroundColor:  D.surface2,
          ...Platform.select({
            ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 10 },
            android: { elevation: 2 },
          }),
        }}>
          <Text style={{ fontSize: 16 }}>{subjectIcon}</Text>
          <Text style={{ fontSize: 13, fontWeight: '700', color: D.text, letterSpacing: -0.3 }}>{subject}</Text>
        </View>

        {/* Duration badge */}
        <View style={{ backgroundColor: D.surface2, borderRadius: 14, paddingVertical: 6, paddingHorizontal: 12 }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: D.muted, letterSpacing: 0.5 }}>{duration} MIN</Text>
        </View>

        {/* Distraction count */}
        {distrCount > 0 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 20, paddingVertical: 6, paddingHorizontal: 12, backgroundColor: 'rgba(249,115,22,0.15)' }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: D.orange }} />
            <Text style={{ fontSize: 12, fontWeight: '700', color: D.orange }}>{distrCount}</Text>
          </View>
        )}
      </View>

      {/* ── Timer — vertically centered ── */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: -20 }}>

        {/* Outer glow */}
        <Animated.View style={{
          position:        'absolute',
          width:           RING_SIZE + 48,
          height:          RING_SIZE + 48,
          borderRadius:    (RING_SIZE + 48) / 2,
          backgroundColor: D.goldGlow,
          opacity:         glowOpacity,
          transform:       [{ scale: breatheAnim }],
        }} />

        {/* Ring */}
        <Animated.View style={{
          width:          RING_SIZE,
          height:         RING_SIZE,
          borderRadius:   RING_SIZE / 2,
          alignItems:     'center',
          justifyContent: 'center',
          transform:      [{ scale: ringPulse }],
        }}>
          {/* Track ring */}
          <View style={{
            position:     'absolute',
            width:        RING_SIZE,
            height:       RING_SIZE,
            borderRadius: RING_SIZE / 2,
            borderWidth:  10,
            borderColor:  D.surface3,
          }} />

          {/* Progress arc */}
          <View style={{
            position:         'absolute',
            width:            RING_SIZE,
            height:           RING_SIZE,
            borderRadius:     RING_SIZE / 2,
            borderWidth:      10,
            borderColor:      'transparent',
            borderTopColor:    ringDeg > 0   ? D.gold : 'transparent',
            borderRightColor:  ringDeg > 90  ? D.gold : 'transparent',
            borderBottomColor: ringDeg > 180 ? D.gold : 'transparent',
            borderLeftColor:   ringDeg > 270 ? D.gold : 'transparent',
            transform:         [{ rotate: '-45deg' }],
          }} />

          {/* Inner content */}
          <View style={{ alignItems: 'center', paddingHorizontal: 20 }}>
            {isPaused && (
              <View style={{ backgroundColor: 'rgba(249,115,22,0.18)', borderRadius: 8, paddingVertical: 4, paddingHorizontal: 14, marginBottom: 10 }}>
                <Text style={{ fontSize: 10, fontWeight: '800', letterSpacing: 2.5, color: D.orange }}>PAUSED</Text>
              </View>
            )}

            {/* Monospace timer */}
            <Text style={{
              fontSize:         58,
              fontWeight:       '700',
              fontFamily:       Platform.OS === 'ios' ? 'Courier New' : 'monospace',
              color:            isPaused ? D.subtle : D.gold,
              letterSpacing:    2,
              textShadowColor:  isPaused ? 'transparent' : 'rgba(245,200,66,0.5)',
              textShadowOffset: { width: 0, height: 0 },
              textShadowRadius: 24,
            }}>
              {formatTime(timeLeft)}
            </Text>

            <Text style={{ fontSize: 10, color: D.subtle, fontWeight: '500', letterSpacing: 2, textTransform: 'uppercase', marginTop: 4 }}>
              remaining
            </Text>

            <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: D.gold + '80' }} />
              <Text style={{ fontSize: 12, color: D.muted, letterSpacing: -0.2 }}>{elapsedDisplay}</Text>
              <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: D.gold + '80' }} />
            </View>

            {/* Progress pill */}
            <View style={{ marginTop: 10, backgroundColor: D.goldGlow, borderRadius: 20, paddingVertical: 4, paddingHorizontal: 14 }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: D.gold, letterSpacing: -0.2 }}>
                {Math.round(progress * 100)}%
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Message */}
        <Animated.View style={{ alignItems: 'center', marginTop: 40, paddingHorizontal: 40, opacity: msgFade }}>
          <Text style={{ fontSize: 15, color: D.subtle, fontStyle: 'italic', textAlign: 'center', letterSpacing: -0.3, lineHeight: 22 }}>
            "{MESSAGES[msgIndex]}"
          </Text>
          {sessionGoal ? (
            <Text style={{ fontSize: 12, color: D.subtle + '80', textAlign: 'center', marginTop: 6 }}>
              Goal: {sessionGoal}
            </Text>
          ) : null}
        </Animated.View>
      </View>

      {/* ── Buttons ── */}
      <View style={{ paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 52 : 36, gap: 10 }}>

        {/* Log Distraction */}
        <ScalePress onPress={handleDistraction} style={{
          height:          52,
          borderRadius:    24,
          alignItems:      'center',
          justifyContent:  'center',
          backgroundColor: 'rgba(249,115,22,0.1)',
          ...Platform.select({
            ios:     { shadowColor: D.orange, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 10 },
            android: { elevation: 2 },
          }),
        }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: D.orange, letterSpacing: -0.2 }}>
            Log Distraction
          </Text>
        </ScalePress>

        {/* Pause / Resume */}
        <ScalePress onPress={() => setIsPaused(p => !p)}>
          <LinearGradient
            colors={isPaused ? [D.green, '#059669'] : [D.gold, '#d4a017']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={{
              height:         58,
              borderRadius:   24,
              alignItems:     'center',
              justifyContent: 'center',
              ...Platform.select({
                ios:     { shadowColor: isPaused ? D.green : D.gold, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12 },
                android: { elevation: 6 },
              }),
            }}
          >
            <Text style={{ fontSize: 17, fontWeight: '900', color: '#1a1000', letterSpacing: 0.3 }}>
              {isPaused ? '▶  Resume' : '⏸  Pause'}
            </Text>
          </LinearGradient>
        </ScalePress>

        {/* Give Up — ghost outline pill */}
        <TouchableOpacity onPress={handleQuit} activeOpacity={0.6}
          style={{
            height:          44,
            borderRadius:    22,
            borderWidth:     1,
            borderColor:     D.subtle,
            alignItems:      'center',
            justifyContent:  'center',
          }}>
          <Text style={{ fontSize: 13, fontWeight: '500', color: D.subtle, letterSpacing: 0.3 }}>
            Give Up
          </Text>
        </TouchableOpacity>

      </View>
    </View>
  );
}