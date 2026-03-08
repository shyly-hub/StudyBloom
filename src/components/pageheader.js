
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { C } from '../themes/colors';

// ── Page Header ───────────────────────────
// Screen top — sub label in volt caps, large bold title
//
// Usage:
// <PageHeader title="Analytics" />
// <PageHeader title="History" sub="Your past sessions" />
// <PageHeader title="Settings" onBack={() => navigation.goBack()} />
export function PageHeader({ title, sub, onBack, right, style = {} }) {
  return (
    <View style={[s.header, style]}>
      <View style={s.headerLeft}>
        {onBack && (
          <TouchableOpacity
            onPress={onBack}
            activeOpacity={0.75}
            style={s.backBtn}
          >
            <Text style={s.backArrow}>←</Text>
          </TouchableOpacity>
        )}
        <View style={{ flex: 1 }}>
          {sub && <Text style={s.headerSub}>{sub}</Text>}
          <Text style={s.headerTitle}>{title}</Text>
        </View>
      </View>
      {right && <View>{right}</View>}
    </View>
  );
}

// ── Section Title ─────────────────────────
// Volt accent bar + dark section heading
//
// Usage:
// <SectionTitle>Recent Sessions</SectionTitle>
// <SectionTitle action="See all" onAction={() => {}}>Sessions</SectionTitle>
export function SectionTitle({ children, action, onAction, style = {} }) {
  return (
    <View style={[s.sectionRow, style]}>
      <View style={s.sectionLeft}>
        <View style={s.sectionAccentBar} />
        <Text style={s.sectionTitle}>{children}</Text>
      </View>
      {action && (
        <TouchableOpacity onPress={onAction} activeOpacity={0.7}>
          <Text style={s.sectionAction}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Progress Bar ──────────────────────────
// Dark track + glow fill bar
//
// Usage:
// <ProgressBar value={72} />
// <ProgressBar value={45} color={C.mint} label="Stability" showValue />
export function ProgressBar({
  value      = 0,
  color      = C.blue,
  height     = 6,
  label      = null,
  showValue  = false,
  style      = {},
}) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <View style={[{ width: '100%' }, style]}>
      {(label || showValue) && (
        <View style={s.barLabelRow}>
          {label    && <Text style={s.barLabel}>{label}</Text>}
          {showValue && <Text style={[s.barValue, { color }]}>{clamped}%</Text>}
        </View>
      )}
      <View style={[s.barTrack, { height, borderRadius: height / 2 }]}>
        <View style={[s.barFill, {
          width:           `${clamped}%`,
          height,
          borderRadius:    height / 2,
          backgroundColor: color,
          // Glow on the fill
          shadowColor:     color,
          shadowOffset:    { width: 0, height: 0 },
          shadowOpacity:   0.5,
          shadowRadius:    5,
        }]} />
      </View>
    </View>
  );
}

// ── Divider ───────────────────────────────
// Usage: <Divider />
export function Divider({ style = {} }) {
  return <View style={[s.divider, style]} />;
}

// ── Empty State ───────────────────────────
// Dark ghost illustration placeholder
// Usage: <EmptyState title="No sessions yet" sub="Complete a focus session to see it here" />
export function EmptyState({ title, sub, style = {} }) {
  return (
    <View style={[s.empty, style]}>
      <View style={s.emptyIcon}>
        <View style={s.emptyCircle} />
        <View style={s.emptyLine} />
        <View style={[s.emptyLine, { width: 40 }]} />
      </View>
      <Text style={s.emptyTitle}>{title}</Text>
      {sub && <Text style={s.emptySub}>{sub}</Text>}
    </View>
  );
}

const s = StyleSheet.create({

  // ── Page Header ───────────────────────
  header: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginBottom:   24,
    marginTop:      8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           12,
    flex:          1,
  },
  backBtn: {
    width:           38,
    height:          38,
    borderRadius:    19,
    backgroundColor: C.bgRaised,
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     0.5,
    borderColor:     C.border,
  },
  backArrow: {
    fontSize:   18,
    color:      C.text,
    fontWeight: '600',
  },
  // Volt caps sub-label above title
  headerSub: {
    fontSize:      9,
    color:         C.blue,           // electric violet
    fontWeight:    '800',
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom:  4,
  },
  headerTitle: {
    fontSize:      28,
    fontWeight:    '800',
    color:         C.text,           // warm off-white
    letterSpacing: -0.8,
  },

  // ── Section Title ─────────────────────
  sectionRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   14,
  },
  sectionLeft: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           10,
  },
  // 3px neon volt accent bar
  sectionAccentBar: {
    width:           3,
    height:          14,
    borderRadius:    2,
    backgroundColor: C.blue,
    shadowColor:     C.blue,
    shadowOffset:    { width: 0, height: 0 },
    shadowOpacity:   0.6,
    shadowRadius:    4,
  },
  sectionTitle: {
    fontSize:   14,
    fontWeight: '700',
    color:      C.text,
  },
  sectionAction: {
    fontSize:      12,
    color:         C.blue,
    fontWeight:    '600',
    letterSpacing: 0.3,
  },

  // ── Progress Bar ──────────────────────
  barLabelRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    marginBottom:   6,
  },
  barLabel: {
    fontSize:      11,
    color:         C.muted,
    fontWeight:    '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  barValue: {
    fontSize:   11,
    fontWeight: '700',
  },
  barTrack: {
    backgroundColor: C.bgHover,     // dark track
    overflow:        'hidden',
    borderWidth:     0.5,
    borderColor:     C.border,
  },
  barFill: {
    // inline width, height, color, glow shadow
  },

  // ── Divider ───────────────────────────
  divider: {
    height:          0.5,            // hairline
    backgroundColor: C.border,
    marginVertical:  12,
  },

  // ── Empty State ───────────────────────
  empty: {
    alignItems:        'center',
    paddingVertical:   48,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    alignItems:   'center',
    marginBottom: 16,
    gap:          8,
  },
  emptyCircle: {
    width:        52,
    height:       52,
    borderRadius: 26,
    backgroundColor: C.bgRaised,
    borderWidth:  1,
    borderColor:  C.border,
  },
  emptyLine: {
    width:           64,
    height:          8,
    borderRadius:    4,
    backgroundColor: C.bgRaised,
  },
  emptyTitle: {
    fontSize:   15,
    fontWeight: '700',
    color:      C.text,
    marginBottom: 6,
    textAlign:  'center',
  },
  emptySub: {
    fontSize:   12,
    color:      C.muted,
    textAlign:  'center',
    lineHeight: 18,
  },
});