import React, { useRef, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView,
  Pressable, Alert, Linking, Animated,
  Platform, StatusBar, Modal, TouchableOpacity,
} from "react-native";
import { Feather }        from "@expo/vector-icons";
import { useTheme }       from "../../context/ThemeContext";
import { useAuth }        from "../../hooks/useAuth";
import { useSession }     from "../../context/sessionContext";

const EDU_LEVELS = [
  'High School',
  'Year 10-11',
  'Year 12',
  'Bachelors',
  'Masters',
  'PhD',
  'Self-Study',
  'Other',
];

// ── Animated press row ─────────────────────
function Row({ icon, label, sub, onPress, isLast, danger, C }) {
  const opacity = useRef(new Animated.Value(1)).current;
  const pressIn  = () => Animated.timing(opacity, { toValue: 0.5, duration: 80,  useNativeDriver: true }).start();
  const pressOut = () => Animated.timing(opacity, { toValue: 1,   duration: 160, useNativeDriver: true }).start();

  const iconBg    = danger ? 'rgba(248,113,113,0.10)' : 'rgba(201,168,76,0.10)';
  const iconColor = danger ? '#f87171' : '#C9A84C';
  const labelColor = danger ? '#f87171' : C.text;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      disabled={!onPress}
      style={[styles.row, isLast && styles.rowLast, { borderBottomColor: C.border }]}
    >
      <Animated.View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, opacity }}>
        <View style={[styles.iconBubble, { backgroundColor: iconBg }]}>
          <Feather name={icon} size={16} color={iconColor} strokeWidth={1.5} />
        </View>
        <View style={{ flex: 1, marginLeft: 13 }}>
          <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
          {sub ? <Text style={[styles.sub, { color: C.subtext }]}>{sub}</Text> : null}
        </View>
        {onPress ? <Feather name="chevron-right" size={16} color={C.subtext} /> : null}
      </Animated.View>
    </Pressable>
  );
}

function SectionHeader({ label, C }) {
  return <Text style={[styles.section, { color: C.subtext }]}>{label}</Text>;
}

function Card({ children, C }) {
  return (
    <View style={[styles.card, { backgroundColor: C.card, shadowColor: C.shadow }]}>
      {children}
    </View>
  );
}

