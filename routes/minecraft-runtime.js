const fs = require("fs");
const path = require("path");
const https = require("https");
const { spawn } = require("child_process");
const WebSocket = require("ws");

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

const SERVERS_DIR = path.join(
    DATA_DIR,
    "minecraft"
);

const processes = new Map();
const sockets = new Map();

fs.mkdirSync(
    SERVERS_DIR,
    {
        recursive: true
    }
);

function readServices() {

    try {

        if (!fs.existsSync(SERVICES_FILE)) {
            return [];
        }

        return JSON.parse(
            fs.readFileSync(
                SERVICES_FILE,
                "utf8"
            )
        );

    } catch (error) {

        console.error(
            "[Minecraft Runtime] Błąd odczytu services.json:",
            error.message
        );

        return [];

    }

}

function saveServices(services) {

    fs.mkdirSync(
        path.dirname(SERVICES_FILE),
        {
            recursive: true
        }
    );

    fs.writeFileSync(
        SERVICES_FILE,
        JSON.stringify(
            services,
            null,
            2
        ),
        "utf8"
    );

}

function getService(id) {

    return readServices().find(
        service =>
            String(service.id) ===
            String(id)
    );

}

function updateService(id, changes) {

    const services =
        readServices();

    const index =
        services.findIndex(
            service =>
                String(service.id) ===
                String(id)
        );

    if (index === -1) {
        return null;
    }

    services[index] = {
        ...services[index],
        ...changes,
        updatedAt:
            new Date().toISOString()
    };

    saveServices(services);

    return services[index];

}

function getServerDirectory(service) {

    const directory =
        path.join(
            SERVERS_DIR,
            String(service.id)
        );

    fs.mkdirSync(
        directory,
        {
            recursive: true
        }
    );

    return directory;

}

function broadcast(
    serviceId,
    message
) {

    const clients =
        sockets.get(
            String(serviceId)
        );

    if (!clients) {
        return;
    }

    const payload =
        JSON.stringify({
            type: "console",
            data: String(message)
        });

    for (
        const ws of clients
    ) {

        if (
            ws.readyState ===
            WebSocket.OPEN
        ) {

            try {
                ws.send(payload);
            } catch {}

        }

    }

}

function broadcastStatus(
    serviceId,
    state
) {

    const clients =
        sockets.get(
            String(serviceId)
        );

    if (!clients) {
        return;
    }

    const payload =
        JSON.stringify({
            type: "status",
            data: state
        });

    for (
        const ws of clients
    ) {

        if (
            ws.readyState ===
            WebSocket.OPEN
        ) {

            try {
                ws.send(payload);
            } catch {}

        }

    }

}

function addConsole(
    serviceId,
    message
) {

    const service =
        getService(serviceId);

    if (!service) {
        return;
    }

    const line =
        String(message)
            .replace(/\r/g, "")
            .trimEnd();

    if (!line) {
        return;
    }

    service.console =
        Array.isArray(service.console)
            ? service.console
            : [];

    service.console.push({

        id:
            `console-${Date.now()}-${Math.random()
                .toString(16)
                .slice(2)}`,

        type: "runtime",

        text: line,

        createdAt:
            new Date().toISOString()

    });

    if (
        service.console.length >
        1000
    ) {

        service.console =
            service.console.slice(-1000);

    }

    updateService(
        serviceId,
        {
            console:
                service.console
        }
    );

    broadcast(
        serviceId,
        line
    );

}

