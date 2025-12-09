import { ReactNode, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

export function renderSandpackPreview(children: ReactNode) {
    const root = createRoot(document.getElementById('root') as HTMLElement);
    root.render(<StrictMode>{children}</StrictMode>);
}
