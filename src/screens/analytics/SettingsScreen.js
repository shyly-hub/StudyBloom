import React, { useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Linking,
  Animated,
  Platform,
  StatusBar,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../hooks/useAuth";

// ── Animated press row ─────────────────────
function Row({ icon, label, sub, onPress, isLast, danger, C }) {
  const opacity = useRef(new Animated.Value(1)).current;
  const pressIn  = () => Animated.timing(opacity, { toValue: 0.5, duration: 80,  useNativeDriver: true }).start();
  const pressOut = () => Animated.timing(opacity, { toValue: 1,   duration: 160, useNativeDriver: true }).start();

  const iconBg     = danger ? "rgba(248,113,113,0.10)" : "rgba(201,168,76,0.10)";
  const iconColor  = danger ? "#f87171" : "#C9A84C";
  const labelColor = danger ? "#f87171" : C.text;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      disabled={!onPress}
      style={[styles.row, isLast && styles.rowLast, { borderBottomColor: C.border }]}
    >
      <Animated.View style={{ flexDirection: "row", alignItems: "center", flex: 1, opacity }}>
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

// ── Main screen ────────────────────────────
export default function SettingsScreen({ navigation }) {
  const { C, dark } = useTheme();
  const { signOut } = useAuth();

  const handleExport = () => {
    Alert.alert(
      "Export Data",
      "Your session data export is coming soon. We'll notify you when CSV export is available.",
      [{ text: "Got it", style: "default" }]
    );
  };

  const handleBugReport = () => {
    Linking.openURL("mailto:support@mirrormind.app?subject=Bug%20Report&body=Describe%20the%20issue%20here...");
  };

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
          } catch (e) {
            Alert.alert("Error", "Failed to sign out. Please try again.");
          }
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle={dark ? "light-content" : "dark-content"} backgroundColor={C.bg} />

      <View style={[styles.pageHeader, { backgroundColor: C.bg }]}>
        <Text style={[styles.pageTitle, { color: C.text }]}>Settings</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        <SectionHeader label="ACCOUNT" C={C} />
        <Card C={C}>
          <Row icon="user"      label="Edit Profile"      sub="Coming soon"      C={C} />
          <Row icon="book-open" label="Bachelor / Degree" sub="Computer Science" C={C} isLast />
        </Card>

        <SectionHeader label="PREFERENCES" C={C} />
        <Card C={C}>
          <Row
            icon="moon" label="Theme" sub="Light · Dark · System"
            onPress={() => navigation.navigate("Theme")} C={C}
          />
          <Row icon="globe" label="Language" sub="English" C={C} isLast />
        </Card>

        <SectionHeader label="SECURITY & DATA" C={C} />
        <Card C={C}>
          <Row
            icon="shield" label="Privacy Policy"
            onPress={() => navigation.navigate("PrivacyPolicy")} C={C}
          />
          <Row
            icon="download" label="Export My Data" sub="CSV — coming soon"
            onPress={handleExport} C={C} isLast
          />
        </Card>

        <SectionHeader label="SUPPORT" C={C} />
        <Card C={C}>
          <Row icon="alert-circle" label="Report a Bug" onPress={handleBugReport} C={C} />
          <Row
            icon="info" label="About Us" sub="Version 1.0.1"
            onPress={() => navigation.navigate("About")} C={C} isLast
          />
        </Card>

        <SectionHeader label="ACCOUNT ACTIONS" C={C} />
        <Card C={C}>
          <Row icon="log-out" label="Sign Out" danger onPress={handleSignOut} C={C} isLast />
        </Card>

        <Text style={[styles.footer, { color: C.subtext }]}>MirrorMind · v1.0.1</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  pageHeader: {
    paddingTop:        Platform.OS === "ios" ? 64 : 48,
    paddingHorizontal: 20,
    paddingBottom:     16,
  },
  pageTitle: {
    fontSize:      28,
    fontWeight:    "700",
    letterSpacing: -0.5,
    fontFamily:    Platform.OS === "ios" ? "System" : "sans-serif",
  },
  section: {
    fontSize:         10,
    fontWeight:       "700",
    marginHorizontal: 20,
    marginBottom:     8,
    marginTop:        24,
    letterSpacing:    1.6,
  },
  card: {
    borderRadius:     20,
    marginHorizontal: 16,
    overflow:         "hidden",
    ...Platform.select({
      ios:     { shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 12 },
      android: { elevation: 2 },
    }),
  },
  row: {
    flexDirection:     "row",
    alignItems:        "center",
    paddingVertical:   14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLast:    { borderBottomWidth: 0 },
  iconBubble: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  label:  { fontSize: 15, fontWeight: "500", letterSpacing: -0.1 },
  sub:    { fontSize: 12, marginTop: 2, letterSpacing: -0.1 },
  footer: { fontSize: 12, textAlign: "center", marginTop: 32, letterSpacing: 0.3 },
});