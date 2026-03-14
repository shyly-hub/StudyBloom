
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity,
  TextInput, ScrollView, Animated, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme }       from '../../context/ThemeContext';

const { height } = Dimensions.get('window');

const DISTRACTION_OPTIONS = [
  { label: 'Phone',        icon: '📱', color: '#f43f5e', bg: '#fff1f2' },
  { label: 'Social Media', icon: '💬', color: '#8b5cf6', bg: '#f5f3ff' },
  { label: 'Overthinking', icon: '🌀', color: '#f97316', bg: '#fff7ed' },
  { label: 'Tired',        icon: '😴', color: '#6366f1', bg: '#eef2ff' },
  { label: 'Noise',        icon: '🔊', color: '#eab308', bg: '#fefce8' },
  { label: 'People',       icon: '👥', color: '#10b981', bg: '#f0fdf4' },
  { label: 'Hunger',       icon: '🍕', color: '#f59e0b', bg: '#fffbeb' },
  { label: 'Other',        icon: '❓', color: '#94a3b8', bg: '#f8fafc' },
];

// In dark mode the option backgrounds need to be translucent
function getDarkBg(color) { return color + '20'; }

export default function DistractionScreen({ navigation, route }) {
  const { C, dark } = useTheme();
  const { onAdd }   = route?.params || {};

  const [selected, setSelected] = useState(null);
  const [severity, setSeverity] = useState(3);
  const [note,     setNote]     = useState('');
  const [elapsed,  setElapsed]  = useState(0);

  const slideAnim = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }).start();
  }, []);

  useEffect(() => {
    const t = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const handleResume = () => {
    if (selected) {
      onAdd?.({ type: selected.label, severity, note: note.trim(), timestamp: new Date().toISOString() });
    }
    navigation.goBack();
  };

  const formatElapsed = (s) => {
    const m = Math.floor(s / 60);
    return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
      <TouchableOpacity style={{ ...{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } }} onPress={handleResume} activeOpacity={1} />

      <Animated.View style={{ backgroundColor: C.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 24, paddingBottom: 40, maxHeight: height * 0.88, transform: [{ translateY: slideAnim }] }}>

        {/* Handle */}
        <View style={{ width: 44, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginTop: 12, marginBottom: 20 }} />

        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <View>
            <Text style={{ fontSize: 20, fontWeight: '800', color: C.text, marginBottom: 4 }}>What distracted you?</Text>
            <Text style={{ fontSize: 13, color: C.muted }}>Paused for {formatElapsed(elapsed)}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 20, paddingVertical: 6, paddingHorizontal: 12, backgroundColor: C.orangeSoft }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.orange }} />
            <Text style={{ fontSize: 11, fontWeight: '800', letterSpacing: 1, color: C.orange }}>PAUSED</Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>

          {/* Grid */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 }}>
            {DISTRACTION_OPTIONS.map(opt => {
              const isSelected = selected?.label === opt.label;
              const bg = dark ? getDarkBg(opt.color) : (isSelected ? opt.color : opt.bg);
              return (
                <TouchableOpacity
                  key={opt.label}
                  onPress={() => setSelected(isSelected ? null : opt)}
                  activeOpacity={0.8}
                  style={{ width: '22%', aspectRatio: 1, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: bg, borderWidth: isSelected ? 2 : 1, borderColor: isSelected ? opt.color : C.border, position: 'relative' }}
                >
                  <Text style={{ fontSize: 24 }}>{opt.icon}</Text>
                  <Text style={{ fontSize: 10, fontWeight: '700', textAlign: 'center', color: isSelected ? (dark ? opt.color : '#fff') : opt.color }}>{opt.label}</Text>
                  {isSelected && (
                    <View style={{ position: 'absolute', top: 6, right: 6, width: 16, height: 16, borderRadius: 8, backgroundColor: opt.color, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 9, color: '#fff', fontWeight: '800' }}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Severity */}
          {selected && (
            <View style={{ marginTop: 20, marginBottom: 4 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 14 }}>How bad was it?</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                {[1,2,3,4,5].map(n => (
                  <TouchableOpacity key={n} onPress={() => setSeverity(n)}
                    style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: n <= severity ? (selected?.color || C.blue) : C.border, transform: [{ scale: n === severity ? 1.3 : 1 }] }}
                  />
                ))}
                <Text style={{ fontSize: 13, color: C.muted, fontWeight: '600', marginLeft: 6 }}>
                  {['','Minor','Mild','Moderate','Major','Critical'][severity]}
                </Text>
              </View>
            </View>
          )}

          {/* Note */}
          <View style={{ marginTop: 20, marginBottom: 4 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 14 }}>Add a note (optional)</Text>
            <TextInput
              style={{ backgroundColor: C.bg, borderRadius: 14, padding: 14, fontSize: 14, color: C.text, borderWidth: 1, borderColor: C.border, minHeight: 80, textAlignVertical: 'top' }}
              placeholder="What happened?"
              placeholderTextColor={C.subtext}
              value={note}
              onChangeText={setNote}
              multiline
              maxLength={100}
            />
          </View>

          {/* Resume button */}
          <View style={{ marginTop: 24 }}>
            <TouchableOpacity onPress={handleResume} activeOpacity={0.85}
              style={{ borderRadius: 14, shadowColor: C.blue, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 }}>
              <LinearGradient colors={[C.blueDark, C.blue]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{ height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: 0.3 }}>
                  {selected ? 'Log & Resume' : 'Resume Without Logging'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </Animated.View>
    </View>
  );
}