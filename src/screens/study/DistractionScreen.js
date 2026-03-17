import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, TextInput,
  ScrollView, Animated, Dimensions,
  LayoutAnimation, UIManager, Platform, StatusBar,
  KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme }       from '../../context/ThemeContext';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { height, width } = Dimensions.get('window');

const DISTRACTION_OPTIONS = [
  { label: 'Phone',        icon: '📱', color: '#f43f5e', desc: 'Checked phone'   },
  { label: 'Social Media', icon: '💬', color: '#8b5cf6', desc: 'Scrolled feed'   },
  { label: 'Overthinking', icon: '🌀', color: '#f97316', desc: 'Mind wandered'   },
  { label: 'Tired',        icon: '😴', color: '#6366f1', desc: 'Low energy'      },
  { label: 'Noise',        icon: '🔊', color: '#eab308', desc: 'Environment'     },
  { label: 'People',       icon: '👥', color: '#10b981', desc: 'Interrupted'     },
  { label: 'Hunger',       icon: '🍕', color: '#f59e0b', desc: 'Need food'       },
  { label: 'Other',        icon: '❓', color: '#94a3b8', desc: 'Something else'  },
];

function softShadow(color = '#000') {
  return Platform.select({
    ios:     { shadowColor: color, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 10 },
    android: { elevation: 2 },
  });
}

function ScalePress({ onPress, children, style }) {
  const scale = useRef(new Animated.Value(1)).current;
  const down  = () => Animated.spring(scale, { toValue: 0.93, useNativeDriver: true, tension: 400, friction: 20 }).start();
  const up    = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, tension: 300, friction: 15 }).start();
  return (
    <TouchableOpacity onPressIn={down} onPressOut={up} onPress={onPress} activeOpacity={1}>
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </TouchableOpacity>
  );
}

function ScorePill({ count }) {
  const shakeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (count > 0) {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: -5, duration: 60,  useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue:  5, duration: 60,  useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -5, duration: 60,  useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue:  0, duration: 60,  useNativeDriver: true }),
      ]).start();
    }
  }, [count]);

  return (
    <Animated.View style={{ position: 'absolute', top: Platform.OS === 'ios' ? 56 : 40, right: 20, zIndex: 999, transform: [{ translateX: shakeAnim }] }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: count > 0 ? 'rgba(248,113,113,0.12)' : 'rgba(0,0,0,0.06)', borderRadius: 20, paddingVertical: 7, paddingHorizontal: 14, ...softShadow(count > 0 ? '#f87171' : '#000') }}>
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: count > 0 ? '#f87171' : '#aaa' }} />
        <Text style={{ fontSize: 11, fontWeight: '700', color: count > 0 ? '#f87171' : '#aaa', letterSpacing: -0.2 }}>
          {count > 0 ? `${count * -2} pts · ${count} logged` : 'No distractions'}
        </Text>
      </View>
    </Animated.View>
  );
}

function DistractionTile({ opt, isSelected, onPress }) {
  const glowAnim  = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    Animated.parallel([
      Animated.timing(glowAnim,  { toValue: isSelected ? 1 : 0,    duration: 220, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: isSelected ? 1.03 : 1, useNativeDriver: true, tension: 300, friction: 15 }),
    ]).start();
  }, [isSelected]);

  const tileWidth = (width - 60) / 2;

  return (
    <ScalePress onPress={onPress} style={{ width: tileWidth }}>
      <Animated.View style={{
        borderRadius:    24,
        padding:         20,
        alignItems:      'center',
        gap:             10,
        backgroundColor: isSelected ? opt.color + '14' : '#fafafa',
        transform:       [{ scale: scaleAnim }],
        minHeight:       120,
        justifyContent:  'center',
        ...Platform.select({
          ios:     { shadowColor: isSelected ? opt.color : '#000', shadowOffset: { width: 0, height: isSelected ? 6 : 2 }, shadowOpacity: isSelected ? 0.18 : 0.04, shadowRadius: isSelected ? 16 : 10 },
          android: { elevation: isSelected ? 5 : 2 },
        }),
        borderWidth: isSelected ? 2 : 0,
        borderColor: isSelected ? '#f5c842' : 'transparent',
      }}>
        {isSelected && (
          <View style={{ position: 'absolute', top: 12, right: 12, width: 20, height: 20, borderRadius: 10, backgroundColor: '#f5c842', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 10, color: '#1a1000', fontWeight: '900' }}>✓</Text>
          </View>
        )}
        <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: isSelected ? opt.color + '22' : '#f0f0f0', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 26 }}>{opt.icon}</Text>
        </View>
        <View style={{ alignItems: 'center', gap: 3 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: isSelected ? opt.color : '#1a1a1a', letterSpacing: -0.3, lineHeight: 18 }}>{opt.label}</Text>
          <Text style={{ fontSize: 10, color: isSelected ? opt.color + 'bb' : '#999', letterSpacing: -0.2, lineHeight: 14 }}>{opt.desc}</Text>
        </View>
      </Animated.View>
    </ScalePress>
  );
}

