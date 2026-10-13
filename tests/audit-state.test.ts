import { it, expect } from 'vitest';
import { seed } from '../src/seed';
import { validState, migrateState } from '../src/validation';
import { validDate } from '../src/dates';
import { applyAction } from '../src/domain';
it('accepts current samples and preserves edits when migrating missing notes',()=>{
  const state=seed();expect(validState(state)).toBe(true);state.tasks[0].done=true;
  const legacy: Partial<typeof state>=state;delete legacy.notes;
  const result=migrateState(legacy);expect(validState(result)).toBe(true);
  expect((result as typeof state).tasks[0].done).toBe(true);
});
it.each(['2026-02-30','2026-02-29','2026-13-01','2026-00-10'])('rejects invalid calendar date %s',date=>expect(validDate(date)).toBe(false));
it('accepts a real leap day',()=>expect(validDate('2028-02-29')).toBe(true));
it('rejects invalid balances and missing references',()=>{
  const badBalance=seed();badBalance.stock.p1['Main bar']=-1;expect(validState(badBalance)).toBe(false);
  const badReference=seed();badReference.recipes[0].ingredients[0].product='missing';expect(validState(badReference)).toBe(false);
});
it('restores archived products for existing deliveries',()=>{
  let state=seed();const order=state.orders.find(o=>o.status==='Ordered')!;
  const id=order.lines[0].product;
  state=applyAction(state,{type:'archive',id});
  const action={type:'receive' as const,id:order.id,quantities:order.lines.map(()=>1),receipt:'sample',actor:'Sample'};
  expect(()=>applyAction(state,action)).toThrow('active');
  state=applyAction(state,{type:'restore',id});
  expect(validState(applyAction(state,action))).toBe(true);
});
