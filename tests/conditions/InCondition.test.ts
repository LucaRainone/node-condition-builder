import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { InCondition } from '../../src/conditions/InCondition.ts';
import { getPlaceholder } from '../../src/dialects.ts';
import { Expression } from '../../src/Expression.ts';

describe('InCondition', () => {
  const pgPlaceholder = getPlaceholder('postgres');
  const mysqlPlaceholder = getPlaceholder('mysql');

  it('should build IN with postgres placeholders', () => {
    const cond = new InCondition('id', [1, 2, 3]);
    assert.equal(cond.build(1, pgPlaceholder), 'id IN ($1, $2, $3)');
    assert.deepEqual(cond.getValues(), [1, 2, 3]);
  });

  it('should use correct startIndex', () => {
    const cond = new InCondition('id', [10, 20]);
    assert.equal(cond.build(5, pgPlaceholder), 'id IN ($5, $6)');
    assert.deepEqual(cond.getValues(), [10, 20]);
  });

  it('should build IN with mysql placeholders', () => {
    const cond = new InCondition('id', [1, 2, 3]);
    assert.equal(cond.build(1, mysqlPlaceholder), 'id IN (?, ?, ?)');
    assert.deepEqual(cond.getValues(), [1, 2, 3]);
  });

  it('should handle Expression values', () => {
    const cond = new InCondition('status', [new Expression('DEFAULT'), 'active']);
    assert.equal(cond.build(1, pgPlaceholder), 'status IN (DEFAULT, $1)');
    assert.deepEqual(cond.getValues(), ['active']);
  });

  it('should handle all Expression values', () => {
    const cond = new InCondition('col', [new Expression('A'), new Expression('B')]);
    assert.equal(cond.build(1, pgPlaceholder), 'col IN (A, B)');
    assert.deepEqual(cond.getValues(), []);
  });

  it('should handle single value', () => {
    const cond = new InCondition('id', [42]);
    assert.equal(cond.build(1, pgPlaceholder), 'id IN ($1)');
    assert.deepEqual(cond.getValues(), [42]);
  });
});
