import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ConditionBuilder } from '../../src/ConditionBuilder.ts';

describe('ConditionBuilder - isBetween', () => {
  it('should generate BETWEEN when both values provided', () => {
    const condition = new ConditionBuilder('AND');
    condition.isBetween('age', 18, 65);
    assert.equal(condition.build(), '((age BETWEEN $1 AND $2))');
    assert.deepEqual(condition.getValues(), [18, 65]);
  });

  it('should generate >= when only from is provided', () => {
    const condition = new ConditionBuilder('AND');
    condition.isBetween('age', 18, undefined);
    assert.equal(condition.build(), '(age >= $1)');
    assert.deepEqual(condition.getValues(), [18]);
  });

  it('should generate <= when only to is provided', () => {
    const condition = new ConditionBuilder('AND');
    condition.isBetween('age', undefined, 65);
    assert.equal(condition.build(), '(age <= $1)');
    assert.deepEqual(condition.getValues(), [65]);
  });

  it('should be ignored when both undefined', () => {
    const condition = new ConditionBuilder('AND');
    condition.isBetween('age', undefined, undefined);
    assert.equal(condition.build(), '(TRUE)');
    assert.deepEqual(condition.getValues(), []);
  });

  it('should throw when from is null', () => {
    const condition = new ConditionBuilder('AND');
    assert.throws(() => condition.isBetween('age', null, 65), {
      message: 'isBetween does not accept null values, use undefined to skip a bound',
    });
  });

  it('should throw when to is null', () => {
    const condition = new ConditionBuilder('AND');
    assert.throws(() => condition.isBetween('age', 18, null), {
      message: 'isBetween does not accept null values, use undefined to skip a bound',
    });
  });

  it('should throw when both are null', () => {
    const condition = new ConditionBuilder('AND');
    assert.throws(() => condition.isBetween('age', null, null));
  });

  it('should be chainable', () => {
    const condition = new ConditionBuilder('AND');
    const result = condition
      .isEqual('status', 'active')
      .isBetween('age', 18, 65)
      .build();
    assert.equal(result, '(status = $1 AND (age BETWEEN $2 AND $3))');
    assert.deepEqual(condition.getValues(), ['active', 18, 65]);
  });
});
