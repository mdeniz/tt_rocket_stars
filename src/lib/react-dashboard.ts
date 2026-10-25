export interface DashboardFact {
  readonly right: number;
  readonly wrong: number;
}

export interface DashboardHistoryEntry {
  readonly correct: number;
  readonly wrong: number;
}

export interface DashboardInput {
  readonly facts?: unknown;
  readonly history?: unknown;
}

export interface TableProgress {
  readonly table: number;
  readonly right: number;
  readonly wrong: number;
  readonly accuracy: number;
  readonly progress: number;
}

export interface ReactDashboardModel {
  readonly correct: number;
  readonly wrong: number;
  readonly attempted: number;
  readonly accuracy: number;
  readonly missions: number;
  readonly experience: number;
  readonly level: number;
  readonly levelProgress: number;
  readonly levelKey: string;
  readonly tables: readonly TableProgress[];
}

const levelKeys = [
  'ui.dashboard.level.cadet',
  'ui.dashboard.level.explorer',
  'ui.dashboard.level.navigator',
  'ui.dashboard.level.commander',
  'ui.dashboard.level.captain',
  'ui.dashboard.level.legend',
] as const;

function numberValue(value: unknown): number {
  return Number.isFinite(Number(value)) ? Math.max(0, Math.trunc(Number(value))) : 0;
}

function normalizeFacts(input: unknown): Record<string, DashboardFact> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {};
  return Object.fromEntries(Object.entries(input).map(([key, value]) => {
    const record = value && typeof value === 'object' && !Array.isArray(value)
      ? value as Record<string, unknown>
      : {};
    return [key, { right: numberValue(record.right), wrong: numberValue(record.wrong) }];
  }));
}

function normalizeHistory(input: unknown): DashboardHistoryEntry[] {
  if (!Array.isArray(input)) return [];
  return input.filter(item => item && typeof item === 'object' && !Array.isArray(item)).map(item => {
    const record = item as Record<string, unknown>;
    return { correct: numberValue(record.correct), wrong: numberValue(record.wrong) };
  });
}

function tableProgress(facts: Record<string, DashboardFact>, table: number): TableProgress {
  let right = 0;
  let wrong = 0;
  for (const [key, fact] of Object.entries(facts)) {
    if (Number(key.split('-')[0]) !== table) continue;
    right += fact.right;
    wrong += fact.wrong;
  }
  const attempted = right + wrong;
  return {
    table,
    right,
    wrong,
    accuracy: attempted ? Math.round((right / attempted) * 100) : 0,
    progress: Math.min(100, Math.round((right / 30) * 100)),
  };
}

export function evaluateDashboard(input: DashboardInput = {}): ReactDashboardModel {
  const facts = normalizeFacts(input.facts);
  const history = normalizeHistory(input.history);
  const correct = Object.values(facts).reduce((total, fact) => total + fact.right, 0);
  const wrong = Object.values(facts).reduce((total, fact) => total + fact.wrong, 0);
  const attempted = correct + wrong;
  const experience = correct * 10;
  const level = Math.floor(experience / 500) + 1;
  const tables = Array.from({ length: 12 }, (_, index) => tableProgress(facts, index + 1));
  return {
    correct,
    wrong,
    attempted,
    accuracy: attempted ? Math.round((correct / attempted) * 100) : 0,
    missions: history.length,
    experience,
    level,
    levelProgress: experience % 500,
    levelKey: levelKeys[Math.min(level - 1, levelKeys.length - 1)],
    tables,
  };
}
