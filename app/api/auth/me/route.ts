import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:8000';

// Valide le token stocké en cookie et retourne l'utilisateur connecté.
// Utilisé par AuthContext au montage pour hydrater l'état de session.
export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    return NextResponse.json(null, { status: 401 });
  }

  const res = await fetch(`${BACKEND}/api/v1/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    return NextResponse.json(null, { status: 401 });
  }

  return NextResponse.json(await res.json());
}
