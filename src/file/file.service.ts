import { readFile, unlink } from 'fs/promises';
import { existsSync } from 'fs';

export class FileService {
    static async readFileBuffer(filePath: string): Promise<Buffer> {
        if (!filePath) {
            throw new Error('File path is required');
        }

        if (!existsSync(filePath)) {
            throw new Error(`File not found at path: ${filePath}`);
        }

        return readFile(filePath);
    }

    static async removeFile(filePath: string): Promise<void> {
        if (!filePath) return;

        try {
            if (existsSync(filePath)) {
                await unlink(filePath);
            }
        } catch (error) {
            console.error(`Failed to delete temp file: ${filePath}`, error);
        }
    }
}
