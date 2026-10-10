#!/usr/bin/env python3
"""Daily aggregate page requests. Never publish IPs, user agents or raw logs."""
import datetime, glob, gzip, json, os, re
from pathlib import Path
state_dir=Path('/var/lib/zhixing-stats')
state_dir.mkdir(mode=0o700,parents=True,exist_ok=True)
state_file=state_dir/'state.json'
state=json.loads(state_file.read_text()) if state_file.exists() else {}
counts={}
months={v:i+1 for i,v in enumerate(['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'])}
for filename in glob.glob('/var/log/nginx/zhixing-access.log*'):
    opener=gzip.open if filename.endswith('.gz') else open
    with opener(filename,'rt',errors='replace') as file:
        for line in file:
            match=re.search(r'\[(\d{2})/(\w{3})/(\d{4}):[^\]]+\] "GET ([^ ]+) HTTP/[^" ]+" 200 ',line)
            if not match: continue
            day,month,year,url=match.groups()
            path=url.split('?')[0]
            if path.startswith(('/admin','/api/')) or not (path.endswith('/') or path.endswith('.html')): continue
            key=f'{year}-{months[month]:02d}-{day}'
            counts[key]=counts.get(key,0)+1
for key,value in counts.items(): state[key]=max(state.get(key,0),value)
# Retain only aggregate dates; no request data is stored.
year=datetime.datetime.now(datetime.timezone.utc).year
payload={'year':year,'requests':sum(v for k,v in state.items() if k.startswith(str(year))), 'updatedAt':datetime.datetime.now(datetime.timezone.utc).isoformat()}
state_file.write_text(json.dumps(state))
public=Path('/var/www/astro-blog/shared');public.mkdir(exist_ok=True)
temporary=public/'stats.json.next';temporary.write_text(json.dumps(payload));os.chmod(temporary,0o644);temporary.replace(public/'stats.json')
