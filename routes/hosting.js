const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

const OWNER_ID =
    process.env.OWNER_ID ||
    "1238570679465410571";


/* =========================================================
   ŚCIEŻKI
========================================================= */

const DATA_DIR = path.join(
    __dirname,
    "..",
    "data",
    "hosting"
);

const SERVICES_FILE = path.join(
    DATA_DIR,
    "services.json"
);

const CODES_FILE = path.join(
    DATA_DIR,
    "codes.json"
);

const WALLET_FILE = path.join(
    __dirname,
    "..",
    "data",
    "wallet",
    "wallets.json"
);

const TRANSACTIONS_FILE = path.join(
    __dirname,
    "..",
    "data",
    "wallet",
    "transactions.json"
);


/* =========================================================
   TWORZENIE KATALOGÓW / PLIKÓW
========================================================= */

function ensureFile(
    file,
    defaultValue
) {

    const directory =
        path.dirname(file);

    if (
        !fs.existsSync(directory)
    ) {
        fs.mkdirSync(
            directory,
            {
                recursive: true
            }
        );
    }

    if (
        !fs.existsSync(file)
    ) {

        fs.writeFileSync(
            file,
            JSON.stringify(
                defaultValue,
                null,
                2
            )
        );

    }

}


/* =========================================================
   INIT
========================================================= */

ensureFile(
    SERVICES_FILE,
    []
);

ensureFile(
    CODES_FILE,
    []
);

ensureFile(
    WALLET_FILE,
    []
);

ensureFile(
    TRANSACTIONS_FILE,
    []
);


/* =========================================================
   POMOCNICZE JSON
========================================================= */

function readJSON(
    file,
    fallback = []
) {

    try {

        if (
            !fs.existsSync(file)
        ) {
            return fallback;
        }

        const content =
            fs.readFileSync(
                file,
                "utf8"
            );

        if (!content.trim()) {
            return fallback;
        }

        return JSON.parse(
            content
        );

    } catch {

        return fallback;

    }

}


function writeJSON(
    file,
    data
) {

    const directory =
        path.dirname(file);

    if (
        !fs.existsSync(directory)
    ) {

        fs.mkdirSync(
            directory,
            {
                recursive: true
            }
        );

    }

    fs.writeFileSync(
        file,
        JSON.stringify(
            data,
            null,
            2
        )
    );

}


/* =========================================================
   LOGOWANIE
========================================================= */

function requireLogin(
    req,
    res,
    next
) {

    if (
        !req.user
    ) {

        return res
            .status(401)
            .json({
                success: false,
                message:
                    "Musisz być zalogowany."
            });

    }

    next();

}



/* =========================================================
   CEO
========================================================= */

function isCEO(
    req
) {

    return (
        req.user &&
        String(req.user.id) ===
            String(OWNER_ID)
    );

}


function requireCEO(
    req,
    res,
    next
) {

    if (
        !isCEO(req)
    ) {

        return res
            .status(403)
            .json({
                success: false,
                message:
                    "Brak dostępu CEO."
            });

    }

    next();

}


/* =========================================================
   CENY
========================================================= */

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


/* =========================================================
   DOZWOLONE OPCJE
========================================================= */

const MINECRAFT_SOFTWARE = [
    "paper",
    "purpur",
    "vanilla"
];

const MINECRAFT_VERSIONS = {

    paper: [
        "1.21.4",
        "1.21.3",
        "1.21.1",
        "1.21",
        "1.20.6",
        "1.20.4",
        "1.20.2",
        "1.20.1"
    ],

    purpur: [
        "1.21.4",
        "1.21.3",
        "1.21.1",
        "1.21",
        "1.20.6",
        "1.20.4",
        "1.20.1"
    ],

    vanilla: [
        "1.21.4",
        "1.21.3",
        "1.21.1",
        "1.21",
        "1.20.6",
        "1.20.4",
        "1.20.1"
    ]

};

const NODE_VERSIONS = [
    "22",
    "20",
    "18"
];

const WEB_TYPES = [
    "static",
    "php"
];


/* =========================================================
   GENERATOR ID
========================================================= */

function createId(
    prefix
) {

    return (
        prefix +
        "-" +
        Date.now().toString(36) +
        "-" +
        Math.random()
            .toString(36)
            .slice(2, 8)
    );

}


/* =========================================================
   TYPY
========================================================= */

