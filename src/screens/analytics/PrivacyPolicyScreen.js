import React from "react";
import {
  View, Text, ScrollView, Pressable,
  Platform, StatusBar,
} from "react-native";
import { Feather }   from "@expo/vector-icons";
import { useTheme }  from "../../context/ThemeContext";

const SECTIONS = [
  {
    title: "1. Information We Collect",
    body: `StudyBloom collects information you provide directly to us, such as when you create an account, log study sessions, or contact us for support.\n\nThis includes: your name and email address, study session data (subject, duration, mood, energy), and optional reflection notes you choose to write.`,
  },
  {
    title: "2. How We Use Your Information",
    body: `We use the information we collect to provide, maintain, and improve MirrorMind. Specifically, we use your data to:\n\n• Calculate your discipline score and performance trends\n• Generate weekly and monthly session reports\n• Personalise your in-app experience\n• Respond to your support requests`,
  },
  {
    title: "3. Data Storage & Security",
    body: `Your data is stored securely using Firebase (Google Cloud). We use industry-standard encryption in transit (TLS) and at rest. We do not sell your personal information to third parties under any circumstances.`,
  },
  {
    title: "4. Data Retention",
    body: `We retain your account data for as long as your account is active. You may request deletion of your account and all associated data at any time by contacting us at support@studybloom.app.`,
  },
  {
    title: "5. Third-Party Services",
    body: `StudyBloom uses the following third-party services:\n\n• Firebase (Authentication & Database) — Google LLC\n• Expo (App infrastructure) — Expo Technology Inc.\n\nEach service has its own privacy policy governing the use of your information.`,
  },
  {
    title: "6. Children's Privacy",
    body: `StudyBloom is not directed at children under the age of 13. We do not knowingly collect personal information from children under 13. If you believe we have collected such information, please contact us immediately.`,
  },
  {
    title: "7. Changes to This Policy",
    body: `We may update this Privacy Policy from time to time. We will notify you of any significant changes by updating the date at the top of this page and, where appropriate, sending a notification through the app.`,
  },
  {
    title: "8. Contact Us",
    body: `If you have any questions about this Privacy Policy or how we handle your data, please reach out:\n\n📧 support@studybloom.app`,
  },
];

export default function PrivacyPolicyScreen({ navigation }) {
  const { C, dark } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle={dark ? "light-content" : "dark-content"} backgroundColor={C.bg} />

      {/* Header */}
      <View style={{
        flexDirection:     "row",
        alignItems:        "center",
        justifyContent:    "space-between",
        paddingTop:        Platform.OS === "ios" ? 60 : 44,
        paddingBottom:     14,
        paddingHorizontal: 16,
        backgroundColor:   C.bg,
      }}>
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
        <Text style={{ fontSize: 17, fontWeight: "600", color: C.text, letterSpacing: -0.3 }}>
          Privacy Policy
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Last updated badge */}
        <View style={{
          alignSelf:         "flex-start",
          backgroundColor:   "rgba(201,168,76,0.14)",
          borderRadius:      20,
          paddingVertical:   5,
          paddingHorizontal: 12,
          marginBottom:      18,
          marginTop:         4,
        }}>
          <Text style={{ fontSize: 11, fontWeight: "600", color: "#C9A84C", letterSpacing: 0.2 }}>
            Last updated · January 2025
          </Text>
        </View>

        <Text style={{ fontSize: 15, lineHeight: 24, color: C.subtext, marginBottom: 28, letterSpacing: -0.1 }}>
          Your privacy matters. This policy explains what data StudyBloom collects, how we use it, and the choices you have.
        </Text>

        {SECTIONS.map((s, i) => (
          <View key={i} style={{
            backgroundColor: C.card,
            borderRadius:    20,
            padding:         20,
            marginBottom:    12,
            borderWidth:     1,
            borderColor:     C.border,
            ...Platform.select({
              ios:     { shadowColor: C.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 10 },
              android: { elevation: 1 },
            }),
          }}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: C.text, letterSpacing: -0.2, marginBottom: 10 }}>
              {s.title}
            </Text>
            <Text style={{ fontSize: 14, lineHeight: 22, color: C.subtext, letterSpacing: -0.1 }}>
              {s.body}
            </Text>
          </View>
        ))}

        <View style={{ alignItems: "center", marginTop: 24 }}>
          <Text style={{ fontSize: 12, color: C.muted, letterSpacing: 0.3 }}>StudyBloom · v1.0.1</Text>
        </View>
      </ScrollView>
    </View>
  );
}