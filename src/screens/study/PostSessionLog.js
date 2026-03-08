import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { C } from '../../themes/colors';
import { useSessions } from '../../hooks/useSessions'; 

const PostSessionLog = ({ navigation, route }) => {
  const { addSession } = useSessions();
  const { elapsedMin = 0, distractions = 0, completed = false, quitReason = null } = route.params || {};
  const [mood, setMood] = useState('😌');

  const handleSave = async () => {
    // 5. DISCIPLINE SCORE LOGIC
    let score = completed ? 10 : -5;
    if (completed && distractions === 0) score += 5;

    await addSession({
      duration: elapsedMin,
      distractions,
      mood,
      score,
      completed,
      quitReason,
      timestamp: new Date()
    });

    navigation.navigate('Tabs', { screen: 'History' });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>SESSION {completed ? 'SUCCESS' : 'HALTED'}</Text>
      
      <View style={styles.summaryCard}>
        <Text style={styles.val}>{elapsedMin}M</Text>
        <Text style={styles.sub}>TOTAL FOCUS TIME</Text>
      </View>

      <Text style={styles.label}>HOW IS YOUR ENERGY?</Text>
      <View style={styles.moodRow}>
        {['😫', '😐', '😌', '🔥'].map(m => (
          <TouchableOpacity 
            key={m} 
            onPress={() => setMood(m)}
            style={[styles.moodBtn, mood === m && styles.activeMood]}
          >
            <Text style={{fontSize: 35}}>{m}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveText}>SYNC TO SYSTEM</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg, padding: 30, justifyContent: 'center' },
  header: { color: C.blue, fontWeight: '900', letterSpacing: 3, textAlign: 'center', marginBottom: 40 },
  summaryCard: { backgroundColor: C.card, padding: 40, borderRadius: 20, alignItems: 'center', marginBottom: 40, borderWidth: 1, borderColor: C.border },
  val: { fontSize: 60, color: C.text, fontWeight: '200' },
  sub: { color: C.muted, fontSize: 10, letterSpacing: 2, marginTop: 5 },
  label: { color: C.muted, fontSize: 11, textAlign: 'center', marginBottom: 20, fontWeight: '800' },
  moodRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 60 },
  moodBtn: { padding: 15, borderRadius: 15, backgroundColor: C.card },
  activeMood: { borderColor: C.blue, borderWidth: 2 },
  saveBtn: { backgroundColor: C.blue, padding: 22, borderRadius: 12, alignItems: 'center' },
  saveText: { color: '#FFF', fontWeight: '900', letterSpacing: 2 }
});

export default PostSessionLog;