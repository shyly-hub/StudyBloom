

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C } from '../themes/colors';

// Gradient pool — all vivid, all readable on void black
const GRADIENTS = [
  ['#5b3fd4', '#9b5cfc'],  // deep violet → electric violet
  ['#ff4d6d', '#ff6b9d'],  // ember → hot pink
  ['#0055ff', '#00e5a0'],  // electric blue → mint
  ['#ff9a3c', '#ffd60a'],  // orange → neon yellow
  ['#00e5a0', '#0055ff'],  // mint → electric blue
  ['#b07ef8', '#ff6b9d'],  // light violet → pink
  ['#ff6b9d', '#ff9a3c'],  // pink → orange
  ['#9b5cfc', '#00e5a0'],  // volt → mint
  ['#ffd60a', '#ff9a3c'],  // yellow → orange
  ['#00e5a0', '#9b5cfc'],  // mint → volt
];

function getGradient(name = 'U') {
  return GRADIENTS[(name.charCodeAt(0) || 0) % GRADIENTS.length];
}

function getInitials(name = 'U') {
  return name
    .split(' ')
    .map(w => w[0] || '')
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';
}

// S/A/B/C rank from score — matches Solo Leveling rank system
function getRank(score = 0) {
  if (score >= 80) return { label: 'S', color: C.blue    };
  if (score >= 60) return { label: 'A', color: C.mint    };
  if (score >= 40) return { label: 'B', color: C.orange  };
  return                   { label: 'C', color: C.muted  };
}

// ── Single Avatar ─────────────────────────
export function Avatar({
  name       = 'U',
  image      = null,
  size       = 44,
  score      = null,    // if provided: shows glow ring + rank badge
  glow       = false,   // breathing glow halo without rank
  showStatus = false,   // online indicator dot (legacy support)
  online     = false,
  style      = {},
}) {
  const [imgErr, setImgErr] = useState(false);
  const pulse = useRef(new Animated.Value(1)).current;

  const hasRing   = score !== null || glow;
  const rank      = score !== null ? getRank(score) : null;
  const [g0, g1]  = getGradient(name);
  const initials  = getInitials(name);
  const fontSize  = Math.floor(size * 0.33);

  // Breathing halo animation
  useEffect(() => {
    if (!hasRing) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.12, duration: 2200, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,    duration: 2200, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [hasRing]);

  const showPhoto = image && !imgErr;
  const ringSize  = size + 8;     // border ring is 4px larger each side
  const wrapSize  = hasRing ? ringSize + 16 : size;  // extra room for glow

  const avatarInner = showPhoto ? (
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
      <Text style={{ color: '#fff', fontSize, fontWeight: '800', letterSpacing: 0.5 }}>
        {initials}
      </Text>
    </LinearGradient>
  );

  if (!hasRing) {
    // Simple avatar — no ring, legacy showStatus dot
    return (
      <View style={[{ width: size, height: size }, style]}>
        {avatarInner}
        {showStatus && (
          <View style={[s.statusDot, {
            width:           Math.floor(size * 0.27),
            height:          Math.floor(size * 0.27),
            borderRadius:    Math.floor(size * 0.135),
            backgroundColor: online ? C.mint : C.muted,
          }]} />
        )}
      </View>
    );
  }

  // Glow ring avatar
  return (
    <View style={[{ width: wrapSize, height: wrapSize, alignItems: 'center', justifyContent: 'center' }, style]}>

      {/* Breathing glow halo */}
      <Animated.View style={{
        position:        'absolute',
        width:           ringSize + 14,
        height:          ringSize + 14,
        borderRadius:    (ringSize + 14) / 2,
        backgroundColor: C.glow,
        transform:       [{ scale: pulse }],
      }} />

      {/* Volt border ring */}
      <View style={{
        width:          ringSize,
        height:         ringSize,
        borderRadius:   ringSize / 2,
        borderWidth:    1.5,
        borderColor:    rank ? rank.color : C.blue,
        alignItems:     'center',
        justifyContent: 'center',
      }}>
        {avatarInner}
      </View>

      {/* Rank badge */}
      {rank && (
        <View style={{
          position:        'absolute',
          bottom:          2,
          right:           2,
          width:           Math.floor(size * 0.35),
          height:          Math.floor(size * 0.35),
          borderRadius:    Math.floor(size * 0.175),
          backgroundColor: rank.color,
          borderWidth:     2,
          borderColor:     C.bg,
          alignItems:      'center',
          justifyContent:  'center',
        }}>
          <Text style={{ fontSize: Math.floor(size * 0.135), fontWeight: '900', color: '#fff' }}>
            {rank.label}
          </Text>
        </View>
      )}
    </View>
  );
}

// ── Avatar Group ──────────────────────────
// Overlapping stacked avatars — dark bg borders
// Usage: <AvatarGroup names={['Mey','Liza','B Rom']} size={32} max={3} />
export function AvatarGroup({ names = [], size = 32, max = 3 }) {
  const shown = names.slice(0, max);
  const extra = names.length - max;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {shown.map((name, i) => (
        <View key={`${name}-${i}`} style={{
          marginLeft:   i === 0 ? 0 : -(size * 0.3),
          zIndex:       shown.length - i,
          borderRadius: size / 2,
          borderWidth:  2,
          borderColor:  C.bg,   // void bg border instead of white
        }}>
          <Avatar name={name} size={size} />
        </View>
      ))}
      {extra > 0 && (
        <View style={{
          width:           size,
          height:          size,
          borderRadius:    size / 2,
          backgroundColor: C.bgRaised,
          alignItems:      'center',
          justifyContent:  'center',
          marginLeft:      -(size * 0.3),
          borderWidth:     2,
          borderColor:     C.bg,
        }}>
          <Text style={{
            fontSize:   Math.floor(size * 0.28),
            fontWeight: '700',
            color:      C.muted,
          }}>
            +{extra}
          </Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  statusDot: {
    position:    'absolute',
    bottom:      0,
    right:       0,
    borderWidth: 2,
    borderColor: C.bg,   // dark border instead of white
  },
});