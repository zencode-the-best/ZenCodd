const express = require("express");
const fs = require("fs");
const path = require("path");
const upload = require("../upload");

const router = express.Router();

const OWNER_ID = "1238570679465410571";

const DATA_FILE = path.join(__dirname, "..", "data", "plugins.json");

function loadPlugins() {

    try {

        return JSON.parse(
            fs.readFileSync(DATA_FILE, "utf8")
        );

    } catch {

        return [];

    }

}

function savePlugins(plugins) {

    fs.writeFileSync(
        DATA_FILE,
        JSON.stringify(
            plugins,
            null,
            4
        )
    );

}

router.get("/", (req, res) => {

    res.json(
        loadPlugins()
    );

});

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
                req.body.name || "Bez nazwy",

            description:
                req.body.description || "",

            version:
                req.body.version || "1.0.0",

            file:
                req.file.filename,

            downloads: 0,

            createdAt:
                new Date().toISOString()

        };

        plugins.push(plugin);

        savePlugins(plugins);

        res.json({

            success: true,

            plugin

        });

    }
);

router.get("/download/:id", (req, res) => {

    const plugins = loadPlugins();

    const plugin = plugins.find(
        p => p.id == req.params.id
    );

    if (!plugin) {

        return res.status(404).json({
            success: false,
            message: "Plugin nie istnieje."
        });

    }

    plugin.downloads++;

    savePlugins(plugins);

    res.download(
        path.join(
            __dirname,
            "..",
            "uploads",
            "plugins",
            plugin.file
        )
    );

});

module.exports = router;
