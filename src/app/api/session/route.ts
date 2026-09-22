import { NextRequest, NextResponse } from 'next/server';
import {
  AUTH_COOKIE,
  AUTH_COOKIE_VERIFIED,
  AUTH_COOKIE_PENDING,
} from '@/lib/auth/session';

const ONE_WEEK = 60 * 60 * 24 * 7;
const ONE_DAY = 60 * 60 * 24;

/**
 * Sets a non-secret UI gate cookie (values are only "1" / "pending").
 * Firestore/Storage rules remain the authority boundary.
 */
export async function POST(request: NextRequest) {
  let body: { state?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const state = body.state;
  if (state !== 'verified' && state !== 'pending' && state !== 'cleared') {
    return NextResponse.json({ error: 'invalid_state' }, { status: 400 });
  }

  const res = NextResponse.json({ ok: true });
  const secure = request.nextUrl.protocol === 'https:';

  if (state === 'cleared') {
    res.cookies.set(AUTH_COOKIE, '', {
      path: '/',
      maxAge: 0,
      sameSite: 'lax',
      httpOnly: true,
      secure,
    });
    return res;
  }

  const value = state === 'verified' ? AUTH_COOKIE_VERIFIED : AUTH_COOKIE_PENDING;
  res.cookies.set(AUTH_COOKIE, value, {
    path: '/',
    maxAge: state === 'verified' ? ONE_WEEK : ONE_DAY,
    sameSite: 'lax',
    httpOnly: true,
    secure,
  });
  return res;
}

export async function DELETE(request: NextRequest) {
  const res = NextResponse.json({ ok: true });
  const secure = request.nextUrl.protocol === 'https:';
  res.cookies.set(AUTH_COOKIE, '', {
    path: '/',
    maxAge: 0,
    sameSite: 'lax',
    httpOnly: true,
    secure,
  });
  return res;
}
