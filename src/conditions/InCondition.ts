import { Condition } from './Condition.ts';
import { Expression } from '../Expression.ts';

export class InCondition extends Condition {
  private field: string;
  private values: unknown[];

  constructor(field: string, values: unknown[]) {
    super();
    this.field = field;
    this.values = values;
  }

  build(startIndex: number, placeholder: (index: number) => string): string {
    let currentIndex = startIndex;
    const parts: string[] = [];
    for (const value of this.values) {
      if (value instanceof Expression) {
        parts.push(value.value);
      } else {
        parts.push(placeholder(currentIndex));
        currentIndex++;
      }
    }
    return `${this.field} IN (${parts.join(', ')})`;
  }

  getValues(): unknown[] {
    return this.values.filter(v => !(v instanceof Expression));
  }
}
