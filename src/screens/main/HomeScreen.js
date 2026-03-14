

import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Dimensions, ActivityIndicator,
} from 'react-native';
import { LinearGradient }   from 'expo-linear-gradient';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db }               from '../../config/firebase';
import { useTheme }         from '../../context/ThemeContext';
import { useAuth }          from '../../hooks/useAuth';
import { useSession }       from '../../context/sessionContext';
import { Avatar, StatCard } from '../../components';
import { SUBJECTS, SUBJECT_ICONS, sColor, sBg } from '../../themes';

const { width } = Dimensions.get('window');
const DURATIONS  = [15, 25, 45, 60];
const DAYS_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const DAYS_FULL  = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

function getGreeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening';
}

// Format seconds → readable string
function fmtSec(s) {
  if (!s || s < 1) return '0s';
  if (s < 60)  return `${s}s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return r > 0 ? `${m}m ${r}s` : `${m}m`;
}

// ── Today's Schedule Widget ────────────────────────────────────
function ScheduleWidget({ userId, navigation, C }) {
  const [slots,   setSlots]   = useState([]);
  const [loading, setLoading] = useState(true);
  const today  = DAYS_SHORT[new Date().getDay()];

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    const load = async () => {
      try {
        const q    = query(
          collection(db, 'users', userId, 'schedule'),
          where('day', '==', today),
          orderBy('hour', 'asc')
        );
        const snap = await getDocs(q);
        setSlots(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch { /* schedule optional — fail silently */ }
      finally { setLoading(false); }
    };
    load();
  }, [userId, today]);

  return (
    <View style={{ backgroundColor: C.card, borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: C.border, shadowColor: C.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 10, elevation: 2 }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 3, height: 14, borderRadius: 2, backgroundColor: C.blue }} />
          <Text style={{ fontSize: 14, fontWeight: '700', color: C.text }}>
            Today's Plan
          </Text>
          <View style={{ backgroundColor: C.blueSoft, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 }}>
            <Text style={{ fontSize: 10, fontWeight: '700', color: C.blueDark }}>{DAYS_FULL[new Date().getDay()]}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Schedule')} activeOpacity={0.7}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: C.blue }}>Edit ›</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={C.blue} size="small" style={{ paddingVertical: 12 }} />
      ) : slots.length === 0 ? (
        /* Empty state — tap to plan */
        <TouchableOpacity onPress={() => navigation.navigate('Schedule')} activeOpacity={0.8}
          style={{ borderRadius: 14, borderWidth: 1.5, borderColor: C.border, borderStyle: 'dashed', paddingVertical: 18, alignItems: 'center', gap: 6, backgroundColor: C.bgRaised }}>
          <Text style={{ fontSize: 22 }}>📅</Text>
          <Text style={{ fontSize: 13, fontWeight: '600', color: C.text }}>No sessions planned</Text>
          <Text style={{ fontSize: 11, color: C.muted, textAlign: 'center' }}>Tap to add your study plan for today</Text>
          <View style={{ marginTop: 6, backgroundColor: C.blueSoft, borderRadius: 20, paddingVertical: 6, paddingHorizontal: 16 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: C.blueDark }}>+ Plan Today</Text>
          </View>
        </TouchableOpacity>
      ) : (
        /* Slot list */
        <View style={{ gap: 8 }}>
          {slots.map((slot, i) => {
            const hourLabel = slot.hour < 12 ? `${slot.hour}:00 AM` : slot.hour === 12 ? `12:00 PM` : `${slot.hour-12}:00 PM`;
            return (
              <TouchableOpacity
                key={slot.id}
                onPress={() => navigation.navigate('Focus', { subject: slot.subject, duration: slot.duration })}
                activeOpacity={0.8}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, padding: 11, backgroundColor: sBg(slot.subject), borderWidth: 1, borderColor: sColor(slot.subject) + '40' }}
              >
                <View style={{ width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: sColor(slot.subject) + '20' }}>
                  <Text style={{ fontSize: 18 }}>{SUBJECT_ICONS[slot.subject] || '📌'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: sColor(slot.subject) }}>{slot.label || slot.subject}</Text>
                  <Text style={{ fontSize: 11, color: sColor(slot.subject) + 'aa', marginTop: 1 }}>{hourLabel} · {slot.duration} min</Text>
                </View>
                {/* Start arrow */}
                <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: sColor(slot.subject) + '20', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 14, color: sColor(slot.subject) }}>▶</Text>
                </View>
              </TouchableOpacity>
            );
          })}
          {/* Add more link */}
          <TouchableOpacity onPress={() => navigation.navigate('Schedule')} activeOpacity={0.7}
            style={{ paddingVertical: 8, alignItems: 'center' }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: C.muted }}>+ Add more slots</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ── Recent Sessions Widget ────────────────────────────────────
function RecentWidget({ sessions, navigation, C }) {
  // Show last 3 sessions from today + yesterday
  const recent = sessions.slice(0, 3);

  if (recent.length === 0) return null;

  return (
    <View style={{ backgroundColor: C.card, borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: C.border, shadowColor: C.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 10, elevation: 2 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 3, height: 14, borderRadius: 2, backgroundColor: C.mint }} />
          <Text style={{ fontSize: 14, fontWeight: '700', color: C.text }}>Recent Sessions</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('History')} activeOpacity={0.7}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: C.blue }}>See all ›</Text>
        </TouchableOpacity>
      </View>

      {recent.map((s, i) => (
        <View key={s.id || i} style={[
          { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9 },
          i < recent.length - 1 && { borderBottomWidth: 1, borderBottomColor: C.border }
        ]}>
          <View style={{ width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: sBg(s.subject) }}>
            <Text style={{ fontSize: 16 }}>{SUBJECT_ICONS[s.subject] || '📌'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: C.text }}>{s.subject}</Text>
            {/* Shows seconds — "4s" not "0 min" */}
            <Text style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>
              {fmtSec(s.durationSeconds || (s.duration ? s.duration * 60 : 0))} · {s.completed ? '✓ Done' : '— Quit'}
            </Text>
          </View>
          <View style={{ borderRadius: 10, paddingVertical: 3, paddingHorizontal: 8, backgroundColor: s.completed ? C.greenSoft : C.redSoft }}>
            <Text style={{ fontSize: 10, fontWeight: '700', color: s.completed ? C.green : C.red }}>
              {s.completed ? 'Done' : 'Quit'}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

// ── MAIN ──────────────────────────────────────────────────────
export default function HomeScreen({ navigation }) {
  const { C }                 = useTheme();
  const auth                  = useAuth?.()     || {};
  const { sessions, loading } = useSession();
  const user                  = auth.user       || null;
  const userData              = auth.userData   || null;

  const name      = userData?.name      || user?.displayName || 'Student';
  const score     = userData?.score     ?? userData?.disciplineScore ?? 0;
  const streak    = userData?.streak    ?? 0;
  const dailyGoal = userData?.dailyGoal ?? 120;

  const [subject,  setSubject]  = useState('Math');
  const [duration, setDuration] = useState(25);

  // Today's total seconds from real sessions
  const todaySeconds = sessions
    .filter(s => {
      if (!s.date) return false;
      const d = new Date(s.date);
      d.setHours(0,0,0,0);
      const t = new Date(); t.setHours(0,0,0,0);
      return d.getTime() === t.getTime();
    })
    .reduce((a, s) => a + (s.durationSeconds || (s.duration ? s.duration * 60 : 0)), 0);

  const todayMins      = Math.floor(todaySeconds / 60);
  const progressPct    = Math.min(1, todayMins / dailyGoal);
  const hours          = Math.round((userData?.totalMinutes || 0) / 60 * 10) / 10;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{ paddingBottom: 110 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ──────────────────────── */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 8 }}>
        <View>
          <Text style={{ fontSize: 10, fontWeight: '700', color: C.blue, letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 4 }}>
            {getGreeting()} ✨
          </Text>
          <Text style={{ fontSize: 24, fontWeight: '800', color: C.text, letterSpacing: -0.5 }}>
            {name.split(' ')[0]}
          </Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')} activeOpacity={0.8}>
          <Avatar name={name} size={46} />
        </TouchableOpacity>
      </View>

      {/* ── Score card ──────────────────── */}
      <View style={{ marginHorizontal: 20, marginTop: 16, marginBottom: 16, backgroundColor: C.blue, borderRadius: 22, padding: 20, overflow: 'hidden', shadowColor: 'rgba(245,200,66,0.4)', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 1, shadowRadius: 18, elevation: 8 }}>
        <View style={{ position: 'absolute', right: -24, top: -24, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.12)' }} />
        <View style={{ position: 'absolute', left: -16, bottom: -16, width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.08)' }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
          <View>
            <Text style={{ fontSize: 10, fontWeight: '700', color: 'rgba(26,16,0,0.55)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>Discipline Score</Text>
            <Text style={{ fontSize: 48, fontWeight: '900', color: '#1a1000', letterSpacing: -2, lineHeight: 50 }}>{score}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 10, fontWeight: '700', color: 'rgba(26,16,0,0.55)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}>Streak</Text>
            <Text style={{ fontSize: 28, fontWeight: '900', color: '#1a1000' }}>{streak}<Text style={{ fontSize: 14 }}> d</Text></Text>
          </View>
        </View>
        <Text style={{ fontSize: 11, fontWeight: '600', color: 'rgba(26,16,0,0.55)', marginBottom: 7 }}>
          Daily Goal · {todayMins}m / {dailyGoal}m
        </Text>
        <View style={{ height: 7, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 4, overflow: 'hidden' }}>
          <View style={{ width: `${progressPct * 100}%`, height: '100%', backgroundColor: '#fff', borderRadius: 4 }} />
        </View>
      </View>

      {/* ── Stats ───────────────────────── */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 20 }}>
        <StatCard value={`${todayMins}m`}                      label="Today"    color={C.mint}   style={{ flex: 1 }} />
        <StatCard value={userData?.totalSessions || sessions.length || 0} label="Sessions" color={C.purple} style={{ flex: 1 }} />
        <StatCard value={hours}                                label="Hours"    color={C.peach}  style={{ flex: 1 }} />
      </View>

      {/* ── TODAY'S SCHEDULE WIDGET ─────── */}
      <View style={{ paddingHorizontal: 20, marginBottom: 4 }}>
        <ScheduleWidget userId={user?.uid} navigation={navigation} C={C} />
      </View>

      {/* ── Subject selector ────────────── */}
      <Text style={{ fontSize: 14, fontWeight: '700', color: C.text, paddingHorizontal: 20, marginBottom: 12 }}>Subject</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }} style={{ marginBottom: 16 }}>
        {SUBJECTS.map(subj => {
          const on = subject === subj;
          return (
            <TouchableOpacity key={subj} onPress={() => setSubject(subj)} activeOpacity={0.8}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 9, paddingHorizontal: 13, borderRadius: 14, backgroundColor: on ? sBg(subj) : C.card, borderWidth: 1.5, borderColor: on ? sColor(subj) : C.border }}>
              <Text style={{ fontSize: 15 }}>{SUBJECT_ICONS[subj] || '📌'}</Text>
              <Text style={{ fontSize: 12, fontWeight: '700', color: on ? sColor(subj) : C.muted }}>{subj}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Duration selector ───────────── */}
      <Text style={{ fontSize: 14, fontWeight: '700', color: C.text, paddingHorizontal: 20, marginBottom: 12 }}>Duration</Text>
      <View style={{ flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 20 }}>
        {DURATIONS.map(d => {
          const on = duration === d;
          return (
            <TouchableOpacity key={d} onPress={() => setDuration(d)} activeOpacity={0.8}
              style={{ flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 14, backgroundColor: on ? C.blueSoft : C.card, borderWidth: 1.5, borderColor: on ? C.blueDark : C.border }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: on ? C.blueDark : C.text }}>{d}</Text>
              <Text style={{ fontSize: 9, fontWeight: '600', color: on ? C.blueDark : C.muted, letterSpacing: 0.5, marginTop: 1 }}>MIN</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Start Focus button ──────────── */}
      <TouchableOpacity
        onPress={() => navigation.navigate('Focus', { subject, duration })}
        activeOpacity={0.88}
        style={{ marginHorizontal: 20, marginBottom: 24, borderRadius: 16, overflow: 'hidden', shadowColor: 'rgba(245,200,66,0.5)', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 1, shadowRadius: 16, elevation: 8 }}
      >
        <LinearGradient colors={['#f5c842', '#e8b020']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 60, alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          <Text style={{ fontSize: 15, fontWeight: '900', color: '#2a2000', letterSpacing: 1 }}>START FOCUS SESSION</Text>
          <Text style={{ fontSize: 10, color: 'rgba(42,32,0,0.55)', fontWeight: '600' }}>{subject} · {duration} min</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* ── Recent sessions ─────────────── */}
      <View style={{ paddingHorizontal: 20 }}>
        {loading ? (
          <ActivityIndicator color={C.blue} style={{ paddingVertical: 20 }} />
        ) : (
          <RecentWidget sessions={sessions} navigation={navigation} C={C} />
        )}
      </View>

      {/* ── Quick nav ───────────────────── */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 20, gap: 10 }}>
        {[
          { icon: '📊', label: 'Analytics', screen: 'Analytics' },
          { icon: '📜', label: 'History',   screen: 'History'   },
          { icon: '📋', label: 'Report',    screen: 'Report'    },
        ].map(item => (
          <TouchableOpacity key={item.screen} onPress={() => navigation.navigate(item.screen)} activeOpacity={0.8}
            style={{ flex: 1, backgroundColor: C.card, borderRadius: 16, padding: 14, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: C.border }}>
            <Text style={{ fontSize: 22 }}>{item.icon}</Text>
            <Text style={{ fontSize: 11, fontWeight: '600', color: C.muted }}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

    </ScrollView>
  );
}