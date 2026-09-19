const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

const OWNER_ID = "1238570679465410571";

const CONFIG_PATH = path.join(
    __dirname,
    "..",
    "data",
    "config.json"
);

function loadConfig() {

    if (!fs.existsSync(CONFIG_PATH)) {

        fs.writeFileSync(
            CONFIG_PATH,
            JSON.stringify({
                maintenance: false,
                creators: true,
                plugins: true,
                scripts: true,
                premium: true
            }, null, 4)
        );

    }

    return JSON.parse(
        fs.readFileSync(CONFIG_PATH, "utf8")
    );

}
function saveConfig(config) {

    fs.writeFileSync(
        CONFIG_PATH,
        JSON.stringify(config, null, 4)
    );

}

router.get("/", (req, res) => {

    if (!req.user) {

        return res.status(401).json({
            success: false,
            message: "Musisz być zalogowany."
        });

    }

    if (req.user.id !== OWNER_ID) {

        return res.status(403).json({
            success: false,
            message: "Brak uprawnień."
        });

    }

    res.json(loadConfig());

});
router.post("/toggle/:key", (req, res) => {

    if (!req.user) {

        return res.status(401).json({
            success: false,
            message: "Musisz być zalogowany."
        });

    }

    if (req.user.id !== OWNER_ID) {

        return res.status(403).json({
            success: false,
            message: "Brak uprawnień."
        });

    }

    const config = loadConfig();

    const key = req.params.key;

    if (!(key in config)) {

        return res.status(404).json({
            success: false,
            message: "Nie znaleziono ustawienia."
        });

    }

    config[key] = !config[key];

    saveConfig(config);

    res.json({
        success: true,
        key,
        value: config[key]
    });

});
router.post("/set/:key", (req, res) => {

    if (!req.user) {

        return res.status(401).json({
            success: false,
            message: "Musisz być zalogowany."
        });

    }

    if (req.user.id !== OWNER_ID) {

        return res.status(403).json({
            success: false,
            message: "Brak uprawnień."
        });

    }

    const config = loadConfig();

    const key = req.params.key;

    if (!(key in config)) {

        return res.status(404).json({
            success: false,
            message: "Nie znaleziono ustawienia."
        });

    }

    config[key] = Boolean(req.body.value);

    saveConfig(config);

    res.json({
        success: true,
        config
    });

});

module.exports = router;