function serviceName(
    type
) {

    if (
        type === "minecraft"
    ) {
        return "Serwer Minecraft";
    }

    if (
        type === "discord"
    ) {
        return "Hosting Discord Bot";
    }

    if (
        type === "web"
    ) {
        return "Web Hosting";
    }

    return type;

}


/* =========================================================
   PORTFEL
========================================================= */

function getWallet(
    userId
) {

    const wallets =
        readJSON(
            WALLET_FILE,
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

            userId:
                String(userId),

            username:
                "Nieznany",

            globalName:
                null,

            email:
                null,

            avatar:
                null,

            balance:
                0,

            createdAt:
                new Date().toISOString(),

            updatedAt:
                new Date().toISOString()

        };

        wallets.push(
            wallet
        );

        writeJSON(
            WALLET_FILE,
            wallets
        );

    }

    return wallet;

}


/* =========================================================
   ZMIANA PORTFELA
========================================================= */

function changeBalance(
    userId,
    amount
) {

    const wallets =
        readJSON(
            WALLET_FILE,
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

            userId:
                String(userId),

            username:
                "Nieznany",

            globalName:
                null,

            email:
                null,

            avatar:
                null,

            balance:
                0,

            createdAt:
                new Date().toISOString(),

            updatedAt:
                new Date().toISOString()

        };

        wallets.push(
            wallet
        );

    }

    const oldBalance =
        Number(
            wallet.balance || 0
        );

    const newBalance =
        Number(
            (
                oldBalance +
                Number(amount)
            ).toFixed(2)
        );

    if (
        newBalance < 0
    ) {
        return null;
    }

    wallet.balance =
        newBalance;

    wallet.updatedAt =
        new Date().toISOString();

    writeJSON(
        WALLET_FILE,
        wallets
    );

    return wallet;

}


/* =========================================================
   TRANSAKCJA
========================================================= */

function addTransaction(
    transaction
) {

    const transactions =
        readJSON(
            TRANSACTIONS_FILE,
            []
        );

    transactions.push(
        transaction
    );

    writeJSON(
        TRANSACTIONS_FILE,
        transactions
    );

}


/* =========================================================
   KOD RABATOWY
========================================================= */

router.post(
    "/codes/check",
    async (
        req,
        res
    ) => {

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
                    "Podaj kod rabatowy."
            });

        }

        const codes =
            readJSON(
                CODES_FILE,
                []
            );

        const found =
            codes.find(
                item =>
                    String(
                        item.code
                    ).toUpperCase() ===
                    code
            );

        if (!found) {

            return res.json({
                success: false,
                message:
                    "Nieprawidłowy kod."
            });

        }

        if (
            found.active === false
        ) {

            return res.json({
                success: false,
                message:
                    "Ten kod jest nieaktywny."
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
                    "Ten kod wygasł."
            });

        }

        if (
            found.maxUses &&
            Number(found.used || 0) >=
                Number(found.maxUses)
        ) {

            return res.json({
                success: false,
                message:
                    "Limit użyć tego kodu został wykorzystany."
            });

        }

        res.json({

            success: true,

            discount:
                Number(
                    found.discount || 0
                ),

            code:
                found.code

        });

    }
);


/* =========================================================
   INFORMACJE O CENACH
========================================================= */

router.get(
    "/prices",
    (
        req,
        res
    ) => {

        res.json({
            success: true,
            prices: PRICES
        });

    }
);


/* =========================================================
   OPCJE MINECRAFT
========================================================= */

router.get(
    "/minecraft/options",
    (
        req,
        res
    ) => {

        res.json({

            success: true,

            software:
                MINECRAFT_SOFTWARE,

            versions:
                MINECRAFT_VERSIONS

        });

    }
);


/* =========================================================
   OPCJE DISCORD
========================================================= */

router.get(
    "/discord/options",
    (
        req,
        res
    ) => {

        res.json({

            success: true,

            nodeVersions:
                NODE_VERSIONS

        });

    }
);


/* =========================================================
   OPCJE WEB
========================================================= */

router.get(
    "/web/options",
    (
        req,
        res
    ) => {

        res.json({

            success: true,

            types:
                WEB_TYPES

        });

    }
);


/* =========================================================
   AKTUALIZACJA STATUSU PROVISIONING
========================================================= */

