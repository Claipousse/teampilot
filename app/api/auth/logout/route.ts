import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Supprime le cookie de session — le middleware redirigera automatiquement vers /login
export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete('token');
  return NextResponse.json({ ok: true });
}
