
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Modal, Pressable,
  ActivityIndicator, Alert, Animated,
  Platform, TextInput, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  collection, doc, getDocs, addDoc, deleteDoc,
  query, where, orderBy, serverTimestamp,
} from 'firebase/firestore';
import { db }             from '../../config/firebase';
import { useAuth }        from '../../hooks/useAuth';
import { C }              from '../../themes/colors';
import {
  SUBJECTS, SUBJECT_ICONS, sColor, sBg, STUDY_TIMES,
} from '../../themes/constants';

const { width } = Dimensions.get('window');

// ── Constants ─────────────────────────────
const DAYS      = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const FULL_DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const DURATIONS = [15, 25, 30, 45, 60, 90];

// Time slots shown in the planner (6AM to 11PM)
const TIME_SLOTS = Array.from({ length: 18 }, (_, i) => {
  const hour = i + 6;
  const label = hour < 12 ? `${hour}AM` : hour === 12 ? '12PM' : `${hour - 12}PM`;
  return { hour, label };
});

// ── Spring press ──────────────────────────
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

// ── Add-slot bottom sheet ─────────────────
function AddSlotSheet({ visible, day, hour, onSave, onClose }) {
  const [subject, setSubject] = useState('Math');
  const [duration, setDuration] = useState(25);
  const [label, setLabel] = useState('');
  const [saving, setSaving] = useState(false);

  const slideY = useRef(new Animated.Value(500)).current;
  const fadeB = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setSubject('Math'); 
      setDuration(25); 
      setLabel('');
      
      Animated.parallel([
        Animated.timing(slideY, { 
          toValue: 0, 
          duration: 250, 
          useNativeDriver: true 
        }),
        Animated.timing(fadeB, { 
          toValue: 1, 
          duration: 200, 
          useNativeDriver: true 
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideY, { 
          toValue: 500, 
          duration: 200, 
          useNativeDriver: true 
        }),
        Animated.timing(fadeB, { 
          toValue: 0, 
          duration: 150, 
          useNativeDriver: true 
        }),
      ]).start();
    }
  }, [visible]);

  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await onSave({ subject, duration, label: label.trim() || subject, day, hour });
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const hourStr = hour != null 
    ? (hour < 12 ? `${hour}:00 AM `: hour === 12 ? `12:00 PM` : `${hour - 12}:00 PM`) 
    : "";

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[s.backdrop, { opacity: fadeB }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <Animated.View style={[s.sheet, { transform: [{ translateY: slideY }] }]}>
        <View style={s.sheetHandle} />
        <Text style={s.sheetTitle}>Add Study Slot</Text>
        <Text style={s.sheetSub}>{day} {hourStr}</Text>

        <Text style={s.sheetLabel}>SUBJECT</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {SUBJECTS.map(subj => {
              const on = subject === subj;
              return (
                <TouchableOpacity key={subj} onPress={() => setSubject(subj)} activeOpacity={0.8}>
                  <View style={[s.subjChip, on && { backgroundColor: sBg(subj), borderColor: sColor(subj) }]}>
                    <Text style={{ fontSize: 14 }}>{SUBJECT_ICONS[subj] || ''}</Text>
                    <Text style={[s.subjChipText, on && { color: sColor(subj) }]}>{subj}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        <Text style={s.sheetLabel}>DURATION</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {DURATIONS.map(d => {
            const on = duration === d;
            return (
              <TouchableOpacity key={d} onPress={() => setDuration(d)} activeOpacity={0.8}>
                <View style={[s.durChip, on && { backgroundColor: C.blueSoft, borderColor: C.blueDark }]}>
                  <Text style={[s.durChipText, on && { color: C.blueDark }]}>{d} min</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={s.sheetLabel}>LABEL</Text>
        <View style={s.inputWrap}>
          <TextInput
            style={s.input}
            value={label}
            onChangeText={setLabel}
            placeholder='e.g. "Review lesson"'
            placeholderTextColor={C.subtext}
            maxLength={40}
          />
        </View>
          <TouchableOpacity onPress={save} disabled={saving} activeOpacity={0.8}>
          <LinearGradient
            colors={saving ? [C.subtext, C.muted] : ['#f5c842', '#e8b020']}
            style={s.saveBtn}
          >
            {saving ? <ActivityIndicator color="#2a2000" /> : <Text style={s.saveBtnText}>Add to Schedule</Text>}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

// ── MAIN SCREEN ───────────────────────────
export default function ScheduleScreen({ navigation }) {
  const auth   = useAuth?.() || {};
  const user   = auth.user   || null;
  const uid    = user?.uid;

  // ── State ────────────────────────────
  const [slots,        setSlots]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [selectedDay,  setSelectedDay]  = useState(DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [sheetDay,     setSheetDay]     = useState(null);
  const [sheetHour,    setSheetHour]    = useState(null);
  const [viewMode,     setViewMode]     = useState('week'); // 'week' | 'day'

  // ── Load slots from Firestore ─────────
  const loadSlots = useCallback(async () => {
    if (!uid) { setLoading(false); return; }
    setLoading(true);
    try {
      const q    = query(collection(db, 'users', uid, 'schedule'), orderBy('createdAt', 'asc'));
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setSlots(data);
    } catch (e) {
      Alert.alert('Error', 'Could not load schedule.');
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => { loadSlots(); }, [loadSlots]);

  // ── Add slot ──────────────────────────
  const handleAddSlot = useCallback(async ({ subject, duration, label, day, hour }) => {
    if (!uid) return;
    try {
      const newSlot = { subject, duration, label, day, hour, createdAt: serverTimestamp() };
      const ref     = await addDoc(collection(db, 'users', uid, 'schedule'), newSlot);
      setSlots(prev => [...prev, { id: ref.id, ...newSlot, createdAt: new Date() }]);
    } catch {
      Alert.alert('Error', 'Could not save slot. Try again.');
      throw new Error('save failed');
    }
  }, [uid]);

  // ── Delete slot ───────────────────────
  const handleDeleteSlot = useCallback((slotId) => {
    Alert.alert(
      'Remove Slot',
      'Delete this study slot?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await deleteDoc(doc(db, 'users', uid, 'schedule', slotId));
            setSlots(prev => prev.filter(s => s.id !== slotId));
          } catch {
            Alert.alert('Error', 'Could not delete.');
          }
        }},
      ]
    );
  }, [uid]);

  // ── Open add sheet ────────────────────
  const openSheet = (day, hour) => {
    setSheetDay(day);
    setSheetHour(hour);
    setSheetVisible(true);
  };

  // ── Helpers ───────────────────────────
  const slotsForDay  = (day)        => slots.filter(s => s.day === day).sort((a, b) => a.hour - b.hour);
  const slotsForCell = (day, hour)  => slots.filter(s => s.day === day && s.hour === hour);
  const todayIdx     = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
  const totalSlots   = slots.length;
  const thisWeekDone = 0; // would be cross-referenced with completed sessions

  // ─────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────
  return (
    <View style={s.screen}>

      {/* ── Header ────────────────────── */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation?.goBack?.()} style={s.backBtn} activeOpacity={0.75}>
          <Text style={s.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerEyebrow}>STUDY PLANNER</Text>
          <Text style={s.headerTitle}>Schedule</Text>
        </View>
        <TouchableOpacity onPress={loadSlots} activeOpacity={0.7} style={s.refreshBtn}>
          <Text style={{ fontSize: 18 }}>↻</Text>
        </TouchableOpacity>
      </View>

      {/* ── View mode toggle ──────────── */}
      <View style={s.viewToggleRow}>
        {['week', 'day'].map(mode => (
          <TouchableOpacity
            key={mode}
            onPress={() => setViewMode(mode)}
            style={[s.viewToggleBtn, viewMode === mode && s.viewToggleBtnOn]}
            activeOpacity={0.75}
          >
            <Text style={[s.viewToggleText, viewMode === mode && s.viewToggleTextOn]}>
              {mode === 'week' ? 'Week View' : 'Day View'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Day selector ──────────────── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.dayScroll} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        {DAYS.map((day, i) => {
          const isToday    = i === todayIdx;
          const isSelected = day === selectedDay;
          const count      = slotsForDay(day).length;
          return (
            <TouchableOpacity
              key={day}
              onPress={() => setSelectedDay(day)}
              activeOpacity={0.8}
              style={[
                s.dayBtn,
                isSelected && { backgroundColor: C.blue, borderColor: C.blueDark },
                isToday && !isSelected && { borderColor: C.blueDark + '80' },
              ]}
            >
              <Text style={[s.dayBtnLabel, isSelected && { color: '#2a2000' }]}>{day}</Text>
              {count > 0 && (
                <View style={[s.dayDot, isSelected && { backgroundColor: '#2a200066' }]}>
                  <Text style={[s.dayDotText, isSelected && { color: '#2a2000' }]}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={C.blue} size="large" />
        </View>
      ) : viewMode === 'day' ? (
        /* ── DAY VIEW ─────────────────── */
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.dayViewContent}>

          {/* Stats bar */}
          <View style={s.statsBar}>
            <View style={s.statBubble}>
              <Text style={s.statBubbleVal}>{totalSlots}</Text>
              <Text style={s.statBubbleLbl}>Total Slots</Text>
            </View>
            <View style={s.statBubble}>
              <Text style={s.statBubbleVal}>{slotsForDay(selectedDay).length}</Text>
              <Text style={s.statBubbleLbl}>{selectedDay}</Text>
            </View>
            <View style={s.statBubble}>
              <Text style={s.statBubbleVal}>
                {slotsForDay(selectedDay).reduce((a, s) => a + (s.duration || 0), 0)}m
              </Text>
              <Text style={s.statBubbleLbl}>Planned</Text>
            </View>
          </View>

          {/* Time slot list for selected day */}
          {TIME_SLOTS.map(({ hour, label }) => {
            const cell = slotsForCell(selectedDay, hour);
            return (
              <View key={hour} style={s.timeRow}>
                <Text style={s.timeLabel}>{label}</Text>
                <View style={s.timeContent}>
                  {cell.length > 0 ? (
                    cell.map(slot => (
                      <TouchableOpacity
                        key={slot.id}
                        onLongPress={() => handleDeleteSlot(slot.id)}
                        activeOpacity={0.8}
                        style={[s.slotCard, { backgroundColor: sBg(slot.subject), borderColor: sColor(slot.subject) + '60' }]}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                          <Text style={{ fontSize: 14 }}>{SUBJECT_ICONS[slot.subject] || '📌'}</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={[s.slotLabel, { color: sColor(slot.subject) }]} numberOfLines={1}>{slot.label}</Text>
                            <Text style={s.slotMeta}>{slot.duration} min</Text>
                          </View>
                        </View>
                        <Text style={{ fontSize: 10, color: sColor(slot.subject), opacity: 0.6 }}>Hold to delete</Text>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <TouchableOpacity
                      onPress={() => openSheet(selectedDay, hour)}
                      style={s.emptyCell}
                      activeOpacity={0.6}
                    >
                      <Text style={s.emptyCellText}>+ Add</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}

          <View style={{ height: 40 }} />
        </ScrollView>

      ) : (
        /* ── WEEK VIEW ─────────────────── */
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.weekViewContent}>

          {/* Stats bar */}
          <View style={s.statsBar}>
            <View style={s.statBubble}>
              <Text style={s.statBubbleVal}>{totalSlots}</Text>
              <Text style={s.statBubbleLbl}>Scheduled</Text>
            </View>
            <View style={s.statBubble}>
              <Text style={s.statBubbleVal}>
                {slots.reduce((a, s) => a + (s.duration || 0), 0)}m
              </Text>
              <Text style={s.statBubbleLbl}>Total Time</Text>
            </View>
            <View style={s.statBubble}>
              <Text style={s.statBubbleVal}>
                {DAYS.filter(d => slotsForDay(d).length > 0).length}
              </Text>
              <Text style={s.statBubbleLbl}>Active Days</Text>
            </View>
          </View>

          {/* Week grid */}
          {DAYS.map((day, dayIdx) => {
            const daySlots  = slotsForDay(day);
            const isToday   = dayIdx === todayIdx;
            const totalMins = daySlots.reduce((a, s) => a + (s.duration || 0), 0);

            return (
              <View key={day} style={[s.weekDayRow, isToday && s.weekDayRowToday]}>

                {/* Day header */}
                <View style={s.weekDayHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={[s.weekDayName, isToday && { color: C.blueDark }]}>
                      {FULL_DAYS[dayIdx]}
                    </Text>
                    {isToday && (
                      <View style={s.todayBadge}><Text style={s.todayBadgeText}>TODAY</Text></View>
                    )}
                  </View>
                  {totalMins > 0 && (
                    <Text style={s.weekDayTotal}>{totalMins}m planned</Text>
                  )}
                </View>

                {/* Slots */}
                {daySlots.length > 0 ? (
                  <View style={s.weekSlotRow}>
                    {daySlots.map(slot => (
                      <TouchableOpacity
                        key={slot.id}
                        onLongPress={() => handleDeleteSlot(slot.id)}
                        activeOpacity={0.8}
                        style={[s.weekSlotChip, { backgroundColor: sBg(slot.subject), borderColor: sColor(slot.subject) + '60' }]}
                      >
                        <Text style={{ fontSize: 13 }}>{SUBJECT_ICONS[slot.subject] || '📌'}</Text>
                        <View>
                          <Text style={[s.weekSlotLabel, { color: sColor(slot.subject) }]} numberOfLines={1}>{slot.label}</Text>
                          <Text style={[s.weekSlotMeta, { color: sColor(slot.subject) + 'aa' }]}>
                            {slot.hour < 12 ? `${slot.hour}AM` : slot.hour === 12 ? '12PM' : `${slot.hour-12}PM`} · {slot.duration}m
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                    {/* Add more */}
                    <TouchableOpacity
                      onPress={() => { setSelectedDay(day); setViewMode('day'); }}
                      style={s.weekAddMore}
                      activeOpacity={0.7}
                    >
                      <Text style={s.weekAddMoreText}>+ Add</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => openSheet(day, 8)}
                    style={s.weekEmptyRow}
                    activeOpacity={0.6}
                  >
                    <Text style={s.weekEmptyText}>Tap to plan {day}</Text>
                  </TouchableOpacity>
                )}

              </View>
            );
          })}

          {/* Tip card */}
          <View style={s.tipCard}>
            <Text style={s.tipIcon}>💡</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.tipTitle}>Score Boost Tip</Text>
              <Text style={s.tipText}>
                Starting a session during your planned time window earns +3 Discipline Score. Plan, then execute.
              </Text>
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* ── FAB — add slot for selected day ── */}
      <TouchableOpacity 
        onPress={() => openSheet(selectedDay, 8)} 
        style={s.fab}
        activeOpacity={0.7}
      >
        <LinearGradient 
          colors={['#f5c842', '#e8b020']} 
          style={s.fabInner}
        >
          <Text style={s.fabIcon}>+</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* ── Bottom sheet ─────────────────── */}
      <AddSlotSheet
        visible={sheetVisible}
        day={sheetDay}
        hour={sheetHour}
        onSave={handleAddSlot}
        onClose={() => setSheetVisible(false)}
      />

    </View>
  );
}

// ── STYLES ────────────────────────────────
const s = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: C.bg },

  // Header
  header:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, gap: 12 },
  backBtn:      { width: 38, height: 38, borderRadius: 19, backgroundColor: C.bgRaised, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  backArrow:    { fontSize: 18, color: C.text, fontWeight: '600' },
  refreshBtn:   { width: 38, height: 38, borderRadius: 19, backgroundColor: C.bgRaised, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  headerEyebrow:{ fontSize: 8, color: C.muted, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' },
  headerTitle:  { fontSize: 22, fontWeight: '800', color: C.text, letterSpacing: -0.5 },

  // View toggle
  viewToggleRow: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 10, backgroundColor: C.bgRaised, borderRadius: 12, padding: 3, borderWidth: 1, borderColor: C.border },
  viewToggleBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  viewToggleBtnOn: { backgroundColor: C.card, shadowColor: C.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 4, elevation: 2 },
  viewToggleText: { fontSize: 12, fontWeight: '600', color: C.muted },
  viewToggleTextOn: { color: C.text, fontWeight: '700' },

  // Day selector
  dayScroll: { flexShrink: 0, marginBottom: 12 },
  dayBtn:    { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 12, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: 'center', minWidth: 52 },
  dayBtnLabel: { fontSize: 12, fontWeight: '700', color: C.text },
  dayDot:    { backgroundColor: C.blue, borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1, marginTop: 3 },
  dayDotText:{ fontSize: 8, fontWeight: '800', color: '#2a2000' },

  // Stats bar
  statsBar:       { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statBubble:     { flex: 1, backgroundColor: C.card, borderRadius: 14, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  statBubbleVal:  { fontSize: 18, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
  statBubbleLbl:  { fontSize: 9, color: C.muted, fontWeight: '600', letterSpacing: 0.5, marginTop: 2, textTransform: 'uppercase' },

  // Day view
  dayViewContent: { paddingHorizontal: 16, paddingTop: 4 },
  timeRow:        { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8, gap: 12 },
  timeLabel:      { width: 44, fontSize: 10, color: C.subtext, fontWeight: '600', paddingTop: 10, textAlign: 'right' },
  timeContent:    { flex: 1, minHeight: 40 },
  slotCard:       { borderRadius: 12, padding: 10, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  slotLabel:      { fontSize: 12, fontWeight: '700' },
  slotMeta:       { fontSize: 10, color: C.muted, marginTop: 1 },
  emptyCell:      { height: 36, borderRadius: 8, borderWidth: 1, borderColor: C.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: C.bgRaised },
  emptyCellText:  { fontSize: 11, color: C.muted, fontWeight: '600' },

  // Week view
  weekViewContent: { paddingHorizontal: 16, paddingTop: 4 },
  weekDayRow:      { backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 13, marginBottom: 10 },
  weekDayRowToday: { borderColor: C.blue + '60', backgroundColor: C.blueSoft },
  weekDayHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  weekDayName:     { fontSize: 13, fontWeight: '700', color: C.text },
  weekDayTotal:    { fontSize: 10, color: C.muted, fontWeight: '600' },
  todayBadge:      { backgroundColor: C.blue, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 },
  todayBadgeText:  { fontSize: 7, fontWeight: '900', color: '#2a2000', letterSpacing: 1 },
  weekSlotRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  weekSlotChip:    { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 10, paddingVertical: 7, paddingHorizontal: 10, borderWidth: 1 },
  weekSlotLabel:   { fontSize: 11, fontWeight: '700' },
  weekSlotMeta:    { fontSize: 9, fontWeight: '500' },
  weekAddMore:     { paddingVertical: 7, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: C.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  weekAddMoreText: { fontSize: 11, color: C.muted, fontWeight: '600' },
  weekEmptyRow:    { paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: C.border, borderStyle: 'dashed', borderRadius: 10 },
  weekEmptyText:   { fontSize: 11, color: C.subtext, fontWeight: '500' },

  // Tip card
  tipCard:  { flexDirection: 'row', gap: 12, backgroundColor: C.blueSoft, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.blue + '50', marginTop: 4 },
  tipIcon:  { fontSize: 20 },
  tipTitle: { fontSize: 12, fontWeight: '700', color: C.blueDark, marginBottom: 3 },
  tipText:  { fontSize: 11, color: C.muted, lineHeight: 16 },

  // FAB
  fab:      { position: 'absolute', bottom: 24, right: 20, borderRadius: 28, shadowColor: 'rgba(245,200,66,0.5)', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 1, shadowRadius: 14, elevation: 8 },
  fabInner: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  fabIcon:  { fontSize: 28, color: '#2a2000', fontWeight: '300', marginTop: -2 },

  // Sheet
  backdrop:     { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet:        { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: C.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 1, borderTopColor: C.border, padding: 20, paddingBottom: Platform.OS === 'ios' ? 44 : 32 },
  sheetHandle:  { width: 36, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginBottom: 18 },
  sheetTitle:   { fontSize: 20, fontWeight: '800', color: C.text, letterSpacing: -0.4, marginBottom: 3 },
  sheetSub:     { fontSize: 12, color: C.muted, fontWeight: '500', marginBottom: 18 },
  sheetLabel:   { fontSize: 8, fontWeight: '800', color: C.muted, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 },
  subjChip:     { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 9, paddingHorizontal: 13, borderRadius: 12, backgroundColor: C.bgRaised, borderWidth: 1, borderColor: C.border },
  subjChipText: { fontSize: 12, fontWeight: '700', color: C.muted },
  durChip:      { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: C.bgRaised, borderWidth: 1, borderColor: C.border },
  durChipText:  { fontSize: 12, fontWeight: '700', color: C.muted },
  inputWrap:    { backgroundColor: C.bgRaised, borderRadius: 12, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, height: 46, justifyContent: 'center', marginBottom: 18 },
  input:        { fontSize: 14, color: C.text, fontWeight: '500' },
  saveBtn:      { height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  saveBtnText:  { fontSize: 15, fontWeight: '800', color: '#2a2000', letterSpacing: 0.3 },
});