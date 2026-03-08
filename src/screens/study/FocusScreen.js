
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, Dimensions, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C, SUBJECT_ICONS, sColor, sBg } from '../../themes';

const { width } = Dimensions.get('window');
const RING_SIZE = width * 0.72;

// ── Motivational messages ─────────────────
const MESSAGES = [
  'Stay locked in.',
  'Every minute counts.',
  'You\'re doing great.',
  'No distractions.',
  'Focus is a skill.',
  'Build the habit.',
  'One session at a time.',
];

// ── Format seconds → MM:SS ────────────────
function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function FocusScreen({ navigation, route }) {
  // Params passed from HomeScreen
  const {
    subject      = 'Math',
    duration     = 25,    // minutes
    sessionGoal  = '',
  } = route?.params || {};

  const totalSeconds  = duration * 60;
  const [timeLeft,    setTimeLeft]    = useState(totalSeconds);
  const [isPaused,    setIsPaused]    = useState(false);
  const [distrCount,  setDistrCount]  = useState(0);
  const [msgIndex,    setMsgIndex]    = useState(0);

  const intervalRef   = useRef(null);
  const pulseAnim     = useRef(new Animated.Value(1)).current;
  const distractions  = useRef([]);

  const subjectColor = sColor(subject);
  const subjectIcon  = SUBJECT_ICONS?.[subject] || '📌';

  // ── Pulse animation ───────────────────
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.04, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 1000, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // ── Rotate motivational message ───────
  useEffect(() => {
    const msgInterval = setInterval(() => {
      setMsgIndex(i => (i + 1) % MESSAGES.length);
    }, 8000);
    return () => clearInterval(msgInterval);
  }, []);

  // ── Countdown timer ───────────────────
  useEffect(() => {
    if (isPaused) {
      clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(intervalRef.current);
          handleSessionComplete();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [isPaused]);

  // ── Session complete ──────────────────
  const handleSessionComplete = () => {
    clearInterval(intervalRef.current);
    navigation.replace('PostSession', {
      subject,
      duration,
      completed:    true,
      distractions: distractions.current,
    });
  };

  // ── Log distraction ───────────────────
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

  // ── Quit early ────────────────────────
  const handleQuit = () => {
    setIsPaused(true);
    clearInterval(intervalRef.current);
    Alert.alert(
      'Quit Session?',
      'Are you sure you want to quit? This will count as an incomplete session.',
      [
        {
          text:    'Keep Going',
          style:   'cancel',
          onPress: () => setIsPaused(false),
        },
        {
          text:    'Quit',
          style:   'destructive',
          onPress: () => {
            const elapsed = Math.floor((totalSeconds - timeLeft) / 60);
            navigation.replace('PostSession', {
              subject,
              duration:     Math.max(elapsed, 1),
              completed:    false,
              distractions: distractions.current,
            });
          },
        },
      ]
    );
  };

  // ── Progress % ────────────────────────
  const progress = 1 - (timeLeft / totalSeconds);
  const ringDeg  = Math.round(progress * 360);

  return (
    <View style={styles.screen}>

      {/* ── Background gradient ─────────── */}
      <LinearGradient
        colors={[C.bg, subjectColor + '18', C.bg]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* ── Top bar ─────────────────────── */}
      <View style={styles.topBar}>
        {/* Subject badge */}
        <View style={[styles.subjectBadge, { backgroundColor: sBg(subject) }]}>
          <Text style={styles.subjectIcon}>{subjectIcon}</Text>
          <Text style={[styles.subjectName, { color: subjectColor }]}>{subject}</Text>
        </View>

        {/* Distraction counter */}
        {distrCount > 0 && (
          <View style={[styles.distrBadge, { backgroundColor: C.orangeSoft }]}>
            <Text style={[styles.distrBadgeText, { color: C.orange }]}>
              {distrCount} distr.
            </Text>
          </View>
        )}
      </View>

      {/* ── Timer ring ──────────────────── */}
      <View style={styles.ringContainer}>
        {/* Outer ring track */}
        <View style={styles.ringTrack}>

          {/* Progress arc using border trick */}
          <View style={[styles.ringProgress, {
            borderTopColor:    ringDeg > 0   ? subjectColor : 'transparent',
            borderRightColor:  ringDeg > 90  ? subjectColor : 'transparent',
            borderBottomColor: ringDeg > 180 ? subjectColor : 'transparent',
            borderLeftColor:   ringDeg > 270 ? subjectColor : 'transparent',
            transform: [{ rotate: '-45deg' }],
          }]} />

          {/* Inner circle content */}
          <Animated.View style={[styles.ringInner, { transform: [{ scale: pulseAnim }] }]}>

            {/* Pause indicator */}
            {isPaused && (
              <View style={[styles.pausedBadge, { backgroundColor: C.orangeSoft }]}>
                <Text style={[styles.pausedText, { color: C.orange }]}>PAUSED</Text>
              </View>
            )}

            {/* Timer */}
            <Text style={[styles.timerText, { color: isPaused ? C.muted : C.text }]}>
              {formatTime(timeLeft)}
            </Text>
            <Text style={styles.timerSub}>remaining</Text>

            {/* Progress % */}
            <Text style={[styles.progressPct, { color: subjectColor }]}>
              {Math.round(progress * 100)}%
            </Text>
          </Animated.View>
        </View>
      </View>

      {/* ── Motivational message ─────────── */}
      <View style={styles.msgContainer}>
        <Text style={styles.msgText}>{MESSAGES[msgIndex]}</Text>
        {sessionGoal ? (
          <Text style={styles.goalText}>Goal: {sessionGoal}</Text>
        ) : null}
      </View>

      {/* ── Action buttons ──────────────── */}
      <View style={styles.buttons}>

        {/* Log Distraction */}
        <TouchableOpacity
          onPress={handleDistraction}
          style={[styles.distrBtn, { borderColor: C.orange }]}
          activeOpacity={0.75}
        >
          <Text style={[styles.distrBtnText, { color: C.orange }]}>
            Log Distraction
          </Text>
        </TouchableOpacity>

        {/* Pause / Resume */}
        <TouchableOpacity
          onPress={() => setIsPaused(p => !p)}
          activeOpacity={0.85}
          style={styles.pauseBtnWrapper}
        >
          <LinearGradient
            colors={isPaused ? [C.green, C.mint] : [subjectColor, subjectColor + 'cc']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.pauseBtn}
          >
            <Text style={styles.pauseBtnText}>
              {isPaused ? 'Resume' : 'Pause'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Quit */}
        <TouchableOpacity
          onPress={handleQuit}
          style={styles.quitBtn}
          activeOpacity={0.75}
        >
          <Text style={styles.quitBtnText}>Quit Early</Text>
        </TouchableOpacity>

      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex:            1,
    backgroundColor: C.bg,
    alignItems:      'center',
  },

  // Top bar
  topBar: {
    flexDirection:   'row',
    justifyContent:  'space-between',
    alignItems:      'center',
    width:           '100%',
    paddingHorizontal: 24,
    paddingTop:      64,
    paddingBottom:   8,
  },
  subjectBadge: {
    flexDirection:    'row',
    alignItems:       'center',
    gap:              8,
    borderRadius:     20,
    paddingVertical:  7,
    paddingHorizontal: 14,
  },
  subjectIcon: { fontSize: 16 },
  subjectName: { fontSize: 14, fontWeight: '700' },
  distrBadge:  {
    borderRadius:     20,
    paddingVertical:  6,
    paddingHorizontal: 12,
  },
  distrBadgeText: { fontSize: 12, fontWeight: '700' },

  // Ring
  ringContainer: {
    marginTop:      24,
    alignItems:     'center',
    justifyContent: 'center',
  },
  ringTrack: {
    width:          RING_SIZE,
    height:         RING_SIZE,
    borderRadius:   RING_SIZE / 2,
    borderWidth:    14,
    borderColor:    C.border,
    alignItems:     'center',
    justifyContent: 'center',
  },
  ringProgress: {
    position:     'absolute',
    width:        RING_SIZE,
    height:       RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth:  14,
    borderColor:  'transparent',
  },
  ringInner: {
    alignItems:     'center',
    justifyContent: 'center',
    gap:            4,
  },
  pausedBadge: {
    borderRadius:     6,
    paddingVertical:  4,
    paddingHorizontal: 10,
    marginBottom:     8,
  },
  pausedText: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },

  timerText:   { fontSize: 58, fontWeight: '800', color: C.text, letterSpacing: -2 },
  timerSub:    { fontSize: 14, color: C.muted,  fontWeight: '500' },
  progressPct: { fontSize: 16, fontWeight: '700', marginTop: 4 },

  // Message
  msgContainer: {
    alignItems:   'center',
    marginTop:    28,
    paddingHorizontal: 40,
    gap:          6,
  },
  msgText:  { fontSize: 16, color: C.muted, fontStyle: 'italic', textAlign: 'center' },
  goalText: { fontSize: 13, color: C.subtext, textAlign: 'center' },

  // Buttons
  buttons: {
    position: 'absolute',
    bottom:   48,
    width:    '100%',
    paddingHorizontal: 24,
    gap:      12,
  },
  distrBtn: {
    height:         52,
    borderRadius:   14,
    borderWidth:    1.5,
    alignItems:     'center',
    justifyContent: 'center',
  },
  distrBtnText: { fontSize: 15, fontWeight: '700' },

  pauseBtnWrapper: {
    borderRadius:  14,
    shadowColor:   C.blue,
    shadowOffset:  { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius:  12,
    elevation:     6,
  },
  pauseBtn: {
    height:         56,
    borderRadius:   14,
    alignItems:     'center',
    justifyContent: 'center',
  },
  pauseBtnText: { fontSize: 17, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },

  quitBtn: {
    height:         48,
    borderRadius:   14,
    alignItems:     'center',
    justifyContent: 'center',
  },
  quitBtnText: { fontSize: 14, color: C.muted, fontWeight: '600' },
});