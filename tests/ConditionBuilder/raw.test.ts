import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ConditionBuilder } from '../../src/ConditionBuilder.ts';

describe('ConditionBuilder - raw', () => {
  it('should add a raw SQL condition without values', () => {
    const condition = new ConditionBuilder('AND');
    condition.isEqual('id', 1);
    condition.raw('active IS TRUE');
    assert.equal(condition.build(), '(id = $1 AND active IS TRUE)');
    assert.deepEqual(condition.getValues(), [1]);
  });

  it('should add a raw SQL condition with values', () => {
    const condition = new ConditionBuilder('AND');
    condition.raw('ST_Distance(point, ?) < ?', [{ x: 1, y: 2 }, 100]);
    assert.equal(condition.build(), '(ST_Distance(point, $1) < $2)');
    assert.deepEqual(condition.getValues(), [{ x: 1, y: 2 }, 100]);
  });

  it('should track placeholder indexes with other conditions', () => {
    const condition = new ConditionBuilder('AND');
    condition.isEqual('name', 'test');
    condition.raw('LENGTH(bio) > ?', [50]);
    condition.isEqual('active', true);
    assert.equal(condition.build(), '(name = $1 AND LENGTH(bio) > $2 AND active = $3)');
    assert.deepEqual(condition.getValues(), ['test', 50, true]);
  });

  it('should be chainable', () => {
    const result = new ConditionBuilder('AND')
      .isEqual('id', 1)
      .raw('score > ?', [100])
      .isNull('deleted_at', true)
      .build();
    assert.equal(result, '(id = $1 AND score > $2 AND deleted_at IS NULL)');
  });

  it('should work with mysql dialect', () => {
    const condition = new ConditionBuilder('AND', 'mysql');
    condition.raw('JSON_CONTAINS(data, ?, ?)', ['key', 'val']);
    assert.equal(condition.build(), '(JSON_CONTAINS(data, ?, ?))');
    assert.deepEqual(condition.getValues(), ['key', 'val']);
  });

  it('should skip when all values are undefined', () => {
    const condition = new ConditionBuilder('AND');
    condition.raw('? > col', [undefined]);
    assert.equal(condition.build(), '(TRUE)');
    assert.deepEqual(condition.getValues(), []);
  });

  it('should skip when all values are undefined (multiple)', () => {
    const condition = new ConditionBuilder('AND');
    condition.raw('? BETWEEN col1 AND ?', [undefined, undefined]);
    assert.equal(condition.build(), '(TRUE)');
    assert.deepEqual(condition.getValues(), []);
  });

  it('should throw when mixing undefined and defined values (defined first)', () => {
    const condition = new ConditionBuilder('AND');
    assert.throws(() => condition.raw('? BETWEEN col1 AND ?', [42, undefined]), {
      message: 'raw() does not accept a mix of undefined and defined values',
    });
  });

  it('should throw when mixing undefined and defined values (undefined first)', () => {
    const condition = new ConditionBuilder('AND');
    assert.throws(() => condition.raw('? BETWEEN col1 AND ?', [undefined, 42]), {
      message: 'raw() does not accept a mix of undefined and defined values',
    });
  });

  it('should still add static SQL without values', () => {
    const condition = new ConditionBuilder('AND');
    condition.raw('active IS TRUE');
    assert.equal(condition.build(), '(active IS TRUE)');
    assert.deepEqual(condition.getValues(), []);
  });

  it('should still add when values is empty array', () => {
    const condition = new ConditionBuilder('AND');
    condition.raw('active IS TRUE', []);
    assert.equal(condition.build(), '(active IS TRUE)');
    assert.deepEqual(condition.getValues(), []);
  });
});
