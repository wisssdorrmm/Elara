export interface CoupleLevel {
  name: string;
  minXp: number;
}

export const COUPLE_LEVELS: CoupleLevel[] = [
  { name: 'New Sparks', minXp: 0 },
  { name: 'Growing Hearts', minXp: 100 },
  { name: 'Soul Partners', minXp: 300 },
  { name: 'Golden Hearts', minXp: 700 },
  { name: 'Forever Together', minXp: 1500 },
];

export interface CoupleLevelProgress {
  name: string;
  xp: number;
  nextLevelXp: number | null;
  progress: number;
}

export function getCoupleLevel(xp: number): CoupleLevelProgress {
  let current: CoupleLevel = COUPLE_LEVELS[0];
  let next: CoupleLevel | null = COUPLE_LEVELS[1] ?? null;

  for (let i = 0; i < COUPLE_LEVELS.length; i++) {
    if (xp >= COUPLE_LEVELS[i].minXp) {
      current = COUPLE_LEVELS[i];
      next = COUPLE_LEVELS[i + 1] ?? null;
    }
  }

  const progress = next ? Math.min(100, Math.round(((xp - current.minXp) / (next.minXp - current.minXp)) * 100)) : 100;

  return { name: current.name, xp, nextLevelXp: next?.minXp ?? null, progress };
}
