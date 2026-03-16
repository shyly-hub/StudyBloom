
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Animated, Dimensions } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { useTheme }   from '../../context/ThemeContext';
import { useSession } from '../../context/sessionContext';
import { computeMetrics, isValidSession } from '../../utils/scoreEngine';
import { SUBJECTS, sColor } from '../../themes';

const { width } = Dimensions.get('window');
const PAD = 20;

// ── Animated SVG Ring ──────────────────────────────────────────
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function AnimatedRing({ value = 0, size = 82, color, label, C, delay = 0, strokeWidth = 7 }) {
  const anim    = useRef(new Animated.Value(0)).current;
  const radius  = (size - strokeWidth) / 2;
  const circumf = 2 * Math.PI * radius;
  const clamped = Math.min(Math.max(value, 0), 100);

  const dashOffset = anim.interpolate({
    inputRange:  [0, 100],
    outputRange: [circumf, circumf - (clamped / 100) * circumf],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    Animated.spring(anim, {
      toValue: clamped, useNativeDriver: false,
      tension: 35, friction: 7, delay,
    }).start();
  }, [clamped]);

  return (
    <View style={{ alignItems: 'center', gap: 6 }}>
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={size} height={size} style={{ position: 'absolute' }}>
          <Circle cx={size/2} cy={size/2} r={radius} stroke={C.border} strokeWidth={strokeWidth} fill="none" />
          <AnimatedCircle
            cx={size/2} cy={size/2} r={radius}
            stroke={color} strokeWidth={strokeWidth} fill="none"
            strokeDasharray={circumf} strokeDashoffset={dashOffset}
            strokeLinecap="round"
            rotation="-90" origin={`${size/2},${size/2}`}
          />
        </Svg>
        <Text style={{ fontSize: size * 0.27, fontWeight: '800', color: C.text, letterSpacing: -0.5 }}>{clamped}</Text>
      </View>
      {label ? <Text style={{ fontSize: 11, fontWeight: '600', color: C.muted, textAlign: 'center', lineHeight: 14 }}>{label}</Text> : null}
    </View>
  );
}

