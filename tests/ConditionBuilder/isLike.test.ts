import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ConditionBuilder } from '../../src/ConditionBuilder.ts';

describe('ConditionBuilder - isLike / isNotLike', () => {
  it('isLike should generate LIKE', () => {
    const condition = new ConditionBuilder('AND');
    condition.isLike('name', '%john%');
    assert.equal(condition.build(), '(name LIKE $1)');
    assert.deepEqual(condition.getValues(), ['%john%']);
  });

  it('isNotLike should generate NOT LIKE', () => {
    const condition = new ConditionBuilder('AND');
    condition.isNotLike('name', '%test%');
    assert.equal(condition.build(), '(name NOT LIKE $1)');
    assert.deepEqual(condition.getValues(), ['%test%']);
  });

  it('isLike with undefined should be ignored', () => {
    const condition = new ConditionBuilder('AND');
    condition.isLike('name', undefined);
    assert.equal(condition.build(), '(TRUE)');
  });

  it('isNotLike with undefined should be ignored', () => {
    const condition = new ConditionBuilder('AND');
    condition.isNotLike('name', undefined);
    assert.equal(condition.build(), '(TRUE)');
  });

  it('isLike with Expression should work', () => {
    const condition = new ConditionBuilder('AND');
    condition.isLike('name', condition.expression("CONCAT('%', other_col, '%')"));
    assert.equal(condition.build(), "(name LIKE CONCAT('%', other_col, '%'))");
    assert.deepEqual(condition.getValues(), []);
  });

  it('isLike should be chainable', () => {
    const condition = new ConditionBuilder('AND');
    const result = condition
      .isEqual('active', true)
      .isLike('name', '%john%')
      .isNotLike('email', '%spam%')
      .build();
    assert.equal(result, '(active = $1 AND name LIKE $2 AND email NOT LIKE $3)');
    assert.deepEqual(condition.getValues(), [true, '%john%', '%spam%']);
  });

  it('isLike with mysql should use ?', () => {
    const condition = new ConditionBuilder('AND', 'mysql');
    condition.isLike('name', '%john%');
    assert.equal(condition.build(), '(name LIKE ?)');
    assert.deepEqual(condition.getValues(), ['%john%']);
  });
});
