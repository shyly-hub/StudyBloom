import React, { useState, useMemo, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, TextInput, Alert, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme }       from '../../context/ThemeContext';
import { useSession }     from '../../context/sessionContext';
import { MOODS, sColor, sBg, SUBJECT_ICONS } from '../../themes';

const FILTERS = ['All', 'Done', 'Quit'];

// ── Scale press animation ─────────────────
function ScalePress({ onPress, children, style }) {
  const scale = useRef(new Animated.Value(1)).current;
  const down  = () => Animated.spring(scale, { toValue: 0.95, useNativeDriver: true, tension: 400, friction: 20 }).start();
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

// ── Session Card ──────────────────────────
function SessionCard({ session, onDelete, C }) {
  const { subject, duration, mood, energy, difficulty, distractions, completed, notes, date } = session;
  const accentColor = completed ? C.green : C.red;
  const icon        = SUBJECT_ICONS?.[subject] || '📌';
  const distrCount  = Array.isArray(distractions) ? distractions.length : 0;
  const moodEmoji   = MOODS?.[mood] || '🙂';
  const energyColor = energy === 'High' ? C.green : energy === 'Medium' ? C.yellow : C.red;
  const dur         = session.durationMinutes ?? session.duration ?? 0;

  const handleDelete = () => {
    Alert.alert('Delete Session', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete?.(session.id) },
    ]);
  };

  return (
    <View style={{
      flexDirection: 'row', backgroundColor: C.card,
      borderRadius: 20, marginBottom: 8, overflow: 'hidden',
      borderWidth: 1, borderColor: C.border,
      shadowColor: C.shadow, shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1, shadowRadius: 6, elevation: 2,
    }}>
      {/* Left accent */}
      <View style={{ width: 4, backgroundColor: accentColor }} />

      <View style={{ flex: 1, padding: 14 }}>
        {/* Top row */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: sBg(subject), alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 16 }}>{icon}</Text>
            </View>
            <View>
              <Text style={{ fontSize: 13, fontWeight: '700', color: C.text }}>{subject}</Text>
              <Text style={{ fontSize: 11, color: C.muted }}>
                {dur > 0 ? `${dur} min` : '< 1 min'}
              </Text>
            </View>
          </View>

          {/* Status dot — small and clean */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: accentColor }} />
            <Text style={{ fontSize: 11, fontWeight: '600', color: accentColor }}>
              {completed ? 'Done' : 'Quit'}
            </Text>
          </View>
        </View>

        {/* Chips row */}
        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: notes ? 8 : 0 }}>
          {/* Mood */}
          <View style={{ backgroundColor: C.bgRaised, borderRadius: 8, paddingVertical: 3, paddingHorizontal: 8 }}>
            <Text style={{ fontSize: 12 }}>{moodEmoji}</Text>
          </View>
          {/* Energy */}
          {energy && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: energyColor + '18', borderRadius: 8, paddingVertical: 3, paddingHorizontal: 8 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: energyColor }} />
              <Text style={{ fontSize: 10, fontWeight: '600', color: energyColor }}>{energy}</Text>
            </View>
          )}
          {/* Difficulty */}
          {difficulty > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: C.bgRaised, borderRadius: 8, paddingVertical: 3, paddingHorizontal: 8 }}>
              {[1,2,3,4,5].map(n => (
                <View key={n} style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: n <= difficulty ? sColor(subject) : C.border }} />
              ))}
            </View>
          )}
          {/* Distractions */}
          {distrCount > 0 && (
            <View style={{ backgroundColor: C.orangeSoft, borderRadius: 8, paddingVertical: 3, paddingHorizontal: 8 }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: C.orange }}>{distrCount} distr.</Text>
            </View>
          )}
        </View>

        {/* Notes */}
        {notes ? (
          <Text style={{ fontSize: 11, color: C.subtext, fontStyle: 'italic', lineHeight: 15, marginBottom: 4 }} numberOfLines={2}>
            {notes}
          </Text>
        ) : null}

        {/* Delete */}
        <TouchableOpacity onPress={handleDelete} style={{ alignSelf: 'flex-end' }}>
          <Text style={{ fontSize: 10, color: C.red, fontWeight: '600' }}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Date group header ─────────────────────