// ── Education picker modal ─────────────────
function EduPickerModal({ visible, current, onSelect, onClose, C }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
        <View style={{
          backgroundColor: C.card,
          borderTopLeftRadius: 24, borderTopRightRadius: 24,
          padding: 24, paddingBottom: 44,
          borderTopWidth: 1, borderTopColor: C.border,
        }}>
          {/* Handle */}
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginBottom: 20 }} />

          <Text style={{ fontSize: 18, fontWeight: '800', color: C.text, marginBottom: 4, letterSpacing: -0.3 }}>
            Education Level
          </Text>
          <Text style={{ fontSize: 13, color: C.subtext, marginBottom: 20, letterSpacing: -0.2 }}>
            Select your current education level
          </Text>

          {EDU_LEVELS.map(level => {
            const isSelected = current === level;
            return (
              <TouchableOpacity
                key={level}
                onPress={() => { onSelect(level); onClose(); }}
                activeOpacity={0.7}
                style={{
                  flexDirection:    'row',
                  alignItems:       'center',
                  justifyContent:   'space-between',
                  paddingVertical:  14,
                  paddingHorizontal: 16,
                  borderRadius:     14,
                  marginBottom:     8,
                  backgroundColor:  isSelected ? '#C9A84C20' : C.bgRaised,
                  borderWidth:      isSelected ? 1.5 : 0,
                  borderColor:      '#C9A84C',
                }}
              >
                <Text style={{
                  fontSize:      15,
                  fontWeight:    isSelected ? '700' : '500',
                  color:         isSelected ? '#C9A84C' : C.text,
                  letterSpacing: -0.2,
                }}>
                  {level}
                </Text>
                {isSelected && (
                  <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#C9A84C', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 11, color: '#fff', fontWeight: '900' }}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity onPress={onClose} activeOpacity={0.6}
            style={{ height: 44, alignItems: 'center', justifyContent: 'center', marginTop: 4 }}>
            <Text style={{ fontSize: 14, color: C.subtext, textDecorationLine: 'underline', letterSpacing: -0.2 }}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ══════════════════════════════════════════
//  MAIN SCREEN
// ══════════════════════════════════════════
export default function SettingsScreen({ navigation }) {
  const { C, dark }                          = useTheme();
  const { logout, userData, updateUserData } = useAuth(); // Make sure updateUserData is destructured
  const [eduModal, setEduModal]              = useState(false);
  const [saving,   setSaving]                = useState(false);
  const [resetting, setResetting]            = useState(false);
  const { resetSessions } = useSession();

  const currentEdu = userData?.education || 'Bachelors';
  // Use userData?.uid OR userData?.id OR auth user uid. 
  // NOTE: Since we use updateUserData, we don't strictly need userId here, but keeping it for safety if needed elsewhere.
  const userId     = userData?.uid || userData?.id || null; 

  const handleEduSave = async (level) => {
    setSaving(true);
    try {
      await updateUserData?.({ education: level });
    } catch {
      Alert.alert('Error', 'Could not update education level.');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    Alert.alert(
      'Export Data',
      'Your session data export is coming soon. We\'ll notify you when CSV export is available.',
      [{ text: 'Got it', style: 'default' }]
    );
  };

  const handleBugReport = () => {
    Linking.openURL('mailto:support@studybloom.app?subject=Bug%20Report&body=Describe%20the%20issue%20here...');
  };
  const handleResetData = () => {
    Alert.alert(
      'Reset All Data',
      'This will permanently delete all your sessions, progress, and saved data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Are you absolutely sure?',
              'All your data will be erased forever.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Yes, Delete Everything',
                  style: 'destructive',
                  onPress: async () => {
                    setResetting(true);

                    try {
                      await resetSessions();
                      await updateUserData({
                        score: 0,
                        disciplineScore: 0,
                        streak: 0,
                        totalMinutes: 0,
                        totalSessions: 0,
                        dailyGoal: 120,
                        education: null,
                      });

                      Alert.alert('Done', 'All your data has been reset.');
                    } catch (e) {
                      console.error('Reset error:', e);
                      Alert.alert('Error', 'Failed to reset data.');
                    } finally {
                      setResetting(false);
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive',
        onPress: async () => {
          try {
            await logout();
            // App.js onAuthStateChanged handles navigation automatically
          } catch (e) {
            Alert.alert('Error', 'Failed to sign out. Please try again.');
          }
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} backgroundColor={C.bg} />

      <View style={[styles.pageHeader, { backgroundColor: C.bg }]}>
        <Text style={[styles.pageTitle, { color: C.text }]}>Settings</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── ACCOUNT ── */}
        <SectionHeader label="ACCOUNT" C={C} />
        <Card C={C}>
          <Row
            icon="user"
            label="Edit Profile"
            sub="Update name & avatar"
            onPress={() => navigation.navigate('Tabs', { screen: 'Profile' })}
            C={C}
          />
          <Row
            icon="book-open"
            label="Education Level"
            sub={currentEdu}
            onPress={() => setEduModal(true)}
            C={C}
            isLast
          />
        </Card>

        {/* ── PREFERENCES ── */}
        <SectionHeader label="PREFERENCES" C={C} />
        <Card C={C}>
          <Row
            icon="moon"
            label="Theme"
            sub="Light · Dark · System"
            onPress={() => navigation.navigate('Theme')}
            C={C}
          />
          <Row
            icon="globe"
            label="Language"
            sub="English"
            C={C}
            isLast
          />
        </Card>

        {/* ── SECURITY & DATA ── */}
        <SectionHeader label="SECURITY & DATA" C={C} />
        <Card C={C}>
          <Row
            icon="shield"
            label="Privacy Policy"
          onPress={() => navigation.navigate('PrivacyPolicy')}
            C={C}
          />
          <Row
            icon="download"
            label="Export My Data"
            sub="CSV — coming soon"
            onPress={handleExport}
            C={C}
            isLast
          />
        </Card>

        {/* ── SUPPORT ── */}
        <SectionHeader label="SUPPORT" C={C} />
        <Card C={C}>
          <Row
            icon="alert-circle"
            label="Report a Bug"
            onPress={handleBugReport}
            C={C}
          />
          <Row
            icon="info"
            label="About"
            sub="Version 1.0.1 · Built by Team Girlies"
            onPress={() => navigation.navigate('About')}
            C={C}
            isLast
          />
        </Card>

        {/* ── ACCOUNT ACTIONS ── */}
        <SectionHeader label="ACCOUNT ACTIONS" C={C} />
        <Card C={C}>
          <Row
            icon="trash-2"
            label={resetting ? 'Resetting…' : 'Reset All Data'}
            sub="Permanently erase all sessions & progress"
            danger
            onPress={resetting ? null : handleResetData}
            C={C}
          />
          <Row
            icon="log-out"
            label="Sign Out"
            danger
            onPress={handleSignOut}
            C={C}
            isLast
          />
        </Card>

        <Text style={[styles.footer, { color: C.subtext }]}>
          StudyBloom · v1.0.1
        </Text>
      </ScrollView>

      {/* Education picker modal */}
      <EduPickerModal
        visible={eduModal}
        current={currentEdu}
        onSelect={handleEduSave}
        onClose={() => setEduModal(false)}
        C={C}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  pageHeader: {
    paddingTop:        Platform.OS === 'ios' ? 64 : 48,
    paddingHorizontal: 20,
    paddingBottom:     16,
  },
  pageTitle: {
    fontSize:      28,
    fontWeight:    '700',
    letterSpacing: -0.5,
  },
  section: {
    fontSize:         10,
    fontWeight:       '700',
    marginHorizontal: 20,
    marginBottom:     8,
    marginTop:        24,
    letterSpacing:    1.6,
  },
  card: {
    borderRadius:     20,
    marginHorizontal: 16,
    overflow:         'hidden',
    ...Platform.select({
      ios:     { shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 12 },
      android: { elevation: 2 },
    }),
  },
  row: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingVertical:   14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLast:    { borderBottomWidth: 0 },
  iconBubble: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  label:  { fontSize: 15, fontWeight: '500', letterSpacing: -0.1 },
  sub:    { fontSize: 12, marginTop: 2, letterSpacing: -0.1 },
  footer: { fontSize: 12, textAlign: 'center', marginTop: 32, letterSpacing: 0.3 },
});