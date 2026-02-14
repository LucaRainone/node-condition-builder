import { Condition } from './Condition.ts';

export class NullCondition extends Condition {
  private field: string;

  constructor(field: string) {
    super();
    this.field = field;
  }

  build(_startIndex: number, _placeholder: (index: number) => string): string {
    return `${this.field} IS NULL`;
  }

  getValues(): unknown[] {
    return [];
  }
}
