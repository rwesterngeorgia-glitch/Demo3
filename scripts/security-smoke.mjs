import fs from 'node:fs/promises';
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { serve } from './static-server.mjs';
const folder=await fs.access('dist/index.html').then(()=>'dist',()=> 'out');
const headers=await fs.readFile(folder+'/_headers','utf8');
assert(headers.split(/\r?\n/).every(line=>line.length<=2000),'Static-host header line exceeds 2000 characters.');
const configured=await fs.readFile('src/config/routes.json','utf8').then(JSON.parse,()=>null);
const routes=configured?configured.map(r=>r.path):folder==='out'?['/','/about','/services','/faq','/contact']:await fs.access('src/seed.ts').then(()=>['/','/app','/app/inventory','/app/recipes'],()=>['/','/menu','/about','/reservations','/contact','/admin']);
const server=await serve(folder),origin='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({headless:true,channel:process.env.CI?undefined:'chrome'});
const page=await browser.newPage(),errors=[];
page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>document.addEventListener('securitypolicyviolation',event=>{window.__policyErrors??=[];window.__policyErrors.push(event.violatedDirective+': '+event.blockedURI);}));
try {
  for(const route of routes) {
    const response=await page.goto(origin+route,{waitUntil:'networkidle'});
    await page.locator('h1').waitFor();
    assert.equal(response.status(),200,route);
    const h=await response.allHeaders();
    assert.equal(h['x-frame-options'],'DENY');
    assert(h['content-security-policy'].includes("frame-ancestors 'none'"));
    assert.deepEqual(await page.evaluate(()=>window.__policyErrors??[]),[],route);
  }
  assert.deepEqual(errors,[]);
  console.log(`Security smoke passed: ${routes.length} built routes, response headers, no CSP violations or uncaught errors.`);
} finally {await browser.close();await new Promise(resolve=>server.close(resolve));}
