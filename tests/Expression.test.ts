import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Expression } from '../src/Expression.ts';

describe('Expression', () => {
  it('should store the raw SQL value', () => {
    const expr = new Expression('NOW()');
    assert.equal(expr.value, 'NOW()');
  });

  it('should be an instance of Expression', () => {
    const expr = new Expression('COUNT(*)');
    assert.ok(expr instanceof Expression);
  });
});
