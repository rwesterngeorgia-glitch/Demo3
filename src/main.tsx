import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, useLocation } from "react-router-dom";
import Landing from './Landing';
const WorkspaceEntry = lazy(() => import('./WorkspaceEntry'));
function Entry() {
  const {pathname} = useLocation();
  return pathname === '/' ? <Landing /> : <Suspense fallback={<p role="status">Loading StockPilot…</p>}><WorkspaceEntry /></Suspense>;
}
import "./style.css";
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Entry />
    </BrowserRouter>
  </React.StrictMode>,
);
