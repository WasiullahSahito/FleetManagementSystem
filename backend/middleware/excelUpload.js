import multer from 'multer';

// Use memory storage because we process the file immediately and don't need to save it.
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    // Check for Excel file extensions
    if (
        file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || // .xlsx
        file.mimetype === 'application/vnd.ms-excel' // .xls
    ) {
        cb(null, true);
    } else {
        cb(new Error('Only .xlsx and .xls files are allowed!'), false);
    }
};

export const excelUpload = multer({ storage, fileFilter });