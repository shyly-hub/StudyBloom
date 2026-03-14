
export * from './constants';
export { C, setDarkMode, isDark, LIGHT_COLORS, DARK_COLORS } from './colors';
export const SUBJECTS    = ['Math','Science','English','History','Coding','Other'];
export const MOODS       = ['😫','😐','🙂','😊','🔥'];
export const SCORE_RULES = { COMPLETE_SESSION:+10, COMPLETE_NO_DISTRACT:+5, QUIT_EARLY:-5, STUDIED_ON_TIME:+3, MISSED_PLANNED_TIME:-3 };