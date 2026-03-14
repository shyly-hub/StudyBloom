
//  Usage:
//    import { calculateScoreDelta, getAdaptiveDuration, generateInsights } from '../utils/scoreEngine'
// ══════════════════════════════════════════════════════════════════

import { SCORE_RULES } from '../themes/constants';

// ─────────────────────────────────────────
//  1. SCORE DELTA — after a single session
// ─────────────────────────────────────────
/**
 * Returns the score change for one session.
 *
 * @param {object} session
 *   completed      {boolean}  — did user finish the timer?
 *   distractions   {Array}    — list of distraction events logged
 *   studiedOnTime  {boolean}  — did session start in planned window?
 *   plannedToStudy {boolean}  — was this a scheduled session?
 *
 * @returns {{ delta: number, reasons: string[] }}
 */
export function calculateScoreDelta(session = {}) {
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

// ─────────────────────────────────────────
//  2. APPLY DELTA — clamp to 0–100
// ─────────────────────────────────────────
/**
 * @param {number} currentScore  0–100
 * @param {number} delta         can be negative
 * @returns {number}             clamped 0–100
 */
export function applyScoreDelta(currentScore = 0, delta = 0) {
  return Math.min(100, Math.max(0, currentScore + delta));
}

// ─────────────────────────────────────────
//  3. DERIVED METRICS from session array
// ─────────────────────────────────────────
/**
 * @param {Array} sessions  — array of session objects from Firestore
 * @returns {object}        — all computed metrics
 */
export function computeMetrics(sessions = []) {
  if (!sessions.length) return defaultMetrics();

  const completed    = sessions.filter(s => s.completed);
  const quit         = sessions.filter(s => !s.completed);
  const totalSessions = sessions.length;

  // Focus Stability % — completion rate
  const stabilityPct = Math.round((completed.length / totalSessions) * 100);

  // Deep Work Ratio % — sessions with 0 distractions
  const deepWork = sessions.filter(s => s.completed && (!s.distractions || s.distractions.length === 0));
  const deepWorkPct = Math.round((deepWork.length / totalSessions) * 100);

  // Total study minutes
  const totalMinutes = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);

  // Average session duration (completed only)
  const avgDuration = completed.length > 0
    ? Math.round(completed.reduce((sum, s) => sum + (s.duration || 0), 0) / completed.length)
    : 25;

  // Current streak — consecutive days with at least 1 session
  const streak = computeStreak(sessions);

  // Distraction breakdown
  const distractionMap = {};
  sessions.forEach(s => {
    (s.distractions || []).forEach(d => {
      distractionMap[d] = (distractionMap[d] || 0) + 1;
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

  // Best study time (morning/afternoon/night breakdown)
  const timeBreakdown = computeTimeBreakdown(sessions);

  // Recovery speed — avg days between gaps (lower = faster recovery)
  const recoverySpeed = computeRecoverySpeed(sessions);

  return {
    stabilityPct,
    deepWorkPct,
    totalMinutes,
    avgDuration,
    streak,
    totalSessions,
    completedSessions: completed.length,
    quitSessions: quit.length,
    distractionBreakdown,
    timeBreakdown,
    recoverySpeed,
  };
}

function defaultMetrics() {
  return {
    stabilityPct: 0, deepWorkPct: 0, totalMinutes: 0, avgDuration: 25,
    streak: 0, totalSessions: 0, completedSessions: 0, quitSessions: 0,
    distractionBreakdown: [], timeBreakdown: {}, recoverySpeed: null,
  };
}

// ─────────────────────────────────────────
//  4. STREAK CALCULATOR
// ─────────────────────────────────────────
function computeStreak(sessions) {
  if (!sessions.length) return 0;

  // Get unique study dates sorted descending
  const dates = [...new Set(
    sessions
      .filter(s => s.date)
      .map(s => new Date(s.date).toDateString())
  )].sort((a, b) => new Date(b) - new Date(a));

  if (!dates.length) return 0;

  let streak = 0;
  let cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  for (const dateStr of dates) {
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    const diffDays = Math.round((cursor - d) / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) {
      streak++;
      cursor = d;
    } else {
      break;
    }
  }

  return streak;
}

// ─────────────────────────────────────────
//  5. TIME OF DAY BREAKDOWN
// ─────────────────────────────────────────
function computeTimeBreakdown(sessions) {
  const breakdown = { Morning: 0, Afternoon: 0, Night: 0 };

  sessions.forEach(s => {
    if (!s.date) return;
    const hour = new Date(s.date).getHours();
    if (hour >= 5  && hour < 12) breakdown.Morning++;
    else if (hour >= 12 && hour < 18) breakdown.Afternoon++;
    else breakdown.Night++;
  });

  return breakdown;
}

// ─────────────────────────────────────────
//  6. RECOVERY SPEED
// ─────────────────────────────────────────
function computeRecoverySpeed(sessions) {
  if (sessions.length < 3) return null;

  const sortedDates = sessions
    .filter(s => s.date)
    .map(s => new Date(s.date))
    .sort((a, b) => a - b);

  const gaps = [];
  for (let i = 1; i < sortedDates.length; i++) {
    const diff = Math.round((sortedDates[i] - sortedDates[i - 1]) / (1000 * 60 * 60 * 24));
    if (diff > 1) gaps.push(diff);
  }

  if (!gaps.length) return 0;
  return Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length);
}

// ─────────────────────────────────────────
//  7. ADAPTIVE DURATION
// ─────────────────────────────────────────
/**
 * Recommends next session duration based on recent performance.
 * Logic:
 *   - Last 5 sessions all completed with low distractions → increase by 7
 *   - Last 5 sessions had 3+ quits                        → decrease by 7
 *   - Otherwise                                            → keep current
 *
 * Clamped between 10 and 90 minutes.
 *
 * @param {Array}  recentSessions  last N sessions (already sorted by date desc)
 * @param {number} currentDuration current preferred duration
 * @returns {number}               recommended duration in minutes
 */
export function getAdaptiveDuration(recentSessions = [], currentDuration = 25) {
  const last5 = recentSessions.slice(0, 5);
  if (last5.length < 3) return currentDuration;

  const quitCount = last5.filter(s => !s.completed).length;
  const avgDistr  = last5.reduce((sum, s) => sum + (s.distractions?.length || 0), 0) / last5.length;

  let next = currentDuration;

  if (quitCount >= 3) {
    // Struggling — ease off
    next = Math.max(10, currentDuration - 7);
  } else if (quitCount === 0 && avgDistr <= 1) {
    // Crushing it — push up
    next = Math.min(90, currentDuration + 7);
  }

  // Round to nearest 5
  return Math.round(next / 5) * 5;
}

// ─────────────────────────────────────────
//  8. PSYCHOLOGICAL INSIGHTS
// ─────────────────────────────────────────
/**
 * Generates up to 4 short insight strings based on session patterns.
 * Rule-based — no AI required.
 *
 * @param {Array}  sessions  all sessions
 * @param {object} metrics   from computeMetrics()
 * @returns {Array<{ title, text, color, icon }>}
 */
export function generateInsights(sessions = [], metrics = {}) {
  const insights = [];
  const {
    distractionBreakdown = [],
    timeBreakdown        = {},
    stabilityPct         = 0,
    deepWorkPct          = 0,
    streak               = 0,
    recoverySpeed        = null,
  } = metrics;

  // ── Insight 1: Best focus time ────────
  const timeEntries = Object.entries(timeBreakdown).sort((a, b) => b[1] - a[1]);
  if (timeEntries.length && timeEntries[0][1] > 0) {
    const [bestTime] = timeEntries[0];
    const timeMap = { Morning: '6–11AM', Afternoon: '12–5PM', Night: '6PM–12AM' };
    insights.push({
      title: '⚡ Best Focus Window',
      text:  `You study most in the ${bestTime} (${timeMap[bestTime]}). Schedule hard subjects then.`,
      color: 'yellow',
      icon:  '⚡',
    });
  }

  // ── Insight 2: Top distraction ────────
  if (distractionBreakdown.length) {
    const top = distractionBreakdown[0];
    insights.push({
      title: '🎯 Biggest Enemy',
      text:  `"${top.label}" causes ${top.pct}% of your distractions. Address this first.`,
      color: 'red',
      icon:  '🎯',
    });
  }

  // ── Insight 3: Burnout warning ────────
  const last7 = sessions.slice(0, 7);
  const recentQuits = last7.filter(s => !s.completed).length;
  if (recentQuits >= 3 && stabilityPct >= 60) {
    insights.push({
      title: '⚠️ Burnout Pattern',
      text:  `You have ${recentQuits} quit sessions this week despite a good overall score. Reduce duration.`,
      color: 'orange',
      icon:  '⚠️',
    });
  }

  // ── Insight 4: Deep work ──────────────
  if (deepWorkPct >= 60) {
    insights.push({
      title: '🏆 Deep Work Mode',
      text:  `${deepWorkPct}% of your sessions have zero distractions. You're building elite focus.`,
      color: 'mint',
      icon:  '🏆',
    });
  } else if (deepWorkPct < 30 && sessions.length >= 5) {
    insights.push({
      title: '🧘 Focus Quality Low',
      text:  `Only ${deepWorkPct}% of sessions are distraction-free. Try phone-down mode.`,
      color: 'orange',
      icon:  '🧘',
    });
  }

  // ── Insight 5: Recovery ───────────────
  if (recoverySpeed !== null && recoverySpeed > 3) {
    insights.push({
      title: '🔄 Slow Recovery',
      text:  `You take ~${recoverySpeed} days to restart after breaks. Try a 5-min micro session to re-enter.`,
      color: 'blue',
      icon:  '🔄',
    });
  }

  // ── Insight 6: Streak ─────────────────
  if (streak >= 7) {
    insights.push({
      title: '🔥 7-Day Warrior',
      text:  `${streak}-day streak active. Consistency is your superpower right now.`,
      color: 'yellow',
      icon:  '🔥',
    });
  }

  return insights.slice(0, 4);
}

// ─────────────────────────────────────────
//  9. WEEKLY REPORT GENERATOR
// ─────────────────────────────────────────
/**
 * Generates the system-style weekly report string.
 * Called once per week on WeeklyReportScreen.
 *
 * @param {object} metrics  from computeMetrics()
 * @returns {string}        e.g. "You are consistent but mentally unstable during late-night sessions."
 */
export function generateWeeklyReport(metrics = {}) {
  const {
    stabilityPct   = 0,
    deepWorkPct    = 0,
    streak         = 0,
    distractionBreakdown = [],
    timeBreakdown  = {},
    recoverySpeed  = null,
    totalSessions  = 0,
  } = metrics;

  const lines = [];

  // Overall assessment
  if (stabilityPct >= 80) {
    lines.push('Your consistency this week is exceptional.');
  } else if (stabilityPct >= 60) {
    lines.push('You maintained solid consistency this week.');
  } else if (stabilityPct >= 40) {
    lines.push('Your focus was inconsistent this week.');
  } else {
    lines.push('This was a low-output week. That is recoverable.');
  }

  // Deep work assessment
  if (deepWorkPct >= 60) {
    lines.push(`Deep work ratio is strong at ${deepWorkPct}% — you are entering flow states regularly.`);
  } else if (deepWorkPct < 30 && totalSessions >= 3) {
    lines.push(`Only ${deepWorkPct}% of your sessions were distraction-free. Focus quality needs attention.`);
  }

  // Time pattern
  const bestTime = Object.entries(timeBreakdown).sort((a, b) => b[1] - a[1])[0]?.[0];
  if (bestTime) {
    lines.push(`You perform best in the ${bestTime.toLowerCase()}.`);
  }

  // Top distraction
  if (distractionBreakdown[0]) {
    lines.push(`"${distractionBreakdown[0].label}" remains your primary focus disruptor at ${distractionBreakdown[0].pct}%.`);
  }

  // Recommendation
  if (stabilityPct < 50) {
    lines.push('Recommendation: Shorten sessions by 10 minutes and reduce daily targets this week.');
  } else if (stabilityPct >= 80 && deepWorkPct >= 60) {
    lines.push('Recommendation: You are ready to extend session duration by 5–10 minutes.');
  } else {
    lines.push('Recommendation: Maintain current rhythm. Small consistency beats big burst efforts.');
  }

  return lines.join(' ');
}

// ─────────────────────────────────────────
//  10. RANK from score
// ─────────────────────────────────────────
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