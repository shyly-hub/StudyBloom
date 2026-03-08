
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
export const SCORE_RULES = {
  COMPLETE_SESSION:       +10,
  COMPLETE_NO_DISTRACT:   +5,
  QUIT_EARLY:             -5,
  STUDIED_ON_TIME:        +3,
  MISSED_PLANNED_TIME:    -3,
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

// ── Goal options ──────────────────────────
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

// ── Helper: subject main color ────────────
// Returns vivid neon tone that reads on dark backgrounds
// Usage: sColor('Math') → '#b07ef8'
export function sColor(subject) {
  const map = {
    Math:    C.purple,   // vivid violet
    Science: C.mint,     // electric green
    English: C.pink,     // hot pink
    History: C.peach,    // electric orange
    Coding:  C.blue,     // electric violet (brand)
    Other:   C.yellow,   // neon yellow
  };
  return map[subject] || C.blue;
}

// ── Helper: subject dark soft background ──
// Returns translucent dark tint for cards/badges
// Usage: sBg('Math') → 'rgba(176,126,248,0.14)'
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