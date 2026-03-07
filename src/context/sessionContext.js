//  Global state shared across ALL screens.
//  Wraps the whole app so every screen can
//  access sessions and discipline score
//  without passing props everywhere.
//
//  Usage:
//  -- In App.js (wrap everything):
//  import { SessionProvider } from './src/context/SessionContext'
//  <SessionProvider userId={user.uid}>
//    <MainNavigator />
//  </SessionProvider>
//
//  -- In any screen:
//  import { useSession } from '../context/SessionContext'
//  const { sessions, disciplineScore, addSession } = useSession()
// ══════════════════════════════════════════

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSessions } from '../hooks/useSessions';
import { SCORE_RULES } from '../themes';
import { SAMPLE_USER } from '../data/sampleData';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

// Create the context
const SessionContext = createContext(null);

// ── Provider component ────────────────────
// Wrap this around your main navigator in App.js
export function SessionProvider({ children, userId, initialScore = 50 }) {
  const { sessions, loading, addSession, deleteSession } = useSessions(userId);
  const [disciplineScore, setDisciplineScore] = useState(initialScore);

  // ── Update score when sessions change ─
  useEffect(() => {
    if (sessions.length > 0) {
      const score = calculateScore(sessions);
      setDisciplineScore(score);
    }
  }, [sessions]);

  // ── Calculate discipline score ────────
  // Based on last 10 sessions
  const calculateScore = (allSessions) => {
    const recent = allSessions.slice(0, 10);
    let score = 50; // start at 50

    recent.forEach(session => {
      if (session.completed) {
        score += SCORE_RULES.COMPLETE_SESSION;
        if (session.distractions?.length === 0) {
          score += SCORE_RULES.COMPLETE_NO_DISTRACT;
        }
      } else {
        score += SCORE_RULES.QUIT_EARLY;
      }
    });

    // Keep between 0 and 100
    return Math.min(100, Math.max(0, score));
  };

  // ── Add session + update score ────────
  // Called after PostSessionLog saves
  const addSessionAndScore = async (sessionData) => {
    await addSession(sessionData);

    // Calculate score change for this session
    let delta = 0;
    if (sessionData.completed) {
      delta += SCORE_RULES.COMPLETE_SESSION;
      if (sessionData.distractions?.length === 0) {
        delta += SCORE_RULES.COMPLETE_NO_DISTRACT;
      }
    } else {
      delta += SCORE_RULES.QUIT_EARLY;
    }

    // Update score
    const newScore = Math.min(100, Math.max(0, disciplineScore + delta));
    setDisciplineScore(newScore);

    // Save new score to Firestore
    if (userId) {
      try {
        await updateDoc(doc(db, 'users', userId), {
          disciplineScore: newScore,
        });
      } catch (error) {
        console.log('Score update offline:', error.message);
      }
    }
  };

  // ── Stats helpers used by screens ─────
  const getTodaySessions = () => {
    const today = new Date().toISOString().split('T')[0];
    return sessions.filter(s => s.date === today);
  };

  const getTodayMinutes = () => {
    return getTodaySessions().reduce((total, s) => total + s.duration, 0);
  };

  const getStabilityPercent = () => {
    if (sessions.length === 0) return 0;
    const completed = sessions.filter(s => s.completed).length;
    return Math.round((completed / sessions.length) * 100);
  };

  const getTopDistraction = () => {
    const counts = {};
    sessions.forEach(s => {
      (s.distractions || []).forEach(d => {
        counts[d] = (counts[d] || 0) + 1;
      });
    });
    if (Object.keys(counts).length === 0) return 'None';
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  };

  return (
    <SessionContext.Provider value={{
      // Data
      sessions,
      loading,
      disciplineScore,

      // Actions
      addSession:    addSessionAndScore,
      deleteSession,

      // Stats helpers
      getTodaySessions,
      getTodayMinutes,
      getStabilityPercent,
      getTopDistraction,
    }}>
      {children}
    </SessionContext.Provider>
  );
}

// ── Hook to use context in any screen ────
export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used inside <SessionProvider>');
  }
  return context;
}