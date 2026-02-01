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

        // If R2 creds are present, upload
        if (process.env.R2_ACCOUNT_ID) {
            console.log('Uploading to R2...');
            const publicUrl = await uploadToR2(outputPath, `github-readme/${OUTPUT_FILE}`); // Namespaced in R2
            console.log('Top Job! Stats uploaded successfully!');
            console.log('Image URL:', publicUrl);
        } else {
            console.log('R2 credentials not found. Skipping upload. (Run locally succeeded)');
        }

    } catch (error) {
        console.error('An error occurred:', error);
        process.exit(1);
    }
}

main();