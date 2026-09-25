const fs = require("fs");
const path = require("path");

const SERVICES_FILE = path.join(
    __dirname,
    "..",
    "data",
    "hosting",
    "services.json"
);

function readJSON(file) {

    try {

        if (!fs.existsSync(file)) {
            return [];
        }

        const content =
            fs.readFileSync(
                file,
                "utf8"
            );

        if (!content.trim()) {
            return [];
        }

        return JSON.parse(content);

    } catch {

        return [];

    }

}

function writeJSON(file, data) {

    const directory =
        path.dirname(file);

    if (!fs.existsSync(directory)) {

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


function requireLogin(req, res, next) {

    if (!req.user) {

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


function findService(
    serviceId,
    userId
) {

    const services =
        readJSON(
            SERVICES_FILE
        );

    const index =
        services.findIndex(
            service =>
                String(service.id) ===
                String(serviceId)
        );

    if (index === -1) {
        return null;
    }

    const service =
        services[index];

    if (
        String(service.ownerId) !==
        String(userId)
    ) {

        return null;

    }

    return {
        services,
        index,
        service
    };

}


function addConsole(
    service,
    text
) {

    if (!Array.isArray(service.console)) {
        service.console = [];
    }

    service.console.push({

        text:
            String(text),

        createdAt:
            new Date().toISOString()

    });

}


module.exports = function registerHostingControl(app) {

    app.post(
        "/api/hosting/service/:id/power",
        requireLogin,
        (req, res) => {

            const found =
                findService(
                    req.params.id,
                    req.user.id
                );

            if (!found) {

                return res
                    .status(404)
                    .json({
                        success: false,
                        message:
                            "Nie znaleziono usługi."
                    });

            }

            const action =
                String(
                    req.body.action ||
                    ""
                )
                .trim()
                .toLowerCase();

            const service =
                found.service;

            if (
                ![
                    "start",
                    "stop",
                    "restart"
                ].includes(action)
            ) {

                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "Nieprawidłowa akcja."
                    });

            }

            if (
                action === "start"
            ) {

                service.powerStatus =
                    "online";

                addConsole(
                    service,
                    "Serwer został uruchomiony."
                );

            }

            if (
                action === "stop"
            ) {

                service.powerStatus =
                    "offline";

                addConsole(
                    service,
                    "Serwer został wyłączony."
                );

            }

            if (
                action === "restart"
            ) {

                service.powerStatus =
                    "online";

                addConsole(
                    service,
                    "Serwer został zrestartowany."
                );

            }

            service.updatedAt =
                new Date().toISOString();

            writeJSON(
                SERVICES_FILE,
                found.services
            );

            res.json({

                success: true,

                status:
                    service.powerStatus,

                service

            });

        }
    );


    app.get(
        "/api/hosting/service/:id/network",
        requireLogin,
        (req, res) => {

            const found =
                findService(
                    req.params.id,
                    req.user.id
                );

            if (!found) {

                return res
                    .status(404)
                    .json({
                        success: false,
                        message:
                            "Nie znaleziono usługi."
                    });

            }

            const service =
                found.service;

            let hash = 0;

            const source =
                String(
                    service.id
                );

            for (
                let i = 0;
                i < source.length;
                i++
            ) {

                hash =
                    (
                        hash * 31 +
                        source.charCodeAt(i)
                    ) >>> 0;

            }

            const octet3 =
                10 +
                (
                    hash %
                    230
                );

            const octet4 =
                10 +
                (
                    Math.floor(
                        hash / 230
                    ) %
                    230
                );

            const port =
                20000 +
                (
                    hash %
                    39999
                );

            const configuredName =
                service.serverName ||
                service.config?.serverName ||
                "twojserwer";

            const hostname =
                String(
                    configuredName
                )
                .toLowerCase()
                .trim()
                .replace(
                    /[^a-z0-9]+/g,
                    "-"
                )
                .replace(
                    /^-+|-+$/g,
                    ""
                )
                .slice(
                    0,
                    32
                ) ||
                "twojserwer";

            res.json({

                success: true,

                hostname:
                    `${hostname}.zenityhost.pl`,

                ipv4:
                    `185.${octet3}.${octet4}:${port}`

            });

        }
    );

};
