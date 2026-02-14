import type { DialectName } from './types.ts';
import { Expression } from './Expression.ts';
import { getPlaceholder } from './dialects.ts';
import { Condition } from './conditions/Condition.ts';
import { EqualCondition } from './conditions/EqualCondition.ts';
import { ComparisonCondition } from './conditions/ComparisonCondition.ts';
import { BetweenCondition } from './conditions/BetweenCondition.ts';
import { InCondition } from './conditions/InCondition.ts';
import { NullCondition } from './conditions/NullCondition.ts';

export class ConditionBuilder {
  static DIALECT: DialectName = 'postgres';

  private conditions: Condition[] = [];
  private mode: 'AND' | 'OR';
  private dialect: DialectName;

  constructor(mode: 'AND' | 'OR', dialect?: DialectName) {
    this.mode = mode;
    this.dialect = dialect ?? ConditionBuilder.DIALECT;
  }

  expression(value: string): Expression {
    return new Expression(value);
  }

  isEqual(field: string, value: unknown): this {
    if (value === undefined) return this;
    this.conditions.push(new EqualCondition(field, value));
    return this;
  }

  isGreater(field: string, value: unknown): this {
    if (value === undefined) return this;
    this.conditions.push(new ComparisonCondition(field, '>', value));
    return this;
  }

  isGreaterOrEqual(field: string, value: unknown): this {
    if (value === undefined) return this;
    this.conditions.push(new ComparisonCondition(field, '>=', value));
    return this;
  }

  isLess(field: string, value: unknown): this {
    if (value === undefined) return this;
    this.conditions.push(new ComparisonCondition(field, '<', value));
    return this;
  }

  isLessOrEqual(field: string, value: unknown): this {
    if (value === undefined) return this;
    this.conditions.push(new ComparisonCondition(field, '<=', value));
    return this;
  }

  isBetween(field: string, from: unknown, to: unknown): this {
    if (from === null || to === null) {
      throw new Error('isBetween does not accept null values, use undefined to skip a bound');
    }
    if (from === undefined && to === undefined) return this;
    if (to === undefined) {
      this.conditions.push(new ComparisonCondition(field, '>=', from));
      return this;
    }
    if (from === undefined) {
      this.conditions.push(new ComparisonCondition(field, '<=', to));
      return this;
    }
    this.conditions.push(new BetweenCondition(field, from, to));
    return this;
  }

  isIn(field: string, values: unknown[] | undefined): this {
    if (values === undefined) return this;
    this.conditions.push(new InCondition(field, values));
    return this;
  }

  isNull(field: string, isNull?: boolean): this {
    if (!isNull) return this;
    this.conditions.push(new NullCondition(field));
    return this;
  }

  build(): string {
    if (this.conditions.length === 0) {
      return this.mode === 'AND' ? '(TRUE)' : '(FALSE)';
    }

    const placeholder = getPlaceholder(this.dialect);
    let currentIndex = 1;
    const parts: string[] = [];

    for (const condition of this.conditions) {
      parts.push(condition.build(currentIndex, placeholder));
      currentIndex += condition.getValues().length;
    }

    return `(${parts.join(` ${this.mode} `)})`;
  }

  getValues(): unknown[] {
    return this.conditions.flatMap(c => c.getValues());
  }
}
