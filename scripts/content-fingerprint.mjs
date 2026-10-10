import { createHash } from 'node:crypto';
import { readdirSync,readFileSync,appendFileSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
const hash=createHash('sha256');
hash.update(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim());
function walk(dir){for(const e of readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name,'en'))){const p=join(dir,e.name);if(e.isDirectory())walk(p);else{hash.update(p.replaceAll('\\','/'));hash.update(readFileSync(p));}}}
for(const dir of ['src/content/posts/_published','src/data/generated','public/uploads'])walk(dir);
appendFileSync(process.env.GITHUB_OUTPUT,`digest=${hash.digest('hex')}\n`);
