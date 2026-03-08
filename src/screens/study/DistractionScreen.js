import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { C } from '../../themes/colors';

const DistractionScreen = ({ navigation }) => {
  const options = ['Phone', 'Social Media', 'Overthinking', 'Tired', 'Noise'];

  return (
    <View style={styles.container}>
      <View style={styles.sheet}>
        <Text style={styles.title}>SOURCE OF DISTRACTION</Text>
        {options.map(item => (
          <TouchableOpacity 
            key={item} 
            style={styles.card} 
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cardText}>{item.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' },
  sheet: { backgroundColor: C.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  title: { color: C.blue, fontSize: 13, fontWeight: '900', marginBottom: 20, textAlign: 'center', letterSpacing: 2 },
  card: { backgroundColor: C.bg, padding: 18, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: C.border },
  cardText: { color: C.text, textAlign: 'center', fontWeight: '700', fontSize: 12 }
});

export default DistractionScreen;