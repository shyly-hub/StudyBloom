import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { useSessions } from '../../hooks/useSessions';
import { C } from '../../themes';
import { Avatar, Card, StatCard, PrimaryButton } from '../../components';

const { width } = Dimensions.get('window');
const SIZE = width * 0.6;

export default function HomeScreen({ navigation }) {
  const { user, userData } = useAuth();
  const { sessions } = useSessions();
  const [todayMins, setTodayMins] = useState(0);

  useEffect(() => {
    const today = new Date(); today.setHours(0,0,0,0);
    const mins = sessions.filter(s => { const d = s.date?.toDate ? s.date.toDate() : new Date(s.date); d.setHours(0,0,0,0); return d.getTime() === today.getTime() && s.completed; }).reduce((sum, s) => sum + (s.duration || 0), 0);
    setTodayMins(mins);
  }, [sessions]);

  const goal = userData?.dailyGoal || 100;
  const score = userData?.score || 0;
  const pct = Math.round(Math.min(score/goal, 1) * 100);
  const greet = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };
  const name = userData?.name || user?.displayName || 'Student';

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View><Text style={styles.greet}>{greet()}</Text><Text style={styles.name}>{name.split(' ')[0]}!</Text></View>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}><Avatar name={name} size={48} /></TouchableOpacity>
      </View>

      <Card style={styles.card}>
        <View style={styles.circleWrap}>
          <View style={styles.circleBg} />
          <View style={[styles.circleProg, { transform: [{ rotate: `${pct * 3.6}deg` }] }]} />
          <View style={styles.circleText}><Text style={styles.score}>{score}</Text><Text style={styles.scoreLabel}>Score</Text><Text style={styles.goal}>of {goal}</Text></View>
        </View>
        <Text style={styles.pct}>{pct}% of daily goal</Text>
      </Card>

      <View style={styles.stats}>
        <StatCard value={todayMins} label="Minutes Today" color={C.mint} style={styles.stat} />
        <StatCard value={userData?.streak || 0} label="Day Streak" color={C.peach} style={styles.stat} />
        <StatCard value={userData?.totalSessions || 0} label="Sessions" color={C.purple} style={styles.stat} />
      </View>

      <View style={styles.btnWrap}><PrimaryButton label="START FOCUS" onPress={() => navigation.navigate('Focus', { user: userData })} colors={[C.green, C.green]} /><Text style={styles.btnSub}>Begin a study session</Text></View>

      <Card style={[styles.card, styles.tipCard]}><Text style={styles.tipTitle}>Today's Tip</Text><Text style={styles.tipText}>{pct < 50 ? "You're just getting started!" : pct < 100 ? "Great progress! Keep going!" : "Amazing! Goal reached!"}</Text></Card>

      <View style={styles.quick}>
        <Card style={styles.quickCard} onPress={() => navigation.navigate('Analytics')}><Text style={styles.quickIcon}>📊</Text><Text style={styles.quickText}>Analytics</Text></Card>
        <Card style={styles.quickCard} onPress={() => navigation.navigate('History')}><Text style={styles.quickIcon}>📜</Text><Text style={styles.quickText}>History</Text></Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60 },
  greet: { fontSize: 16, color: C.muted },
  name: { fontSize: 28, fontWeight: '700', color: C.text },
  card: { margin: 20, padding: 24, alignItems: 'center' },
  circleWrap: { width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' },
  circleBg: { position: 'absolute', width: SIZE - 40, height: SIZE - 40, borderRadius: (SIZE - 40) / 2, borderWidth: 20, borderColor: C.blueSoft },
  circleProg: { position: 'absolute', width: SIZE, height: SIZE, borderRadius: SIZE / 2, borderWidth: 20, borderColor: 'transparent', borderTopColor: C.blue, borderRightColor: C.blue },
  circleText: { alignItems: 'center' },
  score: { fontSize: 48, fontWeight: '800', color: C.text },
  scoreLabel: { fontSize: 16, color: C.muted },
  goal: { fontSize: 12, color: C.subtext },
  pct: { fontSize: 14, color: C.blue, fontWeight: '600', marginTop: 16 },
  stats: { flexDirection: 'row', paddingHorizontal: 16 },
  stat: { flex: 1, marginHorizontal: 4 },
  btnWrap: { padding: 20 },
  btnSub: { textAlign: 'center', color: C.muted, marginTop: 8 },
  tipCard: { backgroundColor: C.blueSoft },
  tipTitle: { fontSize: 14, fontWeight: '700', color: C.blue, marginBottom: 8 },
  tipText: { fontSize: 14, color: C.text },
  quick: { flexDirection: 'row', padding: 20, paddingTop: 0 },
  quickCard: { flex: 1, marginHorizontal: 4, alignItems: 'center', padding: 16 },
  quickIcon: { fontSize: 24, marginBottom: 8 },
  quickText: { fontSize: 12, color: C.text },
});