const params = new URLSearchParams(window.location.search);

const serviceId =
    params.get("id") ||
    params.get("serviceId");

const API = "/api/hosting";

let service = null;
let powerState = "offline";

const $ = id => document.getElementById(id);


/* =========================
   HELPERS
========================= */

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function objectToText(value) {

    if (value === null || value === undefined) {
        return "";
    }

    if (typeof value === "string") {
        return value;
    }

    if (
        typeof value === "number" ||
        typeof value === "boolean"
    ) {
        return String(value);
    }

    if (Array.isArray(value)) {
        return value
            .map(item => objectToText(item))
            .filter(Boolean)
            .join(" ");
    }

    if (typeof value === "object") {

        const preferredKeys = [
            "text",
            "message",
            "content",
            "command",
            "output",
            "log",
            "line"
        ];

        for (const key of preferredKeys) {
            if (
                value[key] !== undefined &&
                value[key] !== null
            ) {
                return objectToText(value[key]);
            }
        }

        try {
            return JSON.stringify(value);
        } catch {
            return "";
        }
    }

    return String(value);
}

function showToast(message) {

    const toast = $("toast");

    if (!toast) return;

    toast.textContent = objectToText(message);

    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 2200);
}

function nowTime() {

    return new Date().toLocaleTimeString(
        "pl-PL",
        {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        }
    );
}


/* =========================
   CONSOLE
========================= */

function addConsole(text, type = "info") {

    const consoleBox = $("console");

    if (!consoleBox) return;

    const cleanText =
        objectToText(text);

    if (!cleanText) return;

    const line =
        document.createElement("div");

    line.className =
        `console-line ${type}`;

    const time =
        document.createElement("span");

    time.className = "time";
    time.textContent = `[${nowTime()}]`;

    line.appendChild(time);
    line.appendChild(
        document.createTextNode(` ${cleanText}`)
    );

    consoleBox.appendChild(line);

    consoleBox.scrollTop =
        consoleBox.scrollHeight;
}

function clearConsole() {

    const consoleBox = $("console");

    if (consoleBox) {
        consoleBox.innerHTML = "";
    }
}


/* =========================
   SERVER NAME
========================= */

function slugify(value) {

    return String(value || "serwer")
        .toLowerCase()
        .trim()
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
        .slice(0, 32) || "serwer";
}


/* =========================
   NETWORK
========================= */

function generateNetworkData() {

    if (service?.hostname && service?.ipv4) {

        return {
            hostname: service.hostname,
            ipv4: service.ipv4
        };
    }

    const raw =
        String(service?.id || serviceId || "server");

    let hash = 0;

    for (let i = 0; i < raw.length; i++) {

        hash =
            (hash * 31 + raw.charCodeAt(i)) >>> 0;
    }

    const octet3 =
        10 + (hash % 230);

    const octet4 =
        10 + (
            Math.floor(hash / 230) % 230
        );

    const port =
        service?.port ||
        20000 + (hash % 39999);

    const configuredName =
        service?.serverName ||
        service?.config?.serverName ||
        localStorage.getItem(
            `zenityhost-server-name-${serviceId}`
        ) ||
        "twojserwer";

    const hostname =
        `${slugify(configuredName)}.zenityhost.pl`;

    return {
        hostname,
        ipv4: `185.${octet3}.${octet4}:${port}`
    };
}


/* =========================
   RESOURCES
========================= */

function getServerResources() {

    const packageName =
        String(service?.package || "")
            .toLowerCase();

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

        złoto: {
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
        {
            ram: "2 GB",
            cpu: "1 vCore",
            disk: "25 GB"
        }
    );
}


/* =========================
   POWER STATE
========================= */

