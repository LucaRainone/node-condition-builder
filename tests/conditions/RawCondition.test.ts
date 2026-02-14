import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { RawCondition } from '../../src/conditions/RawCondition.ts';
import { getPlaceholder } from '../../src/dialects.ts';

describe('RawCondition', () => {
  const pgPlaceholder = getPlaceholder('postgres');
  const mysqlPlaceholder = getPlaceholder('mysql');

  it('should build raw SQL without placeholders', () => {
    const cond = new RawCondition('1 = 1');
    assert.equal(cond.build(1, pgPlaceholder), '1 = 1');
    assert.deepEqual(cond.getValues(), []);
  });

  it('should replace ? with postgres placeholders', () => {
    const cond = new RawCondition('ST_Distance(point, ?) < ?', [{ x: 1, y: 2 }, 100]);
    assert.equal(cond.build(1, pgPlaceholder), 'ST_Distance(point, $1) < $2');
    assert.deepEqual(cond.getValues(), [{ x: 1, y: 2 }, 100]);
  });

  it('should use correct startIndex', () => {
    const cond = new RawCondition('field > ? AND field < ?', [10, 20]);
    assert.equal(cond.build(5, pgPlaceholder), 'field > $5 AND field < $6');
    assert.deepEqual(cond.getValues(), [10, 20]);
  });

  it('should replace ? with mysql placeholders', () => {
    const cond = new RawCondition('JSON_CONTAINS(data, ?)', ['{"key":"val"}']);
    assert.equal(cond.build(1, mysqlPlaceholder), 'JSON_CONTAINS(data, ?)');
    assert.deepEqual(cond.getValues(), ['{"key":"val"}']);
  });

  it('should preserve escaped \\? as literal ?', () => {
    const cond = new RawCondition('col::jsonb \\? ? AND other = ?', ['key', 'val']);
    assert.equal(cond.build(1, pgPlaceholder), 'col::jsonb ? $1 AND other = $2');
    assert.deepEqual(cond.getValues(), ['key', 'val']);
  });

  it('should handle only escaped \\? with no placeholders', () => {
    const cond = new RawCondition('col::jsonb \\? \'key\'');
    assert.equal(cond.build(1, pgPlaceholder), 'col::jsonb ? \'key\'');
    assert.deepEqual(cond.getValues(), []);
  });

  it('should handle mixed escaped and unescaped', () => {
    const cond = new RawCondition('a \\? b AND c = ? AND d \\? e', ['val']);
    assert.equal(cond.build(3, pgPlaceholder), 'a ? b AND c = $3 AND d ? e');
    assert.deepEqual(cond.getValues(), ['val']);
  });
});
