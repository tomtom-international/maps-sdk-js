// The port the harness is served on. Its own module because both configs need it — Vite to bind it
// and Playwright to wait on it — and a suite that disagrees with its own server hangs rather than
// fails.
export const HARNESS_PORT = 5192;
