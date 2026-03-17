// FocusScreen.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, Alert,
  Dimensions, Animated, StatusBar, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth }        from '../../hooks/useAuth';
import { SUBJECT_ICONS }  from '../../themes';
import { MIN_VALID_SECONDS } from '../../utils/scoreEngine';

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

  // FIX 6: track elapsed as state for display so it stays in sync with renders
  const [elapsedDisplay, setElapsedDisplay] = useState('0s elapsed');

  const intervalRef  = useRef(null);
  const distractions = useRef([]);
  const pauseStart   = useRef(null);
  const totalPaused  = useRef(0);
  // FIX 5: flag to prevent navigation being called twice from inside setState
  const didNavigate  = useRef(false);

  // ── Short-session toast ───────────────────────────────────────
  const [toastVisible, setToastVisible] = useState(false);
  const toastAnim = useRef(new Animated.Value(0)).current;

  const showShortSessionToast = () => {
    setToastVisible(true);
    Animated.sequence([
      Animated.spring(toastAnim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 10 }),
      Animated.delay(2800),
      Animated.timing(toastAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setToastVisible(false));
  };

  const breatheAnim = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0.12)).current;
  const msgFade     = useRef(new Animated.Value(1)).current;
  const ringPulse   = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, { toValue: 1.08, duration: 4000, useNativeDriver: true }),
        Animated.timing(breatheAnim, { toValue: 1,    duration: 4000, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacity, { toValue: 0.35, duration: 2500, useNativeDriver: true }),
        Animated.timing(glowOpacity, { toValue: 0.12, duration: 2500, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(ringPulse, { toValue: 1.02, duration: 1500, useNativeDriver: true }),
        Animated.timing(ringPulse, { toValue: 1,    duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

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

  const buildParams = (completed, quitReason = null) => ({
    subject,
    durationSeconds: Math.max(elapsedRef.current, 1),
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
    if (didNavigate.current) return; // FIX 5: prevent double navigation
    didNavigate.current = true;
    clearInterval(intervalRef.current);

    const isShortSession = !completed && elapsedRef.current < MIN_VALID_SECONDS;

    if (isShortSession) {
      // Show toast first, then navigate after a short pause so user reads it
      showShortSessionToast();
      setTimeout(() => {
        navigation.replace('PostSession', buildParams(completed, quitReason));
      }, 1200);
    } else {
      navigation.replace('PostSession', buildParams(completed, quitReason));
    }
  };

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
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000) - totalPaused.current;
      elapsedRef.current = elapsed;

      // FIX 6: update elapsed display from the interval, not in render
      const display = elapsed < 60
        ? `${elapsed}s elapsed`
        : `${Math.floor(elapsed / 60)}m ${elapsed % 60}s elapsed`;
      setElapsedDisplay(display);

      setTimeLeft(t => {
        if (t <= 1) {
          // FIX 5: schedule navigation outside the state updater
          setTimeout(() => navigateToPostSession(true), 0);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [isPaused]);

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

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={D.bg} />

      <Animated.View style={{
        position:     'absolute',
        top:          height * 0.2,
        left:         width * 0.15,
        width:        width * 0.7,
        height:       width * 0.7,
        borderRadius: width * 0.35,
        transform:    [{ scale: breatheAnim }],
      }}>
        <Animated.View style={{
          flex:            1,
          borderRadius:    width * 0.35,
          backgroundColor: D.goldGlow,
          opacity:         glowOpacity,
        }} />
      </Animated.View>

      <View style={{
        flexDirection:     'row',
        justifyContent:    'space-between',
        alignItems:        'center',
        paddingHorizontal: 20,
        paddingTop:        Platform.OS === 'ios' ? 64 : 48,
        paddingBottom:     8,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14, backgroundColor: D.surface2 }}>
          <Text style={{ fontSize: 16 }}>{subjectIcon}</Text>
          <Text style={{ fontSize: 13, fontWeight: '700', color: D.text, letterSpacing: -0.3 }}>{subject}</Text>
        </View>

        <View style={{ backgroundColor: D.surface2, borderRadius: 14, paddingVertical: 6, paddingHorizontal: 12 }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: D.muted, letterSpacing: 0.5 }}>{duration} MIN</Text>
        </View>

        {distrCount > 0 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 20, paddingVertical: 6, paddingHorizontal: 12, backgroundColor: 'rgba(249,115,22,0.15)' }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: D.orange }} />
            <Text style={{ fontSize: 12, fontWeight: '700', color: D.orange }}>{distrCount}</Text>
          </View>
        )}
      </View>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: -20 }}>

        <Animated.View style={{
          position:        'absolute',
          width:           RING_SIZE + 20,
          height:          RING_SIZE + 20,
          borderRadius:    (RING_SIZE + 20) / 2,
          backgroundColor: D.goldGlow,
          opacity:         0.15,
          transform:       [{ scale: breatheAnim }],
        }} />

        <Animated.View style={{
          width:          RING_SIZE,
          height:         RING_SIZE,
          borderRadius:   RING_SIZE / 2,
          alignItems:     'center',
          justifyContent: 'center',
          transform:      [{ scale: ringPulse }],
        }}>
          <View style={{
            position:     'absolute',
            width:        RING_SIZE,
            height:       RING_SIZE,
            borderRadius: RING_SIZE / 2,
            borderWidth:  10,
            borderColor:  D.surface3,
          }} />

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

          <View style={{ alignItems: 'center', paddingHorizontal: 20 }}>
            {isPaused && (
              <View style={{ backgroundColor: 'rgba(249,115,22,0.18)', borderRadius: 8, paddingVertical: 4, paddingHorizontal: 14, marginBottom: 10 }}>
                <Text style={{ fontSize: 10, fontWeight: '800', letterSpacing: 2.5, color: D.orange }}>PAUSED</Text>
              </View>
            )}

            <Text style={{
              fontSize:         58,
              fontWeight:       '700',
              fontFamily:       Platform.OS === 'ios' ? 'Courier New' : 'monospace',
              color:            isPaused ? D.subtle : D.gold,
              letterSpacing:    2,
              textShadowColor:  isPaused ? 'transparent' : 'rgba(245,200,66,0.4)',
              textShadowOffset: { width: 0, height: 0 },
              textShadowRadius: 20,
            }}>
              {formatTime(timeLeft)}
            </Text>

            <Text style={{ fontSize: 10, color: D.subtle, fontWeight: '500', letterSpacing: 2, textTransform: 'uppercase', marginTop: 4 }}>
              remaining
            </Text>

            <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: D.gold + '60' }} />
              {/* FIX 6: use state value, not inline Date.now() calc */}
              <Text style={{ fontSize: 12, color: D.muted, letterSpacing: -0.2 }}>{elapsedDisplay}</Text>
              <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: D.gold + '60' }} />
            </View>

            <View style={{ marginTop: 10, backgroundColor: D.goldGlow, borderRadius: 20, paddingVertical: 4, paddingHorizontal: 14 }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: D.gold, letterSpacing: -0.2 }}>
                {Math.round(progress * 100)}%
              </Text>
            </View>
          </View>
        </Animated.View>

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

      <View style={{ paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 52 : 36, gap: 10 }}>

        <ScalePress onPress={handleDistraction} style={{
          height:          52,
          borderRadius:    24,
          alignItems:      'center',
          justifyContent:  'center',
          backgroundColor: 'rgba(249,115,22,0.1)',
        }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: D.orange, letterSpacing: -0.2 }}>
            Log Distraction
          </Text>
        </ScalePress>

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
              {isPaused ? '▶ Resume' : '⏸ Pause'}
            </Text>
          </LinearGradient>
        </ScalePress>

        <TouchableOpacity onPress={handleQuit} activeOpacity={0.6}
          style={{ height: 40, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 13, color: D.subtle, textDecorationLine: 'underline', letterSpacing: -0.2 }}>
            Give Up
          </Text>
        </TouchableOpacity>

      </View>

      {/* ── Short-session toast ────────────────────────────── */}
      {toastVisible && (
        <Animated.View style={{
          position:          'absolute',
          bottom:            Platform.OS === 'ios' ? 110 : 90,
          left:              20,
          right:             20,
          borderRadius:      18,
          paddingVertical:   14,
          paddingHorizontal: 18,
          backgroundColor:   D.surface2,
          borderWidth:       1,
          borderColor:       D.goldDim,
          flexDirection:     'row',
          alignItems:        'center',
          gap:               12,
          opacity:           toastAnim,
          transform: [{
            translateY: toastAnim.interpolate({
              inputRange:  [0, 1],
              outputRange: [20, 0],
            }),
          }],
          ...Platform.select({
            ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 16 },
            android: { elevation: 10 },
          }),
        }}>
          <View style={{
            width: 34, height: 34, borderRadius: 17,
            backgroundColor: D.goldGlow,
            alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Text style={{ fontSize: 16 }}>📋</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: D.text, letterSpacing: -0.2, marginBottom: 2 }}>
              Session saved to History
            </Text>
            <Text style={{ fontSize: 11, color: D.muted, lineHeight: 15 }}>
              Too short to affect your Discipline Score (need 1+ min).
            </Text>
          </View>
        </Animated.View>
      )}
    </View>
  );
}