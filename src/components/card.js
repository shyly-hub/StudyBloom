

import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C } from '../theme';

// ── Standard Card ─────────────────────────

export function Card({ children, style = {}, onPress }) {
  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.72 : 1}
      onPress={onPress}
      style={[styles.card, style]}
    >
      {children}
    </TouchableOpacity>
  );
}

// ── Gradient Card ─────────────────────────

export function GradientCard({
  children,
  colors  = [C.blue, C.blueDark],
  style   = {},
  onPress,
}) {
  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.85 : 1}
      onPress={onPress}
      style={[styles.gradientCardWrapper, style]}
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientCard}
      >
        {children}
      </LinearGradient>
    </TouchableOpacity>
  );
}

// ── Stat Card ─────────────────────────────

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
      style={[styles.statCard, style]}
    >
      {/* Colored top bar accent */}
      <View style={[styles.statAccent, { backgroundColor: color }]} />

      <View style={styles.statContent}>
        <Text style={[styles.statValue, { color }]}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
        {sublabel && (
          <Text style={styles.statSublabel}>{sublabel}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ── List Card ─────────────────────────────

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
      style={[styles.listCard, style]}
    >
      {/* Left accent bar */}
      <View style={[styles.listAccent, { backgroundColor: accentColor }]} />
      <View style={styles.listContent}>
        {children}
      </View>
    </TouchableOpacity>
  );
}

// ── Info Row ──────────────────────────────

export function InfoRow({ label, value, valueColor = C.text }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, { color: valueColor }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({

  // ── Card ──────────────────────────────
  card: {
    backgroundColor: '#ffffff',
    borderRadius:    16,
    padding:         16,
    marginBottom:    12,

    // Layered shadow for depth
    shadowColor:   '#1e3a5f',
    shadowOffset:  { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius:  12,
    elevation:     3,

    borderWidth: 1,
    borderColor: '#f1f5f9',
  },

  // ── Gradient Card ─────────────────────
  gradientCardWrapper: {
    borderRadius: 20,
    marginBottom: 12,
    shadowColor:  '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius:  16,
    elevation:    6,
  },
  gradientCard: {
    borderRadius: 20,
    padding:      20,
  },

  // ── Stat Card ─────────────────────────
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius:    16,
    overflow:        'hidden',
    marginBottom:    12,

    shadowColor:   '#1e3a5f',
    shadowOffset:  { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius:  10,
    elevation:     2,

    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  statAccent: {
    height: 4,
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
    fontSize:   12,
    color:      '#64748b',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  statSublabel: {
    fontSize:   11,
    color:      '#94a3b8',
    marginTop:  2,
  },

  // ── List Card ─────────────────────────
  listCard: {
    backgroundColor: '#ffffff',
    borderRadius:    14,
    marginBottom:    10,
    flexDirection:   'row',
    overflow:        'hidden',

    shadowColor:   '#1e3a5f',
    shadowOffset:  { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius:  8,
    elevation:     2,

    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  listAccent: {
    width:        4,
    borderRadius: 0,
  },
  listContent: {
    flex:    1,
    padding: 14,
  },

  // ── Info Row ──────────────────────────
  infoRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  infoLabel: {
    fontSize:   13,
    color:      '#94a3b8',
    fontWeight: '500',
  },
  infoValue: {
    fontSize:   13,
    fontWeight: '700',
  },
});