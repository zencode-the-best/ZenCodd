const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "uploads", "plugins");

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },

    filename: (req, file, cb) => {
        const name = Date.now() + "-" + file.originalname;
        cb(null, name);
    }
});

module.exports = multer({
    storage,
    limits: {
        fileSize: 1024 * 1024 * 100 // 100 MB
    },
    fileFilter: (req, file, cb) => {

        const ext = path.extname(file.originalname).toLowerCase();

        if (
            ext === ".jar" ||
            ext === ".zip"
        ) {
            return cb(null, true);
        }

        cb(new Error("Dozwolone są tylko pliki .jar i .zip"));

    }
});
