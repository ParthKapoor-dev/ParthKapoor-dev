import dotenv from 'dotenv';
import path from 'path';
import { fetchUserStats } from './src/stats';
import { generateStatsGif } from './src/renderer';
import { uploadToR2 } from './src/storage';

dotenv.config();

const USERNAME = 'parthkapoor-dev'; // Or fetch from env
const GH_TOKEN = process.env.GH_TOKEN;
const OUTPUT_FILE = 'stats.gif';

async function main() {
    if (!GH_TOKEN) {
        console.error('Error: GH_TOKEN is not defined in environment variables.');
        process.exit(1);
    }

    try {
        console.log(`Fetching stats for ${USERNAME}...`);
        const stats = await fetchUserStats(USERNAME, GH_TOKEN);
        console.log('Stats fetched:', stats);

        console.log('Generating GIF...');
        const templatePath = path.join(process.cwd(), 'src', 'template.html');
        const outputPath = path.join(process.cwd(), OUTPUT_FILE);
        await generateStatsGif(stats, templatePath, outputPath);
        console.log(`GIF generated at ${outputPath}`);

        // Generate Badges
        console.log('Generating badges...');
        const twitterPath = path.join(process.cwd(), 'twitter.png');
        const linkedinPath = path.join(process.cwd(), 'linkedin.png');

        await import('./src/renderer').then(r => r.generateBadge('TWITTER / X', '#58a6ff', twitterPath));
        await import('./src/renderer').then(r => r.generateBadge('LINKEDIN', '#0a66c2', linkedinPath));

        // If R2 creds are present, upload
        if (process.env.R2_ACCOUNT_ID) {
            console.log('Uploading to R2...');
            const publicUrl = await uploadToR2(outputPath, `github-readme/${OUTPUT_FILE}`);
            const twitterUrl = await uploadToR2(twitterPath, `github-readme/twitter.png`);
            const linkedinUrl = await uploadToR2(linkedinPath, `github-readme/linkedin.png`);

            console.log('Top Job! Stats uploaded successfully!');
            console.log('Stats URL:', publicUrl);
            console.log('Twitter Badge:', twitterUrl);
            console.log('LinkedIn Badge:', linkedinUrl);
        } else {
            console.log('R2 credentials not found. Skipping upload. (Run locally succeeded)');
        }

    } catch (error) {
        console.error('An error occurred:', error);
        process.exit(1);
    }
}

main();