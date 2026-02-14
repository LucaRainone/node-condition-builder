import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ConditionBuilder } from '../../src/ConditionBuilder.ts';

describe('ConditionBuilder - chaining', () => {
  it('should chain multiple isEqual calls', () => {
    const condition = new ConditionBuilder('AND');
    const result = condition.isEqual('id', 1).isEqual('name', 'test').build();
    assert.equal(result, '(id = $1 AND name = $2)');
    assert.deepEqual(condition.getValues(), [1, 'test']);
  });

  it('should chain multiple isNull calls', () => {
    const condition = new ConditionBuilder('AND');
    const result = condition.isNull('a', true).isNull('b', true).build();
    assert.equal(result, '(a IS NULL AND b IS NULL)');
    assert.deepEqual(condition.getValues(), []);
  });

  it('should chain isEqual and isNull together', () => {
    const condition = new ConditionBuilder('AND');
    const result = condition
      .isEqual('id', 1)
      .isNull('deleted_at', true)
      .isEqual('status', 'active')
      .build();
    assert.equal(result, '(id = $1 AND deleted_at IS NULL AND status = $2)');
    assert.deepEqual(condition.getValues(), [1, 'active']);
  });

  it('should chain even when values are ignored', () => {
    const condition = new ConditionBuilder('AND');
    const result = condition
      .isEqual('id', undefined)
      .isNull('field', false)
      .isEqual('name', 'test')
      .build();
    assert.equal(result, '(name = $1)');
    assert.deepEqual(condition.getValues(), ['test']);
  });
});
