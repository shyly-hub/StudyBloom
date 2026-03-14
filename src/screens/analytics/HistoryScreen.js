// src/screens/analytics/HistoryScreen.js
import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView,
  TouchableOpacity, TextInput, Alert,
} from 'react-native';
import { LinearGradient }    from 'expo-linear-gradient';
import { useTheme }          from '../../context/ThemeContext';
import { MOODS, sColor, sBg, SUBJECT_ICONS } from '../../themes';
import { useSession }        from '../../context/sessionContext';

const FILTERS = ['All', 'Done', 'Quit'];

// ── Session Card ───────────────────────────────────────────────
function SessionCard({ session, onDelete, C }) {
  const { subject, duration, mood, energy, difficulty, distractions, completed, notes, date } = session;
  const accentColor = completed ? C.green : C.red;
  const icon        = SUBJECT_ICONS?.[subject] || '📌';
  const distrCount  = Array.isArray(distractions) ? distractions.length : 0;
  const moodEmoji   = MOODS?.[mood] || '🙂';
  const energyColor = energy === 'High' ? C.green : energy === 'Medium' ? C.yellow : C.red;

  const formatDate = (d) => {
    if (!d) return '';
    try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
    catch { return ''; }
  };

  const handleDelete = () => Alert.alert('Delete Session', 'Are you sure?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: () => onDelete?.(session.id) },
  ]);

  return (
    <View style={{ flexDirection: 'row', backgroundColor: C.card, borderRadius: 16, marginBottom: 10, overflow: 'hidden', borderWidth: 1, borderColor: C.border, shadowColor: C.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8, elevation: 2 }}>
      {/* Accent bar */}
      <View style={{ width: 4, backgroundColor: accentColor }} />

      <View style={{ flex: 1, padding: 14 }}>
        {/* Subject + status */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 20, paddingVertical: 4, paddingHorizontal: 10, backgroundColor: sBg(subject) }}>
            <Text style={{ fontSize: 14 }}>{icon}</Text>
            <Text style={{ fontSize: 12, fontWeight: '700', color: sColor(subject) }}>{subject}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 20, paddingVertical: 4, paddingHorizontal: 10, backgroundColor: completed ? C.greenSoft : C.redSoft }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: accentColor }} />
            <Text style={{ fontSize: 11, fontWeight: '700', color: accentColor }}>{completed ? 'Completed' : 'Quit Early'}</Text>
          </View>
        </View>

        {/* Duration + date */}
        <View style={{ flexDirection: 'row', alignItems: 'baseline', marginBottom: 10 }}>
          <Text style={{ fontSize: 24, fontWeight: '800', color: C.text }}>{duration}</Text>
          <Text style={{ fontSize: 12, color: C.muted, fontWeight: '600' }}> min</Text>
          <View style={{ width: 1, height: 16, backgroundColor: C.border, marginHorizontal: 12, alignSelf: 'center' }} />
          <Text style={{ fontSize: 13, color: C.muted }}>{formatDate(date)}</Text>
        </View>

        {/* Chips */}
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', borderRadius: 8, paddingVertical: 4, paddingHorizontal: 8, backgroundColor: C.blueSoft }}>
            <Text style={{ fontSize: 13 }}>{moodEmoji}</Text>
          </View>
          {energy && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, paddingVertical: 4, paddingHorizontal: 8, backgroundColor: energyColor + '22' }}>
              <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: energyColor }} />
              <Text style={{ fontSize: 11, fontWeight: '600', color: energyColor }}>{energy}</Text>
            </View>
          )}
          {difficulty > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, borderRadius: 8, paddingVertical: 4, paddingHorizontal: 8, backgroundColor: C.blueSoft }}>
              {[1,2,3,4,5].map(n => (
                <View key={n} style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: n <= difficulty ? sColor(subject) : C.border, marginHorizontal: 1 }} />
              ))}
            </View>
          )}
          {distrCount > 0 && (
            <View style={{ borderRadius: 8, paddingVertical: 4, paddingHorizontal: 8, backgroundColor: C.orangeSoft }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: C.orange }}>{distrCount} distr.</Text>
            </View>
          )}
        </View>

        {notes ? <Text style={{ fontSize: 12, color: C.subtext, fontStyle: 'italic', lineHeight: 16 }} numberOfLines={2}>{notes}</Text> : null}

        <TouchableOpacity onPress={handleDelete} style={{ alignSelf: 'flex-end', marginTop: 8 }}>
          <Text style={{ fontSize: 11, color: C.red, fontWeight: '600' }}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Main ───────────────────────────────────────────────────────
export default function HistoryScreen() {
  const { C } = useTheme();   // ← LIVE THEME
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const { sessions, deleteSession } = useSession();

  const filtered = useMemo(() => {
    let list = [...sessions];
    if (filter === 'Done') list = list.filter(s => s.completed);
    if (filter === 'Quit') list = list.filter(s => !s.completed);
    if (search.trim()) list = list.filter(s => s.subject?.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [filter, search, sessions]);

  const totalMins    = sessions.reduce((a, s) => a + (s.duration || 0), 0);
  const completedPct = sessions.length > 0
    ? Math.round((sessions.filter(s => s.completed).length / sessions.length) * 100) : 0;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

      {/* Header */}
      <View style={{ marginBottom: 20, paddingTop: 8 }}>
        <Text style={{ fontSize: 12, color: C.muted, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 2 }}>Your study sessions</Text>
        <Text style={{ fontSize: 26, fontWeight: '800', color: C.text }}>History</Text>
      </View>

      {/* Stats banner */}
      <LinearGradient colors={[C.blueDark, C.blue]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 20, padding: 20, flexDirection: 'row', marginBottom: 16, alignItems: 'center' }}>
        {[
          { val: sessions.length,                                 lbl: 'Sessions'   },
          { val: `${Math.floor(totalMins/60)}h ${totalMins%60}m`, lbl: 'Total Time' },
          { val: `${completedPct}%`,                              lbl: 'Completion' },
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
          <TouchableOpacity key={f} onPress={() => setFilter(f)}
            style={{ flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12, backgroundColor: filter === f ? C.blue : C.card, borderWidth: 1, borderColor: filter === f ? C.blue : C.border }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: filter === f ? '#fff' : C.muted }}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      {filtered.length === 0 ? (
        <View style={{ alignItems: 'center', paddingVertical: 60 }}>
          <Text style={{ fontSize: 28, marginBottom: 12 }}>📋</Text>
          <Text style={{ fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 8 }}>No sessions found</Text>
          <Text style={{ fontSize: 13, color: C.muted, textAlign: 'center' }}>
            {filter !== 'All' ? `No ${filter.toLowerCase()} sessions yet` : 'Complete a focus session to see it here'}
          </Text>
        </View>
      ) : (
        filtered.map(s => <SessionCard key={s.id} session={s} onDelete={deleteSession} C={C} />)
      )}

    </ScrollView>
  );
}