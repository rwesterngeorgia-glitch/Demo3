import { createContext, useContext, type ReactNode } from 'react';
import { applyAction } from './domain';
import { seed } from './seed';
import { validState, migrateState } from './validation';
import { useDemoStorage } from './persistence';
import type { Action, State } from './types';
export const KEY='stockpilot-demo-v1';
const Context=createContext<{state:State;dispatch:(action:Action)=>void;reset:()=>void;warning:string;exportRecovery:()=>void}|null>(null);
export function Store({children}:{children:ReactNode}) {
 const {data:state,warning,change,reset,exportRecovery}=useDemoStorage(KEY,seed,validState,migrateState);
 return <Context.Provider value={{state,warning,reset,exportRecovery,dispatch:action=>change(current=>applyAction(current,action))}}>{children}</Context.Provider>;
}
export function useStore(){const value=useContext(Context);if(!value)throw Error('Missing demo provider');return value;}
