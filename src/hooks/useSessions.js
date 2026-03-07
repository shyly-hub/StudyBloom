
//  Usage:
//  import { useSessions } from '../hooks/useSessions'
//  const { sessions, loading, addSession, deleteSession } = useSessions(userId)
// ══════════════════════════════════════════

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
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { SAMPLE_SESSIONS } from '../data/sampleData';

export function useSessions(userId) {
  const [sessions, setSessions] = useState(SAMPLE_SESSIONS); // start with sample data
  const [loading,  setLoading]  = useState(false);

  // ── Load sessions when user logs in ───
  useEffect(() => {
    if (userId) {
      fetchSessions();
    }
  }, [userId]);

  // ── Fetch sessions from Firestore ─────
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
      // Firebase not set up yet — keep using sample data
      console.log('Using sample sessions:', error.message);
    }

    setLoading(false);
  };

  // ── Add new session ───────────────────
  // Called from PostSessionLog after focus timer finishes
  // sessionData = { subject, duration, mood, energy, difficulty, distractions, completed, notes }
  const addSession = async (sessionData) => {
    const newSession = {
      ...sessionData,
      userId,
      date:      new Date().toISOString().split('T')[0], // "2026-03-07"
      createdAt: new Date(),
    };

    try {
      // Save to Firestore
      const docRef = await addDoc(collection(db, 'sessions'), newSession);
      // Add to local state immediately (no need to refetch)
      setSessions(prev => [{ id: docRef.id, ...newSession }, ...prev]);
    } catch (error) {
      // Offline or Firebase not ready — save to local state only
      console.log('Saving locally:', error.message);
      setSessions(prev => [{ id: Date.now().toString(), ...newSession }, ...prev]);
    }
  };

  // ── Delete a session ──────────────────
  // Called from HistoryScreen
  const deleteSession = async (sessionId) => {
    try {
      await deleteDoc(doc(db, 'sessions', sessionId));
    } catch (error) {
      console.log('Delete locally:', error.message);
    }
    // Remove from local state
    setSessions(prev => prev.filter(s => s.id !== sessionId));
  };

  return {
    sessions,       // array of all sessions
    loading,        // true while fetching
    addSession,     // addSession({ subject, duration, mood... })
    deleteSession,  // deleteSession(sessionId)
    fetchSessions,  // manual refresh
  };
}