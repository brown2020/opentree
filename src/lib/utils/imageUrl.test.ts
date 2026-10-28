import { describe, expect, it } from 'vitest';
import { isRenderableImageUrl } from './imageUrl';

describe('isRenderableImageUrl', () => {
  it('allows Firebase Storage and Google profile hosts over https', () => {
    expect(
      isRenderableImageUrl('https://firebasestorage.googleapis.com/v0/b/app/o/a.jpg?alt=media&token=abc')
    ).toBe(true);
    expect(isRenderableImageUrl('https://lh3.googleusercontent.com/a/photo')).toBe(true);
  });

  it('rejects other hosts, insecure urls, and junk', () => {
    expect(isRenderableImageUrl('https://example.com/a.jpg')).toBe(false);
    expect(isRenderableImageUrl('http://firebasestorage.googleapis.com/a.jpg')).toBe(false);
    expect(isRenderableImageUrl('javascript:alert(1)')).toBe(false);
    expect(isRenderableImageUrl(null)).toBe(false);
  });
});
