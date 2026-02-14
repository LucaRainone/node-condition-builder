import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { NullCondition } from '../../src/conditions/NullCondition.ts';
import { getPlaceholder } from '../../src/dialects.ts';

describe('NullCondition', () => {
  const pgPlaceholder = getPlaceholder('postgres');

  it('should build IS NULL', () => {
    const cond = new NullCondition('id');
    assert.equal(cond.build(1, pgPlaceholder), 'id IS NULL');
  });

  it('should return empty values', () => {
    const cond = new NullCondition('id');
    assert.deepEqual(cond.getValues(), []);
  });
});
