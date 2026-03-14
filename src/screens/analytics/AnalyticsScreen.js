import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView,
  TouchableOpacity, Dimensions,
} from 'react-native';
import { LinearGradient }        from 'expo-linear-gradient';
import { useTheme }              from '../../context/ThemeContext';
import { SUBJECTS, sColor, sBg } from '../../themes';
import { useSession }            from '../../context/sessionContext';

const WEEK_FILTERS = ['This Week', 'Last Week', 'This Month'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ── Score Ring ────────────────────────────
function ScoreRing({ value = 0, size = 88, color, label, C }) {
  return (
    <View style={{ alignItems: 'center', gap: 6 }}>
      <View style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 7, borderColor: C.border, alignItems: 'center', justifyContent: 'center', backgroundColor: C.card }}>
        <View style={{ position: 'absolute', width: size, height: size, borderRadius: size / 2, borderWidth: 7, borderColor: 'transparent',
          borderTopColor:    color,
          borderRightColor:  value > 25 ? color : 'transparent',
          borderBottomColor: value > 50 ? color : 'transparent',
          borderLeftColor:   value > 75 ? color : 'transparent',
          transform: [{ rotate: '-45deg' }],
        }} />
        <Text style={{ fontSize: size * 0.28, fontWeight: '800', color: C.text }}>{value}</Text>
      </View>
      {label && <Text style={{ fontSize: 11, fontWeight: '600', color: C.muted, textAlign: 'center' }}>{label}</Text>}
    </View>
  );
}

