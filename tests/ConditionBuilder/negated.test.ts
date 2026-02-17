import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ConditionBuilder } from '../../src/ConditionBuilder.ts';

describe('ConditionBuilder - negated methods', () => {
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
    // @ts-expect-error testing runtime guard for JS consumers
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
