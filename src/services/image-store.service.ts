import mime from "mime-types";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { singleton } from "tsyringe";
import { Logger } from "./logger.service.js";
import { randomUUID } from "crypto";

@singleton()
export class ImageStore {
    private readonly s3Client: S3Client;

    constructor(private readonly logger: Logger) {
        this.s3Client = new S3Client({});
    }

    async uploadImage(image: Buffer, mimeType: string): Promise<string> {
        const fileName = await this.putObjectInS3(mimeType, image);
        this.logger.debug("Image uploaded to S3", { fileName });
        const result = await this.generateTempDownloadUrl(fileName);
        this.logger.debug("Generated temp download URL", { fileName, result });
        return result;
    }

    private async putObjectInS3(mimeType: string, image: Buffer) {
        const extension = mime.extension(mimeType);
        if (!extension) {
            throw new Error("Invalid mime type");
        }
        const randomId = randomUUID();
        const fileName = `${randomId}.${extension}`;
        await this.s3Client.send(new PutObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: fileName,
            Body: image
        }));
        return fileName;
    }

    private generateTempDownloadUrl(fileName: string) {
        const command = new GetObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: fileName,
        });
        return getSignedUrl(this.s3Client, command, { expiresIn: this.getTempUrlExpiration() });
    }

    private getTempUrlExpiration(): number {
        const historyMinutes = parseInt(process.env.HISTORY_TTL_IN_MINUTES || "1");
        const minutes = historyMinutes + 1; // Allow processing time
        return minutes * 60; // Convert to seconds
    }
}