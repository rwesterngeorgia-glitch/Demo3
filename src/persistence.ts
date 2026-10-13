import { useEffect, useRef, useState } from 'react';

type Guard<T> = (value: unknown) => value is T;
const identity = (value: unknown) => value;
function decode<T>(raw: string, validate: Guard<T>, migrate: (value: unknown) => unknown): T {
  if (raw.length > 5000000) throw Error('Saved demo exceeds the supported browser-data size.');
  const value = migrate(JSON.parse(raw));
  if (!validate(value)) throw Error('Saved demo records are invalid or use an unsupported version.');
  return value;
}
export function useDemoStorage<T>(key: string, seed: () => T, validate: Guard<T>, migrate = identity) {
  const [initial] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return {data:seed(),warning:''};
      try {return {data:decode(raw,validate,migrate),warning:''};}
      catch {
        try {localStorage.setItem(key+'-recovery',raw);} catch { /* The damaged original is still kept at its existing key. */ }
        return {data:seed(),warning:'Saved demo data could not be loaded. Fresh samples are shown; the previous data is retained in this browser for recovery. Reset to replace it.'};
      }
    } catch {return {data:seed(),warning:'Browser storage is unavailable. Changes will stay in this tab only.'};}
  });
  const [data,setData] = useState<T>(initial.data), [warning,setWarning] = useState(initial.warning);
  const current = useRef(data);
  useEffect(() => {
    const listen = (event: StorageEvent) => {
      if(event.key !== key || !event.newValue) return;
      try {const next=decode(event.newValue,validate,migrate);current.current=next;setData(next);}
      catch {setWarning('Another tab has invalid saved data. Your current view is retained. Reset the demo to recover.');}
    };
    window.addEventListener('storage',listen);
    return () => window.removeEventListener('storage',listen);
  },[key,validate,migrate]);
  function change(fn:(value:T)=>T, reset=false) {
    const before=current.current;
    const candidate=fn(structuredClone(before));
    if(!validate(candidate)) throw Error('This change conflicts with current records or exceeds a demo limit. Refresh the form and try again.');
    if(!navigator.locks) {
      current.current=candidate;setData(candidate);
      setWarning('This browser cannot coordinate saves across tabs. Your changes are kept in this tab only.');
      return Promise.resolve(false);
    }
    current.current=candidate;setData(candidate);
    return navigator.locks.request(key+'-write', () => {
      let latest=before;
      try {const raw=localStorage.getItem(key);if(raw && !reset)latest=decode(raw,validate,migrate);}
      catch(error){if(error instanceof SyntaxError || (error instanceof Error && /Saved demo/.test(error.message)))throw Error('Saved data is damaged. Reset the demo before making further changes.');}
      const next=reset?candidate:fn(structuredClone(latest));
      if(!validate(next))throw Error('Another tab changed these records. This change was not saved; review the latest data and try again.');
      current.current=next;setData(next);
      try {
        const serialized=JSON.stringify({...next,_schemaVersion:1,_revision:crypto.randomUUID()});
        if(serialized.length>4500000)throw Error('Demo storage limit reached.');
        localStorage.setItem(key,serialized);
        if(reset)localStorage.removeItem(key+'-recovery');
        setWarning('');
        return true;
      } catch {setWarning('Your change works in this tab, but browser storage is full or unavailable. It has not been saved for reload.');return false;}
    }).catch(error=>{
      try {const raw=localStorage.getItem(key);if(raw){const latest=decode(raw,validate,migrate);current.current=latest;setData(latest);}}catch {/* Keep the last valid view. */}
      setWarning(error instanceof Error?error.message:'The change was not saved. Please retry.');
      return false;
    });
  }
  function exportRecovery() {
    try {
      const raw=localStorage.getItem(key+'-recovery')??localStorage.getItem(key);
      if(!raw){setWarning('No saved data is available to download.');return;}
      const url=URL.createObjectURL(new Blob([raw],{type:'application/json'})), link=document.createElement('a');
      link.href=url;link.download=key+'-recovery.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    } catch {setWarning('Saved data is unavailable in this browser.');}
  }
  return {data,warning,change,exportRecovery,report:setWarning,reset:()=>change(()=>seed(),true)};
}
