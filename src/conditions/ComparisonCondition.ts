import { Condition } from './Condition.ts';

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
    return `${this.field} ${this.operator} ${placeholder(startIndex)}`;
  }

  getValues(): unknown[] {
    return [this.value];
  }
}
