import { NextResponse } from "next/server";

export function proxy(request) {
  
    const session = request.cookies.get('session')

    if (!session && !request.nextUrl.pathname.startsWith('/login')) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    return NextResponse.next()

};

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};