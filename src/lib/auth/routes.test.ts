import { describe, it, expect } from 'vitest';
import {
  isProtectedRoute,
  isAuthEntryRoute,
  isPublicTreeRoute,
  shouldSkipMiddleware,
} from './routes';

describe('isPublicTreeRoute', () => {
  it('matches public tree viewing paths', () => {
    expect(isPublicTreeRoute('/tree/abc123/public')).toBe(true);
    expect(isPublicTreeRoute('/tree/abc123/public/')).toBe(true);
    expect(isPublicTreeRoute('/tree/abc123')).toBe(false);
    expect(isPublicTreeRoute('/person/xyz/public')).toBe(false);
  });
});

describe('isProtectedRoute', () => {
  it('protects dashboard routes', () => {
    expect(isProtectedRoute('/')).toBe(true);
    expect(isProtectedRoute('/settings')).toBe(true);
    expect(isProtectedRoute('/tree/abc123')).toBe(true);
    expect(isProtectedRoute('/person/xyz?tree=abc')).toBe(true);
  });

  it('allows public tree viewing without auth', () => {
    expect(isProtectedRoute('/tree/abc123/public')).toBe(false);
  });

  it('allows public auth routes', () => {
    expect(isProtectedRoute('/login')).toBe(false);
    expect(isProtectedRoute('/verify-email')).toBe(false);
    expect(isProtectedRoute('/email-link')).toBe(false);
  });
});

describe('isAuthEntryRoute', () => {
  it('matches login entry points', () => {
    expect(isAuthEntryRoute('/login')).toBe(true);
    expect(isAuthEntryRoute('/signup')).toBe(true);
    expect(isAuthEntryRoute('/forgot-password')).toBe(true);
    expect(isAuthEntryRoute('/verify-email')).toBe(false);
  });
});

describe('shouldSkipMiddleware', () => {
  it('skips Next.js internals and static assets', () => {
    expect(shouldSkipMiddleware('/_next/static/chunk.js')).toBe(true);
    expect(shouldSkipMiddleware('/favicon.ico')).toBe(true);
    expect(shouldSkipMiddleware('/logo.png')).toBe(true);
    expect(shouldSkipMiddleware('/login')).toBe(false);
  });
});
