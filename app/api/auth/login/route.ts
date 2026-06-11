import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:8000';

export async function POST(req: NextRequest) {
  const body = await req.json();

  const res = await fetch(`${BACKEND}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    return NextResponse.json({ error: 'Identifiant ou mot de passe incorrect' }, { status: 401 });
  }

  const data = await res.json();
  const cookieStore = await cookies();

  // httpOnly empêche JavaScript de lire le cookie → protection contre le vol de token (XSS)
  // secure est activé uniquement en production car localhost n'est pas HTTPS
  // maxAge = 24h, cohérent avec l'expiration JWT côté backend
  cookieStore.set('token', data.access_token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   60 * 60 * 24,
    path:     '/',
  });

  return NextResponse.json({ user: data.user });
}
