import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { readFileSync } from 'fs';
import path from 'path';

export async function uploadToR2(filePath: string, fileName: string): Promise<string> {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucketName = process.env.R2_BUCKET_NAME;
    const publicUrl = process.env.R2_PUBLIC_URL;

    if (!accountId || !accessKeyId || !secretAccessKey || !bucketName || !publicUrl) {
        throw new Error('Missing R2 environment variables');
    }

    const S3 = new S3Client({
        region: 'auto',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId,
            secretAccessKey,
        },
    });

    const fileContent = readFileSync(filePath);

    const ext = path.extname(fileName).toLowerCase();
    let contentType = 'application/octet-stream';
    if (ext === '.gif') contentType = 'image/gif';
    if (ext === '.png') contentType = 'image/png';
    if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';

    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: fileName,
        Body: fileContent,
        ContentType: contentType,
        CacheControl: 'no-cache, no-store, must-revalidate',
    });

    await S3.send(command);

    return `${publicUrl}/${fileName}`;
}

export async function deleteOldVersions(bucketName: string, prefix: string, currentTimestamp: number): Promise<void> {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

    if (!accountId || !accessKeyId || !secretAccessKey) {
        throw new Error('Missing R2 environment variables for S3 client');
    }

    const S3 = new S3Client({
        region: 'auto',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId,
            secretAccessKey,
        },
    });

    const { ListObjectsV2Command, DeleteObjectsCommand } = await import('@aws-sdk/client-s3');

    // List all objects with prefix
    const listCommand = new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: prefix,
    });

    const listedObjects = await S3.send(listCommand);

    if (!listedObjects.Contents || listedObjects.Contents.length === 0) return;

    const objectsToDelete: { Key: string }[] = [];

    // Filter objects to delete
    // We keep files that contain the current timestamp
    // We delete files that look like versioned files but don't have current timestamp
    // Format: stats_12345.gif, twitter_12345.png

    // Regex to match our versioned files: name_\d+.(gif|png)
    const versionedRegex = /_(\d+)\.(gif|png)$/;

    for (const content of listedObjects.Contents) {
        if (!content.Key) continue;

        const match = content.Key.match(versionedRegex);
        if (match && match[1]) {
            const timestamp = parseInt(match[1], 10);
            // If it's a versioned file and NOT the current one, delete it
            if (timestamp !== currentTimestamp) {
                objectsToDelete.push({ Key: content.Key });
            }
        }
    }

    if (objectsToDelete.length > 0) {
        console.log(`Deleting ${objectsToDelete.length} old versions...`);
        const deleteCommand = new DeleteObjectsCommand({
            Bucket: bucketName,
            Delete: {
                Objects: objectsToDelete,
                Quiet: true,
            },
        });
        await S3.send(deleteCommand);
    }
}