function updateProvisioning(
    services
) {

    let changed = false;

    const now =
        Date.now();

    services.forEach(
        service => {

            if (
                service.status !==
                    "provisioning"
            ) {
                return;
            }

            if (
                !service.readyAt
            ) {
                return;
            }

            if (
                now >=
                new Date(
                    service.readyAt
                ).getTime()
            ) {

                service.status =
                    "ready";

                service.readyAt =
                    null;

                service.updatedAt =
                    new Date().toISOString();

                changed = true;

            }

        }
    );

    return changed;

}


/* =========================================================
   USŁUGA PO ID
========================================================= */

function getServiceById(
    serviceId,
    userId
) {

    const services =
        readJSON(
            SERVICES_FILE,
            []
        );

    const changed =
        updateProvisioning(
            services
        );

    if (changed) {

        writeJSON(
            SERVICES_FILE,
            services
        );

    }

    const service =
        services.find(
            item =>
                String(item.id) ===
                String(serviceId)
        );

    if (!service) {
        return null;
    }

    const ceo =
        String(userId) ===
        String(OWNER_ID);

    if (
        String(service.ownerId) !==
            String(userId) &&
        !ceo
    ) {

        return null;

    }

    return service;

}


/* =========================================================
   LISTA MOICH USŁUG
========================================================= */

router.get(
    "/services",
    requireLogin,
    (
        req,
        res
    ) => {

        const services =
            readJSON(
                SERVICES_FILE,
                []
            );

        const changed =
            updateProvisioning(
                services
            );

        if (changed) {

            writeJSON(
                SERVICES_FILE,
                services
            );

        }

        const userServices =
            services.filter(
                service =>
                    String(
                        service.ownerId
                    ) ===
                    String(
                        req.user.id
                    )
            );

        res.json({

            success: true,

            services:
                userServices.map(
                    service => ({
                        id:
                            service.id,

                        type:
                            serviceName(
                                service.type
                            ),

                        package:
                            service.package,

                        days:
                            service.days,

                        price:
                            service.price,

                        status:
                            service.status,

                        software:
                            service.software ||
                            null,

                        minecraftVersion:
                            service.minecraftVersion ||
                            null,

                        nodeVersion:
                            service.nodeVersion ||
                            null,

                        webType:
                            service.webType ||
                            null,

                        createdAt:
                            service.createdAt,

                        expiresAt:
                            service.expiresAt

                    })
                )

        });

    }
);


/* =========================================================
   POJEDYNCZA USŁUGA
========================================================= */

router.get(
    "/service/:id",
    requireLogin,
    (
        req,
        res
    ) => {

        const service =
            getServiceById(
                req.params.id,
                req.user.id
            );

        if (!service) {

            return res
                .status(404)
                .json({

                    success: false,

                    message:
                        "Nie znaleziono usługi lub brak dostępu."

                });

        }

        res.json({

            success: true,

            service

        });

    }
);


/* =========================================================
   AKTUALIZACJA USŁUGI
========================================================= */

router.patch(
    "/service/:id",
    requireLogin,
    (
        req,
        res
    ) => {

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

        if (index === -1) {

            return res
                .status(404)
                .json({

                    success: false,

                    message:
                        "Usługa nie istnieje."

                });

        }

        const service =
            services[index];

        const ceo =
            String(req.user.id) ===
            String(OWNER_ID);

        if (
            String(service.ownerId) !==
                String(req.user.id) &&
            !ceo
        ) {

            return res
                .status(403)
                .json({

                    success: false,

                    message:
                        "Brak dostępu."

                });

        }


        /* Minecraft */

        if (
            service.type ===
            "minecraft"
        ) {

            if (
                req.body.software
            ) {

                const software =
                    String(
                        req.body.software
                    );

                if (
                    !MINECRAFT_SOFTWARE.includes(
                        software
                    )
                ) {

                    return res
                        .status(400)
                        .json({

                            success: false,

                            message:
                                "Nieprawidłowy silnik Minecraft."

                        });

                }

                service.software =
                    software;

            }


            if (
                req.body.minecraftVersion
            ) {

                const version =
                    String(
                        req.body.minecraftVersion
                    );

                const software =
                    service.software ||
                    "paper";

                if (
                    !MINECRAFT_VERSIONS[
                        software
                    ].includes(
                        version
                    )
                ) {

                    return res
                        .status(400)
                        .json({

                            success: false,

                            message:
                                "Ta wersja nie jest dostępna dla wybranego silnika."

                        });

                }

                service.minecraftVersion =
                    version;

            }

        }


        /* Discord */

        if (
            service.type ===
            "discord"
        ) {

            if (
                req.body.nodeVersion
            ) {

                const nodeVersion =
                    String(
                        req.body.nodeVersion
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

                            message:
                                "Nieprawidłowa wersja Node.js."

                        });

                }

                service.nodeVersion =
                    nodeVersion;

            }

        }


        /* Web */

        if (
            service.type ===
            "web"
        ) {

            if (
                req.body.webType
            ) {

                const webType =
                    String(
                        req.body.webType
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

                            message:
                                "Nieprawidłowy typ hostingu."

                        });

                }

                service.webType =
                    webType;

            }

        }


        service.updatedAt =
            new Date().toISOString();


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


