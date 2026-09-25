const params = new URLSearchParams(
    window.location.search
);

const serviceId =
    params.get("id") ||
    params.get("serviceId");

const API = "/api/hosting";

let service = null;
let powerState = "offline";

const $ = id =>
    document.getElementById(id);


function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


function showToast(message) {

    const toast = $("toast");

    toast.textContent = message;
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


function addConsole(
    text,
    type = "info"
) {

    const consoleBox = $("console");

    const line =
        document.createElement("div");

    line.className =
        `console-line ${type}`;

    line.innerHTML =
        `<span class="time">[${nowTime()}]</span> ${escapeHtml(text)}`;

    consoleBox.appendChild(line);

    consoleBox.scrollTop =
        consoleBox.scrollHeight;

}


function clearConsole() {

    $("console").innerHTML = "";

}


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


function generateNetworkData() {

    const raw =
        String(
            service?.id ||
            serviceId ||
            "server"
        );

    let hash = 0;

    for (
        let i = 0;
        i < raw.length;
        i++
    ) {

        hash =
            (
                hash * 31 +
                raw.charCodeAt(i)
            ) >>> 0;

    }

    const octet3 =
        10 + (hash % 230);

    const octet4 =
        10 + (
            Math.floor(hash / 230) %
            230
        );

    const port =
        20000 +
        (
            hash %
            39999
        );

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

        ipv4:
            `185.${octet3}.${octet4}:${port}`

    };

}


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


function setStatus(status) {

    powerState = status;

    const badge =
        $("statusBadge");

    badge.className =
        "status-badge";

    if (status === "online") {

        badge.classList.add("online");
        badge.textContent = "ONLINE";

    } else if (status === "starting") {

        badge.classList.add("starting");
        badge.textContent = "URUCHAMIANIE";

    } else {

        badge.classList.add("offline");
        badge.textContent = "OFFLINE";

    }


    $("startButton").disabled =
        status === "online" ||
        status === "starting";

    $("restartButton").disabled =
        status !== "online";

    $("stopButton").disabled =
        status === "offline" ||
        status === "starting";

}


function savePowerState() {

    if (!serviceId) {
        return;
    }

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


function renderService() {

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


    $("serverName").textContent =
        displayName;

    $("serverId").textContent =
        service.id ||
        serviceId;

    $("serverHostname").textContent =
        network.hostname;

    $("serverIPv4").textContent =
        network.ipv4;


    $("package").textContent =
        service.package ||
        "—";

    $("days").textContent =
        service.days
            ? `${service.days} dni`
            : "—";

    $("software").textContent =
        service.software ||
        "Paper";

    $("minecraftVersion").textContent =
        service.minecraftVersion ||
        "—";

    $("ram").textContent =
        resources.ram;

    $("cpu").textContent =
        resources.cpu;

    $("disk").textContent =
        resources.disk;


    if (service.expiresAt) {

        const date =
            new Date(
                service.expiresAt
            );

        $("expiresAt").textContent =
            date.toLocaleDateString(
                "pl-PL"
            );

    }


    const saved =
        loadPowerState();

    setStatus(saved);


    if (
        service.status ===
        "provisioning"
    ) {

        setStatus("starting");

        setTimeout(() => {

            setStatus(
                loadPowerState() ===
                "online"
                    ? "online"
                    : "offline"
            );

        }, 2500);

    }

}


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

        $("walletBalance").textContent =
            `${balance.toFixed(2)} zł`;

    } catch {

        $("walletBalance").textContent =
            "0.00 zł";

    }

}


async function loadConsole() {

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
            data.console ||
            [];

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

            addConsole(
                entry.text ||
                entry.command ||
                "",
                "info"
            );

        });

    } catch {

        clearConsole();

        addConsole(
            "ZenityHost Console gotowa.",
            "info"
        );

    }

}


async function loadFiles() {

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
            data.files ||
            [];

        const container =
            $("files");

        container.innerHTML = "";

        if (!files.length) {

            container.innerHTML =
                `<div class="file">
                    <span class="file-icon">📁</span>
                    <span>Brak plików — serwer zostanie przygotowany po uruchomieniu.</span>
                </div>`;

            return;

        }

        files.forEach(file => {

            const row =
                document.createElement("div");

            row.className =
                "file";

            row.innerHTML =
                `
                <span class="file-icon">
                    ${file.type === "folder" ? "📁" : "📄"}
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

    } catch {

        $("files").innerHTML =
            `<div class="file">
                <span class="file-icon">📁</span>
                <span>Brak plików</span>
            </div>`;

    }

}


async function sendBackendCommand(command) {

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
                    body:
                        JSON.stringify({
                            command
                        })
                }
            );

        const data =
            await response.json();

        if (!response.ok) {
            return false;
        }

        return true;

    } catch {

        return false;

    }

}


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

    await sendBackendCommand(
        "system: start"
    );

    setTimeout(async () => {

        setStatus("online");

        savePowerState();

        addConsole(
            "Serwer został uruchomiony.",
            "success"
        );

        addConsole(
            `Minecraft ${service?.minecraftVersion || "1.21.8"} wystartował.`,
            "success"
        );

        addConsole(
            `IP: ${generateNetworkData().hostname}`,
            "info"
        );

        addConsole(
            `IPv4: ${generateNetworkData().ipv4}`,
            "info"
        );

        await sendBackendCommand(
            "system: online"
        );

    }, 1800);

}


async function stopServer() {

    if (
        powerState === "offline"
    ) {
        return;
    }

    addConsole(
        "Zatrzymywanie serwera...",
        "info"
    );

    await sendBackendCommand(
        "system: stop"
    );

    setTimeout(async () => {

        setStatus("offline");

        savePowerState();

        addConsole(
            "Serwer został wyłączony.",
            "success"
        );

        await sendBackendCommand(
            "system: offline"
        );

    }, 1000);

}


async function restartServer() {

    if (
        powerState !== "online"
    ) {
        return;
    }

    addConsole(
        "Restartowanie serwera...",
        "info"
    );

    await sendBackendCommand(
        "system: restart"
    );

    setStatus("starting");

    setTimeout(async () => {

        setStatus("online");

        savePowerState();

        addConsole(
            "Serwer został ponownie uruchomiony.",
            "success"
        );

        await sendBackendCommand(
            "system: online"
        );

    }, 1800);

}


async function sendCommand(event) {

    event.preventDefault();

    const input =
        $("commandInput");

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

    if (
        powerState !== "online"
    ) {

        addConsole(
            "Nie można wykonać komendy — serwer jest wyłączony.",
            "error"
        );

        return;

    }

    await sendBackendCommand(
        command
    );

    if (
        command === "help"
    ) {

        addConsole(
            "Dostępne komendy: help, list, stop, restart, say <tekst>",
            "info"
        );

    } else if (
        command === "list"
    ) {

        addConsole(
            "There are 0 of a max of 20 players online.",
            "info"
        );

    } else if (
        command === "stop"
    ) {

        await stopServer();

    } else if (
        command === "restart"
    ) {

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


async function copyText(elementId) {

    const element =
        $(elementId);

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


document.addEventListener(
    "DOMContentLoaded",
    async () => {

        await loadService();

        await loadWallet();

        setInterval(
            loadWallet,
            30000
        );

    }
);
