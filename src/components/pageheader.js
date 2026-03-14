// src/components/pageheader.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { C } from '../themes/colors';

export function PageHeader({ title, sub, onBack, right, style = {} }) {
  return (
    <View style={[s.header, style]}>
      <View style={s.headerLeft}>
        {onBack && (
          <TouchableOpacity onPress={onBack} activeOpacity={0.75} style={s.backBtn}>
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

export function SectionTitle({ children, action, onAction, style = {} }) {
  return (
    <View style={[s.sectionRow, style]}>
      <Text style={s.sectionTitle}>{children}</Text>
      {action && <TouchableOpacity onPress={onAction} activeOpacity={0.7}><Text style={s.sectionAction}>{action}</Text></TouchableOpacity>}
    </View>
  );
}

export function ProgressBar({ value = 0, color = C.blueDark, height = 7, label = null, showValue = false, style = {} }) {
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
        <View style={{ width:`${clamped}%`, height, borderRadius:height/2, backgroundColor:color }} />
      </View>
    </View>
  );
}

export function Divider({ style = {} }) {
  return <View style={[s.divider, style]} />;
}

export function EmptyState({ title, sub, style = {} }) {
  return (
    <View style={[s.empty, style]}>
      <View style={s.emptyCircle} />
      <Text style={s.emptyTitle}>{title}</Text>
      {sub && <Text style={s.emptySub}>{sub}</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  header:      { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:24, marginTop:8 },
  headerLeft:  { flexDirection:'row', alignItems:'center', gap:12, flex:1 },
  backBtn:     { width:38, height:38, borderRadius:19, backgroundColor:C.bgRaised, alignItems:'center', justifyContent:'center', borderWidth:1, borderColor:C.border },
  backArrow:   { fontSize:18, color:C.text, fontWeight:'600' },
  headerSub:   { fontSize:9, color:C.muted, fontWeight:'700', letterSpacing:2, textTransform:'uppercase', marginBottom:3 },
  headerTitle: { fontSize:26, fontWeight:'800', color:C.text, letterSpacing:-0.5 },
  sectionRow:  { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:12 },
  sectionTitle:{ fontSize:14, fontWeight:'700', color:C.text },
  sectionAction:{ fontSize:12, color:C.blueDark, fontWeight:'600' },
  barLabelRow: { flexDirection:'row', justifyContent:'space-between', marginBottom:6 },
  barLabel:    { fontSize:11, color:C.muted, fontWeight:'600' },
  barValue:    { fontSize:11, fontWeight:'700' },
  barTrack:    { backgroundColor:C.bgAlt, overflow:'hidden', borderWidth:0.5, borderColor:C.border },
  divider:     { height:1, backgroundColor:C.border, marginVertical:12 },
  empty:       { alignItems:'center', paddingVertical:48, paddingHorizontal:32 },
  emptyCircle: { width:56, height:56, borderRadius:28, backgroundColor:C.blueSoft, borderWidth:1.5, borderColor:C.blue, marginBottom:14 },
  emptyTitle:  { fontSize:16, fontWeight:'700', color:C.text, marginBottom:5, textAlign:'center' },
  emptySub:    { fontSize:12, color:C.muted, textAlign:'center', lineHeight:18 },
});