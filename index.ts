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

        const timestamp = Date.now();
        const statsFile = `stats_${timestamp}.gif`;
        const twitterFile = `twitter_${timestamp}.png`;
        const linkedinFile = `linkedin_${timestamp}.png`;

        console.log(`Generating versioned stats: ${timestamp}...`);

        const generatedDir = path.join(process.cwd(), 'generated');
        // Ensure dir exists
        if (!require('fs').existsSync(generatedDir)) {
            require('fs').mkdirSync(generatedDir);
        }

        const templatePath = path.join(process.cwd(), 'src', 'template.html');
        const statsPath = path.join(generatedDir, statsFile);
        const twitterPath = path.join(generatedDir, twitterFile);
        const linkedinPath = path.join(generatedDir, linkedinFile);

        await generateStatsGif(stats, templatePath, statsPath);
        console.log(`Stats generated at ${statsPath}`);

        // Generate Badges
        await import('./src/renderer').then(r => r.generateBadge('TWITTER / X', '#58a6ff', twitterPath));
        await import('./src/renderer').then(r => r.generateBadge('LINKEDIN', '#0a66c2', linkedinPath));

        // If R2 creds are present, upload and clean
        if (process.env.R2_ACCOUNT_ID) {
            console.log('Uploading to R2 and cleaning old versions...');
            // Namespace
            const prefix = 'github-readme/';

            // Upload new files
            const statsUrl = await uploadToR2(statsPath, `${prefix}${statsFile}`);
            const twitterUrl = await uploadToR2(twitterPath, `${prefix}${twitterFile}`);
            const linkedinUrl = await uploadToR2(linkedinPath, `${prefix}${linkedinFile}`);

            console.log('New URLs:');
            console.log(statsUrl);
            console.log(twitterUrl);
            console.log(linkedinUrl);

            // Cleanup old files
            await import('./src/storage').then(s => s.deleteOldVersions(process.env.R2_BUCKET_NAME!, prefix, timestamp));

            // Update README.md
            console.log('Updating README.md...');
            const readmePath = path.join(process.cwd(), 'README.md');
            if (require('fs').existsSync(readmePath)) {
                let readmeContent = require('fs').readFileSync(readmePath, 'utf-8');

                // Regex to replace old R2 URLs
                // Matches: https://....r2.dev/github-readme/(stats|twitter|linkedin)(_[\d]+)?\.(gif|png)

                // Safer approach: specifically target the images we own by their base names
                // Replace stats
                readmeContent = readmeContent.replace(
                    /src="https:\/\/[^"]+github-readme\/stats(_\d+)?\.gif"/g,
                    `src="${statsUrl}"`
                );

                // Replace twitter
                readmeContent = readmeContent.replace(
                    /src="https:\/\/[^"]+github-readme\/twitter(_\d+)?\.png"/g,
                    `src="${twitterUrl}"`
                );

                // Replace linkedin
                readmeContent = readmeContent.replace(
                    /src="https:\/\/[^"]+github-readme\/linkedin(_\d+)?\.png"/g,
                    `src="${linkedinUrl}"`
                );

                require('fs').writeFileSync(readmePath, readmeContent);
                console.log('README.md updated with new URLs.');
            }

        } else {
            console.log('R2 credentials not found. Skipping upload. (Run locally succeeded)');
        }

    } catch (error) {
        console.error('An error occurred:', error);
        process.exit(1);
    }
}

main();