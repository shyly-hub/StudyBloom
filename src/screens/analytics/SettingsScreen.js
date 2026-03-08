
import React, {
  useState, useEffect, useRef, useCallback,
} from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  Animated, Dimensions, Image,
  ActivityIndicator, Alert, TextInput,
  Modal, Pressable, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth }         from '../../hooks/useAuth';
import { GOALS, STUDY_TIMES } from '../../themes';

const { width } = Dimensions.get('window');

// ══════════════════════════════════════════
//  DESIGN TOKENS
// ══════════════════════════════════════════
const T = {
  void:        '#06060a',
  surface:     '#0d0b14',
  surfaceMid:  '#120f1c',
  surfaceHi:   '#1a1628',
  rim:         '#241f38',
  rimBright:   '#372f58',
  volt:        '#9b5cfc',
  voltDim:     'rgba(155,92,252,0.18)',
  voltGlow:    'rgba(155,92,252,0.10)',
  voltDeep:    '#5b3fd4',
  ink:         '#eeeaf6',
  inkMid:      '#6e6a85',
  inkDim:      '#2e2a42',
  emerald:     '#00e5a0',
  ember:       '#ff4d6d',
  amber:       '#f7b731',
  r:           20,
  rSm:         12,
};

const getRank = (score) => {
  if (score >= 80) return { label: 'S', color: T.volt    };
  if (score >= 60) return { label: 'A', color: T.emerald };
  if (score >= 40) return { label: 'B', color: T.amber   };
  return                   { label: 'C', color: T.inkMid };
};

const getInitials = (name = '') =>
  name.split(' ').map(w => w[0] || '').join('').toUpperCase().slice(0, 2) || '?';

