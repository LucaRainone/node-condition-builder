import type { DialectName } from './types.ts';

export function getPlaceholder(dialect: DialectName): (index: number) => string {
  switch (dialect) {
    case 'postgres':
      return (i) => `$${i}`;
    case 'mysql':
      return (_i) => '?';
  }
}
