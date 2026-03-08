import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Dimensions, Alert,
} from 'react-native';
import { useAuth }     from '../../hooks/useAuth';
import { useSessions } from '../../hooks/useSessions';
import { C }           from '../../themes';
import { Avatar, Card, StatCard, PrimaryButton } from '../../components';

const { width } = Dimensions.get('window');
const SIZE = width * 0.6;

export default function HomeScreen({ navigation }) {
  const { user, userData } = useAuth();
  const { sessions }       = useSessions();
  const [todayMins, setTodayMins] = useState(0);

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const mins = sessions
      .filter(s => {
        const d = s.date?.toDate ? s.date.toDate() : new Date(s.date);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === today.getTime() && s.completed;
      })
      .reduce((sum, s) => sum + (s.duration || 0), 0);
    setTodayMins(mins);
  }, [sessions]);

  const goal  = userData?.dailyGoal || 100;
  const score = userData?.score     || 0;
  const pct   = Math.round(Math.min(score / goal, 1) * 100);
  const name  = userData?.name || user?.displayName || 'Student';

  const greet = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greet}>{greet()}</Text>
          <Text style={styles.name}>{name.split(' ')[0]}!</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          <Avatar name={name} size={48} />
        </TouchableOpacity>
      </View>

      {/* ── Score ring card ── */}
      <Card style={styles.card}>
        <View style={styles.circleWrap}>
          <View style={styles.circleBg} />
          <View style={[styles.circleProg, { transform: [{ rotate: `${pct * 3.6}deg` }] }]} />
          <View style={styles.circleText}>
            <Text style={styles.score}>{score}</Text>
            <Text style={styles.scoreLabel}>Score</Text>
            <Text style={styles.goalText}>of {goal}</Text>
          </View>
        </View>
        <Text style={styles.pct}>{pct}% of daily goal</Text>
      </Card>

      {/* ── Stats row ── */}
      <View style={styles.stats}>
        <StatCard value={todayMins}                   label="Minutes Today" color={C.mint}   style={styles.stat} />
        <StatCard value={userData?.streak       || 0} label="Day Streak"    color={C.peach}  style={styles.stat} />
        <StatCard value={userData?.totalSessions|| 0} label="Sessions"      color={C.purple} style={styles.stat} />
      </View>

      {/* ── Start Focus button ── */}
      <View style={styles.btnWrap}>
        <PrimaryButton
          label="START FOCUS"
          onPress={() => navigation.navigate('Focus')} 
          colors={[C.blue, C.blueDark]}
        />
        <Text style={styles.btnSub}>Begin a study session</Text>
      </View>

      {/* ── Tip card ── */}
      <Card style={[styles.card, styles.tipCard]}>
        <Text style={styles.tipTitle}>Today's Tip</Text>
        <Text style={styles.tipText}>
          {pct < 50
            ? "You're just getting started! Every minute counts. 💪"
            : pct < 100
            ? "Great progress! Keep going, you're almost there! 🔥"
            : "Amazing! Daily goal reached! Rest and repeat. 🎉"}
        </Text>
      </Card>

      {/* ── Quick nav ── */}
      <View style={styles.quick}>
        <TouchableOpacity
          style={styles.quickCard}
          onPress={() => navigation.navigate('Analytics')}
        >
          <Text style={styles.quickIcon}>📊</Text>
          <Text style={styles.quickText}>Analytics</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickCard}
          onPress={() => navigation.navigate('History')}
        >
          <Text style={styles.quickIcon}>📜</Text>
          <Text style={styles.quickText}>History</Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  header:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60 },
  greet:     { fontSize: 16, color: C.muted },
  name:      { fontSize: 28, fontWeight: '700', color: C.text },

  card:      { margin: 20, padding: 24, alignItems: 'center' },

  circleWrap: { width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' },
  circleBg:   { position: 'absolute', width: SIZE - 40, height: SIZE - 40, borderRadius: (SIZE - 40) / 2, borderWidth: 20, borderColor: C.blueSoft },
  circleProg: { position: 'absolute', width: SIZE, height: SIZE, borderRadius: SIZE / 2, borderWidth: 20, borderColor: 'transparent', borderTopColor: C.blue, borderRightColor: C.blue },
  circleText: { alignItems: 'center' },
  score:      { fontSize: 48, fontWeight: '800', color: C.text },
  scoreLabel: { fontSize: 16, color: C.muted },
  goalText:   { fontSize: 12, color: C.subtext },
  pct:        { fontSize: 14, color: C.blue, fontWeight: '600', marginTop: 16 },

  stats: { flexDirection: 'row', paddingHorizontal: 16 },
  stat:  { flex: 1, marginHorizontal: 4 },

  btnWrap: { padding: 20 },
  btnSub:  { textAlign: 'center', color: C.muted, marginTop: 8, fontSize: 13 },

  tipCard:  { backgroundColor: C.blueSoft, marginTop: 0 },
  tipTitle: { fontSize: 14, fontWeight: '700', color: C.blue, marginBottom: 8 },
  tipText:  { fontSize: 14, color: C.text, lineHeight: 20 },

  quick:     { flexDirection: 'row', padding: 20, paddingTop: 0, gap: 12 },
  quickCard: { flex: 1, backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border, alignItems: 'center', padding: 20 },
  quickIcon: { fontSize: 28, marginBottom: 8 },
  quickText: { fontSize: 13, fontWeight: '600', color: C.text },
});