function setStatus(status) {

    powerState =
        status || "offline";

    const badge =
        $("statusBadge");

    if (badge) {

        badge.className =
            "status-badge";

        if (powerState === "online") {

            badge.classList.add("online");
            badge.textContent = "ONLINE";

        } else if (
            powerState === "starting"
        ) {

            badge.classList.add("starting");
            badge.textContent = "URUCHAMIANIE";

        } else {

            badge.classList.add("offline");
            badge.textContent = "OFFLINE";
        }
    }

    const startButton =
        $("startButton");

    const restartButton =
        $("restartButton");

    const stopButton =
        $("stopButton");

    if (startButton) {
        startButton.disabled =
            powerState === "online" ||
            powerState === "starting";
    }

    if (restartButton) {
        restartButton.disabled =
            powerState !== "online";
    }

    if (stopButton) {
        stopButton.disabled =
            powerState === "offline" ||
            powerState === "starting";
    }
}

function savePowerState() {

    if (!serviceId) return;

    localStorage.setItem(
        `zenityhost-power-${serviceId}`,
        powerState
    );
}

function loadPowerState() {

    if (!serviceId) {
        return "offline";
    }

    return (
        localStorage.getItem(
            `zenityhost-power-${serviceId}`
        ) ||
        "offline"
    );
}


/* =========================
   LOAD SERVICE
========================= */

async function loadService() {

    if (!serviceId) {

        addConsole(
            "Nie podano ID usługi.",
            "error"
        );

        return;
    }

    try {

        const response =
            await fetch(
                `${API}/service/${encodeURIComponent(serviceId)}`,
                {
                    credentials: "include"
                }
            );

        const data =
            await response.json();

        if (!response.ok) {

            throw new Error(
                data.message ||
                data.error ||
                "Nie udało się pobrać usługi."
            );
        }

        service =
            data.service ||
            data.data ||
            data;

        renderService();

        await loadStatus();
        await loadConsole();
        await loadFiles();

    } catch (error) {

        addConsole(
            error.message ||
            "Błąd podczas ładowania usługi.",
            "error"
        );
    }
}


/* =========================
   RENDER SERVICE
========================= */

function renderService() {

    if (!service) return;

    const network =
        generateNetworkData();

    const resources =
        getServerResources();

    const displayName =
        service.serverName ||
        service.config?.serverName ||
        localStorage.getItem(
            `zenityhost-server-name-${serviceId}`
        ) ||
        "Serwer Minecraft";

    const values = {

        serverName: displayName,

        serverId:
            service.id ||
            serviceId,

        serverHostname:
            network.hostname,

        serverIPv4:
            network.ipv4,

        package:
            service.package ||
            "—",

        days:
            service.days
                ? `${service.days} dni`
                : "—",

        software:
            service.software ||
            service.config?.software ||
            "Paper",

        minecraftVersion:
            service.minecraftVersion ||
            service.config?.minecraftVersion ||
            "—",

        ram:
            resources.ram,

        cpu:
            resources.cpu,

        disk:
            resources.disk
    };

    Object.entries(values).forEach(
        ([id, value]) => {

            const element = $(id);

            if (element) {
                element.textContent =
                    objectToText(value);
            }
        }
    );

    if (service.expiresAt) {

        const expires =
            new Date(service.expiresAt);

        const expiresElement =
            $("expiresAt");

        if (
            expiresElement &&
            !Number.isNaN(expires.getTime())
        ) {

            expiresElement.textContent =
                expires.toLocaleDateString(
                    "pl-PL"
                );
        }
    }

    setStatus(
        service.powerState ||
        service.status === "running"
            ? "online"
            : loadPowerState()
    );
}


/* =========================
   STATUS
========================= */

async function loadStatus() {

    if (!serviceId) return;

    try {

        const response =
            await fetch(
                `${API}/service/${encodeURIComponent(serviceId)}/status`,
                {
                    credentials: "include"
                }
            );

        if (!response.ok) {
            return;
        }

        const data =
            await response.json();

        const backendState =
            data.powerState ||
            data.status;

        if (
            backendState === "online" ||
            backendState === "running"
        ) {

            setStatus("online");
            savePowerState();

        } else if (
            backendState === "starting" ||
            backendState === "provisioning"
        ) {

            setStatus("starting");

        } else {

            setStatus("offline");
        }

    } catch {

        setStatus(
            loadPowerState()
        );
    }
}


