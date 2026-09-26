const params = new URLSearchParams(window.location.search);

const serviceId =
    params.get("id") ||
    params.get("serviceId");

const API = "/api/hosting";

let service = null;
let powerState = "offline";
let socket = null;

const $ = id => document.getElementById(id);


/* =========================
   HELPERS
========================= */

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
            .map(objectToText)
            .filter(Boolean)
            .join(" ");
    }

    if (typeof value === "object") {

        const keys = [
            "text",
            "message",
            "content",
            "output",
            "line",
            "log",
            "command",
            "error"
        ];

        for (const key of keys) {

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

function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
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

function showToast(message) {

    const toast = $("toast");

    if (!toast) return;

    toast.textContent = objectToText(message);
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 2200);
}


/* =========================
   API
========================= */

async function api(url, options = {}) {

    const response = await fetch(url, {
        credentials: "include",
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
    });

    let data = {};

    try {
        data = await response.json();
    } catch {
        data = {};
    }

    if (!response.ok) {

        throw new Error(
            objectToText(
                data.error ||
                data.message ||
                `HTTP ${response.status}`
            )
        );
    }

    return data;
}


/* =========================
   CONSOLE
========================= */

function clearConsole() {

    const box = $("console");

    if (box) {
        box.innerHTML = "";
    }
}

function addConsole(text, type = "info", createdAt = null) {

    const box = $("console");

    if (!box) return;

    const clean = objectToText(text);

    if (!clean) return;

    const line = document.createElement("div");

    line.className = `console-line ${type}`;

    const time = document.createElement("span");

    time.className = "time";

    let displayTime = nowTime();

    if (createdAt) {

        const date = new Date(createdAt);

        if (!Number.isNaN(date.getTime())) {

            displayTime =
                date.toLocaleTimeString(
                    "pl-PL",
                    {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit"
                    }
                );
        }
    }

    time.textContent = `[${displayTime}]`;

    line.appendChild(time);

    line.appendChild(
        document.createTextNode(` ${clean}`)
    );

    box.appendChild(line);

    box.scrollTop = box.scrollHeight;
}

function renderConsoleEntry(entry) {

    if (entry === null || entry === undefined) {
        return;
    }

    if (typeof entry === "object") {

        const text =
            objectToText(entry);

        const type =
            entry.type ||
            "info";

        const createdAt =
            entry.createdAt ||
            entry.timestamp ||
            null;

        addConsole(
            text,
            type,
            createdAt
        );

        return;
    }

    addConsole(
        entry,
        "info"
    );
}

async function loadConsole() {

    if (!serviceId) return;

    try {

        const data =
            await api(
                `${API}/service/${encodeURIComponent(serviceId)}/console`
            );

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
                "Brak zapisanych logów serwera.",
                "info"
            );

            return;
        }

        entries.forEach(
            renderConsoleEntry
        );

    } catch (error) {

        clearConsole();

        addConsole(
            "Nie udało się pobrać konsoli.",
            "error"
        );

        addConsole(
            error.message,
            "error"
        );
    }
}


/* =========================
   SERVICE
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

        const data =
            await api(
                `${API}/service/${encodeURIComponent(serviceId)}`
            );

        service =
            data.service ||
            data.data ||
            data;

        renderService();

        await Promise.all([
            loadStatus(),
            loadConsole(),
            loadFiles(),
            loadWallet()
        ]);

        connectWebSocket();

    } catch (error) {

        addConsole(
            error.message ||
            "Nie udało się pobrać usługi.",
            "error"
        );
    }
}


/* =========================
   NETWORK
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
        .slice(0, 32) ||
        "serwer";
}

function generateNetworkData() {

    const hostname =
        service?.hostname ||
        `${slugify(
            service?.serverName ||
            service?.name ||
            "serwer"
        )}.zenityhost.pl`;

    const ipv4 =
        service?.ipv4 ||
        "—";

    return {
        hostname,
        ipv4
    };
}


/* =========================
   RESOURCES
========================= */

