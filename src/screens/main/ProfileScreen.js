import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Alert, TextInput, Modal, ActivityIndicator, Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme }    from '../../context/ThemeContext';
import { useAuth }     from '../../hooks/useAuth';
import { useSession }  from '../../context/sessionContext';
import { StatCard }    from '../../components';

// ── Anime avatar options ──────────────────
const AVATARS = [
  { id: 'boy1',  label: 'Boy 1',  gender: 'boy',  uri: require('../../../assets/boy1.jpg')  },
  { id: 'boy2',  label: 'Boy 2',  gender: 'boy',  uri: require('../../../assets/boy2.jpg')  },
  { id: 'boy3',  label: 'Boy 3',  gender: 'boy',  uri: require('../../../assets/boy3.jpg')  },
  { id: 'girl1', label: 'Girl 1', gender: 'girl', uri: require('../../../assets/girl1.jpg') },
  { id: 'girl2', label: 'Girl 2', gender: 'girl', uri: require('../../../assets/girl2.jpg') },
  { id: 'girl3', label: 'Girl 3', gender: 'girl', uri: require('../../../assets/girl3.jpg') },
  { id: 'girl4', label: 'Girl 4', gender: 'girl', uri: require('../../../assets/girl4.jpg') },
];

// ── Avatar display ────────────────────────
function AvatarDisplay({ avatarId, customUri, name, size = 90, C }) {
  const avatar  = AVATARS.find(a => a.id === avatarId);
  const initials = name.split(' ').map(w => w[0] || '').join('').toUpperCase().slice(0, 2) || '?';
  const source = customUri ? { uri: customUri } : avatar ? avatar.uri : null;

  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: C.blue + '20', borderWidth: 3, borderColor: C.blue,
      alignItems: 'center', justifyContent: 'center',
      marginBottom: 12, overflow: 'hidden',
    }}>
      {source ? (
        <Image source={source} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
      ) : (
        <Text style={{ fontSize: size * 0.3, fontWeight: '800', color: C.blue }}>
          {initials}
        </Text>
      )}
    </View>
  );
}