// ── Animated Bar Chart ─────────────────────────────────────────
function BarChart({ data, C }) {
  const anims   = useRef(data.map(() => new Animated.Value(0))).current;
  const maxVal  = Math.max(...data.map(d => d.minutes), 1);
  const barH    = 110;
  const todayI  = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

  useEffect(() => {
    const springs = data.map((d, i) =>
      Animated.spring(anims[i], {
        toValue:         d.minutes > 0 ? (d.minutes / maxVal) * barH : 3,
        useNativeDriver: false,
        tension:         50, friction: 8, delay: i * 60,
      })
    );
    Animated.parallel(springs).start();
  }, [data]);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: barH + 24, gap: 4, paddingTop: 12 }}>
      {data.map((d, i) => {
        const isToday = i === todayI;
        const color   = isToday ? C.blue : C.blueSoft;
        return (
          <View key={d.day} style={{ flex: 1, alignItems: 'center', gap: 4, height: barH + 24, justifyContent: 'flex-end' }}>
            <Animated.View style={{
              width: '60%', height: anims[i], borderRadius: 6,
              backgroundColor: color,
              shadowColor: isToday ? C.blue : 'transparent',
              shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.4, shadowRadius: 6,
            }} />
            <Text style={{ fontSize: 10, color: isToday ? C.blueDark : C.muted, fontWeight: isToday ? '700' : '500' }}>
              {d.day}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// ── Donut Chart ────────────────────────────────────────────────
function DonutChart({ data, size = 140, C }) {
  const strokeW  = 22;
  const radius   = (size - strokeW) / 2;
  const circumf  = 2 * Math.PI * radius;
  const total    = data.reduce((a, d) => a + d.pct, 0) || 1;

  // Build animated arcs
  const anims = useRef(data.map(() => new Animated.Value(0))).current;
  useEffect(() => {
    Animated.parallel(
      data.map((d, i) => Animated.spring(anims[i], {
        toValue: d.pct, useNativeDriver: false,
        tension: 40, friction: 8, delay: i * 80,
      }))
    ).start();
  }, [data.length]);

  // Convert to stroke-dasharray segments
  let offset = 0;
  const segments = data.map((d, i) => {
    const dash = (d.pct / total) * circumf;
    const gap  = circumf - dash;
    const seg  = { dash, gap, offset, color: d.color };
    offset += dash;
    return seg;
  });

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
      {/* Donut */}
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={size} height={size} style={{ position: 'absolute' }}>
          {/* Track */}
          <Circle cx={size/2} cy={size/2} r={radius} stroke={C.bgRaised} strokeWidth={strokeW} fill="none" />
          {/* Segments */}
          {segments.map((seg, i) => (
            <Circle key={i}
              cx={size/2} cy={size/2} r={radius}
              stroke={seg.color} strokeWidth={strokeW} fill="none"
              strokeDasharray={`${seg.dash} ${seg.gap}`}
              strokeDashoffset={-seg.offset}
              rotation="-90" origin={`${size/2},${size/2}`}
            />
          ))}
        </Svg>
        <Text style={{ fontSize: 11, fontWeight: '700', color: C.muted, textAlign: 'center' }}>
          {data.length}{'\n'}types
        </Text>
      </View>

      {/* Legend */}
      <View style={{ flex: 1, gap: 8 }}>
        {data.slice(0, 5).map((d, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: d.color }} />
            <Text style={{ flex: 1, fontSize: 12, color: C.text, fontWeight: '600' }} numberOfLines={1}>{d.label}</Text>
            <Text style={{ fontSize: 12, fontWeight: '800', color: d.color }}>{d.pct}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ── WEEKLY DATA from real sessions ────────────────────────────
function getWeeklyData(sessions) {
  const days  = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const today = new Date();
  return days.map((day, i) => {
    const target = new Date(today);
    const diff   = i - (today.getDay() === 0 ? 6 : today.getDay() - 1);
    target.setDate(today.getDate() + diff);
    target.setHours(0,0,0,0);

    const mins = sessions
      .filter(s => isValidSession(s) && s.date && (() => {
        const d = new Date(s.date); d.setHours(0,0,0,0);
        return d.getTime() === target.getTime();
      })())
      .reduce((sum, s) => sum + Math.floor((s.durationSeconds ?? (s.duration||0)*60) / 60), 0);

    return { day, minutes: mins };
  });
}

// ── Distraction colors ─────────────────────────────────────────
const DISTRACTION_COLORS = {
  Phone:        '#e05c7a', 'Social Media': '#7c5cbf', Overthinking: '#e07840',
  Tired:        '#5080d0', Noise:         '#c8a020',  People:       '#3aaa80',
  Hunger:       '#e08040', Other:         '#a0a0a0',  Unknown:      '#c0b8a8',
};

// ══════════════════════════════════════════════════════════════════
//  MAIN SCREEN
// ══════════════════════════════════════════════════════════════════
export default function AnalyticsScreen() {
  const { C }  = useTheme();
  const { sessions, disciplineScore } = useSession();
  const [weekFilter, setWeekFilter]   = useState('This Week');

  const validSessions  = sessions.filter(isValidSession);
  const metrics        = computeMetrics(sessions);
  const totalMins      = metrics.totalMinutes;
  const weeklyData     = getWeeklyData(sessions);

  const donutData = metrics.distractionBreakdown
    .slice(0, 6)
    .map(d => ({
      label: d.label,
      pct:   d.pct,
      color: DISTRACTION_COLORS[d.label] || '#a0a0a0',
    }));

  const card = {
    backgroundColor: C.card, borderRadius: 20, padding: 16,
    marginBottom: 14, borderWidth: 1, borderColor: C.border,
    shadowColor: C.shadow, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1, shadowRadius: 10, elevation: 2,
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{ padding: PAD, paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}>

      {/* Header */}
      <Text style={{ fontSize: 11, color: C.muted, fontWeight: '600', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 3, marginTop: 8 }}>
        Your Performance
      </Text>
      <Text style={{ fontSize: 28, fontWeight: '800', color: C.text, letterSpacing: -0.5, marginBottom: 20 }}>
        Analytics
      </Text>

      {/* ── Animated score rings ─────────────────────────── */}
      <View style={card}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 16 }}>Performance Score</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
          <AnimatedRing value={disciplineScore}     color={C.blue}   label={'Discipline\nScore'} C={C} delay={0}   />
          <AnimatedRing value={metrics.stabilityPct} color={C.green}  label={'Stability\n%'}      C={C} delay={100} />
          <AnimatedRing value={metrics.deepWorkPct}  color={C.yellow} label={'Deep Work\n%'}      C={C} delay={200} />
        </View>
        {/* Invalid sessions note */}
        {metrics.invalidSessions > 0 && (
          <View style={{ marginTop: 12, backgroundColor: C.orangeSoft, borderRadius: 10, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 12 }}>⚠️</Text>
            <Text style={{ fontSize: 11, color: C.orange, fontWeight: '600', flex: 1 }}>
              {metrics.invalidSessions} session{metrics.invalidSessions > 1 ? 's' : ''} under 1 min marked Invalid — not counted in scores
            </Text>
          </View>
        )}
      </View>

      {/* ── Quick stats ──────────────────────────────────── */}
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
        {[
          { label: 'Total Hours', value: `${Math.floor(totalMins/60)}h`,  color: C.blue   },
          { label: 'Sessions',    value: metrics.validSessions,            color: C.green  },
          { label: 'Completed',   value: metrics.completedSessions,        color: C.purple },
        ].map(s => (
          <View key={s.label} style={[card, { flex: 1, alignItems: 'center', padding: 14, marginBottom: 0 }]}>
            <Text style={{ fontSize: 22, fontWeight: '800', color: s.color, letterSpacing: -0.5 }}>{s.value}</Text>
            <Text style={{ fontSize: 10, color: C.muted, fontWeight: '600', marginTop: 3, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* ── Animated bar chart ───────────────────────────── */}
      <View style={card}>
        {/* Title + filters on ONE line */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4, gap: 8 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: C.text }}>Weekly Focus</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {['This Week', 'Last Week', 'This Month'].map(f => (
                <TouchableOpacity key={f} onPress={() => setWeekFilter(f)}>
                  <View style={{ paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20, backgroundColor: weekFilter === f ? C.blue : C.blueSoft }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: weekFilter === f ? '#fff' : C.muted }}>{f}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
        <BarChart data={weeklyData} C={C} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border }}>
          <Text style={{ fontSize: 12, color: C.muted, fontWeight: '600' }}>Total this week</Text>
          <Text style={{ fontSize: 12, fontWeight: '800', color: C.text }}>
            {Math.floor(weeklyData.reduce((a,d)=>a+d.minutes,0)/60)}h {weeklyData.reduce((a,d)=>a+d.minutes,0)%60}m
          </Text>
        </View>
      </View>

      {/* ── Donut distraction chart ──────────────────────── */}
      <View style={card}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 14 }}>Distraction Breakdown</Text>
        {donutData.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 24 }}>
            <Text style={{ fontSize: 28, marginBottom: 8 }}>🎯</Text>
            <Text style={{ fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 4 }}>No distractions logged</Text>
            <Text style={{ fontSize: 12, color: C.muted }}>Keep it up — pure focus mode!</Text>
          </View>
        ) : (
          <>
            <DonutChart data={donutData} C={C} />
            {metrics.distractionBreakdown[0] && (
              <View style={{ marginTop: 14, backgroundColor: C.redSoft, borderRadius: 12, padding: 12, borderLeftWidth: 3, borderLeftColor: C.red }}>
                <Text style={{ fontSize: 12, color: C.muted, lineHeight: 17 }}>
                  Your biggest distraction is{' '}
                  <Text style={{ fontWeight: '800', color: C.red }}>
                    {metrics.distractionBreakdown[0].label}
                  </Text>
                  {' '}at {metrics.distractionBreakdown[0].pct}%.
                </Text>
              </View>
            )}
          </>
        )}
      </View>

      {/* ── Subject time ────────────────────────────────── */}
      <View style={card}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 14 }}>Time Per Subject</Text>
        {SUBJECTS.map(subj => {
          const mins = validSessions.filter(s => s.subject === subj)
            .reduce((a, s) => a + Math.floor((s.durationSeconds ?? (s.duration||0)*60) / 60), 0);
          const pct  = totalMins > 0 ? Math.round((mins / totalMins) * 100) : 0;
          if (pct === 0) return null;
          return (
            <View key={subj} style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: sColor(subj), marginRight: 8 }} />
                <Text style={{ flex: 1, fontSize: 13, color: C.text, fontWeight: '600' }}>{subj}</Text>
                <Text style={{ fontSize: 11, color: C.muted, fontWeight: '600' }}>
                  {Math.floor(mins/60)}h {mins%60}m
                </Text>
              </View>
              <View style={{ height: 6, borderRadius: 3, backgroundColor: C.bgRaised, overflow: 'hidden' }}>
                <View style={{ width: `${pct}%`, height: '100%', borderRadius: 3, backgroundColor: sColor(subj) }} />
              </View>
            </View>
          );
        })}
      </View>

      {/* ── Pattern insights ────────────────────────────── */}
      <Text style={{ fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 12 }}>Pattern Insights</Text>
      {metrics.stabilityPct === 0 && metrics.validSessions === 0 ? (
        <View style={[card, { alignItems: 'center', paddingVertical: 24 }]}>
          <Text style={{ fontSize: 28, marginBottom: 8 }}>📊</Text>
          <Text style={{ fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 4 }}>No data yet</Text>
          <Text style={{ fontSize: 12, color: C.muted, textAlign: 'center' }}>Complete a few focus sessions to see your patterns here.</Text>
        </View>
      ) : (
        [
          { title: 'Best Focus Window',  text: 'You perform best in the ' + (Object.entries(metrics.timeBreakdown).sort((a,b)=>b[1]-a[1])[0]?.[0] || 'evening') + '.', color: C.blue,   bg: C.blueSoft   },
          { title: 'Stability Score',    text: `${metrics.stabilityPct}% of valid sessions were completed.`,                                                           color: C.green,  bg: C.greenSoft  },
          { title: 'Deep Work Ratio',    text: `${metrics.deepWorkPct}% of sessions had zero distractions.`,                                                          color: C.yellow, bg: C.yellowSoft },
        ].map((p, i) => (
          <View key={i} style={{ flexDirection: 'row', borderRadius: 14, overflow: 'hidden', marginBottom: 10, backgroundColor: p.bg }}>
            <View style={{ width: 4, backgroundColor: p.color }} />
            <View style={{ flex: 1, padding: 14 }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: p.color, marginBottom: 3 }}>{p.title}</Text>
              <Text style={{ fontSize: 12, color: C.muted, lineHeight: 17 }}>{p.text}</Text>
            </View>
          </View>
        ))
      )}

    </ScrollView>
  );
}