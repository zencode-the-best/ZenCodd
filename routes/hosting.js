const express = require("express");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const router = express.Router();

const OWNER_ID =
    String(
        process.env.OWNER_ID ||
        "1238570679465410571"
    );

const DATA_DIR =
    path.join(
        __dirname,
        "..",
        "data",
        "hosting"
    );

const SERVICES_FILE =
    path.join(
        DATA_DIR,
        "services.json"
    );

const CODES_FILE =
    path.join(
        DATA_DIR,
        "codes.json"
    );

const TRANSACTIONS_FILE =
    path.join(
        DATA_DIR,
        "transactions.json"
    );

fs.mkdirSync(
    DATA_DIR,
    {
        recursive: true
    }
);


function readJSON(file, fallback) {

    try {

        if (!fs.existsSync(file)) {
            return fallback;
        }

        return JSON.parse(
            fs.readFileSync(
                file,
                "utf8"
            )
        );

    } catch {

        return fallback;

    }

}


function writeJSON(file, data) {

    fs.writeFileSync(
        file,
        JSON.stringify(
            data,
            null,
            2
        ),
        "utf8"
    );

}


function createId(prefix = "service") {

    return `${prefix}-${Date.now()}-${crypto
        .randomBytes(5)
        .toString("hex")}`;

}


function requireLogin(req, res, next) {

    if (!req.user) {

        return res
            .status(401)
            .json({
                success: false,
                message: "Musisz być zalogowany."
            });

    }

    next();

}


function requireOwner(req, res, next) {

    if (
        !req.user ||
        String(req.user.id) !== OWNER_ID
    ) {

        return res
            .status(403)
            .json({
                success: false,
                message: "Brak uprawnień."
            });

    }

    next();

}


function normalizeServiceType(value) {

    const type =
        String(
            value || ""
        )
        .trim()
        .toLowerCase();

    const aliases = {

        minecraft: "minecraft",
        mc: "minecraft",
        "minecraft-server": "minecraft",
        "minecraft-hosting": "minecraft",

        discord: "discord",
        bot: "discord",
        "discord-bot": "discord",

        web: "web",
        www: "web",
        website: "web",
        "web-hosting": "web"

    };

    return aliases[type] || type;

}


function getWalletRouter() {

    const walletsFile =
        path.join(
            __dirname,
            "..",
            "data",
            "wallet",
            "wallets.json"
        );

    fs.mkdirSync(
        path.dirname(walletsFile),
        {
            recursive: true
        }
    );

    return walletsFile;

}


function getWallet(userId) {

    const file =
        getWalletRouter();

    const wallets =
        readJSON(
            file,
            []
        );

    const wallet =
        wallets.find(
            item =>
                String(item.userId) ===
                String(userId)
        );

    return wallet || {
        userId: String(userId),
        balance: 0
    };

}


function changeBalance(userId, amount) {

    const file =
        getWalletRouter();

    const wallets =
        readJSON(
            file,
            []
        );

    let wallet =
        wallets.find(
            item =>
                String(item.userId) ===
                String(userId)
        );

    if (!wallet) {

        wallet = {
            userId: String(userId),
            balance: 0
        };

        wallets.push(wallet);

    }

    const nextBalance =
        Number(wallet.balance || 0) +
        Number(amount || 0);

    if (
        nextBalance < 0
    ) {
        return null;
    }

    wallet.balance =
        Number(
            nextBalance.toFixed(2)
        );

    wallet.updatedAt =
        new Date().toISOString();

    writeJSON(
        file,
        wallets
    );

    return wallet;

}


const PRICES = {

    minecraft: {

        dirt: {
            7: 2.99,
            30: 9.99,
            90: 24.99
        },

        obsidian: {
            7: 6.99,
            30: 19.99,
            90: 49.99
        },

        "złoto": {
            7: 11.99,
            30: 34.99,
            90: 89.99
        },

        szmaragd: {
            7: 18.99,
            30: 54.99,
            90: 139.99
        },

        diament: {
            7: 29.99,
            30: 84.99,
            90: 219.99
        }

    },

    discord: {

        "bot-start": {
            7: 1,
            30: 3,
            90: 8
        },

        "bot-plus": {
            7: 2,
            30: 6,
            90: 15
        },

        "bot-pro": {
            7: 4,
            30: 10,
            90: 25
        }

    },

    web: {

        "www-start": {
            7: 2,
            30: 5,
            90: 12
        },

        "www-plus": {
            7: 4,
            30: 10,
            90: 25
        },

        "www-pro": {
            7: 7,
            30: 18,
            90: 45
        }

    }

};


