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
});
