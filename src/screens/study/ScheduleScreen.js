import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, Animated,
  Modal, Pressable, Platform, TextInput, Dimensions,
  KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient }       from 'expo-linear-gradient';
import {
  collection, query, orderBy,
  getDocs, addDoc, deleteDoc, doc, serverTimestamp,
} from 'firebase/firestore';
import { db }                   from '../../config/firebase';
import { useAuth }              from '../../hooks/useAuth';
import { useTheme }             from '../../context/ThemeContext';
import { SUBJECTS, SUBJECT_ICONS, sColor, sBg } from '../../themes';
import DailyQuote               from '../../components/DailyQuote';

const { width } = Dimensions.get('window');
const DAYS_SHORT = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const DAYS_FULL  = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const DURATIONS  = [15, 25, 30, 45, 60, 90];

// ── Spring press ───────────────────────────────────────────────
function Tap({ onPress, children, style, disabled }) {
  const scale = useRef(new Animated.Value(1)).current;
  const down  = () => Animated.spring(scale, { toValue: 0.95, useNativeDriver: true, tension: 400, friction: 18 }).start();
  const up    = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, tension: 300, friction: 14 }).start();
  if (disabled) return <View style={style}>{children}</View>;
  return (
    <Pressable onPressIn={down} onPressOut={up} onPress={onPress}>
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

// ── Add Slot Bottom Sheet ──────────────────────────────────────
function AddSlotSheet({ visible, day, onSave, onClose, C }) {
  const [subject,  setSubject]  = useState('Math');
  const [duration, setDuration] = useState(25);
  const [hour,     setHour]     = useState(8);
  const [label,    setLabel]    = useState('');
  const [saving,   setSaving]   = useState(false);
  const slideY = useRef(new Animated.Value(600)).current;
  const fadeB  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setSubject('Math'); setDuration(25); setHour(8); setLabel('');
      Animated.parallel([
        Animated.spring(slideY, { toValue: 0, useNativeDriver: true, tension: 80, friction: 14 }),
        Animated.timing(fadeB,  { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideY, { toValue: 600, duration: 220, useNativeDriver: true }),
        Animated.timing(fadeB,  { toValue: 0,   duration: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const save = async () => {
    setSaving(true);
    try { await onSave({ subject, duration, hour, label: label.trim() || subject }); onClose(); }
    catch { Alert.alert('Error', 'Could not save. Try again.'); }
    finally { setSaving(false); }
  };

  const HOUR_OPTS = [6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22];

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      {/* Backdrop */}
      <Animated.View style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.45)', opacity: fadeB,
      }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
      </Animated.View>

      {/* KeyboardAvoidingView pushes the sheet up when keyboard appears */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}
        keyboardVerticalOffset={0}
      >
        <Animated.View style={{
          backgroundColor:     C.card,
          borderTopLeftRadius:  28,
          borderTopRightRadius: 28,
          borderTopWidth:       1,
          borderTopColor:       C.border,
          // Max height so it doesn't fill the whole screen on tall phones
          maxHeight:            '90%',
          transform:            [{ translateY: slideY }],
        }}>
          {/* Drag handle — always visible above the scroll */}
          <View style={{ paddingHorizontal: 22, paddingTop: 14, paddingBottom: 4 }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginBottom: 16 }} />
            <Text style={{ fontSize: 20, fontWeight: '800', color: C.text, marginBottom: 2 }}>Add Study Slot</Text>
            <Text style={{ fontSize: 12, color: C.muted, marginBottom: 14 }}>{DAYS_FULL[DAYS_SHORT.indexOf(day)] || day}</Text>
          </View>

          {/* Scrollable form — scrolls up so label field stays above keyboard */}
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 22,
              paddingBottom: Platform.OS === 'ios' ? 44 : 32,
            }}
          >
            {/* Subject */}
            <Text style={{ fontSize: 8, fontWeight: '800', color: C.muted, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>SUBJECT</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }} keyboardShouldPersistTaps="handled">
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {SUBJECTS.map(subj => {
                  const on = subject === subj;
                  return (
                    <Tap key={subj} onPress={() => setSubject(subj)}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 9, paddingHorizontal: 13, borderRadius: 14, backgroundColor: on ? sBg(subj) : C.bgRaised, borderWidth: 1.5, borderColor: on ? sColor(subj) : C.border }}>
                        <Text style={{ fontSize: 14 }}>{SUBJECT_ICONS[subj] || '📌'}</Text>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: on ? sColor(subj) : C.muted }}>{subj}</Text>
                      </View>
                    </Tap>
                  );
                })}
              </View>
            </ScrollView>

            {/* Duration */}
            <Text style={{ fontSize: 8, fontWeight: '800', color: C.muted, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>DURATION</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {DURATIONS.map(d => {
                const on = duration === d;
                return (
                  <Tap key={d} onPress={() => setDuration(d)}>
                    <View style={{ paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: on ? C.blueSoft : C.bgRaised, borderWidth: 1.5, borderColor: on ? C.blueDark : C.border }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: on ? C.blueDark : C.muted }}>{d} min</Text>
                    </View>
                  </Tap>
                );
              })}
            </View>

            {/* Time */}
            <Text style={{ fontSize: 8, fontWeight: '800', color: C.muted, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>TIME</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }} keyboardShouldPersistTaps="handled">
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {HOUR_OPTS.map(h => {
                  const on  = hour === h;
                  const lbl = h < 12 ? `${h}AM` : h === 12 ? '12PM' : `${h - 12}PM`;
                  return (
                    <Tap key={h} onPress={() => setHour(h)}>
                      <View style={{ paddingVertical: 8, paddingHorizontal: 13, borderRadius: 20, backgroundColor: on ? C.blueSoft : C.bgRaised, borderWidth: 1.5, borderColor: on ? C.blueDark : C.border }}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: on ? C.blueDark : C.muted }}>{lbl}</Text>
                      </View>
                    </Tap>
                  );
                })}
              </View>
            </ScrollView>

            {/* Label — the field that was being hidden */}
            <Text style={{ fontSize: 8, fontWeight: '800', color: C.muted, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>LABEL (optional)</Text>
            <View style={{ backgroundColor: C.bgRaised, borderRadius: 12, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, height: 46, justifyContent: 'center', marginBottom: 20 }}>
              <TextInput
                style={{ fontSize: 14, color: C.text }}
                value={label}
                onChangeText={setLabel}
                placeholder={`e.g. "Chapter 4 review"`}
                placeholderTextColor={C.subtext}
                maxLength={40}
                returnKeyType="done"
                onSubmitEditing={save}
              />
            </View>

            {/* Save button */}
            <Tap onPress={save} disabled={saving}>
              <LinearGradient
                colors={saving ? [C.muted, C.subtext] : ['#f5c842', '#e8b020']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{ height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}
              >
                {saving
                  ? <ActivityIndicator color="#2a2000" size="small" />
                  : <Text style={{ fontSize: 15, fontWeight: '800', color: '#2a2000' }}>Add to Schedule</Text>
                }
              </LinearGradient>
            </Tap>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ══════════════════════════════════════════════════════════════════
//  MAIN SCREEN
// ══════════════════════════════════════════════════════════════════
export default function ScheduleScreen({ navigation }) {
  const { C }  = useTheme();
  const auth   = useAuth?.() || {};
  const uid    = auth.user?.uid;

  const todayIdx     = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
  const [selDay,     setSelDay]     = useState(DAYS_SHORT[todayIdx]);
  const [slots,      setSlots]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [sheetOpen,  setSheetOpen]  = useState(false);

  const loadSlots = useCallback(async () => {
    if (!uid) { setLoading(false); return; }
    setLoading(true);
    try {
      const q    = query(collection(db, 'users', uid, 'schedule'), orderBy('createdAt', 'asc'));
      const snap = await getDocs(q);
      setSlots(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch { /* fail silently */ }
    finally { setLoading(false); }
  }, [uid]);

  useEffect(() => { loadSlots(); }, [loadSlots]);

  const handleAdd = async ({ subject, duration, hour, label }) => {
    if (!uid) return;
    const doc_ = { subject, duration, hour, label, day: selDay, createdAt: serverTimestamp() };
    const ref  = await addDoc(collection(db, 'users', uid, 'schedule'), doc_);
    setSlots(prev => [...prev, { id: ref.id, ...doc_, createdAt: new Date() }]);
  };

  const handleDelete = (slotId) => {
    Alert.alert('Remove', 'Delete this slot?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await deleteDoc(doc(db, 'users', uid, 'schedule', slotId));
        setSlots(prev => prev.filter(s => s.id !== slotId));
      }},
    ]);
  };

  const slotsForDay = (day) => slots.filter(s => s.day === day).sort((a, b) => a.hour - b.hour);
  const todaySlots  = slotsForDay(selDay);
  const totalMins   = slots.reduce((a, s) => a + (s.duration || 0), 0);
  const activeDays  = DAYS_SHORT.filter(d => slotsForDay(d).length > 0).length;

  const card = {
    backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.border,
    shadowColor: C.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 10, elevation: 2,
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12 }}>
          <Text style={{ fontSize: 9, fontWeight: '800', color: C.blue, letterSpacing: 3, textTransform: 'uppercase' }}>Study Planner</Text>
          <Text style={{ fontSize: 24, fontWeight: '800', color: C.text, letterSpacing: -0.5 }}>Schedule</Text>
        </View>

        {/* Stats strip */}
        <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginBottom: 16 }}>
          {[
            { val: slots.length,   lbl: 'Scheduled'   },
            { val: `${totalMins}m`, lbl: 'Total Time'  },
            { val: activeDays,     lbl: 'Active Days' },
          ].map((s, i) => (
            <View key={i} style={[card, { flex: 1, alignItems: 'center', paddingVertical: 12, paddingHorizontal: 8 }]}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: C.text, letterSpacing: -0.3 }}>{s.val}</Text>
              <Text style={{ fontSize: 9, fontWeight: '700', color: C.muted, letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 2 }}>{s.lbl}</Text>
            </View>
          ))}
        </View>

        {/* Day picker */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 10, paddingBottom: 4 }}
          style={{ marginBottom: 16 }}>
          {DAYS_SHORT.map((day, i) => {
            const isSelected = day === selDay;
            const isToday    = i === todayIdx;
            const count      = slotsForDay(day).length;
            return (
              <Tap key={day} onPress={() => setSelDay(day)}>
                <View style={{
                  width: 62, alignItems: 'center', paddingVertical: 12, borderRadius: 18,
                  backgroundColor: isSelected ? C.blue : C.card,
                  borderWidth: isSelected ? 0 : 1.5,
                  borderColor: isToday && !isSelected ? C.blueDark + '80' : C.border,
                  shadowColor: isSelected ? C.blue : 'transparent',
                  shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: isSelected ? 6 : 0,
                }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: isSelected ? '#fff' : isToday ? C.blueDark : C.muted, marginBottom: 2 }}>
                    {day}
                  </Text>
                  {isToday && (
                    <Text style={{ fontSize: 8, fontWeight: '800', color: isSelected ? 'rgba(255,255,255,0.7)' : C.blue, letterSpacing: 0.5 }}>
                      TODAY
                    </Text>
                  )}
                  {count > 0 && (
                    <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: isSelected ? 'rgba(255,255,255,0.3)' : C.blue, alignItems: 'center', justifyContent: 'center', marginTop: 4 }}>
                      <Text style={{ fontSize: 9, fontWeight: '900', color: isSelected ? '#fff' : '#2a2000' }}>{count}</Text>
                    </View>
                  )}
                </View>
              </Tap>
            );
          })}
        </ScrollView>

        {/* Slots for selected day */}
        <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ width: 3, height: 16, borderRadius: 2, backgroundColor: C.blue }} />
              <Text style={{ fontSize: 16, fontWeight: '700', color: C.text }}>
                {DAYS_FULL[DAYS_SHORT.indexOf(selDay)] || selDay}
              </Text>
              {DAYS_SHORT.indexOf(selDay) === todayIdx && (
                <View style={{ backgroundColor: C.blueSoft, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 }}>
                  <Text style={{ fontSize: 9, fontWeight: '800', color: C.blueDark, letterSpacing: 1 }}>TODAY</Text>
                </View>
              )}
            </View>
            {todaySlots.length > 0 && (
              <Text style={{ fontSize: 11, color: C.muted, fontWeight: '600' }}>
                {todaySlots.reduce((a, s) => a + (s.duration || 0), 0)}m planned
              </Text>
            )}
          </View>

          {loading ? (
            <ActivityIndicator color={C.blue} style={{ paddingVertical: 30 }} />
          ) : todaySlots.length === 0 ? (
            <Tap onPress={() => setSheetOpen(true)}>
              <View style={[card, { paddingVertical: 32, alignItems: 'center', gap: 8, borderStyle: 'dashed', borderColor: C.borderBright }]}>
                <Text style={{ fontSize: 28 }}>📅</Text>
                <Text style={{ fontSize: 14, fontWeight: '700', color: C.text }}>No sessions planned</Text>
                <Text style={{ fontSize: 12, color: C.muted, textAlign: 'center', lineHeight: 18 }}>
                  Tap to add your study plan{'\n'}for {DAYS_FULL[DAYS_SHORT.indexOf(selDay)] || selDay}
                </Text>
                <View style={{ backgroundColor: C.blueSoft, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 18, marginTop: 4 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: C.blueDark }}>+ Plan {selDay}</Text>
                </View>
              </View>
            </Tap>
          ) : (
            <View style={{ gap: 10 }}>
              {todaySlots.map(slot => {
                const hourLabel = slot.hour < 12 ? `${slot.hour}:00 AM` : slot.hour === 12 ? '12:00 PM' : `${slot.hour - 12}:00 PM`;
                return (
                  <Tap key={slot.id}
                    onPress={() => navigation?.navigate?.('Focus', { subject: slot.subject, duration: slot.duration })}>
                    <View style={[card, { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderLeftWidth: 4, borderLeftColor: sColor(slot.subject) }]}>
                      <View style={{ width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: sBg(slot.subject) }}>
                        <Text style={{ fontSize: 20 }}>{SUBJECT_ICONS[slot.subject] || '📌'}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: sColor(slot.subject) }}>{slot.label || slot.subject}</Text>
                        <Text style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{hourLabel} · {slot.duration} min</Text>
                      </View>
                      <View style={{ backgroundColor: sColor(slot.subject) + '20', width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 14, color: sColor(slot.subject) }}>▶</Text>
                      </View>
                      <TouchableOpacity onPress={() => handleDelete(slot.id)} style={{ padding: 4 }} hitSlop={8}>
                        <Text style={{ fontSize: 13, color: C.muted }}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  </Tap>
                );
              })}
              <TouchableOpacity onPress={() => setSheetOpen(true)} style={{ paddingVertical: 12, alignItems: 'center', borderWidth: 1.5, borderColor: C.border, borderStyle: 'dashed', borderRadius: 16 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: C.muted }}>+ Add another slot</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Daily quote */}
        <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
          <DailyQuote C={C} />
        </View>

      </ScrollView>

      <AddSlotSheet visible={sheetOpen} day={selDay} onSave={handleAdd} onClose={() => setSheetOpen(false)} C={C} />
    </View>
  );
}