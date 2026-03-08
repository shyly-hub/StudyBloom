
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C } from '../themes/colors';

// ── Standard Card ─────────────────────────
export function Card({ children, style = {}, onPress }) {
  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.72 : 1}
      onPress={onPress}
      style={[s.card, style]}
    >
      {children}
    </TouchableOpacity>
  );
}

// ── Gradient Card ─────────────────────────
// Default: volt deep → volt (instead of old blue → blueDark)
export function GradientCard({
  children,
  colors  = [C.blueDark, C.blue],
  style   = {},
  onPress,
}) {
  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.85 : 1}
      onPress={onPress}
      style={[s.gradientWrapper, style]}
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.gradientInner}
      >
        {children}
      </LinearGradient>
    </TouchableOpacity>
  );
}

// ── Stat Card ─────────────────────────────
// Neon top-bar with glow shadow in accent color
export function StatCard({
  value,
  label,
  color    = C.blue,
  sublabel = null,
  style    = {},
  onPress,
}) {
  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.75 : 1}
      onPress={onPress}
      style={[s.statCard, style]}
    >
      {/* Neon accent bar — glows in accent color */}
      <View style={[s.statAccent, {
        backgroundColor: color,
        shadowColor:     color,
        shadowOffset:    { width: 0, height: 0 },
        shadowOpacity:   0.7,
        shadowRadius:    8,
      }]} />
      <View style={s.statContent}>
        <Text style={[s.statValue, { color }]}>{value}</Text>
        <Text style={s.statLabel}>{label}</Text>
        {sublabel && <Text style={s.statSublabel}>{sublabel}</Text>}
      </View>
    </TouchableOpacity>
  );
}

// ── List Card ─────────────────────────────
// Left accent bar glows in accent color
export function ListCard({
  children,
  accentColor = C.blue,
  style       = {},
  onPress,
}) {
  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.75 : 1}
      onPress={onPress}
      style={[s.listCard, style]}
    >
      <View style={[s.listAccent, {
        backgroundColor: accentColor,
        shadowColor:     accentColor,
        shadowOffset:    { width: 0, height: 0 },
        shadowOpacity:   0.6,
        shadowRadius:    6,
      }]} />
      <View style={s.listContent}>{children}</View>
    </TouchableOpacity>
  );
}

// ── Info Row ──────────────────────────────
export function InfoRow({ label, value, valueColor = C.text }) {
  return (
    <View style={s.infoRow}>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={[s.infoValue, { color: valueColor }]}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({

  // ── Standard Card ─────────────────────
  card: {
    backgroundColor: C.card,        // void surface
    borderRadius:    18,
    padding:         16,
    marginBottom:    12,
    borderWidth:     0.5,
    borderColor:     C.border,
    // Violet glow shadow
    shadowColor:     C.shadow,
    shadowOffset:    { width: 0, height: 4 },
    shadowOpacity:   1,
    shadowRadius:    16,
    elevation:       4,
  },

  // ── Gradient Card ─────────────────────
  gradientWrapper: {
    borderRadius:  20,
    marginBottom:  12,
    shadowColor:   C.shadow,
    shadowOffset:  { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius:  20,
    elevation:     8,
  },
  gradientInner: {
    borderRadius: 20,
    padding:      20,
  },

  // ── Stat Card ─────────────────────────
  statCard: {
    backgroundColor: C.card,
    borderRadius:    16,
    overflow:        'hidden',
    marginBottom:    12,
    borderWidth:     0.5,
    borderColor:     C.border,
    shadowColor:     C.shadow,
    shadowOffset:    { width: 0, height: 4 },
    shadowOpacity:   1,
    shadowRadius:    12,
    elevation:       3,
  },
  statAccent: {
    height: 3,       // thinner, sharper neon line
    width:  '100%',
  },
  statContent: {
    padding: 14,
  },
  statValue: {
    fontSize:      28,
    fontWeight:    '800',
    letterSpacing: -0.5,
    marginBottom:  2,
  },
  statLabel: {
    fontSize:      11,
    color:         C.muted,
    fontWeight:    '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  statSublabel: {
    fontSize:  11,
    color:     C.subtext,
    marginTop: 2,
  },

  // ── List Card ─────────────────────────
  listCard: {
    backgroundColor: C.card,
    borderRadius:    14,
    marginBottom:    10,
    flexDirection:   'row',
    overflow:        'hidden',
    borderWidth:     0.5,
    borderColor:     C.border,
    shadowColor:     C.shadow,
    shadowOffset:    { width: 0, height: 2 },
    shadowOpacity:   1,
    shadowRadius:    8,
    elevation:       2,
  },
  listAccent: {
    width: 3,    // thin neon stripe
  },
  listContent: {
    flex:    1,
    padding: 14,
  },

  // ── Info Row ──────────────────────────
  infoRow: {
    flexDirection:     'row',
    justifyContent:    'space-between',
    alignItems:        'center',
    paddingVertical:   8,
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
  },
  infoLabel: {
    fontSize:   12,
    color:      C.muted,
    fontWeight: '500',
  },
  infoValue: {
    fontSize:   13,
    fontWeight: '700',
  },
});