
// ── Light palette ─────────────────────────
export const LIGHT_COLORS = {
  bg:           '#faf8f0',
  bgWhite:      '#ffffff',
  card:         '#ffffff',
  border:       '#ede8d8',
  bgAlt:        '#f5f2e8',
  bgRaised:     '#f0ece0',
  bgHover:      '#eae5d4',
  borderBright: '#d8d0bc',

  // Brand yellow
  blue:         '#f5c842',
  blueSoft:     '#fdf3cc',
  blueDark:     '#e8b020',

  // Subject pastels
  purple:       '#c0a0e0',
  purpleSoft:   '#ede0f8',
  lavSoft:      '#ede0f8',
  mint:         '#7dd4b0',
  mintSoft:     '#d8f5ec',
  pink:         '#f0a0b8',
  pinkSoft:     '#fde8ef',
  peach:        '#f5aa70',
  peachSoft:    '#fdebd8',
  yellow:       '#f5c842',
  yellowSoft:   '#fdf3cc',

  // Status
  green:        '#3bb88a',
  greenSoft:    '#d8f5ec',
  red:          '#e06070',
  redSoft:      '#fde8ec',
  orange:       '#e08040',
  orangeSoft:   '#fdebd8',

  // Text
  text:         '#1a1a1a',
  muted:        '#7a7060',
  subtext:      '#b0a898',

  // Shadow
  shadow:       'rgba(26,20,10,0.08)',
  glow:         'rgba(245,200,66,0.12)',
};

// ── Dark palette ──────────────────────────
export const DARK_COLORS = {
  bg:           '#14120e',
  bgWhite:      '#221f18',
  card:         '#221f18',
  border:       '#383228',
  bgAlt:        '#1c1a14',
  bgRaised:     '#2a2720',
  bgHover:      '#343028',
  borderBright: '#4a4238',

  // Brand yellow — stays the same in dark
  blue:         '#f5c842',
  blueSoft:     'rgba(245,200,66,0.15)',
  blueDark:     '#e8b020',

  purple:       '#c0a0e0',
  purpleSoft:   'rgba(192,160,224,0.15)',
  lavSoft:      'rgba(192,160,224,0.15)',
  mint:         '#3bd4a0',
  mintSoft:     'rgba(59,212,160,0.15)',
  pink:         '#f0a0b8',
  pinkSoft:     'rgba(240,160,184,0.15)',
  peach:        '#f5aa70',
  peachSoft:    'rgba(245,170,112,0.15)',
  yellow:       '#f5c842',
  yellowSoft:   'rgba(245,200,66,0.15)',

  green:        '#3bd4a0',
  greenSoft:    'rgba(59,212,160,0.15)',
  red:          '#f07080',
  redSoft:      'rgba(240,112,128,0.15)',
  orange:       '#f5aa70',
  orangeSoft:   'rgba(245,170,112,0.15)',

  text:         '#f0ece0',
  muted:        '#a09078',
  subtext:      '#605848',

  shadow:       'rgba(0,0,0,0.3)',
  glow:         'rgba(245,200,66,0.08)',
};

// ── Runtime dark-mode flag ─────────────────
let _dark = false;

/** Call this when the user toggles dark mode in Settings */
export function setDarkMode(on) {
  _dark = on;
}

export function isDark() {
  return _dark;
}

export const C = new Proxy({}, {
  get(_, key) {
    return (_dark ? DARK_COLORS : LIGHT_COLORS)[key];
  },
});

export default C;