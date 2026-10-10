import { createAdminServer } from '../server/admin/index.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { copyFile, mkdtemp, rm } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('installed OAuth service starts outside the source directory', async () => {
 const directory = await mkdtemp(join(tmpdir(), 'zhixing-admin-test-'));
 const installed = join(directory, 'index.mjs');
 await copyFile(new URL('../server/admin/index.mjs', import.meta.url), installed);
 const reservation = createServer();
 await new Promise(resolve => reservation.listen(0, '127.0.0.1', resolve));
 const port = reservation.address().port;
 await new Promise(resolve => reservation.close(resolve));
 const child = spawn(process.execPath, [installed], {env: {...process.env, ADMIN_PORT: String(port), ADMIN_CLIENT_ID: 'test', ADMIN_CLIENT_SECRET: 'test'}, stdio: 'ignore'});
 try {
  let ready = false;
  for (let attempt = 0; attempt < 40; attempt++) {
   try { const response = await fetch(`http://127.0.0.1:${port}/api/admin/health`); ready = response.status === 200 && await response.text() === 'ready'; } catch {}
   if (ready || child.exitCode !== null) break;
   await new Promise(resolve => setTimeout(resolve, 50));
  }
  assert.equal(ready, true, 'installed service must listen and answer its health check');
 } finally {
  if (child.exitCode === null) { const exited = new Promise(resolve => child.once('exit', resolve)); child.kill(); await exited; }
  await rm(directory, {recursive: true, force: true});
 }
});
test('valid OAuth callback returns a token only to the configured owner and origin',async()=>{
 const server=createAdminServer({ADMIN_ORIGIN:'http://localhost',ADMIN_CLIENT_ID:'test',ADMIN_CLIENT_SECRET:'test',ADMIN_GITHUB_USER:'w1nterdec'},async(url)=>new Response(JSON.stringify(url.includes('access_token')?{access_token:'fake-test-token'}:{login:'w1nterdec'}),{status:200}));
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}`;
 try{const auth=await fetch(base+'/api/admin/auth?provider=github',{redirect:'manual'});const state=new URL(auth.headers.get('location')).searchParams.get('state');const response=await fetch(base+`/api/admin/callback?state=${state}&code=test`,{headers:{Cookie:auth.headers.get('set-cookie').split(';')[0]}});assert.equal(response.status,200);const body=await response.text();assert.match(body,/editorOrigins\.includes\(event\.origin\)/);assert.match(body,/event\.source!==window\.opener/);assert.match(body,/fake-test-token/);assert.match(response.headers.get('content-security-policy'),/nonce-/);assert.equal((await fetch(base+`/api/admin/callback?state=${state}&code=test`)).status,403);}
 finally{await new Promise(resolve=>server.close(resolve));}
});
