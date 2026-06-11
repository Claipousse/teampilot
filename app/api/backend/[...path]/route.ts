import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// Toutes les requêtes /api/backend/* sont redirigées vers le FastAPI en ajoutant le Bearer token.
// Exemple : /api/backend/players?page=1  →  http://localhost:8000/api/v1/players?page=1
// Le [...path] capture n'importe quelle profondeur de chemin.
const BACKEND = 'http://localhost:8000/api/v1';

async function handler(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const token = (await cookies()).get('token')?.value;

  if (!token) {
    return NextResponse.json({ detail: 'Non authentifié' }, { status: 401 });
  }

  const targetUrl = `${BACKEND}/${path.join('/')}${req.nextUrl.search}`;
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };

  let body: string | undefined;
  // GET, HEAD, DELETE ne portent pas de body — les lire déclencherait une erreur
  if (!['GET', 'HEAD', 'DELETE'].includes(req.method)) {
    body = await req.text();
    if (body) headers['Content-Type'] = 'application/json';
  }

  try {
    const res  = await fetch(targetUrl, { method: req.method, headers, body });
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    return NextResponse.json(data, { status: res.status });
  } catch {
    // Le backend FastAPI est probablement arrêté
    return NextResponse.json({ detail: 'Backend non disponible' }, { status: 503 });
  }
}

export {
  handler as GET,
  handler as POST,
  handler as PATCH,
  handler as PUT,
  handler as DELETE,
};
