import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ConditionBuilder } from '../../src/ConditionBuilder.ts';

describe('ConditionBuilder - isILike / isNotILike', () => {
  it('isILike should generate ILIKE', () => {
    const condition = new ConditionBuilder('AND');
    condition.isILike('name', '%john%');
    assert.equal(condition.build(), '(name ILIKE $1)');
    assert.deepEqual(condition.getValues(), ['%john%']);
  });

  it('isNotILike should generate NOT ILIKE', () => {
    const condition = new ConditionBuilder('AND');
    condition.isNotILike('name', '%test%');
    assert.equal(condition.build(), '(name NOT ILIKE $1)');
    assert.deepEqual(condition.getValues(), ['%test%']);
  });

  it('isILike with undefined should be ignored', () => {
    const condition = new ConditionBuilder('AND');
    condition.isILike('name', undefined);
    assert.equal(condition.build(), '(TRUE)');
  });

  it('isILike with Expression should work', () => {
    const condition = new ConditionBuilder('AND');
    condition.isILike('name', condition.expression("CONCAT('%', other_col, '%')"));
    assert.equal(condition.build(), "(name ILIKE CONCAT('%', other_col, '%'))");
    assert.deepEqual(condition.getValues(), []);
  });
});
