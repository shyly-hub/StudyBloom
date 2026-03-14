
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { C } from '../themes/colors';
import { sColor, sBg } from '../themes/constants';

export function Badge({ subject, size = 'md' }) {
  const sm = size === 'sm';
  return (
    <View style={[s.badge, { backgroundColor: sBg(subject), borderColor: sColor(subject) + '60' }, sm && s.badgeSm]}>
      <View style={[s.dot, { backgroundColor: sColor(subject) }]} />
      <Text style={[s.badgeText, { color: sColor(subject) }, sm && s.badgeTextSm]}>{subject}</Text>
    </View>
  );
}

export function StatusBadge({ completed }) {
  const color = completed ? C.green : C.red;
  const bg    = completed ? C.greenSoft : C.redSoft;
  return (
    <View style={[s.status, { backgroundColor: bg, borderColor: color + '60' }]}>
      <View style={[s.statusDot, { backgroundColor: color }]} />
      <Text style={[s.statusText, { color }]}>{completed ? 'Completed' : 'Quit Early'}</Text>
    </View>
  );
}

export function ScoreBadge({ score }) {
  const color = score >= 80 ? C.blueDark : score >= 60 ? '#3bb88a' : score >= 40 ? C.orange : C.red;
  const bg    = score >= 80 ? C.blueSoft : score >= 60 ? C.greenSoft : score >= 40 ? C.orangeSoft : C.redSoft;
  return (
    <View style={[s.scoreBadge, { backgroundColor: bg, borderColor: color + '60' }]}>
      <Text style={[s.scoreText, { color }]}>{score}</Text>
    </View>
  );
}

export function RankBadge({ score = 0 }) {
  const label = score >= 80 ? 'S' : score >= 60 ? 'A' : score >= 40 ? 'B' : 'C';
  const color = score >= 80 ? C.blueDark : score >= 60 ? '#3bb88a' : score >= 40 ? C.orange : C.muted;
  const bg    = score >= 80 ? C.blueSoft : score >= 60 ? C.greenSoft : score >= 40 ? C.orangeSoft : C.bgRaised;
  return (
    <View style={[s.rankBadge, { backgroundColor: bg, borderColor: color + '60' }]}>
      <Text style={[s.rankText, { color }]}>RANK {label}</Text>
    </View>
  );
}

export function Tag({ label, color = null }) {
  return (
    <View style={[s.tag, color && { backgroundColor: color + '18', borderColor: color + '50' }]}>
      <Text style={[s.tagText, color && { color }]}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  badge:      { flexDirection:'row', alignItems:'center', gap:5, borderRadius:20, paddingVertical:5, paddingHorizontal:11, alignSelf:'flex-start', borderWidth:1 },
  badgeSm:    { paddingVertical:3, paddingHorizontal:8 },
  dot:        { width:6, height:6, borderRadius:3 },
  badgeText:  { fontSize:12, fontWeight:'700', letterSpacing:0.2 },
  badgeTextSm:{ fontSize:10 },
  status:     { flexDirection:'row', alignItems:'center', gap:5, borderRadius:20, paddingVertical:4, paddingHorizontal:10, alignSelf:'flex-start', borderWidth:1 },
  statusDot:  { width:6, height:6, borderRadius:3 },
  statusText: { fontSize:11, fontWeight:'700', letterSpacing:0.2 },
  scoreBadge: { borderRadius:10, paddingVertical:4, paddingHorizontal:10, alignSelf:'flex-start', borderWidth:1 },
  scoreText:  { fontSize:13, fontWeight:'800' },
  rankBadge:  { borderRadius:8, paddingVertical:3, paddingHorizontal:8, alignSelf:'flex-start', borderWidth:1 },
  rankText:   { fontSize:9, fontWeight:'900', letterSpacing:1.5 },
  tag:        { backgroundColor:'#f0ece0', borderRadius:6, paddingVertical:3, paddingHorizontal:8, alignSelf:'flex-start', borderWidth:1, borderColor:'#e0d8c8' },
  tagText:    { fontSize:11, color:'#7a7060', fontWeight:'600' },
});