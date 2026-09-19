const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "uploads", "plugins");

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const config = JSON.parse(
    fs.readFileSync(
        path.join(__dirname, "data", "config.json"),
        "utf8"
    )
);

const storage = multer.diskStorage({

    destination(req, file, cb) {

        cb(null, uploadDir);

    },

    filename(req, file, cb) {

        const ext = path.extname(file.originalname);

        const fileName =
            Date.now() +
            "-" +
            Math.random()
                .toString(36)
                .substring(2, 8) +
            ext;

        cb(null, fileName);

    }

});

module.exports = multer({

    storage,

    limits: {

        fileSize:
            config.uploadLimitMB *
            1024 *
            1024

    },

    fileFilter(req, file, cb) {

        const ext =
            path.extname(file.originalname)
            .toLowerCase();

        if (
            ext === ".jar" &&
            config.allowJar
        ) {

            return cb(null, true);

        }

        if (
            ext === ".zip" &&
            config.allowZip
        ) {

            return cb(null, true);

        }

        cb(
            new Error(
                "Dozwolone są tylko pliki .jar oraz .zip"
            )
        );

    }

});