const MINECRAFT_SOFTWARE = [
    "vanilla",
    "paper",
    "purpur",
    "fabric",
    "forge",
    "velocity"
];


const MINECRAFT_VERSIONS = {

    vanilla: [
        "1.8.8",
        "1.9.4",
        "1.10.2",
        "1.11.2",
        "1.12.2",
        "1.13.2",
        "1.14.4",
        "1.15.2",
        "1.16.5",
        "1.17.1",
        "1.18.2",
        "1.19.4",
        "1.20.1",
        "1.20.2",
        "1.20.4",
        "1.20.6",
        "1.21",
        "1.21.1",
        "1.21.3",
        "1.21.4",
        "1.21.5",
        "1.21.6",
        "1.21.7",
        "1.21.8"
    ],

    paper: [
        "1.8.8",
        "1.9.4",
        "1.10.2",
        "1.11.2",
        "1.12.2",
        "1.13.2",
        "1.14.4",
        "1.15.2",
        "1.16.5",
        "1.17.1",
        "1.18.2",
        "1.19.4",
        "1.20.1",
        "1.20.2",
        "1.20.4",
        "1.20.6",
        "1.21",
        "1.21.1",
        "1.21.3",
        "1.21.4",
        "1.21.5",
        "1.21.6",
        "1.21.7",
        "1.21.8"
    ],

    purpur: [
        "1.14.4",
        "1.15.2",
        "1.16.5",
        "1.17.1",
        "1.18.2",
        "1.19.4",
        "1.20.1",
        "1.20.2",
        "1.20.4",
        "1.20.6",
        "1.21",
        "1.21.1",
        "1.21.3",
        "1.21.4",
        "1.21.5",
        "1.21.6",
        "1.21.7",
        "1.21.8"
    ],

    fabric: [
        "1.14.4",
        "1.15.2",
        "1.16.5",
        "1.17.1",
        "1.18.2",
        "1.19.4",
        "1.20.1",
        "1.20.2",
        "1.20.4",
        "1.20.6",
        "1.21",
        "1.21.1",
        "1.21.3",
        "1.21.4",
        "1.21.5",
        "1.21.6",
        "1.21.7",
        "1.21.8"
    ],

    forge: [
        "1.12.2",
        "1.14.4",
        "1.15.2",
        "1.16.5",
        "1.17.1",
        "1.18.2",
        "1.19.4",
        "1.20.1",
        "1.20.2",
        "1.20.4",
        "1.20.6",
        "1.21",
        "1.21.1"
    ],

    velocity: [
        "3.2.0",
        "3.3.0",
        "3.3.1",
        "3.4.0"
    ]

};


const NODE_VERSIONS = [
    "18",
    "20",
    "22"
];


const WEB_TYPES = [
    "static",
    "php"
];


function getPackagePrice(
    service,
    packageName,
    days
) {

    return Number(
        PRICES?.[service]?.[packageName]?.[days] ||
        0
    );

}


function getMinecraftResources(packageName) {

    const resources = {

        dirt: {
            ram: "2 GB",
            cpu: "1 vCore",
            disk: "25 GB"
        },

        obsidian: {
            ram: "4 GB",
            cpu: "2 vCore",
            disk: "50 GB"
        },

        "złoto": {
            ram: "6 GB",
            cpu: "2 vCore",
            disk: "75 GB"
        },

        szmaragd: {
            ram: "8 GB",
            cpu: "3 vCore",
            disk: "100 GB"
        },

        diament: {
            ram: "12 GB",
            cpu: "4 vCore",
            disk: "150 GB"
        }

    };

    return (
        resources[packageName] ||
        resources.dirt
    );

}


