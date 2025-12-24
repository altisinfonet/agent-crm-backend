import * as crypto from 'crypto';

export class CryptoUtil {
    private static getKey(): Buffer {
        const key = process.env.TOKEN_ENCRYPTION_KEY;

        if (!key) {
            throw new Error(
                'TOKEN_ENCRYPTION_KEY is missing. Please set it in your environment variables.'
            );
        }
        return Buffer.from(key, 'hex');
    }

    static hash(value: string): string {
        return crypto.createHash('sha256').update(value).digest('hex');
    }

    static encrypt(text: string): string {
        const key = this.getKey(); // now always Buffer (never undefined)
        const iv = crypto.randomBytes(16);

        const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
        const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
        const tag = cipher.getAuthTag();

        return Buffer.concat([iv, tag, encrypted]).toString('base64');
    }

    static decrypt(enc: string): string {
        const key = this.getKey(); // now always valid
        const data = Buffer.from(enc, 'base64');

        const iv = data.subarray(0, 16);
        const tag = data.subarray(16, 32);
        const encrypted = data.subarray(32);

        const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAuthTag(tag);

        const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
        return decrypted.toString('utf8');
    }

    static compareHash(value: string, hash: string): boolean {
        return this.hash(value) === hash;
    }
}
