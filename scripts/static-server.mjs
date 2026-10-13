import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function serve(directory, port=0) {
  const root=path.resolve(directory);
  function readRules() {
  const rules=[];
  if(fs.existsSync(path.join(root,'_headers'))) {
    let rule;
    for(const line of fs.readFileSync(path.join(root,'_headers'),'utf8').split(/\r?\n/)) {
      if(line.startsWith('/')) {rule={pattern:line.trim(),headers:{}};rules.push(rule);}
      else if(rule && /^\s+[^:]+:/.test(line)) {const i=line.indexOf(':');rule.headers[line.slice(0,i).trim()]=line.slice(i+1).trim();}
    }
  }
  return rules;
  }
  const types={'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2','.ttf':'font/ttf','.txt':'text/plain; charset=utf-8','.xml':'application/xml','.json':'application/json'};
  const server=http.createServer((request,response)=>{
    try {
      const pathname=decodeURIComponent(new URL(request.url,'http://localhost').pathname);
      let file=path.resolve(root,'.'+pathname);
      if(file!==root && !file.startsWith(root+path.sep)){response.writeHead(403).end();return;}
      file=[file,file+'.html',path.join(file,'index.html')].find(candidate=>fs.existsSync(candidate)&&fs.statSync(candidate).isFile());
      let status=200;
      if(!file){const missing=path.join(root,'404.html');file=fs.existsSync(missing)?missing:path.join(root,'index.html');status=fs.existsSync(missing)?404:200;}
      const headers={'Content-Type':types[path.extname(file)]??'application/octet-stream','X-Content-Type-Options':'nosniff'};
      for(const rule of readRules()) if(rule.pattern==='/*'||rule.pattern===pathname||rule.pattern.endsWith('/*')&&pathname.startsWith(rule.pattern.slice(0,-1)))Object.assign(headers,rule.headers);
      response.writeHead(status,headers);
      if(request.method==='HEAD')response.end();else fs.createReadStream(file).pipe(response);
    }catch{response.writeHead(400).end('Invalid request');}
  });
  return new Promise(resolve=>server.listen(port,'127.0.0.1',()=>resolve(server)));
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const server=await serve(process.argv[2]??'dist',Number(process.argv[3]??5190));
  console.log('Header-aware local preview: http://127.0.0.1:'+server.address().port);
}
