import dotenv from 'dotenv';
import path from 'path';
import { fetchUserStats } from './src/stats';
import { generateStatsGif } from './src/renderer';

dotenv.config();

const USERNAME = 'parthkapoor-dev';
const GH_TOKEN = process.env.GH_TOKEN;

async function main() {
    if (!GH_TOKEN) {
        console.error('Error: GH_TOKEN is not defined in environment variables.');
        process.exit(1);
    }

    try {
        console.log(`Fetching stats for ${USERNAME}...`);
        const stats = await fetchUserStats(USERNAME, GH_TOKEN);
        console.log('Stats fetched:', stats);

        const statsFile = 'stats.gif';
        const twitterFile = 'twitter.png';
        const linkedinFile = 'linkedin.png';

        console.log(`Generating stats assets...`);

        const assetsDir = path.join(process.cwd(), 'assets');
        // Ensure dir exists
        if (!require('fs').existsSync(assetsDir)) {
            require('fs').mkdirSync(assetsDir);
        }

        const templatePath = path.join(process.cwd(), 'src', 'template.html');
        const statsPath = path.join(assetsDir, statsFile);
        const twitterPath = path.join(assetsDir, twitterFile);
        const linkedinPath = path.join(assetsDir, linkedinFile);

        await generateStatsGif(stats, templatePath, statsPath);
        console.log(`Stats generated at ${statsPath}`);

        // Generate Badges
        console.log('Generating badges...');
        await import('./src/renderer').then(r => r.generateBadge('TWITTER / X', '#58a6ff', twitterPath));
        await import('./src/renderer').then(r => r.generateBadge('LINKEDIN', '#0a66c2', linkedinPath));

        console.log('All assets generated successfully in assets/ folder.');

    } catch (error) {
        console.error('An error occurred:', error);
        process.exit(1);
    }
}

main();