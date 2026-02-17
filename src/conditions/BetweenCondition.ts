import type { ConditionValue } from '../types.ts';
import { Condition } from './Condition.ts';
import { Expression } from '../Expression.ts';

export class BetweenCondition extends Condition {
  private field: string;
  private from: ConditionValue;
  private to: ConditionValue;
  private negated: boolean;

  constructor(field: string, from: ConditionValue, to: ConditionValue, negated: boolean = false) {
    super();
    this.field = field;
    this.from = from;
    this.to = to;
    this.negated = negated;
  }

  build(startIndex: number, placeholder: (index: number) => string): string {
    const fromStr = this.from instanceof Expression
      ? this.from.value
      : placeholder(startIndex);
    const toIndex = this.from instanceof Expression ? startIndex : startIndex + 1;
    const toStr = this.to instanceof Expression
      ? this.to.value
      : placeholder(toIndex);
    const op = this.negated ? 'NOT BETWEEN' : 'BETWEEN';
    return `(${this.field} ${op} ${fromStr} AND ${toStr})`;
  }

  getValues(): unknown[] {
    const values: unknown[] = [];
    if (!(this.from instanceof Expression)) values.push(this.from);
    if (!(this.to instanceof Expression)) values.push(this.to);
    return values;
  }
}