function generateNetwork(serviceId) {

    const text =
        String(serviceId);

    let hash = 0;

    for (
        let index = 0;
        index < text.length;
        index++
    ) {

        hash =
            (
                hash * 31 +
                text.charCodeAt(index)
            ) >>> 0;

    }

    const octet2 =
        10 +
        hash % 220;

    const octet3 =
        10 +
        Math.floor(hash / 220) % 220;

    const octet4 =
        10 +
        Math.floor(hash / 48400) % 220;

    const port =
        20000 +
        hash % 39999;

    return {

        ipv4:
            `185.${octet2}.${octet3}:${port}`,

        port

    };

}


function getServerName(service) {

    return String(
        service.serverName ||
        service.config?.serverName ||
        "twojserwer"
    )
    .trim()
    .toLowerCase()
    .replace(/ą/g, "a")
    .replace(/ć/g, "c")
    .replace(/ę/g, "e")
    .replace(/ł/g, "l")
    .replace(/ń/g, "n")
    .replace(/ó/g, "o")
    .replace(/ś/g, "s")
    .replace(/ź/g, "z")
    .replace(/ż/g, "z")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32) || "twojserwer";

}


function ensureNetwork(service) {

    if (
        !service.hostname ||
        !service.ipv4
    ) {

        const network =
            generateNetwork(
                service.id
            );

        service.hostname =
            `${getServerName(service)}.zenityhost.pl`;

        service.ipv4 =
            network.ipv4;

        service.port =
            network.port;

    }

    return service;

}


/* CODES */

router.post(
    "/codes/check",
    requireLogin,
    (req, res) => {

        const code =
            String(
                req.body.code || ""
            )
            .trim()
            .toUpperCase();

        const codes =
            readJSON(
                CODES_FILE,
                []
            );

        const found =
            codes.find(
                item =>
                    String(item.code).toUpperCase() ===
                    code &&
                    item.active !== false
            );

        if (!found) {

            return res
                .status(404)
                .json({
                    success: false,
                    message: "Nieprawidłowy kod rabatowy."
                });

        }

        res.json({
            success: true,
            code: found.code,
            percent: Number(found.percent || 0)
        });

    }
);


/* OPTIONS */

router.get(
    "/prices",
    (req, res) => {

        res.json({
            success: true,
            prices: PRICES
        });

    }
);


router.get(
    "/minecraft/options",
    (req, res) => {

        res.json({

            success: true,

            software: MINECRAFT_SOFTWARE,

            versions: MINECRAFT_VERSIONS,

            options: MINECRAFT_VERSIONS

        });

    }
);


router.get(
    "/discord/options",
    (req, res) => {

        res.json({

            success: true,

            nodeVersions: NODE_VERSIONS

        });

    }
);


router.get(
    "/web/options",
    (req, res) => {

        res.json({

            success: true,

            webTypes: WEB_TYPES

        });

    }
);


/* SERVICES */

router.get(
    "/services",
    requireLogin,
    (req, res) => {

        const services =
            readJSON(
                SERVICES_FILE,
                []
            )
            .filter(
                item =>
                    String(item.ownerId) ===
                    String(req.user.id)
            )
            .map(
                item =>
                    ensureNetwork(item)
            );

        writeJSON(
            SERVICES_FILE,
            readJSON(
                SERVICES_FILE,
                []
            )
        );

        res.json({

            success: true,

            services

        });

    }
);


router.get(
    "/service/:id",
    requireLogin,
    (req, res) => {

        const services =
            readJSON(
                SERVICES_FILE,
                []
            );

        const service =
            services.find(
                item =>
                    String(item.id) ===
                    String(req.params.id)
            );

        if (!service) {

            return res
                .status(404)
                .json({
                    success: false,
                    message: "Nie znaleziono usługi."
                });

        }

        if (
            String(service.ownerId) !==
            String(req.user.id) &&
            String(req.user.id) !== OWNER_ID
        ) {

            return res
                .status(403)
                .json({
                    success: false,
                    message: "Brak dostępu."
                });

        }

        ensureNetwork(service);

        writeJSON(
            SERVICES_FILE,
            services
        );

        res.json({

            success: true,

            service

        });

    }
);


/* PURCHASE */

