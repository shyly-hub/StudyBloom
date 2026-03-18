import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Alert, TextInput, Modal, ActivityIndicator,
  Image, Animated, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme }    from '../../context/ThemeContext';
import { useAuth }     from '../../hooks/useAuth';
import { useSession }  from '../../context/sessionContext';
import * as ImagePicker from 'expo-image-picker';
import { StatCard }    from '../../components';

const { width } = Dimensions.get('window');

// ── Avatar source helper ──────────────────
function getAvatarSource(avatarId) {
  switch (avatarId) {
    case 'boy1':  return require('../../../assets/boy1.jpg');
    case 'boy2':  return require('../../../assets/boy2.jpg');
    case 'boy3':  return require('../../../assets/boy3.jpg');
    case 'girl1': return require('../../../assets/girl1.jpg');
    case 'girl2': return require('../../../assets/girl2.jpg');
    case 'girl3': return require('../../../assets/girl3.jpg');
    case 'girl4': return require('../../../assets/girl4.jpg');
    default:      return null;
  }
}

// ── Counting animation number ─────────────
function CountUp({ value, style, suffix = '' }) {
  const anim    = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    anim.setValue(0);
    Animated.timing(anim, {
      toValue:         value,
      duration:        1000,
      useNativeDriver: false,
    }).start();
    const listener = anim.addListener(({ value: v }) => {
      setDisplay(Math.round(v * 10) / 10);
    });
    return () => anim.removeListener(listener);
  }, [value]);

  return (
    <Text style={style}>{display}{suffix}</Text>
  );
}

// ── Rank system ───────────────────────────
function getRank(hours) {
  if (hours < 5)   return { rank: 'Seedling 🌱',   next: 'Sprout',    pct: (hours / 5)   * 100 };
  if (hours < 15)  return { rank: 'Sprout 🌿',     next: 'Bloomer',   pct: ((hours-5)/10)  * 100 };
  if (hours < 30)  return { rank: 'Bloomer 🌸',    next: 'Scholar',   pct: ((hours-15)/15) * 100 };
  if (hours < 60)  return { rank: 'Scholar 📚',    next: 'Champion',  pct: ((hours-30)/30) * 100 };
  if (hours < 100) return { rank: 'Champion 🏆',   next: 'Legend',    pct: ((hours-60)/40) * 100 };
  return { rank: 'Legend 🌟', next: null, pct: 100 };
}

