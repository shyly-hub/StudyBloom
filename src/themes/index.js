
import { C as ColorPalette } from './colors';
import * as Constants from './constants';

export * from './constants';     // SUBJECTS, MOODS, SCORE_RULES, DISTRACTIONS,
                                 // QUIT_REASONS, GOALS, STUDY_TIMES, EDU_LEVELS,
                                 // DAYS_SHORT, SUBJECT_ICONS, sColor, sBg

// Named C export
export const C = ColorPalette;

// Convenience named exports (used directly in screens)
export const SUBJECTS    = Constants.SUBJECTS;
export const MOODS       = Constants.MOODS;
export const SCORE_RULES = Constants.SCORE_RULES;

export default ColorPalette;