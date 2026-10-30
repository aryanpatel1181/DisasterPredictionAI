import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
const allowed = new Set(['events','hazards','sources','health','location-risk','official-alerts','models','history','predictions','chat','analytics']);

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  if (!allowed.has(path[0]) || path.some(p => !/^[a-zA-Z0-9_.-]+$/.test(p)) || (request.method === 'POST' && !['chat','analytics'].includes(path[0]))) {
    return NextResponse.json({detail:'Route unavailable'}, {status:404});
  }
  const body = request.method === 'POST' ? await request.text() : undefined;
  if (body && body.length > 16000) return NextResponse.json({detail:'Message too large'}, {status:413});
  const origin = process.env.API_INTERNAL_URL || 'http://127.0.0.1:8000';
  const headers: Record<string, string> = {'Content-Type':'application/json'};
  if (process.env.API_PROXY_TOKEN) headers['X-TerraGuard-Proxy-Token'] = process.env.API_PROXY_TOKEN;
  try {
    const response = await fetch(origin + '/api/v1/' + path.map(encodeURIComponent).join('/') + request.nextUrl.search, {
      method:request.method, headers, body,
      cache:'no-store', signal:AbortSignal.timeout(50000),
    });
    return new NextResponse(await response.text(), {status:response.status, headers:{'Content-Type':'application/json','Cache-Control':'no-store', ...(response.headers.has('Retry-After') ? {'Retry-After':response.headers.get('Retry-After')!} : {})}});
  } catch {
    return NextResponse.json({detail:'The intelligence service is temporarily unavailable. Please try again shortly.'},{status:503});
  }
}
export const GET = proxy;
export const POST = proxy;
