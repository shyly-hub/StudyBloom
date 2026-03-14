
import { C } from './colors';

export const SUBJECTS     = ['Math','Science','English','History','Coding','Other'];
export const MOODS        = ['😫','😐','🙂','😊','🔥'];
export const DAYS_SHORT   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
export const SUBJECT_ICONS = { Math:'📐', Science:'🔬', English:'📖', History:'🏛️', Coding:'💻', Other:'📌' };

export const SCORE_RULES = {
  COMPLETE_SESSION:     +10,
  COMPLETE_NO_DISTRACT: +5,
  QUIT_EARLY:           -5,
  STUDIED_ON_TIME:      +3,
  MISSED_PLANNED_TIME:  -3,
};

export const DISTRACTIONS = ['Phone','Social Media','Overthinking','Tired','Noise'];
export const QUIT_REASONS = ['Too Tired','Got Bored','Urgent Task','Lost Motivation','Too Hard'];
export const GOALS        = ['Exam Prep','Skill Building','General Discipline'];
export const STUDY_TIMES  = ['Morning','Afternoon','Night'];
export const EDU_LEVELS   = ['Year 7–9','Year 10–11','Year 12–13','Bachelors','Masters'];

// Subject main color — vivid pastel, works on both themes
export function sColor(subject) {
  const map = {
    Math:    C.purple,
    Science: C.mint,
    English: C.pink,
    History: C.peach,
    Coding:  '#7ba8f0',   // fixed blue — not brand yellow
    Other:   C.yellow,
  };
  return map[subject] || C.blue;
}

// Subject background — soft tint on light, translucent on dark
export function sBg(subject) {
  const map = {
    Math:    C.purpleSoft,
    Science: C.mintSoft,
    English: C.pinkSoft,
    History: C.peachSoft,
    Coding:  C.blueSoft,  // slightly blue-ish tint
    Other:   C.yellowSoft,
  };
  return map[subject] || C.blueSoft;
}