// ══════════════════════════════════════════
//  MAIN SCREEN
// ══════════════════════════════════════════
export default function DistractionScreen({ navigation, route }) {
  const { onAdd } = route?.params || {};

  const [selected, setSelected] = useState([]);
  const [note,     setNote]     = useState('');
  const [elapsed,  setElapsed]  = useState(0);

  const slideAnim = useRef(new Animated.Value(height)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 60, friction: 12 }),
      Animated.timing(fadeAnim,  { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatElapsed = (s) => {
    const m   = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
  };

  const toggleSelect = (label) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelected(prev => prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]);
  };

  const handleResume = () => {
    if (selected.length === 0) { navigation.goBack(); return; }
    selected.forEach(label => {
      const opt = DISTRACTION_OPTIONS.find(o => o.label === label);
      onAdd?.({ type: label, icon: opt?.icon || '❓', note: note.trim(), timestamp: new Date().toISOString() });
    });
    navigation.goBack();
  };

  return (
    <Animated.View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', opacity: fadeAnim }}>
      <StatusBar barStyle="light-content" />

      {/* Tap backdrop to dismiss */}
      <TouchableOpacity style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} onPress={handleResume} activeOpacity={1} />

      {/* Floating score pill */}
      <ScorePill count={selected.length} />

      {/* ── Bottom sheet wrapped in KeyboardAvoidingView ── */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}
        keyboardVerticalOffset={0}
      >
        <Animated.View style={{
          backgroundColor:      '#ffffff',
          borderTopLeftRadius:  28,
          borderTopRightRadius: 28,
          maxHeight:            height * 0.92,
          ...Platform.select({
            ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.04, shadowRadius: 10 },
            android: { elevation: 8 },
          }),
          transform: [{ translateY: slideAnim }],
        }}>
          {/* Handle */}
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#e0e0e0', alignSelf: 'center', marginTop: 14, marginBottom: 20 }} />

          {/* Scrollable content — scrolls up when keyboard opens */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 48 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 22, fontWeight: '800', color: '#1a1a1a', letterSpacing: -0.5, marginBottom: 5, lineHeight: 28 }}>
                  What distracted you?
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#f97316' }} />
                  <Text style={{ fontSize: 12, color: '#888', letterSpacing: -0.2, lineHeight: 17 }}>
                    Paused for {formatElapsed(elapsed)}
                  </Text>
                </View>
              </View>
              <View style={{ backgroundColor: 'rgba(249,115,22,0.1)', borderRadius: 12, paddingVertical: 6, paddingHorizontal: 12 }}>
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#f97316', letterSpacing: 1.5 }}>PAUSED</Text>
              </View>
            </View>

            {/* Section label */}
            <Text style={{ fontSize: 9, fontWeight: '800', color: '#aaa', letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 14, lineHeight: 13 }}>
              Select all that apply
            </Text>

            {/* 2-column tile grid */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28, justifyContent: 'space-between' }}>
              {DISTRACTION_OPTIONS.map(opt => (
                <DistractionTile
                  key={opt.label}
                  opt={opt}
                  isSelected={selected.includes(opt.label)}
                  onPress={() => toggleSelect(opt.label)}
                />
              ))}
            </View>

            {/* Reflection — the field that was getting hidden */}
            <Text style={{ fontSize: 9, fontWeight: '800', color: '#aaa', letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 12, lineHeight: 13 }}>
              Reflection
            </Text>
            <View style={{
              backgroundColor: '#fffbf0',
              borderRadius:    24,
              padding:         20,
              marginBottom:    24,
              minHeight:       110,
              ...softShadow('#f5c842'),
            }}>
              <TextInput
                style={{ fontSize: 15, color: '#2a2000', lineHeight: 22, letterSpacing: -0.3, minHeight: 72 }}
                placeholder="What pulled your focus away? Write freely..."
                placeholderTextColor="#d4c9a8"
                value={note}
                onChangeText={setNote}
                multiline
                maxLength={200}
                textAlignVertical="top"
                selectionColor="#f5c842"
                // Scroll the sheet up when this field is focused
                onFocus={() => {}}
              />
              <Text style={{ fontSize: 10, color: '#d4c9a8', textAlign: 'right', marginTop: 8, letterSpacing: 0.3 }}>
                {note.length}/200
              </Text>
            </View>

            {/* Resume button */}
            <ScalePress onPress={handleResume} style={{ marginBottom: 10 }}>
              <LinearGradient
                colors={selected.length > 0 ? ['#f5c842', '#d4a017'] : ['#f0f0f0', '#e8e8e8']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{
                  height:         50,
                  borderRadius:   25,
                  alignItems:     'center',
                  justifyContent: 'center',
                  ...Platform.select({
                    ios:     { shadowColor: selected.length > 0 ? '#f5c842' : 'transparent', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12 },
                    android: { elevation: selected.length > 0 ? 6 : 0 },
                  }),
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: '900', color: selected.length > 0 ? '#1a1000' : '#aaa', letterSpacing: 0.3 }}>
                  {selected.length > 0 ? `Log ${selected.length} & Resume` : 'Resume Without Logging'}
                </Text>
              </LinearGradient>
            </ScalePress>

            {/* Skip */}
            <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.6}
              style={{ height: 40, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 13, color: '#aaa', textDecorationLine: 'underline', letterSpacing: -0.2 }}>
                Skip & Resume
              </Text>
            </TouchableOpacity>

          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Animated.View>
  );
}