function DateHeader({ label, count, C }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10, marginTop: 4 }}>
      <Text style={{ fontSize: 12, fontWeight: '700', color: C.text }}>{label}</Text>
      <View style={{ flex: 1, height: 1, backgroundColor: C.border }} />
      <View style={{ backgroundColor: C.bgRaised, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 }}>
        <Text style={{ fontSize: 10, fontWeight: '600', color: C.muted }}>{count}</Text>
      </View>
    </View>
  );
}

// ══════════════════════════════════════════
//  MAIN
// ══════════════════════════════════════════
export default function HistoryScreen() {
  const { C }                        = useTheme();
  const { sessions, deleteSession }  = useSession();
  const [filter, setFilter]          = useState('All');
  const [search, setSearch]          = useState('');

  const filtered = useMemo(() => {
    let list = [...sessions];
    if (filter === 'Done') list = list.filter(s => s.completed);
    if (filter === 'Quit') list = list.filter(s => !s.completed);
    if (search.trim()) list = list.filter(s => s.subject?.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [filter, search, sessions]);

  // Group by date
  const grouped = useMemo(() => {
    const groups = {};
    filtered.forEach(s => {
      const label = formatDate(s.date || s.createdAt);
      if (!groups[label]) groups[label] = [];
      groups[label].push(s);
    });
    return groups;
  }, [filtered]);

  const totalMins    = sessions.reduce((a, s) => a + (s.durationMinutes ?? s.duration ?? 0), 0);
  const completedPct = sessions.length > 0
    ? Math.round((sessions.filter(s => s.completed).length / sessions.length) * 100) : 0;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={{ marginBottom: 20, paddingTop: 8 }}>
        <Text style={{ fontSize: 12, color: C.muted, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 2 }}>
          Your study sessions
        </Text>
        <Text style={{ fontSize: 26, fontWeight: '800', color: C.text }}>History</Text>
      </View>

      {/* Banner */}
      <LinearGradient
        colors={[C.blueDark, C.blue]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={{ borderRadius: 20, padding: 20, flexDirection: 'row', marginBottom: 16, alignItems: 'center' }}
      >
        {[
          { val: sessions.length,                               lbl: 'Sessions'   },
          { val: `${Math.floor(totalMins/60)}h ${totalMins%60}m`, lbl: 'Total Time' },
          { val: `${completedPct}%`,                            lbl: 'Completion' },
        ].map((s, i) => (
          <React.Fragment key={s.lbl}>
            {i > 0 && <View style={{ width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.25)' }} />}
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#fff' }}>{s.val}</Text>
              <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>{s.lbl}</Text>
            </View>
          </React.Fragment>
        ))}
      </LinearGradient>

      {/* Search */}
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 14, paddingHorizontal: 14, height: 48, marginBottom: 14, borderWidth: 1, borderColor: C.border }}>
        <Text style={{ fontSize: 16, marginRight: 8 }}>🔍</Text>
        <TextInput
          style={{ flex: 1, fontSize: 14, color: C.text }}
          placeholder="Search by subject..."
          placeholderTextColor={C.subtext}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={{ fontSize: 14, color: C.muted, padding: 4 }}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter tabs */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
        {FILTERS.map(f => (
          <ScalePress key={f} onPress={() => setFilter(f)}
            style={{
              flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12,
              backgroundColor: filter === f ? C.blue : C.card,
              borderWidth: 1, borderColor: filter === f ? C.blue : C.border,
            }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: filter === f ? '#2a2000' : C.muted }}>
              {f}
            </Text>
          </ScalePress>
        ))}
      </View>

      {/* Grouped list */}
      {Object.keys(grouped).length === 0 ? (
        <View style={{ alignItems: 'center', paddingVertical: 60 }}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>📭</Text>
          <Text style={{ fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 8 }}>No sessions found</Text>
          <Text style={{ fontSize: 13, color: C.muted, textAlign: 'center' }}>
            {filter !== 'All' ? `No ${filter.toLowerCase()} sessions yet` : 'Complete a focus session to see it here'}
          </Text>
        </View>
      ) : (
        Object.entries(grouped).map(([dateLabel, items]) => (
          <View key={dateLabel} style={{ marginBottom: 12 }}>
            <DateHeader label={dateLabel} count={items.length} C={C} />
            {items.map(s => (
              <SessionCard key={s.id} session={s} onDelete={deleteSession} C={C} />
            ))}
          </View>
        ))
      )}
    </ScrollView>
  );
}