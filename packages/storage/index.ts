import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { logger } from "../logger/index.js";

class StorageService {
    private s3Client?: S3Client;
    private provider: "local" | "s3";
    private bucketName?: string | undefined;
    private localUploadPath: string;
    private baseUrl?: string;

    constructor() {
        this.provider = (process.env.STORAGE_PROVIDER as "local" | "s3") || "local";

        // Define where local files should be stored relative to the CWD (which is typically the project root)
        this.localUploadPath = path.resolve(process.cwd(), "apps/api/public/uploads");
        this.baseUrl = process.env.API_BASE_URL || "http://localhost:5000";

        if (this.provider === "s3") {
            this.bucketName = process.env.S3_BUCKET_NAME;
            this.s3Client = new S3Client({
                region: process.env.S3_REGION || "auto",
                ...(process.env.S3_ENDPOINT ? { endpoint: process.env.S3_ENDPOINT } : {}),
                ...(process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY
                    ? {
                        credentials: {
                            accessKeyId: process.env.S3_ACCESS_KEY_ID,
                            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
                        },
                    }
                    : {}),
            });
            logger.info("StorageService initialized with S3/Cloudflare R2 provider");
        } else {
            logger.info("StorageService initialized with Local provider");
            this.ensureLocalDirectory();
        }
    }

    private async ensureLocalDirectory() {
        try {
            await fs.mkdir(this.localUploadPath, { recursive: true });
        } catch (error) {
            logger.error("Failed to create local upload directory", error);
        }
    }

    /**
     * Uploads a file buffer to the configured storage provider.
     * @param buffer The file buffer
     * @param originalName The original file name
     * @param mimeType The file mime type
     * @param folder The target folder (e.g. "logos")
     * @returns The public URL of the uploaded file
     */
    async uploadFile(buffer: Buffer, originalName: string, mimeType: string, folder: string = "general"): Promise<string> {
        const ext = path.extname(originalName) || "";
        const fileName = `${uuidv4()}${ext}`;
        const key = `${folder}/${fileName}`;

        if (this.provider === "s3") {
            if (!this.s3Client || !this.bucketName) {
                throw new Error("S3 client is not properly configured");
            }

            const command = new PutObjectCommand({
                Bucket: this.bucketName,
                Key: key,
                Body: buffer,
                ContentType: mimeType,
            });

            await this.s3Client.send(command);

            // Generate public URL (assumes Cloudflare R2 / public S3 bucket structure or custom domain)
            // If S3_PUBLIC_DOMAIN is provided, use that, otherwise fallback to endpoint/bucket
            if (process.env.S3_PUBLIC_DOMAIN) {
                return `${process.env.S3_PUBLIC_DOMAIN}/${key}`;
            }
            const endpoint = process.env.S3_ENDPOINT?.replace(/\/$/, "") || "";
            return `${endpoint}/${this.bucketName}/${key}`;
        } else {
            // Local storage
            const targetDir = path.join(this.localUploadPath, folder);
            await fs.mkdir(targetDir, { recursive: true });

            const filePath = path.join(targetDir, fileName);
            await fs.writeFile(filePath, buffer);

            // Return public URL assuming express static serves apps/api/public at /public
            return `${this.baseUrl}/public/uploads/${key}`;
        }
    }
}

export const storageService = new StorageService();
