import { test, expect } from '@playwright/test';
test('tabs preserve task completion and an announcement together',async({page})=>{
  const other=await page.context().newPage();await page.goto('/app/operations');await other.goto('/app/operations');
  await other.getByRole('button',{name:'Announcements',exact:true}).click();await other.getByLabel('Operational note (fictional data only)',{exact:true}).fill('Sample concurrent announcement');
  await Promise.all([page.getByRole('button',{name:/Check bar par levels/}).click(),other.getByRole('button',{name:'Post note',exact:true}).click()]);
  await expect.poll(()=>page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('stockpilot-demo-v1')||'null');return s?.tasks.find((t:{title:string})=>t.title.includes('Check bar par')).done&&s.notes?.some((n:{text:string})=>n.text==='Sample concurrent announcement');})).toBe(true);
});
test('legacy notes migrate without resetting completed tasks',async({page})=>{
  await page.goto('/app/operations');await page.getByRole('button',{name:/Check bar par levels/}).click();
  await expect.poll(()=>page.evaluate(()=>!!localStorage.getItem('stockpilot-demo-v1'))).toBe(true);
  await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('stockpilot-demo-v1')!);delete s.notes;localStorage.setItem('stockpilot-demo-v1',JSON.stringify(s));});
  await page.reload();await page.getByRole('button',{name:'Announcements',exact:true}).click();await expect(page.getByRole('heading',{name:'Team & operations'})).toBeVisible();
});
