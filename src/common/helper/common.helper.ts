/**
 * Generates a unique slug for a given base string and model field
 * @param base The base string to convert into a slug
 * @param model The Prisma model to check against
 * @param field The field name to ensure uniqueness (usually 'slug')
 * @returns A unique slug string
 */

import * as CryptoJS from 'crypto-js';
import * as bcrypt from 'bcrypt';
import slugify from 'slugify';
import { PrismaService } from '../../prisma/prisma.service';


const prisma = new PrismaService();

export const generateSlug = async (
    base: string,
    model: any,
    field: string
): Promise<string> => {
    if (!base) {
        throw new Error('Base string for slug generation is empty.');
    }

    try {
        let slug = slugify(base, { lower: true, strict: true });
        let uniqueSlug = slug;
        let counter = 1;

        while (await model.findFirst({ where: { [field]: uniqueSlug } })) {
            uniqueSlug = `${slug}-${counter}`;
            counter++;
        }

        return uniqueSlug;
    } catch (error) {
        console.error('Error generating slug:', error);
        throw new Error('Failed to generate a unique slug.');
    }
};


export function buildUserRootFolder(
    username: string,
    panNumber: string,
    user_id?: string,
    baseimgPath?: string | null,
    customer?: boolean
) {
    const safeName = slugify(username, { lower: true });
    const safePan = panNumber.toUpperCase().replace(/\s+/g, "");
    let path = '';
    if (user_id) {
        path = `_${user_id}`
    }
    if (customer) {
        return `${process.env.ROOT_FOLDER}/${process.env.IMAGE_PATH}/${baseimgPath}/customers/${safeName}_${safePan}${path}`;
    }
    return `${process.env.ROOT_FOLDER}/${process.env.IMAGE_PATH}/${safeName}_${safePan}${path}`;
}


export const generateOTP = () => {
    let otp = '';

    otp += Math.floor(Math.random() * 9) + 1;
    for (let i = 1; i < 6; i++) {
        otp += Math.floor(Math.random() * 10);
    }
    return process.env.OTP_SMS_SEND === "true" ? otp : '111111';
};


export const hashPassword = (password: string): Promise<string> => {
    return bcrypt.hash(password, 10);
}

export const addDays = (days: number, mins: number): number => {
    const date = new Date();
    const minutes = mins * 60
    date.setDate(date.getDate() + days);
    date.setSeconds(date.getSeconds() + minutes);
    return Math.floor(date.getTime() / 1000);
}

export const addYearsFrom = (timestamp: number, years: number): number => {
    const date = new Date(timestamp * 1000);
    date.setFullYear(date.getFullYear() + years);
    return Math.floor(date.getTime() / 1000);
}

export async function generateRandomID(length = 12) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%!&';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

export const decryptData = (data: any) => {
    const secretKey = process.env.PRIVATE_ENCRYPTION_KEY;
    if (!secretKey) {
        console.error("Decryption key is missing!");
        return null;
    }

    try {
        const bytes = CryptoJS.AES.decrypt(data, secretKey);
        const decryptedData = bytes.toString(CryptoJS.enc.Utf8);

        return JSON.parse(decryptedData);
    } catch (error) {
        console.error("Decryption failed:", error);
        return null;
    }
};

export const encryptData = (data: any) => {
    const secretKey = process.env.PRIVATE_ENCRYPTION_KEY;

    if (!secretKey) {
        console.error("Encryption key not found");
        return null;
    }

    try {
        const result = JSON.stringify(data, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value,
        );

        return CryptoJS.AES.encrypt(result, secretKey).toString();
    } catch (error) {
        console.error("Encryption failed:", error);
        return null;
    }
};

export async function createMetaData(
    table_id: bigint,
    table_name: string,
    key: string,
    value: string,
) {
    return await prisma.metaData.create({
        data: {
            table_id: table_id,
            table_name: table_name,
            key: key,
            value: value
        }
    });
}

export async function createNotification(
    userId: bigint,
    type: string,
    title: string,
    desc: string,
    metadata: any = {},
    image?: string
) {
    return await prisma.inAppNotifications.create({
        data: {
            user_id: userId,
            type,
            title,
            desc,
            metadata,
            image,
        },
    });
}