router.post(
    "/purchase",
    requireLogin,
    (req, res) => {

        const service =
            normalizeServiceType(
                req.body.service ??
                req.body.type ??
                req.body.serviceType
            );

        const packageName =
            String(
                req.body.packageName ??
                req.body.package ??
                ""
            )
            .trim()
            .toLowerCase();

        const days =
            Number(
                req.body.days
            );

        const price =
            getPackagePrice(
                service,
                packageName,
                days
            );

        if (
            !PRICES[service]
        ) {

            return res
                .status(400)
                .json({
                    success: false,
                    message: "Nieprawidłowy typ usługi."
                });

        }

        if (
            !price ||
            price <= 0
        ) {

            return res
                .status(400)
                .json({
                    success: false,
                    message: "Nieprawidłowy pakiet lub okres."
                });

        }

        const codes =
            readJSON(
                CODES_FILE,
                []
            );

        const discountCode =
            String(
                req.body.discountCode ??
                req.body.code ??
                ""
            )
            .trim()
            .toUpperCase();

        const usedCode =
            codes.find(
                item =>
                    item.active !== false &&
                    String(item.code).toUpperCase() ===
                    discountCode
            );

        const discount =
            usedCode
                ? Number(usedCode.percent || 0)
                : 0;

        const originalPrice =
            Number(
                price.toFixed(2)
            );

        const finalPrice =
            Number(
                Math.max(
                    0,
                    price -
                    price * discount / 100
                ).toFixed(2)
            );

        let software = null;
        let minecraftVersion = null;
        let nodeVersion = null;
        let webType = null;

        const config =
            req.body.config &&
            typeof req.body.config === "object"
                ? req.body.config
                : {};

        if (
            service === "minecraft"
        ) {

            software =
                String(
                    req.body.software ??
                    config.software ??
                    "paper"
                )
                .trim()
                .toLowerCase();

            minecraftVersion =
                String(
                    req.body.minecraftVersion ??
                    req.body.version ??
                    config.minecraftVersion ??
                    ""
                )
                .trim();

            if (
                !MINECRAFT_SOFTWARE.includes(
                    software
                )
            ) {

                return res
                    .status(400)
                    .json({
                        success: false,
                        message: "Nieprawidłowy silnik Minecraft."
                    });

            }

            const allowedVersions =
                MINECRAFT_VERSIONS[software] ||
                [];

            if (
                !allowedVersions.includes(
                    minecraftVersion
                )
            ) {

                return res
                    .status(400)
                    .json({
                        success: false,
                        message: "Nieprawidłowa wersja Minecraft."
                    });

            }

        }


        if (
            service === "discord"
        ) {

            nodeVersion =
                String(
                    req.body.nodeVersion ??
                    req.body.node ??
                    config.nodeVersion ??
                    "22"
                );

            if (
                !NODE_VERSIONS.includes(
                    nodeVersion
                )
            ) {

                return res
                    .status(400)
                    .json({
                        success: false,
                        message: "Nieprawidłowa wersja Node.js."
                    });

            }

        }


        if (
            service === "web"
        ) {

            webType =
                String(
                    req.body.webType ??
                    req.body.web ??
                    config.webType ??
                    config.web ??
                    "static"
                );

            if (
                !WEB_TYPES.includes(
                    webType
                )
            ) {

                return res
                    .status(400)
                    .json({
                        success: false,
                        message: "Nieprawidłowy typ hostingu."
                    });

            }

        }


        const wallet =
            getWallet(
                req.user.id
            );

        if (
            Number(wallet.balance || 0) <
            finalPrice
        ) {

            return res
                .status(400)
                .json({
                    success: false,
                    message: "Nie masz wystarczających środków."
                });

        }

        const updatedWallet =
            changeBalance(
                req.user.id,
                -finalPrice
            );

        if (!updatedWallet) {

            return res
                .status(400)
                .json({
                    success: false,
                    message: "Nie udało się pobrać środków z portfela."
                });

        }

        const services =
            readJSON(
                SERVICES_FILE,
                []
            );

        const serviceId =
            createId(
                service
            );

        const network =
            generateNetwork(
                serviceId
            );

        const now =
            Date.now();

        const newService = {

            id: serviceId,

            ownerId:
                String(req.user.id),

            ownerUsername:
                req.user.username ||
                req.user.globalName ||
                "Nieznany",

            ownerEmail:
                req.user.email ||
                null,

            type: service,

            serviceType: service,

            package: packageName,

            days,

            price: finalPrice,

            originalPrice,

            discount,

            discountCode:
                usedCode
                    ? usedCode.code
                    : null,

            software,

            minecraftVersion,

            nodeVersion,

            webType,

            config,

            serverName:
                service === "minecraft"
                    ? String(
                        req.body.serverName ??
                        config.serverName ??
                        "Serwer Minecraft"
                    ).trim()
                    : null,

            botName:
                service === "discord"
                    ? String(
                        req.body.botName ??
                        config.botName ??
                        "ZenityBot"
                    ).trim()
                    : null,

            hostname:
                service === "minecraft"
                    ? `${getServerName({
                        serverName:
                            req.body.serverName ??
                            config.serverName ??
                            "twojserwer"
                    })}.zenityhost.pl`
                    : null,

            ipv4:
                service === "minecraft"
                    ? network.ipv4
                    : null,

            port:
                service === "minecraft"
                    ? network.port
                    : null,

            status: "provisioning",

            powerState: "offline",

            readyAt:
                new Date(
                    now + 6000
                ).toISOString(),

            expiresAt:
                new Date(
                    now +
                    days *
                    24 *
                    60 *
                    60 *
                    1000
                ).toISOString(),

            console: [

                {
                    id: createId("log"),
                    type: "info",
                    text: "ZenityHost Console gotowa.",
                    createdAt: new Date().toISOString()
                },

                {
                    id: createId("log"),
                    type: "info",
                    text: "Usługa została utworzona.",
                    createdAt: new Date().toISOString()
                }

            ],

            files: [

                {
                    name: "server.properties",
                    type: "file",
                    path: "/server.properties"
                },

                {
                    name: "plugins",
                    type: "folder",
                    path: "/plugins"
                },

                {
                    name: "world",
                    type: "folder",
                    path: "/world"
                },

                {
                    name: "logs",
                    type: "folder",
                    path: "/logs"
                }

            ],

            createdAt:
                new Date().toISOString(),

            updatedAt:
                new Date().toISOString()

        };

        services.push(
            newService
        );

        writeJSON(
            SERVICES_FILE,
            services
        );

        const transactions =
            readJSON(
                TRANSACTIONS_FILE,
                []
            );

        transactions.push({

            id: createId("transaction"),

            userId:
                String(req.user.id),

            type: "hosting_purchase",

            amount:
                -finalPrice,

            serviceId,

            status: "completed",

            createdAt:
                new Date().toISOString()

        });

        writeJSON(
            TRANSACTIONS_FILE,
            transactions
        );

        res.json({

            success: true,

            message: "Usługa została zakupiona.",

            service: newService,

            wallet: updatedWallet

        });

    }
);


