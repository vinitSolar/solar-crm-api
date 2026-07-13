import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import { fileURLToPath } from "url";
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

        // Locate the workspace root dynamically based on the current module's location
        const currentDir = path.dirname(fileURLToPath(import.meta.url));
        let workspaceRoot = currentDir;
        
        // Traverse upwards until we find the project root (which contains the 'apps' and 'packages' directories)
        while (workspaceRoot !== path.dirname(workspaceRoot)) {
            const hasApps = fsSync.existsSync(path.join(workspaceRoot, "apps"));
            const hasPackages = fsSync.existsSync(path.join(workspaceRoot, "packages"));
            if (hasApps && hasPackages) {
                break;
            }
            workspaceRoot = path.dirname(workspaceRoot);
        }

        // Fallback to process.cwd() if project structure isn't matched
        if (!fsSync.existsSync(path.join(workspaceRoot, "apps"))) {
            workspaceRoot = process.cwd();
        }

        this.localUploadPath = path.resolve(workspaceRoot, "apps/api/public/uploads");
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

    async uploadFile(buffer: Buffer, originalName: string, mimeType: string, folder: string = "general"): Promise<string> {
        const { url } = await this.uploadFileWithPath(buffer, originalName, mimeType, folder);
        return url;
    }

    /**
     * Uploads a file buffer and returns both the public URL and the relative storage path (key).
     */
    async uploadFileWithPath(buffer: Buffer, originalName: string, mimeType: string, folder: string = "general"): Promise<{ url: string; path: string }> {
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
            let url = "";
            if (env.STORAGE.PUBLIC_URL) {
                url = `${env.STORAGE.PUBLIC_URL.replace(/\/$/, "")}/${key}`;
            } else {
                url = `https://${env.STORAGE.ACCOUNT_ID}.r2.cloudflarestorage.com/${this.bucketName}/${key}`;
            }
            return { url, path: key };
        } else {
            // Local storage
            const targetDir = path.join(this.localUploadPath, folder);
            await fs.mkdir(targetDir, { recursive: true });

            const filePath = path.join(targetDir, fileName);
            await fs.writeFile(filePath, buffer);

            // Return public URL assuming express static serves apps/api/public at /public
            const url = `${this.baseUrl}/public/uploads/${key}`;
            return { url, path: key };
        }
    }
}

export const storageService = new StorageService();
