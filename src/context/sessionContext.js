
import React, {
  createContext, useContext, useState,
  useEffect, useCallback, useRef,
} from 'react';
import {
  collection, query, orderBy,
  onSnapshot, deleteDoc, doc, limit,
} from 'firebase/firestore';
import { db } from '../config/firebase';

const SessionContext = createContext(null);

export function SessionProvider({ children, userId, initialScore = 50 }) {
  const [sessions,        setSessions]        = useState([]);
  const [disciplineScore, setDisciplineScore] = useState(initialScore);
  const [loading,         setLoading]         = useState(true);
  const unsubRef = useRef(null);

  // ── Real-time Firestore listener ─────────────────────────────
  useEffect(() => {
    if (!userId) { setLoading(false); return; }

    // Unsubscribe previous listener
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
          // Normalise: ensure durationSeconds exists
          durationSeconds: data.durationSeconds ?? (data.duration ? data.duration * 60 : 0),
          // Normalise date
          date: data.date
            ? (typeof data.date === 'string' ? data.date : data.date?.toDate?.().toISOString?.() || new Date().toISOString())
            : new Date().toISOString(),
        };
      });
      setSessions(docs);
      setLoading(false);
    }, (err) => {
      console.warn('SessionContext snapshot error:', err);
      setLoading(false);
    });

    return () => { if (unsubRef.current) unsubRef.current(); };
  }, [userId]);

  // ── addSession — INSTANT local update ────────────────────────
  // PostSessionLog calls this right after writing to Firestore.
  // The onSnapshot listener will also fire shortly after, but
  // calling this first makes History feel instant.
  const addSession = useCallback((sessionDoc) => {
    setSessions(prev => {
      // Avoid duplicate if onSnapshot fires before this runs
      if (prev.some(s => s.id === sessionDoc.id)) return prev;
      return [sessionDoc, ...prev];
    });
  }, []);

  // ── deleteSession ─────────────────────────────────────────────
  const deleteSession = useCallback(async (sessionId) => {
    if (!userId || !sessionId) return;
    // Optimistic update — remove immediately
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    try {
      await deleteDoc(doc(db, 'users', userId, 'sessions', sessionId));
    } catch (e) {
      // If delete fails, onSnapshot will restore the correct state
      console.warn('Delete failed:', e);
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
      addSession,      // ← NEW: instant local push
      deleteSession,
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