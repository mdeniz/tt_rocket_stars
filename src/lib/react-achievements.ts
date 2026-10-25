export interface AchievementFact {
  readonly right: number;
  readonly wrong: number;
}

export interface AchievementMission {
  readonly mode?: string;
  readonly op?: string;
  readonly correct?: number;
  readonly wrong?: number;
  readonly tables?: number[];
}

export interface AchievementInput {
  readonly facts?: Record<string, unknown>;
  readonly history?: unknown;
}

export interface ReactAchievementRecord {
  readonly id: string;
  readonly icon: string;
  readonly titleKey: string;
  readonly descriptionKey: string;
  readonly locked: boolean;
  readonly progress?: { readonly done: number; readonly total: number };
}

const easyTables = [1, 2, 5, 10];
const middleTables = [3, 4, 6, 8];
const hardTables = [7, 9, 11, 12];

function numberValue(value: unknown): number {
  return Number.isFinite(Number(value)) ? Math.max(0, Math.trunc(Number(value))) : 0;
}

function normalizeFacts(input: unknown): Record<string, AchievementFact> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {};
  return Object.fromEntries(Object.entries(input).map(([key, value]) => {
    const record = value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
    return [key, { right: numberValue(record.right), wrong: numberValue(record.wrong) }];
  }));
}

function normalizeHistory(input: unknown): AchievementMission[] {
  if (!Array.isArray(input)) return [];
  return input.filter(item => item && typeof item === 'object' && !Array.isArray(item)).map(item => {
    const record = item as Record<string, unknown>;
    return {
      mode: typeof record.mode === 'string' ? record.mode : undefined,
      op: typeof record.op === 'string' ? record.op : undefined,
      correct: numberValue(record.correct),
      wrong: numberValue(record.wrong),
      tables: Array.isArray(record.tables)
        ? record.tables.filter((table): table is number => Number.isInteger(table) && table >= 1 && table <= 12)
        : [],
    };
  });
}

function factStats(facts: Record<string, AchievementFact>): { right: number; wrong: number } {
  return Object.values(facts).reduce((total, fact) => ({
    right: total.right + fact.right,
    wrong: total.wrong + fact.wrong,
  }), { right: 0, wrong: 0 });
}

function masteredCount(facts: Record<string, AchievementFact>, table: number, operation: 'mul' | 'div'): number {
  let mastered = 0;
  for (let n = 1; n <= 12; n += 1) {
    const fact = facts[`${table}-${n}-${operation}`] || { right: 0, wrong: 0 };
    const attempts = fact.right + fact.wrong;
    if (fact.right >= 2 && attempts > 0 && fact.right / attempts >= 0.8) mastered += 1;
  }
  return mastered;
}

function groupProgress(facts: Record<string, AchievementFact>, tables: number[], operation: 'mul' | 'div') {
  return { done: tables.reduce((total, table) => total + masteredCount(facts, table, operation), 0), total: tables.length * 12 };
}

function record(
  id: string,
  icon: string,
  titleKey: string,
  descriptionKey: string,
  unlocked: boolean,
  progress?: { done: number; total: number },
): ReactAchievementRecord {
  return { id, icon, titleKey, descriptionKey, locked: !unlocked, ...(progress ? { progress } : {}) };
}