/* =========================
   WALLET
========================= */

async function loadWallet() {

    try {

        const response =
            await fetch(
                "/api/wallet",
                {
                    credentials: "include"
                }
            );

        const data =
            await response.json();

        const balance =
            Number(
                data.wallet?.balance ??
                data.balance ??
                0
            );

        const element =
            $("walletBalance");

        if (element) {

            element.textContent =
                `${balance.toFixed(2)} zł`;
        }

    } catch {

        const element =
            $("walletBalance");

        if (element) {
            element.textContent =
                "0.00 zł";
        }
    }
}


/* =========================
   CONSOLE LOAD
========================= */

async function loadConsole() {

    if (!serviceId) return;

    try {

        const response =
            await fetch(
                `${API}/service/${encodeURIComponent(serviceId)}/console`,
                {
                    credentials: "include"
                }
            );

        const data =
            await response.json();

        if (!response.ok) {
            return;
        }

        const entries =
            Array.isArray(data.console)
                ? data.console
                : [];

        clearConsole();

        if (!entries.length) {

            addConsole(
                "ZenityHost Console gotowa.",
                "info"
            );

            addConsole(
                "Serwer jest obecnie wyłączony.",
                "info"
            );

            return;
        }

        entries.forEach(entry => {

            const text =
                objectToText(entry);

            if (text) {
                addConsole(
                    text,
                    "info"
                );
            }
        });

    } catch {

        clearConsole();

        addConsole(
            "ZenityHost Console gotowa.",
            "info"
        );

        addConsole(
            "Serwer jest obecnie wyłączony.",
            "info"
        );
    }
}


/* =========================
   FILES
========================= */

async function loadFiles() {

    const container =
        $("files");

    if (!container) return;

    try {

        const response =
            await fetch(
                `${API}/service/${encodeURIComponent(serviceId)}/files`,
                {
                    credentials: "include"
                }
            );

        const data =
            await response.json();

        const files =
            Array.isArray(data.files)
                ? data.files
                : [];

        container.innerHTML = "";

        if (!files.length) {

            container.innerHTML = `
                <div class="file">
                    <span class="file-icon">DIR</span>
                    <span>
                        Brak plików — serwer zostanie
                        przygotowany po uruchomieniu.
                    </span>
                </div>
            `;

            return;
        }

        files.forEach(file => {

            const row =
                document.createElement("div");

            row.className = "file";

            const icon =
                file.type === "folder"
                    ? "DIR"
                    : "FILE";

            const name =
                file.name ||
                file.path ||
                "plik";

            row.innerHTML = `
                <span class="file-icon">
                    ${icon}
                </span>

                <span>
                    ${escapeHtml(name)}
                </span>
            `;

            container.appendChild(row);
        });

    } catch {

        container.innerHTML = `
            <div class="file">
                <span class="file-icon">
                    DIR
                </span>

                <span>
                    Brak plików
                </span>
            </div>
        `;
    }
}


/* =========================
   BACKEND COMMAND
========================= */

async function sendBackendCommand(command) {

    if (!serviceId) {
        return false;
    }

    try {

        const response =
            await fetch(
                `${API}/service/${encodeURIComponent(serviceId)}/console`,
                {
                    method: "POST",
                    credentials: "include",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        command
                    })
                }
            );

        const data =
            await response.json();

        if (!response.ok) {
            return false;
        }

        if (data.service) {
            service = data.service;
        }

        return true;

    } catch {

        return false;
    }
}


/* =========================
   START
========================= */

