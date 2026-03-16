
import React, { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function AnimatedRing({
  value      = 0,
  size       = 88,
  color      = '#f5c842',
  label      = '',
  C,
  strokeWidth = 7,
  delay       = 0,
}) {
  const animValue = useRef(new Animated.Value(0)).current;

  const radius     = (size - strokeWidth) / 2;
  const circumf    = 2 * Math.PI * radius;
  const clampedVal = Math.min(Math.max(value, 0), 100);

  // Animate strokeDashoffset from full (empty) to correct fill
  const strokeDashoffset = animValue.interpolate({
    inputRange:  [0, 100],
    outputRange: [circumf, circumf - (clampedVal / 100) * circumf],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    Animated.spring(animValue, {
      toValue:         clampedVal,
      useNativeDriver: false,
      tension:         40,
      friction:        8,
      delay,
    }).start();
  }, [clampedVal, delay]);

  return (
    <View style={{ alignItems: 'center', gap: 6 }}>
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={size} height={size} style={{ position: 'absolute' }}>
          {/* Track */}
          <Circle
            cx={size / 2} cy={size / 2} r={radius}
            stroke={C.border}
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Animated fill */}
          <AnimatedCircle
            cx={size / 2} cy={size / 2} r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumf}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation="-90"
            origin={`${size / 2}, ${size / 2}`}
          />
        </Svg>
        {/* Center text */}
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: size * 0.26, fontWeight: '800', color: C.text, letterSpacing: -0.5 }}>
            {clampedVal}
          </Text>
        </View>
      </View>
      {label ? (
        <Text style={{ fontSize: 11, fontWeight: '600', color: C.muted, textAlign: 'center', lineHeight: 15 }}>
          {label}
        </Text>
      ) : null}
    </View>
  );
}