import { SCORE_RULES } from '../themes/constants';

// ── Duration threshold ────────────────────────────────────────
// Every session that gets saved appears in History — no minimum.
// Only sessions >= 60s count toward Analytics / Discipline Score.
export const MIN_VALID_SECONDS = 60;   // counts toward scores & analytics

/**
 * Returns true if this session counts toward Analytics & Discipline Score.
 * Short sessions (< 60s) still appear in History but don't affect scores.
 */
export function isValidSession(session = {}) {
  const secs = session.durationSeconds ?? ((session.duration || 0) * 60);
  return secs >= MIN_VALID_SECONDS;
}

/**
 * Single source-of-truth filter used by ALL screens.
 * Returns only sessions with durationSeconds >= 60.
 */
export function getValidSessions(sessions = []) {
  return sessions.filter(isValidSession);
}

/**
 * Completion classification with 90%-of-target rule:
 *   - "completed" : session.completed === true OR reached >= 90% of target
 *   - "partial"   : reached 1–89% of target (quit but not zero-effort)
 *   - "quit"      : < 1% of target or no target and completed === false
 *
 * Returns { status: 'completed'|'partial'|'quit', completionPct: number }
 */
export function getCompletionStatus(session = {}) {
  const actualSecs = session.durationSeconds ?? ((session.duration || 0) * 60);
  const targetSecs = session.targetDurationSeconds
    ?? ((session.targetDuration || session.plannedDuration || 0) * 60);

  if (targetSecs > 0) {
    const pct = Math.round((actualSecs / targetSecs) * 100);
    if (pct >= 90 || session.completed) return { status: 'completed', completionPct: Math.min(pct, 100) };
    if (pct >= 1)                        return { status: 'partial',   completionPct: pct };
    return                                      { status: 'quit',      completionPct: 0   };
  }

  return session.completed
    ? { status: 'completed', completionPct: 100 }
    : { status: 'quit',      completionPct: 0   };
}

/** Returns true for completed OR partial sessions (counts toward stability). */
export function isCountedSession(session = {}) {
  const { status } = getCompletionStatus(session);
  return status === 'completed' || status === 'partial';
}

// ── Score delta ────────────────────────────────────────────────
export function calculateScoreDelta(session = {}) {
  // Invalid sessions give 0 delta — no reward, no penalty
  if (!isValidSession(session)) {
    return { delta: 0, reasons: ['Session too short (< 1 min) — not counted'] };
  }

  const {
    completed      = false,
    distractions   = [],
    studiedOnTime  = false,
    plannedToStudy = false,
  } = session;

  let delta   = 0;
  const reasons = [];

  if (completed) {
    delta += SCORE_RULES.COMPLETE_SESSION;
    reasons.push(`+${SCORE_RULES.COMPLETE_SESSION} Completed session`);
    if (distractions.length === 0) {
      delta += SCORE_RULES.COMPLETE_NO_DISTRACT;
      reasons.push(`+${SCORE_RULES.COMPLETE_NO_DISTRACT} Zero distractions`);
    }
  } else {
    delta += SCORE_RULES.QUIT_EARLY;
    reasons.push(`${SCORE_RULES.QUIT_EARLY} Quit early`);
  }

  if (plannedToStudy) {
    if (studiedOnTime) {
      delta += SCORE_RULES.STUDIED_ON_TIME;
      reasons.push(`+${SCORE_RULES.STUDIED_ON_TIME} Studied on schedule`);
    } else {
      delta += SCORE_RULES.MISSED_PLANNED_TIME;
      reasons.push(`${SCORE_RULES.MISSED_PLANNED_TIME} Missed planned time`);
    }
  }

  return { delta, reasons };
}

export function applyScoreDelta(currentScore = 0, delta = 0) {
  return Math.min(100, Math.max(0, currentScore + delta));
}

