import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { ConditionBuilder } from '../../src/ConditionBuilder.ts';

describe('ConditionBuilder - dialect', () => {
  beforeEach(() => {
    ConditionBuilder.DIALECT = 'postgres';
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