/* =========================================================
   ZAKUP USŁUGI
========================================================= */

router.post(
    "/purchase",
    requireLogin,
    (
        req,
        res
    ) => {

        const service =
            String(
                req.body.service || ""
            );

        const packageName =
            String(
                req.body.packageName || ""
            );

        const days =
            Number(
                req.body.days
            );

        const discountCode =
            String(
                req.body.discountCode || ""
            )
            .trim()
            .toUpperCase();


        /* -------------------------
           WALIDACJA
        ------------------------- */

        if (
            !PRICES[
                service
            ]
        ) {

            return res
                .status(400)
                .json({

                    success: false,

                    message:
                        "Nieprawidłowy typ usługi."

                });

        }


        if (
            !PRICES[
                service
            ][
                packageName
            ]
        ) {

            return res
                .status(400)
                .json({

                    success: false,

                    message:
                        "Nieprawidłowy pakiet."

                });

        }


        if (
            ![
                7,
                30,
                90
            ].includes(days)
        ) {

            return res
                .status(400)
                .json({

                    success: false,

                    message:
                        "Nieprawidłowy czas usługi."

                });

        }


        const originalPrice =
            Number(
                PRICES[
                    service
                ][
                    packageName
                ][
                    days
                ]
            );


        /* -------------------------
           RABAT
        ------------------------- */

        let discount =
            0;

        let usedCode =
            null;


        if (discountCode) {

            const codes =
                readJSON(
                    CODES_FILE,
                    []
                );

            const code =
                codes.find(
                    item =>
                        String(
                            item.code
                        ).toUpperCase() ===
                        discountCode
                );

            if (!code) {

                return res
                    .status(400)
                    .json({

                        success: false,

                        message:
                            "Kod rabatowy nie istnieje."

                    });

            }


            if (
                code.active === false
            ) {

                return res
                    .status(400)
                    .json({

                        success: false,

                        message:
                            "Kod rabatowy jest nieaktywny."

                    });

            }


            if (
                code.expiresAt &&
                Date.now() >
                    new Date(
                        code.expiresAt
                    ).getTime()
            ) {

                return res
                    .status(400)
                    .json({

                        success: false,

                        message:
                            "Kod rabatowy wygasł."

                    });

            }


            if (
                code.maxUses &&
                Number(
                    code.used || 0
                ) >=
                    Number(
                        code.maxUses
                    )
            ) {

                return res
                    .status(400)
                    .json({

                        success: false,

                        message:
                            "Kod rabatowy osiągnął limit użyć."

                    });

            }


            discount =
                Math.max(
                    0,
                    Math.min(
                        100,
                        Number(
                            code.discount || 0
                        )
                    )
                );

            usedCode =
                code;

        }


        const price =
            Number(
                (
                    originalPrice *
                    (
                        1 -
                        discount / 100
                    )
                ).toFixed(2)
            );


        /* -------------------------
           PORTFEL
        ------------------------- */

        const wallet =
            getWallet(
                req.user.id
            );

        const balance =
            Number(
                wallet.balance || 0
            );


        if (
            balance <
            price
        ) {

            return res
                .status(400)
                .json({

                    success: false,

                    message:
                        `Brakuje Ci ${(price - balance).toFixed(2)} zł w portfelu.`,

                    balance

                });

        }


        /* -------------------------
           OPCJE MINECRAFT
        ------------------------- */

        let software =
            null;

        let minecraftVersion =
            null;


        if (
            service ===
            "minecraft"
        ) {

            software =
                String(
                    req.body.software ||
                    "paper"
                );


            minecraftVersion =
                String(
                    req.body.minecraftVersion ||
                    ""
                );


            if (
                !MINECRAFT_SOFTWARE.includes(
                    software
                )
            ) {

                return res
                    .status(400)
                    .json({

                        success: false,

                        message:
                            "Nieprawidłowy silnik Minecraft."

                    });

            }


            if (
                !MINECRAFT_VERSIONS[
                    software
                ].includes(
                    minecraftVersion
                )
            ) {

                return res
                    .status(400)
                    .json({

                        success: false,

                        message:
                            "Nieprawidłowa wersja Minecraft."

                    });

            }

        }


        /* -------------------------
           OPCJE DISCORD
        ------------------------- */

        let nodeVersion =
            null;


        if (
            service ===
            "discord"
        ) {

            nodeVersion =
                String(
                    req.body.nodeVersion ||
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

                        message:
                            "Nieprawidłowa wersja Node.js."

                    });

            }

        }


        /* -------------------------
           OPCJE WEB
        ------------------------- */

        let webType =
            null;


        if (
            service ===
            "web"
        ) {

            webType =
                String(
                    req.body.webType ||
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

                        message:
                            "Nieprawidłowy typ hostingu."

                    });

            }

        }


        /* -------------------------
           ODEJMOWANIE PIENIĘDZY
        ------------------------- */

        const updatedWallet =
            changeBalance(
                req.user.id,
                -price
            );


        if (!updatedWallet) {

            return res
                .status(400)
                .json({

                    success: false,

                    message:
                        "Nie udało się pobrać środków z portfela."

                });

        }


        /* -------------------------
           USŁUGA
        ------------------------- */

        const services =
            readJSON(
                SERVICES_FILE,
                []
            );


        /*
         * Kilka sekund przygotowania
         * panelu/usługi.
         *
         * Nie oznacza to uruchomienia
         * prawdziwego procesu serwera.
         */

        const provisioningSeconds =
            6;


        const readyAt =
            new Date(
                Date.now() +
                provisioningSeconds *
                1000
            ).toISOString();


        const serviceId =
            createId(
                service
            );


        const newService = {

            id:
                serviceId,

            ownerId:
                String(
                    req.user.id
                ),

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

            days:
                days,

            price:
                price,

            originalPrice:
                originalPrice,

            discount:
                discount,

            discountCode:
                usedCode
                    ? usedCode.code
                    : null,

            software:
                software,

            minecraftVersion:
                minecraftVersion,

            nodeVersion:
                nodeVersion,

            webType:
                webType,

            status:
                "provisioning",

            readyAt:
                readyAt,

            console:
                [],

            files:
                [],

            createdAt:
                new Date().toISOString(),

            updatedAt:
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


        services.push(
            newService
        );


        writeJSON(
            SERVICES_FILE,
            services
        );


        /* -------------------------
           KOD — UŻYCIE
        ------------------------- */

        if (usedCode) {

            const codes =
                readJSON(
                    CODES_FILE,
                    []
                );

            const index =
                codes.findIndex(
                    item =>
                        String(
                            item.code
                        ).toUpperCase() ===
                        String(
                            usedCode.code
                        ).toUpperCase()
                );

            if (
                index !== -1
            ) {

                codes[index].used =
                    Number(
                        codes[index].used ||
                        0
                    ) + 1;

                writeJSON(
                    CODES_FILE,
                    codes
                );

            }

        }


        /* -------------------------
           TRANSAKCJA
        ------------------------- */

        addTransaction({

            id:
                createId(
                    "tx"
                ),

            userId:
                String(
                    req.user.id
                ),

            username:
                req.user.username ||
                req.user.globalName ||
                "Nieznany",

            type:
                "hosting_purchase",

            amount:
                -price,

            status:
                "completed",

            serviceId:
                serviceId,

            service:
                service,

            package:
                packageName,

            days:
                days,

            createdAt:
                new Date().toISOString()

        });


        res.json({

            success: true,

            message:
                "Usługa została utworzona i jest przygotowywana.",

            service: {

                id:
                    newService.id,

                type:
                    newService.type,

                package:
                    newService.package,

                status:
                    newService.status,

                readyAt:
                    newService.readyAt

            },

            balance:
                updatedWallet.balance

        });

    }
);


