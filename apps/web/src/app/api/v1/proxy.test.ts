import { describe, it, expect, vi, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from './[...path]/route';
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();});
describe('same-origin API proxy',()=>{
 it('uses only the server token, never a caller-supplied token',async()=>{
  vi.stubEnv('API_PROXY_TOKEN','server-test-value');
  const mock=vi.fn().mockResolvedValue(new Response('{}',{status:200}));
  vi.stubGlobal('fetch',mock);
  const response=await GET(new NextRequest('http://local/api/v1/events',{headers:{'X-TerraGuard-Proxy-Token':'forged'}}),{params:Promise.resolve({path:['events']})});
  expect(mock.mock.calls[0][1].headers['X-TerraGuard-Proxy-Token']).toBe('server-test-value');
  expect(response.headers.has('X-TerraGuard-Proxy-Token')).toBe(false);
 });
 it('preserves rate-limit retry guidance',async()=>{
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response('{}',{status:429,headers:{'Retry-After':'60'}})));
  const response=await GET(new NextRequest('http://local/api/v1/events'),{params:Promise.resolve({path:['events']})});
  expect(response.status).toBe(429);
  expect(response.headers.get('Retry-After')).toBe('60');
 });
 it('blocks public model retraining',async()=>{
  const response=await POST(new NextRequest('http://local/api/v1/predictions/train',{method:'POST'}),{params:Promise.resolve({path:['predictions','train']})});
  expect(response.status).toBe(404);
 });
 it('returns a useful error when the backend is down',async()=>{
  vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new Error('offline')));
  const response=await GET(new NextRequest('http://local/api/v1/events'),{params:Promise.resolve({path:['events']})});
  expect(response.status).toBe(503);
  expect((await response.json()).detail).toContain('temporarily unavailable');
 });
 it('preserves upstream response and query parameters',async()=>{
  const mock=vi.fn().mockResolvedValue(new Response('{"events":[]}',{status:200}));
  vi.stubGlobal('fetch',mock);
  const response=await GET(new NextRequest('http://local/api/v1/events?limit=10'),{params:Promise.resolve({path:['events']})});
  expect(response.status).toBe(200);
  expect(mock.mock.calls[0][0]).toContain('/api/v1/events?limit=10');
 });
});
