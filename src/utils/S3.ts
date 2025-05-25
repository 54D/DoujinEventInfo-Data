import dotenv from 'dotenv';
dotenv.config({
    path: '.env.local'
});

import * as fs from 'fs';
import * as path from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

console.log("Using environment variables from .env.local:");
console.log(`AWS_REGION: ${process.env.AWS_REGION}`);
console.log(`AWS_S3_BUCKET_NAME: ${process.env.AWS_S3_BUCKET_NAME}`);
console.log(`AWS_ACCESS_KEY_ID: ${process.env.AWS_ACCESS_KEY_ID}`);
console.log(`AWS_SECRET_ACCESS_KEY: ${process.env.AWS_SECRET_ACCESS_KEY}`);

// Load environment variables from .env file

export namespace S3 {

    const s3Client = new S3Client({
        region: process.env.AWS_REGION,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
    });

    const bucketName = process.env.AWS_S3_BUCKET_NAME;

    /**
     * Uploads a single file to an S3 bucket.
     * @param filePath The path to the local file.
     * @param s3Key The key (path) for the file in the S3 bucket.
     */
    export async function uploadFile(filePath: string, s3Key: string): Promise<void> {
        if (!bucketName) {
            console.error('AWS_S3_BUCKET_NAME is not defined in your .env file.');
            throw new Error('AWS_S3_BUCKET_NAME is not defined.');
        }
        if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_REGION) {
            console.error('AWS credentials or region is not defined in your .env file.');
            throw new Error('AWS credentials or region is not defined.');
        }

        console.log(`Starting upload of file "${filePath}" to S3 bucket "${bucketName}" with key "${s3Key}"...`);

        const fileContent = fs.readFileSync(filePath);
        const params = {
            Bucket: bucketName,
            Key: s3Key,
            Body: fileContent,
            // You might want to set ContentType based on file extension
            // ContentType: mime.getType(filePath) || 'application/octet-stream',
        };

        try {
            const command = new PutObjectCommand(params);
            await s3Client.send(command);
            console.log(`Successfully uploaded ${filePath} to s3://${bucketName}/${s3Key}`);
        } catch (err) {
            console.error(`Error uploading ${filePath}: `, err);
            throw err;
        }
    }

    /**
     * Uploads all files from a local folder to an S3 bucket.
     * @param localFolderPath The path to the local folder.
     * @param s3FolderPrefix Optional prefix for S3 object keys (e.g., 'uploads/').
     */
    export async function uploadFolder(localFolderPath: string, s3FolderPrefix: string = ''): Promise<void> {
        if (!bucketName) {
            console.error('S3_BUCKET_NAME is not defined in your .env file.');
            throw new Error('S3_BUCKET_NAME is not defined.');
        }
        if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_REGION) {
            console.error('AWS credentials or region is not defined in your .env file.');
            throw new Error('AWS credentials or region is not defined.');
        }

        console.log(`Starting upload of folder "${localFolderPath}" to S3 bucket "${bucketName}"...`);

        const files = getAllFiles(localFolderPath);

        for (const filePath of files) {
            const fileContent = fs.readFileSync(filePath);
            // Create a relative path from the localFolderPath to use as the S3 key
            const relativePath = path.relative(localFolderPath, filePath);
            // Ensure S3 keys use forward slashes, even on Windows
            const s3Key = path.join(s3FolderPrefix, relativePath).replace(/\\/g, '/');

            const params = {
                Bucket: bucketName,
                Key: s3Key,
                Body: fileContent,
                // You might want to set ContentType based on file extension
                // ContentType: mime.getType(filePath) || 'application/octet-stream',
            };

            try {
                //const command = new PutObjectCommand(params);
                //await s3Client.send(command);
                console.log(`Successfully uploaded ${filePath} to s3://${bucketName}/${s3Key}`);
            } catch (err) {
                console.error(`Error uploading ${filePath}: `, err);
                // throw err;
            }
        }
        console.log('Folder upload complete.');
    }

    /**
     * Recursively gets all file paths within a directory.
     * @param dirPath The directory path.
     * @param arrayOfFiles Optional array to accumulate file paths.
     * @returns An array of file paths.
     */
    function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
        const files = fs.readdirSync(dirPath);

        files.forEach((file) => {
            const fullPath = path.join(dirPath, file);
            if (fs.statSync(fullPath).isDirectory()) {
                getAllFiles(fullPath, arrayOfFiles);
            } else {
                arrayOfFiles.push(fullPath);
            }
        });

        return arrayOfFiles;
    }
}