/* POWER STATUS */

router.get(
    "/service/:id/status",
    requireLogin,
    (req, res) => {

        const services =
            readJSON(
                SERVICES_FILE,
                []
            );

        const service =
            services.find(
                item =>
                    String(item.id) ===
                    String(req.params.id)
            );

        if (!service) {

            return res
                .status(404)
                .json({
                    success: false,
                    message: "Nie znaleziono usługi."
                });

        }

        if (
            String(service.ownerId) !==
            String(req.user.id) &&
            String(req.user.id) !== OWNER_ID
        ) {

            return res
                .status(403)
                .json({
                    success: false,
                    message: "Brak dostępu."
                });

        }

        ensureNetwork(service);

        res.json({

            success: true,

            status:
                service.powerState ||
                "offline",

            powerState:
                service.powerState ||
                "offline",

            service

        });

    }
);


/* CONSOLE GET */

router.get(
    "/service/:id/console",
    requireLogin,
    (req, res) => {

        const services =
            readJSON(
                SERVICES_FILE,
                []
            );

        const service =
            services.find(
                item =>
                    String(item.id) ===
                    String(req.params.id)
            );

        if (!service) {

            return res
                .status(404)
                .json({
                    success: false,
                    message: "Nie znaleziono usługi."
                });

        }

        if (
            String(service.ownerId) !==
            String(req.user.id) &&
            String(req.user.id) !== OWNER_ID
        ) {

            return res
                .status(403)
                .json({
                    success: false,
                    message: "Brak dostępu."
                });

        }

        res.json({

            success: true,

            console:
                service.console || []

        });

    }
);


/* CONSOLE POST / POWER */

