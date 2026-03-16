import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  StatusBar,
  Animated,
  Linking,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const GOLD       = "#C9A84C";
const GOLD_LIGHT = "#F5E6B8";
const GOLD_SOFT  = "rgba(201,168,76,0.12)";

const LINKS = [
  { icon: "globe",      label: "Website",      url: "https://studybloom.app"                  },
  { icon: "mail",       label: "Contact Us",   url: "mailto:support@studybloom.app"           },
  { icon: "twitter",    label: "Twitter / X",  url: "https://twitter.com/studybloomapp"       },
  { icon: "instagram",  label: "Instagram",    url: "https://instagram.com/studybloomapp"     },
];

export default function AboutScreen({ navigation }) {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entrance
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 600, delay: 100, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 14, delay: 100, useNativeDriver: true }),
    ]).start();

    // Subtle logo pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.04, duration: 2800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 2800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F0" />

      {/* Back button */}
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={12}
        >
          <Feather name="chevron-left" size={22} color="#1a1a1a" />
        </Pressable>
      </View>

      {/* Hero section */}
      <Animated.View style={[
        styles.hero,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
      ]}>
        {/* Logo mark */}
        <Animated.View style={[styles.logoWrap, { transform: [{ scale: pulseAnim }] }]}>
          <LinearGradient
            colors={["#F5E6B8", "#C9A84C"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoGradient}
          >
            {/* Mirror symbol — stylised M */}
            <Text style={styles.logoGlyph}>M</Text>
          </LinearGradient>

          {/* Outer glow ring */}
          <View style={styles.logoGlow} />
        </Animated.View>

        <Text style={styles.appName}>StudyBloom</Text>
        <Text style={styles.tagline}>Study smarter. Track deeper. Grow further.</Text>

        {/* Version pill */}
        <View style={styles.versionPill}>
          <View style={styles.versionDot} />
          <Text style={styles.versionText}>Version 1.0.1</Text>
        </View>
      </Animated.View>

      {/* Divider */}
      <Animated.View style={[styles.divider, { opacity: fadeAnim }]} />

      {/* Links card */}
      <Animated.View style={[
        styles.linksCard,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
      ]}>
        {LINKS.map((link, i) => (
          <Pressable
            key={i}
            onPress={() => Linking.openURL(link.url)}
            style={[styles.linkRow, i === LINKS.length - 1 && { borderBottomWidth: 0 }]}
          >
            <View style={styles.linkIconBubble}>
              <Feather name={link.icon} size={15} color={GOLD} />
            </View>
            <Text style={styles.linkLabel}>{link.label}</Text>
            <Feather name="arrow-up-right" size={14} color="#C8C8C8" />
          </Pressable>
        ))}
      </Animated.View>

      {/* Footer */}
      <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
        <Text style={styles.footerLine}>Made with care · Cambodia 🇰🇭</Text>
        <Text style={styles.footerLine}>© 2025 studybloom. All rights reserved.</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: "#F5F5F0",
  },
  header: {
    paddingTop:        Platform.OS === "ios" ? 60 : 44,
    paddingHorizontal: 16,
    paddingBottom:     8,
  },
  backBtn: {
    width:           36,
    height:          36,
    borderRadius:    12,
    backgroundColor: "#FFFFFF",
    alignItems:      "center",
    justifyContent:  "center",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6 },
      android: { elevation: 2 },
    }),
  },

  /* ── Hero ── */
  hero: {
    alignItems:   "center",
    paddingTop:   32,
    paddingBottom: 28,
    paddingHorizontal: 24,
  },
  logoWrap: {
    width:          88,
    height:         88,
    marginBottom:   20,
    position:       "relative",
    alignItems:     "center",
    justifyContent: "center",
  },
  logoGradient: {
    width:          88,
    height:         88,
    borderRadius:   26,
    alignItems:     "center",
    justifyContent: "center",
    ...Platform.select({
      ios: { shadowColor: "#C9A84C", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 18 },
      android: { elevation: 8 },
    }),
  },
  logoGlyph: {
    fontSize:      42,
    fontWeight:    "800",
    color:         "#1a0f00",
    letterSpacing: -2,
    fontFamily:    Platform.OS === "ios" ? "Georgia" : "serif",
  },
  logoGlow: {
    position:        "absolute",
    width:           108,
    height:          108,
    borderRadius:    32,
    backgroundColor: "rgba(201,168,76,0.12)",
    zIndex:          -1,
  },
  appName: {
    fontSize:      30,
    fontWeight:    "700",
    color:         "#1a1a1a",
    letterSpacing: -0.8,
    marginBottom:  6,
    fontFamily:    Platform.OS === "ios" ? "System" : "sans-serif",
  },
  tagline: {
    fontSize:      14,
    color:         "#ABABAB",
    letterSpacing: -0.1,
    textAlign:     "center",
    lineHeight:    20,
    marginBottom:  18,
  },
  versionPill: {
    flexDirection:     "row",
    alignItems:        "center",
    gap:               6,
    backgroundColor:   "rgba(201,168,76,0.12)",
    borderRadius:      20,
    paddingVertical:   5,
    paddingHorizontal: 14,
  },
  versionDot: {
    width:           6,
    height:          6,
    borderRadius:    3,
    backgroundColor: GOLD,
  },
  versionText: {
    fontSize:      12,
    fontWeight:    "600",
    color:         GOLD,
    letterSpacing: 0.2,
  },

  /* ── Divider ── */
  divider: {
    height:          StyleSheet.hairlineWidth,
    backgroundColor: "#E8E8E4",
    marginHorizontal: 32,
    marginBottom:    24,
  },

  /* ── Links ── */
  linksCard: {
    backgroundColor:  "#FFFFFF",
    borderRadius:     20,
    marginHorizontal: 16,
    overflow:         "hidden",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 12 },
      android: { elevation: 2 },
    }),
  },
  linkRow: {
    flexDirection:     "row",
    alignItems:        "center",
    paddingVertical:   14,
    paddingHorizontal: 16,
    gap:               12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#F0F0F0",
  },
  linkIconBubble: {
    width:           34,
    height:          34,
    borderRadius:    10,
    backgroundColor: "rgba(201,168,76,0.10)",
    alignItems:      "center",
    justifyContent:  "center",
  },
  linkLabel: {
    flex:          1,
    fontSize:      15,
    fontWeight:    "500",
    color:         "#1a1a1a",
    letterSpacing: -0.1,
  },

  /* ── Footer ── */
  footer: {
    alignItems:   "center",
    paddingTop:   28,
    gap:          4,
  },
  footerLine: {
    fontSize:      12,
    color:         "#C8C8C8",
    letterSpacing: 0.2,
  },
});