function getServerResources() {

    const packageName =
        String(
            service?.package ||
            ""
        ).toLowerCase();

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
   SERVICE RENDER
========================= */

function renderService() {

    if (!service) return;

    const network =
        generateNetworkData();

    const resources =
        getServerResources();

    const values = {

        serverName:
            service.serverName ||
            service.name ||
            "Serwer Minecraft",

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
            service.ram ||
            resources.ram,

        cpu:
            service.cpu ||
            resources.cpu,

        disk:
            service.disk ||
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

    const expires =
        $("expiresAt");

    if (expires) {

        if (service.expiresAt) {

            const date =
                new Date(service.expiresAt);

            if (!Number.isNaN(date.getTime())) {

                expires.textContent =
                    date.toLocaleDateString(
                        "pl-PL"
                    );
            }
        } else {
            expires.textContent = "—";
        }
    }
}


/* =========================
   STATUS
========================= */

function setStatus(status) {

    const normalized =
        String(status || "offline")
            .toLowerCase();

    if (
        normalized === "running" ||
        normalized === "online"
    ) {
        powerState = "online";
    } else if (
        normalized === "starting" ||
        normalized === "provisioning"
    ) {
        powerState = "starting";
    } else {
        powerState = "offline";
    }

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

    const start =
        $("startButton");

    const restart =
        $("restartButton");

    const stop =
        $("stopButton");

    if (start) {

        start.disabled =
            powerState === "online" ||
            powerState === "starting";
    }

    if (restart) {

        restart.disabled =
            powerState !== "online";
    }

    if (stop) {

        stop.disabled =
            powerState === "offline";
    }
}

async function loadStatus() {

    if (!serviceId) return;

    try {

        const data =
            await api(
                `${API}/service/${encodeURIComponent(serviceId)}/status`
            );

        const status =
            data.powerState ||
            data.status ||
            data.service?.status ||
            "offline";

        setStatus(status);

    } catch (error) {

        console.error(
            "Status:",
            error
        );
    }
}


/* =========================
   WALLET
========================= */

async function loadWallet() {

    const element =
        $("walletBalance");

    if (!element) return;

    try {

        const data =
            await api("/api/wallet");

        const balance =
            Number(
                data.wallet?.balance ??
                data.balance ??
                0
            );

        element.textContent =
            `${balance.toFixed(2)} zł`;

    } catch {

        element.textContent =
            "—";
    }
}


/* =========================
   FILES
========================= */

async function loadFiles() {

    const container =
        $("files");

    if (!container || !serviceId) {
        return;
    }

    try {

        const data =
            await api(
                `${API}/service/${encodeURIComponent(serviceId)}/files`
            );

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
                        Brak plików — uruchom serwer,
                        aby przygotować pliki.
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

            row.innerHTML = `
                <span class="file-icon">
                    ${icon}
                </span>

                <span>
                    ${escapeHtml(
                        file.name ||
                        file.path ||
                        "plik"
                    )}
                </span>
            `;

            container.appendChild(row);
        });

    } catch (error) {

        container.innerHTML = `
            <div class="file">
                <span class="file-icon">DIR</span>
                <span>Nie udało się pobrać plików.</span>
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

        await api(
            `${API}/service/${encodeURIComponent(serviceId)}/console`,
            {
                method: "POST",
                body: JSON.stringify({
                    command
                })
            }
        );

        return true;

    } catch (error) {

        addConsole(
            error.message ||
            "Błąd wykonywania polecenia.",
            "error"
        );

        return false;
    }
}


/* =========================
   POWER
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
        "Wysyłanie polecenia uruchomienia...",
        "info"
    );

    const success =
        await sendBackendCommand(
            "system: start"
        );

    if (!success) {

        await loadStatus();

        return;
    }

    addConsole(
        "Polecenie zostało przekazane do serwera.",
        "success"
    );

    setTimeout(
        loadStatus,
        1000
    );
}

async function stopServer() {

    if (
        powerState === "offline"
    ) {
        return;
    }

    addConsole(
        "Wysyłanie polecenia zatrzymania...",
        "info"
    );

    const success =
        await sendBackendCommand(
            "system: stop"
        );

    if (!success) {
        await loadStatus();
        return;
    }

    addConsole(
        "Polecenie zatrzymania zostało przekazane.",
        "success"
    );

    setTimeout(
        loadStatus,
        1000
    );
}

async function restartServer() {

    if (
        powerState !== "online"
    ) {
        return;
    }

    addConsole(
        "Wysyłanie polecenia restartu...",
        "info"
    );

    const success =
        await sendBackendCommand(
            "system: restart"
        );

    if (!success) {
        await loadStatus();
        return;
    }

    setStatus("starting");

    addConsole(
        "Restart został rozpoczęty.",
        "success"
    );

    setTimeout(
        loadStatus,
        1000
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

    if (!command) return;

    if (
        powerState !== "online"
    ) {

        addConsole(
            "Nie można wykonać komendy — serwer jest wyłączony.",
            "error"
        );

        return;
    }

    addConsole(
        `> ${command}`,
        "command"
    );

    input.value = "";

    await sendBackendCommand(
        command
    );
}


/* =========================
   WEBSOCKET
========================= */

function connectWebSocket() {

    if (!serviceId) return;

    if (
        socket &&
        (
            socket.readyState === WebSocket.OPEN ||
            socket.readyState === WebSocket.CONNECTING
        )
    ) {
        return;
    }

    const protocol =
        window.location.protocol === "https:"
            ? "wss:"
            : "ws:";

    socket =
        new WebSocket(
            `${protocol}//${window.location.host}/ws/minecraft?service=${encodeURIComponent(serviceId)}`
        );

    socket.addEventListener(
        "open",
        () => {

            addConsole(
                "Połączono z konsolą na żywo.",
                "success"
            );
        }
    );

    socket.addEventListener(
        "message",
        event => {

            try {

                const data =
                    JSON.parse(event.data);

                if (
                    data.type === "console"
                ) {

                    renderConsoleEntry(
                        data.entry
                    );

                    return;
                }

                if (
                    data.type === "status"
                ) {

                    setStatus(
                        data.status
                    );

                    return;
                }

                if (
                    data.type === "error"
                ) {

                    addConsole(
                        data.message ||
                        data.error,
                        "error"
                    );
                }

            } catch {

                addConsole(
                    event.data,
                    "info"
                );
            }
        }
    );

    socket.addEventListener(
        "close",
        () => {

            setTimeout(
                connectWebSocket,
                5000
            );
        }
    );
}


/* =========================
   COPY
========================= */

async function copyText(elementId) {

    const element =
        $(elementId);

    if (!element) return;

    const value =
        element.textContent.trim();

    if (
        !value ||
        value === "—"
    ) {
        return;
    }

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
   START
========================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        if (!serviceId) {

            addConsole(
                "Brak ID usługi w adresie.",
                "error"
            );

            return;
        }

        await loadService();

        setInterval(
            loadStatus,
            3000
        );

        setInterval(
            loadConsole,
            5000
        );
    }
);
