
import React, { useRef } from 'react';
import {
  TouchableOpacity, Text, View,
  StyleSheet, ActivityIndicator,
  Animated, Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C } from '../themes/colors';

// ── Spring press micro-animation ──────────
// Wraps any child with a 0.96 scale spring on press
function SpringPress({ onPress, children, style, disabled }) {
  const scale = useRef(new Animated.Value(1)).current;

  const down = () =>
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, tension: 400, friction: 20 }).start();
  const up = () =>
    Animated.spring(scale, { toValue: 1,    useNativeDriver: true, tension: 300, friction: 15 }).start();

  if (disabled) return <View style={style}>{children}</View>;
  return (
    <Pressable onPressIn={down} onPressOut={up} onPress={onPress}>
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

// ── Primary Button ────────────────────────
// Volt gradient with violet glow shadow + spring press
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
    <SpringPress
      onPress={onPress}
      disabled={disabled || loading}
      style={[s.primaryWrapper, style]}
    >
      <LinearGradient
        colors={disabled ? [C.subtext, C.muted] : colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={s.primaryBtn}
      >
        {loading
          ? <ActivityIndicator color="#fff" size="small" />
          : <Text style={s.primaryText}>{label}</Text>
        }
      </LinearGradient>
    </SpringPress>
  );
}

// ── Secondary Button ──────────────────────
// Neon outlined — transparent fill, glowing border on dark bg
// Usage: <SecondaryButton label="Cancel" onPress={() => {}} />
export function SecondaryButton({
  label,
  onPress,
  color  = C.blue,
  style  = {},
}) {
  return (
    <SpringPress onPress={onPress} style={style}>
      <View style={[s.secondaryBtn, {
        borderColor: color,
        shadowColor: color,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      }]}>
        <Text style={[s.secondaryText, { color }]}>{label}</Text>
      </View>
    </SpringPress>
  );
}

// ── Pill Button ───────────────────────────
// Glassmorphism active state — translucent volt fill + neon border
// Usage: <PillButton label="Math" active={subject==='Math'} onPress={() => setSubject('Math')} />
export function PillButton({
  label,
  active   = false,
  color    = C.blue,
  onPress,
  style    = {},
}) {
  return (
    <SpringPress onPress={onPress} style={style}>
      <View style={[
        s.pill,
        active
          ? {
              backgroundColor: color + '20',  // translucent color fill
              borderColor:     color,
              shadowColor:     color,
              shadowOffset:    { width: 0, height: 0 },
              shadowOpacity:   0.3,
              shadowRadius:    8,
            }
          : {
              backgroundColor: C.bgRaised,
              borderColor:     C.border,
            },
      ]}>
        {/* Glassmorphism inner glow when active */}
        {active && (
          <View style={[StyleSheet.absoluteFillObject, {
            borderRadius:    24,
            backgroundColor: color + '0a',
          }]} />
        )}
        <Text style={[
          s.pillText,
          { color: active ? color : C.muted },
        ]}>
          {label}
        </Text>
      </View>
    </SpringPress>
  );
}

// ── Filter Tabs ───────────────────────────
// Usage:
// <FilterTabs options={['All','Done','Quit']} active={filter} onChange={setFilter} />
export function FilterTabs({ options = [], active, onChange, color = C.blue }) {
  return (
    <View style={s.filterRow}>
      {options.map(opt => (
        <PillButton
          key={opt}
          label={opt}
          active={active === opt}
          color={color}
          onPress={() => onChange(opt)}
          style={s.filterTab}
        />
      ))}
    </View>
  );
}

// ── Icon Button ───────────────────────────
// Dark circle with neon icon — for back, close, actions
// Usage: <IconButton icon="←" onPress={() => navigation.goBack()} />
export function IconButton({
  icon,
  onPress,
  size   = 40,
  color  = C.text,
  bg     = C.bgRaised,
  style  = {},
}) {
  return (
    <SpringPress onPress={onPress} style={style}>
      <View style={{
        width:           size,
        height:          size,
        borderRadius:    size / 2,
        backgroundColor: bg,
        alignItems:      'center',
        justifyContent:  'center',
        borderWidth:     0.5,
        borderColor:     C.border,
      }}>
        <Text style={{ fontSize: size * 0.42, color, fontWeight: '700' }}>
          {icon}
        </Text>
      </View>
    </SpringPress>
  );
}

const s = StyleSheet.create({

  // ── Primary ──────────────────────────
  primaryWrapper: {
    borderRadius:  14,
    // Violet glow drop shadow
    shadowColor:   C.blue,
    shadowOffset:  { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius:  16,
    elevation:     8,
  },
  primaryBtn: {
    height:            54,
    borderRadius:      14,
    alignItems:        'center',
    justifyContent:    'center',
    paddingHorizontal: 24,
  },
  primaryText: {
    color:         '#fff',
    fontSize:      16,
    fontWeight:    '700',
    letterSpacing: 0.3,
  },

  // ── Secondary ─────────────────────────
  secondaryBtn: {
    height:            52,
    borderRadius:      14,
    borderWidth:       1,
    alignItems:        'center',
    justifyContent:    'center',
    paddingHorizontal: 24,
    backgroundColor:   'transparent',
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
    borderWidth:       0.5,
    overflow:          'hidden',
  },
  pillText: {
    fontSize:      12,
    fontWeight:    '700',
    letterSpacing: 0.3,
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