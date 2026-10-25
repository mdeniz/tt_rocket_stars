import { checkAnswer, createQuestionPool, type Operation, type Question } from '../domain/game-rules';
import { calculateMissionReward, type MissionReward } from '../domain/progression';

export type MissionOperation = Operation | 'mix';
export type MissionMode = 'practice' | 'exam' | 'speed' | 'timed';
export type MissionStatus = 'active' | 'complete';
export type MissionFeedback = 'correct' | 'incorrect' | null;

export interface MissionConfig {
  readonly tables: readonly number[];
  readonly operation: MissionOperation;
  readonly mode: MissionMode;
  readonly durationMinutes?: number;
}

export interface ReactMissionState {
  readonly status: MissionStatus;
  readonly config: MissionConfig;
  readonly questions: readonly Question[];
  readonly questionIndex: number;
  readonly question: Question | null;
  readonly correct: number;
  readonly wrong: number;
  readonly feedback: MissionFeedback;
  readonly startedAt: number;
  readonly remainingSeconds: number | null;
  readonly reward: MissionReward | null;
  readonly completedAt: number | null;
}

function validateConfig(config: MissionConfig): MissionConfig {
  const tables = [...new Set(config.tables)].filter(Number.isInteger);
  if (!tables.length) throw new RangeError('At least one mission table is required.');
  if (!['mul', 'div', 'mix'].includes(config.operation)) throw new RangeError('Unsupported mission operation.');
  if (!['practice', 'exam', 'speed', 'timed'].includes(config.mode)) throw new RangeError('Unsupported mission mode.');
  if (config.mode === 'timed' && (!Number.isInteger(config.durationMinutes) || Number(config.durationMinutes) <= 0)) {
    throw new RangeError('Timed missions require a positive integer duration.');
  }
  return { ...config, tables };
}

function questionOffset(length: number, random: () => number): number {
  const value = Number(random());
  return Number.isFinite(value) && value >= 0 && value < 1 ? Math.floor(value * length) : 0;
}

function complete(state: ReactMissionState, completedAt: number): ReactMissionState {
  return {
    ...state,
    status: 'complete',
    question: null,
    remainingSeconds: state.config.mode === 'timed' || state.config.mode === 'speed' ? 0 : state.remainingSeconds,
    reward: calculateMissionReward({
      correct: state.correct,
      wrong: state.wrong,
      mode: state.config.mode,
      durationMinutes: state.config.durationMinutes,
      completed: true,
    }),
    completedAt,
  };
}

export function startMission(config: MissionConfig, startedAt = Date.now(), random = Math.random): ReactMissionState {
  const validated = validateConfig(config);
  const pool = createQuestionPool(validated.tables, validated.operation);
  const offset = questionOffset(pool.length, random);
  const rotated = [...pool.slice(offset), ...pool.slice(0, offset)];
  const questions = validated.mode === 'exam'
    ? Array.from({ length: 20 }, (_, index) => rotated[index % rotated.length])
    : rotated;
  return {
    status: 'active',
    config: validated,
    questions,
    questionIndex: 0,
    question: questions[0] || null,
    correct: 0,
    wrong: 0,
    feedback: null,
    startedAt,
    remainingSeconds: validated.mode === 'timed' ? validated.durationMinutes! * 60 : validated.mode === 'speed' ? 60 : null,
    reward: null,
    completedAt: null,
  };
}

export function submitAnswer(state: ReactMissionState, answer: number, answeredAt = Date.now()): ReactMissionState {
  if (state.status !== 'active' || !state.question) return state;
  const correct = checkAnswer(state.question, answer);
  const nextIndex = state.questionIndex + 1;
  const next = {
    ...state,
    questionIndex: nextIndex,
    question: state.questions[nextIndex] || null,
    correct: state.correct + (correct ? 1 : 0),
    wrong: state.wrong + (correct ? 0 : 1),
    feedback: correct ? 'correct' as const : 'incorrect' as const,
  };
  return next.question ? next : complete(next, answeredAt);
}

export function advanceTimer(state: ReactMissionState, now = Date.now()): ReactMissionState {
  if (state.status !== 'active' || !['timed', 'speed'].includes(state.config.mode) || state.remainingSeconds === null) return state;
  const limitSeconds = state.config.mode === 'speed' ? 60 : state.config.durationMinutes! * 60;
  const remainingSeconds = Math.max(0, limitSeconds - Math.floor((now - state.startedAt) / 1000));
  if (remainingSeconds === 0) return complete({ ...state, remainingSeconds }, now);
  return { ...state, remainingSeconds };
}
