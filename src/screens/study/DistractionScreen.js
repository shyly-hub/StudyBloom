
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ScrollView, Animated, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C, DISTRACTIONS } from '../../themes';

const { height } = Dimensions.get('window');

// Distraction types with icons and colors
const DISTRACTION_OPTIONS = [
  { label: 'Phone',        icon: '📱', color: '#f43f5e', bg: '#fff1f2' },
  { label: 'Social Media', icon: '💬', color: '#8b5cf6', bg: '#f5f3ff' },
  { label: 'Overthinking', icon: '🌀', color: '#f97316', bg: '#fff7ed' },
  { label: 'Tired',        icon: '😴', color: '#6366f1', bg: '#eef2ff' },
  { label: 'Noise',        icon: '🔊', color: '#eab308', bg: '#fefce8' },
  { label: 'People',       icon: '👥', color: '#10b981', bg: '#f0fdf4' },
  { label: 'Hunger',       icon: '🍕', color: '#f59e0b', bg: '#fffbeb' },
  { label: 'Other',        icon: '❓', color: C.muted,   bg: C.blueSoft },
];

export default function DistractionScreen({ navigation, route }) {
  const { onAdd } = route?.params || {};

  const [selected, setSelected] = useState(null);
  const [severity, setSeverity] = useState(3);
  const [note,     setNote]     = useState('');
  const [elapsed,  setElapsed]  = useState(0);   // seconds paused

  const slideAnim = useRef(new Animated.Value(height)).current;

  // Slide up animation on mount
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue:         0,
      useNativeDriver: true,
      tension:         65,
      friction:        11,
    }).start();
  }, []);

  // Pause elapsed timer
  useEffect(() => {
    const interval = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleResume = () => {
    if (!selected) {
      // Resume without logging
      navigation.goBack();
      return;
    }

    const distractionLog = {
      type:      selected.label,
      severity,
      note:      note.trim(),
      timestamp: new Date().toISOString(),
    };

    onAdd?.(distractionLog);
    navigation.goBack();
  };

  const formatElapsed = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
  };

  return (
    <View style={styles.overlay}>

      {/* Tap outside to dismiss */}
      <TouchableOpacity style={styles.backdrop} onPress={handleResume} activeOpacity={1} />

      <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>

        {/* Handle bar */}
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>What distracted you?</Text>
            <Text style={styles.headerSub}>Paused for {formatElapsed(elapsed)}</Text>
          </View>
          <View style={[styles.pausedBadge, { backgroundColor: C.orangeSoft }]}>
            <View style={[styles.pausedDot, { backgroundColor: C.orange }]} />
            <Text style={[styles.pausedText, { color: C.orange }]}>PAUSED</Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>

          {/* Distraction options grid */}
          <View style={styles.grid}>
            {DISTRACTION_OPTIONS.map(opt => {
              const isSelected = selected?.label === opt.label;
              return (
                <TouchableOpacity
                  key={opt.label}
                  onPress={() => setSelected(isSelected ? null : opt)}
                  style={[
                    styles.optionCard,
                    { backgroundColor: isSelected ? opt.color : opt.bg },
                    isSelected && styles.optionCardSelected,
                  ]}
                  activeOpacity={0.8}
                >
                  <Text style={styles.optionIcon}>{opt.icon}</Text>
                  <Text style={[
                    styles.optionLabel,
                    { color: isSelected ? '#fff' : opt.color }
                  ]}>
                    {opt.label}
                  </Text>
                  {isSelected && (
                    <View style={styles.checkmark}>
                      <Text style={styles.checkmarkText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Severity (only if something selected) */}
          {selected && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>How bad was it?</Text>
              <View style={styles.severityRow}>
                {[1, 2, 3, 4, 5].map(n => (
                  <TouchableOpacity
                    key={n}
                    onPress={() => setSeverity(n)}
                    style={[
                      styles.severityDot,
                      {
                        backgroundColor: n <= severity
                          ? (selected?.color || C.blue)
                          : C.border,
                        transform: [{ scale: n === severity ? 1.3 : 1 }],
                      }
                    ]}
                  />
                ))}
                <Text style={styles.severityLabel}>
                  {['', 'Minor', 'Mild', 'Moderate', 'Major', 'Critical'][severity]}
                </Text>
              </View>
            </View>
          )}

          {/* Optional note */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Add a note (optional)</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="What happened?"
              placeholderTextColor={C.subtext}
              value={note}
              onChangeText={setNote}
              multiline
              maxLength={100}
            />
          </View>

          {/* Resume button */}
          <View style={styles.buttonArea}>
            <TouchableOpacity onPress={handleResume} activeOpacity={0.85} style={styles.resumeBtnWrapper}>
              <LinearGradient
                colors={[C.blueDark, C.blue]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.resumeBtn}
              >
                <Text style={styles.resumeBtnText}>
                  {selected ? 'Log & Resume' : 'Resume Without Logging'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex:            1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent:  'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },

  // Sheet
  sheet: {
    backgroundColor: C.card,
    borderTopLeftRadius:  28,
    borderTopRightRadius: 28,
    paddingHorizontal:    24,
    paddingBottom:        40,
    maxHeight:            height * 0.88,
  },
  handle: {
    width:           44,
    height:          4,
    borderRadius:    2,
    backgroundColor: C.border,
    alignSelf:       'center',
    marginTop:       12,
    marginBottom:    20,
  },

  // Header
  header: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
    marginBottom:   20,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: C.text, marginBottom: 4 },
  headerSub:   { fontSize: 13, color: C.muted },
  pausedBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 20, paddingVertical: 6, paddingHorizontal: 12 },
  pausedDot:   { width: 6, height: 6, borderRadius: 3 },
  pausedText:  { fontSize: 11, fontWeight: '800', letterSpacing: 1 },

  // Options grid
  grid: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           10,
    marginBottom:  8,
  },
  optionCard: {
    width:          '22%',
    aspectRatio:    1,
    borderRadius:   16,
    alignItems:     'center',
    justifyContent: 'center',
    gap:            4,
    position:       'relative',
  },
  optionCardSelected: {
    shadowColor:   '#000',
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius:  8,
    elevation:     4,
  },
  optionIcon:  { fontSize: 24 },
  optionLabel: { fontSize: 10, fontWeight: '700', textAlign: 'center' },
  checkmark:   { position: 'absolute', top: 6, right: 6, width: 16, height: 16, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' },
  checkmarkText: { fontSize: 9, color: '#fff', fontWeight: '800' },

  // Severity
  section:       { marginTop: 20, marginBottom: 4 },
  sectionLabel:  { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 14 },
  severityRow:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  severityDot:   { width: 28, height: 28, borderRadius: 14 },
  severityLabel: { fontSize: 13, color: C.muted, fontWeight: '600', marginLeft: 6 },

  // Note
  noteInput: {
    backgroundColor: C.bg,
    borderRadius:    14,
    padding:         14,
    fontSize:        14,
    color:           C.text,
    borderWidth:     1,
    borderColor:     C.border,
    minHeight:       80,
    textAlignVertical: 'top',
  },

  // Resume button
  buttonArea:       { marginTop: 24 },
  resumeBtnWrapper: {
    borderRadius:  14,
    shadowColor:   C.blue,
    shadowOffset:  { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius:  12,
    elevation:     6,
  },
  resumeBtn:     { height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  resumeBtnText: { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
});