router.post(
    "/service/:id/console",
    requireLogin,
    (req, res) => {

        const services =
            readJSON(
                SERVICES_FILE,
                []
            );

        const serviceIndex =
            services.findIndex(
                item =>
                    String(item.id) ===
                    String(req.params.id)
            );

        if (
            serviceIndex === -1
        ) {

            return res
                .status(404)
                .json({
                    success: false,
                    message: "Nie znaleziono usługi."
                });

        }

        const service =
            services[serviceIndex];

        if (
            String(service.ownerId) !==
            String(req.user.id) &&
            String(req.user.id) !== OWNER_ID
        ) {

            return res
                .status(403)
                .json({
                    success: false,
                    message: "Brak dostępu."
                });

        }

        const command =
            String(
                req.body.command || ""
            ).trim();

        if (!command) {

            return res
                .status(400)
                .json({
                    success: false,
                    message: "Nie podano komendy."
                });

        }

        if (
            !Array.isArray(
                service.console
            )
        ) {
            service.console = [];
        }

        if (
            command === "system: start"
        ) {

            service.powerState = "starting";
            service.status = "starting";

        }

        if (
            command === "system: online"
        ) {

            service.powerState = "online";
            service.status = "online";

        }

        if (
            command === "system: stop" ||
            command === "system: offline"
        ) {

            service.powerState = "offline";
            service.status = "offline";

        }

        if (
            command === "system: restart"
        ) {

            service.powerState = "starting";
            service.status = "starting";

        }

        service.console.push({

            id:
                createId("log"),

            type:
                command.startsWith("system:")
                    ? "info"
                    : "command",

            text:
                command,

            createdAt:
                new Date().toISOString()

        });

        service.updatedAt =
            new Date().toISOString();

        services[serviceIndex] =
            service;

        writeJSON(
            SERVICES_FILE,
            services
        );

        res.json({

            success: true,

            service,

            console:
                service.console

        });

    }
);


/* FILES */

router.get(
    "/service/:id/files",
    requireLogin,
    (req, res) => {

        const services =
            readJSON(
                SERVICES_FILE,
                []
            );

        const service =
            services.find(
                item =>
                    String(item.id) ===
                    String(req.params.id)
            );

        if (!service) {

            return res
                .status(404)
                .json({
                    success: false,
                    message: "Nie znaleziono usługi."
                });

        }

        if (
            String(service.ownerId) !==
            String(req.user.id) &&
            String(req.user.id) !== OWNER_ID
        ) {

            return res
                .status(403)
                .json({
                    success: false,
                    message: "Brak dostępu."
                });

        }

        res.json({

            success: true,

            files:
                service.files || []

        });

    }
);


/* PATCH SERVICE */

router.patch(
    "/service/:id",
    requireLogin,
    (req, res) => {

        const services =
            readJSON(
                SERVICES_FILE,
                []
            );

        const index =
            services.findIndex(
                item =>
                    String(item.id) ===
                    String(req.params.id)
            );

        if (
            index === -1
        ) {

            return res
                .status(404)
                .json({
                    success: false,
                    message: "Nie znaleziono usługi."
                });

        }

        const service =
            services[index];

        if (
            String(service.ownerId) !==
            String(req.user.id) &&
            String(req.user.id) !== OWNER_ID
        ) {

            return res
                .status(403)
                .json({
                    success: false,
                    message: "Brak dostępu."
                });

        }

        if (
            typeof req.body.serverName ===
            "string" &&
            service.type === "minecraft"
        ) {

            service.serverName =
                req.body.serverName.trim();

            service.hostname =
                `${getServerName(service)}.zenityhost.pl`;

        }

        service.updatedAt =
            new Date().toISOString();

        services[index] =
            service;

        writeJSON(
            SERVICES_FILE,
            services
        );

        res.json({

            success: true,

            service

        });

    }
);


/* ADMIN SERVICES */

router.get(
    "/admin/services",
    requireLogin,
    requireOwner,
    (req, res) => {

        res.json({

            success: true,

            services:
                readJSON(
                    SERVICES_FILE,
                    []
                )

        });

    }
);


