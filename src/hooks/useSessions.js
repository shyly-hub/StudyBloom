import { useState, useEffect } from 'react';
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

export function useSessions(userId) {
  const [sessions, setSessions] = useState([]);
  const [loading,  setLoading]  = useState(false);

  useEffect(() => {
    if (userId) {
      fetchSessions();
    } else {
      setSessions([]);
    }
  }, [userId]);

  const fetchSessions = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, 'sessions'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
      );
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setSessions(data);
    } catch (error) {
      console.log('Fetch error:', error.message);
    }
    setLoading(false);
  };

  const addSession = async (sessionData) => {
    if (!userId) {
      console.log('No userId — skipping save');
      return;
    }
    const newSession = {
      ...sessionData,
      userId,
      date:      new Date().toISOString().split('T')[0],
      createdAt: serverTimestamp(),
    };
    try {
      const docRef = await addDoc(collection(db, 'sessions'), newSession);
      setSessions(prev => [{ id: docRef.id, ...newSession }, ...prev]);
    } catch (error) {
      console.log('Saving locally:', error.message);
      setSessions(prev => [{ id: Date.now().toString(), ...newSession }, ...prev]);
    }
  };

  const deleteSession = async (sessionId) => {
    try {
      await deleteDoc(doc(db, 'sessions', sessionId));
    } catch (error) {
      console.log('Delete locally:', error.message);
    }
    setSessions(prev => prev.filter(s => s.id !== sessionId));
  };

  return {
    sessions,
    loading,
    addSession,
    deleteSession,
    fetchSessions,
  };
}