//  Usage:
//    const { score, metrics, applySession, adaptiveDuration } = useScore()
// ══════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './useAuth';
import { useSessions } from './useSessions';
import {
  calculateScoreDelta,
  applyScoreDelta,
  computeMetrics,
  getAdaptiveDuration,
  generateInsights,
  generateWeeklyReport,
  getRankFromScore,
  getValidSessions,
  getCompletionStatus,
} from '../utils/scoreEngine';

export function useScore() {
  const auth     = useAuth?.()    || {};
  const sessCtx  = useSessions?.() || {};
  const user     = auth.user     || null;
  const sessions = sessCtx.sessions || [];

  const [score,            setScore]            = useState(0);
  const [metrics,          setMetrics]          = useState(null);
  const [insights,         setInsights]         = useState([]);
  const [weeklyReport,     setWeeklyReport]     = useState('');
  const [adaptiveDuration, setAdaptiveDuration] = useState(25);
  const [rank,             setRank]             = useState(null);
  const [loading,          setLoading]          = useState(true);
  const [error,            setError]            = useState(null);

  // ── Load score from Firestore on mount ─
  useEffect(() => {
    if (!user?.uid) { setLoading(false); return; }

    const load = async () => {
      try {
        const ref  = doc(db, 'users', user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          setScore(data.score ?? data.disciplineScore ?? 0);
        }
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user?.uid]);

  // ── Recompute metrics whenever sessions change ─
  useEffect(() => {
    if (!sessions.length) return;

    const valid = getValidSessions(sessions);
    const m = computeMetrics(sessions);        // computeMetrics filters internally too
    setMetrics(m);
    setInsights(generateInsights(valid, m));
    setWeeklyReport(generateWeeklyReport(m));
    setAdaptiveDuration(getAdaptiveDuration(valid, adaptiveDuration));
  }, [sessions]);

  // ── Update rank whenever score changes ─
  useEffect(() => {
    setRank(getRankFromScore(score));
  }, [score]);

  // ── applySession — call this right after saving a session ─
  /**
   * @param {object} sessionData  — the session object just saved
   * @returns {{ newScore, delta, reasons }}
   */
  const applySession = useCallback(async (sessionData = {}) => {
    if (!user?.uid) return { newScore: score, delta: 0, reasons: [] };

    const { delta, reasons } = calculateScoreDelta(sessionData);
    const newScore = applyScoreDelta(score, delta);

    setScore(newScore);

    // Persist to Firestore
    try {
      const ref = doc(db, 'users', user.uid);
      await updateDoc(ref, {
        score:            newScore,
        disciplineScore:  newScore,
        lastScoreUpdate:  serverTimestamp(),
      });
    } catch (e) {
      setError(e.message);
    }

    return { newScore, delta, reasons };
  }, [user?.uid, score]);

  // ── manualSetScore — admin / test use ─
  const manualSetScore = useCallback(async (newScore) => {
    if (!user?.uid) return;
    const clamped = Math.min(100, Math.max(0, newScore));
    setScore(clamped);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        score: clamped,
        disciplineScore: clamped,
        lastScoreUpdate: serverTimestamp(),
      });
    } catch (e) {
      setError(e.message);
    }
  }, [user?.uid]);

  return {
    score,
    rank,
    metrics,
    insights,
    weeklyReport,
    adaptiveDuration,
    loading,
    error,
    applySession,
    manualSetScore,
    // Utilities — same source of truth as all screens
    getValidSessions,
    getCompletionStatus,
  };
}