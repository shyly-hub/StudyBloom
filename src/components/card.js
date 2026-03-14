// src/components/card.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C } from '../themes/colors';

export function Card({ children, style = {}, onPress }) {
  return (
    <TouchableOpacity activeOpacity={onPress ? 0.75 : 1} onPress={onPress} style={[s.card, style]}>
      {children}
    </TouchableOpacity>
  );
}

export function GradientCard({ children, colors = ['#f5c842','#f5aa70'], style = {}, onPress }) {
  return (
    <TouchableOpacity activeOpacity={onPress ? 0.85 : 1} onPress={onPress} style={[s.gradientWrapper, style]}>
      <LinearGradient colors={colors} start={{ x:0, y:0 }} end={{ x:1, y:1 }} style={s.gradientInner}>
        {children}
      </LinearGradient>
    </TouchableOpacity>
  );
}

export function StatCard({ value, label, color = C.blueDark, sublabel = null, style = {}, onPress }) {
  return (
    <TouchableOpacity activeOpacity={onPress ? 0.75 : 1} onPress={onPress} style={[s.statCard, style]}>
      <View style={[s.statAccent, { backgroundColor: color }]} />
      <View style={s.statContent}>
        <Text style={[s.statValue, { color }]}>{value}</Text>
        <Text style={s.statLabel}>{label}</Text>
        {sublabel && <Text style={s.statSublabel}>{sublabel}</Text>}
      </View>
    </TouchableOpacity>
  );
}

export function ListCard({ children, accentColor = C.blueDark, style = {}, onPress }) {
  return (
    <TouchableOpacity activeOpacity={onPress ? 0.75 : 1} onPress={onPress} style={[s.listCard, style]}>
      <View style={[s.listAccent, { backgroundColor: accentColor }]} />
      <View style={s.listContent}>{children}</View>
    </TouchableOpacity>
  );
}

export function InfoRow({ label, value, valueColor = C.text }) {
  return (
    <View style={s.infoRow}>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={[s.infoValue, { color: valueColor }]}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: C.card, borderRadius:18, padding:16, marginBottom:12,
    borderWidth:1, borderColor: C.border,
    shadowColor:'rgba(26,20,10,0.08)', shadowOffset:{width:0,height:2}, shadowOpacity:1, shadowRadius:12, elevation:3,
  },
  gradientWrapper: { borderRadius:20, marginBottom:12, shadowColor:'rgba(245,200,66,0.3)', shadowOffset:{width:0,height:4}, shadowOpacity:1, shadowRadius:16, elevation:6 },
  gradientInner:   { borderRadius:20, padding:20 },
  statCard: { backgroundColor:C.card, borderRadius:16, overflow:'hidden', marginBottom:12, borderWidth:1, borderColor:C.border, shadowColor:'rgba(26,20,10,0.06)', shadowOffset:{width:0,height:2}, shadowOpacity:1, shadowRadius:10, elevation:2 },
  statAccent:  { height:4, width:'100%' },
  statContent: { padding:14 },
  statValue:   { fontSize:28, fontWeight:'800', letterSpacing:-0.5, marginBottom:2 },
  statLabel:   { fontSize:11, color:C.muted, fontWeight:'600', letterSpacing:0.5, textTransform:'uppercase' },
  statSublabel:{ fontSize:11, color:C.subtext, marginTop:2 },
  listCard:   { backgroundColor:C.card, borderRadius:14, marginBottom:10, flexDirection:'row', overflow:'hidden', borderWidth:1, borderColor:C.border, shadowColor:'rgba(26,20,10,0.06)', shadowOffset:{width:0,height:2}, shadowOpacity:1, shadowRadius:8, elevation:2 },
  listAccent: { width:4 },
  listContent:{ flex:1, padding:14 },
  infoRow:    { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingVertical:8, borderBottomWidth:1, borderBottomColor:C.border },
  infoLabel:  { fontSize:12, color:C.muted, fontWeight:'500' },
  infoValue:  { fontSize:13, fontWeight:'700' },
});