import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ConditionBuilder } from '../../src/ConditionBuilder.ts';

describe('ConditionBuilder - append', () => {
  it('should nest an OR builder inside AND', () => {
    const condition = new ConditionBuilder('AND');
    condition.isEqual('id', 2);
    condition.append(new ConditionBuilder('OR').isEqual('id2', 3).isEqual('id3', 4));
    assert.equal(condition.build(), '(id = $1 AND (id2 = $2 OR id3 = $3))');
    assert.deepEqual(condition.getValues(), [2, 3, 4]);
  });

  it('should nest an AND builder inside OR', () => {
    const condition = new ConditionBuilder('OR');
    condition.append(new ConditionBuilder('AND').isEqual('a', 1).isEqual('b', 2));
    condition.isEqual('c', 3);
    assert.equal(condition.build(), '((a = $1 AND b = $2) OR c = $3)');
    assert.deepEqual(condition.getValues(), [1, 2, 3]);
  });

  it('should handle empty nested builder', () => {
    const condition = new ConditionBuilder('AND');
    condition.isEqual('id', 1);
    condition.append(new ConditionBuilder('OR'));
    assert.equal(condition.build(), '(id = $1 AND (FALSE))');
    assert.deepEqual(condition.getValues(), [1]);
  });

  it('should handle deeply nested builders', () => {
    const inner = new ConditionBuilder('AND')
      .isEqual('a', 1)
      .isEqual('b', 2);
    const middle = new ConditionBuilder('OR')
      .append(inner)
      .isEqual('c', 3);
    const outer = new ConditionBuilder('AND')
      .isEqual('d', 4)
      .append(middle);
    assert.equal(outer.build(), '(d = $1 AND ((a = $2 AND b = $3) OR c = $4))');
    assert.deepEqual(outer.getValues(), [4, 1, 2, 3]);
  });

  it('should be chainable', () => {
    const result = new ConditionBuilder('AND')
      .isEqual('id', 1)
      .append(new ConditionBuilder('OR').isEqual('a', 2).isEqual('b', 3))
      .isNull('deleted_at', true)
      .build();
    assert.equal(result, '(id = $1 AND (a = $2 OR b = $3) AND deleted_at IS NULL)');
  });

  it('should work with mysql dialect', () => {
    const condition = new ConditionBuilder('AND', 'mysql');
    condition.isEqual('id', 1);
    condition.append(new ConditionBuilder('OR').isEqual('a', 2).isEqual('b', 3));
    assert.equal(condition.build(), '(id = ? AND (a = ? OR b = ?))');
    assert.deepEqual(condition.getValues(), [1, 2, 3]);
  });
});
