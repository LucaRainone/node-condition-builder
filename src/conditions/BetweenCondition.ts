import { Condition } from './Condition.ts';

export class BetweenCondition extends Condition {
  private field: string;
  private from: unknown;
  private to: unknown;

  constructor(field: string, from: unknown, to: unknown) {
    super();
    this.field = field;
    this.from = from;
    this.to = to;
  }

  build(startIndex: number, placeholder: (index: number) => string): string {
    return `(${this.field} BETWEEN ${placeholder(startIndex)} AND ${placeholder(startIndex + 1)})`;
  }

  getValues(): unknown[] {
    return [this.from, this.to];
  }
}
