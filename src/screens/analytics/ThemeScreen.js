import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  StatusBar,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";

const GOLD      = "#C9A84C";
const GOLD_SOFT = "rgba(201,168,76,0.10)";

const THEMES = [
  { key: "light", label: "Light", icon: "sun",  description: "Clean white interface" },
  { key: "dark",  label: "Dark",  icon: "moon", description: "Easy on the eyes at night" },
];

export default function ThemeScreen({ navigation }) {
  const { C, dark, toggleDark } = useTheme();

  const current = dark ? "dark" : "light";

  const handleSelect = (key) => {
    toggleDark(key === "dark");
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle={dark ? "light-content" : "dark-content"} backgroundColor={C.bg} />

      {/* ── Header ── */}
      <View style={[styles.pageHeader, { backgroundColor: C.bg }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={C.text} />
        </Pressable>
        <Text style={[styles.pageTitle, { color: C.text }]}>Theme</Text>
      </View>

      {/* ── Options ── */}
      <View style={[styles.card, { backgroundColor: C.card, shadowColor: C.shadow }]}>
        {THEMES.map((theme, index) => {
          const isSelected = current === theme.key;
          const isLast     = index === THEMES.length - 1;

          return (
            <Pressable
              key={theme.key}
              onPress={() => handleSelect(theme.key)}
              style={[styles.row, isLast && styles.rowLast, { borderBottomColor: C.border }]}
            >
              <View style={[
                styles.iconBubble,
                { backgroundColor: isSelected ? GOLD_SOFT : C.bgAlt },
              ]}>
                <Feather
                  name={theme.icon}
                  size={16}
                  color={isSelected ? GOLD : C.subtext}
                  strokeWidth={1.5}
                />
              </View>

              <View style={{ flex: 1, marginLeft: 13 }}>
                <Text style={[styles.label, { color: isSelected ? GOLD : C.text }]}>
                  {theme.label}
                </Text>
                <Text style={[styles.sub, { color: C.subtext }]}>{theme.description}</Text>
              </View>

              {isSelected
                ? <Feather name="check" size={18} color={GOLD} />
                : <View style={{ width: 18 }} />
              }
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.hint, { color: C.subtext }]}>
        Your preference is saved automatically.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pageHeader: {
    flexDirection:     "row",
    alignItems:        "center",
    paddingTop:        Platform.OS === "ios" ? 64 : 48,
    paddingHorizontal: 16,
    paddingBottom:     16,
  },
  backBtn: {
    padding: 6, marginRight: 8, borderRadius: 10,
  },
  pageTitle: {
    fontSize:      28,
    fontWeight:    "700",
    letterSpacing: -0.5,
    fontFamily:    Platform.OS === "ios" ? "System" : "sans-serif",
  },
  card: {
    borderRadius:     20,
    marginHorizontal: 16,
    marginTop:        8,
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
  hint:   { fontSize: 12, textAlign: "center", marginTop: 16, letterSpacing: 0.2 },
});