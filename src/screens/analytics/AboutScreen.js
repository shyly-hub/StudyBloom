import React, { useRef, useEffect } from "react";
import {
  View, Text, Pressable, Platform,
  StatusBar, Animated, Linking,
} from "react-native";
import { Feather }        from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme }       from "../../context/ThemeContext";

const GOLD      = "#C9A84C";
const GOLD_SOFT = "rgba(201,168,76,0.12)";

const LINKS = [
  { icon: "globe",     label: "Website",    url: "https://studybloom.app"              },
  { icon: "mail",      label: "Contact Us", url: "mailto:support@studybloom.app"       },
  { icon: "twitter",   label: "Twitter / X",url: "https://twitter.com/studybloomapp"   },
  { icon: "instagram", label: "Instagram",  url: "https://instagram.com/studybloomapp" },
];

export default function AboutScreen({ navigation }) {
  const { C, dark } = useTheme();

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 600, delay: 100, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 14, delay: 100, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.04, duration: 2800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 2800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle={dark ? "light-content" : "dark-content"} backgroundColor={C.bg} />

      {/* Back button */}
      <View style={{ paddingTop: Platform.OS === "ios" ? 60 : 44, paddingHorizontal: 16, paddingBottom: 8 }}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={12}
          style={{
            width:           36,
            height:          36,
            borderRadius:    12,
            backgroundColor: C.card,
            alignItems:      "center",
            justifyContent:  "center",
            borderWidth:     1,
            borderColor:     C.border,
            ...Platform.select({
              ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6 },
              android: { elevation: 2 },
            }),
          }}
        >
          <Feather name="chevron-left" size={22} color={C.text} />
        </Pressable>
      </View>

      {/* Hero */}
      <Animated.View style={{
        alignItems: "center",
        paddingTop: 32, paddingBottom: 28, paddingHorizontal: 24,
        opacity:    fadeAnim,
        transform:  [{ translateY: slideAnim }],
      }}>
        {/* Logo */}
        <Animated.View style={{ width: 88, height: 88, marginBottom: 20, position: "relative", alignItems: "center", justifyContent: "center", transform: [{ scale: pulseAnim }] }}>
          <LinearGradient
            colors={["#F5E6B8", "#C9A84C"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={{
              width: 88, height: 88, borderRadius: 26,
              alignItems: "center", justifyContent: "center",
              ...Platform.select({
                ios:     { shadowColor: "#C9A84C", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 18 },
                android: { elevation: 8 },
              }),
            }}
          >
            <Text style={{
              fontSize: 42, fontWeight: "800", color: "#1a0f00", letterSpacing: -2,
              fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
            }}>M</Text>
          </LinearGradient>
          {/* Glow ring */}
          <View style={{ position: "absolute", width: 108, height: 108, borderRadius: 32, backgroundColor: "rgba(201,168,76,0.12)", zIndex: -1 }} />
        </Animated.View>

        <Text style={{ fontSize: 30, fontWeight: "700", color: C.text, letterSpacing: -0.8, marginBottom: 6 }}>
          StudyBloom
        </Text>
        <Text style={{ fontSize: 14, color: C.muted, letterSpacing: -0.1, textAlign: "center", lineHeight: 20, marginBottom: 18 }}>
          Study smarter. Track deeper. Grow further.
        </Text>

        {/* Version pill */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: GOLD_SOFT, borderRadius: 20, paddingVertical: 5, paddingHorizontal: 14 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: GOLD }} />
          <Text style={{ fontSize: 12, fontWeight: "600", color: GOLD, letterSpacing: 0.2 }}>Version 1.0.1</Text>
        </View>
      </Animated.View>

      {/* Divider */}
      <Animated.View style={{ height: 1, backgroundColor: C.border, marginHorizontal: 32, marginBottom: 24, opacity: fadeAnim }} />

      {/* Links card */}
      <Animated.View style={{
        backgroundColor:  C.card,
        borderRadius:     20,
        marginHorizontal: 16,
        overflow:         "hidden",
        borderWidth:      1,
        borderColor:      C.border,
        opacity:          fadeAnim,
        transform:        [{ translateY: slideAnim }],
        ...Platform.select({
          ios:     { shadowColor: C.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 12 },
          android: { elevation: 2 },
        }),
      }}>
        {LINKS.map((link, i) => (
          <Pressable
            key={i}
            onPress={() => Linking.openURL(link.url)}
            style={{
              flexDirection:     "row",
              alignItems:        "center",
              paddingVertical:   14,
              paddingHorizontal: 16,
              gap:               12,
              borderBottomWidth: i < LINKS.length - 1 ? 1 : 0,
              borderBottomColor: C.border,
            }}
          >
            <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: GOLD_SOFT, alignItems: "center", justifyContent: "center" }}>
              <Feather name={link.icon} size={15} color={GOLD} />
            </View>
            <Text style={{ flex: 1, fontSize: 15, fontWeight: "500", color: C.text, letterSpacing: -0.1 }}>
              {link.label}
            </Text>
            <Feather name="arrow-up-right" size={14} color={C.muted} />
          </Pressable>
        ))}
      </Animated.View>

      {/* Footer */}
      <Animated.View style={{ alignItems: "center", paddingTop: 28, gap: 4, opacity: fadeAnim }}>
        <Text style={{ fontSize: 12, color: C.muted, letterSpacing: 0.2 }}>Made with care · Cambodia 🇰🇭</Text>
        <Text style={{ fontSize: 12, color: C.muted, letterSpacing: 0.2 }}>© 2025 studybloom. All rights reserved.</Text>
      </Animated.View>
    </View>
  );
}