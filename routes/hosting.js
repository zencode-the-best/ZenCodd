const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

const OWNER_ID =
    process.env.OWNER_ID ||
    "1238570679465410571";

const dataPath =
    path.join(
        __dirname,
        "..",
        "data",
        "hosting"
    );

const codesFile =
    path.join(
        dataPath,
        "codes.json"
    );

const servicesFile =
    path.join(
        dataPath,
        "services.json"
    );

const walletsDir =
    path.join(
        __dirname,
        "..",
        "data",
        "wallet"
    );

const walletsFile =
    path.join(
        walletsDir,
        "wallets.json"
    );

const transactionsFile =
    path.join(
        walletsDir,
        "transactions.json"
    );

function ensureFiles() {
    if (!fs.existsSync(dataPath)) {
        fs.mkdirSync(dataPath, {
            recursive: true
        });
    }

    if (!fs.existsSync(walletsDir)) {
        fs.mkdirSync(walletsDir, {
            recursive: true
        });
    }

    if (!fs.existsSync(codesFile)) {
        fs.writeFileSync(
            codesFile,
            "[]"
        );
    }

    if (!fs.existsSync(servicesFile)) {
        fs.writeFileSync(
            servicesFile,
            "[]"
        );
    }

    if (!fs.existsSync(walletsFile)) {
        fs.writeFileSync(
            walletsFile,
            "[]"
        );
    }

    if (!fs.existsSync(transactionsFile)) {
        fs.writeFileSync(
            transactionsFile,
            "[]"
        );
    }
}

function readJSON(file) {
    ensureFiles();

    try {
        return JSON.parse(
            fs.readFileSync(
                file,
                "utf8"
            )
        );
    } catch {
        return [];
    }
}

function writeJSON(file, data) {
    ensureFiles();

    fs.writeFileSync(
        file,
        JSON.stringify(
            data,
            null,
            4
        )
    );
}

function requireLogin(req, res, next) {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message:
                "Musisz być zalogowany."
        });
    }

    next();
}

function ownerOnly(req, res, next) {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message:
                "Musisz być zalogowany."
        });
    }

    if (
        String(req.user.id) !==
        String(OWNER_ID)
    ) {
        return res.status(403).json({
            success: false,
            message:
                "Brak dostępu."
        });
    }

    next();
}

/* =========================================
   CENY
========================================= */

const PRICES = {
    minecraft: {
        Dirt: {
            7: 2.99,
            30: 9.99,
            90: 24.99
        },

        Obsidian: {
            7: 6.99,
            30: 19.99,
            90: 49.99
        },

        Złoto: {
            7: 11.99,
            30: 34.99,
            90: 89.99
        },

        Szmaragd: {
            7: 18.99,
            30: 54.99,
            90: 139.99
        },

        Diament: {
            7: 29.99,
            30: 84.99,
            90: 219.99
        }
    },

    discord: {
        "Bot Start": {
            7: 1,
            30: 3,
            90: 8
        },

        "Bot Plus": {
            7: 2,
            30: 6,
            90: 15
        },

        "Bot PRO": {
            7: 4,
            30: 10,
            90: 25
        }
    },

    web: {
        "WWW Start": {
            7: 2,
            30: 5,
            90: 12
        },

        "WWW Plus": {
            7: 4,
            30: 10,
            90: 25
        },

        "WWW PRO": {
            7: 7,
            30: 18,
            90: 45
        }
    }
};

/* =========================================
   SPRAWDZENIE KODU
========================================= */

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

        if (!code) {
            return res.json({
                success: false,
                message:
                    "Nie podano kodu."
            });
        }

        const codes =
            readJSON(codesFile);

        const found =
            codes.find(
                item =>
                    item.code === code &&
                    item.active === true
            );

        if (!found) {
            return res.json({
                success: false,
                message:
                    "Nieprawidłowy kod."
            });
        }

        if (
            found.expiresAt &&
            Date.now() >
            new Date(
                found.expiresAt
            ).getTime()
        ) {
            return res.json({
                success: false,
                message:
                    "Kod wygasł."
            });
        }

        res.json({
            success: true,
            code: found.code,
            discount:
                Number(found.discount) || 0,
            message:
                `Kod aktywny. Rabat ${found.discount}%.`
        });
    }
);

