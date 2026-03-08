import React from 'react';
import { Text, View, TouchableOpacity, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator }   from '@react-navigation/bottom-tabs';

import { C } from '../themes/colors';
import { QUIT_REASONS } from '../themes/constants';

import HomeScreen      from '../screens/main/HomeScreen';
import ProfileScreen   from '../screens/main/ProfileScreen';
import AnalyticsScreen from '../screens/analytics/AnalyticsScreen';
import HistoryScreen   from '../screens/analytics/HistoryScreen';
import WeeklyReportScreen from '../screens/analytics/WeeklyReportScreen';
import SettingsScreen     from '../screens/analytics/SettingsScreen';

import FocusScreen        from '../screens/study/FocusScreen';
import DistractionScreen  from '../screens/study/DistractionScreen';
import PostSessionLog     from '../screens/study/PostSessionLog';

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TAB_ICONS = {
  Home:      '🏠',
  Analytics: '📊',
  History:   '📜',
  Report:    '📋',
  Settings:  '⚙️',
};

// ── Bottom Tabs ───────────────────────────
function BottomTabs({ user }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: C.card,
          borderTopColor:  C.border,
          borderTopWidth:  1,
          height:          75,
          paddingBottom:   18,
          paddingTop:      10,
        },
        tabBarActiveTintColor:   C.blue,
        tabBarInactiveTintColor: C.muted,
        tabBarLabelStyle: {
          fontSize:      9,
          letterSpacing: 1,
          textTransform: 'uppercase',
          fontWeight:    '600',
        },
        tabBarIcon: ({ color }) => (
          <Text style={{ fontSize: 18, color }}>
            {TAB_ICONS[route.name] || '○'}
          </Text>
        ),
      })}
    >
      <Tab.Screen name="Home">
        {(props) => <HomeScreen {...props} user={user} />}
      </Tab.Screen>

      <Tab.Screen name="Analytics" component={AnalyticsScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Report"   component={WeeklyReportScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />

    </Tab.Navigator>
  );
}

// ── Quit Reason Modal ─────────────────────
// Shown when user taps Quit during a focus session
function QuitReasonScreen({ navigation, route }) {
  const [selected, setSelected] = React.useState(null);
  const { elapsedMin, subject, distractions } = route?.params || {};

  return (
    <View style={qs.overlay}>
      <View style={qs.sheet}>
        <Text style={qs.title}>Why are you stopping?</Text>
        <Text style={qs.sub}>Helps us detect your patterns</Text>

        {QUIT_REASONS.map(reason => (
          <TouchableOpacity
            key={reason}
            style={[qs.option, selected === reason && qs.optionActive]}
            onPress={() => setSelected(reason)}
          >
            <Text style={[qs.optionText, selected === reason && qs.optionTextActive]}>
              {reason}
            </Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={qs.endBtn}
          onPress={() => navigation.replace('PostSession', {
            completed:    false,
            elapsedMin:   elapsedMin   || 1,
            subject:      subject      || 'Study',
            distractions: distractions || 0,
            quitReason:   selected,
          })}
        >
          <Text style={qs.endBtnText}>End Session</Text>
        </TouchableOpacity>

        <TouchableOpacity style={qs.keepBtn} onPress={() => navigation.goBack()}>
          <Text style={qs.keepBtnText}>Keep Going</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const qs = StyleSheet.create({
  overlay:          { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet:            { backgroundColor: C.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 44 },
  title:            { fontSize: 18, fontWeight: '800', color: C.text, marginBottom: 4 },
  sub:              { fontSize: 11, color: C.muted, letterSpacing: 1, marginBottom: 20 },
  option:           { padding: 13, backgroundColor: C.bgWhite, borderWidth: 1, borderColor: C.border, borderRadius: 10, marginBottom: 8 },
  optionActive:     { borderColor: C.blue, backgroundColor: C.blueSoft },
  optionText:       { fontSize: 13, color: C.muted },
  optionTextActive: { color: C.blue, fontWeight: '600' },
  endBtn:           { padding: 14, borderWidth: 1, borderColor: C.red, borderRadius: 10, alignItems: 'center', marginTop: 8, marginBottom: 4 },
  endBtnText:       { fontSize: 12, letterSpacing: 2, color: C.red, textTransform: 'uppercase' },
  keepBtn:          { padding: 14, alignItems: 'center' },
  keepBtnText:      { fontSize: 12, letterSpacing: 2, color: C.muted, textTransform: 'uppercase' },
});

// ── Main Stack ────────────────────────────
export default function MainNavigator({ user, onLogout }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>

      {/* Tabs — always the base screen */}
      <Stack.Screen name="Tabs">
        {(props) => <BottomTabs {...props} user={user} onLogout={onLogout} />}
      </Stack.Screen>

      {/* Profile — slides in from right */}
      <Stack.Screen
        name="Profile"
        options={{ animation: 'slide_from_right' }}
      >
        {(props) => <ProfileScreen {...props} user={user} onLogout={onLogout} />}
      </Stack.Screen>

      {/* Quit reason modal — uncomment when B Rom adds FocusScreen */}
      <Stack.Screen
        name="QuitReason"
        component={QuitReasonScreen}
        options={{ animation: 'slide_from_bottom', presentation: 'transparentModal' }}
      />
      

      {/* These unlock when B Rom finishes study screens */}
      <Stack.Screen name="Focus"       component={FocusScreen}       options={{ animation: 'fade', presentation: 'fullScreenModal' }} />
      <Stack.Screen name="Distraction" component={DistractionScreen} options={{ animation: 'slide_from_bottom', presentation: 'transparentModal' }} />
      <Stack.Screen name="PostSession" component={PostSessionLog}    options={{ animation: 'fade' }} /> 

    </Stack.Navigator>
  );
}