/* =========================================================
   SPRAWDZENIE GOTOWOŚCI
========================================================= */

router.get(
    "/service/:id/status",
    requireLogin,
    (
        req,
        res
    ) => {

        const service =
            getServiceById(
                req.params.id,
                req.user.id
            );

        if (!service) {

            return res
                .status(404)
                .json({

                    success: false,

                    message:
                        "Usługa nie istnieje."

                });

        }


        res.json({

            success: true,

            id:
                service.id,

            status:
                service.status,

            readyAt:
                service.readyAt

        });

    }
);


/* =========================================================
   KONSOLE
========================================================= */

router.get(
    "/service/:id/console",
    requireLogin,
    (
        req,
        res
    ) => {

        const service =
            getServiceById(
                req.params.id,
                req.user.id
            );

        if (!service) {

            return res
                .status(404)
                .json({

                    success: false,

                    message:
                        "Brak dostępu."

                });

        }


        res.json({

            success: true,

            console:
                service.console ||
                []

        });

    }
);


/* =========================================================
   DODAWANIE WPISU DO KONSOLI
   UWAGA:
   To jest przygotowanie panelu.
   Nie uruchamia prawdziwego procesu.
========================================================= */

router.post(
    "/service/:id/console",
    requireLogin,
    (
        req,
        res
    ) => {

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

                    success: false

                });

        }


        const service =
            services[index];

        const ceo =
            String(req.user.id) ===
            String(OWNER_ID);

        if (
            String(service.ownerId) !==
                String(req.user.id) &&
            !ceo
        ) {

            return res
                .status(403)
                .json({

                    success: false,

                    message:
                        "Brak dostępu."

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

                    message:
                        "Komenda jest pusta."

                });

        }


        if (
            !service.console
        ) {
            service.console = [];
        }


        service.console.push({

            text:
                command,

            createdAt:
                new Date().toISOString()

        });


        service.updatedAt =
            new Date().toISOString();


        writeJSON(
            SERVICES_FILE,
            services
        );


        res.json({

            success: true,

            message:
                "Komenda zapisana w panelu.",

            console:
                service.console

        });

    }
);


