
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import { readdirSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { Configuration } from '../config/configuration';

export class S3Service {
    private readonly s3Client: S3Client;
    private readonly bucketName: string;

    constructor(customBucketName?: string) {
        const config = Configuration.getInstance().getConfig();
        this.bucketName = customBucketName || config.s3.reports.bucketName;
        this.s3Client = new S3Client({
            region: process.env.AWS_REGION,
            endpoint: 'https://s3.amazonaws.com',
            forcePathStyle: true
        });
    }

    private streamToString(stream: Readable): Promise<string> {
        return new Promise((resolve, reject) => {
            const chunks: any[] = [];
            stream.on('data', chunk => chunks.push(chunk));
            stream.on('error', reject);
            stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
        });
    }

    async uploadFile(key: string, content: Buffer | string, contentType: string): Promise<void> {
        const command = new PutObjectCommand({
            Bucket: this.bucketName,
            Key: key,
            Body: content,
            ContentType: contentType,
        });
        await this.s3Client.send(command);
    }

    async getFile(key: string): Promise<string> {
        const command = new GetObjectCommand({
            Bucket: this.bucketName,
            Key: key,
        });
        const response = await this.s3Client.send(command);
        return this.streamToString(response.Body as Readable);
    }

    async uploadReport(reportDir: string, testResultsDir: string, keyPrefix: string): Promise<void> {
        // Subir index.html
        const indexPath = join(reportDir, 'index.html');
        if (!existsSync(indexPath)) {
            throw new Error('No se encontró el archivo index.html en el directorio de reportes');
        }

        const indexContent = readFileSync(indexPath);
        await this.uploadFile(
            `${keyPrefix}/index.html`,
            indexContent,
            'text/html'
        );

        // Subir archivos de test-results
        if (existsSync(testResultsDir)) {
            const testResultsFiles = readdirSync(testResultsDir, { withFileTypes: true });
            for (const file of testResultsFiles) {
                if (file.isFile()) {
                    const filePath = join(testResultsDir, file.name);
                    const fileContent = readFileSync(filePath);
                    await this.uploadFile(
                        `${keyPrefix}/test-results/${file.name}`,
                        fileContent,
                        'application/json'
                    );
                }
            }
        }
    }
} 