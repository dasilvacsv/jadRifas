// middleware.ts (versión COMPLETA Y CORRECTA)

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { getClientSessionFromCookie } from '@/lib/auth/client-auth-server' 

export async function middleware(req: NextRequest) {
  const internalUserToken = await getToken({ req });
  const clientSession = await getClientSessionFromCookie();
  
  const { pathname } = req.nextUrl;

  const isAdminSignInPage = pathname.startsWith('/sign-in');
  const isClientSignInPage = pathname.startsWith('/client/sign-in');
  
  const isAdminArea = pathname.startsWith('/dashboard') || pathname.startsWith('/empresa') || pathname.startsWith('/facturacion');
  const isClientArea = pathname.startsWith('/client/dashboard');

  // Si hay sesión de usuario INTERNO (admin, etc.)
  if (internalUserToken) {
    if (isAdminSignInPage) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    return NextResponse.next();
  }

  // Si hay sesión de CLIENTE FINAL (endUser)
  if (clientSession) {
    if (isAdminArea || isAdminSignInPage || isClientSignInPage) {
      return NextResponse.redirect(new URL('/client/dashboard', req.url));
    }
    return NextResponse.next();
  }
  
  // Si NO hay sesión y se intenta acceder a un área protegida
  if (!internalUserToken && !clientSession) {
    if (isAdminArea) {
      return NextResponse.redirect(new URL('/sign-in', req.url));
    }
    if (isClientArea) {
      const signInUrl = new URL('/client/sign-in', req.url);
      signInUrl.search = req.nextUrl.search;
      return NextResponse.redirect(signInUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/empresa/:path*',
    '/facturacion/:path*',
    '/client/dashboard/:path*',
    '/sign-in',
    '/client/sign-in',
  ],
}