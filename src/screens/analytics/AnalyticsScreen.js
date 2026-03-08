
import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C, SUBJECTS, sColor, sBg } from '../../themes';
import { Card } from '../../components';
import { useSessions } from '../../hooks/useSessions';
import { SAMPLE_SESSIONS } from '../../data/sampleData';

const WEEK_FILTERS = ['This Week', 'Last Week', 'This Month'];

const WEEKLY_DATA = [
  { day: 'Mon', minutes: 90  },
  { day: 'Tue', minutes: 45  },
  { day: 'Wed', minutes: 120 },
  { day: 'Thu', minutes: 0   },
  { day: 'Fri', minutes: 75  },
  { day: 'Sat', minutes: 150 },
  { day: 'Sun', minutes: 60  },
];

const DISTRACTION_DATA = [
  { label: 'Overthinking', value: 43, color: C.red    },
  { label: 'Phone',        value: 28, color: C.orange },
  { label: 'Tired',        value: 18, color: C.yellow },
  { label: 'Noise',        value: 7,  color: C.purple },
  { label: 'Social Media', value: 4,  color: C.blue   },
];

const PATTERNS = [
  { title: 'Best Focus Window',  text: 'You perform 40% better after 8PM. Schedule hard subjects then.',        color: C.blue,   bg: C.blueSoft   },
  { title: 'Energy Warning',     text: 'Sessions fail 3x more when energy is Low. Rest before studying.',       color: C.orange, bg: C.orangeSoft },
  { title: 'Burnout Pattern',    text: 'You overload after high-motivation days. Reduce load by 20% tomorrow.', color: C.red,    bg: C.redSoft    },
  { title: 'Strong Subject',     text: 'Coding sessions have 0 avg distractions. Your peak subject.',           color: C.green,  bg: C.greenSoft  },
];

// ── Score Ring ────────────────────────────
function ScoreRing({ value = 0, size = 88, color, label }) {
  return (
    <View style={{ alignItems: 'center', gap: 6 }}>
      <View style={{
        width: size, height: size, borderRadius: size / 2,
        borderWidth: 7, borderColor: C.border,
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: C.card,
      }}>
        <View style={{
          position: 'absolute', width: size, height: size,
          borderRadius: size / 2, borderWidth: 7,
          borderColor:       'transparent',
          borderTopColor:    color,
          borderRightColor:  value > 25 ? color : 'transparent',
          borderBottomColor: value > 50 ? color : 'transparent',
          borderLeftColor:   value > 75 ? color : 'transparent',
          transform: [{ rotate: '-45deg' }],
        }} />
        <Text style={{ fontSize: size * 0.28, fontWeight: '800', color: C.text }}>
          {value}
        </Text>
      </View>
      {label && (
        <Text style={{ fontSize: 11, fontWeight: '600', color: C.muted, textAlign: 'center' }}>
          {label}
        </Text>
      )}
    </View>
  );
}

