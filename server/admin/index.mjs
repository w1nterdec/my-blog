import { createServer } from 'node:http';
import { randomBytes, timingSafeEqual } from 'node:crypto';
export function createAdminServer(config = process.env, fetcher = fetch) {
  const origin = new URL(config.ADMIN_ORIGIN ?? 'https://chenzhixing.bbroot.com').origin;
  const owner = config.ADMIN_GITHUB_USER ?? 'w1nterdec';
  const callback = `${origin}/api/admin/callback`;
  const pending = new Map();
  const secure = origin.startsWith('https:');
  const cookie = (value, age) => `zhixing_oauth=${value}; HttpOnly; SameSite=Lax; Path=/api/admin/; Max-Age=${age}${secure ? '; Secure' : ''}`;
  const github = async (path, token) => {
    const response = await fetcher(`https://api.github.com${path}`, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'User-Agent':'zhixing-admin' }, signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error('GitHub authentication failed');
    return response.json();
  };
  return createServer(async (req, res) => {
    res.setHeader('Cache-Control','no-store');
    res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('Referrer-Policy','no-referrer');
    const reply = (status, message) => { res.writeHead(status, { 'Content-Type':'text/plain; charset=utf-8' }); res.end(message); };
    try {
      const url = new URL(req.url, origin);
      if (req.method !== 'GET') return reply(405, 'Method not allowed');
      if (url.pathname === '/api/admin/health') return reply(config.ADMIN_CLIENT_ID && config.ADMIN_CLIENT_SECRET ? 200 : 503, config.ADMIN_CLIENT_ID && config.ADMIN_CLIENT_SECRET ? 'ready' : 'OAuth 尚未配置');
      if (!config.ADMIN_CLIENT_ID || !config.ADMIN_CLIENT_SECRET) return reply(503,'请先配置独立 GitHub OAuth 应用，后台操作说明中有接入步骤。');
      if (url.pathname === '/api/admin/auth') {
        for (const [key, expires] of pending) if (expires < Date.now()) pending.delete(key);
        if (pending.size >= 100) return reply(429,'Please retry later');
        if (url.searchParams.get('provider') !== 'github') return reply(400,'Unsupported provider');
        const state = randomBytes(32).toString('hex');
        pending.set(state, Date.now()+300000);
        const authorization = new URL('https://github.com/login/oauth/authorize');
        authorization.search = new URLSearchParams({client_id:config.ADMIN_CLIENT_ID,redirect_uri:callback,scope:'repo',state}).toString();
        res.writeHead(302, { Location:authorization.href, 'Set-Cookie':cookie(state,300) }); res.end(); return;
      }
      if (url.pathname === '/api/admin/callback') {
        const state = url.searchParams.get('state') ?? '';
        const stored = req.headers.cookie?.split(';').map(s=>s.trim()).find(s=>s.startsWith('zhixing_oauth='))?.slice(14) ?? '';
        const expiry = pending.get(state); pending.delete(state);
        res.setHeader('Set-Cookie',cookie('',0));
        if (!expiry || expiry < Date.now() || state.length !== 64 || stored.length !== 64 || !timingSafeEqual(Buffer.from(state),Buffer.from(stored))) return reply(403,'Invalid or expired OAuth state');
        const code = url.searchParams.get('code');
        if (!code || url.searchParams.has('error')) return reply(403,'Authorization cancelled');
        const response = await fetcher('https://github.com/login/oauth/access_token', { method:'POST',headers:{Accept:'application/json','Content-Type':'application/json'},body:JSON.stringify({client_id:config.ADMIN_CLIENT_ID,client_secret:config.ADMIN_CLIENT_SECRET,code,redirect_uri:callback}),signal:AbortSignal.timeout(15000) });
        if (!response.ok) return reply(502,'GitHub exchange failed');
        const result = await response.json();
        if (!result.access_token) return reply(403,'GitHub authorization failed');
        const user = await github('/user',result.access_token);
        if (user.login.toLowerCase() !== owner.toLowerCase()) {
          await fetcher(`https://api.github.com/applications/${config.ADMIN_CLIENT_ID}/token`, {method:'DELETE',headers:{Authorization:`Basic ${Buffer.from(`${config.ADMIN_CLIENT_ID}:${config.ADMIN_CLIENT_SECRET}`).toString('base64')}`,'Content-Type':'application/json'},body:JSON.stringify({access_token:result.access_token}),signal:AbortSignal.timeout(15000)});
          return reply(403,'Only the site owner can sign in');
        }
        const nonce = randomBytes(16).toString('hex');
        const safe = value => JSON.stringify(value).replace(/</g,'\\u003c');
        const payload = `authorization:github:success:${JSON.stringify({token:result.access_token,provider:'github'})}`;
        res.writeHead(200, {'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':`default-src 'none'; script-src 'nonce-${nonce}'; base-uri 'none'; frame-ancestors 'none'`});
        res.end(`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>知行 · 登录完成</title><p>登录完成，正在回到管理后台。</p><script nonce="${nonce}">const origin=${safe(origin)};window.addEventListener('message',function receive(event){if(event.origin!==origin||event.source!==window.opener||event.data!=='authorizing:github')return;window.removeEventListener('message',receive);window.opener.postMessage(${safe(payload)},origin);});window.opener?.postMessage('authorizing:github',origin);</script></html>`); return;
      }
      return reply(404,'Not found');
    } catch { reply(502,'认证服务暂时不可用，请稍后重试。'); }
  });
}
if (process.argv[1]?.replace(/\\/g,'/').endsWith('/server/admin/index.mjs')) {
  const server = createAdminServer();
  server.requestTimeout=20000; server.headersTimeout=15000;
  server.listen(Number(process.env.ADMIN_PORT ?? 4322),'127.0.0.1');
}
