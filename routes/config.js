const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

const CONFIG = path.join(
    __dirname,
    "..",
    "data",
    "config.json"
);

function loadConfig() {

    if (!fs.existsSync(CONFIG)) {

        return {
            maintenance: false,
            creators: true,
            plugins: true,
            scripts: true,
            premium: true
        };

    }

    return JSON.parse(
        fs.readFileSync(CONFIG, "utf8")
    );

}
router.get("/", (req, res) => {

    res.json(loadConfig());

});

router.get("/maintenance", (req, res) => {

    const config = loadConfig();

    res.json({
        maintenance: config.maintenance
    });

});

router.get("/features", (req, res) => {

    const config = loadConfig();

    res.json({

        creators: config.creators,
        plugins: config.plugins,
        scripts: config.scripts,
        premium: config.premium

    });

});
router.get("/creator", (req, res) => {

    const config = loadConfig();

    res.json({
        enabled: config.creators
    });

});

router.get("/plugins", (req, res) => {

    const config = loadConfig();

    res.json({
        enabled: config.plugins
    });

});

router.get("/scripts", (req, res) => {

    const config = loadConfig();

    res.json({
        enabled: config.scripts
    });

});

router.get("/premium", (req, res) => {

    const config = loadConfig();

    res.json({
        enabled: config.premium
    });

});
router.get("/all", (req, res) => {

    res.json(loadConfig());

});

module.exports = router;
