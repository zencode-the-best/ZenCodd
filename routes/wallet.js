const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

const OWNER_ID =
    process.env.OWNER_ID || "1238570679465410571";

const walletDir = path.join(
    __dirname,
    "..",
    "data",
    "wallet"
);

const walletsFile = path.join(
    walletDir,
    "wallets.json"
);

const transactionsFile = path.join(
    walletDir,
    "transactions.json"
);

function ensureFiles() {
    if (!fs.existsSync(walletDir)) {
        fs.mkdirSync(walletDir, {
            recursive: true
        });
    }

    if (!fs.existsSync(walletsFile)) {
        fs.writeFileSync(walletsFile, "[]");
    }

    if (!fs.existsSync(transactionsFile)) {
        fs.writeFileSync(transactionsFile, "[]");
    }
}

function readJSON(file) {
    ensureFiles();

    try {
        return JSON.parse(
            fs.readFileSync(file, "utf8")
        );
    } catch {
        return [];
    }
}

function saveJSON(file, data) {
    ensureFiles();

    fs.writeFileSync(
        file,
        JSON.stringify(data, null, 4)
    );
}

function requireLogin(req, res, next) {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: "Musisz być zalogowany."
        });
    }

    next();
}

function ownerOnly(req, res, next) {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: "Musisz być zalogowany."
        });
    }

    if (String(req.user.id) !== String(OWNER_ID)) {
        return res.status(403).json({
            success: false,
            message: "Brak dostępu."
        });
    }

    next();
}

function getUserData(req) {
    return {
        userId: String(req.user.id),
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
        avatar:
            req.user.avatar ||
            null
    };
}

function getOrCreateWallet(userData) {
    const wallets = readJSON(walletsFile);

    let wallet = wallets.find(
        item =>
            String(item.userId) ===
            String(userData.userId)
    );

    if (!wallet) {
        wallet = {
            userId: userData.userId,
            username: userData.username,
            globalName: userData.globalName,
            email: userData.email,
            avatar: userData.avatar,
            balance: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        wallets.push(wallet);
    } else {
        wallet.username = userData.username;
        wallet.globalName = userData.globalName;

        if (userData.email) {
            wallet.email = userData.email;
        }

        if (userData.avatar) {
            wallet.avatar = userData.avatar;
        }

        wallet.updatedAt =
            new Date().toISOString();
    }

    saveJSON(walletsFile, wallets);

    return wallet;
}

/* =========================================
   UŻYTKOWNIK — PORTFEL
========================================= */

router.get(
    "/",
    requireLogin,
    (req, res) => {
        const userData = getUserData(req);

        const wallet =
            getOrCreateWallet(userData);

        res.json({
            success: true,
            balance:
                Number(wallet.balance || 0),
            wallet
        });
    }
);

/* =========================================
   UŻYTKOWNIK — TRANSAKCJE
========================================= */

router.get(
    "/transactions",
    requireLogin,
    (req, res) => {
        const userData = getUserData(req);

        getOrCreateWallet(userData);

        const transactions =
            readJSON(transactionsFile);

        const own =
            transactions
                .filter(
                    item =>
                        String(item.userId) ===
                        String(req.user.id)
                )
                .sort(
                    (a, b) =>
                        new Date(b.createdAt) -
                        new Date(a.createdAt)
                );

        res.json({
            success: true,
            transactions: own
        });
    }
);

/* =========================================
   UŻYTKOWNIK — DOŁADOWANIE
========================================= */

router.post(
    "/topup",
    requireLogin,
    (req, res) => {
        const amount =
            Number(req.body.amount);

        const method =
            String(
                req.body.method || ""
            ).trim();

        if (
            !Number.isFinite(amount) ||
            amount < 1 ||
            amount > 1000
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Kwota musi wynosić od 1 zł do 1000 zł."
            });
        }

        const allowedMethods = [
            "blik",
            "przelew",
            "paypal"
        ];

        if (
            !allowedMethods.includes(method)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Nieprawidłowa metoda płatności."
            });
        }

        const userData =
            getUserData(req);

        getOrCreateWallet(userData);

        const transactions =
            readJSON(transactionsFile);

        const transaction = {
            id:
                `TOPUP-${Date.now()}-${Math.random()
                    .toString(36)
                    .substring(2, 8)}`,

            userId:
                userData.userId,

            username:
                userData.username,

            email:
                userData.email,

            type:
                "topup",

            amount:
                Number(amount.toFixed(2)),

            method,

            status:
                "pending",

            createdAt:
                new Date().toISOString()
        };

        transactions.push(transaction);

        saveJSON(
            transactionsFile,
            transactions
        );

        res.json({
            success: true,
            message:
                "Doładowanie oczekuje na płatność.",
            transaction
        });
    }
);

/* =========================================
   CEO — UŻYTKOWNICY
========================================= */

