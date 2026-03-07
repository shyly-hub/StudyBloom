
//  Usage:
//  import { SUBJECTS, MOODS, sColor } from '../theme'
// ══════════════════════════════════════════

import { C } from './colors';

// ── Subjects list ─────────────────────────
export const SUBJECTS = [
  'Math',
  'Science',
  'English',
  'History',
  'Coding',
  'Other',
];

// ── Mood emojis ───────────────────────────
// index 0 = worst, index 4 = best
export const MOODS = ['😫', '😐', '🙂', '😊', '🔥'];

// ── Days of week ──────────────────────────
export const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ── Subject icons ─────────────────────────
export const SUBJECT_ICONS = {
  Math:    '📐',
  Science: '🔬',
  English: '📖',
  History: '🏛️',
  Coding:  '💻',
  Other:   '📌',
};

// ── Discipline score rules ────────────────
// Used in scoreEngine.js to calculate score changes
export const SCORE_RULES = {
  COMPLETE_SESSION:       +10,  // finished full session
  COMPLETE_NO_DISTRACT:   +5,   // finished with zero distractions
  QUIT_EARLY:             -5,   // stopped before session ended
  STUDIED_ON_TIME:        +3,   // studied during planned time
  MISSED_PLANNED_TIME:    -3,   // missed planned study time
};

// ── Distraction types ─────────────────────
export const DISTRACTIONS = [
  'Phone',
  'Social Media',
  'Overthinking',
  'Tired',
  'Noise',
];

// ── Quit reasons ──────────────────────────
export const QUIT_REASONS = [
  'Too Tired',
  'Got Bored',
  'Urgent Task',
  'Lost Motivation',
  'Too Hard',
];

// ── Goal options (onboarding) ─────────────
export const GOALS = [
  'Exam Prep',
  'Skill Building',
  'General Discipline',
];

// ── Preferred study time ──────────────────
export const STUDY_TIMES = ['Morning', 'Afternoon', 'Night'];

// ── Education levels ──────────────────────
export const EDU_LEVELS = [
  'Year 7–9',
  'Year 10–11',
  'Year 12–13',
  'Bachelors',
  'Masters',
];

// ── Helper: get subject main color ────────
// Usage: sColor('Math') → '#a78bca'
export function sColor(subject) {
  const map = {
    Math:    C.purple,
    Science: C.mint,
    English: C.pink,
    History: C.peach,
    Coding:  C.blue,
    Other:   C.yellow,
  };
  return map[subject] || C.blue;
}

// ── Helper: get subject soft background ───
// Usage: sBg('Math') → '#ede8f8'
export function sBg(subject) {
  const map = {
    Math:    C.purpleSoft,
    Science: C.mintSoft,
    English: C.pinkSoft,
    History: C.peachSoft,
    Coding:  C.blueSoft,
    Other:   C.yellowSoft,
  };
  return map[subject] || C.blueSoft;
}