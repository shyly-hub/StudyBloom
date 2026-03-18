import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView,
  TouchableOpacity, TextInput, Alert, Animated, Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme }       from '../../context/ThemeContext';
import { useSession }     from '../../context/sessionContext';
import { MIN_VALID_SECONDS } from '../../utils/scoreEngine';
import { sColor, sBg, SUBJECT_ICONS } from '../../themes';

const FILTERS = ['All', 'Done', 'Quit'];

// ── Scale press ───────────────────────────
function ScalePress({ onPress, children, style }) {
  const scale = useRef(new Animated.Value(1)).current;
  const down  = () => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, tension: 400, friction: 20 }).start();
  const up    = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, tension: 300, friction: 15 }).start();
  return (
    <TouchableOpacity onPressIn={down} onPressOut={up} onPress={onPress} activeOpacity={1}>
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </TouchableOpacity>
  );
}

// ── Format date ───────────────────────────
function formatDate(d) {
  if (!d) return '';
  try {
    const date  = new Date(d);
    const today = new Date(); today.setHours(0,0,0,0);
    const yest  = new Date(today); yest.setDate(yest.getDate() - 1);
    date.setHours(0,0,0,0);
    if (date.getTime() === today.getTime()) return 'Today';
    if (date.getTime() === yest.getTime())  return 'Yesterday';
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  } catch { return ''; }
}

// ── Subject bg — soft pastel matching Home screen subject buttons ──
function subjectBg(subject) {
  const map = {
    Math:      'rgba(167,139,250,0.18)',
    Science:   'rgba(52,211,153,0.15)',
    English:   'rgba(96,165,250,0.15)',
    History:   'rgba(251,191,36,0.18)',
    Physics:   'rgba(248,113,113,0.15)',
    Chemistry: 'rgba(34,211,238,0.15)',
    Biology:   'rgba(74,222,128,0.15)',
    Other:     'rgba(148,163,184,0.15)',
  };
  return map[subject] || sBg(subject) || 'rgba(148,163,184,0.15)';
}

// ── Session Card ──────────────────────────
function SessionCard({ session, onDelete, C }) {
  const { subject, completed } = session;
  const icon        = SUBJECT_ICONS?.[subject] || '📌';
  const durSecs     = session.durationSeconds ?? ((session.duration ?? 0) * 60);
  const isShort     = durSecs < MIN_VALID_SECONDS;
  const accentColor = isShort ? C.muted : completed ? '#10B981' : '#F87171';

  const durLabel = durSecs < 60
    ? `${durSecs}s`
    : durSecs < 3600
    ? `${Math.floor(durSecs / 60)}m${durSecs % 60 > 0 ? ` ${durSecs % 60}s` : ''}`
    : `${Math.floor(durSecs / 3600)}h ${Math.floor((durSecs % 3600) / 60)}m`;

  const handleDelete = () =>
    Alert.alert('Delete Session', 'Remove this session from history?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete?.(session.id) },
    ]);

  return (
    <View style={{
      backgroundColor:   C.card,
      borderRadius:      18,
      marginBottom:      8,
      flexDirection:     'row',
      alignItems:        'center',
      paddingVertical:   13,
      paddingHorizontal: 14,
      borderWidth:       1,
      borderColor:       C.border,
      opacity:           isShort ? 0.72 : 1,
      ...Platform.select({
        ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6 },
        android: { elevation: 1 },
      }),
    }}>
      <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: subjectBg(subject), alignItems: 'center', justifyContent: 'center', marginRight: 12, flexShrink: 0 }}>
        <Text style={{ fontSize: 20 }}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: C.text, letterSpacing: -0.2 }}>{subject}</Text>
        <Text style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{durLabel}</Text>
      </View>
      <View style={{
        paddingVertical: 5, paddingHorizontal: 12, borderRadius: 20, marginRight: 10,
        backgroundColor: isShort ? 'transparent' : completed ? 'rgba(16,185,129,0.10)' : 'rgba(248,113,113,0.10)',
      }}>
        <Text style={{ fontSize: 11, fontWeight: '700', color: accentColor }}>
          {isShort ? '< 1m' : completed ? 'Done' : 'Quit'}
        </Text>
      </View>
      <TouchableOpacity onPress={handleDelete} hitSlop={8}>
        <Text style={{ fontSize: 16, color: C.muted, opacity: 0.5 }}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Date group header ─────────────────────
