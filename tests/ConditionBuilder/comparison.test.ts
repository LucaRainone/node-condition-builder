import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ConditionBuilder } from '../../src/ConditionBuilder.ts';

describe('ConditionBuilder - comparison methods', () => {
  it('isGreater should work', () => {
    const condition = new ConditionBuilder('AND');
    condition.isGreater('age', 18);
    assert.equal(condition.build(), '(age > $1)');
    assert.deepEqual(condition.getValues(), [18]);
  });

  it('isLess should work', () => {
    const condition = new ConditionBuilder('AND');
    condition.isLess('age', 65);
    assert.equal(condition.build(), '(age < $1)');
    assert.deepEqual(condition.getValues(), [65]);
  });

  it('isGreaterOrEqual should work', () => {
    const condition = new ConditionBuilder('AND');
    condition.isGreaterOrEqual('score', 100);
    assert.equal(condition.build(), '(score >= $1)');
    assert.deepEqual(condition.getValues(), [100]);
  });

  it('isLessOrEqual should work', () => {
    const condition = new ConditionBuilder('AND');
    condition.isLessOrEqual('score', 50);
    assert.equal(condition.build(), '(score <= $1)');
    assert.deepEqual(condition.getValues(), [50]);
  });

  it('isNotGreater should generate <=', () => {
    const condition = new ConditionBuilder('AND');
    condition.isNotGreater('age', 65);
    assert.equal(condition.build(), '(age <= $1)');
    assert.deepEqual(condition.getValues(), [65]);
  });

  it('isNotGreaterOrEqual should generate <', () => {
    const condition = new ConditionBuilder('AND');
    condition.isNotGreaterOrEqual('age', 18);
    assert.equal(condition.build(), '(age < $1)');
    assert.deepEqual(condition.getValues(), [18]);
  });

  it('isNotLess should generate >=', () => {
    const condition = new ConditionBuilder('AND');
    condition.isNotLess('score', 0);
    assert.equal(condition.build(), '(score >= $1)');
    assert.deepEqual(condition.getValues(), [0]);
  });

  it('isNotLessOrEqual should generate >', () => {
    const condition = new ConditionBuilder('AND');
    condition.isNotLessOrEqual('score', 100);
    assert.equal(condition.build(), '(score > $1)');
    assert.deepEqual(condition.getValues(), [100]);
  });

  it('negated comparison with undefined should be ignored', () => {
    const condition = new ConditionBuilder('AND');
    condition.isNotGreater('a', undefined);
    condition.isNotGreaterOrEqual('b', undefined);
    condition.isNotLess('c', undefined);
    condition.isNotLessOrEqual('d', undefined);
    assert.equal(condition.build(), '(TRUE)');
  });

  it('negated comparison with Expression should work', () => {
    const condition = new ConditionBuilder('AND');
    condition.isNotGreater('date', condition.expression('NOW()'));
    assert.equal(condition.build(), '(date <= NOW())');
    assert.deepEqual(condition.getValues(), []);
  });

  it('comparison methods should be chainable', () => {
    const condition = new ConditionBuilder('AND');
    const result = condition
      .isGreater('a', 1)
      .isLess('b', 10)
      .isGreaterOrEqual('c', 5)
      .isLessOrEqual('d', 20)
      .build();
    assert.equal(result, '(a > $1 AND b < $2 AND c >= $3 AND d <= $4)');
    assert.deepEqual(condition.getValues(), [1, 10, 5, 20]);
  });
});
