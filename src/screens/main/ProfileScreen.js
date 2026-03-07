import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, TextInput, Modal } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
	import { C } from '../../themes'; 
import { Avatar, Card, StatCard, PrimaryButton, SecondaryButton, ListCard } from '../../components';

export default function ProfileScreen({ navigation }) {
  const { user, userData, logout, updateUserData } = useAuth();
  const [edit, setEdit] = useState(false);
  const [editName, setEditName] = useState(userData?.name || '');
  const [editGoal, setEditGoal] = useState(userData?.dailyGoal?.toString() || '100');

  const getName = () => userData?.name || user?.displayName || 'Student';
  const hours = Math.round((userData?.totalMinutes || 0) / 60 * 10) / 10;

  function handleLogout() { Alert.alert('Log Out', 'Are you sure?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Log Out', style: 'destructive', onPress: () => logout().catch(() => Alert.alert('Error', 'Failed to log out')) }]); }
  
  function handleSave() {
    if (!editName.trim()) { Alert.alert('Error', 'Enter a valid name'); return; }
    const goal = parseInt(editGoal);
    if (isNaN(goal) || goal < 10 || goal > 500) { Alert.alert('Error', 'Goal must be 10-500'); return; }
    updateUserData({ name: editName.trim(), dailyGoal: goal }).then(() => { setEdit(false); Alert.alert('Success', 'Profile updated'); }).catch(() => Alert.alert('Error', 'Update failed'));
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}><TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>← Back</Text></TouchableOpacity><Text style={styles.title}>Profile</Text><View style={{ width: 50 }} /></View>

      <Card style={styles.profileCard}>
        <Avatar name={getName()} size={80} style={styles.avatar} />
        <Text style={styles.userName}>{getName()}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <Text style={styles.badge}>{userData?.education || 'Student'}</Text>
        <TouchableOpacity style={styles.editBtn} onPress={() => setEdit(true)}><Text style={styles.editText}>Edit Profile</Text></TouchableOpacity>
      </Card>

      <View style={styles.stats}>
        <StatCard value={userData?.score || 0} label="Score" color={C.blue} style={styles.stat} />
        <StatCard value={userData?.streak || 0} label="Streak" color={C.peach} style={styles.stat} />
        <StatCard value={hours} label="Hours" color={C.mint} style={styles.stat} />
        <StatCard value={userData?.totalSessions || 0} label="Sessions" color={C.purple} style={styles.stat} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        <ListCard accentColor={C.blue} onPress={() => setEdit(true)}><Text style={styles.listIcon}>✏️</Text><Text style={styles.listText}>Edit Profile</Text><Text style={styles.listArrow}>›</Text></ListCard>
        <ListCard accentColor={C.muted} onPress={() => navigation.navigate('Settings')}><Text style={styles.listIcon}>⚙️</Text><Text style={styles.listText}>App Settings</Text><Text style={styles.listArrow}>›</Text></ListCard>
        <ListCard accentColor={C.purple} onPress={() => navigation.navigate('Report')}><Text style={styles.listIcon}>📊</Text><Text style={styles.listText}>Weekly Report</Text><Text style={styles.listArrow}>›</Text></ListCard>
      </View>

      <TouchableOpacity style={styles.logout} onPress={handleLogout}><Text style={styles.logoutText}>Log Out</Text></TouchableOpacity>

      <Modal visible={edit} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <View style={styles.field}><Text style={styles.label}>Name</Text><TextInput style={styles.input} value={editName} onChangeText={setEditName} placeholder="Your name" placeholderTextColor={C.subtext} /></View>
            <View style={styles.field}><Text style={styles.label}>Daily Goal</Text><TextInput style={styles.input} value={editGoal} onChangeText={setEditGoal} placeholder="100" placeholderTextColor={C.subtext} keyboardType="number-pad" /></View>
            <View style={styles.modalBtns}><SecondaryButton label="Cancel" onPress={() => setEdit(false)} style={styles.modalBtn} /><PrimaryButton label="Save" onPress={handleSave} style={styles.modalBtn} /></View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60 },
  back: { fontSize: 16, color: C.blue, fontWeight: '600' },
  title: { fontSize: 18, fontWeight: '700', color: C.text },
  profileCard: { margin: 20, padding: 24, alignItems: 'center' },
  avatar: { marginBottom: 16 },
  userName: { fontSize: 24, fontWeight: '700', color: C.text },
  email: { fontSize: 14, color: C.muted },
  badge: { backgroundColor: C.blueSoft, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, color: C.blue, fontWeight: '600', marginTop: 12, marginBottom: 16 },
  editBtn: { borderWidth: 1, borderColor: C.blue, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20 },
  editText: { color: C.blue, fontWeight: '600' },
  stats: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16 },
  stat: { width: '50%', padding: 4 },
  section: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: C.text, marginBottom: 16 },
  listIcon: { fontSize: 20, marginRight: 12 },
  listText: { flex: 1, fontSize: 16, color: C.text },
  listArrow: { fontSize: 20, color: C.muted },
  logout: { margin: 20, marginTop: 32, backgroundColor: C.redSoft, borderRadius: 12, padding: 16, alignItems: 'center' },
  logoutText: { fontSize: 16, fontWeight: '700', color: C.red },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modal: { backgroundColor: C.card, borderRadius: 20, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: C.text, textAlign: 'center', marginBottom: 24 },
  field: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: C.text, marginBottom: 8 },
  input: { backgroundColor: C.bg, borderRadius: 12, padding: 16, fontSize: 16, borderWidth: 1, borderColor: C.border },
  modalBtns: { flexDirection: 'row', marginTop: 16 },
  modalBtn: { flex: 1, marginHorizontal: 4 },
});