import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  Animated, Image, ActivityIndicator,
  Alert, TextInput, Modal, Pressable, Platform,
} from 'react-native';
import { LinearGradient }     from 'expo-linear-gradient';
import { useAuth }            from '../../hooks/useAuth';
import { useTheme }           from '../../context/ThemeContext';
import { useSession }         from '../../context/sessionContext';
import { GOALS, STUDY_TIMES } from '../../themes';


// ── Spring press ──────────────────────────
function Tap({ onPress, children, style, disabled }) {
  const scale   = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const down = () => Animated.parallel([
    Animated.spring(scale,   { toValue: 0.965, useNativeDriver: true, tension: 400, friction: 20 }),
    Animated.timing(opacity, { toValue: 0.72,  duration: 60, useNativeDriver: true }),
  ]).start();
  const up = () => Animated.parallel([
    Animated.spring(scale,   { toValue: 1, useNativeDriver: true, tension: 300, friction: 15 }),
    Animated.timing(opacity, { toValue: 1, duration: 100, useNativeDriver: true }),
  ]).start();
  if (disabled) return <View style={style}>{children}</View>;
  return (
    <Pressable onPressIn={down} onPressOut={up} onPress={onPress}>
      <Animated.View style={[style, { transform: [{ scale }], opacity }]}>{children}</Animated.View>
    </Pressable>
  );
}

// ── Toggle switch ─────────────────────────
function Toggle({ value, onChange, C }) {
  const anim   = useRef(new Animated.Value(value ? 1 : 0)).current;
  const thumbX = anim.interpolate({ inputRange: [0, 1], outputRange: [2, 20] });
  const trackC = anim.interpolate({ inputRange: [0, 1], outputRange: [C.border, C.blue] });

  useEffect(() => {
    Animated.spring(anim, {
      toValue: value ? 1 : 0,
      useNativeDriver: false, tension: 280, friction: 22,
    }).start();
  }, [value]);

  return (
    <Pressable onPress={() => onChange(!value)} hitSlop={10}>
      <Animated.View style={{ width: 44, height: 24, borderRadius: 12, backgroundColor: trackC, justifyContent: 'center', borderWidth: 1, borderColor: C.borderBright, overflow: 'hidden' }}>
        <Animated.View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: '#fff', transform: [{ translateX: thumbX }], shadowColor: C.blue, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 4, elevation: 2 }} />
      </Animated.View>
    </Pressable>
  );
}

// ── Chips ─────────────────────────────────
function Chips({ options = [], value, onChange, C }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {options.map(opt => {
        const on = value === opt;
        return (
          <Tap key={opt} onPress={() => onChange(opt)}>
            <View style={{ paddingVertical: 7, paddingHorizontal: 14, borderRadius: 20, backgroundColor: on ? C.blueSoft : C.bgRaised, borderWidth: 1.5, borderColor: on ? C.blueDark : C.border }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: on ? C.blueDark : C.muted }}>{opt}</Text>
            </View>
          </Tap>
        );
      })}
    </View>
  );
}

// ── Section label ─────────────────────────
function SLabel({ children, danger, C }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10, marginTop: 4 }}>
      <View style={{ width: 3, height: 12, borderRadius: 2, backgroundColor: danger ? C.red : C.blue }} />
      <Text style={{ fontSize: 9, fontWeight: '800', color: C.muted, letterSpacing: 2.5, textTransform: 'uppercase' }}>{children}</Text>
    </View>
  );
}

// ── Row ───────────────────────────────────
function Row({ icon, iconBg, label, sub, right, onPress, last, danger, loading, C }) {
  const body = (
    <View style={[{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14, gap: 12 },
      !last && { borderBottomWidth: 1, borderBottomColor: C.border }]}>
      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: danger ? C.redSoft : (iconBg || C.bgRaised), alignItems: 'center', justifyContent: 'center', flexShrink: 0, borderWidth: 1, borderColor: C.border }}>
        <Text style={{ fontSize: 15 }}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: danger ? C.red : C.text }}>{label}</Text>
        {sub ? <Text style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>{sub}</Text> : null}
      </View>
      <View style={{ flexShrink: 0, marginLeft: 4 }}>
        {loading
          ? <ActivityIndicator size="small" color={C.blue} />
          : right ?? <Text style={{ fontSize: 18, color: danger ? C.red : C.borderBright, fontWeight: '300' }}>›</Text>}
      </View>
    </View>
  );
  return onPress ? <Tap onPress={onPress}>{body}</Tap> : body;
}

