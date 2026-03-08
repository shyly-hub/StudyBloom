import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { C } from '../../themes/colors';

const FocusScreen = ({ navigation }) => {
  const [seconds, setSeconds] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [distractions, setDistractions] = useState(0);

  useEffect(() => {
    let interval = null;
    if (isActive && seconds > 0) {
      interval = setInterval(() => setSeconds(s => s - 1), 1000);
    } else if (seconds === 0) {
      clearInterval(interval);
      navigation.navigate('PostSession', { 
        completed: true, 
        elapsedMin: 25, 
        distractions 
      });
    }
    return () => clearInterval(interval);
  }, [isActive, seconds]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec < 10 ? '0' : ''}${sec}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.status}>SYSTEM ACTIVE</Text>
      
      <View style={styles.timerCircle}>
        <Text style={styles.timerText}>{formatTime(seconds)}</Text>
      </View>

      <TouchableOpacity 
        style={[styles.mainBtn, { backgroundColor: isActive ? C.red : C.blue }]} 
        onPress={() => setIsActive(!isActive)}
      >
        <Text style={styles.btnText}>{isActive ? 'PAUSE' : 'START FOCUS'}</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.distractBtn} 
        onPress={() => {
          setDistractions(d => d + 1);
          navigation.navigate('Distraction');
        }}
      >
        <Text style={styles.distractText}>REPORT DISTRACTION ({distractions})</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.quitBtn}
        onPress={() => navigation.navigate('QuitReason', { 
          elapsedMin: Math.floor((25 * 60 - seconds) / 60),
          distractions: distractions 
        })}
      >
        <Text style={styles.quitText}>QUIT SESSION</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  status: { color: C.blue, letterSpacing: 3, fontSize: 10, fontWeight: '900', marginBottom: 20 },
  timerCircle: { width: 280, height: 280, borderRadius: 140, borderWidth: 1, borderColor: C.border, justifyContent: 'center', alignItems: 'center', marginBottom: 50, backgroundColor: C.card },
  timerText: { fontSize: 80, fontWeight: '200', color: C.text },
  mainBtn: { width: '70%', padding: 20, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#FFF', fontWeight: '900', letterSpacing: 1 },
  distractBtn: { marginTop: 30, padding: 10 },
  distractText: { color: C.muted, textDecorationLine: 'underline', fontSize: 12 },
  quitBtn: { marginTop: 20 },
  quitText: { color: C.red, fontSize: 11, fontWeight: '700', letterSpacing: 1 }
});

export default FocusScreen;