// ══════════════════════════════════════════
//  MICRO-SPRING TAP WRAPPER
// ══════════════════════════════════════════
function Tap({ onPress, children, style, disabled }) {
  const scale   = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const down = () => Animated.parallel([
    Animated.spring(scale,   { toValue: 0.965, useNativeDriver: true, tension: 400, friction: 20 }),
    Animated.timing(opacity, { toValue: 0.72,  duration: 60,  useNativeDriver: true }),
  ]).start();

  const up = () => Animated.parallel([
    Animated.spring(scale,   { toValue: 1, useNativeDriver: true, tension: 300, friction: 15 }),
    Animated.timing(opacity, { toValue: 1, duration: 100, useNativeDriver: true }),
  ]).start();

  if (disabled) return <View style={style}>{children}</View>;
  return (
    <Pressable onPressIn={down} onPressOut={up} onPress={onPress}>
      <Animated.View style={[style, { transform: [{ scale }], opacity }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

// ══════════════════════════════════════════
//  GLOW RING AVATAR — breathing neon ring
// ══════════════════════════════════════════
function GlowAvatar({ name = '', photoURL = null, size = 64, score = 0 }) {
  const [imgErr, setImgErr] = useState(false);
  const pulse  = useRef(new Animated.Value(1)).current;
  const rank   = getRank(score);

  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1.1,  duration: 2400, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1,    duration: 2400, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);

  const outerSize = size + 8;

  return (
    <View style={{ width: outerSize + 16, height: outerSize + 16, alignItems: 'center', justifyContent: 'center' }}>
      {/* Breathing glow halo */}
      <Animated.View style={{
        position: 'absolute',
        width:    outerSize + 18, height: outerSize + 18,
        borderRadius: (outerSize + 18) / 2,
        backgroundColor: T.voltGlow,
        transform: [{ scale: pulse }],
      }} />
      {/* Volt ring */}
      <View style={{
        width: outerSize, height: outerSize, borderRadius: outerSize / 2,
        borderWidth: 1.5, borderColor: T.volt,
        alignItems: 'center', justifyContent: 'center',
      }}>
        {photoURL && !imgErr ? (
          <Image
            source={{ uri: photoURL }}
            style={{ width: size, height: size, borderRadius: size / 2 }}
            onError={() => setImgErr(true)}
          />
        ) : (
          <LinearGradient
            colors={[T.voltDeep, T.volt]}
            style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ fontSize: size * 0.3, fontWeight: '800', color: '#fff', letterSpacing: 1 }}>
              {getInitials(name)}
            </Text>
          </LinearGradient>
        )}
      </View>
      {/* Rank badge */}
      <View style={{
        position: 'absolute', bottom: 2, right: 2,
        width: 22, height: 22, borderRadius: 11,
        backgroundColor: rank.color, borderWidth: 2, borderColor: T.void,
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Text style={{ fontSize: 9, fontWeight: '900', color: '#fff' }}>{rank.label}</Text>
      </View>
    </View>
  );
}

// ══════════════════════════════════════════
//  VOLT TOGGLE — animated custom switch
// ══════════════════════════════════════════
function VoltToggle({ value, onChange }) {
  const anim    = useRef(new Animated.Value(value ? 1 : 0)).current;
  const thumbX  = anim.interpolate({ inputRange: [0,1], outputRange: [2, 22] });
  const trackBg = anim.interpolate({ inputRange: [0,1], outputRange: [T.rim, T.volt] });
  const glowOp  = anim.interpolate({ inputRange: [0,1], outputRange: [0, 1] });

  const toggle = () => {
    const next = !value;
    Animated.spring(anim, { toValue: next ? 1 : 0, useNativeDriver: false, tension: 280, friction: 22 }).start();
    onChange(next);
  };

  return (
    <Pressable onPress={toggle} hitSlop={10}>
      <Animated.View style={[s.trackOuter, { backgroundColor: trackBg }]}>
        <Animated.View style={[StyleSheet.absoluteFill, { borderRadius: 13, backgroundColor: T.voltGlow, opacity: glowOp }]} />
        <Animated.View style={[s.thumb, { transform: [{ translateX: thumbX }] }]} />
      </Animated.View>
    </Pressable>
  );
}

// ══════════════════════════════════════════
//  NEON CHIP SELECTOR
// ══════════════════════════════════════════
function NeonChips({ options = [], value, onChange }) {
  return (
    <View style={s.chipRow}>
      {options.map(opt => {
        const on = value === opt;
        return (
          <Tap key={opt} onPress={() => onChange(opt)}>
            <View style={[s.chip, on && s.chipOn]}>
              {on && <View style={[StyleSheet.absoluteFillObject, { borderRadius: 30, backgroundColor: T.voltGlow }]} />}
              <Text style={[s.chipText, on && s.chipTextOn]}>{opt}</Text>
            </View>
          </Tap>
        );
      })}
    </View>
  );
}

// ══════════════════════════════════════════
//  SECTION LABEL
// ══════════════════════════════════════════
function SectionLabel({ children, danger }) {
  return (
    <View style={s.sectionLabelRow}>
      <View style={[s.sectionBar, danger && { backgroundColor: T.ember }]} />
      <Text style={s.sectionText}>{children}</Text>
    </View>
  );
}

// ══════════════════════════════════════════
//  GLASS ROW
// ══════════════════════════════════════════
function GlassRow({ icon, label, sub, right, onPress, last, danger, loading }) {
  const body = (
    <View style={[s.row, !last && s.rowBorder]}>
      <View style={[s.iconBox, danger && s.iconBoxDanger]}>
        <Text style={{ fontSize: 16 }}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[s.rowLabel, danger && s.rowLabelDanger]}>{label}</Text>
        {sub ? <Text style={s.rowSub} numberOfLines={1}>{sub}</Text> : null}
      </View>
      <View style={{ flexShrink: 0, marginLeft: 8 }}>
        {loading
          ? <ActivityIndicator size="small" color={T.volt} />
          : right ?? <Text style={[s.caret, danger && { color: T.ember }]}>›</Text>
        }
      </View>
    </View>
  );
  return onPress ? <Tap onPress={onPress}>{body}</Tap> : body;
}

// ══════════════════════════════════════════
//  EDIT NAME BOTTOM SHEET
// ══════════════════════════════════════════
function EditSheet({ visible, currentName, onSave, onClose }) {
  const [val,    setVal]    = useState('');
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');
  const slideY   = useRef(new Animated.Value(400)).current;
  const fadeBack = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setVal(currentName || '');
      setError('');
      Animated.parallel([
        Animated.spring(slideY,   { toValue: 0,   useNativeDriver: true, tension: 78, friction: 14 }),
        Animated.timing(fadeBack, { toValue: 1,   duration: 220, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideY,   { toValue: 400, duration: 220, useNativeDriver: true }),
        Animated.timing(fadeBack, { toValue: 0,   duration: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const submit = async () => {
    const trimmed = val.trim();
    if (!trimmed)           { setError('Name cannot be empty.');   return; }
    if (trimmed.length < 2) { setError('At least 2 characters.');  return; }
    if (trimmed.length > 32){ setError('Max 32 characters.');       return; }
    setSaving(true); setError('');
    try {
      await onSave(trimmed);
      onClose();
    } catch {
      setError('Failed to update. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[s.backdropView, { opacity: fadeBack }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <Animated.View style={[s.sheet, { transform: [{ translateY: slideY }] }]}>
        <View style={s.sheetHandle} />
        <Text style={s.sheetTitle}>Display Name</Text>
        <Text style={s.sheetHint}>Appears across your profile and all study sessions.</Text>
        <View style={[s.inputWrap, error && { borderColor: T.ember }]}>
          <TextInput
            style={s.input}
            value={val}
            onChangeText={v => { setVal(v); setError(''); }}
            placeholder="Enter your name"
            placeholderTextColor={T.inkDim}
            autoFocus maxLength={32}
            selectionColor={T.volt}
            returnKeyType="done"
            onSubmitEditing={submit}
          />
          <Text style={s.inputCount}>{val.length}/32</Text>
        </View>
        <Text style={s.errorText}>{error}</Text>
        <Tap onPress={submit} disabled={saving}>
          <LinearGradient
            colors={saving ? [T.inkDim, T.inkDim] : [T.voltDeep, T.volt]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={s.sheetBtn}
          >
            {saving
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={s.sheetBtnText}>Save Changes</Text>
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

  // Real auth data — no fallbacks to sample data
  const auth       = useAuth?.() || {};
  const user       = auth.user           || null;
  const userData   = auth.userData       || null;
  const logout     = auth.logout         || null;
  const updateUser = auth.updateUserData || null;

  // Derived from live source only
  const name     = userData?.name       || user?.displayName || '';
  const email    = userData?.email      || user?.email       || '';
  const photoURL = userData?.photoURL   || user?.photoURL    || null;
  const score    = userData?.score      ?? userData?.disciplineScore ?? 0;
  const sessions = userData?.totalSessions ?? 0;
  const streak   = userData?.streak    ?? 0;

  // Preference state — initialised from userData
  const [darkMode,   setDarkMode]   = useState(userData?.darkMode   ?? false);
  const [notifs,     setNotifs]     = useState(userData?.notifs     ?? true);
  const [sound,      setSound]      = useState(userData?.sound      ?? true);
  const [haptics,    setHaptics]    = useState(userData?.haptics    ?? true);
  const [goal,       setGoal]       = useState(userData?.goal       || GOALS?.[0]        || 'Exam Prep');
  const [studyTime,  setStudyTime]  = useState(userData?.studyTime  || STUDY_TIMES?.[2]  || 'Night');
  const [dailyHours, setDailyHours] = useState(userData?.dailyHours ?? 2);
  const [editOpen,   setEditOpen]   = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const scrollY    = useRef(new Animated.Value(0)).current;
  const hdrOpacity = scrollY.interpolate({ inputRange: [0, 55], outputRange: [0, 1], extrapolate: 'clamp' });

  const savePref = useCallback(async (key, val) => {
    try { await updateUser?.({ [key]: val }); } catch {}
  }, [updateUser]);

  const handleSaveName = useCallback(async (newName) => {
    await updateUser?.({ name: newName });
  }, [updateUser]);

  const handleReset = () => Alert.alert(
    'Reset All Data',
    'This permanently deletes every session and resets your score. There is no undo.',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset Forever', style: 'destructive', onPress: () => {
        // TODO: call context resetUserData()
        Alert.alert('Done', 'All data wiped.');
      }},
    ]
  );

  const handleLogout = () => Alert.alert(
    'Log Out',
    `You'll be signed out of ${email || 'your account'}.`,
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: async () => {
        setLoggingOut(true);
        try {
          await logout?.();
          navigation?.reset?.({ index: 0, routes: [{ name: 'Auth' }] });
        } catch {
          Alert.alert('Error', 'Could not sign out. Try again.');
          setLoggingOut(false);
        }
      }},
    ]
  );

  return (
    <View style={s.screen}>

      {/* Sticky header on scroll */}
      <Animated.View style={[s.floatHeader, { opacity: hdrOpacity }]}>
        <Text style={s.floatTitle}>Settings</Text>
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* Page title */}
        <Text style={s.heroLabel}>SYSTEM CONFIG</Text>
        <Text style={s.heroTitle}>Settings</Text>

        {/* Profile card */}
        <Tap onPress={() => setEditOpen(true)}>
          <View style={s.profileCard}>
            <LinearGradient colors={[T.surfaceMid, T.surface]} style={StyleSheet.absoluteFill} />
            <View style={s.profileGlowBlob} />
            <GlowAvatar name={name} photoURL={photoURL} size={62} score={score} />
            <View style={s.profileInfo}>
              <View style={s.profileNameRow}>
                <Text style={s.profileName} numberOfLines={1}>
                  {name || 'Unnamed Player'}
                </Text>
                <View style={s.editBadge}>
                  <Text style={s.editBadgeText}>EDIT</Text>
                </View>
              </View>
              <Text style={s.profileEmail} numberOfLines={1}>
                {email || 'No email set'}
              </Text>
              <View style={s.xpRow}>
                <View style={s.xpTrack}>
                  <View style={[s.xpFill, { width: `${Math.min(score, 100)}%` }]} />
                </View>
                <Text style={s.xpLabel}>{score} XP</Text>
              </View>
            </View>
            <Text style={[s.caret, { fontSize: 24, color: T.inkDim }]}>›</Text>
          </View>
        </Tap>

        {/* Stats strip */}
        <View style={s.statsStrip}>
          {[
            { val: sessions, lbl: 'Sessions' },
            { val: streak,   lbl: 'Streak'   },
            { val: score,    lbl: 'Score'     },
          ].map((st, i, arr) => (
            <React.Fragment key={st.lbl}>
              <View style={s.statItem}>
                <Text style={s.statVal}>{st.val}</Text>
                <Text style={s.statLbl}>{st.lbl}</Text>
              </View>
              {i < arr.length - 1 && <View style={s.statsDivider} />}
            </React.Fragment>
          ))}
        </View>

        {/* Preferences */}
        <SectionLabel>PREFERENCES</SectionLabel>
        <View style={s.card}>
          <GlassRow icon="🌙" label="Dark Mode"       sub={darkMode ? 'Void theme active' : 'Light theme active'} right={<VoltToggle value={darkMode} onChange={v => { setDarkMode(v); savePref('darkMode', v); }} />} />
          <GlassRow icon="🔔" label="Notifications"   sub={notifs   ? 'Daily reminders on' : 'All alerts muted'} right={<VoltToggle value={notifs}   onChange={v => { setNotifs(v);  savePref('notifs', v);   }} />} />
          <GlassRow icon="🔊" label="Sound Effects"   sub="Session start & end cues"                              right={<VoltToggle value={sound}    onChange={v => { setSound(v);   savePref('sound', v);    }} />} />
          <GlassRow icon="📳" label="Haptic Feedback" sub="Vibration on key actions"                              right={<VoltToggle value={haptics}  onChange={v => { setHaptics(v); savePref('haptics', v);  }} />} last />
        </View>

        {/* Focus config */}
        <SectionLabel>FOCUS CONFIG</SectionLabel>
        <View style={s.card}>
          <View style={s.cardInner}>
            <Text style={s.cardInnerLabel}>PRIMARY GOAL</Text>
            <NeonChips
              options={GOALS ?? ['Exam Prep', 'Skill Building', 'Discipline']}
              value={goal}
              onChange={v => { setGoal(v); savePref('goal', v); }}
            />
          </View>
          <View style={s.cardDivider} />
          <View style={s.cardInner}>
            <Text style={s.cardInnerLabel}>STUDY WINDOW</Text>
            <NeonChips
              options={STUDY_TIMES ?? ['Morning', 'Afternoon', 'Night']}
              value={studyTime}
              onChange={v => { setStudyTime(v); savePref('studyTime', v); }}
            />
          </View>
          <View style={s.cardDivider} />
          <View style={s.cardInner}>
            <View style={s.hoursRow}>
              <View>
                <Text style={s.cardInnerLabel}>DAILY TARGET</Text>
                <Text style={s.rowSub}>Hours of focused study</Text>
              </View>
              <View style={s.stepper}>
                <Tap onPress={() => setDailyHours(h => Math.max(1, h - 1))}>
                  <View style={s.stepBtn}><Text style={s.stepBtnText}>−</Text></View>
                </Tap>
                <Text style={s.stepVal}>{dailyHours}h</Text>
                <Tap onPress={() => setDailyHours(h => Math.min(12, h + 1))}>
                  <View style={s.stepBtn}><Text style={s.stepBtnText}>+</Text></View>
                </Tap>
              </View>
            </View>
          </View>
        </View>

        {/* Account */}
        <SectionLabel>ACCOUNT</SectionLabel>
        <View style={s.card}>
          <GlassRow icon="✎"  label="Edit Name"       sub={name || 'Tap to set name'}   onPress={() => setEditOpen(true)} />
          <GlassRow icon="📤" label="Export Sessions"  sub="Download CSV of your history" onPress={() => Alert.alert('Export', 'Coming soon.')} />
          <GlassRow icon="🔒" label="Privacy Policy"                                      onPress={() => Alert.alert('Privacy', 'Coming soon.')} last />
        </View>

        {/* Danger zone */}
        <SectionLabel danger>DANGER ZONE</SectionLabel>
        <View style={[s.card, s.dangerCard]}>
          <GlassRow icon="🗑" label="Reset All Data" sub="Permanently wipes sessions & score" onPress={handleReset} danger />
          <GlassRow icon="↩" label="Log Out"         sub={email || undefined}                  onPress={handleLogout} loading={loggingOut} danger last />
        </View>

        {/* Footer */}
        <View style={s.footer}>
          <LinearGradient colors={[T.voltDeep, T.volt]} start={{ x:0, y:0 }} end={{ x:1, y:0 }} style={s.footerAccent} />
          <Text style={s.footerApp}>STUDYBLOOM</Text>
          <Text style={s.footerSub}>v1.0.0 · Spark Plan · Built by Team SB</Text>
        </View>

      </Animated.ScrollView>

      <EditSheet
        visible={editOpen}
        currentName={name}
        onSave={handleSaveName}
        onClose={() => setEditOpen(false)}
      />
    </View>
  );
}

// ══════════════════════════════════════════
//  STYLES
// ══════════════════════════════════════════
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: T.void },
  scroll: { paddingTop: 68, paddingBottom: 120, paddingHorizontal: 22 },

  floatHeader: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100, height: 56, backgroundColor: T.void + 'f4', justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 10, borderBottomWidth: 0.5, borderBottomColor: T.rim },
  floatTitle:  { fontSize: 14, fontWeight: '700', color: T.ink, letterSpacing: 0.5 },

  heroLabel: { fontSize: 9, fontWeight: '800', color: T.volt, letterSpacing: 4, marginBottom: 6, marginTop: 8 },
  heroTitle:  { fontSize: 38, fontWeight: '800', color: T.ink, letterSpacing: -1.5, marginBottom: 28, lineHeight: 40 },

  profileCard:     { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: T.r, padding: 18, marginBottom: 12, overflow: 'hidden', borderWidth: 0.5, borderColor: T.rim },
  profileGlowBlob: { position: 'absolute', left: -20, top: -20, width: 120, height: 120, borderRadius: 60, backgroundColor: T.voltGlow },
  profileInfo:     { flex: 1, gap: 4 },
  profileNameRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  profileName:     { fontSize: 18, fontWeight: '800', color: T.ink, letterSpacing: -0.4, flex: 1 },
  profileEmail:    { fontSize: 11, color: T.inkMid },
  editBadge:       { backgroundColor: T.voltDim, borderRadius: 4, paddingVertical: 2, paddingHorizontal: 6 },
  editBadgeText:   { fontSize: 7, fontWeight: '900', color: T.volt, letterSpacing: 1.5 },
  xpRow:           { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  xpTrack:         { flex: 1, height: 4, borderRadius: 2, backgroundColor: T.rim, overflow: 'hidden' },
  xpFill:          { height: '100%', borderRadius: 2, backgroundColor: T.volt },
  xpLabel:         { fontSize: 10, fontWeight: '700', color: T.volt, minWidth: 44 },

  statsStrip:   { flexDirection: 'row', alignItems: 'center', backgroundColor: T.surface, borderRadius: T.rSm, borderWidth: 0.5, borderColor: T.rim, marginBottom: 28, paddingVertical: 14 },
  statItem:     { flex: 1, alignItems: 'center', gap: 3 },
  statVal:      { fontSize: 22, fontWeight: '800', color: T.ink, letterSpacing: -0.5 },
  statLbl:      { fontSize: 9, color: T.inkMid, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' },
  statsDivider: { width: 0.5, height: 36, backgroundColor: T.rim },

  sectionLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10, marginTop: 4 },
  sectionBar:      { width: 3, height: 12, borderRadius: 2, backgroundColor: T.volt },
  sectionText:     { fontSize: 9, fontWeight: '800', color: T.inkMid, letterSpacing: 2.5, textTransform: 'uppercase' },

  card:       { backgroundColor: T.surface, borderRadius: T.r, overflow: 'hidden', borderWidth: 0.5, borderColor: T.rim, marginBottom: 28 },
  dangerCard: { borderColor: 'rgba(255,77,109,0.3)' },
  cardInner:  { padding: 16, gap: 10 },
  cardInnerLabel: { fontSize: 8, fontWeight: '800', color: T.inkMid, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 2 },
  cardDivider:    { height: 0.5, backgroundColor: T.rim },

  row:            { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 16, gap: 12 },
  rowBorder:      { borderBottomWidth: 0.5, borderBottomColor: T.rim },
  iconBox:        { width: 36, height: 36, borderRadius: 10, backgroundColor: T.surfaceHi, alignItems: 'center', justifyContent: 'center', flexShrink: 0, borderWidth: 0.5, borderColor: T.rim },
  iconBoxDanger:  { backgroundColor: 'rgba(255,77,109,0.1)' },
  rowLabel:       { fontSize: 14, fontWeight: '600', color: T.ink, letterSpacing: -0.1 },
  rowLabelDanger: { color: T.ember },
  rowSub:         { fontSize: 11, color: T.inkMid, marginTop: 1 },
  caret:          { fontSize: 20, color: T.inkDim, fontWeight: '300' },

  trackOuter: { width: 48, height: 26, borderRadius: 13, justifyContent: 'center', overflow: 'hidden', borderWidth: 0.5, borderColor: T.rimBright },
  thumb:      { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', shadowColor: T.volt, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 5, elevation: 3 },

  chipRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:         { paddingVertical: 7, paddingHorizontal: 15, borderRadius: 30, backgroundColor: T.surfaceHi, borderWidth: 0.5, borderColor: T.rim, overflow: 'hidden' },
  chipOn:       { borderColor: T.volt },
  chipText:     { fontSize: 11, fontWeight: '700', color: T.inkMid, letterSpacing: 0.3 },
  chipTextOn:   { color: T.volt },

  hoursRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stepper:     { flexDirection: 'row', alignItems: 'center', gap: 14 },
  stepBtn:     { width: 34, height: 34, borderRadius: 10, backgroundColor: T.surfaceHi, borderWidth: 0.5, borderColor: T.rim, alignItems: 'center', justifyContent: 'center' },
  stepBtnText: { fontSize: 18, fontWeight: '600', color: T.ink },
  stepVal:     { fontSize: 20, fontWeight: '800', color: T.ink, minWidth: 36, textAlign: 'center' },

  footer:       { alignItems: 'center', gap: 6, paddingTop: 8, paddingBottom: 12 },
  footerAccent: { width: 40, height: 3, borderRadius: 2, marginBottom: 6 },
  footerApp:    { fontSize: 10, fontWeight: '900', color: T.inkMid, letterSpacing: 3 },
  footerSub:    { fontSize: 9, color: T.inkDim, letterSpacing: 0.5 },

  backdropView: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 200 },
  sheet: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 201, backgroundColor: T.surfaceMid, borderTopLeftRadius: 28, borderTopRightRadius: 28, borderTopWidth: 0.5, borderTopColor: T.rim, padding: 24, paddingBottom: Platform.OS === 'ios' ? 48 : 36 },
  sheetHandle:  { width: 40, height: 4, borderRadius: 2, backgroundColor: T.rim, alignSelf: 'center', marginBottom: 22 },
  sheetTitle:   { fontSize: 22, fontWeight: '800', color: T.ink, letterSpacing: -0.5, marginBottom: 6 },
  sheetHint:    { fontSize: 12, color: T.inkMid, marginBottom: 20, lineHeight: 18 },
  inputWrap:    { flexDirection: 'row', alignItems: 'center', backgroundColor: T.surfaceHi, borderRadius: T.rSm, borderWidth: 0.5, borderColor: T.rim, paddingHorizontal: 16, height: 54, marginBottom: 8 },
  input:        { flex: 1, fontSize: 16, color: T.ink, fontWeight: '500' },
  inputCount:   { fontSize: 11, color: T.inkDim },
  errorText:    { fontSize: 12, color: T.ember, marginBottom: 4, marginLeft: 4, minHeight: 18 },
  sheetBtn:     { height: 54, borderRadius: T.rSm, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  sheetBtnText: { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
});