async function startServer() {

    if (
        powerState === "online" ||
        powerState === "starting"
    ) {
        return;
    }

    setStatus("starting");

    addConsole(
        "Uruchamianie serwera...",
        "info"
    );

    const success =
        await sendBackendCommand(
            "system: start"
        );

    if (!success) {

        setStatus("offline");

        addConsole(
            "Nie udało się wysłać polecenia do panelu.",
            "error"
        );

        return;
    }

    setTimeout(
        async () => {

            setStatus("online");

            savePowerState();

            addConsole(
                "Serwer został uruchomiony.",
                "success"
            );

            addConsole(
                `Minecraft ${
                    service?.minecraftVersion ||
                    service?.config?.minecraftVersion ||
                    "1.21.8"
                } wystartował.`,
                "success"
            );

            const network =
                generateNetworkData();

            addConsole(
                `IP: ${network.hostname}`,
                "info"
            );

            addConsole(
                `IPv4: ${network.ipv4}`,
                "info"
            );

            await sendBackendCommand(
                "system: online"
            );

            await loadStatus();

        },
        1800
    );
}


/* =========================
   STOP
========================= */

async function stopServer() {

    if (powerState === "offline") {
        return;
    }

    addConsole(
        "Zatrzymywanie serwera...",
        "info"
    );

    const success =
        await sendBackendCommand(
            "system: stop"
        );

    if (!success) {

        addConsole(
            "Nie udało się zatrzymać serwera.",
            "error"
        );

        return;
    }

    setTimeout(
        async () => {

            setStatus("offline");

            savePowerState();

            addConsole(
                "Serwer został wyłączony.",
                "success"
            );

            await sendBackendCommand(
                "system: offline"
            );

            await loadStatus();

        },
        1000
    );
}


/* =========================
   RESTART
========================= */

async function restartServer() {

    if (powerState !== "online") {
        return;
    }

    addConsole(
        "Restartowanie serwera...",
        "info"
    );

    const success =
        await sendBackendCommand(
            "system: restart"
        );

    if (!success) {

        addConsole(
            "Nie udało się zrestartować serwera.",
            "error"
        );

        return;
    }

    setStatus("starting");

    setTimeout(
        async () => {

            setStatus("online");

            savePowerState();

            addConsole(
                "Serwer został ponownie uruchomiony.",
                "success"
            );

            await sendBackendCommand(
                "system: online"
            );

            await loadStatus();

        },
        1800
    );
}


/* =========================
   COMMAND
========================= */

async function sendCommand(event) {

    event.preventDefault();

    const input =
        $("commandInput");

    if (!input) return;

    const command =
        input.value.trim();

    if (!command) {
        return;
    }

    addConsole(
        `> ${command}`,
        "command"
    );

    input.value = "";

    if (powerState !== "online") {

        addConsole(
            "Nie można wykonać komendy — serwer jest wyłączony.",
            "error"
        );

        return;
    }

    await sendBackendCommand(
        command
    );

    if (command === "help") {

        addConsole(
            "Dostępne komendy: help, list, stop, restart, say <tekst>",
            "info"
        );

    } else if (command === "list") {

        addConsole(
            "There are 0 of a max of 20 players online.",
            "info"
        );

    } else if (command === "stop") {

        await stopServer();

    } else if (command === "restart") {

        await restartServer();

    } else if (
        command.startsWith("say ")
    ) {

        addConsole(
            `[Server] ${command.slice(4)}`,
            "success"
        );

    } else {

        addConsole(
            `Wykonano: ${command}`,
            "success"
        );
    }
}


/* =========================
   COPY
========================= */

async function copyText(elementId) {

    const element =
        $(elementId);

    if (!element) {
        return;
    }

    const value =
        element.textContent.trim();

    try {

        await navigator.clipboard.writeText(
            value
        );

        showToast(
            "Skopiowano!"
        );

    } catch {

        showToast(
            "Nie udało się skopiować."
        );
    }
}


/* =========================
   EVENTS
========================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        await loadService();

        await loadWallet();

        setInterval(
            loadWallet,
            30000
        );

        setInterval(
            loadStatus,
            10000
        );
    }
);
