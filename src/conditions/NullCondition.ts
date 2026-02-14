import { Condition } from './Condition.ts';

export class NullCondition extends Condition {
  private field: string;
  private negated: boolean;

  constructor(field: string, negated: boolean = false) {
    super();
    this.field = field;
    this.negated = negated;
  }

  build(_startIndex: number, _placeholder: (index: number) => string): string {
    return `${this.field} IS ${this.negated ? 'NOT ' : ''}NULL`;
  }

  getValues(): unknown[] {
    return [];
  }
}
