import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { ConditionBuilder } from '../src/ConditionBuilder.ts';

describe('ConditionBuilder', () => {
  beforeEach(() => {
    ConditionBuilder.DIALECT = 'postgres';
  });

  it('Empty condition in AND', () => {
    const condition = new ConditionBuilder('AND');
    assert.equal(condition.build(), '(TRUE)');
    assert.deepEqual(condition.getValues(), []);
  });

  it('Empty condition in OR', () => {
    const condition = new ConditionBuilder('OR');
    assert.equal(condition.build(), '(FALSE)');
    assert.deepEqual(condition.getValues(), []);
  });

  it('Undefined values should be ignored', () => {
    const condition = new ConditionBuilder('AND');
    condition.isEqual('id', undefined);
    condition.isNull('id', false);
    assert.equal(condition.build(), '(TRUE)');
    assert.deepEqual(condition.getValues(), []);
  });

  it('isNull with undefined should be ignored', () => {
    const condition = new ConditionBuilder('AND');
    condition.isNull('id', undefined);
    assert.equal(condition.build(), '(TRUE)');
    assert.deepEqual(condition.getValues(), []);
  });

  it('isEqual with value should work', () => {
    const condition = new ConditionBuilder('AND');
    condition.isEqual('id', 1);
    assert.equal(condition.build(), '(id = $1)');
    assert.deepEqual(condition.getValues(), [1]);
  });

  it('isEqual with Expression should work', () => {
    const condition = new ConditionBuilder('AND');
    condition.isEqual('date', condition.expression('NOW()'));
    assert.equal(condition.build(), '(date = NOW())');
    assert.deepEqual(condition.getValues(), []);
  });

  it('isNull with true should work', () => {
    const condition = new ConditionBuilder('AND');
    condition.isNull('id', true);
    assert.equal(condition.build(), '(id IS NULL)');
    assert.deepEqual(condition.getValues(), []);
  });

  it('fill values should work with isEqual and isNull', () => {
    const condition = new ConditionBuilder('AND');
    condition.isEqual('id1', 1);
    condition.isEqual('date', condition.expression('NOW()'));
    condition.isNull('id7', true);
    condition.isEqual('id8', 8);

    assert.equal(
      condition.build(),
      '(id1 = $1 AND date = NOW() AND id7 IS NULL AND id8 = $2)',
    );
    assert.deepEqual(condition.getValues(), [1, 8]);
  });

  it('OR mode should join with OR', () => {
    const condition = new ConditionBuilder('OR');
    condition.isEqual('a', 1);
    condition.isEqual('b', 2);
    assert.equal(condition.build(), '(a = $1 OR b = $2)');
    assert.deepEqual(condition.getValues(), [1, 2]);
  });

  describe('chaining', () => {
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

  describe('mysql dialect', () => {
    it('should use ? placeholders', () => {
      const condition = new ConditionBuilder('AND', 'mysql');
      condition.isEqual('id', 1);
      condition.isEqual('name', 'test');
      assert.equal(condition.build(), '(id = ? AND name = ?)');
      assert.deepEqual(condition.getValues(), [1, 'test']);
    });
  });

  describe('global dialect', () => {
    it('should use global DIALECT when no override', () => {
      ConditionBuilder.DIALECT = 'mysql';
      const condition = new ConditionBuilder('AND');
      condition.isEqual('id', 1);
      assert.equal(condition.build(), '(id = ?)');
    });

    it('should allow instance override of global DIALECT', () => {
      ConditionBuilder.DIALECT = 'mysql';
      const condition = new ConditionBuilder('AND', 'postgres');
      condition.isEqual('id', 1);
      assert.equal(condition.build(), '(id = $1)');
    });
  });
});
