import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runInNewContext } from 'node:vm';
import { createAdminServer } from '../server/admin/index.mjs';

async function callbackScript(localOrigin) {
  const server = createAdminServer({ADMIN_ORIGIN:'https://chenzhixing.bbroot.com',ADMIN_CLIENT_ID:'test',ADMIN_CLIENT_SECRET:'test',ADMIN_GITHUB_USER:'w1nterdec',ADMIN_LOCAL_EDITOR_ORIGIN:localOrigin}, async url => new Response(JSON.stringify(url.includes('access_token') ? {access_token:'fake-test-token'} : {login:'w1nterdec'})));
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  try {
    const base=`http://127.0.0.1:${server.address().port}`;
    const auth=await fetch(`${base}/api/admin/auth?provider=github`,{redirect:'manual'});
    const state=new URL(auth.headers.get('location')).searchParams.get('state');
    const response=await fetch(`${base}/api/admin/callback?state=${state}&code=test`,{headers:{Cookie:auth.headers.get('set-cookie').split(';')[0]}});
    assert.equal(response.status,200);
    return (await response.text()).match(/<script nonce="[^"]+">([\s\S]*?)<\/script>/)[1];
  } finally {await new Promise(resolve=>server.close(resolve));}
}
function popup(script, linked=true) {
  const messages=[], status={textContent:''}, timers=new Map(), listeners=new Map();let next=0;
  const opener={closed:false,postMessage:(data,target)=>messages.push({data,target})};
  const window={opener:linked?opener:null,addEventListener:(name,fn)=>listeners.set(name,fn),removeEventListener:name=>listeners.delete(name)};
  runInNewContext(script,{window,document:{getElementById:()=>status},setInterval:fn=>{timers.set(++next,fn);return next;},setTimeout:fn=>{timers.set(++next,fn);return next;},clearInterval:id=>timers.delete(id),clearTimeout:id=>timers.delete(id)});
  return {messages,status,timers,opener,receive:(origin,source=opener)=>listeners.get('message')?.({data:'authorizing:github',origin,source})};
}
test('OAuth popup returns results only to the same opener at an explicitly allowed origin',async()=>{
  const script=await callbackScript('http://127.0.0.1:4323');
  for(const origin of ['http://127.0.0.1:4323','https://chenzhixing.bbroot.com']){
    const page=popup(script);page.receive(origin,{});assert.ok(page.messages.every(m=>!m.data.includes('fake-test-token')));
    page.receive(origin);const results=page.messages.filter(m=>m.data.startsWith('authorization:'));
    assert.equal(results.length,1);assert.equal(results[0].target,origin);assert.match(results[0].data,/fake-test-token/);assert.equal(page.timers.size,0);
  }
  for(const origin of ['https://evil.example','http://127.0.0.1:4321']){
    const page=popup(script);page.receive(origin);assert.ok(page.messages.every(m=>!m.data.includes('fake-test-token')));assert.match(page.status.textContent,/允许列表/);
  }
  const disabled=popup(await callbackScript());disabled.receive('http://127.0.0.1:4323');assert.ok(disabled.messages.every(m=>!m.data.includes('fake-test-token')));
});
test('OAuth popup explains lost opener and timeout without leaving an infinite waiting state',async()=>{
  const script=await callbackScript();const unlinked=popup(script,false);assert.match(unlinked.status.textContent,/连接已断开/);assert.equal(unlinked.messages.length,0);
  const timeout=popup(script);[...timeout.timers.values()].at(-1)();assert.match(timeout.status.textContent,/未收到/);assert.equal(timeout.timers.size,0);assert.ok(timeout.messages.every(m=>!m.data.includes('fake-test-token')));
});
test('local editor allowlist rejects non-loopback origins, paths and credentials',()=>{
  for(const value of ['https://evil.example','http://192.168.1.2:4323','http://127.0.0.1:4323/admin/','http://user:pass@127.0.0.1:4323','http://127.0.0.1:4323?x=1'])assert.throws(()=>createAdminServer({ADMIN_LOCAL_EDITOR_ORIGIN:value}),/exact HTTP loopback origin/);
});
