import * as fs from "fs";
import * as path from "path";
import { BadRequestException } from "@nestjs/common";
import { isValidImageBuffer } from "../config/multer.config";
import { R2Service } from "../helper/r2.helper";

export class ImageUploadService {

    static async uploadBase64ImageToR2(
        base64Image: string,
        folderPath: string,
        fileName?: string
    ): Promise<{ key: string; mimeType: string }> {

        if (!base64Image) {
            throw new BadRequestException("Image is required");
        }

        const matches = base64Image.match(/^data:(image\/\w+);base64,(.+)$/);

        if (!matches) {
            throw new BadRequestException("Invalid base64 image format");
        }

        const mimeType = matches[1];
        const base64Data = matches[2];
        const ext = mimeType.split("/")[1];

        const buffer = Buffer.from(base64Data, "base64");

        // const isValid = await isValidImageBuffer(buffer);
        // if (!isValid) {
        //     throw new BadRequestException("Invalid image file");
        // }

        const uploadDir = path.join(process.cwd(), `${process.env.IMAGE_PATH}/${process.env.IMAGE_TEMP_PATH}`);

        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        const finalFileName = `${fileName}.${ext}` || `img_${Date.now()}.${ext}`;
        const tempFilePath = path.join(uploadDir, finalFileName);
        await fs.promises.writeFile(tempFilePath, buffer);

        const fileBuffer = await fs.promises.readFile(tempFilePath);
        const key = `${folderPath}/${finalFileName}`;

        await R2Service.upload(fileBuffer, key, mimeType);
        await fs.promises.unlink(tempFilePath);

        return { key, mimeType };
    }
}
