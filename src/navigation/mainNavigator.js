
import React         from 'react';
import { View, Platform, Image } from 'react-native';
import { createBottomTabNavigator }    from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator }  from '@react-navigation/native-stack';
import Svg, { Path, Circle, Rect }     from 'react-native-svg';

import HomeScreen         from '../screens/main/HomeScreen';
import AnalyticsScreen    from '../screens/analytics/AnalyticsScreen';
import HistoryScreen      from '../screens/analytics/HistoryScreen';
import WeeklyReportScreen from '../screens/analytics/WeeklyReportScreen';
import ProfileScreen      from '../screens/main/ProfileScreen';
import SettingsScreen     from '../screens/analytics/SettingsScreen';
import FocusScreen        from '../screens/study/FocusScreen';
import DistractionScreen  from '../screens/study/DistractionScreen';
import PostSessionLog     from '../screens/study/PostSessionLog';
import ScheduleScreen     from '../screens/study/ScheduleScreen';

import { useTheme } from '../context/ThemeContext';
import { useAuth }  from '../hooks/useAuth';

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// ── SVG Icons ─────────────────────────────────────────────────
function IconHome({ color, filled }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      {filled
        ? <Path d="M3 12L12 3L21 12V21H15V15H9V21H3V12Z" fill={color} />
        : <Path d="M3 12L12 3L21 12V21H15V15H9V21H3V12Z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" fill="none" />
      }
    </Svg>
  );
}

function IconStats({ color, filled }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      {filled ? (
        <>
          <Rect x="3"  y="12" width="4" height="9" rx="1" fill={color} />
          <Rect x="10" y="7"  width="4" height="14" rx="1" fill={color} />
          <Rect x="17" y="3"  width="4" height="18" rx="1" fill={color} />
        </>
      ) : (
        <>
          <Rect x="3"  y="12" width="4" height="9"  rx="1" stroke={color} strokeWidth="1.8" fill="none" />
          <Rect x="10" y="7"  width="4" height="14" rx="1" stroke={color} strokeWidth="1.8" fill="none" />
          <Rect x="17" y="3"  width="4" height="18" rx="1" stroke={color} strokeWidth="1.8" fill="none" />
        </>
      )}
    </Svg>
  );
}

function IconHistory({ color, filled }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      {filled ? (
        <>
          <Path d="M4 4H20C20.55 4 21 4.45 21 5V19C21 19.55 20.55 20 20 20H4C3.45 20 3 19.55 3 19V5C3 4.45 3.45 4 4 4Z" fill={color} />
          <Path d="M7 9H17M7 12H14M7 15H11" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
        </>
      ) : (
        <>
          <Path d="M4 4H20C20.55 4 21 4.45 21 5V19C21 19.55 20.55 20 20 20H4C3.45 20 3 19.55 3 19V5C3 4.45 3.45 4 4 4Z" stroke={color} strokeWidth="1.8" fill="none" />
          <Path d="M7 9H17M7 12H14M7 15H11" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        </>
      )}
    </Svg>
  );
}

function IconReport({ color, filled }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M21 21L3 21L3 3" stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <Path d="M6 16L10 11L14 14L19 7" stroke={color}
        strokeWidth={filled ? 2.5 : 1.8}
        strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {filled && <Circle cx="19" cy="7" r="2.5" fill={color} />}
    </Svg>
  );
}

function IconProfile({ color, filled, photoURL }) {
  if (photoURL) {
    return (
      <View style={{ width: 26, height: 26, borderRadius: 13, overflow: 'hidden', borderWidth: filled ? 2.5 : 1.5, borderColor: color }}>
        <Image source={{ uri: photoURL }} style={{ width: '100%', height: '100%' }} />
      </View>
    );
  }
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      {filled ? (
        <>
          <Circle cx="12" cy="8" r="4" fill={color} />
          <Path d="M4 20C4 16.686 7.582 14 12 14C16.418 14 20 16.686 20 20" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none" />
        </>
      ) : (
        <>
          <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth="1.8" fill="none" />
          <Path d="M4 20C4 16.686 7.582 14 12 14C16.418 14 20 16.686 20 20" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none" />
        </>
      )}
    </Svg>
  );
}

// ── Bottom Tabs ────────────────────────────────────────────────
function BottomTabs() {
  const { C }    = useTheme();
  const auth     = useAuth?.() || {};
  const photoURL = auth.userData?.photoURL || auth.user?.photoURL || null;

  // Shared screen options — label rendered by React Navigation (no wrap)
  const screenOpts = ({ route }) => ({
    headerShown: false,
    tabBarActiveTintColor:   C.blueDark,
    tabBarInactiveTintColor: C.muted,
    tabBarLabelStyle: {
      fontSize:      11,
      fontWeight:    '600',
      letterSpacing: 0.1,
      // KEY FIX: force single line, no wrapping
      numberOfLines: 1,
    },
    tabBarStyle: {
      backgroundColor:  C.card,
      borderTopWidth:   0.5,
      borderTopColor:   C.border,
      height:           Platform.OS === 'ios' ? 84 : 64,
      paddingBottom:    Platform.OS === 'ios' ? 24 : 8,
      paddingTop:       8,
      shadowColor:      '#000',
      shadowOffset:     { width: 0, height: -2 },
      shadowOpacity:    0.06,
      shadowRadius:     8,
      elevation:        12,
    },
    // Each tab item gets equal flex so labels never overflow
    tabBarItemStyle: {
      flex:     1,
      paddingHorizontal: 0,
    },
  });

  return (
    <Tab.Navigator screenOptions={screenOpts}>

      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon:  ({ focused, color }) => <IconHome    color={color} filled={focused} />,
        }}
      />

      <Tab.Screen
        name="Stats"
        component={AnalyticsScreen}
        options={{
          tabBarLabel: 'Stats',
          tabBarIcon:  ({ focused, color }) => <IconStats   color={color} filled={focused} />,
        }}
      />

      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarLabel: 'History',
          tabBarIcon:  ({ focused, color }) => <IconHistory color={color} filled={focused} />,
        }}
      />

      <Tab.Screen
        name="Report"
        component={WeeklyReportScreen}
        options={{
          tabBarLabel: 'Report',
          tabBarIcon:  ({ focused, color }) => <IconReport  color={color} filled={focused} />,
        }}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon:  ({ focused, color }) => (
            <IconProfile color={color} filled={focused} photoURL={photoURL} />
          ),
        }}
      />

    </Tab.Navigator>
  );
}

// ── Root Stack ─────────────────────────────────────────────────
export default function MainNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs"        component={BottomTabs}        />
      <Stack.Screen name="Settings"    component={SettingsScreen}    options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="Schedule"    component={ScheduleScreen}    options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="Focus"       component={FocusScreen}       options={{ animation: 'fade', presentation: 'fullScreenModal' }} />
      <Stack.Screen name="Distraction" component={DistractionScreen} options={{ animation: 'fade', presentation: 'transparentModal' }} />
      <Stack.Screen name="PostSession" component={PostSessionLog}    options={{ animation: 'fade' }} />
    </Stack.Navigator>
  );
}