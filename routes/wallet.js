const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

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
        fs.mkdirSync(
            walletDir,
            {
                recursive: true
            }
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

function saveJSON(file, data) {

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
            message: "Musisz być zalogowany."
        });

    }

    next();
}


router.get(
    "/",
    requireLogin,
    (req, res) => {

        const wallets =
            readJSON(walletsFile);

        const wallet =
            wallets.find(
                item =>
                    item.userId === req.user.id
            );

        res.json({
            success: true,
            balance: wallet
                ? Number(wallet.balance || 0)
                : 0
        });

    }
);


router.get(
    "/transactions",
    requireLogin,
    (req, res) => {

        const transactions =
            readJSON(transactionsFile);

        const userTransactions =
            transactions
                .filter(
                    item =>
                        item.userId === req.user.id
                )
                .sort(
                    (a, b) =>
                        new Date(b.createdAt) -
                        new Date(a.createdAt)
                );

        res.json({
            success: true,
            transactions:
                userTransactions
        });

    }
);


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
            amount <= 0
        ) {

            return res.status(400).json({
                success: false,
                message: "Nieprawidłowa kwota."
            });

        }


        if (amount < 1) {

            return res.status(400).json({
                success: false,
                message: "Minimalne doładowanie to 1 zł."
            });

        }


        if (
            amount > 1000
        ) {

            return res.status(400).json({
                success: false,
                message: "Maksymalne doładowanie to 1000 zł."
            });

        }


        const allowedMethods = [
            "blik",
            "przelew",
            "paypal"
        ];


        if (
            !allowedMethods.includes(
                method
            )
        ) {

            return res.status(400).json({
                success: false,
                message: "Nieprawidłowa metoda płatności."
            });

        }


        /*
         * WAŻNE:
         *
         * Tutaj NIE dodajemy pieniędzy.
         *
         * Ten endpoint tworzy tylko
         * oczekujące doładowanie.
         *
         * Po podłączeniu prawdziwego
         * operatora płatności jego webhook
         * dopiero zwiększy saldo.
         */


        const transactions =
            readJSON(transactionsFile);


        const transaction = {

            id:
                `TOPUP-${Date.now()}-${Math.random()
                    .toString(36)
                    .substring(2, 8)}`,

            userId:
                req.user.id,

            username:
                req.user.username || "Nieznany",

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


        transactions.push(
            transaction
        );


        saveJSON(
            transactionsFile,
            transactions
        );


        res.json({

            success: true,

            message:
                "Doładowanie zostało utworzone.",

            transaction

        });

    }
);


module.exports = router;
