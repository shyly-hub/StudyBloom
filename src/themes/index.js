

import { C as ColorPalette } from './colors';
import * as Constants from './constants';
export * from './constants';

// Export the colors explicitly as C
export const C = ColorPalette;

// Export everything else from constants individually
export const SUBJECTS = Constants.SUBJECTS;
export const MOODS = Constants.MOODS;
export const SCORE_RULES = Constants.SCORE_RULES;

export default ColorPalette;