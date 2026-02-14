import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ComparisonCondition } from '../../src/conditions/ComparisonCondition.ts';
import { getPlaceholder } from '../../src/dialects.ts';
import {Expression} from "../../src/Expression.ts";

describe('ComparisonCondition', () => {
  const pgPlaceholder = getPlaceholder('postgres');
  const mysqlPlaceholder = getPlaceholder('mysql');

  it('should build > with postgres placeholder', () => {
    const cond = new ComparisonCondition('age', '>', 18);
    assert.equal(cond.build(1, pgPlaceholder), 'age > $1');
    assert.deepEqual(cond.getValues(), [18]);
  });

  it('should build < with postgres placeholder', () => {
    const cond = new ComparisonCondition('age', '<', 65);
    assert.equal(cond.build(2, pgPlaceholder), 'age < $2');
    assert.deepEqual(cond.getValues(), [65]);
  });

  it('should build >= with postgres placeholder', () => {
    const cond = new ComparisonCondition('score', '>=', 100);
    assert.equal(cond.build(3, pgPlaceholder), 'score >= $3');
    assert.deepEqual(cond.getValues(), [100]);
  });

  it('should build <= with postgres placeholder', () => {
    const cond = new ComparisonCondition('score', '<=', 50);
    assert.equal(cond.build(1, pgPlaceholder), 'score <= $1');
    assert.deepEqual(cond.getValues(), [50]);
  });

  it('should build with mysql placeholder', () => {
    const cond = new ComparisonCondition('id', '>', 5);
    assert.equal(cond.build(1, mysqlPlaceholder), 'id > ?');
    assert.deepEqual(cond.getValues(), [5]);
  });
  it('should build with Expression', () => {
    const cond = new ComparisonCondition('date', '>', new Expression('NOW()'));
    assert.equal(cond.build(1, pgPlaceholder), 'date > NOW()');
    assert.deepEqual(cond.getValues(), []);
  });
});
