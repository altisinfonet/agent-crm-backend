/**
 * Generates a unique slug for a given base string and model field
 * @param base The base string to convert into a slug
 * @param model The Prisma model to check against
 * @param field The field name to ensure uniqueness (usually 'slug')
 * @returns A unique slug string
 */

import CryptoJS from 'crypto-js';
import * as bcrypt from 'bcrypt';

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



export const decryptData = (data: any) => {
    const secretKey = process.env.PUBLIC_ENCRYPTION_KEY;
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
    const secretKey = process.env.PUBLIC_ENCRYPTION_KEY;

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