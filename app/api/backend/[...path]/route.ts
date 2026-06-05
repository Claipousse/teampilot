import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

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
  if (!['GET', 'HEAD', 'DELETE'].includes(req.method)) {
    body = await req.text();
    if (body) headers['Content-Type'] = 'application/json';
  }

  try {
    const res = await fetch(targetUrl, { method: req.method, headers, body });
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    return NextResponse.json(data, { status: res.status });
  } catch {
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
