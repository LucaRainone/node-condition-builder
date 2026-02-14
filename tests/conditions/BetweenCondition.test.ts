import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { BetweenCondition } from '../../src/conditions/BetweenCondition.ts';
import { getPlaceholder } from '../../src/dialects.ts';
import { Expression } from '../../src/Expression.ts';

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

  it('should handle Expression as from', () => {
    const cond = new BetweenCondition('date', new Expression('NOW()'), '2026-12-31');
    assert.equal(cond.build(1, pgPlaceholder), '(date BETWEEN NOW() AND $1)');
    assert.deepEqual(cond.getValues(), ['2026-12-31']);
  });

  it('should handle Expression as to', () => {
    const cond = new BetweenCondition('date', '2026-01-01', new Expression('NOW()'));
    assert.equal(cond.build(1, pgPlaceholder), '(date BETWEEN $1 AND NOW())');
    assert.deepEqual(cond.getValues(), ['2026-01-01']);
  });

  it('should handle Expression as both', () => {
    const cond = new BetweenCondition('date', new Expression('NOW()'), new Expression('NOW() + INTERVAL 1 DAY'));
    assert.equal(cond.build(1, pgPlaceholder), '(date BETWEEN NOW() AND NOW() + INTERVAL 1 DAY)');
    assert.deepEqual(cond.getValues(), []);
  });
});
