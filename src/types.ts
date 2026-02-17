import type { Expression } from './Expression.ts';

export type DialectName = 'postgres' | 'mysql';

export type SqlValue = string | number | boolean | bigint | Date;
export type ConditionValue = SqlValue | Expression;
export type ConditionValueOrUndefined = ConditionValue | undefined;
