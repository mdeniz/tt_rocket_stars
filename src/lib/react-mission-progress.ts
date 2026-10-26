import type { ReactMissionState } from './react-gameplay';
import type { MissionPersistenceAdapter } from './react-gameplay-persistence';
import { evaluateAchievements } from './react-achievements';

export interface MissionCompletionOptions {
  readonly completedAt?: number;
}

interface PreparedCompletion {
  readonly duplicate: boolean;
  readonly facts: Record<string, unknown>;
  readonly history: Record<string, unknown>[];
  readonly inventory: Record<string, unknown>;
  readonly reward: NonNullable<ReactMissionState['reward']>;
}

function completionId(state: ReactMissionState, completedAt: number): string {
  return `${state.startedAt}:${completedAt}:${state.config.mode}:${state.correct}:${state.wrong}`;
}

function historyEntry(state: ReactMissionState, completedAt: number, reward: NonNullable<ReactMissionState['reward']>): Record<string, unknown> {
  return {
    completionId: completionId(state, completedAt),
    date: completedAt,
    mode: state.config.mode,
    minutes: state.config.mode === 'timed' ? state.config.durationMinutes : null,
    correct: state.correct,
    wrong: state.wrong,
    score: state.correct,
    elapsed: Math.max(0, Math.round((completedAt - state.startedAt) / 1000)),
    tables: [...state.config.tables].sort((left, right) => left - right),
    op: state.config.operation,
    coins: reward,
  };
}

export function persistMissionCompletion(
  adapter: MissionPersistenceAdapter,
  state: ReactMissionState,
  options: MissionCompletionOptions = {},
): boolean {
  if (state.status !== 'complete' || !state.reward) return false;
  const completedAt = Number.isFinite(options.completedAt) ? Number(options.completedAt) : state.completedAt || Date.now();
  const prepared = prepareCompletion(adapter, state, completedAt);
  if (!prepared) return false;
  if (prepared.duplicate) return true;
  return adapter.commitProgress({
    facts: prepared.facts,
    history: prepared.history.slice(0, 150),
    inventory: prepared.inventory,
  });
}

export function missionCompletionReward(
  adapter: MissionPersistenceAdapter,
  state: ReactMissionState,
  completedAt = state.completedAt || Date.now(),
): NonNullable<ReactMissionState['reward']> | null {
  return prepareCompletion(adapter, state, completedAt)?.reward || null;
}

function prepareCompletion(
  adapter: MissionPersistenceAdapter,
  state: ReactMissionState,
  completedAt: number,
): PreparedCompletion | null {
  if (state.status !== 'complete' || !state.reward) return null;
  const facts = adapter.read();
  const history = [...adapter.readHistory()];
  const inventory = adapter.readInventory();
  if (!inventory || typeof inventory.coins !== 'number' || !Number.isFinite(inventory.coins) || inventory.coins < 0) return null;
  const entry = historyEntry(state, completedAt, state.reward);
  if (history.some(item => item.completionId === entry.completionId)) return {
    duplicate: true,
    facts,
    history,
    inventory,
    reward: state.reward,
  };
  history.unshift(entry);
  const rewardedAchievements = Array.isArray(inventory.rewardedAchievements)
    ? inventory.rewardedAchievements.filter(item => Number.isInteger(item) && item >= 0)
    : [];
  const achievementRecords = evaluateAchievements({ facts, history });
  const achievementBonus = achievementRecords.reduce((total, achievement, index) => {
    if (achievement.locked || rewardedAchievements.includes(index)) return total;
    rewardedAchievements.push(index);
    return total + (index === 7 ? 200 : index === 5 ? 120 : index >= 8 ? (index === 18 ? 400 : index === 16 || index === 17 ? 250 : 100) : 50);
  }, 0);
  const reward = {
    ...state.reward,
    achievementBonus,
    total: state.reward.total + achievementBonus,
  };
  const nextInventory = { ...inventory, rewardedAchievements, coins: Number(inventory.coins) + reward.total };
  const updatedEntry = historyEntry(state, completedAt, reward);
  history[0] = updatedEntry;
  return {
    duplicate: false,
    facts,
    history,
    inventory: nextInventory,
    reward,
  };
}