// ── Avatar picker modal ───────────────────
function AvatarPickerModal({ visible, current, onSave, onClose, C }) {
  const [selected, setSelected] = useState(current || null);
  const [customImage, setCustomImage] = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [filter,   setFilter]   = useState('all');

  const filtered = filter === 'all'
    ? AVATARS
    : AVATARS.filter(a => a.gender === filter);

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
          <Text style={{ fontSize: 22, fontWeight: '800', color: C.text, marginBottom: 4 }}>
            Choose Your Avatar
          </Text>
          <Text style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>
            Cute anime characters just for you! 🌸
          </Text>

          {/* Gender filter */}
          <View style={{
            flexDirection: 'row', gap: 8, marginBottom: 20,
            backgroundColor: C.bgRaised, borderRadius: 12,
            padding: 4, borderWidth: 1, borderColor: C.border,
          }}>
            {['all','boy','girl'].map(f => (
              <TouchableOpacity
                key={f}
                onPress={() => setFilter(f)}
                style={{
                  flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center',
                  backgroundColor: filter === f ? C.card : 'transparent',
                  shadowColor: filter === f ? C.shadow : 'transparent',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 1, shadowRadius: 4, elevation: filter === f ? 2 : 0,
                }}
              >
                <Text style={{
                  fontSize: 12, fontWeight: filter === f ? '700' : '500',
                  color: filter === f ? C.text : C.muted,
                }}>{f === 'boy' ? '👦 Boys' : f === 'girl' ? '👧 Girls' : 'All'}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Upload your own image */}
          <TouchableOpacity onPress={handleUploadCustom} activeOpacity={0.8} style={{
            width: 76, alignItems: 'center', marginBottom: 12, alignSelf: 'center',}}>
            <View style={{width: 76, height: 76, borderRadius: 38, backgroundColor: C.bgRaised, borderWidth: customImage ? 3 : 1.5,
                borderColor: customImage ? C.blue : C.border, alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
              }}>
              {customImage ? (
              <Image source={{ uri: customImage }}style={{ width: '100%', height: '100%' }} resizeMode="cover"/>
              ) : (
              <Text style={{ fontSize: 16, color: C.muted }}>+</Text>)}
            </View>
            <Text style={{fontSize: 10, color: customImage ? C.blueDark : C.muted, fontWeight: customImage ? '700' : '500', marginTop: 4,
              textAlign: 'center',}}>Your Photo</Text>
          </TouchableOpacity>

          {/* Avatar grid */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginBottom: 24 }}>
            {filtered.map(a => {
              const isSelected = selected === a.id;
              return (
                <TouchableOpacity
                  key={a.id}
                  onPress={() => {setSelected(a.id); setCustomImage(null);}}
                  activeOpacity={0.8}
                  style={{ width: 76, alignItems: 'center', gap: 6 }}
                >
                  <View style={{
                    width: 72, height: 72, borderRadius: 36,
                    overflow: 'hidden',
                    borderWidth: isSelected ? 3 : 1.5,
                    borderColor: isSelected ? C.blue : C.border,
                    backgroundColor: C.bgRaised,
                  }}>
                    <Image source={a.uri} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    {isSelected && (
                      <View style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: C.blue + '20',
                        alignItems: 'flex-end', justifyContent: 'flex-start',
                        padding: 4,
                      }}>
                        <View style={{
                          width: 18, height: 18, borderRadius: 9,
                          backgroundColor: C.blue, alignItems: 'center', justifyContent: 'center',
                          borderWidth: 2, borderColor: C.card,
                        }}>
                          <Text style={{ fontSize: 9, color: '#fff', fontWeight: '800' }}>✓</Text>
                        </View>
                      </View>
                    )}
                  </View>
                  <Text style={{
                    fontSize: 10, fontWeight: isSelected ? '700' : '500',
                    color: isSelected ? C.blueDark : C.muted,
                    textAlign: 'center',
                  }}>
                    {a.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Buttons */}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity onPress={onClose} activeOpacity={0.75}
              style={{
                flex: 1, height: 52, borderRadius: 14,
                borderWidth: 1.5, borderColor: C.border,
                alignItems: 'center', justifyContent: 'center',
              }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: C.muted }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              disabled={saving || (!selected && !customImage)}
              activeOpacity={0.85}
              style={{
                flex: 2, height: 52, borderRadius: 14,
                backgroundColor: (selected || customImage) ? C.blue : C.border,
                alignItems: 'center', justifyContent: 'center',
              }}>
              {saving
                ? <ActivityIndicator color="#2a2000" size="small" />
                : <Text style={{
                    fontSize: 15, fontWeight: '800',
                    color: (selected || customImage) ? '#2a2000' : C.muted,
                  }}>
                    Save Avatar ✓
                  </Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
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
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center', // center vertically
        alignItems: 'center',     // center horizontally
        paddingHorizontal: 20,
      }}>
        <View style={{
          width: '100%',
          backgroundColor: C.card,
          borderRadius: 20,
          padding: 24,
          borderWidth: 1,
          borderColor: C.border,
        }}>
          <Text style={{ fontSize: 20, fontWeight: '800', color: C.text, marginBottom: 12 }}>Edit Name</Text>
          <Text style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>
            Appears on your profile and sessions.
          </Text>

          <View style={{
            backgroundColor: C.bgRaised,
            borderRadius: 14,
            borderWidth: 1.5,
            borderColor: error ? C.red : C.border,
            paddingHorizontal: 16,
            height: 52,
            justifyContent: 'center',
            marginBottom: 6,
          }}>
            <TextInput
              style={{ fontSize: 16, color: C.text, fontWeight: '500' }}
              value={value}
              onChangeText={v => { setValue(v); setError(''); }}
              placeholder="Your name"
              placeholderTextColor={C.subtext}
              autoFocus
              maxLength={32}
              selectionColor={C.blue}
              returnKeyType="done"
              onSubmitEditing={handleSave}
            />
          </View>
          {error ? <Text style={{ fontSize: 12, color: C.red, marginBottom: 14, marginLeft: 4 }}>{error}</Text> : <View style={{ height: 14 }} />}

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity onPress={onClose} activeOpacity={0.75} style={{
              flex: 1, height: 50, borderRadius: 14,
              borderWidth: 1.5, borderColor: C.border,
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: C.muted }}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleSave} disabled={saving} activeOpacity={0.85} style={{
              flex: 1, height: 50, borderRadius: 14,
              backgroundColor: C.blue,
              alignItems: 'center', justifyContent: 'center',
            }}>
              {saving ? <ActivityIndicator color="#2a2000" size="small" /> : 
                        <Text style={{ fontSize: 15, fontWeight: '800', color: '#2a2000' }}>Save</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── MAIN SCREEN ─────────────────────────
export default function ProfileScreen({ navigation }) {
  const { C }   = useTheme();
  const { user, userData, logout, updateUserData } = useAuth();
  const { sessions } = useSession();

  const [editNameOpen,   setEditNameOpen]   = useState(false);
  const [avatarPickOpen, setAvatarPickOpen] = useState(false);

  const name     = userData?.name     || user?.displayName || 'Student';
  const email    = userData?.email    || user?.email       || '';
  const avatarId = userData?.avatarId || null;
  const customAvatar = userData?.customAvatar || null;
  const score    = userData?.score    ?? 0;
  const streak   = userData?.streak   ?? 0;
  const hours    = Math.round(((userData?.totalMinutes || 0) / 60) * 10) / 10;

  const handleSaveName = async (newName) => {
    await updateUserData({ name: newName });
  };

  const handleSaveAvatar = async ({ selected, customImage }) => {
  if (customImage) {
    await updateUserData({ customAvatar: customImage, avatarId: null });
  } else if (selected) {
    await updateUserData({ avatarId: selected, customAvatar: null });
  }
  };

  const handleLogout = () => Alert.alert(
    'Log Out', `Sign out of ${email || 'your account'}?`,
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out', style: 'destructive',
        onPress: async () => {
          try { await logout(); }
          catch { Alert.alert('Error', 'Failed to log out'); }
        },
      },
    ]
  );

  const card = {
    backgroundColor: C.card, borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: C.border,
    shadowColor: C.shadow, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1, shadowRadius: 10, elevation: 2,
  };

  const rows = [
    { icon: '✏️', bg: C.blueSoft,   label: 'Edit Name',      sub: name,                              onPress: () => setEditNameOpen(true)            },
    { icon: '🎭', bg: C.purpleSoft, label: 'Change Avatar',  sub: 'Pick your anime character',        onPress: () => setAvatarPickOpen(true)          },
    { icon: '⚙️', bg: C.yellowSoft, label: 'App Settings',   sub: 'Dark mode, notifications, goals', onPress: () => navigation.navigate('Settings')  },
    { icon: '📅', bg: C.peachSoft,  label: 'Study Schedule', sub: 'Plan your weekly sessions',        onPress: () => navigation.navigate('Schedule')  },
    { icon: '📊', bg: C.mintSoft,   label: 'Analytics',      sub: 'View your performance',            onPress: () => navigation.navigate('Analytics') },
    { icon: '📋', bg: C.purpleSoft, label: 'History',        sub: 'See all your sessions',            onPress: () => navigation.navigate('History')   },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 60, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: C.bgRaised, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border }}>
          <Text style={{ fontSize: 20, color: C.text }}>‹</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '800', color: C.text }}>Profile</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Profile card */}
      <View style={[card, { marginHorizontal: 20, marginBottom: 16, alignItems: 'center', padding: 24 }]}>
        <TouchableOpacity onPress={() => setAvatarPickOpen(true)} activeOpacity={0.8} style={{ position: 'relative' }}>
          <AvatarDisplay avatarId={avatarId} customUri={customAvatar} name={name} size={96} C={C} />
          <View style={{ position: 'absolute', bottom: 14, right: -2, width: 28, height: 28, borderRadius: 14, backgroundColor: C.blue, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.card }}>
            <Text style={{ fontSize: 12 }}>✏️</Text>
          </View>
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <Text style={{ fontSize: 22, fontWeight: '800', color: C.text }}>{name}</Text>
          <TouchableOpacity onPress={() => setEditNameOpen(true)} activeOpacity={0.7} style={{ backgroundColor: C.blueSoft, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: C.blueDark }}>Edit</Text>
          </TouchableOpacity>
        </View>
        <Text style={{ fontSize: 13, color: C.muted, marginBottom: 12 }}>{email}</Text>
        <View style={{ backgroundColor: C.blueSoft, paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20 }}>
          <Text style={{ color: C.blueDark, fontWeight: '600', fontSize: 12 }}>{userData?.education || 'Student'}</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, marginBottom: 20 }}>
        <StatCard value={score}           label="Score"    color={C.blue}   style={{ width: '50%', padding: 4 }} />
        <StatCard value={streak}          label="Streak"   color={C.peach}  style={{ width: '50%', padding: 4 }} />
        <StatCard value={hours}           label="Hours"    color={C.mint}   style={{ width: '50%', padding: 4 }} />
        <StatCard value={sessions.length} label="Sessions" color={C.purple} style={{ width: '50%', padding: 4 }} />
      </View>

      {/* Account rows */}
      <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 12 }}>Account</Text>
        {rows.map((item, i) => (
          <TouchableOpacity key={i} onPress={item.onPress} activeOpacity={0.8} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 14, padding: 15, marginBottom: 8, borderWidth: 1, borderColor: C.border }}>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: item.bg, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
              <Text style={{ fontSize: 16 }}>{item.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: C.text }}>{item.label}</Text>
              <Text style={{ fontSize: 11, color: C.muted, marginTop: 1 }} numberOfLines={1}>{item.sub}</Text>
            </View>
            <Text style={{ fontSize: 18, color: C.borderBright }}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Log out */}
      <TouchableOpacity onPress={handleLogout} activeOpacity={0.8} style={{ marginHorizontal: 20, backgroundColor: C.redSoft, borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: C.red + '40', marginBottom: 16 }}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: C.red }}>Log Out</Text>
      </TouchableOpacity>

      {/* Footer */}
      <View style={{ alignItems: 'center', paddingBottom: 20 }}>
        <Text style={{ fontSize: 11, color: C.subtext }}>StudyBloom v1.0.0 · Built by Team SB 💙</Text>
      </View>

      {/* Modals */}
      <EditNameModal visible={editNameOpen} currentName={name} onSave={handleSaveName} onClose={() => setEditNameOpen(false)} C={C} />
      <AvatarPickerModal visible={avatarPickOpen} current={avatarId} onSave={handleSaveAvatar} onClose={() => setAvatarPickOpen(false)} C={C} />

    </ScrollView>
  );
}