import React from 'react';
import { Text, View, TouchableOpacity, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator }   from '@react-navigation/bottom-tabs';
import { useAuth } from '../hooks/useAuth'; 
import C from '../themes';
import { QUIT_REASONS } from '../themes/constants';

// import HomeScreen from '../screens/main/HomeScreen';
// import ProfileScreen from '../screens/main/ProfileScreen';
// import FocusScreen        from '../screens/study/FocusScreen';
// import DistractionScreen  from '../screens/study/DistractionScreen';
// import PostSessionLog     from '../screens/study/PostSessionLog';
// import AnalyticsScreen    from '../screens/analytics/AnalyticsScreen';
// import HistoryScreen      from '../screens/analytics/HistoryScreen';
// import WeeklyReportScreen from '../screens/analytics/WeeklyReportScreen';
// import SettingsScreen     from '../screens/analytics/SettingsScreen';

const Placeholder = ({ name }) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0f' }}>
    <Text style={{ color: '#ffffff' }}>{name} Screen Coming Soon</Text>
  </View>
);

const HomeScreen = () => <Placeholder name="Home" />;
const ProfileScreen = () => <Placeholder name="Profile" />;
const FocusScreen = () => <Placeholder name="Focus" />;
const AnalyticsScreen = () => <Placeholder name="Analytics" />;
const HistoryScreen = () => <Placeholder name="History" />;
const WeeklyReportScreen = () => <Placeholder name="Weekly Report" />;
const SettingsScreen = () => <Placeholder name="Settings" />;
const DistractionScreen = () => <Placeholder name="Distraction" />;
const PostSessionLog = () => <Placeholder name="Post Session" />;

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TAB_ICONS = {
  Home:      '⬡',
  Analytics: '◈',
  History:   '▤',
  Report:    '◎',
  Settings:  '⚙',
};

function BottomTabs({ user }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'rgba(10,10,15,0.97)',
          borderTopColor:  C.border,
          borderTopWidth:  1,
          height:          75,
          paddingBottom:   18,
          paddingTop:      10,
        },
        tabBarActiveTintColor:   C.accent,
        tabBarInactiveTintColor: C.text3,
        tabBarLabelStyle: {
          fontSize:      9,
          letterSpacing: 2,
          textTransform: 'uppercase',
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
      <Tab.Screen name="Analytics"  component={AnalyticsScreen} />
      <Tab.Screen name="History"    component={HistoryScreen} />
      <Tab.Screen name="Report"     component={WeeklyReportScreen} />
      <Tab.Screen name="Settings"   component={SettingsScreen} />
    </Tab.Navigator>
  );
}

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

export default function MainNavigator({ user, onLogout }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs">
        {(props) => <BottomTabs {...props} user={user} onLogout={onLogout} />}
      </Stack.Screen>

      <Stack.Screen name="Profile" options={{ animation: 'slide_from_right' }}>
        {(props) => <ProfileScreen {...props} user={user} onLogout={onLogout} />}
      </Stack.Screen>

      {/* These use the placeholders we defined at the top of the file */}
      <Stack.Screen name="Focus" component={FocusScreen} options={{ animation: 'fade' }} />
      <Stack.Screen name="Distraction" component={DistractionScreen} options={{ presentation: 'transparentModal' }} />
      <Stack.Screen name="QuitReason" component={QuitReasonScreen} options={{ presentation: 'transparentModal' }} />
      <Stack.Screen name="PostSession" component={PostSessionLog} options={{ animation: 'fade' }} />
    </Stack.Navigator>
  );
}

const qs = StyleSheet.create({
  overlay:          { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(10,10,15,0.85)' },
  sheet:            { backgroundColor: C.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 44 },
  title:            { fontSize: 18, fontWeight: '800', color: C.text, marginBottom: 4 },
  sub:              { fontSize: 11, color: C.text3, letterSpacing: 1, marginBottom: 20 },
  option:           { padding: 13, backgroundColor: C.card2, borderWidth: 1, borderColor: C.border, borderRadius: 10, marginBottom: 8 },
  optionActive:     { borderColor: C.accent, backgroundColor: C.accentBg },
  optionText:       { fontSize: 13, color: C.text2 },
  optionTextActive: { color: C.accent, fontWeight: '600' },
  endBtn:           { padding: 14, borderWidth: 1, borderColor: `${C.red}40`, borderRadius: 10, alignItems: 'center', marginTop: 8, marginBottom: 4 },
  endBtnText:       { fontSize: 12, letterSpacing: 2, color: C.red, textTransform: 'uppercase' },
  keepBtn:          { padding: 14, alignItems: 'center' },
  keepBtnText:      { fontSize: 12, letterSpacing: 2, color: C.text3, textTransform: 'uppercase' },
});