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
    condition.isGreater('id', undefined);
    condition.isLess('id', undefined);
    condition.isLessOrEqual('id', undefined);
    condition.isGreaterOrEqual('id', undefined);
    condition.isBetween('id', undefined, undefined);
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

  it('fill values should work (requirements test)', () => {
    const condition = new ConditionBuilder('AND');
    condition.isEqual('id1', 1);
    condition.isGreater('id2', 2);
    condition.isLess('id3', 3);
    condition.isLessOrEqual('id4', 4);
    condition.isEqual('date', condition.expression('NOW()'));
    condition.isGreaterOrEqual('id5', 5);
    condition.isBetween('id6', 6, 7);
    condition.isNull('id7', true);
    condition.isEqual('id8', 8);

    assert.equal(
      condition.build(),
      '(id1 = $1 AND id2 > $2 AND id3 < $3 AND id4 <= $4 AND date = NOW() AND id5 >= $5 AND (id6 BETWEEN $6 AND $7) AND id7 IS NULL AND id8 = $8)',
    );
    assert.deepEqual(condition.getValues(), [1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('OR mode should join with OR', () => {
    const condition = new ConditionBuilder('OR');
    condition.isEqual('a', 1);
    condition.isEqual('b', 2);
    assert.equal(condition.build(), '(a = $1 OR b = $2)');
    assert.deepEqual(condition.getValues(), [1, 2]);
  });

  describe('isBetween', () => {
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

  describe('isIn', () => {
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

  describe('comparison methods', () => {
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

  describe('isLike / isNotLike', () => {
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

  describe('isILike / isNotILike', () => {
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

  describe('raw', () => {
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

  describe('negated methods', () => {
    it('isNotEqual should generate !=', () => {
      const condition = new ConditionBuilder('AND');
      condition.isNotEqual('status', 'deleted');
      assert.equal(condition.build(), '(status != $1)');
      assert.deepEqual(condition.getValues(), ['deleted']);
    });

    it('isNotEqual with Expression should work', () => {
      const condition = new ConditionBuilder('AND');
      condition.isNotEqual('date', condition.expression('NOW()'));
      assert.equal(condition.build(), '(date != NOW())');
      assert.deepEqual(condition.getValues(), []);
    });

    it('isNotEqual with undefined should be ignored', () => {
      const condition = new ConditionBuilder('AND');
      condition.isNotEqual('id', undefined);
      assert.equal(condition.build(), '(TRUE)');
    });

    it('isNotNull should generate IS NOT NULL', () => {
      const condition = new ConditionBuilder('AND');
      condition.isNotNull('deleted_at', true);
      assert.equal(condition.build(), '(deleted_at IS NOT NULL)');
      assert.deepEqual(condition.getValues(), []);
    });

    it('isNotNull with false should be ignored', () => {
      const condition = new ConditionBuilder('AND');
      condition.isNotNull('id', false);
      assert.equal(condition.build(), '(TRUE)');
    });

    it('isNotIn should generate NOT IN', () => {
      const condition = new ConditionBuilder('AND');
      condition.isNotIn('status', ['deleted', 'archived']);
      assert.equal(condition.build(), '(status NOT IN ($1, $2))');
      assert.deepEqual(condition.getValues(), ['deleted', 'archived']);
    });

    it('isNotIn with Expression should work', () => {
      const condition = new ConditionBuilder('AND');
      condition.isNotIn('id', [condition.expression('SELECT id FROM banned'), 1]);
      assert.equal(condition.build(), '(id NOT IN (SELECT id FROM banned, $1))');
      assert.deepEqual(condition.getValues(), [1]);
    });

    it('isNotIn with undefined should be ignored', () => {
      const condition = new ConditionBuilder('AND');
      condition.isNotIn('id', undefined);
      assert.equal(condition.build(), '(TRUE)');
    });

    it('isNotBetween should generate NOT BETWEEN', () => {
      const condition = new ConditionBuilder('AND');
      condition.isNotBetween('age', 18, 65);
      assert.equal(condition.build(), '((age NOT BETWEEN $1 AND $2))');
      assert.deepEqual(condition.getValues(), [18, 65]);
    });

    it('isNotBetween with only from should generate <', () => {
      const condition = new ConditionBuilder('AND');
      condition.isNotBetween('age', 18, undefined);
      assert.equal(condition.build(), '(age < $1)');
      assert.deepEqual(condition.getValues(), [18]);
    });

    it('isNotBetween with only to should generate >', () => {
      const condition = new ConditionBuilder('AND');
      condition.isNotBetween('age', undefined, 65);
      assert.equal(condition.build(), '(age > $1)');
      assert.deepEqual(condition.getValues(), [65]);
    });

    it('isNotBetween with both undefined should be ignored', () => {
      const condition = new ConditionBuilder('AND');
      condition.isNotBetween('age', undefined, undefined);
      assert.equal(condition.build(), '(TRUE)');
    });

    it('isNotBetween should throw on null', () => {
      const condition = new ConditionBuilder('AND');
      assert.throws(() => condition.isNotBetween('age', null, 65));
    });

    it('negated methods should be chainable', () => {
      const condition = new ConditionBuilder('AND');
      const result = condition
        .isNotEqual('status', 'deleted')
        .isNotNull('email', true)
        .isNotIn('role', ['banned'])
        .isNotBetween('age', 0, 12)
        .build();
      assert.equal(result, '(status != $1 AND email IS NOT NULL AND role NOT IN ($2) AND (age NOT BETWEEN $3 AND $4))');
      assert.deepEqual(condition.getValues(), ['deleted', 'banned', 0, 12]);
    });
  });

  describe('append', () => {
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

  it('comprehensive integration: all conditions with undefined no-ops, sequential placeholders', () => {
    const condition = new ConditionBuilder('AND');

    condition
      // $1
      .isEqual('status', 'active')
      // skipped: undefined
      .isEqual('ghost_field', undefined)
      // $2
      .isNotEqual('role', 'banned')
      // skipped: undefined
      .isNotEqual('other', undefined)
      // $3
      .isGreater('age', 18)
      // skipped: undefined
      .isGreater('nope', undefined)
      // $4
      .isGreaterOrEqual('score', 50)
      // skipped: undefined
      .isGreaterOrEqual('x', undefined)
      // $5
      .isLess('price', 1000)
      // skipped: undefined
      .isLess('y', undefined)
      // $6
      .isLessOrEqual('weight', 99.9)
      // skipped: undefined
      .isLessOrEqual('z', undefined)
      // $7
      .isNotGreater('retries', 5)
      // skipped: undefined
      .isNotGreater('w', undefined)
      // $8
      .isNotLess('priority', 1)
      // no value (Expression)
      .isEqual('updated_at', condition.expression('NOW()'))
      // $9, $10
      .isBetween('created_at', '2024-01-01', '2024-12-31')
      // skipped: both undefined
      .isBetween('skip_field', undefined, undefined)
      // $11 (partial: only from → >=)
      .isBetween('start_date', '2024-06-01', undefined)
      // $12 (partial: only to → <=)
      .isBetween('end_date', undefined, '2024-12-31')
      // $13, $14, $15
      .isIn('category', ['electronics', 'books', 'toys'])
      // skipped: undefined
      .isIn('tags', undefined)
      // $16, $17
      .isNotIn('status_code', [999, 0])
      // skipped: undefined
      .isNotIn('codes', undefined)
      // no value (IS NULL)
      .isNull('deleted_at', true)
      // skipped: false
      .isNull('other_field', false)
      // no value (IS NOT NULL)
      .isNotNull('email', true)
      // skipped: false
      .isNotNull('phone', false)
      // skipped: undefined
      .isNotNull('fax', undefined)
      // $18
      .isLike('name', '%john%')
      // skipped: undefined
      .isLike('surname', undefined)
      // $19
      .isNotLike('bio', '%spam%')
      // $20
      .isILike('city', '%new york%')
      // skipped: undefined
      .isILike('state', undefined)
      // $21
      .isNotILike('country', '%test%')
      // $22, $23 (raw with 2 placeholders)
      .raw('ST_Distance(location, ?) < ?', [{ lat: 40, lng: -74 }, 100])
      // no value (raw without placeholders)
      .raw('verified IS TRUE')
      // $24, $25 (nested OR)
      .append(
        new ConditionBuilder('OR')
          .isEqual('tier', 'premium')
          .isEqual('tier', 'enterprise')
      )
      // $26, $27 (isNotBetween)
      .isNotBetween('discount', 0, 10);

    const sql = condition.build();
    const values = condition.getValues();

    assert.equal(
      sql,
      '(' +
        'status = $1' +
        ' AND role != $2' +
        ' AND age > $3' +
        ' AND score >= $4' +
        ' AND price < $5' +
        ' AND weight <= $6' +
        ' AND retries <= $7' +
        ' AND priority >= $8' +
        ' AND updated_at = NOW()' +
        ' AND (created_at BETWEEN $9 AND $10)' +
        ' AND start_date >= $11' +
        ' AND end_date <= $12' +
        ' AND category IN ($13, $14, $15)' +
        ' AND status_code NOT IN ($16, $17)' +
        ' AND deleted_at IS NULL' +
        ' AND email IS NOT NULL' +
        ' AND name LIKE $18' +
        ' AND bio NOT LIKE $19' +
        ' AND city ILIKE $20' +
        ' AND country NOT ILIKE $21' +
        ' AND ST_Distance(location, $22) < $23' +
        ' AND verified IS TRUE' +
        ' AND (tier = $24 OR tier = $25)' +
        ' AND (discount NOT BETWEEN $26 AND $27)' +
      ')',
    );

    assert.deepEqual(values, [
      'active',                   // $1  isEqual status
      'banned',                   // $2  isNotEqual role
      18,                         // $3  isGreater age
      50,                         // $4  isGreaterOrEqual score
      1000,                       // $5  isLess price
      99.9,                       // $6  isLessOrEqual weight
      5,                          // $7  isNotGreater retries
      1,                          // $8  isNotLess priority
      // (Expression: no value)
      '2024-01-01', '2024-12-31', // $9, $10  isBetween created_at
      // (both undefined: skipped)
      '2024-06-01',               // $11 isBetween partial (from only)
      '2024-12-31',               // $12 isBetween partial (to only)
      'electronics', 'books', 'toys', // $13, $14, $15  isIn
      // (isIn undefined: skipped)
      999, 0,                     // $16, $17  isNotIn
      // (isNotIn undefined: skipped)
      // (IS NULL: no value)
      // (IS NOT NULL: no value)
      '%john%',                   // $18 isLike
      '%spam%',                   // $19 isNotLike
      '%new york%',               // $20 isILike
      '%test%',                   // $21 isNotILike
      { lat: 40, lng: -74 }, 100, // $22, $23 raw
      // (raw static: no value)
      'premium', 'enterprise',    // $24, $25 append (nested OR)
      0, 10,                      // $26, $27 isNotBetween
    ]);

    // Verify count: 27 placeholders, 27 values
    assert.equal(values.length, 27);
  });
});
