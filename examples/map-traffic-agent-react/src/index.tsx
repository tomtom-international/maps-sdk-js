import { createRoot } from 'react-dom/client';
import { App } from './App';
// Import the SDK template CSS as a separate module — Tailwind's Vite plugin expands
// `@import "tailwindcss"` inside style.css into hundreds of rules, which pushes any sibling
// `@import url(...)` past the "@import must be first" rule and postcss-import silently drops it.
// Loading the templates here keeps both CSS pipelines independent.
import '../../src/templates/css/styles.css';
import './style.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
    throw new Error('Root element not found');
}

createRoot(rootElement).render(<App />);
