import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Dimensions, ActivityIndicator, Image,
  FlatList, Animated,
} from 'react-native';
import { LinearGradient }   from 'expo-linear-gradient';
import * as Haptics         from 'expo-haptics';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db }               from '../../config/firebase';
import { useTheme }         from '../../context/ThemeContext';
import { useAuth }          from '../../hooks/useAuth';
import { useSession }       from '../../context/sessionContext';
import { Avatar, StatCard } from '../../components';
import { SUBJECTS, SUBJECT_ICONS, sColor, sBg } from '../../themes';

const { width } = Dimensions.get('window');

const ALL_DURATIONS = Array.from({ length: 36 }, (_, i) => (i + 1) * 5);
const QUICK_PRESETS = [15, 25, 45, 60, 90];
const DAYS_SHORT    = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const DAYS_FULL     = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

const QUOTES = [
  'Every minute of focus builds your future. 🌱',
  'Small steps every day lead to big results. 🚀',
  'Your discipline today shapes your tomorrow. ⭐',
  'Focus is the bridge between goals and results. 🌉',
  'Progress blooms where patience stays. 🌸',
  'One session at a time. You\'ve got this. 💪',
  'The secret to getting ahead is getting started. 🔑',
];

function getGreeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening';
}

function fmtSec(s) {
  if (!s || s < 1) return '0s';
  if (s < 60)      return `${s}s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return r > 0 ? `${m}m ${r}s` : `${m}m`;
}

function getAvatarSource(avatarId) {
  switch (avatarId) {
    case 'boy1':  return require('../../../assets/boy1.jpg');
    case 'boy2':  return require('../../../assets/boy2.jpg');
    case 'boy3':  return require('../../../assets/boy3.jpg');
    case 'girl1': return require('../../../assets/girl1.jpg');
    case 'girl2': return require('../../../assets/girl2.jpg');
    case 'girl3': return require('../../../assets/girl3.jpg');
    case 'girl4': return require('../../../assets/girl4.jpg');
    default:      return null;
  }
}

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

// ── Typewriter quote ──────────────────────
function TypewriterQuote({ C }) {
  const [text,      setText]      = useState('');
  const [quoteIdx,  setQuoteIdx]  = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    const fullText = QUOTES[quoteIdx];

    const tick = () => {
      if (!isDeleting) {
        if (text.length < fullText.length) {
          setText(fullText.slice(0, text.length + 1));
          timerRef.current = setTimeout(tick, 40);
        } else {
          timerRef.current = setTimeout(() => setIsDeleting(true), 2500);
        }
      } else {
        if (text.length > 0) {
          setText(text.slice(0, -1));
          timerRef.current = setTimeout(tick, 20);
        } else {
          setIsDeleting(false);
          setQuoteIdx(i => (i + 1) % QUOTES.length);
        }
      }
    };

    timerRef.current = setTimeout(tick, 40);
    return () => clearTimeout(timerRef.current);
  }, [text, isDeleting, quoteIdx]);

  return (
    <View style={{ alignItems: 'center', paddingHorizontal: 30, marginBottom: 24, minHeight: 48 }}>
      <Text style={{ fontSize: 13, color: C.muted, textAlign: 'center', lineHeight: 20, fontStyle: 'italic' }}>
        {text}
        <Text style={{ color: C.blue }}>|</Text>
      </Text>
    </View>
  );
}

// ── Schedule Widget ───────────────────────
function ScheduleWidget({ userId, navigation, C }) {
  const [slots,   setSlots]   = useState([]);
  const [loading, setLoading] = useState(true);
  const today = DAYS_SHORT[new Date().getDay()];

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    const load = async () => {
      try {
        const q    = query(collection(db, 'users', userId, 'schedule'), where('day', '==', today), orderBy('hour', 'asc'));
        const snap = await getDocs(q);
        setSlots(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch {}
      finally { setLoading(false); }
    };
    load();
  }, [userId, today]);

  return (
    <View style={{ backgroundColor: C.card, borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: C.border, shadowColor: C.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 10, elevation: 2 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 3, height: 14, borderRadius: 2, backgroundColor: C.blue }} />
          <Text style={{ fontSize: 14, fontWeight: '700', color: C.text }}>Today's Plan</Text>
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
        <ScalePress onPress={() => navigation.navigate('Schedule')}>
          <View style={{ borderRadius: 14, borderWidth: 1.5, borderColor: C.border, borderStyle: 'dashed', paddingVertical: 18, alignItems: 'center', gap: 6, backgroundColor: C.bgRaised }}>
            <Text style={{ fontSize: 22 }}>📅</Text>
            <Text style={{ fontSize: 13, fontWeight: '600', color: C.text }}>No sessions planned</Text>
            <Text style={{ fontSize: 11, color: C.muted }}>Tap to add your study plan for today</Text>
            <View style={{ marginTop: 6, backgroundColor: C.blueSoft, borderRadius: 20, paddingVertical: 6, paddingHorizontal: 16 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: C.blueDark }}>+ Plan Today</Text>
            </View>
          </View>
        </ScalePress>
      ) : (
        <View style={{ gap: 8 }}>
          {slots.map(slot => {
            const hourLabel = slot.hour < 12 ? `${slot.hour}:00 AM` : slot.hour === 12 ? `12:00 PM` : `${slot.hour-12}:00 PM`;
            return (
              <ScalePress key={slot.id} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); navigation.navigate('Focus', { subject: slot.subject, duration: slot.duration }); }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, padding: 11, backgroundColor: sBg(slot.subject), borderWidth: 1, borderColor: sColor(slot.subject) + '40' }}>
                  <View style={{ width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: sColor(slot.subject) + '20' }}>
                    <Text style={{ fontSize: 18 }}>{SUBJECT_ICONS[slot.subject] || '📌'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: sColor(slot.subject) }}>{slot.label || slot.subject}</Text>
                    <Text style={{ fontSize: 11, color: sColor(slot.subject) + 'aa', marginTop: 1 }}>{hourLabel} · {slot.duration} min</Text>
                  </View>
                  <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: sColor(slot.subject) + '20', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 14, color: sColor(slot.subject) }}>▶</Text>
                  </View>
                </View>
              </ScalePress>
            );
          })}
          <TouchableOpacity onPress={() => navigation.navigate('Schedule')} activeOpacity={0.7} style={{ paddingVertical: 8, alignItems: 'center' }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: C.muted }}>+ Add more slots</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ── Recent Sessions Widget ────────────────
function RecentWidget({ sessions, navigation, C }) {
  const recent = sessions.slice(0, 3);
  if (recent.length === 0) return null;

  return (
    <View style={{ backgroundColor: C.card, borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: C.border, shadowColor: C.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 10, elevation: 2 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 3, height: 14, borderRadius: 2, backgroundColor: C.mint }} />
          <Text style={{ fontSize: 14, fontWeight: '700', color: C.text }}>Recent Sessions</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Tabs', { screen: 'History' })} activeOpacity={0.7}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: C.blue }}>See all ›</Text>
        </TouchableOpacity>
      </View>
      {recent.map((s, i) => (
        <View key={s.id || i} style={[{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9 }, i < recent.length - 1 && { borderBottomWidth: 1, borderBottomColor: C.border }]}>
          <View style={{ width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: sBg(s.subject) }}>
            <Text style={{ fontSize: 16 }}>{SUBJECT_ICONS[s.subject] || '📌'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: C.text }}>{s.subject}</Text>
            <Text style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>
              {fmtSec(s.durationSeconds || (s.duration ? s.duration * 60 : 0))} · {s.completed ? '✓ Done' : '— Quit'}
            </Text>
          </View>
          {/* Small status dot */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: s.completed ? C.green : C.red }} />
            <Text style={{ fontSize: 10, fontWeight: '600', color: s.completed ? C.green : C.red }}>
              {s.completed ? 'Done' : 'Quit'}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

// ══════════════════════════════════════════
//  MAIN SCREEN
// ══════════════════════════════════════════
export default function HomeScreen({ navigation }) {
  const { C }                 = useTheme();
  const auth                  = useAuth?.() || {};
  const { sessions, loading } = useSession();
  const user                  = auth.user     || null;
  const userData              = auth.userData || null;

  const name      = userData?.name    || user?.displayName || 'Student';
  const score     = userData?.score   ?? userData?.disciplineScore ?? 0;
  const streak    = userData?.streak  ?? 0;
  const dailyGoal = userData?.dailyGoal ?? 120;
  const avatarId  = userData?.avatarId  || null;
  const avatarSource = getAvatarSource(avatarId);

  const [subject,  setSubject]  = useState('Math');
  const [duration, setDuration] = useState(25);
  const durationListRef = useRef(null);

  useEffect(() => {
    const index = ALL_DURATIONS.indexOf(duration);
    if (index >= 0 && durationListRef.current) {
      setTimeout(() => durationListRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 }), 300);
    }
  }, []);

  const todaySeconds = sessions
    .filter(s => {
      if (!s.date) return false;
      const d = new Date(s.date); d.setHours(0,0,0,0);
      const t = new Date();       t.setHours(0,0,0,0);
      return d.getTime() === t.getTime();
    })
    .reduce((a, s) => a + (s.durationSeconds || (s.duration ? s.duration * 60 : 0)), 0);

  const todayMins   = Math.floor(todaySeconds / 60);
  const progressPct = Math.min(1, todayMins / dailyGoal);
  const hours       = Math.round(((userData?.totalMinutes || 0) / 60) * 10) / 10;

  const handleStartFocus = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Focus', { subject, duration });
  };

  const bentoCard = {
    backgroundColor: C.card, borderRadius: 24, borderWidth: 1, borderColor: C.border,
    shadowColor: C.shadow, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1, shadowRadius: 8, elevation: 3,
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{ paddingBottom: 110 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ── */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 8 }}>
        <View>
          <Text style={{ fontSize: 10, fontWeight: '700', color: C.blue, letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 4 }}>
            {getGreeting()} ✨
          </Text>
          <Text style={{ fontSize: 24, fontWeight: '800', color: C.text, letterSpacing: -0.5 }}>
            {name.split(' ')[0]}
          </Text>
        </View>
        <ScalePress onPress={() => navigation.navigate('Tabs', { screen: 'Profile' })}>
          {avatarSource ? (
            <Image source={avatarSource} style={{ width: 46, height: 46, borderRadius: 23, borderWidth: 2, borderColor: C.blue }} />
          ) : (
            <Avatar name={name} size={46} />
          )}
        </ScalePress>
      </View>

      {/* ── Score card ── */}
      <View style={{
        marginHorizontal: 20, marginTop: 16, marginBottom: 16,
        backgroundColor: C.blue, borderRadius: 22, padding: 20, overflow: 'hidden',
        shadowColor: 'rgba(245,200,66,0.4)', shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 1, shadowRadius: 18, elevation: 8,
      }}>
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

      {/* ── Bento stats grid ── */}
      <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
          {/* Today minutes — wide */}
          <View style={[bentoCard, { flex: 1.5, padding: 16 }]}>
            <Text style={{ fontSize: 11, color: C.muted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Today</Text>
            <Text style={{ fontSize: 32, fontWeight: '900', color: C.mint, letterSpacing: -1 }}>{todayMins}<Text style={{ fontSize: 14, fontWeight: '600' }}>m</Text></Text>
            <View style={{ height: 4, backgroundColor: C.border, borderRadius: 2, overflow: 'hidden', marginTop: 8 }}>
              <View style={{ width: `${progressPct * 100}%`, height: '100%', backgroundColor: C.mint, borderRadius: 2 }} />
            </View>
          </View>
          {/* Sessions */}
          <View style={[bentoCard, { flex: 1, padding: 16, alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={{ fontSize: 11, color: C.muted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Sessions</Text>
            <Text style={{ fontSize: 32, fontWeight: '900', color: C.purple, letterSpacing: -1 }}>
              {userData?.totalSessions || sessions.length || 0}
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {/* Hours */}
          <View style={[bentoCard, { flex: 1, padding: 16, alignItems: 'center' }]}>
            <Text style={{ fontSize: 22, marginBottom: 4 }}>⏱</Text>
            <Text style={{ fontSize: 22, fontWeight: '800', color: C.peach }}>{hours}h</Text>
            <Text style={{ fontSize: 10, color: C.muted, fontWeight: '600', marginTop: 2 }}>Hours</Text>
          </View>
          {/* Completion */}
          <View style={[bentoCard, { flex: 1, padding: 16, alignItems: 'center' }]}>
            <Text style={{ fontSize: 22, marginBottom: 4 }}>✅</Text>
            <Text style={{ fontSize: 22, fontWeight: '800', color: C.green }}>
              {sessions.length > 0 ? Math.round((sessions.filter(s => s.completed).length / sessions.length) * 100) : 0}%
            </Text>
            <Text style={{ fontSize: 10, color: C.muted, fontWeight: '600', marginTop: 2 }}>Done Rate</Text>
          </View>
          {/* Streak */}
          <View style={[bentoCard, { flex: 1, padding: 16, alignItems: 'center' }]}>
            <Text style={{ fontSize: 22, marginBottom: 4 }}>🔥</Text>
            <Text style={{ fontSize: 22, fontWeight: '800', color: C.orange }}>{streak}</Text>
            <Text style={{ fontSize: 10, color: C.muted, fontWeight: '600', marginTop: 2 }}>Streak</Text>
          </View>
        </View>
      </View>

      {/* ── Schedule widget ── */}
      <View style={{ paddingHorizontal: 20 }}>
        <ScheduleWidget userId={user?.uid} navigation={navigation} C={C} />
      </View>

      {/* ── Subject selector ── */}
      <Text style={{ fontSize: 14, fontWeight: '700', color: C.text, paddingHorizontal: 20, marginBottom: 12 }}>Subject</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }} style={{ marginBottom: 20 }}>
        {SUBJECTS.map(subj => {
          const on = subject === subj;
          return (
            <ScalePress key={subj} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSubject(subj); }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 9, paddingHorizontal: 13, borderRadius: 14, backgroundColor: on ? sBg(subj) : C.card, borderWidth: 1.5, borderColor: on ? sColor(subj) : C.border }}>
                <Text style={{ fontSize: 15 }}>{SUBJECT_ICONS[subj] || '📌'}</Text>
                <Text style={{ fontSize: 12, fontWeight: '700', color: on ? sColor(subj) : C.muted }}>{subj}</Text>
              </View>
            </ScalePress>
          );
        })}
      </ScrollView>

      {/* ── Duration selector ── */}
      <View style={{ marginBottom: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 10 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: C.text }}>Duration</Text>
          <Text style={{ fontSize: 14, fontWeight: '800', color: C.blueDark }}>{duration} min</Text>
        </View>

        {/* Quick presets */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }} style={{ marginBottom: 12 }}>
          {QUICK_PRESETS.map(preset => (
            <ScalePress key={preset} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setDuration(preset); }}>
              <View style={{ paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, backgroundColor: duration === preset ? C.blue : C.blueSoft, borderWidth: 1, borderColor: duration === preset ? C.blueDark : C.border }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: duration === preset ? '#2a2000' : C.blueDark }}>{preset}m ⚡</Text>
              </View>
            </ScalePress>
          ))}
        </ScrollView>

        {/* Scroll picker */}
        <FlatList
          ref={durationListRef}
          data={ALL_DURATIONS}
          renderItem={({ item }) => {
            const isSelected = item === duration;
            return (
              <ScalePress onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setDuration(item); }}>
                <View style={{ width: 64, height: 72, borderRadius: 18, marginRight: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: isSelected ? C.blue : C.card, borderWidth: isSelected ? 0 : 1.5, borderColor: C.border, shadowColor: isSelected ? C.blue : 'transparent', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: isSelected ? 6 : 0 }}>
                  <Text style={{ fontSize: 20, fontWeight: '800', color: isSelected ? '#2a2000' : C.text, letterSpacing: -0.5 }}>{item}</Text>
                  <Text style={{ fontSize: 9, fontWeight: '600', color: isSelected ? '#2a200099' : C.muted, marginTop: 2 }}>min</Text>
                </View>
              </ScalePress>
            );
          }}
          keyExtractor={item => item.toString()}
          horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20 }}
          snapToInterval={74} decelerationRate="fast"
          onMomentumScrollEnd={(e) => {
            const index   = Math.round(e.nativeEvent.contentOffset.x / 74);
            const snapped = ALL_DURATIONS[Math.max(0, Math.min(index, ALL_DURATIONS.length - 1))];
            if (snapped !== duration) { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setDuration(snapped); }
          }}
          getItemLayout={(_, index) => ({ length: 74, offset: 74 * index, index })}
        />
      </View>

      {/* ── Start Focus button ── */}
      <ScalePress onPress={handleStartFocus} style={{ marginHorizontal: 20, marginBottom: 24 }}>
        <LinearGradient
          colors={['#f5c842', '#e8b020']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={{ height: 64, borderRadius: 18, alignItems: 'center', justifyContent: 'center', gap: 2, shadowColor: 'rgba(245,200,66,0.5)', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 1, shadowRadius: 16, elevation: 8 }}
        >
          <Text style={{ fontSize: 15, fontWeight: '900', color: '#2a2000', letterSpacing: 1 }}>START FOCUS SESSION</Text>
          <Text style={{ fontSize: 11, color: 'rgba(42,32,0,0.55)', fontWeight: '600' }}>{subject} · {duration} min</Text>
        </LinearGradient>
      </ScalePress>

      {/* ── Typewriter quote ── */}
      <TypewriterQuote C={C} />

      {/* ── Recent sessions ── */}
      <View style={{ paddingHorizontal: 20 }}>
        {loading ? (
          <ActivityIndicator color={C.blue} style={{ paddingVertical: 20 }} />
        ) : (
          <RecentWidget sessions={sessions} navigation={navigation} C={C} />
        )}
      </View>

      {/* ── Quick nav ── */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 20 }}>
        {[
          { icon: '📊', label: 'Analytics', screen: 'Stats'   },
          { icon: '📜', label: 'History',   screen: 'History' },
          { icon: '📋', label: 'Report',    screen: 'Report'  },
        ].map(item => (
          <ScalePress key={item.screen} onPress={() => navigation.navigate('Tabs', { screen: item.screen })}
            style={{ flex: 1, backgroundColor: C.card, borderRadius: 16, padding: 14, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: C.border }}>
            <Text style={{ fontSize: 22 }}>{item.icon}</Text>
            <Text style={{ fontSize: 11, fontWeight: '600', color: C.muted }}>{item.label}</Text>
          </ScalePress>
        ))}
      </View>

    </ScrollView>
  );
}