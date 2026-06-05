import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_ROUTES = ['/login'];

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const token = req.cookies.get('token')?.value;

  // Pas de token et route protégée → rediriger vers login
  if (!PUBLIC_ROUTES.includes(path) && !token) {
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }

  // Déjà connecté et accède à /login → rediriger vers dashboard
  if (path === '/login' && token) {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$|.*\\.ico$).*)'],
};
