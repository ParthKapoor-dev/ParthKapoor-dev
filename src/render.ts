import fs from 'fs';
import path from 'path';
import puppeteer, { type Page } from 'puppeteer';
import { boardHtml, type Board } from './boards';
import { pageHtml, type Variant } from './page';
import type { ThemeName } from './theme';

/** Pixel density of every exported image. */
const SCALE = 2;

/** Room around a bare card for its drop shadow. */
const SHADOW = { x: 12, top: 8, bottom: 18 };

export interface TileSize {
    /** The cell: the image used on wide screens, wires included. */
    wire: { width: number; height: number };
    /** The card alone: the image used on narrow screens. */
    card: { width: number; height: number };
}

const THEMES: ThemeName[] = ['dark', 'light'];
const VARIANTS: Variant[] = ['wire', 'card'];

export const tileFile = (id: string, variant: Variant, theme: ThemeName) => `${id}-${variant}-${theme}.png`;

async function load(page: Page, html: string, file: string) {
    fs.writeFileSync(file, html);
    await page.goto(`file://${path.resolve(file)}`, { waitUntil: 'load' });
    await page.waitForFunction('window.__laidOut === true', { timeout: 30_000 });
}

/**
 * Renders every board in both themes and both variants, writes one PNG per
 * tile into `outDir`, and returns the CSS-pixel size of each tile for the
 * README's width/height attributes.
 */
export async function renderBoards(boards: Board[], outDir: string, workDir: string): Promise<Record<string, TileSize>> {
    fs.mkdirSync(workDir, { recursive: true });
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox', '--allow-file-access-from-files'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 744, height: 1000, deviceScaleFactor: SCALE });

    const sizes: Record<string, TileSize> = {};
    const body = boards.map(boardHtml).join('');

    for (const theme of THEMES) {
        for (const variant of VARIANTS) {
            const file = path.join(workDir, `page-${theme}-${variant}.html`);
            await load(page, pageHtml(body, theme, variant), file);

            // A whole-page capture, for eyeballing the layout.
            await page.screenshot({ path: path.join(workDir, `preview-${theme}-${variant}.png`), fullPage: true, omitBackground: true });

            const rects: { id: string; cell: DOMRect; card: DOMRect }[] = await page.$$eval('.cell', (cells) =>
                cells.map((cell) => ({
                    id: (cell as HTMLElement).dataset.tile!,
                    cell: cell.getBoundingClientRect().toJSON(),
                    card: cell.querySelector('.card')!.getBoundingClientRect().toJSON(),
                })),
            );

            for (const { id, cell, card } of rects) {
                // Kept inside the page: a clip that starts off-canvas makes Chrome
                // capture the wrong region instead of padding it.
                const x = Math.max(0, card.x - SHADOW.x);
                const clip = variant === 'wire'
                    ? { x: cell.x, y: cell.y, width: cell.width, height: cell.height }
                    : {
                        x,
                        y: card.y - SHADOW.top,
                        width: Math.min(744, card.x + card.width + SHADOW.x) - x,
                        height: card.height + SHADOW.top + SHADOW.bottom,
                    };
                await page.screenshot({ path: path.join(outDir, tileFile(id, variant, theme)), clip, omitBackground: true });
                sizes[id] ??= { wire: { width: 0, height: 0 }, card: { width: 0, height: 0 } };
                sizes[id][variant] = { width: Math.round(clip.width), height: Math.round(clip.height) };
            }
        }
    }

    await browser.close();
    return sizes;
}
