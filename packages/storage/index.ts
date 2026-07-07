import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { logger } from "../logger/index.js";
import { env } from "../config/index.js";

class StorageService {
    private s3Client?: S3Client;
    private provider: "local" | "s3";
    private bucketName?: string | undefined;
    private localUploadPath: string;
    private baseUrl?: string;

    constructor() {
        this.provider = env.STORAGE.PROVIDER;

        // Define where local files should be stored relative to the CWD (which is typically the project root)
        this.localUploadPath = path.resolve(process.cwd(), "apps/api/public/uploads");
        this.baseUrl = env.APP.URL;

        if (this.provider === "s3") {
            this.bucketName = env.STORAGE.BUCKET;
            this.s3Client = new S3Client({
                region: "auto",
                endpoint: `https://${env.STORAGE.ACCOUNT_ID}.r2.cloudflarestorage.com`,
                ...(env.STORAGE.ACCESS_KEY_ID && env.STORAGE.SECRET_ACCESS_KEY
                    ? {
                        credentials: {
                            accessKeyId: env.STORAGE.ACCESS_KEY_ID,
                            secretAccessKey: env.STORAGE.SECRET_ACCESS_KEY,
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
            if (env.STORAGE.PUBLIC_URL) {
                return `${env.STORAGE.PUBLIC_URL.replace(/\/$/, "")}/${key}`;
            }
            return `https://${env.STORAGE.ACCOUNT_ID}.r2.cloudflarestorage.com/${this.bucketName}/${key}`;
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
