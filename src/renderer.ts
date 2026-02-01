import puppeteer from 'puppeteer';
import GIFEncoder from 'gifencoder';
import pngFileStream from 'png-js';
import fs from 'fs';
import path from 'path';
import type { UserStats } from './types';

function decode(png: any): Promise<Uint8Array> {
    return new Promise((resolve) => {
        png.decode((pixels: any) => resolve(pixels));
    });
}

export async function generateStatsGif(stats: UserStats, templatePath: string, outputPath: string): Promise<void> {
    let html = fs.readFileSync(templatePath, 'utf-8');

    // Inject data
    html = html
        .replace('{{name}}', stats.name)
        .replace('{{username}}', stats.username)
        .replace('{{avatarUrl}}', stats.avatarUrl)
        .replace('{{totalStars}}', stats.totalStars.toLocaleString())
        .replace('{{totalCommits}}', stats.totalCommits.toLocaleString())
        .replace('{{totalPRsIssues}}', (stats.totalPRs + stats.totalIssues).toLocaleString())
        .replace('{{contributions}}', stats.contributions.toLocaleString());

    const languageSegments = stats.topLanguages
        .map(lang =>
            `<div class="progress-segment" style="width: ${lang.percentage}%; background-color: ${lang.color};"></div>`
        )
        .join('');

    html = html.replace('{{languageSegments}}', languageSegments);

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 800, height: 400, deviceScaleFactor: 2 }); // Higher scale for better quality
    await page.setContent(html);

    // Gif configuration
    const width = 800 * 2; // match viewport scale
    const height = 400 * 2;
    const encoder = new GIFEncoder(width, height);

    // Stream output to file
    const stream = fs.createWriteStream(outputPath);
    encoder.createReadStream().pipe(stream);

    encoder.start();
    encoder.setRepeat(0);   // 0 for repeat, -1 for no-repeat
    encoder.setDelay(100);  // frame delay in ms
    encoder.setQuality(10); // image quality. 10 is default.

    console.log('Capturing frames...');

    const totalFrames = 30; // 3 seconds at ~10fps equivalent

    for (let i = 0; i < totalFrames; i++) {
        if (i === 0) await new Promise(r => setTimeout(r, 100)); // Initial load wait

        // Capture to buffer directly (faster, no IO race conditions)
        const buffer = await page.screenshot({ type: 'png' });

        const png = new pngFileStream(buffer);
        const pixels = await decode(png);

        // Mock context for gifencoder
        encoder.addFrame({
            getImageData: () => ({ data: pixels, width, height })
        } as any);

        await new Promise(r => setTimeout(r, 100));
    }

    encoder.finish();
    await browser.close();
}