function DateHeader({ label, count, C }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8, marginTop: 8 }}>
      <Text style={{ fontSize: 10, fontWeight: '800', color: C.muted, letterSpacing: 1, textTransform: 'uppercase' }}>{label}</Text>
      <View style={{ flex: 1, height: 1, backgroundColor: C.border }} />
      <Text style={{ fontSize: 10, fontWeight: '600', color: C.muted }}>{count}</Text>
    </View>
  );
}

// ══════════════════════════════════════════
//  MAIN
// ══════════════════════════════════════════
export default function HistoryScreen() {
  const { C }                                      = useTheme();
  const { sessions, stats, deleteSession }         = useSession();
  const [filter, setFilter]                        = useState('All');
  const [search, setSearch]                        = useState('');

  // Re-clear search every time the History tab is focused
  useFocusEffect(useCallback(() => {
    setSearch('');
  }, []));

  const filtered = useMemo(() => {
    let list = [...sessions];
    if (filter === 'Done') list = list.filter(s => s.completed);
    if (filter === 'Quit') list = list.filter(s => !s.completed);
    if (search.trim()) list = list.filter(s => s.subject?.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [filter, search, sessions]);

  const grouped = useMemo(() => {
    const groups = {};
    filtered.forEach(s => {
      const label = formatDate(s.date || s.createdAt);
      if (!groups[label]) groups[label] = [];
      groups[label].push(s);
    });
    return groups;
  }, [filtered]);

  // Single source of truth from context — no independent calculation
  const { totalCount, shortCount } = stats;

  const filterCount = (f) =>
    f === 'All'  ? sessions.length :
    f === 'Done' ? sessions.filter(s => s.completed).length :
                   sessions.filter(s => !s.completed).length;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{ paddingBottom: 110 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header gradient */}
      <LinearGradient
        colors={['#FAD7A0', '#ABEBC6', '#D7BDE2', '#AED6F1']}
        locations={[0, 0.35, 0.7, 1]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={{ paddingTop: 56, paddingHorizontal: 20, paddingBottom: 32 }}
      >
        <Text style={{ fontSize: 10, fontWeight: '800', color: 'rgba(44,44,44,0.55)', letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 4 }}>
          Your study sessions
        </Text>
        <Text style={{ fontSize: 32, fontWeight: '900', color: '#1C1917', letterSpacing: -1, lineHeight: 36 }}>
          History
        </Text>
      </LinearGradient>

      {/* Sessions count card */}
      <View style={{ paddingHorizontal: 16, marginTop: -20, marginBottom: 18 }}>
        <View style={{
          backgroundColor: C.card, borderRadius: 18, paddingVertical: 16,
          paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center',
          gap: 12, borderWidth: 1, borderColor: C.border,
          ...Platform.select({
            ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 10 },
            android: { elevation: 3 },
          }),
        }}>
          <Text style={{ fontSize: 24 }}>📚</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 24, fontWeight: '900', color: C.blue, letterSpacing: -0.8 }}>{totalCount}</Text>
            <Text style={{ fontSize: 10, fontWeight: '700', color: C.muted, letterSpacing: 1.2, textTransform: 'uppercase' }}>Total Sessions</Text>
          </View>
        </View>
      </View>

      <View style={{ paddingHorizontal: 16 }}>

        {/* Search bar */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', backgroundColor: C.card,
          borderRadius: 16, paddingHorizontal: 14, height: 48, marginBottom: 12,
          borderWidth: 1, borderColor: C.border, gap: 8,
          ...Platform.select({
            ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6 },
            android: { elevation: 1 },
          }),
        }}>
          <Text style={{ fontSize: 15, color: C.muted }}>🔍</Text>
          <TextInput
            style={{ flex: 1, fontSize: 14, color: C.text }}
            placeholder="Search by subject..."
            placeholderTextColor={C.subtext}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
              <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: C.bgRaised, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 10, color: C.muted, fontWeight: '700' }}>✕</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Filter tabs — individual capsule buttons */}
        <View style={{
          flexDirection:  'row',
          gap:            8,
          marginBottom:   20,
          alignItems:     'center',
        }}>
          {FILTERS.map(f => {
            const active = filter === f;
            const count  = filterCount(f);
            return (
              <ScalePress key={f} onPress={() => setFilter(f)}>
                <View style={{
                  flexDirection:     'row',
                  alignItems:        'center',
                  gap:               5,
                  paddingHorizontal: 18,
                  paddingVertical:   8,
                  borderRadius:      20,
                  backgroundColor:   active ? '#EAB308' : C.card,
                  borderWidth:       1,
                  borderColor:       active ? '#EAB308' : C.border,
                  ...Platform.select({
                    ios: {
                      shadowColor:   active ? '#EAB308' : '#000',
                      shadowOffset:  { width: 0, height: active ? 3 : 1 },
                      shadowOpacity: active ? 0.22 : 0.05,
                      shadowRadius:  active ? 8 : 4,
                    },
                    android: { elevation: active ? 4 : 1 },
                  }),
                }}>
                  <Text style={{
                    fontSize:      13,
                    fontWeight:    active ? '700' : '500',
                    color:         active ? '#1a1000' : C.muted,
                    letterSpacing: -0.1,
                  }}>
                    {f}
                  </Text>
                  {count > 0 && (
                    <View style={{
                      backgroundColor: active ? 'rgba(0,0,0,0.12)' : C.bgRaised,
                      borderRadius:    10,
                      minWidth:        18,
                      height:          18,
                      alignItems:      'center',
                      justifyContent:  'center',
                      paddingHorizontal: 4,
                    }}>
                      <Text style={{
                        fontSize:   10,
                        fontWeight: '700',
                        color:      active ? '#1a1000' : C.muted,
                      }}>
                        {count}
                      </Text>
                    </View>
                  )}
                </View>
              </ScalePress>
            );
          })}
        </View>

        {/* Session list */}
        {Object.keys(grouped).length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 56, gap: 10 }}>
            <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: C.bgRaised, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border }}>
              <Text style={{ fontSize: 32 }}>📭</Text>
            </View>
            <Text style={{ fontSize: 16, fontWeight: '800', color: C.text, letterSpacing: -0.3, marginTop: 4 }}>
              No sessions found
            </Text>
            <Text style={{ fontSize: 13, color: C.muted, textAlign: 'center', lineHeight: 20, maxWidth: 230 }}>
              {filter !== 'All'
                ? `No ${filter.toLowerCase()} sessions yet`
                : 'Complete a focus session and it will appear here'}
            </Text>
          </View>
        ) : (
          Object.entries(grouped).map(([dateLabel, items]) => (
            <View key={dateLabel} style={{ marginBottom: 6 }}>
              <DateHeader label={dateLabel} count={items.length} C={C} />
              {items.map(s => (
                <SessionCard key={s.id} session={s} onDelete={deleteSession} C={C} />
              ))}
            </View>
          ))
        )}

        {/* Short-session footer note */}
        {shortCount > 0 && (
          <Text style={{ fontSize: 11, color: C.muted, textAlign: 'center', opacity: 0.6, marginTop: 16, lineHeight: 17 }}>
            {shortCount} session{shortCount > 1 ? 's' : ''} under 1 min are saved but don't affect scores.
          </Text>
        )}

      </View>
    </ScrollView>
  );
}