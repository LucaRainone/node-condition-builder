import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ConditionBuilder } from '../../src/ConditionBuilder.ts';

describe('ConditionBuilder - isIn', () => {
  it('should generate IN clause', () => {
    const condition = new ConditionBuilder('AND');
    condition.isIn('id', [1, 2, 3]);
    assert.equal(condition.build(), '(id IN ($1, $2, $3))');
    assert.deepEqual(condition.getValues(), [1, 2, 3]);
  });

  it('should be ignored when undefined', () => {
    const condition = new ConditionBuilder('AND');
    condition.isIn('id', undefined);
    assert.equal(condition.build(), '(TRUE)');
    assert.deepEqual(condition.getValues(), []);
  });

  it('should handle Expression values', () => {
    const condition = new ConditionBuilder('AND');
    condition.isIn('status', [condition.expression('DEFAULT'), 'active']);
    assert.equal(condition.build(), '(status IN (DEFAULT, $1))');
    assert.deepEqual(condition.getValues(), ['active']);
  });

  it('should track placeholder indexes correctly with other conditions', () => {
    const condition = new ConditionBuilder('AND');
    condition.isEqual('name', 'test');
    condition.isIn('id', [1, 2]);
    condition.isEqual('status', 'active');
    assert.equal(condition.build(), '(name = $1 AND id IN ($2, $3) AND status = $4)');
    assert.deepEqual(condition.getValues(), ['test', 1, 2, 'active']);
  });

  it('should be chainable', () => {
    const condition = new ConditionBuilder('AND');
    const result = condition
      .isEqual('active', true)
      .isIn('role', ['admin', 'editor'])
      .build();
    assert.equal(result, '(active = $1 AND role IN ($2, $3))');
    assert.deepEqual(condition.getValues(), [true, 'admin', 'editor']);
  });
});
