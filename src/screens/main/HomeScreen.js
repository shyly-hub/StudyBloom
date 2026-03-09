import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { C } from '../../themes';
import { Avatar, Card, StatCard, PrimaryButton } from '../../components';

export default function HomeScreen({ navigation }) {
  const { user, userData } = useAuth();
  
  const getName = () => userData?.name || user?.displayName || 'Student';
  const hours = Math.round((userData?.totalMinutes || 0) / 60 * 10) / 10;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {getName()}!</Text>
          <Text style={styles.subtitle}>Ready to study?</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          <Avatar name={getName()} size={50} />
        </TouchableOpacity>
      </View>

      <Card style={styles.scoreCard}>
        <View style={styles.scoreRow}>
          <View>
            <Text style={styles.scoreLabel}>Your Score</Text>
            <Text style={styles.scoreValue}>{userData?.score || 0}</Text>
          </View>
          <View style={styles.streakBox}>
            <Text style={styles.streakLabel}>Streak</Text>
            <Text style={styles.streakValue}>{userData?.streak || 0} days</Text>
          </View>
        </View>
        <View style={styles.goalProgress}>
          <Text style={styles.goalText}>Daily Goal: {userData?.dailyGoal || 100} min</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '45%' }]} />
          </View>
        </View>
      </Card>

      <PrimaryButton 
        label="Start Focus Session" 
        onPress={() => navigation.navigate('Focus')}
        style={styles.startButton}
      />

      <View style={styles.statsRow}>
        <StatCard value={hours} label="Hours" color={C.mint} style={styles.stat} />
        <StatCard value={userData?.totalSessions || 0} label="Sessions" color={C.purple} style={styles.stat} />
      </View>

      <Card style={styles.recentCard}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <Text style={styles.emptyText}>No sessions yet. Start your first session!</Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60 },
  greeting: { fontSize: 24, fontWeight: '700', color: C.text },
  subtitle: { fontSize: 14, color: C.muted, marginTop: 4 },
  scoreCard: { margin: 20, marginTop: 0, padding: 20 },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  scoreLabel: { fontSize: 14, color: C.muted },
  scoreValue: { fontSize: 36, fontWeight: '800', color: C.blue },
  streakBox: { alignItems: 'flex-end' },
  streakLabel: { fontSize: 14, color: C.muted },
  streakValue: { fontSize: 20, fontWeight: '700', color: C.peach },
  goalProgress: { marginTop: 10 },
  goalText: { fontSize: 12, color: C.muted, marginBottom: 8 },
  progressBar: { height: 8, backgroundColor: C.border, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: C.blue, borderRadius: 4 },
  startButton: { marginHorizontal: 20, marginBottom: 20 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16 },
  stat: { flex: 1, marginHorizontal: 4 },
  recentCard: { margin: 20, marginTop: 0, padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: C.text, marginBottom: 12 },
  emptyText: { color: C.muted, textAlign: 'center', paddingVertical: 20 },
});