import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { EqualCondition } from '../../src/conditions/EqualCondition.ts';
import { Expression } from '../../src/Expression.ts';
import { getPlaceholder } from '../../src/dialects.ts';

describe('EqualCondition', () => {
  const pgPlaceholder = getPlaceholder('postgres');
  const mysqlPlaceholder = getPlaceholder('mysql');

  it('should build with postgres placeholder', () => {
    const cond = new EqualCondition('id', 1);
    assert.equal(cond.build(1, pgPlaceholder), 'id = $1');
    assert.deepEqual(cond.getValues(), [1]);
  });

  it('should build with mysql placeholder', () => {
    const cond = new EqualCondition('id', 1);
    assert.equal(cond.build(1, mysqlPlaceholder), 'id = ?');
    assert.deepEqual(cond.getValues(), [1]);
  });

  it('should use startIndex for placeholder', () => {
    const cond = new EqualCondition('name', 'test');
    assert.equal(cond.build(3, pgPlaceholder), 'name = $3');
    assert.deepEqual(cond.getValues(), ['test']);
  });

  it('should handle Expression value', () => {
    const cond = new EqualCondition('date', new Expression('NOW()'));
    assert.equal(cond.build(1, pgPlaceholder), 'date = NOW()');
    assert.deepEqual(cond.getValues(), []);
  });
});
