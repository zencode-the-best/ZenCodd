const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { spawn } = require("child_process");

const axios = require("axios");

const RUNTIME_ROOT = path.join(
    __dirname,
    "..",
    "data",
    "minecraft-runtime"
);

fs.mkdirSync(RUNTIME_ROOT, {
    recursive: true
});

const processes = new Map();
const sockets = new Map();

function log(...args) {
    console.log(...args);
}

function getServiceId(service) {
    return String(
        service?.id ||
        service?.serviceId ||
        service?._id ||
        ""
    );
}

function getMemory(service) {
    const value =
        service?.memory ??
        service?.ramMb ??
        service?.ram ??
        service?.resources?.ram ??
        service?.package?.ram ??
        2048;

    const memory = Number(value);

    if (!Number.isFinite(memory) || memory <= 0) {
        return 2048;
    }

    return Math.floor(memory);
}

function getPort(service) {
    const value =
        service?.port ??
        service?.minecraftPort ??
        service?.resources?.port;

    const port = Number(value);

    if (
        Number.isFinite(port) &&
        port >= 1 &&
        port <= 65535
    ) {
        return Math.floor(port);
    }

    return 25565;
}

function getVersion(service) {
    return String(
        service?.version ||
        service?.minecraftVersion ||
        service?.minecraft?.version ||
        "1.21.4"
    );
}

function getSoftware(service) {
    return String(
        service?.software ||
        service?.minecraftSoftware ||
        "paper"
    ).toLowerCase();
}

function getRuntimeDirectory(service) {
    const serviceId = getServiceId(service);

    if (!serviceId) {
        throw new Error(
            "Brak ID usługi Minecraft."
        );
    }

    const safeId = serviceId.replace(
        /[^a-zA-Z0-9._-]/g,
        "_"
    );

    const directory = path.join(
        RUNTIME_ROOT,
        safeId
    );

    fs.mkdirSync(directory, {
        recursive: true
    });

    return directory;
}

function getJavaPath() {
    if (process.env.JAVA_HOME) {
        return path.join(
            process.env.JAVA_HOME,
            "bin",
            "java"
        );
    }

    return "/opt/java/openjdk/bin/java";
}

function ensureJava() {
    const javaPath = getJavaPath();

    log(
        `Sprawdzanie Java: ${javaPath}`
    );

    if (!fs.existsSync(javaPath)) {
        throw new Error(
            `Java nie istnieje pod ścieżką: ${javaPath}`
        );
    }

    log(
        `Java znaleziona: ${javaPath}`
    );

    return javaPath;
}

function ensureProperties(
    runtimeDir,
    port
) {
    const propertiesPath = path.join(
        runtimeDir,
        "server.properties"
    );

    let properties = "";

    if (fs.existsSync(propertiesPath)) {
        properties = fs.readFileSync(
            propertiesPath,
            "utf8"
        );
    }

    const lines = properties
        .split(/\r?\n/)
        .filter(Boolean)
        .filter(
            line =>
                !line.startsWith("server-port=")
        );

    lines.push(
        `server-port=${port}`
    );

    if (
        !lines.some(
            line =>
                line.startsWith(
                    "server-ip="
                )
        )
    ) {
        lines.push("server-ip=");
    }

    fs.writeFileSync(
        propertiesPath,
        `${lines.join("\n")}\n`,
        "utf8"
    );
}

function ensureEula(runtimeDir) {
    const eulaPath = path.join(
        runtimeDir,
        "eula.txt"
    );

    fs.writeFileSync(
        eulaPath,
        "eula=true\n",
        "utf8"
    );
}

function downloadFile(
    url,
    destination
) {
    return new Promise(
        (resolve, reject) => {
            const request = require("https").get(
                url,
                {
                    headers: {
                        "User-Agent":
                            "ZenityHost/1.0"
                    }
                },
                response => {
                    if (
                        response.statusCode >= 300 &&
                        response.statusCode < 400 &&
                        response.headers.location
                    ) {
                        response.resume();

                        return downloadFile(
                            response.headers.location,
                            destination
                        )
                            .then(resolve)
                            .catch(reject);
                    }

                    if (
                        response.statusCode !== 200
                    ) {
                        response.resume();

                        reject(
                            new Error(
                                `HTTP ${response.statusCode} podczas pobierania ${url}`
                            )
                        );

                        return;
                    }

                    const file = fs.createWriteStream(
                        destination
                    );

                    response.pipe(file);

                    file.on(
                        "finish",
                        () => {
                            file.close(
                                () => resolve()
                            );
                        }
                    );

                    file.on(
                        "error",
                        error => {
                            file.close(
                                () => {}
                            );

                            reject(error);
                        }
                    );
                }
            );

            request.on(
                "error",
                reject
            );
        }
    );
}

