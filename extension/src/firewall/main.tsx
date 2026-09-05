import React from 'react';
import ReactDOM from 'react-dom/client';
import { FirewallApp } from './FirewallApp.tsx';

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <FirewallApp />
    </React.StrictMode>
  );
}
