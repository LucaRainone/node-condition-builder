import { Condition } from './Condition.ts';
import { Expression } from '../Expression.ts';

export class EqualCondition extends Condition {
  private field: string;
  private value: unknown;
  private negated: boolean;

  constructor(field: string, value: unknown, negated: boolean = false) {
    super();
    this.field = field;
    this.value = value;
    this.negated = negated;
  }

  build(startIndex: number, placeholder: (index: number) => string): string {
    const op = this.negated ? '!=' : '=';
    if (this.value instanceof Expression) {
      return `${this.field} ${op} ${this.value.value}`;
    }
    return `${this.field} ${op} ${placeholder(startIndex)}`;
  }

  getValues(): unknown[] {
    if (this.value instanceof Expression) {
      return [];
    }
    return [this.value];
  }
}
