// src/screens/analytics/WeeklyReportScreen.js
import React from 'react';
import { View, Text, ScrollView, Image } from 'react-native';
import { LinearGradient }  from 'expo-linear-gradient';
import { useTheme }        from '../../context/ThemeContext';
import { sColor, sBg, SUBJECT_ICONS } from '../../themes';
import { Avatar }          from '../../components';
import { useSession }      from '../../context/sessionContext';
import { useAuth }         from '../../hooks/useAuth';

function generateInsight(sessions = []) {
  const completed   = sessions.filter(s => s.completed);
  const completePct = sessions.length > 0 ? Math.round((completed.length / sessions.length) * 100) : 0;
  const totalMins   = sessions.reduce((a, s) => a + (s.duration || 0), 0);
  const distrTotal  = sessions.reduce((a, s) => a + (s.distractions?.length || 0), 0);
  const consistency = completePct >= 75 ? 'consistent' : completePct >= 50 ? 'moderately consistent' : 'inconsistent';
  const distracted  = distrTotal === 0 ? 'highly focused' : distrTotal <= 3 ? 'occasionally distracted' : 'frequently distracted';
  return {
    summary:     `You are ${consistency} this week with ${completePct}% completion.`,
    detail:      `You were ${distracted} across ${sessions.length} sessions, totaling ${Math.floor(totalMins/60)}h ${totalMins%60}m of focus time.`,
    completePct, totalMins,
  };
}

// ── Progress row ───────────────────────────────────────────────
function ProgressRow({ label, value, color, C }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
        <Text style={{ fontSize: 12, color: C.muted, fontWeight: '600' }}>{label}</Text>
        <Text style={{ fontSize: 12, fontWeight: '700', color }}>{value}%</Text>
      </View>
      <View style={{ height: 8, borderRadius: 4, backgroundColor: C.border, overflow: 'hidden' }}>
        <View style={{ width: `${Math.min(value, 100)}%`, height: '100%', borderRadius: 4, backgroundColor: color }} />
      </View>
    </View>
  );
}

// ── Subject row ────────────────────────────────────────────────
function SubjectRow({ subject, sessions, C }) {
  const completed = sessions.filter(s => s.completed).length;
  const totalMins = sessions.reduce((a, s) => a + (s.duration || 0), 0);
  const score     = sessions.length > 0 ? Math.round((completed / sessions.length) * 100) : 0;
  const color     = sColor(subject);
  const icon      = SUBJECT_ICONS?.[subject] || '📌';
  return (
    <View style={{ flexDirection: 'row', gap: 12, marginBottom: 14 }}>
      <View style={{ width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0, backgroundColor: sBg(subject) }}>
        <Text style={{ fontSize: 18 }}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: C.text }}>{subject}</Text>
          <Text style={{ fontSize: 14, fontWeight: '800', color }}>{score}%</Text>
        </View>
        <View style={{ height: 5, borderRadius: 3, backgroundColor: C.border, overflow: 'hidden' }}>
          <View style={{ width: `${score}%`, height: '100%', backgroundColor: color, borderRadius: 3 }} />
        </View>
        <Text style={{ fontSize: 11, color: C.muted, marginTop: 5 }}>
          {Math.floor(totalMins/60)}h {totalMins%60}m · {sessions.length} sessions
        </Text>
      </View>
    </View>
  );
}

