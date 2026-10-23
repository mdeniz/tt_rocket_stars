export const TABLE_MIN = 1;
export const TABLE_MAX = 12;

export type Operation = 'mul' | 'div';

export interface Question {
  readonly a: number;
  readonly b: number;
  readonly op: Operation;
  readonly result: number;
}

export function isValidTable(value: number): boolean {
  return Number.isInteger(value) && value >= TABLE_MIN && value <= TABLE_MAX;
}

export function createQuestion(table: number, multiplier: number, op: Operation): Question {
  if (!isValidTable(table) || !isValidTable(multiplier)) throw new RangeError('Tables and multipliers must be integers from 1 through 12.');
  if (op !== 'mul' && op !== 'div') throw new RangeError('Unsupported operation.');
  return op === 'mul' ? { a: table, b: multiplier, op, result: table * multiplier } : { a: table, b: multiplier, op, result: multiplier };
}

export function createQuestionPool(tables: readonly number[], op: Operation | 'mix'): Question[] {
  return tables.flatMap((table) => Array.from({ length: TABLE_MAX }, (_, index) => {
    const multiplier = index + TABLE_MIN;
    const questions: Question[] = [];
    if (op !== 'div') questions.push(createQuestion(table, multiplier, 'mul'));
    if (op !== 'mul') questions.push(createQuestion(table, multiplier, 'div'));
    return questions;
  }).flat());
}

export function checkAnswer(question: Question, answer: number): boolean {
  return Number.isInteger(answer) && answer === question.result;
}