/* =========================================================
   PLIKI USŁUGI
========================================================= */

router.get(
    "/service/:id/files",
    requireLogin,
    (
        req,
        res
    ) => {

        const service =
            getServiceById(
                req.params.id,
                req.user.id
            );

        if (!service) {

            return res
                .status(404)
                .json({

                    success: false,

                    message:
                        "Brak dostępu."

                });

        }


        res.json({

            success: true,

            files:
                service.files ||
                []

        });

    }
);


/* =========================================================
   CEO — WSZYSTKIE USŁUGI
========================================================= */

router.get(
    "/admin/services",
    requireLogin,
    requireCEO,
    (
        req,
        res
    ) => {

        const services =
            readJSON(
                SERVICES_FILE,
                []
            );

        const changed =
            updateProvisioning(
                services
            );

        if (changed) {

            writeJSON(
                SERVICES_FILE,
                services
            );

        }


        res.json({

            success: true,

            services

        });

    }
);


/* =========================================================
   CEO — JEDNA USŁUGA
========================================================= */

router.get(
    "/admin/services/:id",
    requireLogin,
    requireCEO,
    (
        req,
        res
    ) => {

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

                    message:
                        "Usługa nie istnieje."

                });

        }


        res.json({

            success: true,

            service

        });

    }
);


/* =========================================================
   CEO — USUNIĘCIE USŁUGI
========================================================= */

router.delete(
    "/admin/services/:id",
    requireLogin,
    requireCEO,
    (
        req,
        res
    ) => {

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

                    message:
                        "Usługa nie istnieje."

                });

        }


        const removed =
            services.splice(
                index,
                1
            )[0];


        writeJSON(
            SERVICES_FILE,
            services
        );


        res.json({

            success: true,

            message:
                "Usługa została usunięta.",

            service:
                removed

        });

    }
);


/* =========================================================
   CEO — KODY RABATOWE
========================================================= */

router.get(
    "/admin/codes",
    requireLogin,
    requireCEO,
    (
        req,
        res
    ) => {

        const codes =
            readJSON(
                CODES_FILE,
                []
            );

        res.json({

            success: true,

            codes

        });

    }
);


/* =========================================================
   CEO — UTWORZENIE KODU
========================================================= */

