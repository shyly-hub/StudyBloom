
//  Fake data used for testing screens
//  before Firebase is connected.
//  Delete or ignore once real data works.
// ══════════════════════════════════════════

// ── Sample user ───────────────────────────
export const SAMPLE_USER = {
  id:              'user_001',
  name:            'Taylor',
  email:           'tay@test.com',
  goal:            'Exam Prep',
  dailyHours:      2,
  studyTime:       'Night',
  disciplineScore: 72,
  createdAt:       new Date('2026-02-01'),
};

// ── Sample sessions ───────────────────────
export const SAMPLE_SESSIONS = [
  {
    id:           'session_001',
    userId:       'user_001',
    subject:      'Coding',
    duration:     90,
    mood:         4,
    energy:       'High',
    difficulty:   4,
    distractions: [],
    completed:    true,
    notes:        'Finished React hooks chapter',
    date:         '2026-03-07',
    createdAt:    new Date('2026-03-07T21:00:00'),
  },
  {
    id:           'session_002',
    userId:       'user_001',
    subject:      'Math',
    duration:     45,
    mood:         2,
    energy:       'Low',
    difficulty:   5,
    distractions: ['Phone', 'Overthinking'],
    completed:    false,
    notes:        'Kept losing focus on calculus',
    date:         '2026-03-06',
    createdAt:    new Date('2026-03-06T14:00:00'),
  },
  {
    id:           'session_003',
    userId:       'user_001',
    subject:      'Science',
    duration:     60,
    mood:         3,
    energy:       'Medium',
    difficulty:   3,
    distractions: ['Tired'],
    completed:    true,
    notes:        'Read chapter 7 and 8',
    date:         '2026-03-06',
    createdAt:    new Date('2026-03-06T20:30:00'),
  },
  {
    id:           'session_004',
    userId:       'user_001',
    subject:      'English',
    duration:     30,
    mood:         4,
    energy:       'High',
    difficulty:   2,
    distractions: [],
    completed:    true,
    notes:        'Essay draft completed',
    date:         '2026-03-05',
    createdAt:    new Date('2026-03-05T22:00:00'),
  },
  {
    id:           'session_005',
    userId:       'user_001',
    subject:      'Coding',
    duration:     120,
    mood:         4,
    energy:       'High',
    difficulty:   4,
    distractions: ['Social Media'],
    completed:    true,
    notes:        'Built the focus timer component',
    date:         '2026-03-04',
    createdAt:    new Date('2026-03-04T21:30:00'),
  },
];

// ── Sample leaderboard friends ────────────
export const SAMPLE_FRIENDS = [
  { id: 'f1', name: 'Liza',   score: 88, hours: 12, avatar: '🧑' },
  { id: 'f2', name: 'B Rom',  score: 74, hours: 9,  avatar: '👦' },
  { id: 'f3', name: 'Mey',    score: 91, hours: 15, avatar: '👧' },
  { id: 'f4', name: 'Nana',  score: 65, hours: 7,  avatar: '🧑' },
];