export function evaluateAchievements(input: AchievementInput = {}): ReactAchievementRecord[] {
  const facts = normalizeFacts(input.facts);
  const history = normalizeHistory(input.history);
  const totals = factStats(facts);
  const missions = history.length;
  const masteredMultiplications = Array.from({ length: 12 }, (_, index) => masteredCount(facts, index + 1, 'mul'));
  const masteredDivisions = Array.from({ length: 12 }, (_, index) => masteredCount(facts, index + 1, 'div'));
  const allMultiplications = { done: masteredMultiplications.reduce((a, b) => a + b, 0), total: 144 };
  const allDivisions = { done: masteredDivisions.reduce((a, b) => a + b, 0), total: 144 };
  const base = [
    record('first-launch', '🌠', 'ui.achievement.firstLaunch.title', 'ui.achievement.firstLaunch.description', missions >= 1),
    record('hundred-correct', '💫', 'ui.achievement.hundredCorrect.title', 'ui.achievement.hundredCorrect.description', totals.right >= 100),
    record('explorer', '🚀', 'ui.achievement.explorer.title', 'ui.achievement.explorer.description', missions >= 5),
    record('galactic-traveler', '🪐', 'ui.achievement.galacticTraveler.title', 'ui.achievement.galacticTraveler.description', missions >= 20),
    record('star-accuracy', '🎯', 'ui.achievement.starAccuracy.title', 'ui.achievement.starAccuracy.description', history.some(mission => numberValue(mission.correct) >= 20)),
    record('perfect-mission', '🏆', 'ui.achievement.perfectMission.title', 'ui.achievement.perfectMission.description', history.some(mission => numberValue(mission.correct) >= 10 && numberValue(mission.wrong) === 0)),
    record('space-lightning', '⚡', 'ui.achievement.spaceLightning.title', 'ui.achievement.spaceLightning.description', history.some(mission => mission.mode === 'speed' && numberValue(mission.correct) >= 30)),
    record('centurion', '🌌', 'ui.achievement.centurion.title', 'ui.achievement.centurion.description', totals.right >= 500),
  ];
  const extras = [
    record('first-planet', '🎓', 'ui.achievement.firstPlanet.title', 'ui.achievement.firstPlanet.description', masteredMultiplications.some(value => value === 12), { done: Math.max(...masteredMultiplications, 0), total: 12 }),
    record('first-division', '🧠', 'ui.achievement.firstDivision.title', 'ui.achievement.firstDivision.description', masteredDivisions.some(value => value === 12), { done: Math.max(...masteredDivisions, 0), total: 12 }),
    record('easy-tables', '🌱', 'ui.achievement.easyTables.title', 'ui.achievement.easyTables.description', groupProgress(facts, easyTables, 'mul').done === 48, groupProgress(facts, easyTables, 'mul')),
    record('easy-divisions', '🌿', 'ui.achievement.easyDivisions.title', 'ui.achievement.easyDivisions.description', groupProgress(facts, easyTables, 'div').done === 48, groupProgress(facts, easyTables, 'div')),
    record('middle-tables', '🧩', 'ui.achievement.middleTables.title', 'ui.achievement.middleTables.description', groupProgress(facts, middleTables, 'mul').done === 48, groupProgress(facts, middleTables, 'mul')),
    record('middle-divisions', '🔷', 'ui.achievement.middleDivisions.title', 'ui.achievement.middleDivisions.description', groupProgress(facts, middleTables, 'div').done === 48, groupProgress(facts, middleTables, 'div')),
    record('hard-tables', '🔥', 'ui.achievement.hardTables.title', 'ui.achievement.hardTables.description', groupProgress(facts, hardTables, 'mul').done === 48, groupProgress(facts, hardTables, 'mul')),
    record('hard-divisions', '💎', 'ui.achievement.hardDivisions.title', 'ui.achievement.hardDivisions.description', groupProgress(facts, hardTables, 'div').done === 48, groupProgress(facts, hardTables, 'div')),
    record('multiplication-master', '🌍', 'ui.achievement.multiplicationMaster.title', 'ui.achievement.multiplicationMaster.description', allMultiplications.done === allMultiplications.total, allMultiplications),
    record('division-master', '🪐', 'ui.achievement.divisionMaster.title', 'ui.achievement.divisionMaster.description', allDivisions.done === allDivisions.total, allDivisions),
    record('universe-master', '👑', 'ui.achievement.universeMaster.title', 'ui.achievement.universeMaster.description', allMultiplications.done === 144 && allDivisions.done === 144, { done: allMultiplications.done + allDivisions.done, total: 288 }),
    record('hard-mode-precision', '🎯', 'ui.achievement.hardModePrecision.title', 'ui.achievement.hardModePrecision.description', history.some(mission => mission.mode === 'exam' && numberValue(mission.correct) >= 18 && numberValue(mission.wrong) <= 2 && (mission.tables?.length || 0) >= 2 && (mission.tables || []).every(table => hardTables.includes(table)))),
    record('mixed-mission', '🔀', 'ui.achievement.mixedMission.title', 'ui.achievement.mixedMission.description', history.some(mission => mission.mode === 'exam' && mission.op === 'both' && numberValue(mission.correct) >= 17 && numberValue(mission.wrong) <= 3)),
    record('space-veteran', '🚀', 'ui.achievement.spaceVeteran.title', 'ui.achievement.spaceVeteran.description', missions >= 50),
    record('thousand-correct', '🌟', 'ui.achievement.thousandCorrect.title', 'ui.achievement.thousandCorrect.description', totals.right >= 1000),
  ];
  return [...base, ...extras];
}
