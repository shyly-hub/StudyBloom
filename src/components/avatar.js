

import React, { useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C } from '../themes/colors';

// Warm pastel gradient pool
const GRADIENTS = [
  ['#f5aa70','#f0a0b8'],  // peach → pink
  ['#c0a0e0','#7ba8f0'],  // lavender → blue
  ['#7dd4b0','#7ba8f0'],  // mint → blue
  ['#f5c842','#f5aa70'],  // yellow → peach
  ['#f0a0b8','#c0a0e0'],  // pink → lavender
  ['#7ba8f0','#7dd4b0'],  // blue → mint
  ['#f5aa70','#f5c842'],  // peach → yellow
  ['#c0a0e0','#7dd4b0'],  // lavender → mint
];

function getGradient(name = 'U') {
  return GRADIENTS[(name.charCodeAt(0) || 0) % GRADIENTS.length];
}

function getInitials(name = 'U') {
  return name.split(' ').map(w => w[0] || '').join('').toUpperCase().slice(0, 2) || '?';
}

function getRank(score = 0) {
  if (score >= 80) return { label: 'S', bg: C.yellow,     text: '#2a2000' };
  if (score >= 60) return { label: 'A', bg: C.mint,       text: '#fff' };
  if (score >= 40) return { label: 'B', bg: C.peach,      text: '#fff' };
  return                   { label: 'C', bg: C.bgRaised,  text: C.muted };
}

// ── Single Avatar ─────────────────────────
export function Avatar({
  name       = 'U',
  image      = null,
  size       = 44,
  score      = null,
  showStatus = false,
  online     = false,
  style      = {},
}) {
  const [imgErr, setImgErr] = useState(false);
  const [g0, g1]  = getGradient(name);
  const initials  = getInitials(name);
  const fontSize  = Math.floor(size * 0.33);
  const showRank  = score !== null;
  const rank      = showRank ? getRank(score) : null;
  const dotSize   = Math.floor(size * 0.28);

  const inner = (image && !imgErr) ? (
    <Image
      source={{ uri: image }}
      style={{ width: size, height: size, borderRadius: size / 2 }}
      onError={() => setImgErr(true)}
    />
  ) : (
    <LinearGradient
      colors={[g0, g1]}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' }}
    >
      <Text style={{ color: '#fff', fontSize, fontWeight: '700', letterSpacing: 0.5 }}>
        {initials}
      </Text>
    </LinearGradient>
  );

  return (
    <View style={[{ width: size, height: size }, style]}>
      {inner}

      {/* Rank badge */}
      {showRank && (
        <View style={{
          position: 'absolute', bottom: -2, right: -2,
          paddingHorizontal: 5, paddingVertical: 1,
          borderRadius: 8, backgroundColor: rank.bg,
          borderWidth: 1.5, borderColor: C.card,
          minWidth: Math.floor(size * 0.4), alignItems: 'center',
        }}>
          <Text style={{ fontSize: Math.floor(size * 0.13), fontWeight: '800', color: rank.text, letterSpacing: 0.3 }}>
            {rank.label}
          </Text>
        </View>
      )}

      {/* Status dot */}
      {showStatus && !showRank && (
        <View style={[s.dot, {
          width: dotSize, height: dotSize, borderRadius: dotSize / 2,
          backgroundColor: online ? C.green : C.muted,
          borderColor: C.card,
        }]} />
      )}
    </View>
  );
}

// ── Avatar Group ──────────────────────────
export function AvatarGroup({ names = [], size = 32, max = 3 }) {
  const shown = names.slice(0, max);
  const extra = names.length - max;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {shown.map((name, i) => (
        <View key={`${name}-${i}`} style={{ marginLeft: i === 0 ? 0 : -(size * 0.3), zIndex: shown.length - i, borderRadius: size / 2, borderWidth: 2, borderColor: C.card }}>
          <Avatar name={name} size={size} />
        </View>
      ))}
      {extra > 0 && (
        <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: C.bgRaised, alignItems: 'center', justifyContent: 'center', marginLeft: -(size * 0.3), borderWidth: 2, borderColor: C.card }}>
          <Text style={{ fontSize: Math.floor(size * 0.28), fontWeight: '700', color: C.muted }}>+{extra}</Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  dot: { position: 'absolute', bottom: 0, right: 0, borderWidth: 2 },
});