import type { DialectName } from './types.ts';
import { Expression } from './Expression.ts';
import { getPlaceholder } from './dialects.ts';
import { Condition } from './conditions/Condition.ts';
import { EqualCondition } from './conditions/EqualCondition.ts';
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

  isEqual(field: string, value: unknown): void {
    if (value === undefined) return;
    this.conditions.push(new EqualCondition(field, value));
  }

  isNull(field: string, isNull?: boolean): void {
    if (!isNull) return;
    this.conditions.push(new NullCondition(field));
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
