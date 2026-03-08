

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { C } from '../themes/colors';
import { sColor, sBg } from '../themes/constants';

// ── Subject Badge ─────────────────────────
// Neon subject dot + dark translucent bg
// Usage: <Badge subject="Math" />
//        <Badge subject="Science" size="sm" />
export function Badge({ subject, size = 'md' }) {
  const isSmall = size === 'sm';
  return (
    <View style={[
      s.badge,
      { backgroundColor: sBg(subject), borderColor: sColor(subject) + '40' },
      isSmall && s.badgeSm,
    ]}>
      <View style={[s.dot, {
        backgroundColor: sColor(subject),
        shadowColor:     sColor(subject),
        shadowOffset:    { width: 0, height: 0 },
        shadowOpacity:   0.8,
        shadowRadius:    4,
      }]} />
      <Text style={[
        s.badgeText,
        { color: sColor(subject) },
        isSmall && s.badgeTextSm,
      ]}>
        {subject}
      </Text>
    </View>
  );
}

// ── Status Badge ──────────────────────────
// Completed = mint glow, Quit = ember glow
// Usage: <StatusBadge completed={session.completed} />
export function StatusBadge({ completed }) {
  const color = completed ? C.green : C.red;
  const bg    = completed ? C.greenSoft : C.redSoft;
  return (
    <View style={[s.status, { backgroundColor: bg, borderColor: color + '40' }]}>
      <View style={[s.statusDot, {
        backgroundColor: color,
        shadowColor:     color,
        shadowOffset:    { width: 0, height: 0 },
        shadowOpacity:   0.8,
        shadowRadius:    4,
      }]} />
      <Text style={[s.statusText, { color }]}>
        {completed ? 'Completed' : 'Quit Early'}
      </Text>
    </View>
  );
}

// ── Score Badge ───────────────────────────
// Colour-coded number badge by score tier
// Usage: <ScoreBadge score={72} />
export function ScoreBadge({ score }) {
  const color = score >= 80 ? C.blue   :
                score >= 60 ? C.mint   :
                score >= 40 ? C.orange : C.red;
  const bg    = score >= 80 ? C.blueSoft   :
                score >= 60 ? C.mintSoft   :
                score >= 40 ? C.orangeSoft : C.redSoft;

  return (
    <View style={[s.scoreBadge, { backgroundColor: bg, borderColor: color + '40' }]}>
      <Text style={[s.scoreText, { color }]}>{score}</Text>
    </View>
  );
}

// ── Rank Badge ────────────────────────────
// S / A / B / C tier label — RPG rank system
// Usage: <RankBadge score={72} />
export function RankBadge({ score = 0 }) {
  const label = score >= 80 ? 'S' : score >= 60 ? 'A' : score >= 40 ? 'B' : 'C';
  const color = score >= 80 ? C.blue   :
                score >= 60 ? C.mint   :
                score >= 40 ? C.orange : C.muted;
  return (
    <View style={[s.rankBadge, { backgroundColor: color + '1a', borderColor: color + '55' }]}>
      <Text style={[s.rankText, { color }]}>RANK {label}</Text>
    </View>
  );
}

// ── Tag ───────────────────────────────────
// Generic muted pill for misc labels
// Usage: <Tag label="Night Owl" />
//        <Tag label="Math" color={C.purple} />
export function Tag({ label, color = null }) {
  return (
    <View style={[
      s.tag,
      color && { backgroundColor: color + '18', borderColor: color + '40' },
    ]}>
      <Text style={[s.tagText, color && { color }]}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({

  // ── Subject Badge ─────────────────────
  badge: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               5,
    borderRadius:      20,
    paddingVertical:   5,
    paddingHorizontal: 11,
    alignSelf:         'flex-start',
    borderWidth:       0.5,
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
    fontSize:      12,
    fontWeight:    '700',
    letterSpacing: 0.2,
  },
  badgeTextSm: {
    fontSize: 10,
  },

  // ── Status Badge ──────────────────────
  status: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               5,
    borderRadius:      20,
    paddingVertical:   4,
    paddingHorizontal: 10,
    alignSelf:         'flex-start',
    borderWidth:       0.5,
  },
  statusDot: {
    width:        6,
    height:       6,
    borderRadius: 3,
  },
  statusText: {
    fontSize:      11,
    fontWeight:    '700',
    letterSpacing: 0.2,
  },

  // ── Score Badge ───────────────────────
  scoreBadge: {
    borderRadius:      10,
    paddingVertical:   4,
    paddingHorizontal: 10,
    alignSelf:         'flex-start',
    borderWidth:       0.5,
  },
  scoreText: {
    fontSize:   13,
    fontWeight: '800',
  },

  // ── Rank Badge ────────────────────────
  rankBadge: {
    borderRadius:      6,
    paddingVertical:   3,
    paddingHorizontal: 8,
    alignSelf:         'flex-start',
    borderWidth:       0.5,
  },
  rankText: {
    fontSize:      9,
    fontWeight:    '900',
    letterSpacing: 2,
  },

  // ── Tag ───────────────────────────────
  tag: {
    backgroundColor:   C.bgHover,
    borderRadius:      6,
    paddingVertical:   3,
    paddingHorizontal: 8,
    alignSelf:         'flex-start',
    borderWidth:       0.5,
    borderColor:       C.border,
  },
  tagText: {
    fontSize:   11,
    color:      C.muted,
    fontWeight: '600',
  },
});