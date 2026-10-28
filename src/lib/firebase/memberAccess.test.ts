import { describe, expect, it } from 'vitest';
import { isEditorAccess, memberIdsAddsOnlySelf } from './memberAccess';

describe('memberIdsAddsOnlySelf', () => {
  it('allows the caller to append only their own uid', () => {
    expect(memberIdsAddsOnlySelf(['a', 'b'], ['a', 'b', 'me'], 'me')).toBe(true);
  });

  it('rejects replacing the member list', () => {
    expect(memberIdsAddsOnlySelf(['a', 'b'], ['me'], 'me')).toBe(false);
  });

  it('rejects adding a second uid along with the caller', () => {
    expect(memberIdsAddsOnlySelf(['a'], ['a', 'me', 'other'], 'me')).toBe(false);
  });

  it('rejects a caller who is already a member', () => {
    expect(memberIdsAddsOnlySelf(['me'], ['me', 'other'], 'me')).toBe(false);
  });
});

describe('isEditorAccess', () => {
  it('is true only for accessLevel editor', () => {
    expect(isEditorAccess('editor')).toBe(true);
    expect(isEditorAccess('viewer')).toBe(false);
    expect(isEditorAccess(undefined)).toBe(false);
  });
});
