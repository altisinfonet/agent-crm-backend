import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import * as multer from 'multer';
import * as sharp from 'sharp';
import { BadRequestException } from '@nestjs/common';
import { execSync } from 'child_process';


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const isVideo = file.mimetype.startsWith('video/');
        const folder = isVideo
            ? `${process.env.IMAGE_PATH}/${process.env.VIDEO_TEMP_PATH}`
            : `${process.env.IMAGE_PATH}/${process.env.IMAGE_TEMP_PATH}`;

        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder, { recursive: true });
        }
        cb(null, folder);
    },
    filename: (req, file, cb) => {
        let ext = path.extname(file.originalname);
        if (file.originalname === 'blob') {
            ext = '.' + file.mimetype.split('/')[1];
        }
        const filename = `${uuidv4()}-${Date.now()}${ext}`

        cb(null, filename);
    }
});

function checkFileType(file: any, cb: multer.FileFilterCallback) {
    try {
        const allowedImageExts = ['.jpeg', '.jpg', '.png', '.webp', '.gif', '.heic'];
        const allowedImageMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/heic'];

        const allowedVideoExts = ['.mp4', '.mov', '.avi', '.mkv'];
        const allowedVideoMimes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska'];

        const fileExt = path.extname(file.originalname).toLowerCase();
        const fileMime = file.mimetype;

        const isImage = allowedImageExts.includes(fileExt) && allowedImageMimes.includes(fileMime);
        const isVideo = allowedVideoExts.includes(fileExt) && allowedVideoMimes.includes(fileMime);

        if (isImage || isVideo) {
            return cb(null, true);
        } else {
            return cb(new BadRequestException('Invalid file type'));
        }
    } catch (error) {
        console.error("error", error)
    }
}

// const upload = multer({
//     storage: storage,
//     fileFilter: function (req, file, cb) {
//         checkFileType(file, cb);
//     }
// });

const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        checkFileType(file, cb);
    },
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
});




export async function isValidImageBuffer(buffer: Buffer): Promise<boolean> {
    try {
        const data = await sharp(buffer).metadata();
        console.log("data", data);
        return true;
    } catch (error: any) {
        console.log("erorr", error);
        return false;
    }
}



export const isValidImage = async (filePath: string): Promise<boolean> => {
    try {
        const fileBuffer = fs.readFileSync(filePath);
        const metadata = await sharp(fileBuffer).metadata();
        return true;
    } catch (error) {
        console.error("Sharp error:", error.message);
        return false;
    }
}


export function validateSafePdf(
    filePath: string,
    mimeType?: string,
    maxSizeMB = 5,
): void {
    const MIN_SANITIZED_SIZE_BYTES = 5 * 1024;
    if (!fs.existsSync(filePath)) {
        throw new BadRequestException('PDF file not found');
    }
    if (mimeType && mimeType !== 'application/pdf') {
        throw new BadRequestException('Only PDF files are allowed');
    }

    const buffer = fs.readFileSync(filePath);

    const maxBytes = maxSizeMB * 1024 * 1024;
    if (buffer.length > maxBytes) {
        throw new BadRequestException(`PDF size must be <= ${maxSizeMB}MB`);
    }

    const header = buffer.subarray(0, 5).toString('ascii');
    if (header !== '%PDF-') {
        throw new BadRequestException('Invalid PDF format');
    }

    const tail = buffer
        .subarray(Math.max(0, buffer.length - 1024))
        .toString('latin1');

    if (!tail.includes('%%EOF')) {
        throw new BadRequestException('Corrupted or incomplete PDF file');
    }

    const tempSafePath = `${filePath}.sanitized.pdf`;
    try {
        execSync(
            `gs -sDEVICE=pdfwrite -dSAFER -dNOPAUSE -dBATCH -dQUIET -sOutputFile="${tempSafePath}" "${filePath}"`,
            { stdio: 'ignore' },
        );
    } catch {
        throw new BadRequestException('Please upload a valid document');
    }

    if (!fs.existsSync(tempSafePath)) {
        throw new BadRequestException('Invalid PDF file');
    }

    const sanitizedSize = fs.statSync(tempSafePath).size;
    if (sanitizedSize < MIN_SANITIZED_SIZE_BYTES) {
        fs.unlinkSync(tempSafePath);
        throw new BadRequestException('Invalid or unsafe document');
    }
    fs.renameSync(tempSafePath, filePath);
}


export function imageFileFilter(
    req: any,
    file: any,
    cb: multer.FileFilterCallback
) {
    const allowedImageMimes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'image/gif',
        'image/heic',
    ];

    if (allowedImageMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new BadRequestException('Only image files are allowed'));
    }
}

/* ----------------------------------
 * DOCUMENT FILTER
 * ---------------------------------- */
export function documentFileFilter(
    req: any,
    file: any,
    cb: multer.FileFilterCallback
) {
    const allowedDocMimes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
    ];

    if (allowedDocMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new BadRequestException('Invalid document file type'));
    }
}

// function checkExcelFileType(file: any, cb: any) {
//     try {
//         const filetypes = /xlsx|xls|csv/;
//         const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

//         const mimetype = file.mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
//             file.mimetype === "application/vnd.ms-excel" ||
//             file.mimetype === "text/csv";
//         // const mimetype = filetypes.test(file.mimetype);
//         if (extname && mimetype) {
//             return cb(null, true);
//         } else {
//             cb('Only Excel (.xlsx, .xls) or CSV (.csv) files are allowed!', false);
//         }
//     } catch (error) {
//         console.log('error', error)
//     }
// }

// const uploadExcel = multer({
//     storage: storage,
//     fileFilter: function (req, file, cb) {
//         checkExcelFileType(file, cb);
//     }
// });

// function checkCSVFileType(file: any, cb: any) {
//     try {
//         const filetypes = /csv/;
//         const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

//         const mimetype = file.mimetype === "text/csv" || file.mimetype === "text/comma-separated-values" || file.mimetype === "application/vnd.ms-excel";
//         // const mimetype = filetypes.test(file.mimetype);
//         if (extname && mimetype) {
//             return cb(null, true);
//         } else {
//             cb('Only CSV (.csv) files are allowed!', false);
//         }
//     } catch (error) {
//         console.log('error', error)
//     }
// }

// const uploadCSV = multer({
//     storage: storage,
//     fileFilter: function (req, file, cb) {
//         checkCSVFileType(file, cb);
//     }
// });

// function checkPDFFileType(file: any, cb: any) {
//     const filetypes = /pdf/;
//     const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
//     const mimetype = file.mimetype === "application/pdf";

//     if (extname && mimetype) {
//         return cb(null, true);
//     } else {
//         cb("Only PDF (.pdf) files are allowed!", false);
//     }
// }

// const uploadPDF = multer({
//     storage: storage,
//     fileFilter: (req, file, cb) => {
//         checkPDFFileType(file, cb);
//     },
// });


export { storage, upload, checkFileType }
