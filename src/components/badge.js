
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { sColor, sBg } from '../themes/colors';

// ── Subject Badge ─────────────────────────

export function Badge({ subject, size = 'md' }) {
  const isSmall = size === 'sm';
  return (
    <View style={[
      styles.badge,
      { backgroundColor: sBg(subject) },
      isSmall && styles.badgeSm,
    ]}>
      <View style={[styles.dot, { backgroundColor: sColor(subject) }]} />
      <Text style={[
        styles.badgeText,
        { color: sColor(subject) },
        isSmall && styles.badgeTextSm,
      ]}>
        {subject}
      </Text>
    </View>
  );
}

// ── Status Badge ──────────────────────────

export function StatusBadge({ completed }) {
  return (
    <View style={[
      styles.status,
      { backgroundColor: completed ? '#dcfce7' : '#fee2e2' }
    ]}>
      <View style={[
        styles.statusDot,
        { backgroundColor: completed ? '#16a34a' : '#dc2626' }
      ]} />
      <Text style={[
        styles.statusText,
        { color: completed ? '#15803d' : '#dc2626' }
      ]}>
        {completed ? 'Completed' : 'Quit Early'}
      </Text>
    </View>
  );
}

// ── Score Badge ───────────────────────────

export function ScoreBadge({ score }) {
  const getColor = () => {
    if (score >= 80) return { bg: '#dcfce7', text: '#15803d' };
    if (score >= 60) return { bg: '#fef9c3', text: '#a16207' };
    if (score >= 40) return { bg: '#ffedd5', text: '#c2410c' };
    return              { bg: '#fee2e2', text: '#dc2626' };
  };
  const { bg, text } = getColor();

  return (
    <View style={[styles.scoreBadge, { backgroundColor: bg }]}>
      <Text style={[styles.scoreText, { color: text }]}>{score}</Text>
    </View>
  );
}

// ── Tag ───────────────────────────────────

export function Tag({ label }) {
  return (
    <View style={styles.tag}>
      <Text style={styles.tagText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({

  // ── Badge ─────────────────────────────
  badge: {
    flexDirection:    'row',
    alignItems:       'center',
    gap:              5,
    borderRadius:     20,
    paddingVertical:  5,
    paddingHorizontal: 11,
    alignSelf:        'flex-start',
  },
  badgeSm: {
    paddingVertical:   3,
    paddingHorizontal: 8,
  },
  dot: {
    width:        6,
    height:       6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize:   12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  badgeTextSm: {
    fontSize: 10,
  },

  // ── Status Badge ──────────────────────
  status: {
    flexDirection:    'row',
    alignItems:       'center',
    gap:              5,
    borderRadius:     20,
    paddingVertical:  4,
    paddingHorizontal: 10,
    alignSelf:        'flex-start',
  },
  statusDot: {
    width:        6,
    height:       6,
    borderRadius: 3,
  },
  statusText: {
    fontSize:   11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // ── Score Badge ───────────────────────
  scoreBadge: {
    borderRadius:     10,
    paddingVertical:  4,
    paddingHorizontal: 10,
    alignSelf:        'flex-start',
  },
  scoreText: {
    fontSize:   13,
    fontWeight: '800',
  },

  // ── Tag ───────────────────────────────
  tag: {
    backgroundColor:  '#f1f5f9',
    borderRadius:     6,
    paddingVertical:  3,
    paddingHorizontal: 8,
    alignSelf:        'flex-start',
  },
  tagText: {
    fontSize:   11,
    color:      '#64748b',
    fontWeight: '600',
  },
});