function downloadFile(
    url,
    destination
) {

    return new Promise(
        (resolve, reject) => {

            const request =
                https.get(
                    url,
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
                                    `HTTP ${response.statusCode}`
                                )
                            );

                            return;

                        }

                        const file =
                            fs.createWriteStream(
                                destination
                            );

                        response.pipe(file);

                        file.on(
                            "finish",
                            () => {

                                file.close(
                                    resolve
                                );

                            }
                        );

                        file.on(
                            "error",
                            error => {

                                try {
                                    fs.unlinkSync(
                                        destination
                                    );
                                } catch {}

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
        `https://api.papermc.io/v2/projects/paper/versions/${encodeURIComponent(version)}`;

    const response =
        await fetch(url);

    if (!response.ok) {

        throw new Error(
            `Paper API HTTP ${response.status}`
        );

    }

    const data =
        await response.json();

    if (
        !Array.isArray(data.builds) ||
        !data.builds.length
    ) {

        throw new Error(
            `Brak buildów Paper dla ${version}`
        );

    }

    const build =
        data.builds[
            data.builds.length - 1
        ];

    return {

        version,

        build,

        url:
            `https://api.papermc.io/v2/projects/paper/versions/${encodeURIComponent(version)}/builds/${build}/downloads/paper-${version}-${build}.jar`,

        file:
            `paper-${version}-${build}.jar`

    };

}

function getMemory(service) {

    const packageName =
        String(
            service.package ||
            "dirt"
        ).toLowerCase();

    const memoryMap = {

        dirt: 2048,

        obsidian: 4096,

        "złoto": 6144,

        szmaragd: 8192,

        diament: 12288

    };

    return Number(
        service.memory ||
        service.ramMb ||
        memoryMap[packageName] ||
        2048
    );

}

async function prepareServer(
    service
) {

    const directory =
        getServerDirectory(
            service
        );

    const version =
        service.minecraftVersion ||
        service.version ||
        "1.21.8";

    const software =
        String(
            service.software ||
            "paper"
        )
        .trim()
        .toLowerCase();

    if (
        software !== "paper"
    ) {

        throw new Error(
            `Runtime obsługuje obecnie tylko Paper. Wybrano: ${software}`
        );

    }

    addConsole(
        service.id,
        `Sprawdzanie Paper ${version}...`
    );

    const info =
        await getPaperDownload(
            version
        );

    const jarPath =
        path.join(
            directory,
            info.file
        );

    if (
        !fs.existsSync(jarPath)
    ) {

        addConsole(
            service.id,
            `Pobieranie Paper ${version}, build ${info.build}...`
        );

        await downloadFile(
            info.url,
            jarPath
        );

        addConsole(
            service.id,
            `Paper pobrany: ${info.file}`
        );

    } else {

        addConsole(
            service.id,
            `Paper już istnieje: ${info.file}`
        );

    }

    const eulaPath =
        path.join(
            directory,
            "eula.txt"
        );

    fs.writeFileSync(
        eulaPath,
        "eula=true\n",
        "utf8"
    );

    const propertiesPath =
        path.join(
            directory,
            "server.properties"
        );

    const port =
        Number(
            service.port
        ) || 25565;

    if (
        !fs.existsSync(
            propertiesPath
        )
    ) {

        fs.writeFileSync(
            propertiesPath,
            [
                `server-port=${port}`,
                "server-ip=",
                "online-mode=true",
                "enable-command-block=true",
                "motd=ZenityHost",
                "max-players=20",
                "view-distance=10",
                "simulation-distance=10"
            ].join("\n") + "\n",
            "utf8"
        );

    }

    return {

        directory,

        jar:
            info.file,

        jarPath,

        port

    };

}

async function startMinecraft(
    serviceId
) {

    const id =
        String(serviceId);

    if (
        processes.has(id)
    ) {

        return {

            ok: false,

            error:
                "Serwer Minecraft jest już uruchomiony."

        };

    }

    const service =
        getService(id);

    if (!service) {

        return {

            ok: false,

            error:
                "Nie znaleziono usługi."

        };

    }

    updateService(
        id,
        {
            status: "provisioning",
            powerState: "starting",
            pid: null
        }
    );

    broadcastStatus(
        id,
        "starting"
    );

    addConsole(
        id,
        "========================================"
    );

    addConsole(
        id,
        "ZenityHost Runtime"
    );

    addConsole(
        id,
        "Przygotowywanie prawdziwego procesu Minecraft..."
    );

    try {

        const prepared =
            await prepareServer(
                service
            );

        const memory =
            getMemory(
                service
            );

        const javaArgs = [

            `-Xms${memory}M`,

            `-Xmx${memory}M`,

            "-jar",

            prepared.jar,

            "nogui"

        ];

        addConsole(
            id,
            `RAM: ${memory} MB`
        );

        addConsole(
            id,
            `Port Minecraft: ${prepared.port}`
        );

        addConsole(
            id,
            `Uruchamianie: java ${javaArgs.join(" ")}`
        );

        const child =
            spawn(
                "java",
                javaArgs,
                {
                    cwd:
                        prepared.directory,

                    stdio: [
                        "pipe",
                        "pipe",
                        "pipe"
                    ],

                    windowsHide: true
                }
            );

        processes.set(
            id,
            child
        );

        updateService(
            id,
            {
                status: "running",
                powerState: "online",
                pid: child.pid
            }
        );

        broadcastStatus(
            id,
            "online"
        );

        addConsole(
            id,
            `Proces Minecraft uruchomiony. PID: ${child.pid}`
        );

        child.stdout.on(
            "data",
            data => {

                const text =
                    data.toString();

                for (
                    const line of
                    text.split(/\r?\n/)
                ) {

                    if (
                        line.trim()
                    ) {

                        addConsole(
                            id,
                            line
                        );

                    }

                }

            }
        );

        child.stderr.on(
            "data",
            data => {

                const text =
                    data.toString();

                for (
                    const line of
                    text.split(/\r?\n/)
                ) {

                    if (
                        line.trim()
                    ) {

                        addConsole(
                            id,
                            `[STDERR] ${line}`
                        );

                    }

                }

            }
        );

        child.on(
            "error",
            error => {

                processes.delete(
                    id
                );

                addConsole(
                    id,
                    `[PROCESS ERROR] ${error.message}`
                );

                updateService(
                    id,
                    {
                        status: "error",
                        powerState: "offline",
                        pid: null
                    }
                );

                broadcastStatus(
                    id,
                    "offline"
                );

            }
        );

        child.on(
            "close",
            code => {

                processes.delete(
                    id
                );

                addConsole(
                    id,
                    `Proces Minecraft zakończony. Kod procesu: ${code}`
                );

                updateService(
                    id,
                    {
                        status: "stopped",
                        powerState: "offline",
                        pid: null
                    }
                );

                broadcastStatus(
                    id,
                    "offline"
                );

            }
        );

        return {

            ok: true,

            pid:
                child.pid

        };

    } catch (error) {

        updateService(
            id,
            {
                status: "error",
                powerState: "offline",
                pid: null
            }
        );

        broadcastStatus(
            id,
            "offline"
        );

        addConsole(
            id,
            `[START ERROR] ${error.message}`
        );

        return {

            ok: false,

            error:
                error.message

        };

    }

}

function stopMinecraft(
    serviceId
) {

    const id =
        String(serviceId);

    const child =
        processes.get(id);

    if (!child) {

        updateService(
            id,
            {
                status: "stopped",
                powerState: "offline",
                pid: null
            }
        );

        broadcastStatus(
            id,
            "offline"
        );

        addConsole(
            id,
            "Brak aktywnego procesu Minecraft."
        );

        return {
            ok: true
        };

    }

    addConsole(
        id,
        "Wysyłanie komendy stop do Minecraft..."
    );

    try {

        child.stdin.write(
            "stop\n"
        );

    } catch {}

    setTimeout(
        () => {

            if (
                processes.has(id)
            ) {

                try {
                    child.kill(
                        "SIGTERM"
                    );
                } catch {}

            }

        },
        10000
    );

    return {
        ok: true
    };

}

async function restartMinecraft(
    serviceId
) {

    const id =
        String(serviceId);

    const child =
        processes.get(id);

    if (!child) {
        return startMinecraft(
            id
        );
    }

    addConsole(
        id,
        "Restartowanie serwera Minecraft..."
    );

    try {

        child.stdin.write(
            "stop\n"
        );

    } catch {}

    return new Promise(
        resolve => {

            let finished =
                false;

            const finish =
                async () => {

                    if (finished) {
                        return;
                    }

                    finished = true;

                    clearTimeout(
                        timeout
                    );

                    processes.delete(
                        id
                    );

                    const result =
                        await startMinecraft(
                            id
                        );

                    resolve(
                        result
                    );

                };

            const timeout =
                setTimeout(
                    () => {

                        try {
                            child.kill(
                                "SIGTERM"
                            );
                        } catch {}

                        finish();

                    },
                    10000
                );

            child.once(
                "close",
                finish
            );

        }
    );

}

function sendCommand(
    serviceId,
    command
) {

    const id =
        String(serviceId);

    const child =
        processes.get(id);

    if (!child) {

        return {

            ok: false,

            error:
                "Serwer Minecraft nie jest uruchomiony."

        };

    }

    const text =
        String(
            command || ""
        ).trim();

    if (!text) {

        return {

            ok: false,

            error:
                "Komenda jest pusta."

        };

    }

    addConsole(
        id,
        `> ${text}`
    );

    try {

        child.stdin.write(
            `${text}\n`
        );

        return {
            ok: true
        };

    } catch (error) {

        return {

            ok: false,

            error:
                error.message

        };

    }

}

function setupWebSocket(
    server
) {

    const wss =
        new WebSocket.Server({
            server,
            path: "/ws/minecraft"
        });

    wss.on(
        "connection",
        (ws, request) => {

            try {

                const url =
                    new URL(
                        request.url,
                        "http://localhost"
                    );

                const serviceId =
                    url.searchParams.get(
                        "service"
                    );

                if (!serviceId) {

                    ws.close(
                        1008,
                        "Brak service"
                    );

                    return;

                }

                const service =
                    getService(
                        serviceId
                    );

                if (!service) {

                    ws.close(
                        1008,
                        "Nie znaleziono usługi"
                    );

                    return;

                }

                const id =
                    String(
                        serviceId
                    );

                if (
                    !sockets.has(id)
                ) {

                    sockets.set(
                        id,
                        new Set()
                    );

                }

                sockets
                    .get(id)
                    .add(ws);

                ws.send(
                    JSON.stringify({
                        type:
                            "connected",

                        serviceId:
                            id
                    })
                );

                const history =
                    Array.isArray(
                        service.console
                    )
                        ? service.console.slice(-100)
                        : [];

                for (
                    const entry of history
                ) {

                    ws.send(
                        JSON.stringify({

                            type:
                                "console",

                            data:
                                typeof entry === "string"
                                    ? entry
                                    : entry.text || ""

                        })
                    );

                }

                ws.send(
                    JSON.stringify({

                        type:
                            "status",

                        data:
                            service.powerState ||
                            "offline"

                    })
                );

                ws.on(
                    "close",
                    () => {

                        const clients =
                            sockets.get(id);

                        if (!clients) {
                            return;
                        }

                        clients.delete(
                            ws
                        );

                        if (
                            !clients.size
                        ) {

                            sockets.delete(
                                id
                            );

                        }

                    }
                );

            } catch (error) {

                try {
                    ws.close();
                } catch {}

            }

        }
    );

    return wss;

}

function getRuntimeState(
    serviceId
) {

    const id =
        String(serviceId);

    const child =
        processes.get(id);

    return {

        running:
            Boolean(child),

        pid:
            child?.pid ||
            null

    };

}

module.exports = {

    startMinecraft,

    stopMinecraft,

    restartMinecraft,

    sendCommand,

    getRuntimeState,

    setupWebSocket

};
