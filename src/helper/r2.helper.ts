import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { Injectable } from "@nestjs/common";
import { r2Client } from "src/common/config/r2.config";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

@Injectable()
export class R2Service {
    static async upload(buffer: Buffer, key: string, mime: string) {
        return r2Client.send(
            new PutObjectCommand({
                Bucket: process.env.R2_BUCKET_NAME!,
                Key: key,
                Body: buffer,
                ContentType: mime,
            })
        );
    }

    static async remove(key: string) {
        return r2Client.send(
            new DeleteObjectCommand({
                Bucket: process.env.R2_BUCKET_NAME!,
                Key: key,
            })
        );
    }

    static async getSignedUrl(key: string, expiresIn = 3600) {
        const command = new GetObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME!,
            Key: key,
        });

        return getSignedUrl(r2Client, command, { expiresIn });
    }
}


