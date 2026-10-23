import { isValidTable, TABLE_MAX, TABLE_MIN, type Operation } from './game-rules';

export interface FactStats { readonly right?: number; readonly wrong?: number }
export type FactStatsByKey = Readonly<Record<string, FactStats>>;

export function factKey(table: number, multiplier: number, operation: Operation): string { return `${table}-${multiplier}-${operation}`; }

export function isFactMastered(stats: FactStats = {}): boolean {
  const right = Math.max(0, stats.right ?? 0), wrong = Math.max(0, stats.wrong ?? 0), total = right + wrong;
  return right >= 2 && total > 0 && right / total >= 0.8;
}

export function masteredCount(stats: FactStatsByKey, table: number, operation: Operation): number {
  if (!isValidTable(table)) throw new RangeError('Table must be an integer from 1 through 12.');
  return Array.from({ length: TABLE_MAX }, (_, index) => index + TABLE_MIN).filter((multiplier) => isFactMastered(stats[factKey(table, multiplier, operation)])).length;
}

export function tableMastered(stats: FactStatsByKey, table: number, operation: Operation): boolean { return masteredCount(stats, table, operation) === TABLE_MAX; }
export function groupMastered(stats: FactStatsByKey, tables: readonly number[], operation: Operation): boolean { return tables.every((table) => tableMastered(stats, table, operation)); }
export function achievedTables(stats: FactStatsByKey, operation: Operation): number { return Array.from({ length: TABLE_MAX }, (_, index) => index + TABLE_MIN).filter((table) => tableMastered(stats, table, operation)).length; }

export interface MissionRewardInput {
  readonly correct: number;
  readonly wrong: number;
  readonly mode: 'practice' | 'exam' | 'speed' | 'timed';
  readonly durationMinutes?: number;
  readonly completed: boolean;
  readonly achievementBonus?: number;
}
export interface MissionReward { readonly total: number; readonly base: number; readonly bonus: number; readonly achievementBonus: number }

export function calculateMissionReward(input: MissionRewardInput): MissionReward {
  const correct = Math.max(0, Math.trunc(input.correct)), wrong = Math.max(0, Math.trunc(input.wrong));
  const attempts = correct + wrong, precision = attempts ? correct / attempts : 0;
  let bonus = input.mode === 'exam' ? 20 : input.mode === 'speed' ? 10 : input.mode === 'timed' ? (input.durationMinutes ?? 0) * 6 : 0;
  if (!input.completed || attempts < 5 || precision < 0.5) bonus = 0;
  const achievementBonus = Math.max(0, Math.trunc(input.achievementBonus ?? 0));
  return { total: correct + bonus + achievementBonus, base: correct, bonus, achievementBonus };
}
