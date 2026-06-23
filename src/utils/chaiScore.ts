/**
 * Chai Score: a single 0–100 consistency metric.
 * score = currentStreak * 2 + completionRate * 50 + activeHabits * 2
 */
export function computeChaiScore(
  currentStreak: number,
  completionRate: number, // 0–1
  activeHabits: number,
): number {
  const raw = currentStreak * 2 + completionRate * 50 + activeHabits * 2;
  return Math.min(100, Math.max(0, Math.round(raw)));
}

export function chaiScoreLabel(score: number): string {
  if (score >= 80) return 'Master Chai';
  if (score >= 60) return 'Chai Expert';
  if (score >= 40) return 'Chai Learner';
  if (score >= 20) return 'First Sip';
  return 'Just Started';
}

export function chaiScoreEmoji(score: number): string {
  if (score >= 80) return '☕☕☕';
  if (score >= 60) return '☕☕';
  if (score >= 40) return '☕';
  if (score >= 20) return '🍵';
  return '💧';
}
