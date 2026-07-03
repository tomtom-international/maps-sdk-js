import { createRoot } from 'react-dom/client';
import { App } from './App';
// Order matters: SDK templates, then style.css (the Tailwind entry), then the app-shell overrides
// last so they win over Tailwind's preflight.
import '../../src/templates/css/styles.css';
import './style.css';
import '../../src/templates/css/agent-app-shell.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
    throw new Error('Root element not found');
}

createRoot(rootElement).render(<App />);
