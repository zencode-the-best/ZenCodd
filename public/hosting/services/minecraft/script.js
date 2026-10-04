const API = "/api/hosting";

const params =
    new URLSearchParams(
        window.location.search
    );

const serviceId =
    params.get("id");


/* =========================
   API
========================= */

async function api(url, options = {}) {

    const response =
        await fetch(
            url,
            {
                credentials: "include",
                ...options,
                headers: {
                    "Content-Type": "application/json",
                    ...(options.headers || {})
                }
            }
        );

    let data = {};

    try {
        data =
            await response.json();
    } catch {
        data = {};
    }

    if (!response.ok) {
        throw new Error(
            data.error ||
            data.message ||
            `HTTP ${response.status}`
        );
    }

    return data;
}


/* =========================
   HELPERS
========================= */

function getElement(...ids) {

    for (const id of ids) {

        const element =
            document.getElementById(id);

        if (element) {
            return element;
        }
    }

    return null;
}

function escapeHtml(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function normalizeService(data) {

    return (
        data?.service ||
        data?.data ||
        data
    );
}

function getStatus(status) {

    const statuses = {

        provisioning: "Uruchamianie",

        starting: "Uruchamianie",

        ready: "Gotowy",

        running: "Działa",

        online: "Działa",

        stopped: "Wyłączony",

        offline: "Wyłączony",

        suspended: "Zawieszony",

        error: "Błąd"
    };

    const normalized =
        String(status || "")
            .toLowerCase();

    return (
        statuses[normalized] ||
        status ||
        "Nieznany"
    );
}

function showError(message) {

    const element =
        getElement("error");

    if (!element) {

        console.error(message);

        return;
    }

    element.textContent =
        String(message || "Wystąpił błąd.");

    element.style.display =
        "block";
}

function hideError() {

    const element =
        getElement("error");

    if (element) {

        element.style.display =
            "none";
    }
}

function formatDate(value) {

    if (!value) {
        return "—";
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "—";
    }

    return date.toLocaleString(
        "pl-PL",
        {
            dateStyle: "medium",
            timeStyle: "short"
        }
    );
}

function formatDateOnly(value) {

    if (!value) {
        return "—";
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "—";
    }

    return date.toLocaleDateString(
        "pl-PL"
    );
}


/* =========================
   RESOURCES
========================= */

function getResources(service) {

    const packageName =
        String(
            service?.package ||
            ""
        )
        .trim()
        .toLowerCase();

    const packages = {

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

    const fallback =
        packages[packageName] ||
        packages.dirt;

    const backendResources =
        service?.resources &&
        typeof service.resources === "object"
            ? service.resources
            : {};

    return {

        ram:
            service?.ram ||
            backendResources.ram ||
            fallback.ram,

        cpu:
            service?.cpu ||
            backendResources.cpu ||
            fallback.cpu,

        disk:
            service?.disk ||
            backendResources.disk ||
            fallback.disk
    };
}


/* =========================
   PRICE
========================= */

function getPrice(service) {

    if (
        service?.price !== undefined &&
        service?.price !== null
    ) {
        const price =
            Number(service.price);

        if (
            Number.isFinite(price)
        ) {
            return `${price.toFixed(2)} zł`;
        }
    }

    if (
        service?.amount !== undefined &&
        service?.amount !== null
    ) {
        const amount =
            Number(service.amount);

        if (
            Number.isFinite(amount)
        ) {
            return `${amount.toFixed(2)} zł`;
        }
    }

    return "—";
}


/* =========================
   ERROR
========================= */

function renderErrorState(message) {

    const elements = [
        "serverName",
        "serverId",
        "infoPackage",
        "infoDays",
        "infoPrice",
        "infoExpires",
        "detailId",
        "detailCreated",
        "detailStatus"
    ];

    elements.forEach(id => {

        const element =
            document.getElementById(id);

        if (element) {
            element.textContent =
                "—";
        }
    });

    showError(message);
}


/* =========================
   SERVICE
========================= */

async function loadService() {

    hideError();

    if (!serviceId) {

        renderErrorState(
            "Nie podano ID usługi."
        );

        return;
    }

    try {

        const data =
            await api(
                `${API}/service/${encodeURIComponent(serviceId)}`
            );

        const service =
            normalizeService(data);

        if (
            !service ||
            typeof service !== "object"
        ) {

            throw new Error(
                "Backend nie zwrócił danych usługi."
            );
        }

        const serviceType =
            String(
                service.type ||
                service.serviceType ||
                "minecraft"
            )
            .toLowerCase();

        if (
            serviceType &&
            serviceType !== "minecraft"
        ) {

            throw new Error(
                "Ta usługa nie jest usługą Minecraft."
            );
        }

        renderService(service);

    } catch (error) {

        console.error(
            "Minecraft service:",
            error
        );

        renderErrorState(
            error.message ||
            "Nie udało się pobrać usługi."
        );
    }
}


/* =========================
   RENDER SERVICE
========================= */

function renderService(service) {

    const config =
        service.config &&
        typeof service.config === "object"
            ? service.config
            : {};

    const resources =
        getResources(service);

    const serverName =
        service.serverName ||
        service.name ||
        config.serverName ||
        "Serwer Minecraft";

    const packageName =
        service.package ||
        config.package ||
        "—";

    const days =
        service.days ??
        config.days ??
        "—";

    const software =
        service.software ||
        config.software ||
        "Paper";

    const version =
        service.minecraftVersion ||
        service.version ||
        config.minecraftVersion ||
        config.version ||
        "—";

    const status =
        service.status ||
        "provisioning";

    const price =
        getPrice(service);

    const createdAt =
        service.createdAt ||
        service.created ||
        service.created_at ||
        null;

    const expiresAt =
        service.expiresAt ||
        service.expiryDate ||
        service.expires ||
        null;


    /* =========================
       HEADER
    ========================= */

    const nameElement =
        getElement(
            "serverName",
            "serviceName"
        );

    if (nameElement) {

        nameElement.textContent =
            serverName;
    }


    const idElement =
        getElement(
            "serverId"
        );

    if (idElement) {

        idElement.textContent =
            `ID: ${service.id || serviceId}`;
    }


    const statusElement =
        getElement(
            "serverStatus",
            "serviceStatus"
        );

    if (statusElement) {

        statusElement.textContent =
            getStatus(status);

        statusElement.className =
            "status";

        statusElement.classList.add(
            String(status)
                .toLowerCase()
        );
    }


    /* =========================
       INFO CARDS
    ========================= */

    const infoPackage =
        getElement(
            "infoPackage"
        );

    if (infoPackage) {

        infoPackage.textContent =
            packageName;
    }


    const infoDays =
        getElement(
            "infoDays"
        );

    if (infoDays) {

        infoDays.textContent =
            days !== "—"
                ? `${days} dni`
                : "—";
    }


    const infoPrice =
        getElement(
            "infoPrice"
        );

    if (infoPrice) {

        infoPrice.textContent =
            price;
    }


    const infoExpires =
        getElement(
            "infoExpires"
        );

    if (infoExpires) {

        infoExpires.textContent =
            formatDateOnly(
                expiresAt
            );
    }


    /* =========================
       TECHNICAL INFO
    ========================= */

    const detailId =
        getElement(
            "detailId"
        );

    if (detailId) {

        detailId.textContent =
            service.id ||
            serviceId ||
            "—";
    }


    const detailCreated =
        getElement(
            "detailCreated"
        );

    if (detailCreated) {

        detailCreated.textContent =
            formatDate(
                createdAt
            );
    }


    const detailStatus =
        getElement(
            "detailStatus"
        );

    if (detailStatus) {

        detailStatus.textContent =
            getStatus(status);
    }


    /* =========================
       SETTINGS
    ========================= */

    const settingName =
        getElement(
            "settingName"
        );

    if (settingName) {

        settingName.value =
            serverName;
    }


    const settingAddress =
        getElement(
            "settingAddress"
        );

    if (settingAddress) {

        settingAddress.value =
            service.hostname ||
            service.address ||
            (
                service.ipv4 &&
                service.port
                    ? `${service.ipv4}:${service.port}`
                    : ""
            );
    }


    /* =========================
       RUNTIME
    ========================= */

    const versionSelect =
        getElement(
            "minecraftVersion"
        );

    if (versionSelect) {

        versionSelect.value =
            version !== "—"
                ? version
                : "";
    }


    const selectedVersion =
        getElement(
            "selectedVersion"
        );

    if (selectedVersion) {

        selectedVersion.textContent =
            version;
    }


    /* =========================
       SOFTWARE
    ========================= */

    document
        .querySelectorAll(
            "[data-software]"
        )
        .forEach(button => {

            button.classList.toggle(
                "active",
                String(
                    button.dataset.software
                ).toLowerCase() ===
                String(software).toLowerCase()
            );
        });


    /* =========================
       EXTRA RESOURCE INFO
       if these elements exist
    ========================= */

    const ram =
        getElement(
            "ram",
            "serverRam",
            "infoRam",
            "memory"
        );

    if (ram) {

        ram.textContent =
            resources.ram;
    }


    const cpu =
        getElement(
            "cpu",
            "serverCpu",
            "infoCpu",
            "cores"
        );

    if (cpu) {

        cpu.textContent =
            resources.cpu;
    }


    const disk =
        getElement(
            "disk",
            "serverDisk",
            "infoDisk",
            "storage"
        );

    if (disk) {

        disk.textContent =
            resources.disk;
    }


    document.title =
        `${serverName} — ZenityHost`;
}


/* =========================
   STATUS
========================= */

async function loadStatus() {

    if (!serviceId) {
        return;
    }

    try {

        const data =
            await api(
                `${API}/service/${encodeURIComponent(serviceId)}/status`
            );

        const service =
            data.service ||
            {};

        const status =
            data.powerState ||
            data.status ||
            service.powerState ||
            service.status ||
            "offline";

        const statusElement =
            getElement(
                "serverStatus",
                "serviceStatus"
            );

        if (statusElement) {

            statusElement.textContent =
                getStatus(status);

            statusElement.className =
                "status";

            statusElement.classList.add(
                String(status)
                    .toLowerCase()
            );
        }

        const detailStatus =
            getElement(
                "detailStatus"
            );

        if (detailStatus) {

            detailStatus.textContent =
                getStatus(status);
        }

        const startButton =
            getElement(
                "startButton"
            );

        const stopButton =
            getElement(
                "stopButton"
            );

        const restartButton =
            getElement(
                "restartButton"
            );

        const normalized =
            String(status)
                .toLowerCase();

        const running =
            normalized === "running" ||
            normalized === "online";

        const starting =
            normalized === "starting" ||
            normalized === "provisioning";

        const stopped =
            normalized === "stopped" ||
            normalized === "offline";

        if (startButton) {

            startButton.disabled =
                running ||
                starting;
        }

        if (stopButton) {

            stopButton.disabled =
                stopped;
        }

        if (restartButton) {

            restartButton.disabled =
                !running;
        }

    } catch (error) {

        console.error(
            "Minecraft status:",
            error
        );
    }
}


/* =========================
   CONSOLE
========================= */

function normalizeConsole(data) {

    const value =
        data.lines ??
        data.console ??
        data.output ??
        [];

    if (Array.isArray(value)) {

        return value
            .map(entry => {

                if (
                    entry &&
                    typeof entry === "object"
                ) {

                    return (
                        entry.message ||
                        entry.text ||
                        entry.content ||
                        entry.output ||
                        JSON.stringify(entry)
                    );
                }

                return String(entry);
            })
            .join("\n");
    }

    return String(
        value || ""
    );
}

async function loadConsole() {

    if (!serviceId) {
        return;
    }

    try {

        const data =
            await api(
                `${API}/service/${encodeURIComponent(serviceId)}/console`
            );

        const output =
            getElement(
                "consoleOutput",
                "console"
            );

        if (!output) {
            return;
        }

        const text =
            normalizeConsole(data);

        if (text.trim()) {

            output.textContent =
                text;

        } else {

            output.textContent =
                "[ZenityHost] Brak zapisanych logów.";
        }

        output.scrollTop =
            output.scrollHeight;

    } catch (error) {

        console.error(
            "Minecraft console:",
            error
        );
    }
}


/* =========================
   COMMAND
========================= */

async function sendCommand() {

    if (!serviceId) {
        return;
    }

    const input =
        getElement(
            "consoleInput",
            "consoleCommand",
            "command"
        );

    if (!input) {
        return;
    }

    const command =
        input.value.trim();

    if (!command) {
        return;
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

        input.value = "";

        await loadConsole();

    } catch (error) {

        showError(
            error.message ||
            "Nie udało się wykonać komendy."
        );
    }
}


/* =========================
   FILES
========================= */

async function loadFiles() {

    if (!serviceId) {
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

        const container =
            getElement(
                "filesList",
                "files"
            );

        if (!container) {
            return;
        }

        if (!files.length) {

            container.innerHTML =
                `
                <div class="empty">
                    Brak plików.
                </div>
                `;

            return;
        }

        container.innerHTML =
            files
                .map(file => {

                    const name =
                        file.name ||
                        file.path ||
                        "plik";

                    return `
                        <div class="file">
                            ${escapeHtml(name)}
                        </div>
                    `;

                })
                .join("");

    } catch (error) {

        console.error(
            "Minecraft files:",
            error
        );
    }
}


/* =========================
   POWER BUTTONS
========================= */

async function powerCommand(command) {

    console.log("[ZENITY DEBUG] POWER CLICK:", command);
    console.log("[ZENITY DEBUG] SERVICE ID:", serviceId);
    console.log("[ZENITY DEBUG] API URL:", `${API}/service/${encodeURIComponent(serviceId)}/console`);

    if (!serviceId) {
        console.error("[ZENITY DEBUG] BRAK SERVICE ID!");
        return;
    }

    try {

        console.log("[ZENITY DEBUG] WYSYŁAM REQUEST:", command);

        await api(
            `${API}/service/${encodeURIComponent(serviceId)}/console`,
            {
                method: "POST",
                body: JSON.stringify({
                    command
                })
            }
        );

        await loadStatus();
        await loadConsole();

    } catch (error) {

        showError(
            error.message ||
            "Nie udało się wykonać polecenia."
        );
    }
}

function setupPowerButtons() {

    const startButton =
        getElement(
            "startButton"
        );

    if (startButton) {

        startButton.addEventListener(
            "click",
            () => {

                powerCommand(
                    "system: start"
                );
            }
        );
    }


    const stopButton =
        getElement(
            "stopButton"
        );

    if (stopButton) {

        stopButton.addEventListener(
            "click",
            () => {

                powerCommand(
                    "system: stop"
                );
            }
        );
    }


    const restartButton =
        getElement(
            "restartButton"
        );

    if (restartButton) {

        restartButton.addEventListener(
            "click",
            () => {

                powerCommand(
                    "system: restart"
                );
            }
        );
    }
}


/* =========================
   TABS
========================= */

function setupTabs() {

    const tabs =
        document.querySelectorAll(
            ".tab"
        );

    const contents =
        document.querySelectorAll(
            ".tab-content"
        );

    tabs.forEach(tab => {

        tab.addEventListener(
            "click",
            () => {

                const target =
                    tab.dataset.tab;

                tabs.forEach(item => {

                    item.classList.toggle(
                        "active",
                        item === tab
                    );
                });

                contents.forEach(content => {

                    content.classList.toggle(
                        "active",
                        content.id ===
                        `tab-${target}`
                    );
                });

                if (target === "files") {
                    loadFiles();
                }

                if (target === "console") {
                    loadConsole();
                }
            }
        );
    });
}


/* =========================
   CLEAR CONSOLE
========================= */

function setupClearConsole() {

    const button =
        getElement(
            "clearConsole"
        );

    const output =
        getElement(
            "consoleOutput",
            "console"
        );

    if (
        !button ||
        !output
    ) {
        return;
    }

    button.addEventListener(
        "click",
        () => {

            output.textContent =
                "";

        }
    );
}


/* =========================
   CONSOLE FORM
========================= */

function setupConsole() {

    const form =
        getElement(
            "consoleForm"
        );

    const input =
        getElement(
            "consoleInput",
            "consoleCommand",
            "command"
        );

    if (form) {

        form.addEventListener(
            "submit",
            event => {

                event.preventDefault();

                sendCommand();
            }
        );
    }

    if (input) {

        input.addEventListener(
            "keydown",
            event => {

                if (
                    event.key ===
                    "Enter"
                ) {

                    event.preventDefault();

                    sendCommand();
                }
            }
        );
    }
}


/* =========================
   FILE REFRESH
========================= */

function setupFiles() {

    const button =
        getElement(
            "refreshFiles"
        );

    if (button) {

        button.addEventListener(
            "click",
            loadFiles
        );
    }
}


/* =========================
   SETTINGS
========================= */

function setupSettings() {

    const form =
        getElement(
            "settingsForm"
        );

    if (!form) {
        return;
    }

    form.addEventListener(
        "submit",
        event => {

            event.preventDefault();

            showError(
                "Zapisywanie ustawień nie jest jeszcze dostępne."
            );
        }
    );
}


/* =========================
   RUNTIME
========================= */

function setupRuntime() {

    const saveButton =
        getElement(
            "saveRuntime"
        );

    const softwareButtons =
        document.querySelectorAll(
            "[data-software]"
        );

    softwareButtons.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                softwareButtons.forEach(
                    item => {
                        item.classList.remove(
                            "active"
                        );
                    }
                );

                button.classList.add(
                    "active"
                );
            }
        );
    });

    if (saveButton) {

        saveButton.addEventListener(
            "click",
            () => {

                showError(
                    "Zapisywanie konfiguracji nie jest jeszcze dostępne."
                );
            }
        );
    }
}


/* =========================
   INIT
========================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        setupTabs();
        setupPowerButtons();
        setupConsole();
        setupClearConsole();
        setupFiles();
        setupSettings();
        setupRuntime();

        await loadService();

        await Promise.all([
            loadStatus(),
            loadConsole(),
            loadFiles()
        ]);

        setInterval(
            loadStatus,
            5000
        );

        setInterval(
            loadConsole,
            5000
        );
    }
);