// ── Bar Chart ─────────────────────────────
function BarChart({ data }) {
  const maxVal = Math.max(...data.map(d => d.minutes), 1);
  const barH   = 120;
  return (
    <View style={styles.chartRow}>
      {data.map((d, i) => {
        const fillH   = d.minutes > 0 ? Math.max((d.minutes / maxVal) * barH, 8) : 4;
        const isToday = i === new Date().getDay() - 1;
        return (
          <View key={d.day} style={styles.barCol}>
            {d.minutes > 0 && (
              <Text style={styles.barTopLabel}>
                {d.minutes >= 60 ? `${Math.floor(d.minutes / 60)}h` : `${d.minutes}m`}
              </Text>
            )}
            <View style={[styles.barTrack, { height: barH }]}>
              {d.minutes > 0 ? (
                <LinearGradient
                  colors={isToday ? [C.blueDark, C.blue] : [C.blue, C.blueSoft]}
                  start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
                  style={[styles.barFill, { height: fillH }]}
                />
              ) : (
                <View style={[{ height: 4, width: '100%', borderRadius: 4, backgroundColor: C.border }]} />
              )}
            </View>
            <Text style={[styles.barDayLabel, isToday && { color: C.blue, fontWeight: '700' }]}>
              {d.day}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// ── Main Screen ───────────────────────────
export default function AnalyticsScreen() {
  const [weekFilter, setWeekFilter] = useState('This Week');

  let sessions        = SAMPLE_SESSIONS;
  let disciplineScore = 72;
  try {
    const ctx = useSessions();
    if (ctx?.sessions)        sessions        = ctx.sessions;
    if (ctx?.disciplineScore) disciplineScore = ctx.disciplineScore;
  } catch (e) {}

  const totalMins  = sessions.reduce((a, s) => a + (s.duration || 0), 0);
  const completed  = sessions.filter(s => s.completed).length;
  const stability  = sessions.length > 0 ? Math.round((completed / sessions.length) * 100) : 80;
  const deepWork   = sessions.length > 0
    ? Math.round((sessions.filter(s => s.completed && !s.distractions?.length).length / sessions.length) * 100)
    : 0;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      {/* ── Header ───────────────────────── */}
      <View style={styles.header}>
        <Text style={styles.headerSub}>Your performance</Text>
        <Text style={styles.headerTitle}>Analytics</Text>
      </View>

      {/* ── Score rings ──────────────────── */}
      <Card style={styles.ringsCard}>
        <Text style={styles.sectionTitle}>Performance Score</Text>
        <View style={styles.ringsRow}>
          <ScoreRing value={disciplineScore} color={C.blue}   label={'Discipline\nScore'} />
          <ScoreRing value={stability}       color={C.green}  label={'Stability\n%'}      />
          <ScoreRing value={deepWork}        color={C.yellow} label={'Deep Work\n%'}      />
        </View>
      </Card>

      {/* ── Quick stats ──────────────────── */}
      <View style={styles.statsRow}>
        {[
          { label: 'Total Hours', value: `${Math.floor(totalMins/60)}h`, color: C.blue   },
          { label: 'Sessions',    value: sessions.length,                 color: C.green  },
          { label: 'Completed',   value: completed,                       color: C.purple },
        ].map(s => (
          <Card key={s.label} style={styles.statBox}>
            <Text style={[styles.statVal, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.statLbl}>{s.label}</Text>
          </Card>
        ))}
      </View>

      {/* ── Weekly bar chart ─────────────── */}
      <Card style={{ marginBottom: 16 }}>
        <View style={styles.chartHeader}>
          <Text style={[styles.sectionTitle, { flex: 1, marginBottom: 0 }]}>Weekly Focus</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {WEEK_FILTERS.map(f => (
                <TouchableOpacity
                  key={f} onPress={() => setWeekFilter(f)}
                  style={[styles.chip, weekFilter === f && { backgroundColor: C.blue }]}
                >
                  <Text style={[styles.chipText, weekFilter === f && { color: '#fff' }]}>{f}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
        <BarChart data={WEEKLY_DATA} />
        <View style={styles.weekTotal}>
          <Text style={{ fontSize: 13, color: C.muted, fontWeight: '600' }}>Total this week</Text>
          <Text style={{ fontSize: 13, fontWeight: '800', color: C.text }}>
            {Math.floor(WEEKLY_DATA.reduce((a, d) => a + d.minutes, 0) / 60)}h{' '}
            {WEEKLY_DATA.reduce((a, d) => a + d.minutes, 0) % 60}m
          </Text>
        </View>
      </Card>

      {/* ── Distraction breakdown ─────────── */}
      <Card style={{ marginBottom: 16 }}>
        <Text style={styles.sectionTitle}>Distraction Breakdown</Text>
        {DISTRACTION_DATA.map(d => (
          <View key={d.label} style={styles.distractRow}>
            <View style={styles.distractLeft}>
              <View style={[styles.dot, { backgroundColor: d.color }]} />
              <Text style={{ fontSize: 13, color: C.text, fontWeight: '500' }}>{d.label}</Text>
            </View>
            <View style={styles.distractRight}>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${d.value}%`, backgroundColor: d.color }]} />
              </View>
              <Text style={{ fontSize: 12, fontWeight: '700', width: 34, textAlign: 'right', color: d.color }}>
                {d.value}%
              </Text>
            </View>
          </View>
        ))}
        <View style={[styles.callout, { backgroundColor: C.redSoft, borderLeftColor: C.red }]}>
          <Text style={{ fontSize: 13, color: C.muted, lineHeight: 18 }}>
            Your biggest focus enemy is{' '}
            <Text style={{ fontWeight: '800', color: C.red }}>Overthinking</Text>
            {' '}— causing 43% of all distractions.
          </Text>
        </View>
      </Card>

      {/* ── Subject time ─────────────────── */}
      <Card style={{ marginBottom: 16 }}>
        <Text style={styles.sectionTitle}>Time Per Subject</Text>
        {SUBJECTS.map(subj => {
          const mins = sessions.filter(s => s.subject === subj).reduce((a, s) => a + (s.duration || 0), 0);
          const pct  = totalMins > 0 ? Math.round((mins / totalMins) * 100) : 0;
          if (pct === 0) return null;
          return (
            <View key={subj} style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                <View style={[styles.dot, { backgroundColor: sColor(subj) }]} />
                <Text style={{ flex: 1, fontSize: 13, color: C.text, fontWeight: '600' }}>{subj}</Text>
                <Text style={{ fontSize: 12, color: C.muted, fontWeight: '600' }}>
                  {Math.floor(mins/60)}h {mins%60}m
                </Text>
              </View>
              <View style={[styles.progressTrack, { height: 6 }]}>
                <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: sColor(subj), height: 6 }]} />
              </View>
            </View>
          );
        })}
      </Card>

      {/* ── Pattern detection ────────────── */}
      <Text style={styles.sectionTitle}>Pattern Detection</Text>
      {PATTERNS.map((p, i) => (
        <View key={i} style={[styles.patternCard, { backgroundColor: p.bg }]}>
          <View style={[styles.patternAccent, { backgroundColor: p.color }]} />
          <View style={{ flex: 1, padding: 14 }}>
            <Text style={{ fontSize: 13, fontWeight: '800', color: p.color, marginBottom: 4 }}>{p.title}</Text>
            <Text style={{ fontSize: 13, color: C.muted, lineHeight: 18 }}>{p.text}</Text>
          </View>
        </View>
      ))}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: C.bg },
  content: { padding: 20, paddingBottom: 100 },

  header:      { marginBottom: 20, paddingTop: 8 },
  headerSub:   { fontSize: 12, color: C.muted, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 2 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: C.text },

  sectionTitle: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 14 },

  ringsCard: { marginBottom: 16 },
  ringsRow:  { flexDirection: 'row', justifyContent: 'space-around', paddingTop: 4 },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statBox:  { flex: 1, alignItems: 'center', padding: 14, marginBottom: 0 },
  statVal:  { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  statLbl:  { fontSize: 11, color: C.muted, fontWeight: '600', marginTop: 2, textAlign: 'center' },

  chartHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 8 },
  chartRow:    { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  barCol:      { flex: 1, alignItems: 'center', gap: 4 },
  barTopLabel: { fontSize: 9, color: C.muted, fontWeight: '600' },
  barTrack:    { width: '70%', justifyContent: 'flex-end', borderRadius: 6 },
  barFill:     { width: '100%', borderRadius: 6 },
  barDayLabel: { fontSize: 11, color: C.muted, fontWeight: '500' },
  weekTotal:   { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border },

  chip:     { paddingVertical: 5, paddingHorizontal: 12, borderRadius: 20, backgroundColor: C.blueSoft },
  chipText: { fontSize: 11, fontWeight: '600', color: C.muted },

  distractRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  distractLeft:  { flexDirection: 'row', alignItems: 'center', gap: 8, width: 130 },
  distractRight: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  dot:           { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  progressTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: C.border, marginRight: 10, overflow: 'hidden' },
  progressFill:  { height: '100%', borderRadius: 3 },
  callout:       { marginTop: 12, padding: 12, borderRadius: 12, borderLeftWidth: 3 },

  patternCard:   { flexDirection: 'row', borderRadius: 14, overflow: 'hidden', marginBottom: 10 },
  patternAccent: { width: 4 },
});