// ── Main ───────────────────────────────────────────────────────
export default function WeeklyReportScreen() {
  const { C }               = useTheme();   
  const { sessions }        = useSession();
  const { userData }        = useAuth();
  const avatarId = userData?.avatarId || null;
  const customAvatar = userData?.customAvatar || null;

  const insight    = generateInsight(sessions);
  const score      = userData?.score || userData?.disciplineScore || 72;
  const name       = userData?.name  || 'Student';
  const weekNumber = Math.ceil(new Date().getDate() / 7);
  const monthName  = new Date().toLocaleString('default', { month: 'long' });

  const subjectGroups = {};
  sessions.forEach(s => {
    if (!subjectGroups[s.subject]) subjectGroups[s.subject] = [];
    subjectGroups[s.subject].push(s);
  });

  const completedCount   = sessions.filter(s => s.completed).length;
  const noDistractionPct = sessions.length > 0
    ? Math.round((sessions.filter(s => !s.distractions?.length).length / sessions.length) * 100) : 0;

  // Defined inside component so they use live C
  const RECS = [
    { n: '01', title: 'Shorten Late-Night Sessions', text: 'Reduce sessions to 25 min after 10PM. Focus drops significantly past this.',       color: C.blue,   bg: C.blueSoft   },
    { n: '02', title: 'Fix Overthinking',            text: 'Write 3 tasks before starting. Clears mental clutter and reduces distraction 40%.', color: C.red,    bg: C.redSoft    },
    { n: '03', title: 'Protect High-Energy Days',   text: 'When energy is High, go straight to your hardest subject first.',                   color: C.green,  bg: C.greenSoft  },
    { n: '04', title: 'Rest After Intense Days',    text: 'Schedule lighter sessions after a 2h+ study day. Recovery is as important.',        color: C.yellow, bg: C.yellowSoft },
  ];

  const card = { backgroundColor: C.card, borderRadius: 18, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: C.border, shadowColor: C.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 10, elevation: 2 };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

      {/* Header */}
      <View style={{ marginBottom: 20, paddingTop: 8 }}>
        <Text style={{ fontSize: 12, color: C.muted, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 2 }}>Week {weekNumber} · {monthName}</Text>
        <Text style={{ fontSize: 26, fontWeight: '800', color: C.text }}>Weekly Report</Text>
      </View>

      {/* Main insight card — always dark, intentional design choice */}
      <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 24, padding: 22, marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <View style={{ backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 6, paddingVertical: 4, paddingHorizontal: 10 }}>
            <Text style={{ fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.8)', letterSpacing: 1.5 }}>SYSTEM ANALYSIS</Text>
          </View>
          <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: '600' }}>Week {weekNumber}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          {customAvatar ? (
          <Image source={{ uri: customAvatar }}
            style={{ width: 44, height: 44, borderRadius: 22 }}/>
            ) : avatarId ? (
          <Image
            source={
              avatarId === 'boy1' ? require('../../../assets/boy1.jpg') :
              avatarId === 'boy2' ? require('../../../assets/boy2.jpg') :
              avatarId === 'boy3' ? require('../../../assets/boy3.jpg') :
              avatarId === 'girl1' ? require('../../../assets/girl1.jpg') :
              avatarId === 'girl2' ? require('../../../assets/girl2.jpg') :
              avatarId === 'girl3' ? require('../../../assets/girl3.jpg') :
              avatarId === 'girl4' ? require('../../../assets/girl4.jpg') :
              null
            }
            style={{ width: 44, height: 44, borderRadius: 22}}/>
            ) : (
            <Avatar name={name} size={44} /> )}
          <View>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#fff' }}>{name}</Text>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{userData?.goal || 'Student'}</Text>
          </View>
        </View>
        <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginBottom: 16 }} />
        <Text style={{ fontSize: 15, fontWeight: '700', color: '#fff', lineHeight: 22, marginBottom: 8, fontStyle: 'italic' }}>
          "{insight.summary}"
        </Text>
        <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 18, marginBottom: 20 }}>
          {insight.detail}
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', paddingTop: 16 }}>
          {[
            { val: `${insight.completePct}%`,                                       lbl: 'Completion' },
            { val: `${Math.floor(insight.totalMins/60)}h ${insight.totalMins%60}m`, lbl: 'Focus Time' },
            { val: `${score}/100`,                                                  lbl: 'Score'      },
          ].map(s => (
            <View key={s.lbl} style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 17, fontWeight: '800', color: '#fff' }}>{s.val}</Text>
              <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{s.lbl}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      {/* Performance scores */}
      <View style={card}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 14 }}>Performance Scores</Text>
        <ProgressRow value={score}              color={C.blue}   label="Discipline Score"  C={C} />
        <ProgressRow value={insight.completePct} color={C.green}  label="Completion Rate"  C={C} />
        <ProgressRow value={Math.round((completedCount / Math.max(sessions.length,1)) * 100)} color={C.purple} label="Focus Consistency" C={C} />
        <ProgressRow value={noDistractionPct}   color={C.yellow} label="Zero Distraction"  C={C} />
      </View>

      {/* Subject breakdown */}
      {Object.keys(subjectGroups).length > 0 && (
        <View style={card}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 14 }}>Subject Performance</Text>
          {Object.entries(subjectGroups).map(([subj, sess], i, arr) => (
            <View key={subj}>
              <SubjectRow subject={subj} sessions={sess} C={C} />
              {i < arr.length - 1 && <View style={{ height: 1, backgroundColor: C.border, marginBottom: 14 }} />}
            </View>
          ))}
        </View>
      )}

      {/* Recommendations */}
      <Text style={{ fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 12 }}>Recommendations</Text>
      {RECS.map(r => (
        <View key={r.n} style={{ flexDirection: 'row', borderRadius: 16, padding: 16, marginBottom: 10, gap: 14, backgroundColor: r.bg }}>
          <View style={{ width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0, backgroundColor: r.color }}>
            <Text style={{ fontSize: 10, fontWeight: '800', color: '#fff' }}>{r.n}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '800', color: r.color, marginBottom: 4 }}>{r.title}</Text>
            <Text style={{ fontSize: 13, color: C.muted, lineHeight: 18 }}>{r.text}</Text>
          </View>
        </View>
      ))}

      {/* Target card */}
      <LinearGradient colors={[C.text, '#2d3748']} style={{ borderRadius: 20, padding: 20, marginBottom: 20 }}>
        <Text style={{ fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.4)', letterSpacing: 2, marginBottom: 8 }}>TARGET FOR NEXT WEEK</Text>
        <Text style={{ fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 8 }}>Reach Score 80</Text>
        <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 18, marginBottom: 16 }}>
          You need +{Math.max(0, 80 - score)} more points. Complete 5 sessions without quitting early.
        </Text>
        <View style={{ height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
          <View style={{ width: `${score}%`, height: '100%', backgroundColor: C.blue, borderRadius: 3 }} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: '600' }}>Current: {score}</Text>
          <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: '600' }}>Target: 80</Text>
        </View>
      </LinearGradient>

    </ScrollView>
  );
}