import { Condition } from './Condition.ts';
import { Expression } from '../Expression.ts';

export class EqualCondition extends Condition {
  private field: string;
  private value: unknown;

  constructor(field: string, value: unknown) {
    super();
    this.field = field;
    this.value = value;
  }

  build(startIndex: number, placeholder: (index: number) => string): string {
    if (this.value instanceof Expression) {
      return `${this.field} = ${this.value.value}`;
    }
    return `${this.field} = ${placeholder(startIndex)}`;
  }

  getValues(): unknown[] {
    if (this.value instanceof Expression) {
      return [];
    }
    return [this.value];
  }
}
