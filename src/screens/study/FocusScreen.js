

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity,
  Alert, Dimensions, Animated,
} from 'react-native';
import { LinearGradient }   from 'expo-linear-gradient';
import { useTheme }         from '../../context/ThemeContext';
import { useAuth }          from '../../hooks/useAuth';
import { SUBJECT_ICONS, sColor, sBg } from '../../themes';

const { width } = Dimensions.get('window');
const RING_SIZE  = width * 0.72;

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

export default function FocusScreen({ navigation, route }) {
  const { C }           = useTheme();
  const auth            = useAuth?.() || {};
  const userData        = auth.userData || null;
  const currentScore    = userData?.score ?? userData?.disciplineScore ?? 0;

  const {
    subject     = 'Math',
    duration    = 25,      // minutes — used only for the ring display
    sessionGoal = '',
  } = route?.params || {};

  // ── ALL time tracking is in SECONDS ──────────────────────────
  const totalSeconds    = duration * 60;
  const startTimeRef    = useRef(new Date());          // real wall-clock start
  const elapsedRef      = useRef(0);                   // actual seconds elapsed

  const [timeLeft,    setTimeLeft]    = useState(totalSeconds);
  const [isPaused,    setIsPaused]    = useState(false);
  const [distrCount,  setDistrCount]  = useState(0);
  const [msgIndex,    setMsgIndex]    = useState(0);

  const intervalRef  = useRef(null);
  const pulseAnim    = useRef(new Animated.Value(1)).current;
  const distractions = useRef([]);
  const pauseStart   = useRef(null);    // tracks when pause began
  const totalPaused  = useRef(0);       // total paused seconds to subtract

  const subjectColor = sColor(subject);
  const subjectIcon  = SUBJECT_ICONS?.[subject] || '📌';

  // ── Pulse animation ──────────────────────────────────────────
  useEffect(() => {
    const pulse = Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.04, duration: 1000, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1,    duration: 1000, useNativeDriver: true }),
    ]));
    pulse.start();
    return () => pulse.stop();
  }, []);

  // ── Rotate motivational message ──────────────────────────────
  useEffect(() => {
    const t = setInterval(() => setMsgIndex(i => (i + 1) % MESSAGES.length), 8000);
    return () => clearInterval(t);
  }, []);

  // ── Countdown ────────────────────────────────────────────────
  useEffect(() => {
    if (isPaused) {
      clearInterval(intervalRef.current);
      pauseStart.current = Date.now();
      return;
    }

    // Resume: record paused time
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

  // ── Build PostSession params ─────────────────────────────────
  // duration is saved in SECONDS so even a 4-second session is recorded
  const buildParams = (completed, quitReason = null) => ({
    subject,
    // ↓ SECONDS — HistoryScreen and scoreEngine now receive seconds
    durationSeconds:  Math.max(elapsedRef.current, 1),
    // ↓ also keep durationMinutes for display convenience
    durationMinutes:  Math.max(Math.floor(elapsedRef.current / 60), 0),
    plannedMinutes:   duration,
    completed,
    quitReason,
    distractions:     distractions.current,
    startTime:        startTimeRef.current.toISOString(),
    currentScore,
    studiedOnTime:    false,   // TODO: check schedule slots
    plannedToStudy:   false,
  });

  const navigateToPostSession = (completed, quitReason = null) => {
    clearInterval(intervalRef.current);
    navigation.replace('PostSession', buildParams(completed, quitReason));
  };

  // ── Log distraction ──────────────────────────────────────────
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

  // ── Quit ─────────────────────────────────────────────────────
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
              { text: 'Too Tired',         onPress: () => navigateToPostSession(false, 'Too Tired') },
              { text: 'Got Bored',         onPress: () => navigateToPostSession(false, 'Got Bored') },
              { text: 'Urgent Task',       onPress: () => navigateToPostSession(false, 'Urgent Task') },
              { text: 'Lost Motivation',   onPress: () => navigateToPostSession(false, 'Lost Motivation') },
              { text: 'Cancel', style: 'cancel', onPress: () => setIsPaused(false) },
            ]);
          },
        },
      ]
    );
  };

  const progress = 1 - (timeLeft / totalSeconds);
  const ringDeg  = Math.round(progress * 360);

  // Elapsed display — show seconds if under 1 minute
  const elapsedSec = Math.floor((Date.now() - startTimeRef.current) / 1000) - totalPaused.current;
  const elapsedDisplay = elapsedSec < 60
    ? `${elapsedSec}s elapsed`
    : `${Math.floor(elapsedSec / 60)}m ${elapsedSec % 60}s elapsed`;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center' }}>

      {/* Background gradient */}
      <LinearGradient
        colors={[C.bg, subjectColor + '18', C.bg]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={{ ...{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } }}
      />

      {/* Top bar */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingHorizontal: 24, paddingTop: 64, paddingBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 20, paddingVertical: 7, paddingHorizontal: 14, backgroundColor: sBg(subject) }}>
          <Text style={{ fontSize: 16 }}>{subjectIcon}</Text>
          <Text style={{ fontSize: 14, fontWeight: '700', color: subjectColor }}>{subject}</Text>
        </View>
        {distrCount > 0 && (
          <View style={{ borderRadius: 20, paddingVertical: 6, paddingHorizontal: 12, backgroundColor: C.orangeSoft }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: C.orange }}>{distrCount} distr.</Text>
          </View>
        )}
      </View>

      {/* Timer ring */}
      <View style={{ marginTop: 24, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: RING_SIZE, height: RING_SIZE, borderRadius: RING_SIZE / 2, borderWidth: 14, borderColor: C.border, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ position: 'absolute', width: RING_SIZE, height: RING_SIZE, borderRadius: RING_SIZE / 2, borderWidth: 14, borderColor: 'transparent',
            borderTopColor:    ringDeg > 0   ? subjectColor : 'transparent',
            borderRightColor:  ringDeg > 90  ? subjectColor : 'transparent',
            borderBottomColor: ringDeg > 180 ? subjectColor : 'transparent',
            borderLeftColor:   ringDeg > 270 ? subjectColor : 'transparent',
            transform: [{ rotate: '-45deg' }],
          }} />

          <Animated.View style={{ alignItems: 'center', justifyContent: 'center', gap: 4, transform: [{ scale: pulseAnim }] }}>
            {isPaused && (
              <View style={{ borderRadius: 6, paddingVertical: 4, paddingHorizontal: 10, marginBottom: 8, backgroundColor: C.orangeSoft }}>
                <Text style={{ fontSize: 10, fontWeight: '800', letterSpacing: 1.5, color: C.orange }}>PAUSED</Text>
              </View>
            )}
            <Text style={{ fontSize: 58, fontWeight: '800', color: isPaused ? C.muted : C.text, letterSpacing: -2 }}>
              {formatTime(timeLeft)}
            </Text>
            <Text style={{ fontSize: 14, color: C.muted, fontWeight: '500' }}>remaining</Text>
            {/* elapsed — shows even seconds */}
            <Text style={{ fontSize: 13, color: subjectColor, fontWeight: '600', marginTop: 4 }}>
              {elapsedDisplay}
            </Text>
            <Text style={{ fontSize: 16, fontWeight: '700', color: subjectColor }}>
              {Math.round(progress * 100)}%
            </Text>
          </Animated.View>
        </View>
      </View>

      {/* Motivational message */}
      <View style={{ alignItems: 'center', marginTop: 28, paddingHorizontal: 40, gap: 6 }}>
        <Text style={{ fontSize: 16, color: C.muted, fontStyle: 'italic', textAlign: 'center' }}>{MESSAGES[msgIndex]}</Text>
        {sessionGoal ? <Text style={{ fontSize: 13, color: C.subtext, textAlign: 'center' }}>Goal: {sessionGoal}</Text> : null}
      </View>

      {/* Buttons */}
      <View style={{ position: 'absolute', bottom: 48, width: '100%', paddingHorizontal: 24, gap: 12 }}>

        <TouchableOpacity onPress={handleDistraction} activeOpacity={0.75}
          style={{ height: 52, borderRadius: 14, borderWidth: 1.5, borderColor: C.orange, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: C.orange }}>Log Distraction</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsPaused(p => !p)} activeOpacity={0.85}
          style={{ borderRadius: 14, shadowColor: C.blue, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 }}>
          <LinearGradient
            colors={isPaused ? [C.green, C.mint] : [subjectColor, subjectColor + 'cc']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={{ height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ fontSize: 17, fontWeight: '800', color: '#fff', letterSpacing: 0.3 }}>
              {isPaused ? 'Resume' : 'Pause'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleQuit} activeOpacity={0.75}
          style={{ height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 14, color: C.muted, fontWeight: '600' }}>Quit Early</Text>
        </TouchableOpacity>

      </View>
    </View>
  );
}