// ── Metrics — only counts valid sessions ──────────────────────
export function computeMetrics(sessions = []) {
  if (!sessions.length) return defaultMetrics();

  // Split valid vs invalid
  const valid   = sessions.filter(isValidSession);
  const invalid = sessions.filter(s => !isValidSession(s));

  if (!valid.length) return { ...defaultMetrics(), totalSessions: sessions.length, invalidSessions: invalid.length };

  const completed  = valid.filter(s => s.completed);
  const quit       = valid.filter(s => !s.completed);

  // Stability % — completed OR partial (not pure quits)
  // Uses getCompletionStatus so 1m01s of a 5m session still counts as partial
  const countedForStability = valid.filter(s => isCountedSession(s));
  const stabilityPct = Math.round((countedForStability.length / valid.length) * 100);

  // Deep work % — completed with 0 distractions
  const deepWork    = completed.filter(s => !s.distractions?.length);
  const deepWorkPct = Math.round((deepWork.length / valid.length) * 100);

  // Total minutes from valid sessions only
  const totalMinutes = valid.reduce((sum, s) => {
    const secs = s.durationSeconds ?? ((s.duration || 0) * 60);
    return sum + Math.floor(secs / 60);
  }, 0);

  const avgDuration = completed.length > 0
    ? Math.round(completed.reduce((sum, s) => {
        const secs = s.durationSeconds ?? ((s.duration || 0) * 60);
        return sum + Math.floor(secs / 60);
      }, 0) / completed.length)
    : 25;

  const streak = computeStreak(valid);

  // Distraction breakdown — only from valid sessions
  const distractionMap = {};
  valid.forEach(s => {
    (s.distractions || []).forEach(d => {
      const label = typeof d === 'string' ? d : d?.type || 'Unknown';
      distractionMap[label] = (distractionMap[label] || 0) + 1;
    });
  });

  const totalDistractions = Object.values(distractionMap).reduce((a, b) => a + b, 0);
  const distractionBreakdown = Object.entries(distractionMap)
    .map(([label, count]) => ({
      label,
      count,
      pct: totalDistractions > 0 ? Math.round((count / totalDistractions) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const timeBreakdown  = computeTimeBreakdown(valid);
  const recoverySpeed  = computeRecoverySpeed(valid);

  return {
    stabilityPct,
    deepWorkPct,
    totalMinutes,
    avgDuration,
    streak,
    totalSessions:     sessions.length,   // all including invalid
    validSessions:     valid.length,
    invalidSessions:   invalid.length,
    completedSessions: completed.length,
    quitSessions:      quit.length,
    distractionBreakdown,
    timeBreakdown,
    recoverySpeed,
  };
}

function defaultMetrics() {
  return {
    stabilityPct: 0, deepWorkPct: 0, totalMinutes: 0, avgDuration: 25,
    streak: 0, totalSessions: 0, validSessions: 0, invalidSessions: 0,
    completedSessions: 0, quitSessions: 0,
    distractionBreakdown: [], timeBreakdown: {}, recoverySpeed: null,
  };
}

function computeStreak(sessions) {
  if (!sessions.length) return 0;
  const dates = [...new Set(
    sessions.filter(s => s.date).map(s => new Date(s.date).toDateString())
  )].sort((a, b) => new Date(b) - new Date(a));
  if (!dates.length) return 0;
  let streak = 0;
  let cursor = new Date(); cursor.setHours(0, 0, 0, 0);
  for (const dateStr of dates) {
    const d = new Date(dateStr); d.setHours(0, 0, 0, 0);
    if (Math.round((cursor - d) / 86400000) <= 1) { streak++; cursor = d; }
    else break;
  }
  return streak;
}

function computeTimeBreakdown(sessions) {
  const b = { Morning: 0, Afternoon: 0, Night: 0 };
  sessions.forEach(s => {
    if (!s.date) return;
    const h = new Date(s.date).getHours();
    if (h >= 5 && h < 12) b.Morning++;
    else if (h >= 12 && h < 18) b.Afternoon++;
    else b.Night++;
  });
  return b;
}

function computeRecoverySpeed(sessions) {
  if (sessions.length < 3) return null;
  const sorted = sessions.filter(s => s.date).map(s => new Date(s.date)).sort((a, b) => a - b);
  const gaps   = [];
  for (let i = 1; i < sorted.length; i++) {
    const diff = Math.round((sorted[i] - sorted[i-1]) / 86400000);
    if (diff > 1) gaps.push(diff);
  }
  if (!gaps.length) return 0;
  return Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length);
}

export function getAdaptiveDuration(recentSessions = [], currentDuration = 25) {
  const valid = recentSessions.filter(isValidSession).slice(0, 5);
  if (valid.length < 3) return currentDuration;
  const quitCount = valid.filter(s => !s.completed).length;
  const avgDistr  = valid.reduce((sum, s) => sum + (s.distractions?.length || 0), 0) / valid.length;
  let next = currentDuration;
  if (quitCount >= 3) next = Math.max(10, currentDuration - 7);
  else if (quitCount === 0 && avgDistr <= 1) next = Math.min(90, currentDuration + 7);
  return Math.round(next / 5) * 5;
}

export function generateInsights(sessions = [], metrics = {}) {
  const valid = sessions.filter(isValidSession);
  const {
    distractionBreakdown = [], timeBreakdown = {},
    stabilityPct = 0, deepWorkPct = 0, streak = 0, recoverySpeed = null,
  } = metrics;
  const insights = [];

  const timeEntries = Object.entries(timeBreakdown).sort((a, b) => b[1] - a[1]);
  if (timeEntries[0]?.[1] > 0) {
    const [best] = timeEntries[0];
    const map = { Morning: '6–11AM', Afternoon: '12–5PM', Night: '6PM–12AM' };
    insights.push({ title: '⚡ Best Focus Window', text: `You study most in the ${best} (${map[best]}). Schedule hard subjects then.`, color: 'yellow', icon: '⚡' });
  }
  if (distractionBreakdown[0]) {
    const top = distractionBreakdown[0];
    insights.push({ title: '🎯 Biggest Enemy', text: `"${top.label}" causes ${top.pct}% of your distractions. Address this first.`, color: 'red', icon: '🎯' });
  }
  const recentQuits = valid.slice(0, 7).filter(s => !s.completed).length;
  if (recentQuits >= 3 && stabilityPct >= 60) {
    insights.push({ title: '⚠️ Burnout Pattern', text: `${recentQuits} quit sessions this week despite a good score. Reduce duration.`, color: 'orange', icon: '⚠️' });
  }
  if (deepWorkPct >= 60) {
    insights.push({ title: '🏆 Deep Work Mode', text: `${deepWorkPct}% of your sessions are distraction-free. Elite focus.`, color: 'mint', icon: '🏆' });
  } else if (deepWorkPct < 30 && valid.length >= 5) {
    insights.push({ title: '🧘 Focus Quality Low', text: `Only ${deepWorkPct}% distraction-free. Try phone-down mode.`, color: 'orange', icon: '🧘' });
  }
  if (streak >= 7) {
    insights.push({ title: '🔥 7-Day Warrior', text: `${streak}-day streak active. Consistency is your superpower.`, color: 'yellow', icon: '🔥' });
  }
  return insights.slice(0, 4);
}

export function generateWeeklyReport(metrics = {}) {
  const { stabilityPct = 0, deepWorkPct = 0, distractionBreakdown = [], timeBreakdown = {}, totalMinutes = 0, validSessions = 0, invalidSessions = 0 } = metrics;
  const lines = [];
  if (validSessions === 0 && invalidSessions > 0) {
    lines.push(`All ${invalidSessions} session(s) this week were under 1 minute and not counted.`);
    lines.push('Recommendation: Start a session and study for at least 1 minute to build your score.');
    return lines.join(' ');
  }
  if (stabilityPct >= 80) lines.push('Your consistency this week is exceptional.');
  else if (stabilityPct >= 60) lines.push('You maintained solid consistency this week.');
  else if (stabilityPct >= 40) lines.push('Your focus was inconsistent this week.');
  else lines.push('This was a low-output week. That is recoverable.');
  if (deepWorkPct >= 60) lines.push(`Deep work ratio is strong at ${deepWorkPct}%.`);
  else if (deepWorkPct < 30 && validSessions >= 3) lines.push(`Only ${deepWorkPct}% distraction-free. Focus quality needs attention.`);
  const best = Object.entries(timeBreakdown).sort((a, b) => b[1] - a[1])[0]?.[0];
  if (best) lines.push(`You perform best in the ${best.toLowerCase()}.`);
  if (distractionBreakdown[0]) lines.push(`"${distractionBreakdown[0].label}" is your primary focus disruptor at ${distractionBreakdown[0].pct}%.`);
  if (stabilityPct < 50) lines.push('Recommendation: Shorten sessions and reduce daily targets.');
  else if (stabilityPct >= 80 && deepWorkPct >= 60) lines.push('Recommendation: You are ready to extend session duration.');
  else lines.push('Recommendation: Maintain current rhythm.');
  return lines.join(' ');
}

export function getRankFromScore(score = 0) {
  if (score >= 90) return { label: 'S+', title: 'Elite',        color: '#f5c842' };
  if (score >= 80) return { label: 'S',  title: 'Master',       color: '#f5c842' };
  if (score >= 70) return { label: 'A',  title: 'Advanced',     color: '#3bb88a' };
  if (score >= 60) return { label: 'A-', title: 'Proficient',   color: '#3bb88a' };
  if (score >= 50) return { label: 'B',  title: 'Developing',   color: '#f5aa70' };
  if (score >= 40) return { label: 'B-', title: 'Building',     color: '#f5aa70' };
  if (score >= 25) return { label: 'C',  title: 'Emerging',     color: '#a09080' };
  return                   { label: 'D',  title: 'Initializing', color: '#c0b8a8' };
}