/* =========================================
   ZAKUP HOSTINGU
========================================= */

router.post(
    "/purchase",
    requireLogin,
    (req, res) => {
        const service =
            String(
                req.body.service || ""
            ).toLowerCase();

        const packageName =
            String(
                req.body.packageName || ""
            );

        const days =
            Number(req.body.days);

        const discountCode =
            String(
                req.body.discountCode || ""
            )
            .trim()
            .toUpperCase();

        if (
            !PRICES[service] ||
            !PRICES[service][packageName]
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Nieprawidłowa usługa lub pakiet."
            });
        }

        if (
            ![7, 30, 90].includes(days)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Nieprawidłowy czas trwania."
            });
        }

        let price =
            Number(
                PRICES[service][packageName][days]
            );

        let discount = 0;

        if (discountCode) {
            const codes =
                readJSON(codesFile);

            const code =
                codes.find(
                    item =>
                        item.code ===
                            discountCode &&
                        item.active === true
                );

            if (
                code &&
                (
                    !code.expiresAt ||
                    Date.now() <=
                    new Date(
                        code.expiresAt
                    ).getTime()
                )
            ) {
                discount =
                    Number(code.discount) || 0;

                price =
                    Number(
                        (
                            price *
                            (1 - discount / 100)
                        ).toFixed(2)
                    );
            }
        }

        const wallets =
            readJSON(walletsFile);

        let wallet =
            wallets.find(
                item =>
                    String(item.userId) ===
                    String(req.user.id)
            );

        if (!wallet) {
            wallet = {
                userId:
                    String(req.user.id),

                username:
                    req.user.username ||
                    req.user.globalName ||
                    "Nieznany",

                globalName:
                    req.user.globalName ||
                    req.user.username ||
                    "Nieznany",

                email:
                    req.user.email ||
                    null,

                balance: 0,

                createdAt:
                    new Date().toISOString()
            };

            wallets.push(wallet);
        }

        const balance =
            Number(wallet.balance || 0);

        if (balance < price) {
            return res.status(400).json({
                success: false,
                message:
                    `Niewystarczające środki. Potrzebujesz ${price.toFixed(2)} zł.`
            });
        }

        wallet.balance =
            Number(
                (
                    balance - price
                ).toFixed(2)
            );

        wallet.updatedAt =
            new Date().toISOString();

        writeJSON(
            walletsFile,
            wallets
        );

        const serviceId =
            `HOST-${Date.now()}-${Math.random()
                .toString(36)
                .substring(2, 8)}`;

        const services =
            readJSON(servicesFile);

        const newService = {
            id:
                serviceId,

            ownerId:
                String(req.user.id),

            ownerUsername:
                req.user.username ||
                req.user.globalName ||
                "Nieznany",

            ownerEmail:
                req.user.email ||
                null,

            type:
                service,

            package:
                packageName,

            days,

            price,

            originalPrice:
                Number(
                    PRICES[
                        service
                    ][packageName][days]
                ),

            discount,

            discountCode:
                discountCode || null,

            status:
                "awaiting_provisioning",

            createdAt:
                new Date().toISOString(),

            expiresAt:
                new Date(
                    Date.now() +
                    days *
                    24 *
                    60 *
                    60 *
                    1000
                ).toISOString()
        };

        services.push(newService);

        writeJSON(
            servicesFile,
            services
        );

        const transactions =
            readJSON(transactionsFile);

        transactions.push({
            id:
                `HOST-${Date.now()}-${Math.random()
                    .toString(36)
                    .substring(2, 8)}`,

            userId:
                String(req.user.id),

            username:
                req.user.username ||
                req.user.globalName ||
                "Nieznany",

            email:
                req.user.email ||
                null,

            type:
                "hosting_purchase",

            amount:
                -price,

            method:
                "wallet",

            status:
                "completed",

            serviceId,

            service,

            package:
                packageName,

            days,

            createdAt:
                new Date().toISOString()
        });

        writeJSON(
            transactionsFile,
            transactions
        );

        res.json({
            success: true,

            message:
                "Zamówienie zostało zapisane.",

            service:
                newService,

            balance:
                wallet.balance
        });
    }
);