async function getPaperDownload(
    version
) {
    const url =
        `https://fill.papermc.io/v3/projects/paper/versions/${encodeURIComponent(version)}/builds`;

    log(
        `Sprawdzanie Paper ${version}...`
    );

    const response =
        await axios.get(
            url,
            {
                headers: {
                    "User-Agent":
                        "ZenityHost/1.0"
                },
                timeout: 30000
            }
        );

    const builds =
        Array.isArray(response.data)
            ? response.data
            : [];

    const stableBuilds =
        builds.filter(build => {
            const channel =
                String(
                    build?.channel ||
                    ""
                ).toLowerCase();

            return (
                channel === "default" ||
                channel === "stable" ||
                channel === ""
            );
        });

    const candidates =
        stableBuilds.length
            ? stableBuilds
            : builds;

    if (!candidates.length) {
        throw new Error(
            `Nie znaleziono Paper dla Minecraft ${version}.`
        );
    }

    candidates.sort(
        (a, b) =>
            Number(b?.build || 0) -
            Number(a?.build || 0)
    );

    const selected =
        candidates[0];

    const downloadUrl =
        selected?.downloads?.[
            "server:default"
        ]?.url ||
        selected?.downloads?.server?.url ||
        selected?.downloads?.["server"]?.url;

    if (!downloadUrl) {
        throw new Error(
            `Paper ${version} nie ma dostępnego pliku server:default.`
        );
    }

    const build =
        Number(selected?.build);

    log(
        `Znaleziono stabilny Paper ${version}, build ${build}.`
    );

    return {
        version,
        build,
        url: downloadUrl
    };
}

async function prepareServer(
    service
) {
    const runtimeDir =
        getRuntimeDirectory(service);

    const version =
        getVersion(service);

    const software =
        getSoftware(service);

    const port =
        getPort(service);

    if (software !== "paper") {
        throw new Error(
            `Aktualnie prawdziwy runtime obsługuje Paper. Wybrano: ${software}`
        );
    }

    const paper =
        await getPaperDownload(version);

    const jarName =
        `paper-${version}-${paper.build}.jar`;

    const jarPath =
        path.join(
            runtimeDir,
            jarName
        );

    if (!fs.existsSync(jarPath)) {
        log(
            `Pobieranie Paper ${version}, build ${paper.build}...`
        );

        await downloadFile(
            paper.url,
            jarPath
        );

        log(
            `Paper pobrany: ${jarName}`
        );
    } else {
        log(
            `Paper już istnieje: ${jarName}`
        );
    }

    ensureEula(runtimeDir);
    ensureProperties(
        runtimeDir,
        port
    );

    return {
        runtimeDir,
        jarPath,
        jarName,
        version,
        build: paper.build,
        port
    };
}

function broadcast(
    serviceId,
    type,
    data
) {
    const set =
        sockets.get(serviceId);

    if (!set) {
        return;
    }

    const payload =
        JSON.stringify({
            type,
            ...data
        });

    for (const socket of set) {
        try {
            if (
                socket.readyState === 1
            ) {
                socket.send(payload);
            }
        } catch {
            // ignoruj zamknięte połączenie
        }
    }
}

function attachSocket(
    serviceId,
    socket
) {
    if (
        !sockets.has(serviceId)
    ) {
        sockets.set(
            serviceId,
            new Set()
        );
    }

    sockets
        .get(serviceId)
        .add(socket);

    socket.on(
        "close",
        () => {
            sockets
                .get(serviceId)
                ?.delete(socket);
        }
    );
}

