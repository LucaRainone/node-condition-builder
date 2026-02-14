export abstract class Condition {
  abstract build(startIndex: number, placeholder: (index: number) => string): string;
  abstract getValues(): unknown[];
}
