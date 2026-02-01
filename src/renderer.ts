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
        .replace('{{currentStreak}}', stats.streaks.current.toString())
        .replace('{{longestStreak}}', stats.streaks.longest.toString());

    // Generate Language List HTML
    const languageList = stats.topLanguages
        .map(lang =>
            `<div class="lang-item">
         <div style="display: flex; align-items: center;">
           <span class="lang-dot" style="background-color: ${lang.color}"></span>
           <span>${lang.name}</span>
         </div>
         <span style="color: #8b949e;">${Math.round(lang.percentage)}%</span>
       </div>`
        )
        .join('');
    html = html.replace('{{languageList}}', languageList);

    // Generate Contribution Graph HTML
    // We take the last 20 weeks to fit the card
    const weeks = stats.contributionGraph.weeks.slice(-20);
    const graphHtml = weeks.map(week => {
        const daysHtml = week.contributionDays.map(day => {
            // Map colors to classes or use inline styles. 
            // GitHub colors: #ebedf0, #9be9a8, #40c463, #30a14e, #216e39 (Light mode)
            // We want dark mode equivalent or neon.
            // Let's use opacity or strict mapping.
            let color = day.color;
            // Simple heuristic for intensity if color is not standard
            const count = day.contributionCount;
            let intensityClass = 'l0';
            if (count > 0) intensityClass = 'l1';
            if (count > 2) intensityClass = 'l2';
            if (count > 5) intensityClass = 'l3';
            if (count > 10) intensityClass = 'l4';

            return `<div class="day ${intensityClass}" title="${day.date}: ${count} stats"></div>`;
        }).join('');
        return `<div class="week">${daysHtml}</div>`;
    }).join('');

    html = html.replace('{{contributionGraph}}', graphHtml);

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 800, height: 450, deviceScaleFactor: 2 }); // Higher scale for better quality
    await page.setContent(html);

    // Gif configuration
    const width = 800 * 2; // match viewport scale
    const height = 450 * 2;
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

export async function generateBadge(label: string, color: string, outputPath: string): Promise<void> {
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@700&display=swap');
            body { margin: 0; padding: 0; background: transparent; display: flex; align-items: center; justify-content: center; height: 100vh; }
            .badge {
                font-family: 'JetBrains Mono', monospace;
                font-size: 14px;
                font-weight: 700;
                color: ${color};
                background: #161b22;
                border: 1px solid ${color};
                padding: 8px 16px;
                border-radius: 4px;
                box-shadow: 0 0 10px ${color}40;
                text-transform: uppercase;
                display: flex;
                align-items: center;
                gap: 8px;
            }
        </style>
    </head>
    <body>
        <div class="badge">
            ${label}
        </div>
    </body>
    </html>
    `;

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setContent(html);

    const element = await page.$('.badge');
    if (element) {
        await element.screenshot({ path: outputPath, omitBackground: true });
    }

    await browser.close();
}