// ── Bar Chart ─────────────────────────────
function BarChart({ data, C }) {
  const maxVal = Math.max(...data.map(d => d.minutes), 1);
  const barH   = 120;
  const todayIndex = (new Date().getDay() + 6) % 7; // Mon=0
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
      {data.map((d, i) => {
        const fillH   = d.minutes > 0 ? Math.max((d.minutes / maxVal) * barH, 8) : 4;
        const isToday = i === todayIndex;
        return (
          <View key={d.day} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
            {d.minutes > 0 && (
              <Text style={{ fontSize: 9, color: C.muted, fontWeight: '600' }}>
                {d.minutes >= 60 ? `${Math.floor(d.minutes / 60)}h` : `${d.minutes}m`}
              </Text>
            )}
            <View style={{ width: '70%', height: barH, justifyContent: 'flex-end', borderRadius: 6 }}>
              {d.minutes > 0 ? (
                <LinearGradient
                  colors={isToday ? [C.blueDark, C.blue] : [C.blue, C.blueSoft]}
                  start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
                  style={{ width: '100%', height: fillH, borderRadius: 6 }}
                />
              ) : (
                <View style={{ height: 4, width: '100%', borderRadius: 4, backgroundColor: C.border }} />
              )}
            </View>
            <Text style={{ fontSize: 11, color: isToday ? C.blue : C.muted, fontWeight: isToday ? '700' : '500' }}>
              {d.day}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// ── Main ──────────────────────────────────
export default function AnalyticsScreen() {
  const { C } = useTheme();
  const [weekFilter, setWeekFilter] = useState('This Week');
  const { sessions, disciplineScore } = useSession();

  // ── Real weekly data from sessions ───────
  const weeklyData = useMemo(() => {
    const now   = new Date();
    const day   = now.getDay(); // 0=Sun
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - ((day + 6) % 7)); // Mon
    startOfWeek.setHours(0, 0, 0, 0);

    const buckets = DAYS.map(d => ({ day: d, minutes: 0 }));

    sessions.forEach(s => {
      const sessionDate = s.date
        ? new Date(s.date)
        : s.createdAt?.toDate
        ? s.createdAt.toDate()
        : null;
      if (!sessionDate) return;

      const diffDays = Math.floor((sessionDate - startOfWeek) / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays < 7) {
        const dur = s.durationMinutes ?? s.duration ?? 0;
        buckets[diffDays].minutes += dur;
      }
    });

    return buckets;
  }, [sessions]);

  // ── Real distraction data from sessions ──
  const distractionData = useMemo(() => {
    const counts = {};
    sessions.forEach(s => {
      (s.distractions || []).forEach(d => {
        const label = d.type || d;
        counts[label] = (counts[label] || 0) + 1;
      });
    });

    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    if (total === 0) return [];

    const colorMap = {
      'Overthinking': C.red,
      'Phone':        C.orange,
      'Tired':        C.yellow,
      'Noise':        C.purple,
      'Social Media': C.blue,
      'People':       C.green,
      'Hunger':       C.peach,
      'Other':        C.muted,
    };

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, count]) => ({
        label,
        value: Math.round((count / total) * 100),
        color: colorMap[label] || C.blue,
      }));
  }, [sessions, C]);

  const totalMins   = sessions.reduce((a, s) => a + (s.durationMinutes ?? s.duration ?? 0), 0);
  const completed   = sessions.filter(s => s.completed).length;
  const stability   = sessions.length > 0 ? Math.round((completed / sessions.length) * 100) : 0;
  const deepWork    = sessions.length > 0
    ? Math.round((sessions.filter(s => s.completed && !s.distractions?.length).length / sessions.length) * 100)
    : 0;
  const weekTotal   = weeklyData.reduce((a, d) => a + d.minutes, 0);
  const topDistr    = distractionData[0];

  const PATTERNS = [
    { title: 'Best Focus Window', text: 'You perform 40% better after 8PM. Schedule hard subjects then.',        color: C.blue,   bg: C.blueSoft   },
    { title: 'Energy Warning',    text: 'Sessions fail 3× more when energy is Low. Rest before studying.',       color: C.orange, bg: C.orangeSoft },
    { title: 'Burnout Pattern',   text: 'You overload after high-motivation days. Reduce load by 20% tomorrow.', color: C.red,    bg: C.redSoft    },
    { title: 'Strong Subject',    text: 'Coding sessions have 0 avg distractions. Your peak subject.',           color: C.green,  bg: C.greenSoft  },
  ];

  const card = {
    backgroundColor: C.card, borderRadius: 18, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: C.border,
    shadowColor: C.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 10, elevation: 2,
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={{ marginBottom: 20, paddingTop: 8 }}>
        <Text style={{ fontSize: 12, color: C.muted, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 2 }}>Your performance</Text>
        <Text style={{ fontSize: 26, fontWeight: '800', color: C.text }}>Analytics</Text>
      </View>

      {/* Score rings */}
      <View style={card}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 14 }}>Performance Score</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingTop: 4 }}>
          <ScoreRing value={disciplineScore} color={C.blue}   label={'Discipline\nScore'} C={C} />
          <ScoreRing value={stability}       color={C.green}  label={'Stability\n%'}      C={C} />
          <ScoreRing value={deepWork}        color={C.yellow} label={'Deep Work\n%'}      C={C} />
        </View>
      </View>

      {/* Quick stats */}
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
        {[
          { label: 'Total Hours', value: `${Math.floor(totalMins/60)}h`, color: C.blue   },
          { label: 'Sessions',    value: sessions.length,                 color: C.green  },
          { label: 'Completed',   value: completed,                       color: C.purple },
        ].map(s => (
          <View key={s.label} style={[card, { flex: 1, alignItems: 'center', padding: 14, marginBottom: 0 }]}>
            <Text style={{ fontSize: 22, fontWeight: '800', letterSpacing: -0.5, color: s.color }}>{s.value}</Text>
            <Text style={{ fontSize: 11, color: C.muted, fontWeight: '600', marginTop: 2, textAlign: 'center' }}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Weekly bar chart — REAL DATA */}
      <View style={card}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 8 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: C.text, flex: 1 }}>Weekly Focus</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {WEEK_FILTERS.map(f => (
                <TouchableOpacity key={f} onPress={() => setWeekFilter(f)}
                  style={{ paddingVertical: 5, paddingHorizontal: 12, borderRadius: 20, backgroundColor: weekFilter === f ? C.blue : C.blueSoft }}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: weekFilter === f ? '#fff' : C.muted }}>{f}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
        <BarChart data={weeklyData} C={C} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border }}>
          <Text style={{ fontSize: 13, color: C.muted, fontWeight: '600' }}>Total this week</Text>
          <Text style={{ fontSize: 13, fontWeight: '800', color: C.text }}>
            {Math.floor(weekTotal / 60)}h {weekTotal % 60}m
          </Text>
        </View>
      </View>

      {/* Distraction breakdown — REAL DATA */}
      <View style={card}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 14 }}>Distraction Breakdown</Text>
        {distractionData.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 20 }}>
            <Text style={{ fontSize: 32, marginBottom: 8 }}>🎯</Text>
            <Text style={{ fontSize: 14, fontWeight: '700', color: C.text }}>Zero distractions!</Text>
            <Text style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>You're in full focus mode.</Text>
          </View>
        ) : (
          <>
            {distractionData.map(d => (
              <View key={d.label} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, width: 130 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: d.color }} />
                  <Text style={{ fontSize: 13, color: C.text, fontWeight: '500' }}>{d.label}</Text>
                </View>
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: C.border, marginRight: 10, overflow: 'hidden' }}>
                    <View style={{ width: `${d.value}%`, height: '100%', borderRadius: 3, backgroundColor: d.color }} />
                  </View>
                  <Text style={{ fontSize: 12, fontWeight: '700', width: 34, textAlign: 'right', color: d.color }}>{d.value}%</Text>
                </View>
              </View>
            ))}
            {topDistr && (
              <View style={{ marginTop: 12, padding: 12, borderRadius: 12, borderLeftWidth: 3, backgroundColor: C.redSoft, borderLeftColor: C.red }}>
                <Text style={{ fontSize: 13, color: C.muted, lineHeight: 18 }}>
                  Your biggest focus enemy is{' '}
                  <Text style={{ fontWeight: '800', color: C.red }}>{topDistr.label}</Text>
                  {' '}— causing {topDistr.value}% of all distractions.
                </Text>
              </View>
            )}
          </>
        )}
      </View>

      {/* Time Per Subject — REAL DATA */}
      <View style={card}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 14 }}>Time Per Subject</Text>
        {SUBJECTS.map(subj => {
          const mins = sessions
            .filter(s => s.subject === subj)
            .reduce((a, s) => a + (s.durationMinutes ?? s.duration ?? 0), 0);
          const pct = totalMins > 0 ? Math.round((mins / totalMins) * 100) : 0;
          if (pct === 0) return null;
          return (
            <View key={subj} style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: sColor(subj), marginRight: 6 }} />
                <Text style={{ flex: 1, fontSize: 13, color: C.text, fontWeight: '600' }}>{subj}</Text>
                <Text style={{ fontSize: 12, color: C.muted, fontWeight: '600' }}>{Math.floor(mins/60)}h {mins%60}m</Text>
              </View>
              <View style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: C.border, overflow: 'hidden' }}>
                <View style={{ width: `${pct}%`, height: '100%', borderRadius: 3, backgroundColor: sColor(subj) }} />
              </View>
            </View>
          );
        })}
        {totalMins === 0 && (
          <Text style={{ fontSize: 13, color: C.muted, textAlign: 'center', paddingVertical: 16 }}>
            Complete sessions to see subject breakdown
          </Text>
        )}
      </View>

      {/* Pattern detection */}
      <Text style={{ fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 12 }}>Pattern Detection</Text>
      {PATTERNS.map((p, i) => (
        <View key={i} style={{ flexDirection: 'row', borderRadius: 14, overflow: 'hidden', marginBottom: 10, backgroundColor: p.bg }}>
          <View style={{ width: 4, backgroundColor: p.color }} />
          <View style={{ flex: 1, padding: 14 }}>
            <Text style={{ fontSize: 13, fontWeight: '800', color: p.color, marginBottom: 4 }}>{p.title}</Text>
            <Text style={{ fontSize: 13, color: C.muted, lineHeight: 18 }}>{p.text}</Text>
          </View>
        </View>
      ))}

    </ScrollView>
  );
}