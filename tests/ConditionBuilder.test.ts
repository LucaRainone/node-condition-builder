import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ConditionBuilder } from '../src/ConditionBuilder.ts';

describe('ConditionBuilder', () => {
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