// ── Edit Name Modal ───────────────────────
function EditNameModal({ visible, currentName, onSave, onClose, C }) {
  const [value,  setValue]  = useState(currentName || '');
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const handleSave = async () => {
    const t = value.trim();
    if (!t)           { setError('Name cannot be empty.');   return; }
    if (t.length < 2) { setError('At least 2 characters.'); return; }
    setSaving(true); setError('');
    try   { await onSave(t); onClose(); }
    catch { setError('Failed to update. Try again.'); }
    finally { setSaving(false); }
  };

  return (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    onRequestClose={onClose}
  >
    <View
      style={{
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
      }}
    >
      <View
        style={{
          width: '100%',
          backgroundColor: C.card,
          borderRadius: 20,
          padding: 24,
          borderWidth: 1,
          borderColor: C.border,
        }}
      >
        <Text
          style={{
            fontSize: 20,
            fontWeight: '800',
            color: C.text,
            marginBottom: 12,
          }}
        >
          Edit Name
        </Text>

        <View
          style={{
            backgroundColor: C.bgRaised,
            borderRadius: 14,
            borderWidth: 1.5,
            borderColor: error ? C.red : C.border,
            paddingHorizontal: 16,
            height: 52,
            justifyContent: 'center',
            marginBottom: 6,
          }}
        >
          <TextInput
            style={{ fontSize: 16, color: C.text, fontWeight: '500' }}
            value={value}
            onChangeText={v => {
              setValue(v);
              setError('');
            }}
            placeholder="Your name"
            placeholderTextColor={C.subtext}
            autoFocus
            maxLength={32}
            selectionColor={C.blue}
            returnKeyType="done"
            onSubmitEditing={handleSave}
          />
        </View>

        {error ? (
          <Text
            style={{ fontSize: 12, color: C.red, marginBottom: 14, marginLeft: 4 }}
          >
            {error}
          </Text>
        ) : (
          <View style={{ height: 14 }} />
        )}

        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <TouchableOpacity
            onPress={onClose}
            style={{
              flex: 1,
              height: 50,
              borderRadius: 14,
              borderWidth: 1.5,
              borderColor: C.border,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 10,
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: '600', color: C.muted }}>
              Cancel
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            style={{
              flex: 1,
              height: 50,
              borderRadius: 14,
              backgroundColor: C.blue,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {saving ? (
              <ActivityIndicator color="#2a2000" />
            ) : (
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#2a2000' }}>
                Save
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
  );
}

// ── Avatar Picker Modal ───────────────────
const AVATARS = [
  { id: 'boy1',  label: 'Boy 1',  gender: 'boy',  src: require('../../../assets/boy1.jpg')  },
  { id: 'boy2',  label: 'Boy 2',  gender: 'boy',  src: require('../../../assets/boy2.jpg')  },
  { id: 'boy3',  label: 'Boy 3',  gender: 'boy',  src: require('../../../assets/boy3.jpg')  },
  { id: 'girl1', label: 'Girl 1', gender: 'girl', src: require('../../../assets/girl1.jpg') },
  { id: 'girl2', label: 'Girl 2', gender: 'girl', src: require('../../../assets/girl2.jpg') },
  { id: 'girl3', label: 'Girl 3', gender: 'girl', src: require('../../../assets/girl3.jpg') },
  { id: 'girl4', label: 'Girl 4', gender: 'girl', src: require('../../../assets/girl4.jpg') },
];

function AvatarPickerModal({ visible, current, onSave, onClose, C }) {
  const [selected, setSelected] = useState(current || null);
  const [filter,   setFilter]   = useState('all');
  const [saving,   setSaving]   = useState(false);
  const [customImage, setCustomImage] = useState(null);

  const filtered = filter === 'all' ? AVATARS : AVATARS.filter(a => a.gender === filter);

  const handleSave = async () => {
  if (!selected && !customImage) return;

  setSaving(true);
  try {
    await onSave({ selected, customImage });
    onClose();
  } catch {
    Alert.alert('Error', 'Could not save avatar.');
  } finally {
    setSaving(false);
  }
  };

  const handleUploadCustom = async () => {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled) {
      setCustomImage(result.assets[0].uri);
      setSelected(null);
    }
  } catch (err) {
    Alert.alert('Error', 'Could not pick image.');
  }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
        <View style={{
          backgroundColor: C.card,
          borderTopLeftRadius: 28, borderTopRightRadius: 28,
          padding: 24, paddingBottom: 44,
          borderTopWidth: 1, borderTopColor: C.border,
        }}>
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginBottom: 20 }} />
          <Text style={{ fontSize: 22, fontWeight: '800', color: C.text, marginBottom: 4 }}>Choose Avatar</Text>
          <Text style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>Cute anime characters! 🌸</Text>

          {/* Filter */}
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20, backgroundColor: C.bgRaised, borderRadius: 12, padding: 4, borderWidth: 1, borderColor: C.border }}>
            {[{ key: 'all', label: 'All' }, { key: 'boy', label: '👦 Boys' }, { key: 'girl', label: '👧 Girls' }].map(f => (
              <TouchableOpacity key={f.key} onPress={() => setFilter(f.key)}
                style={{ flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center', backgroundColor: filter === f.key ? C.card : 'transparent' }}>
                <Text style={{ fontSize: 12, fontWeight: filter === f.key ? '700' : '500', color: filter === f.key ? C.text : C.muted }}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Custom Image Upload */}
          <TouchableOpacity onPress={handleUploadCustom} style={{alignItems:'center', marginBottom:16}}>
            <View style={{width:76, height:76, borderRadius:38, backgroundColor:C.bgRaised, borderWidth:customImage ? 3 : 1.5, borderColor:customImage ? C.blue : C.border, alignItems:'center', justifyContent:'center', overflow:'hidden'}}>
              {customImage ?
              <Image source={{uri:customImage}} style={{width:'100%',height:'100%'}}/>
              :
                <Text style={{fontSize:18,color:C.muted}}>+</Text>
              }
            </View>
            <Text style={{fontSize:10, color:C.muted, marginTop:4}}>Your Photo</Text>
          </TouchableOpacity>

          {/* Grid */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginBottom: 24 }}>
            {filtered.map(a => {
              const isSel = selected === a.id;
              return (
                <TouchableOpacity key={a.id} onPress={() => {setSelected(a.id); setCustomImage(null);}} activeOpacity={0.8}
                  style={{ width: 72, alignItems: 'center', gap: 4 }}>
                  <View style={{ width: 68, height: 68, borderRadius: 34, overflow: 'hidden', borderWidth: isSel ? 3 : 1.5, borderColor: isSel ? C.blue : C.border }}>
                    <Image source={a.src} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    {isSel && (
                      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: C.blue + '20', alignItems: 'flex-end', justifyContent: 'flex-start', padding: 3 }}>
                        <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: C.blue, alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ fontSize: 8, color: '#fff', fontWeight: '800' }}>✓</Text>
                        </View>
                      </View>
                    )}
                  </View>
                  <Text style={{ fontSize: 9, fontWeight: isSel ? '700' : '500', color: isSel ? C.blueDark : C.muted }}>{a.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity onPress={onClose} activeOpacity={0.75}
              style={{ flex: 1, height: 52, borderRadius: 14, borderWidth: 1.5, borderColor: C.border, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: C.muted }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} disabled={saving || (!selected && !customImage)} activeOpacity={0.85}
              style={{ flex: 2, height: 52, borderRadius: 14, backgroundColor: (selected || customImage) ? C.blue : C.border, alignItems: 'center', justifyContent: 'center' }}>
              {saving
                ? <ActivityIndicator color="#2a2000" size="small" />
                : <Text style={{ fontSize: 15, fontWeight: '800', color: (selected || customImage) ? '#2a2000' : C.muted }}>Save Avatar ✓</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ══════════════════════════════════════════
//  MAIN SCREEN
// ══════════════════════════════════════════
export default function ProfileScreen({ navigation }) {
  const { C }   = useTheme();
  const { user, userData, logout, updateUserData } = useAuth();
  const { sessions, resetSessions, stats } = useSession();

  const [editNameOpen,   setEditNameOpen]   = useState(false);
  const [avatarPickOpen, setAvatarPickOpen] = useState(false);

  const avatarId     = userData?.avatarId  || null;
  const customAvatar = userData?.customAvatar || null;
  const avatarSource = customAvatar ? { uri: customAvatar } : getAvatarSource(avatarId);
  const { rank, next, pct: rankPct } = getRank(hours);

  // Animated gradient
  const gradAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(gradAnim, { toValue: 1, duration: 3000, useNativeDriver: false }),
        Animated.timing(gradAnim, { toValue: 0, duration: 3000, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  const name     = userData?.name     || user?.displayName || 'Student';
  const email    = userData?.email    || user?.email       || '';
  const score    = userData?.score    ?? 0;
  // FIX: read streak from live session metrics, not userData (that field is never updated)
  const streak   = stats?.metrics?.streak ?? userData?.streak ?? 0;
  // Use stats from context — single source of truth shared with Home/Analytics/Report
  const totalMinutes = stats?.totalMinutes ?? userData?.totalMinutes ?? 0;
  const hoursNum     = Math.floor(totalMinutes / 60);
  const minsNum      = totalMinutes % 60;
  // For getRank() — pass total hours as a decimal (same logic as before)
  const hours        = totalMinutes / 60;
  // Display label: "1h 23m" if >= 1h, else "45m"
  const hoursLabel   = totalMinutes < 60
    ? `${totalMinutes}m`
    : minsNum > 0
    ? `${hoursNum}h ${minsNum}m`
    : `${hoursNum}h`;
  const handleSaveName   = async (newName)     => { await updateUserData({ name: newName }); };

  const handleResetData = () => {
  Alert.alert(
    "Reset Data",
    "This will clear all your stats and sessions. Continue?",
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset",
        style: "destructive",
        onPress: async () => {
          try {
            await resetSessions();

            await updateUserData({
              score: 0,
              streak: 0,
              totalMinutes: 0,
              totalSessions: 0,
              dailyGoal: 120,
            });

            Alert.alert("Done", "Your data has been reset.");
          } catch (err) {
            console.log(err);
            Alert.alert("Error", "Failed to reset data.");
          }
        },
      },
    ]
  );
  };

  const handleSaveAvatar = async ({ selected, customImage }) => {
    if(customImage){
      await updateUserData({
      customAvatar: customImage,
      avatarId: null
    });
  }
  else if(selected){
    await updateUserData({
      avatarId: selected,
      customAvatar: null
    });
  }
  };

  const handleLogout = () => Alert.alert(
    'Log Out', `Sign out of ${email || 'your account'}?`,
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: async () => {
        try { await logout(); }
        catch { Alert.alert('Error', 'Failed to log out'); }
      }},
    ]
  );


  const menuSections = [
  {
    title: 'Identity',
    items: [
      { icon: '✏️', bg: C.blueSoft,   label: 'Edit Name',     sub: name,                       onPress: () => setEditNameOpen(true)   },
      { icon: '🎭', bg: C.purpleSoft, label: 'Change Avatar', sub: 'Pick your anime character', onPress: () => setAvatarPickOpen(true) },
    ],
  },
  {
    title: 'App',
    items: [
      { icon: '⚙️', bg: C.yellowSoft, label: 'App Settings',   sub: 'Dark mode, notifications', onPress: () => navigation.navigate('Settings')  },
      { icon: '📅', bg: C.peachSoft,  label: 'Study Schedule', sub: 'Plan your weekly sessions', onPress: () => navigation.navigate('Schedule')  },
    ],
  },
  {
    title: 'Stats',
    items: [
      { icon: '📊', bg: C.mintSoft,   label: 'Analytics', sub: 'View your performance', onPress: () => navigation.navigate('Tabs', { screen: 'Stats'   }) },
      { icon: '📋', bg: C.purpleSoft, label: 'History',   sub: 'See all your sessions', onPress: () => navigation.navigate('Tabs', { screen: 'History' }) },
      { icon: '📈', bg: C.blueSoft,   label: 'Report',    sub: 'Weekly AI report',      onPress: () => navigation.navigate('Tabs', { screen: 'Report'  }) },
    ],
  },
];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Animated gradient hero ── */}
      <LinearGradient
        colors={[C.blue, C.peach, C.mint, C.purple]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={{ paddingTop: 60, paddingBottom: 32, paddingHorizontal: 20, alignItems: 'center' }}
      >
        {/* Decorative blobs */}
        <View style={{ position: 'absolute', top: -20, right: -20, width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.15)' }} />
        <View style={{ position: 'absolute', bottom: -30, left: -10, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.10)' }} />

        {/* Back button */}
        {/* <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ position: 'absolute', top: 60, left: 20, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ fontSize: 20, color: '#fff', fontWeight: '600' }}>‹</Text>
        </TouchableOpacity> */}

        {/* Avatar */}
        <TouchableOpacity onPress={() => setAvatarPickOpen(true)} activeOpacity={0.85} style={{ marginBottom: 14, position: 'relative' }}>
          <View style={{ width: 96, height: 96, borderRadius: 48, overflow: 'hidden', borderWidth: 4, borderColor: 'rgba(255,255,255,0.8)', backgroundColor: 'rgba(255,255,255,0.2)' }}>
            {avatarSource ? (
              <Image source={avatarSource} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            ) : (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 36, fontWeight: '800', color: '#fff' }}>
                  {name.split(' ').map(w => w[0] || '').join('').toUpperCase().slice(0, 2) || '?'}
                </Text>
              </View>
            )}
          </View>
          {/* Edit badge */}
          <View style={{ position: 'absolute', bottom: 2, right: 2, width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.blue }}>
            <Text style={{ fontSize: 11 }}>✏️</Text>
          </View>
        </TouchableOpacity>

        {/* Name */}
        <Text style={{ fontSize: 24, fontWeight: '900', color: '#fff', letterSpacing: -0.5, marginBottom: 4 }}>
          {name}
        </Text>
        <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 10 }}>{email}</Text>

        {/* Rank badge */}
        <View style={{ backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' }}>
          <Text style={{ fontSize: 13, fontWeight: '800', color: '#fff' }}>
            {rank}
          </Text>
        </View>

        {/* Education badge */}
        <View style={{ marginTop: 8, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4 }}>
          <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', fontWeight: '600' }}>
            {userData?.education || 'Student'}
          </Text>
        </View>
      </LinearGradient>

      {/* ── Bento stats grid ── */}
      <View style={{ paddingHorizontal: 16, marginTop: 20, marginBottom: 8 }}>

        {/* Top row — Score and Streak larger */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
          {/* Score — large */}
          <View style={{ flex: 1.4, backgroundColor: C.card, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: C.border, shadowColor: C.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8, elevation: 3 }}>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: C.blueSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 18 }}>⭐</Text>
            </View>
            <CountUp value={score} style={{ fontSize: 38, fontWeight: '900', color: C.blue, letterSpacing: -1 }} />
            <Text style={{ fontSize: 11, fontWeight: '600', color: C.muted, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Score</Text>
          </View>

          {/* Streak — large */}
          <View style={{ flex: 1, backgroundColor: C.card, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: C.border, shadowColor: C.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8, elevation: 3 }}>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: C.peachSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 18 }}>🔥</Text>
            </View>
            <CountUp value={streak} style={{ fontSize: 38, fontWeight: '900', color: C.peach, letterSpacing: -1 }} />
            <Text style={{ fontSize: 11, fontWeight: '600', color: C.muted, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Streak</Text>
          </View>
        </View>

        {/* Bottom row — Hours and Sessions */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
          <View style={{ flex: 1, backgroundColor: C.card, borderRadius: 24, padding: 16, borderWidth: 1, borderColor: C.border, alignItems: 'center', shadowColor: C.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8, elevation: 3 }}>
            <Text style={{ fontSize: 22, marginBottom: 4 }}>⏱</Text>
            <Text style={{ fontSize: totalMinutes < 60 ? 26 : 20, fontWeight: '800', color: C.mint, letterSpacing: -0.5 }}>{hoursLabel}</Text>
            <Text style={{ fontSize: 10, color: C.muted, fontWeight: '600', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>Hours</Text>
          </View>

          <View style={{ flex: 1, backgroundColor: C.card, borderRadius: 24, padding: 16, borderWidth: 1, borderColor: C.border, alignItems: 'center', shadowColor: C.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8, elevation: 3 }}>
            <Text style={{ fontSize: 22, marginBottom: 4 }}>📚</Text>
            <CountUp value={sessions.length} style={{ fontSize: 26, fontWeight: '800', color: C.purple }} />
            <Text style={{ fontSize: 10, color: C.muted, fontWeight: '600', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>Sessions</Text>
          </View>
        </View>

        {/* ── Rank progress bar ── */}
        <View style={{ backgroundColor: C.card, borderRadius: 24, padding: 18, borderWidth: 1, borderColor: C.border, shadowColor: C.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8, elevation: 3 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <View>
              <Text style={{ fontSize: 12, fontWeight: '700', color: C.text }}>Current Rank</Text>
              <Text style={{ fontSize: 16, fontWeight: '800', color: C.blue, marginTop: 2 }}>{rank}</Text>
            </View>
            {next && (
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 11, color: C.muted }}>Next Rank</Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: C.muted }}>{next}</Text>
              </View>
            )}
          </View>
          {/* Gradient progress */}
          <View style={{ height: 8, backgroundColor: C.border, borderRadius: 4, overflow: 'hidden' }}>
            <LinearGradient
              colors={[C.blue, C.mint]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={{ width: `${Math.min(rankPct, 100)}%`, height: '100%', borderRadius: 4 }}
            />
          </View>
          <Text style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>
            {hours}h total · {Math.round(rankPct)}% to {next || 'Max Rank'}
          </Text>
        </View>
      </View>

      {/* ── Menu sections ── */}
      <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
        {menuSections.map((section) => (
          <View key={section.title} style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: C.muted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8, marginLeft: 4 }}>
              {section.title}
            </Text>
            <View style={{ backgroundColor: C.card, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: C.border, shadowColor: C.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 10, elevation: 3 }}>
              {section.items.map((item, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={item.onPress}
                  activeOpacity={0.7}
                  style={[{
                    flexDirection: 'row', alignItems: 'center',
                    padding: 16, gap: 14,
                  }, i < section.items.length - 1 && { borderBottomWidth: 1, borderBottomColor: C.border }]}
                >
                  <View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: item.bg, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 18 }}>{item.icon}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: C.text }}>{item.label}</Text>
                    <Text style={{ fontSize: 11, color: C.muted, marginTop: 1 }} numberOfLines={1}>{item.sub}</Text>
                  </View>
                  <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: C.bgRaised, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 14, color: C.muted }}>›</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </View>

      {/* ── Log out ── */}
      <TouchableOpacity onPress={handleLogout} activeOpacity={0.8}
        style={{ marginHorizontal: 16, marginTop: 4, marginBottom: 16 }}>
        <View style={{ backgroundColor: C.redSoft, borderRadius: 24, padding: 18, alignItems: 'center', borderWidth: 1, borderColor: C.red + '30' }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: C.red }}>Log Out</Text>
        </View>
      </TouchableOpacity>

      {/* ── Footer ── */}
      <View style={{ alignItems: 'center', paddingBottom: 20 }}>
        <Text style={{ fontSize: 10, color: C.subtext, letterSpacing: 1 }}>STUDYBLOOM v1.0.0 · BUILT BY GIRLY 💙</Text>
      </View>

      {/* ── Modals ── */}
      <EditNameModal
        visible={editNameOpen} currentName={name}
        onSave={handleSaveName} onClose={() => setEditNameOpen(false)} C={C}
      />
      <AvatarPickerModal
        visible={avatarPickOpen} current={avatarId}
        onSave={handleSaveAvatar} onClose={() => setAvatarPickOpen(false)} C={C}
      />
    </ScrollView>
  );
}