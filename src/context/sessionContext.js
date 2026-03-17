import React, {
  createContext, useContext, useState,
  useEffect, useCallback, useRef,
} from 'react';
import {
  collection, query, orderBy,
  onSnapshot, deleteDoc, doc, limit,
  getDocs, writeBatch,
} from 'firebase/firestore';
import { db } from '../config/firebase';

const SessionContext = createContext(null);

// ── Threshold for score impact only ──────────────────────────
// History shows EVERY saved session (even 1s).
// Only sessions >= 60s affect the Discipline Score.
export const MIN_SCORE_SECONDS = 60;

export function SessionProvider({ children, userId, initialScore = 50 }) {
  const [sessions,        setSessions]        = useState([]);
  const [disciplineScore, setDisciplineScore] = useState(initialScore);
  const [loading,         setLoading]         = useState(true);
  const unsubRef = useRef(null);

  // ── Real-time Firestore listener ─────────────────────────────
  // Fires the instant any write lands — History/Analytics/Report
  // refresh automatically with zero polling or manual re-fetch.
  useEffect(() => {
    if (!userId) { setLoading(false); return; }

    if (unsubRef.current) unsubRef.current();

    const q = query(
      collection(db, 'users', userId, 'sessions'),
      orderBy('createdAt', 'desc'),
      limit(200)
    );

    unsubRef.current = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(d => {
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
      });
      // Show ALL sessions in context — no minimum threshold here.
      // Screens decide what to display (History = all, Analytics = >= 60s for scores).
      setSessions(docs);
      setLoading(false);
    }, (err) => {
      console.warn('SessionContext snapshot error:', err);
      setLoading(false);
    });

    return () => { if (unsubRef.current) unsubRef.current(); };
  }, [userId]);

  // ── addSession — INSTANT local update before snapshot fires ──
  // No minimum threshold — if it was saved to Firestore, show it.
  const addSession = useCallback((sessionDoc) => {
    setSessions(prev => {
      if (prev.some(s => s.id === sessionDoc.id)) return prev;
      return [sessionDoc, ...prev];
    });
  }, []);

  // ── deleteSession ─────────────────────────────────────────────
  const deleteSession = useCallback(async (sessionId) => {
    if (!userId || !sessionId) return;
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    try {
      await deleteDoc(doc(db, 'users', userId, 'sessions', sessionId));
    } catch (e) {
      console.warn('Delete failed:', e);
    }
  }, [userId]);

  // ── deleteAllSessions — used by Settings > Reset All Data ─────
  const deleteAllSessions = useCallback(async () => {
    setSessions([]);
    if (!userId) return;
    try {
      const sessionsRef = collection(db, 'users', userId, 'sessions');
      const snapshot    = await getDocs(sessionsRef);
      if (snapshot.empty) return;
      for (let i = 0; i < snapshot.docs.length; i += 500) {
        const batch = writeBatch(db);
        snapshot.docs.slice(i, i + 500).forEach(d => batch.delete(d.ref));
        await batch.commit();
      }
    } catch (e) {
      console.warn('deleteAllSessions error:', e);
    }
  }, [userId]);

  // ── Update score ──────────────────────────────────────────────
  const updateScore = useCallback((newScore) => {
    setDisciplineScore(Math.min(100, Math.max(0, newScore)));
  }, []);

  return (
    <SessionContext.Provider value={{
      sessions,
      disciplineScore,
      loading,
      addSession,
      deleteSession,
      deleteAllSessions,
      updateScore,
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