import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import * as multer from 'multer';
import sharp from 'sharp';
import { BadRequestException } from '@nestjs/common';


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
        await sharp(buffer).metadata();
        return true;
    } catch {
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
