/**
 * sessionContext.js — COMPLETE REWRITE
 *
 * ROOT CAUSES OF DATA DISAPPEARING ON REFRESH — ALL FIXED HERE:
 *
 * ─────────────────────────────────────────────────────────────
 * BUG 1 — TWO CONFLICTING PROVIDERS
 *   src/hooks/useSessions.js has its OWN SessionProvider + useSession.
 *   src/context/sessionContext.js has a DIFFERENT SessionProvider + useSession.
 *   App.js imports from sessionContext.js, but screens importing from
 *   useSessions.js get an empty context — a completely different instance.
 *
 *   FIX: This file is now the ONE source of truth.
 *   ⚠️  DELETE src/hooks/useSessions.js (or stop importing from it).
 *   Every screen must import from: '../../context/sessionContext'
 *
 * ─────────────────────────────────────────────────────────────
 * BUG 2 — WRONG FIRESTORE PATH (the main data loss cause)
 *   useSessions.js wrote to:        collection(db, 'sessions')             ← root
 *   sessionContext.js listened to:  collection(db, 'users', uid, 'sessions') ← subcollection
 *   These are DIFFERENT paths. Sessions written never appeared in the listener.
 *
 *   FIX: Everything now uses collection(db, 'users', userId, 'sessions').
 *   PostSessionLog.js already uses this correct path.
 *
 * ─────────────────────────────────────────────────────────────
 * BUG 3 — getDocs INSTEAD OF onSnapshot
 *   useSessions.js used getDocs (one-time fetch, no real-time updates).
 *   On refresh, there was a window where userId was null and getDocs
 *   returned nothing — sessions state stuck at [].
 *
 *   FIX: onSnapshot fires immediately with cached data even offline,
 *   then syncs with Firestore. Re-subscribes automatically when userId
 *   changes from null → real UID after auth loads.
 *
 * ─────────────────────────────────────────────────────────────
 * BUG 4 — SessionProvider needed userId as a prop
 *   Previously SessionProvider required <SessionProvider userId={...}>.
 *   If App.js didn't pass it correctly, sessions never loaded.
 *
 *   FIX: SessionProvider now reads userId from AuthContext internally.
 *   No prop needed. Just wrap your app once and it works.
 */

import React, {
  createContext, useContext, useState,
  useEffect, useCallback, useRef, useMemo,
} from 'react';
import {
  collection, query, orderBy,
  onSnapshot, deleteDoc, doc, limit,
  getDocs, writeBatch,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { computeMetrics, isValidSession } from '../utils/scoreEngine';
import { useAuth } from '../hooks/useAuth';

const SessionContext = createContext(null);

const getSecs = (s) => s.durationSeconds ?? ((s.duration || 0) * 60);
const getMins = (s) => Math.floor(getSecs(s) / 60);

function normaliseDoc(d) {
  const data = d.data();
  return {
    id: d.id,
    ...data,
    durationSeconds: data.durationSeconds ?? (data.duration ? data.duration * 60 : 0),
    date: data.date
      ? (typeof data.date === 'string'
          ? data.date
          : data.date?.toDate?.().toISOString?.() || new Date().toISOString())
      : new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────────────────────
// SessionProvider — reads userId from AuthContext automatically.
// No userId prop needed. Mount once in App.js inside <AuthProvider>.
// ─────────────────────────────────────────────────────────────
export function SessionProvider({ children }) {
  const { userData } = useAuth();
  const userId = userData?.uid ?? null;

  const [sessions,        setSessions]        = useState([]);
  const [disciplineScore, setDisciplineScore] = useState(0);
  const [loading,         setLoading]         = useState(true);
  const unsubRef = useRef(null);

  // Real-time listener — re-subscribes when userId becomes available
  useEffect(() => {
    if (unsubRef.current) {
      unsubRef.current();
      unsubRef.current = null;
    }

    if (!userId) {
      setSessions([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const q = query(
      collection(db, 'users', userId, 'sessions'),
      orderBy('createdAt', 'desc'),
      limit(200),
    );

    unsubRef.current = onSnapshot(
      q,
      (snap) => {
        setSessions(snap.docs.map(normaliseDoc));
        setLoading(false);
      },
      (err) => {
        console.warn('[SessionContext] onSnapshot error:', err.message);
        setLoading(false);
      },
    );

    return () => {
      if (unsubRef.current) unsubRef.current();
    };
  }, [userId]);

  // Keep disciplineScore in sync with Firestore user doc
  useEffect(() => {
    if (userData?.score != null) {
      setDisciplineScore(userData.score);
    }
  }, [userData?.score]);

  // ── stats — single source of truth for ALL screens ──────────
  const stats = useMemo(() => {
    const validSessions = sessions.filter(isValidSession);
    const shortSessions = sessions.filter(s => !isValidSession(s));

    const totalMinutesAll   = sessions.reduce((a, s) => a + getMins(s), 0);
    const totalMinutesValid = validSessions.reduce((a, s) => a + getMins(s), 0);

    const todayStr     = new Date().toISOString().split('T')[0];
    const todayMinutes = sessions
      .filter(s => (s.date || '').startsWith(todayStr))
      .reduce((a, s) => a + getMins(s), 0);

    const completedValid = validSessions.filter(s => s.completed).length;
    const completionPct  = validSessions.length > 0
      ? Math.round((completedValid / validSessions.length) * 100)
      : 0;

    const metrics = computeMetrics(sessions);

    return {
      totalCount:        sessions.length,
      validCount:        validSessions.length,
      shortCount:        shortSessions.length,
      completedCount:    completedValid,
      totalMinutes:      totalMinutesAll,
      totalMinutesValid,
      todayMinutes,
      completionPct,
      metrics,
    };
  }, [sessions]);

  const addSession = useCallback((sessionDoc) => {
    setSessions(prev => {
      if (prev.some(s => s.id === sessionDoc.id)) return prev;
      return [sessionDoc, ...prev];
    });
  }, []);

  const deleteSession = useCallback(async (sessionId) => {
    if (!userId || !sessionId) return;
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    try {
      await deleteDoc(doc(db, 'users', userId, 'sessions', sessionId));
    } catch (e) {
      console.warn('[SessionContext] deleteSession failed:', e.message);
    }
  }, [userId]);

  const deleteAllSessions = useCallback(async () => {
    setSessions([]);
    if (!userId) return;
    try {
      const ref      = collection(db, 'users', userId, 'sessions');
      const snapshot = await getDocs(ref);
      if (snapshot.empty) return;
      for (let i = 0; i < snapshot.docs.length; i += 500) {
        const batch = writeBatch(db);
        snapshot.docs.slice(i, i + 500).forEach(d => batch.delete(d.ref));
        await batch.commit();
      }
    } catch (e) {
      console.warn('[SessionContext] deleteAllSessions error:', e.message);
    }
  }, [userId]);

  const updateScore = useCallback((newScore) => {
    setDisciplineScore(Math.min(100, Math.max(0, newScore)));
  }, []);

  const resetScore = useCallback(() => setDisciplineScore(0), []);

  return (
    <SessionContext.Provider value={{
      sessions,
      stats,
      disciplineScore,
      loading,
      addSession,
      deleteSession,
      deleteAllSessions,
      resetSessions: deleteAllSessions, // alias for SettingsScreen
      updateScore,
      resetScore,
    }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside <SessionProvider>');
  return ctx;
}