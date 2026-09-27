import fs from 'fs';
import path from 'path';
import puppeteer, { type Page } from 'puppeteer';
import { LAYOUT, boardHtml, type Board, type Layout } from './boards';
import { pageHtml } from './page';
import type { ThemeName } from './theme';

/**
 * Pixel density per layout. Mobile tiles are also shown at 1.5× on
 * tablets, so they carry 3× to stay sharp there.
 */
const SCALE: Record<Layout, number> = { desktop: 2, mobile: 3 };

export type TileSize = Record<Layout, { width: number; height: number }>;

const THEMES: ThemeName[] = ['dark', 'light'];
const LAYOUTS: Layout[] = ['desktop', 'mobile'];

export const tileFile = (id: string, layout: Layout, theme: ThemeName) => `${id}-${layout}-${theme}.png`;

async function load(page: Page, html: string, file: string) {
    fs.writeFileSync(file, html);
    await page.goto(`file://${path.resolve(file)}`, { waitUntil: 'load' });
    await page.waitForFunction('window.__laidOut === true', { timeout: 30_000 });
}

/**
 * Renders every board in both themes and both layouts, writes one PNG per
 * cell into `outDir`, and returns the CSS-pixel size of each tile for the
 * README's width attributes.
 */
export async function renderBoards(boards: Board[], outDir: string, workDir: string): Promise<Record<string, TileSize>> {
    fs.mkdirSync(workDir, { recursive: true });
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox', '--allow-file-access-from-files'] });
    const page = await browser.newPage();
    const sizes: Record<string, TileSize> = {};

    for (const layout of LAYOUTS) {
        await page.setViewport({ width: LAYOUT[layout].width, height: 1000, deviceScaleFactor: SCALE[layout] });
        const body = boards.map((b) => boardHtml(b, layout)).join('');

        for (const theme of THEMES) {
            const file = path.join(workDir, `page-${layout}-${theme}.html`);
            await load(page, pageHtml(body, theme, layout), file);

            // A whole-page capture, for eyeballing the layout.
            await page.screenshot({ path: path.join(workDir, `preview-${layout}-${theme}.png`), fullPage: true, omitBackground: true });

            const cells: { id: string; x: number; y: number; width: number; height: number }[] = await page.$$eval('.cell', (els) =>
                els.map((el) => {
                    const r = el.getBoundingClientRect();
                    return { id: (el as HTMLElement).dataset.tile!, x: r.x, y: r.y, width: r.width, height: r.height };
                }),
            );

            for (const { id, ...clip } of cells) {
                await page.screenshot({ path: path.join(outDir, tileFile(id, layout, theme)), clip, omitBackground: true });
                sizes[id] ??= { desktop: { width: 0, height: 0 }, mobile: { width: 0, height: 0 } };
                sizes[id][layout] = { width: Math.round(clip.width), height: Math.round(clip.height) };
            }
        }
    }

    await browser.close();
    return sizes;
}
