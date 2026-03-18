import React, { useState, useEffect, createContext, useContext } from 'react';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';

// ── Hook to manage sessions ──
export function useSessions(userId) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userId) fetchSessions();
    else setSessions([]);
  }, [userId]);

  const fetchSessions = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, 'sessions'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setSessions(data);
    } catch (err) {
      console.log('Fetch error:', err.message);
    }
    setLoading(false);
  };

  const addSession = async (sessionData) => {
    if (!userId) return;

    const newSession = {
      ...sessionData,
      userId,
      date: new Date().toISOString().split('T')[0],
      createdAt: serverTimestamp(),
    };

    try {
      const docRef = await addDoc(collection(db, 'sessions'), newSession);
      setSessions(prev => [{ id: docRef.id, ...newSession }, ...prev]);
    } catch {
      setSessions(prev => [{ id: Date.now().toString(), ...newSession }, ...prev]);
    }
  };

  const deleteSession = async (sessionId) => {
  if (!userId) {
    console.warn('No userId');
    return;
  }

  try {
    await deleteDoc(doc(db, 'users', userId, 'sessions', sessionId));

    setSessions(prev => prev.filter(s => s.id !== sessionId));
  } catch (e) {
    console.error('Delete failed:', e);
  }
  };

  const hours = Math.round(((sessions.reduce((sum, s) => sum + (s.minutes || 0), 0)) / 60) * 10) / 10;

  const resetSessions = async () => {
    if (!userId) return;

    try {
      const q = query(collection(db, 'sessions'), where('userId', '==', userId));
      const snap = await getDocs(q);
      const deletes = snap.docs.map(d => deleteDoc(doc(db, 'sessions', d.id)));
      await Promise.all(deletes);
      setSessions([]);
      console.log('Sessions reset');
    } catch (err) {
      console.log('Reset sessions error:', err);
    }
  };

  return {
    sessions,
    loading,
    hours,
    addSession,
    deleteSession,
    fetchSessions,
    resetSessions,
  };
}

// ── Context & Provider ──
const SessionContext = createContext();

export const SessionProvider = ({ userId, children }) => {
  const sessionHook = useSessions(userId);

  return (
    <SessionContext.Provider value={sessionHook}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => useContext(SessionContext);