router.post(
    "/admin/codes",
    requireLogin,
    requireCEO,
    (
        req,
        res
    ) => {

        const code =
            String(
                req.body.code || ""
            )
            .trim()
            .toUpperCase();

        const discount =
            Number(
                req.body.discount
            );

        const maxUses =
            Number(
                req.body.maxUses || 0
            );

        const expiresAt =
            req.body.expiresAt ||
            null;


        if (!code) {

            return res
                .status(400)
                .json({

                    success: false,

                    message:
                        "Podaj kod."

                });

        }


        if (
            !Number.isFinite(
                discount
            ) ||
            discount <= 0 ||
            discount > 100
        ) {

            return res
                .status(400)
                .json({

                    success: false,

                    message:
                        "Rabat musi być od 1 do 100%."

                });

        }


        const codes =
            readJSON(
                CODES_FILE,
                []
            );


        if (
            codes.some(
                item =>
                    String(
                        item.code
                    ).toUpperCase() ===
                    code
            )
        ) {

            return res
                .status(400)
                .json({

                    success: false,

                    message:
                        "Taki kod już istnieje."

                });

        }


        const newCode = {

            id:
                createId(
                    "code"
                ),

            code,

            discount,

            maxUses:
                maxUses > 0
                    ? maxUses
                    : null,

            used:
                0,

            active:
                true,

            expiresAt,

            createdBy:
                String(
                    req.user.id
                ),

            createdAt:
                new Date().toISOString()

        };


        codes.push(
            newCode
        );


        writeJSON(
            CODES_FILE,
            codes
        );


        res.json({

            success: true,

            code:
                newCode

        });

    }
);


/* =========================================================
   CEO — WŁĄCZ / WYŁĄCZ KOD
========================================================= */

router.patch(
    "/admin/codes/:id",
    requireLogin,
    requireCEO,
    (
        req,
        res
    ) => {

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

                    message:
                        "Kod nie istnieje."

                });

        }


        if (
            typeof req.body.active ===
            "boolean"
        ) {

            codes[index].active =
                req.body.active;

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


/* =========================================================
   CEO — USUNIĘCIE KODU
========================================================= */

router.delete(
    "/admin/codes/:id",
    requireLogin,
    requireCEO,
    (
        req,
        res
    ) => {

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

                    success: false

                });

        }


        codes.splice(
            index,
            1
        );


        writeJSON(
            CODES_FILE,
            codes
        );


        res.json({

            success: true,

            message:
                "Kod został usunięty."

        });

    }
);

/* =========================================================
   CEO — PORTFEL UŻYTKOWNIKA
========================================================= */

router.get(
    "/admin/wallet/:userId",
    requireLogin,
    requireCEO,
    (req, res) => {

        const userId =
            String(req.params.userId || "").trim();

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "Nie podano ID użytkownika."
            });
        }

        const wallets =
            readJSON(
                WALLET_FILE,
                []
            );

        const transactions =
            readJSON(
                TRANSACTIONS_FILE,
                []
            );

        const wallet =
            wallets.find(
                item =>
                    String(
                        item.userId ??
                        item.id ??
                        ""
                    ) === userId
            );

        if (!wallet) {
            return res.status(404).json({
                success: false,
                message: "Nie znaleziono portfela użytkownika."
            });
        }

        const userTransactions =
            transactions.filter(
                item =>
                    String(
                        item.userId ??
                        item.user_id ??
                        ""
                    ) === userId
            );

        res.json({
            success: true,

            wallet,

            transactions:
                userTransactions
        });
    }
);

/* =========================================================
   CEO — STATYSTYKI
========================================================= */

router.get(
    "/admin/stats",
    requireLogin,
    requireCEO,
    (
        req,
        res
    ) => {

        const services =
            readJSON(
                SERVICES_FILE,
                []
            );

        const wallets =
            readJSON(
                WALLET_FILE,
                []
            );

        const transactions =
            readJSON(
                TRANSACTIONS_FILE,
                []
            );


        const stats = {

            users:
                wallets.length,

            services:
                services.length,

            minecraft:
                services.filter(
                    item =>
                        item.type ===
                        "minecraft"
                ).length,

            discord:
                services.filter(
                    item =>
                        item.type ===
                        "discord"
                ).length,

            web:
                services.filter(
                    item =>
                        item.type ===
                        "web"
                ).length,

            revenue:
                Number(
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
                                        item.amount ||
                                        0
                                    )
                                ),
                            0
                        )
                        .toFixed(2)
                )

        };


        res.json({

            success: true,

            stats

        });

    }
);


/* =========================================================
   EXPORT
========================================================= */

module.exports = router;
