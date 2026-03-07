
//  Usage:
//  import { PrimaryButton, SecondaryButton, PillButton, IconButton } from '../components'
// ══════════════════════════════════════════

import React from 'react';
import {
  TouchableOpacity, Text, View,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C } from '../theme';

// ── Primary Button ────────────────────────
// Main CTA button with gradient + shadow
// Usage: <PrimaryButton label="Start Focus" onPress={() => {}} />
//        <PrimaryButton label="Saving..." loading onPress={() => {}} />
export function PrimaryButton({
  label,
  onPress,
  loading   = false,
  disabled  = false,
  colors    = [C.blueDark, C.blue],
  style     = {},
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      style={[styles.primaryWrapper, style]}
    >
      <LinearGradient
        colors={disabled ? ['#cbd5e1', '#94a3b8'] : colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.primaryBtn}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" size="small" />
        ) : (
          <Text style={styles.primaryText}>{label}</Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

// ── Secondary Button ──────────────────────
// Outlined button for secondary actions
// Usage: <SecondaryButton label="Cancel" onPress={() => {}} />
export function SecondaryButton({
  label,
  onPress,
  color  = C.blue,
  style  = {},
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[styles.secondaryBtn, { borderColor: color }, style]}
    >
      <Text style={[styles.secondaryText, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ── Pill Button ───────────────────────────
// Small rounded toggle — used for filters,
// subject selectors, mood pickers etc.
// Usage: <PillButton label="Math" active={subject==='Math'} onPress={() => setSubject('Math')} />
export function PillButton({
  label,
  active   = false,
  color    = C.blue,
  onPress,
  style    = {},
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[
        styles.pill,
        active
          ? { backgroundColor: color }
          : { backgroundColor: '#f1f5f9', borderColor: '#e2e8f0' },
        style,
      ]}
    >
      <Text style={[
        styles.pillText,
        { color: active ? '#ffffff' : '#64748b' },
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ── Filter Tabs ───────────────────────────
// A row of pill buttons where only one is active
// Usage:
// <FilterTabs
//   options={['All','Done','Quit']}
//   active={filter}
//   onChange={setFilter}
// />
export function FilterTabs({ options = [], active, onChange, color = C.blue }) {
  return (
    <View style={styles.filterRow}>
      {options.map(opt => (
        <PillButton
          key={opt}
          label={opt}
          active={active === opt}
          color={color}
          onPress={() => onChange(opt)}
          style={styles.filterTab}
        />
      ))}
    </View>
  );
}

// ── Icon Button ───────────────────────────
// Clean circular button — used for back, close, settings etc.
// Usage: <IconButton icon="←" onPress={() => navigation.goBack()} />
export function IconButton({
  icon,
  onPress,
  size   = 40,
  color  = '#1e293b',
  bg     = '#f1f5f9',
  style  = {},
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[{
        width:           size,
        height:          size,
        borderRadius:    size / 2,
        backgroundColor: bg,
        alignItems:      'center',
        justifyContent:  'center',
      }, style]}
    >
      <Text style={{ fontSize: size * 0.42, color, fontWeight: '700' }}>
        {icon}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({

  // ── Primary ──────────────────────────
  primaryWrapper: {
    borderRadius:  14,
    shadowColor:   C.blue,
    shadowOffset:  { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius:  12,
    elevation:     6,
  },
  primaryBtn: {
    height:         54,
    borderRadius:   14,
    alignItems:     'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  primaryText: {
    color:         '#ffffff',
    fontSize:      16,
    fontWeight:    '700',
    letterSpacing: 0.3,
  },

  // ── Secondary ─────────────────────────
  secondaryBtn: {
    height:           52,
    borderRadius:     14,
    borderWidth:      1.5,
    alignItems:       'center',
    justifyContent:   'center',
    paddingHorizontal: 24,
    backgroundColor:  'transparent',
  },
  secondaryText: {
    fontSize:   15,
    fontWeight: '600',
  },

  // ── Pill ─────────────────────────────
  pill: {
    paddingVertical:   8,
    paddingHorizontal: 18,
    borderRadius:      24,
    borderWidth:       1,
    borderColor:       'transparent',
  },
  pillText: {
    fontSize:   13,
    fontWeight: '600',
  },

  // ── Filter row ────────────────────────
  filterRow: {
    flexDirection: 'row',
    gap:           8,
    flexWrap:      'wrap',
  },
  filterTab: {
    marginBottom: 0,
  },
});