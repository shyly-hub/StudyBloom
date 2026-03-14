

import React, { useRef } from 'react';
import { TouchableOpacity, Text, View, StyleSheet, ActivityIndicator, Animated, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C } from '../themes/colors';

function SpringPress({ onPress, children, style, disabled }) {
  const scale = useRef(new Animated.Value(1)).current;
  const down  = () => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, tension: 400, friction: 20 }).start();
  const up    = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, tension: 300, friction: 15 }).start();
  if (disabled) return <View style={style}>{children}</View>;
  return (
    <Pressable onPressIn={down} onPressOut={up} onPress={onPress}>
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

export function PrimaryButton({ label, onPress, loading = false, disabled = false, colors = [C.blue, C.blueDark], style = {} }) {
  return (
    <SpringPress onPress={onPress} disabled={disabled || loading} style={[s.primaryWrapper, style]}>
      <LinearGradient
        colors={disabled ? [C.subtext, C.muted] : ['#f5c842','#e8b020']}
        start={{ x:0, y:0 }} end={{ x:1, y:0 }}
        style={s.primaryBtn}
      >
        {loading ? <ActivityIndicator color="#2a2000" size="small" /> : <Text style={s.primaryText}>{label}</Text>}
      </LinearGradient>
    </SpringPress>
  );
}

export function SecondaryButton({ label, onPress, color = C.blueDark, style = {} }) {
  return (
    <SpringPress onPress={onPress} style={style}>
      <View style={[s.secondaryBtn, { borderColor: color }]}>
        <Text style={[s.secondaryText, { color }]}>{label}</Text>
      </View>
    </SpringPress>
  );
}

export function PillButton({ label, active = false, color = C.blueDark, onPress, style = {} }) {
  return (
    <SpringPress onPress={onPress} style={style}>
      <View style={[
        s.pill,
        active ? { backgroundColor: C.blueSoft, borderColor: C.blueDark } : { backgroundColor: C.bgRaised, borderColor: C.border },
      ]}>
        <Text style={[s.pillText, { color: active ? '#6a4800' : C.muted }]}>{label}</Text>
      </View>
    </SpringPress>
  );
}

export function FilterTabs({ options = [], active, onChange, color = C.blueDark }) {
  return (
    <View style={s.filterRow}>
      {options.map(opt => (
        <PillButton key={opt} label={opt} active={active === opt} color={color} onPress={() => onChange(opt)} style={s.filterTab} />
      ))}
    </View>
  );
}

export function IconButton({ icon, onPress, size = 40, color = C.text, bg = C.bgRaised, style = {} }) {
  return (
    <SpringPress onPress={onPress} style={style}>
      <View style={{ width:size, height:size, borderRadius:size/2, backgroundColor:bg, alignItems:'center', justifyContent:'center', borderWidth:1.5, borderColor:C.border }}>
        <Text style={{ fontSize:size*0.42, color, fontWeight:'700' }}>{icon}</Text>
      </View>
    </SpringPress>
  );
}

const s = StyleSheet.create({
  primaryWrapper: { borderRadius:14, shadowColor:'rgba(245,200,66,0.45)', shadowOffset:{width:0,height:5}, shadowOpacity:1, shadowRadius:14, elevation:6 },
  primaryBtn:     { height:54, borderRadius:14, alignItems:'center', justifyContent:'center', paddingHorizontal:24 },
  primaryText:    { color:'#2a2000', fontSize:15, fontWeight:'800', letterSpacing:0.3 },
  secondaryBtn:   { height:52, borderRadius:14, borderWidth:1.5, alignItems:'center', justifyContent:'center', paddingHorizontal:24, backgroundColor:'transparent' },
  secondaryText:  { fontSize:14, fontWeight:'700' },
  pill:           { paddingVertical:8, paddingHorizontal:18, borderRadius:24, borderWidth:1.5 },
  pillText:       { fontSize:12, fontWeight:'700', letterSpacing:0.2 },
  filterRow:      { flexDirection:'row', gap:8, flexWrap:'wrap' },
  filterTab:      { marginBottom:0 },
});