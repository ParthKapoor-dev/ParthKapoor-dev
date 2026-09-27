import fs from 'fs';
import path from 'path';
import { buildBoards } from './src/boards';
import { site } from './src/data';
import { heroSvg } from './src/hero';
import { renderBoards } from './src/render';
import { readme } from './src/readme';
import { fetchUserStats } from './src/stats';
import type { UserStats } from './src/types';

// Bun loads .env and .env.local on its own.
const GH_TOKEN = process.env.GH_TOKEN;
const ROOT = process.cwd();
const ASSETS = path.join(ROOT, 'assets');
const TILES = path.join(ASSETS, 'tiles');
const WORK = path.join(ROOT, 'generated');
const CACHE = path.join(WORK, 'stats.json');

/** `--cached` re-renders from the last fetch, for iterating on the design offline. */
async function loadStats(): Promise<UserStats> {
    if (process.argv.includes('--cached') && fs.existsSync(CACHE)) {
        console.log('Using cached stats from generated/stats.json');
        return JSON.parse(fs.readFileSync(CACHE, 'utf-8'));
    }
    if (!GH_TOKEN) {
        console.error('Error: GH_TOKEN is not defined in environment variables.');
        process.exit(1);
    }
    console.log(`Fetching stats for ${site.handle}...`);
    const stats = await fetchUserStats(site.handle, GH_TOKEN);
    fs.mkdirSync(WORK, { recursive: true });
    fs.writeFileSync(CACHE, JSON.stringify(stats, null, 1));
    return stats;
}

/** "27 sep · 11:00 ist" */
function syncedAt(date = new Date()): string {
    const parts = Object.fromEntries(
        new Intl.DateTimeFormat('en-GB', {
            timeZone: site.timezone, day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
        }).formatToParts(date).map((p) => [p.type, p.value]),
    );
    return `${parts.day} ${parts.month!.toLowerCase().slice(0, 3)} · ${parts.hour}:${parts.minute} ist`;
}

async function main() {
    const stats = await loadStats();

    fs.rmSync(TILES, { recursive: true, force: true });
    fs.mkdirSync(TILES, { recursive: true });

    console.log('Rendering hero...');
    for (const theme of ['dark', 'light'] as const) {
        fs.writeFileSync(path.join(ASSETS, `hero-${theme}.svg`), await heroSvg(theme));
    }

    console.log('Rendering boards...');
    const boards = buildBoards(stats, syncedAt());
    const sizes = await renderBoards(boards, TILES, WORK);

    fs.writeFileSync(path.join(ROOT, 'README.md'), readme(boards, sizes));
    console.log(`Wrote README.md with ${Object.keys(sizes).length} tiles.`);
}

main().catch((error) => {
    console.error('An error occurred:', error);
    process.exit(1);
});
