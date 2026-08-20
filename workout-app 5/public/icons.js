// Simple, consistent line-art illustrations for each exercise movement pattern.
// Minimalist stick-figure style so it stays fast, legal (no sourced photos), and
// visually consistent with the app's theme. Each is a 100x100 viewBox SVG string.

const STROKE = 'stroke="var(--ember)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none"';
const HEAD = (cx, cy) => `<circle cx="${cx}" cy="${cy}" r="8" ${STROKE}/>`;

const EXERCISE_ICONS = {
  pushup: `<svg viewBox="0 0 100 100">${HEAD(22, 34)}<path d="M28 40 L78 62" ${STROKE}/><path d="M40 46 L36 66" ${STROKE}/><path d="M62 55 L60 74" ${STROKE}/><path d="M30 44 L20 58" ${STROKE}/><path d="M70 58 L80 70" ${STROKE}/></svg>`,

  plank: `<svg viewBox="0 0 100 100">${HEAD(20, 40)}<path d="M26 44 L82 58" ${STROKE}/><path d="M35 47 L30 68" ${STROKE}/><path d="M75 56 L82 72" ${STROKE}/></svg>`,

  squat: `<svg viewBox="0 0 100 100">${HEAD(50, 24)}<path d="M50 32 L50 52" ${STROKE}/><path d="M50 52 L34 62" ${STROKE}/><path d="M50 52 L66 62" ${STROKE}/><path d="M34 62 L30 84" ${STROKE}/><path d="M66 62 L70 84" ${STROKE}/><path d="M38 40 L24 50" ${STROKE}/><path d="M62 40 L76 50" ${STROKE}/></svg>`,

  lunge: `<svg viewBox="0 0 100 100">${HEAD(38, 22)}<path d="M38 30 L44 52" ${STROKE}/><path d="M44 52 L26 72" ${STROKE}/><path d="M44 52 L68 60 L64 40" ${STROKE}/><path d="M38 36 L24 44" ${STROKE}/><path d="M42 40 L58 30" ${STROKE}/></svg>`,

  bridge: `<svg viewBox="0 0 100 100">${HEAD(18, 62)}<path d="M24 62 L52 62" ${STROKE}/><path d="M52 62 L66 42" ${STROKE}/><path d="M52 62 L70 68" ${STROKE}/><path d="M66 42 L64 62" ${STROKE}/></svg>`,

  curl: `<svg viewBox="0 0 100 100">${HEAD(50, 22)}<path d="M50 30 L50 62" ${STROKE}/><path d="M50 62 L38 82" ${STROKE}/><path d="M50 62 L62 82" ${STROKE}/><path d="M50 38 L68 44" ${STROKE}/><path d="M68 44 L60 60" ${STROKE}/></svg>`,

  raise: `<svg viewBox="0 0 100 100">${HEAD(50, 22)}<path d="M50 30 L50 62" ${STROKE}/><path d="M50 62 L38 82" ${STROKE}/><path d="M50 62 L62 82" ${STROKE}/><path d="M50 36 L26 28" ${STROKE}/><path d="M50 36 L74 28" ${STROKE}/></svg>`,

  row: `<svg viewBox="0 0 100 100">${HEAD(24, 30)}<path d="M30 36 L74 54" ${STROKE}/><path d="M40 40 L36 66" ${STROKE}/><path d="M64 50 L64 68" ${STROKE}/><path d="M46 42 L58 30" ${STROKE}/></svg>`,

  dip: `<svg viewBox="0 0 100 100">${HEAD(50, 24)}<path d="M50 32 L50 58" ${STROKE}/><path d="M50 58 L40 80" ${STROKE}/><path d="M50 58 L60 80" ${STROKE}/><path d="M36 44 L50 40 L64 44" ${STROKE}/><path d="M36 44 L36 60" ${STROKE}/><path d="M64 44 L64 60" ${STROKE}/></svg>`,

  wristcurl: `<svg viewBox="0 0 100 100">${HEAD(30, 26)}<path d="M34 32 L58 46" ${STROKE}/><path d="M42 36 L38 60" ${STROKE}/><path d="M58 46 L74 42" ${STROKE}/><path d="M58 46 L74 54" ${STROKE}/></svg>`,

  carry: `<svg viewBox="0 0 100 100">${HEAD(50, 20)}<path d="M50 28 L50 58" ${STROKE}/><path d="M50 58 L38 82" ${STROKE}/><path d="M50 58 L62 82" ${STROKE}/><path d="M50 36 L34 44 L30 60" ${STROKE}/><path d="M50 36 L66 44 L70 60" ${STROKE}/></svg>`,

  hold: `<svg viewBox="0 0 100 100">${HEAD(50, 20)}<path d="M50 28 L50 60" ${STROKE}/><path d="M50 60 L36 82" ${STROKE}/><path d="M50 60 L64 82" ${STROKE}/><path d="M50 34 L34 26" ${STROKE}/><path d="M50 34 L66 26" ${STROKE}/></svg>`,

  calf: `<svg viewBox="0 0 100 100">${HEAD(50, 20)}<path d="M50 28 L50 56" ${STROKE}/><path d="M50 56 L42 78 L42 84" ${STROKE}/><path d="M50 56 L58 78 L58 84" ${STROKE}/><path d="M50 34 L38 40" ${STROKE}/><path d="M50 34 L62 40" ${STROKE}/></svg>`,

  superman: `<svg viewBox="0 0 100 100">${HEAD(16, 50)}<path d="M22 50 L80 46" ${STROKE}/><path d="M32 49 L28 32" ${STROKE}/><path d="M70 47 L76 66" ${STROKE}/></svg>`,

  birddog: `<svg viewBox="0 0 100 100">${HEAD(24, 40)}<path d="M30 44 L76 52" ${STROKE}/><path d="M40 46 L38 70" ${STROKE}/><path d="M64 50 L78 34" ${STROKE}/><path d="M55 49 L60 70" ${STROKE}/></svg>`,

  pike: `<svg viewBox="0 0 100 100">${HEAD(28, 58)}<path d="M32 54 L58 34" ${STROKE}/><path d="M58 34 L74 58" ${STROKE}/><path d="M40 50 L36 68" ${STROKE}/></svg>`,

  twist: `<svg viewBox="0 0 100 100">${HEAD(50, 24)}<path d="M50 32 L50 60" ${STROKE}/><path d="M50 60 L36 82" ${STROKE}/><path d="M50 60 L64 82" ${STROKE}/><path d="M32 40 L68 44" ${STROKE}/></svg>`,

  legraise: `<svg viewBox="0 0 100 100">${HEAD(18, 46)}<path d="M24 48 L54 58" ${STROKE}/><path d="M54 58 L78 30" ${STROKE}/><path d="M30 50 L26 70" ${STROKE}/></svg>`,

  sideplank: `<svg viewBox="0 0 100 100">${HEAD(20, 36)}<path d="M26 40 L78 62" ${STROKE}/><path d="M40 46 L36 78" ${STROKE}/><path d="M30 42 L20 56" ${STROKE}/></svg>`,

  mountainclimber: `<svg viewBox="0 0 100 100">${HEAD(20, 32)}<path d="M26 36 L80 56" ${STROKE}/><path d="M40 42 L36 62" ${STROKE}/><path d="M60 50 L44 68" ${STROKE}/><path d="M74 54 L82 40" ${STROKE}/></svg>`,

  generic: `<svg viewBox="0 0 100 100">${HEAD(50, 22)}<path d="M50 30 L50 60" ${STROKE}/><path d="M50 60 L36 82" ${STROKE}/><path d="M50 60 L64 82" ${STROKE}/><path d="M50 38 L30 46" ${STROKE}/><path d="M50 38 L70 46" ${STROKE}/></svg>`,
};

function getExerciseIcon(pattern) {
  return EXERCISE_ICONS[pattern] || EXERCISE_ICONS.generic;
}