router.get(
    "/admin/users",
    ownerOnly,
    (req, res) => {
        const query =
            String(
                req.query.query || ""
            )
            .trim()
            .toLowerCase();

        const wallets =
            readJSON(walletsFile);

        const transactions =
            readJSON(transactionsFile);

        const users = [];

        for (const wallet of wallets) {
            users.push({
                userId:
                    String(wallet.userId),

                username:
                    wallet.username ||
                    "Nieznany",

                globalName:
                    wallet.globalName ||
                    wallet.username ||
                    "Nieznany",

                email:
                    wallet.email ||
                    null,

                avatar:
                    wallet.avatar ||
                    null,

                balance:
                    Number(wallet.balance || 0)
            });
        }

        /*
         * Uzupełnienie użytkowników,
         * którzy mają transakcję,
         * ale nie mają jeszcze portfela.
         */

        for (const transaction of transactions) {
            const exists =
                users.some(
                    user =>
                        String(user.userId) ===
                        String(transaction.userId)
                );

            if (!exists) {
                users.push({
                    userId:
                        String(transaction.userId),

                    username:
                        transaction.username ||
                        "Nieznany",

                    globalName:
                        transaction.username ||
                        "Nieznany",

                    email:
                        transaction.email ||
                        null,

                    avatar:
                        null,

                    balance: 0
                });
            }
        }

        const filtered =
            query
                ? users.filter(user =>
                    String(user.userId)
                        .toLowerCase()
                        .includes(query) ||

                    String(user.username)
                        .toLowerCase()
                        .includes(query) ||

                    String(user.globalName)
                        .toLowerCase()
                        .includes(query) ||

                    String(user.email || "")
                        .toLowerCase()
                        .includes(query)
                )
                : users;

        res.json({
            success: true,
            users: filtered
        });
    }
);

/* =========================================
   CEO — PORTFEL UŻYTKOWNIKA
========================================= */

router.get(
    "/admin/wallet/:userId",
    ownerOnly,
    (req, res) => {
        const wallets =
            readJSON(walletsFile);

        const wallet =
            wallets.find(
                item =>
                    String(item.userId) ===
                    String(req.params.userId)
            );

        if (!wallet) {
            return res.json({
                success: true,
                wallet: {
                    userId:
                        String(req.params.userId),
                    balance: 0
                }
            });
        }

        res.json({
            success: true,
            wallet
        });
    }
);

/* =========================================
   CEO — DODAWANIE ŚRODKÓW
========================================= */

router.post(
    "/admin/add",
    ownerOnly,
    (req, res) => {
        const userId =
            String(
                req.body.userId || ""
            ).trim();

        const amount =
            Number(req.body.amount);

        const reason =
            String(
                req.body.reason ||
                "Doładowanie przez CEO"
            ).trim();

        if (!userId) {
            return res.status(400).json({
                success: false,
                message:
                    "Nie podano Discord ID."
            });
        }

        if (
            !Number.isFinite(amount) ||
            amount <= 0 ||
            amount > 100000
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Kwota musi być większa od 0 i nie może przekraczać 100000 zł."
            });
        }

        const wallets =
            readJSON(walletsFile);

        let wallet =
            wallets.find(
                item =>
                    String(item.userId) ===
                    userId
            );

        if (!wallet) {
            wallet = {
                userId,
                username:
                    "Nieznany",
                globalName:
                    "Nieznany",
                email:
                    null,
                avatar:
                    null,
                balance: 0,
                createdAt:
                    new Date().toISOString(),
                updatedAt:
                    new Date().toISOString()
            };

            wallets.push(wallet);
        }

        wallet.balance =
            Number(
                (
                    Number(wallet.balance || 0) +
                    amount
                ).toFixed(2)
            );

        wallet.updatedAt =
            new Date().toISOString();

        saveJSON(
            walletsFile,
            wallets
        );

        const transactions =
            readJSON(transactionsFile);

        const transaction = {
            id:
                `ADMIN-${Date.now()}-${Math.random()
                    .toString(36)
                    .substring(2, 8)}`,

            userId,

            username:
                wallet.username,

            email:
                wallet.email || null,

            type:
                "admin_credit",

            amount:
                Number(amount.toFixed(2)),

            method:
                "CEO",

            status:
                "completed",

            reason,

            adminId:
                String(req.user.id),

            adminUsername:
                req.user.username ||
                req.user.globalName ||
                "CEO",

            createdAt:
                new Date().toISOString()
        };

        transactions.push(transaction);

        saveJSON(
            transactionsFile,
            transactions
        );

        res.json({
            success: true,
            message:
                `Dodano ${amount.toFixed(2)} zł do portfela.`,

            wallet,

            transaction
        });
    }
);

/* =========================================
   CEO — TRANSAKCJE
========================================= */

router.get(
    "/admin/transactions",
    ownerOnly,
    (req, res) => {
        const userId =
            String(
                req.query.userId || ""
            ).trim();

        let transactions =
            readJSON(transactionsFile);

        if (userId) {
            transactions =
                transactions.filter(
                    item =>
                        String(item.userId) ===
                        userId
                );
        }

        transactions =
            transactions.sort(
                (a, b) =>
                    new Date(b.createdAt) -
                    new Date(a.createdAt)
            );

        res.json({
            success: true,
            transactions
        });
    }
);

module.exports = router;
