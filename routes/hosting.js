const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

const OWNER_ID =
    process.env.OWNER_ID;

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


function ensureFiles() {

    if (!fs.existsSync(dataPath)) {
        fs.mkdirSync(
            dataPath,
            {
                recursive: true
            }
        );
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


function ownerOnly(req, res, next) {

    if (!req.user) {

        return res.status(401).json({
            success: false,
            message: "Musisz być zalogowany."
        });

    }

    if (
        req.user.id !== OWNER_ID
    ) {

        return res.status(403).json({
            success: false,
            message: "Brak dostępu."
        });

    }

    next();

}


/* =========================================
   SPRAWDZENIE KODU
========================================= */

router.post(
    "/codes/check",
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
                message: "Nie podano kodu."
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
                message: "Nieprawidłowy kod."
            });

        }

        if (
            found.expiresAt &&
            Date.now() >
            new Date(found.expiresAt).getTime()
        ) {

            return res.json({
                success: false,
                message: "Kod wygasł."
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
   ADMIN — LISTA KODÓW
========================================= */

router.get(
    "/admin/codes",
    ownerOnly,
    (req, res) => {

        res.json({
            success: true,
            codes: readJSON(codesFile)
        });

    }
);


/* =========================================
   ADMIN — TWORZENIE KODU
========================================= */

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
                message: "Podaj kod."
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
                    item.code === rawCode
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

            active: true,

            expiresAt,

            createdAt:
                new Date().toISOString(),

            createdBy:
                req.user.id

        };

        codes.push(newCode);

        writeJSON(
            codesFile,
            codes
        );

        res.json({

            success: true,

            message:
                "Kod został utworzony.",

            code: newCode

        });

    }
);


/* =========================================
   ADMIN — USUWANIE KODU
========================================= */

router.delete(
    "/admin/codes/:id",
    ownerOnly,
    (req, res) => {

        const codes =
            readJSON(codesFile);

        const newCodes =
            codes.filter(
                item =>
                    item.id !==
                    req.params.id
            );

        writeJSON(
            codesFile,
            newCodes
        );

        res.json({
            success: true
        });

    }
);


/* =========================================
   ADMIN — AKTYWACJA / DEZAKTYWACJA
========================================= */

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
                message: "Nie znaleziono kodu."
            });

        }

        code.active =
            Boolean(req.body.active);

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


/* =========================================
   ADMIN — WSZYSTKIE SERWERY
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
   UŻYTKOWNIK — WŁASNE USŁUGI
========================================= */

router.get(
    "/services",
    (req, res) => {

        if (!req.user) {

            return res.status(401).json({
                success: false
            });

        }

        const services =
            readJSON(servicesFile);

        const own =
            services.filter(
                service =>
                    service.ownerId ===
                    req.user.id
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

        const newServices =
            services.filter(
                service =>
                    service.id !==
                    req.params.id
            );

        writeJSON(
            servicesFile,
            newServices
        );

        res.json({
            success: true
        });

    }
);


module.exports = router;