// ── Edit name sheet ───────────────────────
function EditSheet({ visible, currentName, onSave, onClose, C }) {
  const [val,    setVal]    = useState('');
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');
  const slideY = useRef(new Animated.Value(400)).current;
  const fadeB  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setVal(currentName || ''); setError('');
      Animated.parallel([
        Animated.spring(slideY, { toValue: 0,   useNativeDriver: true, tension: 78, friction: 14 }),
        Animated.timing(fadeB,  { toValue: 1,   duration: 220, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideY, { toValue: 400, duration: 220, useNativeDriver: true }),
        Animated.timing(fadeB,  { toValue: 0,   duration: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const submit = async () => {
    const t = val.trim();
    if (!t)           { setError('Name cannot be empty.');   return; }
    if (t.length < 2) { setError('At least 2 characters.'); return; }
    setSaving(true); setError('');
    try { await onSave(t); onClose(); }
    catch { setError('Failed to update. Try again.'); }
    finally { setSaving(false); }
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)', opacity: fadeB }}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <Animated.View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: C.card, borderTopLeftRadius: 26, borderTopRightRadius: 26, borderTopWidth: 1, borderTopColor: C.border, padding: 22, paddingBottom: Platform.OS === 'ios' ? 44 : 32, transform: [{ translateY: slideY }] }}>
        <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginBottom: 20 }} />
        <Text style={{ fontSize: 20, fontWeight: '800', color: C.text, marginBottom: 5 }}>Display Name</Text>
        <Text style={{ fontSize: 12, color: C.muted, marginBottom: 18 }}>Appears on your profile and sessions.</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.bgRaised, borderRadius: 12, borderWidth: 1.5, borderColor: error ? C.red : C.border, paddingHorizontal: 14, height: 52, marginBottom: 6 }}>
          <TextInput
            style={{ flex: 1, fontSize: 15, color: C.text, fontWeight: '500' }}
            value={val}
            onChangeText={v => { setVal(v); setError(''); }}
            placeholder="Enter your name"
            placeholderTextColor={C.subtext}
            autoFocus
            maxLength={32}
            selectionColor={C.blue}
            returnKeyType="done"
            onSubmitEditing={submit}
          />
          <Text style={{ fontSize: 11, color: C.subtext }}>{val.length}/32</Text>
        </View>
        {error
          ? <Text style={{ fontSize: 11, color: C.red, marginBottom: 10 }}>{error}</Text>
          : <View style={{ height: 16 }} />
        }
        <Tap onPress={submit} disabled={saving}>
          <LinearGradient
            colors={saving ? [C.muted, C.subtext] : ['#f5c842', '#e8b020']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={{ height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 4 }}
          >
            {saving
              ? <ActivityIndicator color="#2a2000" size="small" />
              : <Text style={{ fontSize: 15, fontWeight: '800', color: '#2a2000' }}>Save Changes</Text>
            }
          </LinearGradient>
        </Tap>
      </Animated.View>
    </Modal>
  );
}

// ══════════════════════════════════════════
//  MAIN SCREEN
// ══════════════════════════════════════════
export default function SettingsScreen({ navigation }) { 

  const { C, dark, toggleDark } = useTheme();

  const { user, userData, logout, updateUserData } = useAuth();
  const updateUser = updateUserData;
  
   const { sessions: sessionList, deleteSession } = useSession();

  const name     = userData?.name     || user?.displayName || '';
  const email    = userData?.email    || user?.email       || '';
  const customAvatar = userData?.customAvatar || null;
  const avatarId = userData?.avatarId || null;
  const score    = userData?.score    ?? userData?.disciplineScore ?? 0;
  const streak   = userData?.streak   ?? 0;


  const [notifs,     setNotifs]     = useState(userData?.notifs     ?? true);
  const [sound,      setSound]      = useState(userData?.sound      ?? true);
  const [haptics,    setHaptics]    = useState(userData?.haptics    ?? true);
  const [goal,       setGoal]       = useState(userData?.goal       || GOALS?.[0]       || 'Exam Prep');
  const [studyTime,  setStudyTime]  = useState(userData?.studyTime  || STUDY_TIMES?.[2] || 'Night');
  const [dailyHours, setDailyHours] = useState(userData?.dailyHours ?? 2);
  const [loggingOut, setLoggingOut] = useState(false);


  const scrollY    = useRef(new Animated.Value(0)).current;
  const hdrOpacity = scrollY.interpolate({ inputRange: [0, 55], outputRange: [0, 1], extrapolate: 'clamp' });

  const savePref = useCallback(async (key, val) => {
    try { await updateUser?.({ [key]: val }); } catch {}
  }, [updateUser]);

  const handleDarkToggle = (val) => {
    toggleDark(val);
    savePref('darkMode', val);
  };

  const handleSaveName = useCallback(async (newName) => {
    try {
      await updateUser?.({ name: newName });
    } catch {
      Alert.alert('Error', 'Could not update name. Try again.');
    }
  }, [updateUser]);

  const handleExport = () => {
    if (!sessionList || sessionList.length === 0) {
      Alert.alert('No Sessions', 'Complete some study sessions first before exporting.');
      return;
    }
    const lines = [
      'Date,Subject,Duration(min),Completed,Energy,Difficulty,Notes',
      ...sessionList.map(s =>
        `${s.date || ''},${s.subject || ''},${s.duration || 0},${s.completed ? 'Yes' : 'No'},${s.energy || ''},${s.difficulty || ''},"${(s.notes || '').replace(/"/g, "'")}"`
      ),
    ];
    const csv = lines.join('\n');
    Alert.alert(
      '📤 Export Ready',
      `${sessionList.length} sessions ready to export.\n\nPreview:\n${lines[1]}\n\nFull CSV export to files coming in next update!`,
      [{ text: 'OK' }]
    );
  };

  const handlePrivacy = () => {
    Alert.alert(
      '🔒 Privacy Policy',
      'StudyBloom stores your study sessions and score securely in Firebase Firestore.\n\n• We never sell your data\n• Sessions are only visible to you\n• Data is deleted when you reset or delete your account\n• We use Firebase Authentication for secure login',
      [{ text: 'Got it', style: 'default' }]
    );
  };

  const handleReset = () => Alert.alert(
  'Reset All Data',
  'This permanently deletes every session and resets your score. There is no undo.',
  [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'Reset Forever', style: 'destructive',
      onPress: async () => {
        try {
          // Delete all sessions from Firestore
          await Promise.all(
            (sessionList || []).map(s => deleteSession(s.id))
          );
          // Reset user stats
          await updateUser?.({
            score:           0,
            streak:          0,
            totalSessions:   0,
            totalMinutes:    0,
            disciplineScore: 50,
          });
          Alert.alert('✅ Done', 'All sessions and stats have been reset.');
        } catch {
          Alert.alert('Error', 'Could not reset data. Try again.');
        }
      },
    },
  ]
);

  const handleLogout = () => Alert.alert(
    'Log Out', `Sign out of ${email || 'your account'}?`,
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out', style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          try {
            await logout?.();
            // App.js onAuthStateChanged handles navigation automatically
          } catch {
            Alert.alert('Error', 'Could not sign out. Try again.');
            setLoggingOut(false);
          }
        },
      },
    ]
  );

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>

      {/* Sticky floating header */}
      <Animated.View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100, height: 56, backgroundColor: C.bg + 'f4', justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 10, borderBottomWidth: 0.5, borderBottomColor: C.border, opacity: hdrOpacity }}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: C.text }}>Settings</Text>
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 64, paddingBottom: 120, paddingHorizontal: 20 }}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
      >
        {/* Hero */}
        <Text style={{ fontSize: 9, fontWeight: '800', color: C.blue, letterSpacing: 3.5, marginBottom: 5, marginTop: 6, textTransform: 'uppercase' }}>Your Account</Text>
        <Text style={{ fontSize: 32, fontWeight: '800', color: C.text, letterSpacing: -1.2, marginBottom: 24 }}>Settings</Text>

        {/* Profile card */}
        <Tap onPress={() => navigation.navigate('Tabs', { screen: 'Profile' })}>
          <View style={{ backgroundColor: C.blue, borderRadius: 22, padding: 18, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 14, overflow: 'hidden', shadowColor: 'rgba(245,200,66,0.4)', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 1, shadowRadius: 18, elevation: 8 }}>
            <View style={{ position: 'absolute', right: -20, top: -20, width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.15)' }} />
            <View style={{ position: 'absolute', right: 40, bottom: -30, width: 110, height: 110, borderRadius: 55, backgroundColor: 'rgba(255,255,255,0.08)' }} />
            <View style={{ width: 58, height: 58, borderRadius: 29, backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)' }}>
              {customAvatar ? (
              <Image source={{ uri: customAvatar }} style={{ width: 52, height: 52, borderRadius: 26 }}/>
                ) : avatarId ? (
              <Image
                source={
                  avatarId === 'boy1' ? require('../../../assets/boy1.jpg') :
                    avatarId === 'boy2' ? require('../../../assets/boy2.jpg') :
                    avatarId === 'boy3' ? require('../../../assets/boy3.jpg') :
                    avatarId === 'girl1' ? require('../../../assets/girl1.jpg') :
                    avatarId === 'girl2' ? require('../../../assets/girl2.jpg') :
                    avatarId === 'girl3' ? require('../../../assets/girl3.jpg') :
                    avatarId === 'girl4' ? require('../../../assets/girl4.jpg') :
                    null
                }
              style={{ width: 52, height: 52, borderRadius: 26 }}/>
              ) : (
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#2a2000' }}>
                {name.split(' ').map(w => w[0] || '').join('').toUpperCase().slice(0, 2) || '?'}
              </Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                <Text style={{ fontSize: 17, fontWeight: '800', color: '#1a1000', flex: 1 }} numberOfLines={1}>{name || 'Tap to set name'}</Text>
                <View style={{ backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 5, paddingVertical: 2, paddingHorizontal: 7 }}>
                  <Text style={{ fontSize: 7, fontWeight: '900', color: '#1a1000', letterSpacing: 1.5 }}>EDIT</Text>
                </View>
              </View>
              <Text style={{ fontSize: 10, color: 'rgba(26,16,0,0.55)', marginBottom: 9 }} numberOfLines={1}>{email || 'No email set'}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.25)', overflow: 'hidden' }}>
                  <View style={{ width: `${Math.min(score, 100)}%`, height: '100%', borderRadius: 2, backgroundColor: '#fff' }} />
                </View>
                <Text style={{ fontSize: 10, fontWeight: '700', color: 'rgba(26,16,0,0.6)' }}>{score} XP</Text>
              </View>
            </View>
            <Text style={{ fontSize: 22, color: 'rgba(26,16,0,0.35)' }}>›</Text>
          </View>
        </Tap>

        {/* Stats strip */}
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border, marginBottom: 28, paddingVertical: 13, shadowColor: C.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 10, elevation: 2 }}>
          {[
            { val: sessionList?.length ?? 0, lbl: 'Sessions' },
            { val: streak,                   lbl: 'Streak'   },
            { val: score,                    lbl: 'Score'     },
          ].map((st, i, arr) => (
            <React.Fragment key={st.lbl}>
              <View style={{ flex: 1, alignItems: 'center', gap: 3 }}>
                <Text style={{ fontSize: 20, fontWeight: '800', color: C.text }}>{st.val}</Text>
                <Text style={{ fontSize: 9, color: C.muted, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase' }}>{st.lbl}</Text>
              </View>
              {i < arr.length - 1 && <View style={{ width: 1, height: 32, backgroundColor: C.border }} />}
            </React.Fragment>
          ))}
        </View>

        {/* PREFERENCES */}
        <SLabel C={C}>PREFERENCES</SLabel>
        <View style={{ backgroundColor: C.card, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: C.border, marginBottom: 24, shadowColor: C.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 10, elevation: 2 }}>
          <Row C={C} icon="🌙" iconBg={dark ? C.purpleSoft : C.lavSoft}
            label="Dark Mode"
            sub={dark ? 'Dark theme active — all screens' : 'Light theme active'}
            right={<Toggle value={dark} onChange={handleDarkToggle} C={C} />}
          />
          <Row C={C} icon="🔔" iconBg={C.yellowSoft}
            label="Notifications" sub={notifs ? 'Daily reminders on' : 'All alerts muted'}
            right={<Toggle value={notifs} onChange={v => { setNotifs(v); savePref('notifs', v); }} C={C} />}
          />
          <Row C={C} icon="🔊" iconBg={C.mintSoft}
            label="Sound Effects" sub="Session start & end cues"
            right={<Toggle value={sound} onChange={v => { setSound(v); savePref('sound', v); }} C={C} />}
          />
          <Row C={C} icon="📳" iconBg={C.peachSoft}
            label="Haptic Feedback" sub="Vibration on key actions"
            right={<Toggle value={haptics} onChange={v => { setHaptics(v); savePref('haptics', v); }} C={C} />}
            last
          />
        </View>

        {/* FOCUS CONFIG */}
        <SLabel C={C}>FOCUS CONFIG</SLabel>
        <View style={{ backgroundColor: C.card, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: C.border, marginBottom: 24, shadowColor: C.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 10, elevation: 2 }}>
          <View style={{ padding: 14, gap: 10 }}>
            <Text style={{ fontSize: 8, fontWeight: '800', color: C.muted, letterSpacing: 2, textTransform: 'uppercase' }}>PRIMARY GOAL</Text>
            <Chips options={GOALS ?? ['Exam Prep', 'Skill Building', 'General Discipline']} value={goal} onChange={v => { setGoal(v); savePref('goal', v); }} C={C} />
          </View>
          <View style={{ height: 1, backgroundColor: C.border }} />
          <View style={{ padding: 14, gap: 10 }}>
            <Text style={{ fontSize: 8, fontWeight: '800', color: C.muted, letterSpacing: 2, textTransform: 'uppercase' }}>STUDY WINDOW</Text>
            <Chips options={STUDY_TIMES ?? ['Morning', 'Afternoon', 'Night']} value={studyTime} onChange={v => { setStudyTime(v); savePref('studyTime', v); }} C={C} />
          </View>
          <View style={{ height: 1, backgroundColor: C.border }} />
          <View style={{ padding: 14 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={{ fontSize: 8, fontWeight: '800', color: C.muted, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 2 }}>DAILY TARGET</Text>
                <Text style={{ fontSize: 11, color: C.muted }}>Hours of focused study</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Tap onPress={() => setDailyHours(h => Math.max(1, h - 1))}>
                  <View style={{ width: 32, height: 32, borderRadius: 9, backgroundColor: C.bgRaised, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 18, color: C.text }}>−</Text>
                  </View>
                </Tap>
                <Text style={{ fontSize: 20, fontWeight: '800', color: C.text, minWidth: 34, textAlign: 'center' }}>{dailyHours}h</Text>
                <Tap onPress={() => setDailyHours(h => Math.min(12, h + 1))}>
                  <View style={{ width: 32, height: 32, borderRadius: 9, backgroundColor: C.bgRaised, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 18, color: C.text }}>+</Text>
                  </View>
                </Tap>
              </View>
            </View>
          </View>
        </View>

        {/* ACCOUNT */}
        <SLabel C={C}>ACCOUNT</SLabel>
        <View style={{ backgroundColor: C.card, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: C.border, marginBottom: 24, shadowColor: C.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 10, elevation: 2 }}>
          <Row C={C} icon="📤" iconBg={C.yellowSoft}  label="Export Sessions"  sub={`${sessionList?.length ?? 0} sessions ready`} onPress={handleExport} />
          <Row C={C} icon="🔒" iconBg={C.mintSoft}    label="Privacy Policy"   sub="How we handle your data"         onPress={handlePrivacy} last />
        </View>

        {/* DANGER ZONE */}
        <SLabel C={C} danger>DANGER ZONE</SLabel>
        <View style={{ backgroundColor: C.card, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: C.redSoft, marginBottom: 28 }}>
          <Row C={C} icon="🗑" label="Reset All Data" sub="Permanently wipes sessions & score" onPress={handleReset} danger />
          <Row C={C} icon="↩" label="Log Out"         sub={email || undefined}                 onPress={handleLogout} loading={loggingOut} danger last />
        </View>

        {/* Footer */}
        <View style={{ alignItems: 'center', gap: 5, paddingTop: 6, paddingBottom: 10 }}>
          <View style={{ width: 36, height: 3, borderRadius: 2, backgroundColor: C.blue, marginBottom: 5 }} />
          <Text style={{ fontSize: 11, fontWeight: '800', color: C.muted, letterSpacing: 3 }}>STUDYBLOOM</Text>
          <Text style={{ fontSize: 9, color: C.subtext, letterSpacing: 0.5 }}>v1.0.0 · Spark Plan · Built by Team SB</Text>
        </View>

      </Animated.ScrollView>
    </View>
  );
}
