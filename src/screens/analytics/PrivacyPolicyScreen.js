import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Platform,
  StatusBar,
} from "react-native";
import { Feather } from "@expo/vector-icons";

const SECTIONS = [
  {
    title: "1. Information We Collect",
    body: `MirrorMind collects information you provide directly to us, such as when you create an account, log study sessions, or contact us for support.\n\nThis includes: your name and email address, study session data (subject, duration, mood, energy), and optional reflection notes you choose to write.`,
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
    body: `We retain your account data for as long as your account is active. You may request deletion of your account and all associated data at any time by contacting us at support@mirrormind.app.`,
  },
  {
    title: "5. Third-Party Services",
    body: `MirrorMind uses the following third-party services:\n\n• Firebase (Authentication & Database) — Google LLC\n• Expo (App infrastructure) — Expo Technology Inc.\n\nEach service has its own privacy policy governing the use of your information.`,
  },
  {
    title: "6. Children's Privacy",
    body: `MirrorMind is not directed at children under the age of 13. We do not knowingly collect personal information from children under 13. If you believe we have collected such information, please contact us immediately.`,
  },
  {
    title: "7. Changes to This Policy",
    body: `We may update this Privacy Policy from time to time. We will notify you of any significant changes by updating the date at the top of this page and, where appropriate, sending a notification through the app.`,
  },
  {
    title: "8. Contact Us",
    body: `If you have any questions about this Privacy Policy or how we handle your data, please reach out:\n\n📧 support@mirrormind.app`,
  },
];

export default function PrivacyPolicyScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F0" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={12}
        >
          <Feather name="chevron-left" size={22} color="#1a1a1a" />
        </Pressable>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Last updated badge */}
        <View style={styles.dateBadge}>
          <Text style={styles.dateText}>Last updated · January 2025</Text>
        </View>

        <Text style={styles.intro}>
          Your privacy matters. This policy explains what data MirrorMind collects, how we use it, and the choices you have.
        </Text>

        {SECTIONS.map((s, i) => (
          <View key={i} style={styles.section}>
            <Text style={styles.sectionTitle}>{s.title}</Text>
            <Text style={styles.sectionBody}>{s.body}</Text>
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>MirrorMind · v1.0.1</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: "#F5F5F0",
  },
  header: {
    flexDirection:     "row",
    alignItems:        "center",
    justifyContent:    "space-between",
    paddingTop:        Platform.OS === "ios" ? 60 : 44,
    paddingBottom:     14,
    paddingHorizontal: 16,
    backgroundColor:   "#F5F5F0",
  },
  backBtn: {
    width:          36,
    height:         36,
    borderRadius:   12,
    backgroundColor: "#FFFFFF",
    alignItems:     "center",
    justifyContent: "center",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6 },
      android: { elevation: 2 },
    }),
  },
  headerTitle: {
    fontSize:      17,
    fontWeight:    "600",
    color:         "#1a1a1a",
    letterSpacing: -0.3,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom:     60,
  },
  dateBadge: {
    alignSelf:         "flex-start",
    backgroundColor:   "rgba(201,168,76,0.12)",
    borderRadius:      20,
    paddingVertical:   5,
    paddingHorizontal: 12,
    marginBottom:      18,
    marginTop:         4,
  },
  dateText: {
    fontSize:      11,
    fontWeight:    "600",
    color:         "#C9A84C",
    letterSpacing: 0.2,
  },
  intro: {
    fontSize:      15,
    lineHeight:    24,
    color:         "#555",
    marginBottom:  28,
    letterSpacing: -0.1,
  },
  section: {
    backgroundColor: "#FFFFFF",
    borderRadius:    20,
    padding:         20,
    marginBottom:    12,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 10 },
      android: { elevation: 1 },
    }),
  },
  sectionTitle: {
    fontSize:      14,
    fontWeight:    "700",
    color:         "#1a1a1a",
    letterSpacing: -0.2,
    marginBottom:  10,
  },
  sectionBody: {
    fontSize:      14,
    lineHeight:    22,
    color:         "#666",
    letterSpacing: -0.1,
  },
  footer: {
    alignItems:  "center",
    marginTop:   24,
  },
  footerText: {
    fontSize:  12,
    color:     "#C8C8C8",
    letterSpacing: 0.3,
  },
});