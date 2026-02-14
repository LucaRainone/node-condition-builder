import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { BetweenCondition } from '../../src/conditions/BetweenCondition.ts';
import { getPlaceholder } from '../../src/dialects.ts';

describe('BetweenCondition', () => {
  const pgPlaceholder = getPlaceholder('postgres');
  const mysqlPlaceholder = getPlaceholder('mysql');

  it('should build BETWEEN with postgres placeholders', () => {
    const cond = new BetweenCondition('age', 18, 65);
    assert.equal(cond.build(1, pgPlaceholder), '(age BETWEEN $1 AND $2)');
    assert.deepEqual(cond.getValues(), [18, 65]);
  });

  it('should use correct startIndex for placeholders', () => {
    const cond = new BetweenCondition('id', 10, 20);
    assert.equal(cond.build(5, pgPlaceholder), '(id BETWEEN $5 AND $6)');
    assert.deepEqual(cond.getValues(), [10, 20]);
  });

  it('should build BETWEEN with mysql placeholders', () => {
    const cond = new BetweenCondition('price', 100, 500);
    assert.equal(cond.build(1, mysqlPlaceholder), '(price BETWEEN ? AND ?)');
    assert.deepEqual(cond.getValues(), [100, 500]);
  });
});
