const express = require("express");
const fs = require("fs");
const path = require("path");

const upload = require("../upload");
const { sendDownloadLog } = require("./downloadLogs");

const router = express.Router();

const OWNER_ID = "1238570679465410571";

const DATA_FILE = path.join(
    __dirname,
    "..",
    "data",
    "plugins.json"
);

const UPLOAD_DIR = path.join(
    __dirname,
    "..",
    "uploads",
    "plugins"
);

function loadPlugins() {

    try {

        return JSON.parse(
            fs.readFileSync(DATA_FILE, "utf8")
        );

    } catch {

        return [];

    }

}

function savePlugins(data) {

    fs.writeFileSync(
        DATA_FILE,
        JSON.stringify(data, null, 4)
    );

}
/* =========================
   LISTA PLUGINÓW
========================= */

router.get("/", (req, res) => {

    const plugins = loadPlugins();

    const search = (req.query.search || "")
        .toLowerCase()
        .trim();

    if (!search) {
        return res.json(plugins);
    }

    const filtered = plugins.filter(plugin => {

        return (
            (plugin.name || "")
                .toLowerCase()
                .includes(search) ||

            (plugin.description || "")
                .toLowerCase()
                .includes(search) ||

            (plugin.version || "")
                .toLowerCase()
                .includes(search)
        );

    });

    res.json(filtered);

});

/* =========================
   JEDEN PLUGIN
========================= */

router.get("/:id", (req, res) => {

    const plugins = loadPlugins();

    const plugin = plugins.find(
        p => String(p.id) === String(req.params.id)
    );

    if (!plugin) {

        return res.status(404).json({
            success: false,
            message: "Plugin nie istnieje."
        });

    }

    res.json({
        success: true,
        plugin
    });

});
/* =========================
   DODAWANIE PLUGINU
========================= */

router.post(
    "/upload",
    upload.single("plugin"),
    (req, res) => {

        if (!req.user || req.user.id !== OWNER_ID) {

            return res.status(403).json({
                success: false,
                message: "Brak uprawnień."
            });

        }

        if (!req.file) {

            return res.status(400).json({
                success: false,
                message: "Nie wybrano pliku."
            });

        }

        const plugins = loadPlugins();

        const plugin = {

            id: Date.now(),

            name:
                (req.body.name || "").trim(),

            description:
                (req.body.description || "").trim(),

            version:
                (req.body.version || "1.0.0").trim(),

            premium:
                req.body.premium === "true",

            image:
                (req.body.image || "").trim(),

            rating: 5,

            downloads: 0,

            file: req.file.filename,

            originalFile:
                req.file.originalname,

            size:
                req.file.size,

            createdAt:
                new Date().toISOString()

        };

        if (!plugin.name) {

            return res.status(400).json({
                success: false,
                message: "Podaj nazwę pluginu."
            });

        }

        plugins.push(plugin);

        savePlugins(plugins);

        res.json({

            success: true,

            plugin

        });

    }
);
/* =========================
   POBIERANIE
========================= */

router.get("/download/:id", async (req, res) => {

    const plugins = loadPlugins();

    const plugin = plugins.find(
        p => String(p.id) === String(req.params.id)
    );

    if (!plugin) {

        return res.status(404).json({
            success: false,
            message: "Plugin nie istnieje."
        });

    }

    const filePath = path.join(
        UPLOAD_DIR,
        plugin.file
    );

    if (!fs.existsSync(filePath)) {

        return res.status(404).json({
            success: false,
            message: "Plik nie istnieje."
        });

    }

    plugin.downloads =
        (plugin.downloads || 0) + 1;

    savePlugins(plugins);

    await sendDownloadLog(
        req.user,
        "Plugin",
        plugin.name
    );

    res.download(
        filePath,
        plugin.originalFile || plugin.file
    );

});

/* =========================
   USUWANIE
========================= */

router.delete("/:id", (req, res) => {

    if (!req.user || req.user.id !== OWNER_ID) {

        return res.status(403).json({
            success: false,
            message: "Brak uprawnień."
        });

    }

    let plugins = loadPlugins();

    const plugin = plugins.find(
        p => String(p.id) === String(req.params.id)
    );

    if (!plugin) {

        return res.status(404).json({
            success: false,
            message: "Plugin nie istnieje."
        });

    }

    try {

        fs.unlinkSync(
            path.join(
                UPLOAD_DIR,
                plugin.file
            )
        );

    } catch (err) {

        console.warn("Nie udało się usunąć pliku:", err.message);

    }

    plugins = plugins.filter(
        p => String(p.id) !== String(req.params.id)
    );

    savePlugins(plugins);

    res.json({
        success: true
    });

});

module.exports = router;