async function startMinecraft(
    service
) {
    const serviceId =
        getServiceId(service);

    if (!serviceId) {
        throw new Error(
            "Brak ID usługi."
        );
    }

    const existing =
        processes.get(serviceId);

    if (
        existing &&
        existing.process &&
        !existing.process.killed
    ) {
        return {
            ok: true,
            alreadyRunning: true,
            pid:
                existing.process.pid
        };
    }

    const prepared =
        await prepareServer(
            service
        );

    const memory =
        getMemory(service);

    const javaPath =
        ensureJava();

    const javaArgs = [
        `-Xms${memory}M`,
        `-Xmx${memory}M`,
        "-jar",
        prepared.jarName,
        "nogui"
    ];

    log(
        `Minecraft: ${prepared.version}`
    );

    log(
        `Paper build: ${prepared.build}`
    );

    log(
        `RAM: ${memory} MB`
    );

    log(
        `Port Minecraft: ${prepared.port}`
    );

    log(
        `Java executable: ${javaPath}`
    );

    log(
        `Uruchamianie: ${javaPath} ${javaArgs.join(" ")}`
    );

    const minecraftProcess =
        spawn(
            javaPath,
            javaArgs,
            {
                cwd:
                    prepared.runtimeDir,

                env: {
                    ...process.env,

                    JAVA_HOME:
                        process.env.JAVA_HOME ||
                        "/opt/java/openjdk",

                    PATH:
                        `${path.dirname(javaPath)}:${process.env.PATH || ""}`
                },

                stdio: [
                    "pipe",
                    "pipe",
                    "pipe"
                ]
            }
        );

    const runtime = {
        process:
            minecraftProcess,

        service,

        serviceId,

        runtimeDir:
            prepared.runtimeDir,

        startedAt:
            new Date().toISOString(),

        version:
            prepared.version,

        build:
            prepared.build,

        port:
            prepared.port
    };

    processes.set(
        serviceId,
        runtime
    );

    log(
        `Proces Minecraft utworzony. PID: ${minecraftProcess.pid}`
    );

    broadcast(
        serviceId,
        "status",
        {
            status: "starting",
            pid:
                minecraftProcess.pid
        }
    );

    minecraftProcess.stdout.on(
        "data",
        chunk => {
            const text =
                chunk.toString();

            process.stdout.write(
                `[MINECRAFT] ${text}`
            );

            broadcast(
                serviceId,
                "console",
                {
                    data: text
                }
            );
        }
    );

    minecraftProcess.stderr.on(
        "data",
        chunk => {
            const text =
                chunk.toString();

            process.stderr.write(
                `[MINECRAFT ERROR] ${text}`
            );

            broadcast(
                serviceId,
                "console",
                {
                    data: text,
                    error: true
                }
            );
        }
    );

    minecraftProcess.on(
        "error",
        error => {
            log(
                `[PROCESS ERROR] ${error.message}`
            );

            broadcast(
                serviceId,
                "status",
                {
                    status: "error",
                    error:
                        error.message
                }
            );
        }
    );

    minecraftProcess.on(
        "spawn",
        () => {
            log(
                `Proces Minecraft uruchomiony. PID: ${minecraftProcess.pid}`
            );

            broadcast(
                serviceId,
                "status",
                {
                    status: "running",
                    pid:
                        minecraftProcess.pid
                }
            );
        }
    );

    minecraftProcess.on(
        "exit",
        (
            code,
            signal
        ) => {
            log(
                `Proces Minecraft zakończony. Kod: ${code}, sygnał: ${signal || "brak"}`
            );

            broadcast(
                serviceId,
                "status",
                {
                    status: "stopped",
                    code,
                    signal
                }
            );

            processes.delete(
                serviceId
            );
        }
    );

    return {
        ok: true,

        running: true,

        pid:
            minecraftProcess.pid,

        version:
            prepared.version,

        build:
            prepared.build,

        port:
            prepared.port
    };
}

function stopMinecraft(
    serviceId
) {
    const runtime =
        processes.get(
            String(serviceId)
        );

    if (
        !runtime ||
        !runtime.process
    ) {
        return {
            ok: true,
            running: false
        };
    }

    const minecraftProcess =
        runtime.process;

    if (
        !minecraftProcess.killed
    ) {
        try {
            minecraftProcess.stdin.write(
                "stop\n"
            );
        } catch {
            try {
                minecraftProcess.kill(
                    "SIGTERM"
                );
            } catch {
                // proces już zakończony
            }
        }
    }

    return {
        ok: true,
        stopping: true
    };
}

async function restartMinecraft(
    service
) {
    const serviceId =
        getServiceId(service);

    stopMinecraft(
        serviceId
    );

    await new Promise(
        resolve =>
            setTimeout(
                resolve,
                2000
            )
    );

    return startMinecraft(
        service
    );
}

function sendCommand(
    serviceId,
    command
) {
    const runtime =
        processes.get(
            String(serviceId)
        );

    if (
        !runtime ||
        !runtime.process
    ) {
        throw new Error(
            "Serwer Minecraft nie jest uruchomiony."
        );
    }

    const minecraftProcess =
        runtime.process;

    if (
        minecraftProcess.killed ||
        !minecraftProcess.stdin
    ) {
        throw new Error(
            "Proces Minecraft nie jest dostępny."
        );
    }

    minecraftProcess.stdin.write(
        `${String(command)}\n`
    );

    return {
        ok: true
    };
}

function getRuntimeState(
    serviceId
) {
    const runtime =
        processes.get(
            String(serviceId)
        );

    if (
        !runtime ||
        !runtime.process
    ) {
        return {
            running: false,
            status: "stopped"
        };
    }

    const process =
        runtime.process;

    return {
        running:
            !process.killed &&
            process.exitCode === null,

        status:
            process.exitCode === null
                ? "running"
                : "stopped",

        pid:
            process.pid,

        version:
            runtime.version,

        build:
            runtime.build,

        port:
            runtime.port,

        startedAt:
            runtime.startedAt
    };
}

function getRuntimeDirectoryForService(
    service
) {
    return getRuntimeDirectory(
        service
    );
}

function getProcess(
    serviceId
) {
    return processes.get(
        String(serviceId)
    );
}

module.exports = {
    startMinecraft,
    stopMinecraft,
    restartMinecraft,
    sendCommand,
    getRuntimeState,
    attachSocket,
    getRuntimeDirectory:
        getRuntimeDirectoryForService,
    getProcess
};
