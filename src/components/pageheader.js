
//  Usage:
//  import { PageHeader, SectionTitle, ProgressBar } from '../components'
// ══════════════════════════════════════════

import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
} from 'react-native';
import { C } from '../themes/colors';

// ── Page Header ───────────────────────────
// Screen title at the top of every screen
//
// Usage:
// <PageHeader title="Analytics" />
// <PageHeader title="History" sub="Your past sessions" />
// <PageHeader title="Settings" onBack={() => navigation.goBack()} />
export function PageHeader({ title, sub, onBack, right, style = {} }) {
  return (
    <View style={[styles.header, style]}>
      <View style={styles.headerLeft}>
        {onBack && (
          <TouchableOpacity
            onPress={onBack}
            activeOpacity={0.75}
            style={styles.backBtn}
          >
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
        )}
        <View style={{ flex: 1 }}>
          {sub && <Text style={styles.headerSub}>{sub}</Text>}
          <Text style={styles.headerTitle}>{title}</Text>
        </View>
      </View>
      {right && <View>{right}</View>}
    </View>
  );
}

// ── Section Title ─────────────────────────
// Bold header for sections inside a screen
//
// Usage:
// <SectionTitle>Recent Sessions</SectionTitle>
// <SectionTitle action="See all" onAction={() => {}}>Sessions</SectionTitle>
export function SectionTitle({ children, action, onAction, style = {} }) {
  return (
    <View style={[styles.sectionRow, style]}>
      <Text style={styles.sectionTitle}>{children}</Text>
      {action && (
        <TouchableOpacity onPress={onAction} activeOpacity={0.7}>
          <Text style={styles.sectionAction}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Progress Bar ──────────────────────────
// Clean horizontal fill bar with label
//
// Usage:
// <ProgressBar value={72} />
// <ProgressBar value={45} color={C.mint} label="Focus Stability" showValue />
export function ProgressBar({
  value      = 0,          // 0 to 100
  color      = C.blue,
  height     = 8,
  label      = null,
  showValue  = false,
  style      = {},
}) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <View style={[{ width: '100%' }, style]}>
      {(label || showValue) && (
        <View style={styles.barLabelRow}>
          {label && <Text style={styles.barLabel}>{label}</Text>}
          {showValue && (
            <Text style={[styles.barValue, { color }]}>{clamped}%</Text>
          )}
        </View>
      )}
      <View style={[styles.barTrack, { height, borderRadius: height / 2 }]}>
        <View style={[
          styles.barFill,
          {
            width:        `${clamped}%`,
            height,
            borderRadius: height / 2,
            backgroundColor: color,
          }
        ]} />
      </View>
    </View>
  );
}

// ── Divider ───────────────────────────────
// Thin line to separate sections
// Usage: <Divider />
//        <Divider style={{ marginVertical: 16 }} />
export function Divider({ style = {} }) {
  return <View style={[styles.divider, style]} />;
}

// ── Empty State ───────────────────────────
// Shown when a list has no items
//
// Usage:
// <EmptyState title="No sessions yet" sub="Complete a focus session to see it here" />
export function EmptyState({ title, sub, style = {} }) {
  return (
    <View style={[styles.empty, style]}>
      <View style={styles.emptyIcon}>
        <View style={styles.emptyCircle} />
        <View style={styles.emptyLine} />
        <View style={[styles.emptyLine, { width: 40 }]} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {sub && <Text style={styles.emptySub}>{sub}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({

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
    backgroundColor: '#f1f5f9',
    alignItems:      'center',
    justifyContent:  'center',
  },
  backArrow: {
    fontSize:   18,
    color:      '#1e293b',
    fontWeight: '600',
  },
  headerSub: {
    fontSize:      12,
    color:         '#94a3b8',
    fontWeight:    '500',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom:  2,
  },
  headerTitle: {
    fontSize:      22,
    fontWeight:    '800',
    color:         '#0f172a',
    letterSpacing: -0.3,
  },

  // ── Section Title ─────────────────────
  sectionRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   14,
  },
  sectionTitle: {
    fontSize:   16,
    fontWeight: '700',
    color:      '#0f172a',
  },
  sectionAction: {
    fontSize:   13,
    color:      C.blue,
    fontWeight: '600',
  },

  // ── Progress Bar ──────────────────────
  barLabelRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    marginBottom:   6,
  },
  barLabel: {
    fontSize:   12,
    color:      '#64748b',
    fontWeight: '600',
  },
  barValue: {
    fontSize:   12,
    fontWeight: '700',
  },
  barTrack: {
    backgroundColor: '#f1f5f9',
    overflow:        'hidden',
  },
  barFill: {
    // width and height set inline
  },

  // ── Divider ───────────────────────────
  divider: {
    height:          1,
    backgroundColor: '#f1f5f9',
    marginVertical:  12,
  },

  // ── Empty State ───────────────────────
  empty: {
    alignItems:   'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    alignItems:   'center',
    marginBottom: 16,
    gap:          8,
  },
  emptyCircle: {
    width:           52,
    height:          52,
    borderRadius:    26,
    backgroundColor: '#f1f5f9',
    borderWidth:     2,
    borderColor:     '#e2e8f0',
  },
  emptyLine: {
    width:           64,
    height:          8,
    borderRadius:    4,
    backgroundColor: '#f1f5f9',
  },
  emptyTitle: {
    fontSize:   16,
    fontWeight: '700',
    color:      '#334155',
    marginBottom: 6,
    textAlign:  'center',
  },
  emptySub: {
    fontSize:  13,
    color:     '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
  },
});