import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getPlaceholder } from '../src/dialects.ts';

describe('dialects', () => {
  describe('postgres', () => {
    it('should return $N placeholders', () => {
      const placeholder = getPlaceholder('postgres');
      assert.equal(placeholder(1), '$1');
      assert.equal(placeholder(2), '$2');
      assert.equal(placeholder(10), '$10');
    });
  });

  describe('mysql', () => {
    it('should always return ?', () => {
      const placeholder = getPlaceholder('mysql');
      assert.equal(placeholder(1), '?');
      assert.equal(placeholder(2), '?');
      assert.equal(placeholder(10), '?');
    });
  });
});
