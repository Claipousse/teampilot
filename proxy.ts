import { NextRequest, NextResponse } from 'next/server';

// Seule route accessible sans être connecté
const PUBLIC_ROUTES = ['/login'];

// Middleware exécuté sur chaque requête de page (hors /api, assets, images)
export default async function proxy(req: NextRequest) {
  const path  = req.nextUrl.pathname;
  const token = req.cookies.get('token')?.value;

  // Pas de token → redirige vers login (sauf si c'est déjà une route publique)
  if (!PUBLIC_ROUTES.includes(path) && !token) {
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }

  // Déjà connecté et tente d'accéder à /login → redirige vers le dashboard
  if (path === '/login' && token) {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl));
  }

  return NextResponse.next();
}

// Le matcher exclut les assets statiques et les routes /api pour ne pas intercepter les appels backend
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$|.*\\.ico$).*)'],
};
