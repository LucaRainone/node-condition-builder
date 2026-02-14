import { Condition } from './Condition.ts';
import { Expression } from '../Expression.ts';

export class ComparisonCondition extends Condition {
  private field: string;
  private operator: string;
  private value: unknown;

  constructor(field: string, operator: string, value: unknown) {
    super();
    this.field = field;
    this.operator = operator;
    this.value = value;
  }

  build(startIndex: number, placeholder: (index: number) => string): string {
    if (this.value instanceof Expression) {
      return `${this.field} ${this.operator} ${this.value.value}`;
    }
    return `${this.field} ${this.operator} ${placeholder(startIndex)}`;
  }

  getValues(): unknown[] {
    if (this.value instanceof Expression) {
      return [];
    }
    return [this.value];
  }
}
