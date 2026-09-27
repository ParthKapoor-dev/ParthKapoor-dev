/**
 * Serves README.md inside a GitHub-profile lookalike, with the colour
 * scheme and device width toggleable. `bun run preview`.
 */
import path from 'path';

const ROOT = path.join(import.meta.dir, '..');
const PORT = Number(process.env.PORT ?? 4173);

Bun.serve({
    port: PORT,
    async fetch(req) {
        const { pathname } = new URL(req.url);
        const file = pathname === '/' ? path.join(import.meta.dir, 'index.html') : path.join(ROOT, decodeURIComponent(pathname));
        if (!file.startsWith(ROOT)) return new Response('Forbidden', { status: 403 });
        const f = Bun.file(file);
        if (!(await f.exists())) return new Response('Not found', { status: 404 });
        return new Response(f, { headers: { 'Cache-Control': 'no-store' } });
    },
});

console.log(`README preview → http://localhost:${PORT}`);