/* =========================================
   ADMIN — USŁUGI
========================================= */

router.get(
    "/admin/services",
    ownerOnly,
    (req, res) => {
        const services =
            readJSON(servicesFile);

        res.json({
            success: true,
            services
        });
    }
);

/* =========================================
   UŻYTKOWNIK — USŁUGI
========================================= */

router.get(
    "/services",
    requireLogin,
    (req, res) => {
        const services =
            readJSON(servicesFile);

        const own =
            services.filter(
                service =>
                    String(
                        service.ownerId
                    ) ===
                    String(req.user.id)
            );

        res.json({
            success: true,
            services: own
        });
    }
);

/* =========================================
   ADMIN — USUNIĘCIE USŁUGI
========================================= */

router.delete(
    "/admin/services/:id",
    ownerOnly,
    (req, res) => {
        const services =
            readJSON(servicesFile);

        const filtered =
            services.filter(
                service =>
                    service.id !==
                    req.params.id
            );

        writeJSON(
            servicesFile,
            filtered
        );

        res.json({
            success: true
        });
    }
);

/* =========================================
   ADMIN — KODY
========================================= */

router.get(
    "/admin/codes",
    ownerOnly,
    (req, res) => {
        res.json({
            success: true,
            codes:
                readJSON(codesFile)
        });
    }
);

router.post(
    "/admin/codes",
    ownerOnly,
    (req, res) => {
        const rawCode =
            String(
                req.body.code || ""
            )
            .trim()
            .toUpperCase();

        const discount =
            Number(
                req.body.discount
            );

        const days =
            Number(
                req.body.days || 0
            );

        if (!rawCode) {
            return res.status(400).json({
                success: false,
                message:
                    "Podaj kod."
            });
        }

        if (
            !Number.isFinite(discount) ||
            discount < 1 ||
            discount > 100
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Rabat musi wynosić od 1 do 100%."
            });
        }

        const codes =
            readJSON(codesFile);

        if (
            codes.some(
                item =>
                    item.code ===
                    rawCode
            )
        ) {
            return res.status(409).json({
                success: false,
                message:
                    "Taki kod już istnieje."
            });
        }

        let expiresAt = null;

        if (days > 0) {
            expiresAt =
                new Date(
                    Date.now() +
                    days *
                    24 *
                    60 *
                    60 *
                    1000
                ).toISOString();
        }

        const newCode = {
            id:
                Date.now().toString(),

            code:
                rawCode,

            discount,

            active:
                true,

            expiresAt,

            createdAt:
                new Date().toISOString(),

            createdBy:
                String(req.user.id)
        };

        codes.push(newCode);

        writeJSON(
            codesFile,
            codes
        );

        res.json({
            success: true,
            code: newCode
        });
    }
);

router.delete(
    "/admin/codes/:id",
    ownerOnly,
    (req, res) => {
        const codes =
            readJSON(codesFile);

        writeJSON(
            codesFile,
            codes.filter(
                item =>
                    item.id !==
                    req.params.id
            )
        );

        res.json({
            success: true
        });
    }
);

router.patch(
    "/admin/codes/:id",
    ownerOnly,
    (req, res) => {
        const codes =
            readJSON(codesFile);

        const code =
            codes.find(
                item =>
                    item.id ===
                    req.params.id
            );

        if (!code) {
            return res.status(404).json({
                success: false,
                message:
                    "Nie znaleziono kodu."
            });
        }

        code.active =
            Boolean(
                req.body.active
            );

        writeJSON(
            codesFile,
            codes
        );

        res.json({
            success: true,
            code
        });
    }
);

module.exports = router;
