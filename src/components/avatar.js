

import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';


const GRADIENTS = [
  ['#6366f1', '#8b5cf6'], // indigo-purple
  ['#ec4899', '#f43f5e'], // pink-rose
  ['#3b82f6', '#06b6d4'], // blue-cyan
  ['#10b981', '#14b8a6'], // green-teal
  ['#f59e0b', '#ef4444'], // amber-red
  ['#8b5cf6', '#d946ef'], // purple-fuchsia
  ['#0ea5e9', '#6366f1'], // sky-indigo
  ['#22c55e', '#3b82f6'], // green-blue
  ['#f97316', '#eab308'], // orange-yellow
  ['#14b8a6', '#22d3ee'], // teal-cyan
];

function getGradient(name = 'U') {
  const index = (name.charCodeAt(0) || 0) % GRADIENTS.length;
  return GRADIENTS[index];
}

function getInitials(name = 'U') {
  return name
    .split(' ')
    .map(w => w[0] || '')
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// ── Single Avatar ─────────────────────────
export function Avatar({
  name       = 'U',
  image      = null,
  size       = 44,
  showStatus = false,
  online     = false,
  style      = {},
}) {
  const [gradStart, gradEnd] = getGradient(name);
  const initials  = getInitials(name);
  const fontSize  = Math.floor(size * 0.35);
  const dotSize   = Math.floor(size * 0.27);

  return (
    <View style={[{ width: size, height: size }, style]}>

      {image ? (
        // Real profile photo
        <Image
          source={{ uri: image }}
          style={{
            width:        size,
            height:       size,
            borderRadius: size / 2,
            backgroundColor: '#e2e8f0',
          }}
          resizeMode="cover"
        />
      ) : (
        // Gradient initials — looks clean and real
        <LinearGradient
          colors={[gradStart, gradEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width:          size,
            height:         size,
            borderRadius:   size / 2,
            alignItems:     'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{
            color:         '#fff',
            fontSize,
            fontWeight:    '700',
            letterSpacing: 0.5,
          }}>
            {initials}
          </Text>
        </LinearGradient>
      )}

      {/* Online / offline status dot */}
      {showStatus && (
        <View style={[styles.dot, {
          width:           dotSize,
          height:          dotSize,
          borderRadius:    dotSize / 2,
          backgroundColor: online ? '#22c55e' : '#94a3b8',
        }]} />
      )}
    </View>
  );
}

// ── Avatar Group ──────────────────────────
// Overlapping avatars like team members
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
          borderWidth:  2.5,
          borderColor:  '#ffffff',
        }}>
          <Avatar name={name} size={size} />
        </View>
      ))}
      {extra > 0 && (
        <View style={{
          width:           size,
          height:          size,
          borderRadius:    size / 2,
          backgroundColor: '#f1f5f9',
          alignItems:      'center',
          justifyContent:  'center',
          marginLeft:      -(size * 0.3),
          borderWidth:     2.5,
          borderColor:     '#ffffff',
        }}>
          <Text style={{
            fontSize:   Math.floor(size * 0.28),
            fontWeight: '700',
            color:      '#64748b',
          }}>
            +{extra}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  dot: {
    position:    'absolute',
    bottom:      0,
    right:       0,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
});