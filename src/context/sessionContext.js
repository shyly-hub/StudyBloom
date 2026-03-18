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

const SessionContext = createContext(null);

export const MIN_SCORE_SECONDS = 60;

export function SessionProvider({ children, userId, initialScore = 50 }) {
  const [sessions,        setSessions]        = useState([]);
  const [disciplineScore, setDisciplineScore] = useState(initialScore);
  const [loading,         setLoading]         = useState(true);
  const unsubRef = useRef(null);

  useEffect(() => {
    if (!userId) { 
      setSessions([]);
      setLoading(false); 
      return; 
    }

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
      setSessions(docs);
      setLoading(false);
    }, (err) => {
      console.warn('SessionContext snapshot error:', err);
      setLoading(false);
    });

    return () => { if (unsubRef.current) unsubRef.current(); };
  }, [userId]);

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
      console.warn('Delete failed:', e);
    }
  }, [userId]);

  const resetSessions = useCallback(async () => {
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
      console.warn('resetSessions error:', e);
      throw e; 
    }
  }, [userId]);

  const hours = useMemo(() => {
    return Math.round(
      (sessions.reduce((sum, s) => {
        const mins = s.minutes || s.duration || (s.durationSeconds ? s.durationSeconds / 60 : 0);
        return sum + mins;
      }, 0) / 60) * 10
    ) / 10;
  }, [sessions]);

  const updateScore = useCallback((newScore) => {
    setDisciplineScore(Math.min(100, Math.max(0, newScore)));
  }, []);

  const value = {
    sessions: sessions || [],
    loading: loading || false,
    hours: hours || 0,
    disciplineScore: disciplineScore || 0,
    addSession: addSession || (() => {}),
    deleteSession: deleteSession || (async () => {}),
    resetSessions: resetSessions || (async () => {}), 
    updateScore: updateScore || (() => {}),
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  
  if (!ctx) {
    return {
      sessions: [],
      loading: false,
      hours: 0,
      disciplineScore: 0,
      addSession: async () => {},
      deleteSession: async () => {},
      resetSessions: async () => {},
      updateScore: () => {},
    };
  }
  
  return ctx;
}