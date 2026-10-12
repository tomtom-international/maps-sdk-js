// Before the components, whose own stylesheets override the shared templates it imports.
import './style.css';
import * as Tooltip from '@radix-ui/react-tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LucideProvider } from 'lucide-react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

const rootElement = document.getElementById('root');

if (!rootElement) {
    throw new Error('Root element not found');
}

// A failed service call shows its error at once: retrying a rejected route or search only delays it.
const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } } });

// Here rather than in `index.html`: the examples' in-browser bundler preview serves its own page.
document.body.classList.add('ui-body');
createRoot(rootElement).render(
    <QueryClientProvider client={queryClient}>
        <Tooltip.Provider delayDuration={300}>
            <LucideProvider size={16} className="ui-icon">
                <App />
            </LucideProvider>
        </Tooltip.Provider>
    </QueryClientProvider>,
);
