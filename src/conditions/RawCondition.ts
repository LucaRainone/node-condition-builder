import { Condition } from './Condition.ts';

export class RawCondition extends Condition {
  private sql: string;
  private params: unknown[];

  constructor(sql: string, params: unknown[] = []) {
    super();
    this.sql = sql;
    this.params = params;
  }

  build(startIndex: number, placeholder: (index: number) => string): string {
    let currentIndex = startIndex;
    return this.sql.replace(/\\\?|\?/g, (match) => {
      if (match === '\\?') return '?';
      return placeholder(currentIndex++);
    });
  }

  getValues(): unknown[] {
    return this.params;
  }
}