router.get(
    "/admin/services/:id",
    requireLogin,
    requireOwner,
    (req, res) => {

        const service =
            readJSON(
                SERVICES_FILE,
                []
            )
            .find(
                item =>
                    String(item.id) ===
                    String(req.params.id)
            );

        if (!service) {

            return res
                .status(404)
                .json({
                    success: false,
                    message: "Nie znaleziono usługi."
                });

        }

        res.json({

            success: true,

            service

        });

    }
);


router.delete(
    "/admin/services/:id",
    requireLogin,
    requireOwner,
    (req, res) => {

        const services =
            readJSON(
                SERVICES_FILE,
                []
            );

        const filtered =
            services.filter(
                item =>
                    String(item.id) !==
                    String(req.params.id)
            );

        writeJSON(
            SERVICES_FILE,
            filtered
        );

        res.json({

            success: true,

            message: "Usługa została usunięta."

        });

    }
);


/* ADMIN CODES */

router.get(
    "/admin/codes",
    requireLogin,
    requireOwner,
    (req, res) => {

        res.json({

            success: true,

            codes:
                readJSON(
                    CODES_FILE,
                    []
                )

        });

    }
);


router.post(
    "/admin/codes",
    requireLogin,
    requireOwner,
    (req, res) => {

        const code =
            String(
                req.body.code || ""
            )
            .trim()
            .toUpperCase();

        const percent =
            Number(
                req.body.percent
            );

        if (
            !code ||
            !Number.isFinite(percent) ||
            percent <= 0 ||
            percent > 100
        ) {

            return res
                .status(400)
                .json({
                    success: false,
                    message: "Nieprawidłowy kod lub procent."
                });

        }

        const codes =
            readJSON(
                CODES_FILE,
                []
            );

        codes.push({

            id: createId("code"),

            code,

            percent,

            active: true,

            createdAt:
                new Date().toISOString()

        });

        writeJSON(
            CODES_FILE,
            codes
        );

        res.json({

            success: true,

            message: "Kod został dodany."

        });

    }
);


router.patch(
    "/admin/codes/:id",
    requireLogin,
    requireOwner,
    (req, res) => {

        const codes =
            readJSON(
                CODES_FILE,
                []
            );

        const index =
            codes.findIndex(
                item =>
                    String(item.id) ===
                    String(req.params.id)
            );

        if (
            index === -1
        ) {

            return res
                .status(404)
                .json({
                    success: false,
                    message: "Nie znaleziono kodu."
                });

        }

        if (
            typeof req.body.active ===
            "boolean"
        ) {

            codes[index].active =
                req.body.active;

        }

        if (
            req.body.percent !==
            undefined
        ) {

            codes[index].percent =
                Number(
                    req.body.percent
                );

        }

        writeJSON(
            CODES_FILE,
            codes
        );

        res.json({

            success: true,

            code:
                codes[index]

        });

    }
);


router.delete(
    "/admin/codes/:id",
    requireLogin,
    requireOwner,
    (req, res) => {

        const codes =
            readJSON(
                CODES_FILE,
                []
            );

        const filtered =
            codes.filter(
                item =>
                    String(item.id) !==
                    String(req.params.id)
            );

        writeJSON(
            CODES_FILE,
            filtered
        );

        res.json({

            success: true,

            message: "Kod został usunięty."

        });

    }
);


/* ADMIN WALLET */

router.get(
    "/admin/wallet/:userId",
    requireLogin,
    requireOwner,
    (req, res) => {

        res.json({

            success: true,

            wallet:
                getWallet(
                    req.params.userId
                )

        });

    }
);


/* ADMIN STATS */

router.get(
    "/admin/stats",
    requireLogin,
    requireOwner,
    (req, res) => {

        const services =
            readJSON(
                SERVICES_FILE,
                []
            );

        const transactions =
            readJSON(
                TRANSACTIONS_FILE,
                []
            );

        res.json({

            success: true,

            stats: {

                users:
                    new Set(
                        services.map(
                            item =>
                                item.ownerId
                        )
                    ).size,

                services:
                    services.length,

                revenue:
                    transactions
                        .filter(
                            item =>
                                item.type ===
                                "hosting_purchase"
                        )
                        .reduce(
                            (
                                total,
                                item
                            ) =>
                                total +
                                Math.abs(
                                    Number(
                                        item.amount || 0
                                    )
                                ),
                            0
                        )

            }

        });

    }
);


module.exports = router;
