import { execSync } from 'node:child_process';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/** Build stamp shown in the menu, so you can tell which build a phone is running. */
function buildVersion(): string {
  const stamp = new Date().toISOString().replace('T', ' ').slice(0, 16);
  try {
    const sha = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
    return `${stamp} · ${sha}`;
  } catch {
    return stamp; // not a git checkout (e.g. a plain Vercel file upload)
  }
}

export default defineConfig({
  plugins: [react()],
  define: { __APP_VERSION__: JSON.stringify(buildVersion()) },
  build: { outDir: 'dist' },
  server: {
    // `npm run dev` proxies /api to `vercel dev` if you run it on :3000
    proxy: { '/api': 'http://localhost:3000' },
  },
});
