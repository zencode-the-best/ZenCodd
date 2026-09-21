const API = "/api/hosting";

const params = new URLSearchParams(window.location.search);
const serviceId = params.get("id");

let service = null;
let options = null;
let statusTimer = null;

const $ = (id) => document.getElementById(id);


document.addEventListener("DOMContentLoaded", async () => {

    if (!serviceId) {
        showToast("Brak ID usługi.", "error");
        setServerName("Brak usługi");
        return;
    }

    setupTabs();
    setupConsole();
    setupSettings();
    setupRuntime();
    setupButtons();

    await loadWallet();
    await loadOptions();
    await loadService();

    statusTimer = setInterval(loadServiceStatus, 2000);

});


async function api(url, options = {}) {

    const response = await fetch(url, {
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        },
        ...options
    });

    let data = null;

    try {
        data = await response.json();
    } catch {
        data = {};
    }

    if (!response.ok) {
        throw new Error(
            data.error ||
            data.message ||
            `Błąd HTTP ${response.status}`
        );
    }

    return data;
}


async function loadWallet() {

    try {

        const data = await api("/api/wallet");

        if (data && typeof data.balance !== "undefined") {
            $("walletBalance").textContent =
                `${Number(data.balance).toFixed(2)} zł`;
        }

    } catch (error) {

        $("walletBalance").textContent = "—";

    }

}


async function loadOptions() {

    try {

        options = await api(`${API}/minecraft/options`);

        renderVersions();

    } catch (error) {

        console.error(error);

        $("minecraftVersion").innerHTML =
            `<option value="">Nie udało się pobrać wersji</option>`;

    }

}


function renderVersions() {

    const select = $("minecraftVersion");

    if (!options) {
        return;
    }

    let versions = [];

    const software =
        service?.config?.software ||
        "paper";

    if (Array.isArray(options.versions)) {

        versions = options.versions;

    } else if (options.versions?.[software]) {

        versions = options.versions[software];

    }

    if (!versions.length) {

        select.innerHTML =
            `<option value="">Brak dostępnych wersji</option>`;

        return;

    }

    select.innerHTML = versions
        .map(version =>
            `<option value="${escapeHtml(version)}">
                ${escapeHtml(version)}
            </option>`
        )
        .join("");

    const selected =
        service?.config?.version ||
        versions[0];

    if (versions.includes(selected)) {
        select.value = selected;
    }

    updateSelectedVersion();

}


async function loadService() {

    try {

        service = await api(
            `${API}/service/${encodeURIComponent(serviceId)}`
        );

        renderService();

        await loadFiles();

    } catch (error) {

        console.error(error);

        showToast(
            error.message || "Nie udało się pobrać usługi.",
            "error"
        );

        setServerName("Nie udało się załadować");

    }

}


function renderService() {

    if (!service) {
        return;
    }

    setServerName(
        service.name ||
        service.package ||
        "Serwer Minecraft"
    );

    $("serverId").textContent =
        `ID: ${service.id || serviceId}`;

    renderStatus(service.status);

    $("infoPackage").textContent =
        service.package || "—";

    $("infoDays").textContent =
        service.days ? `${service.days} dni` : "—";

    $("infoPrice").textContent =
        typeof service.price === "number"
            ? `${service.price.toFixed(2)} zł`
            : "—";

    $("infoExpires").textContent =
        formatDate(service.expiresAt);

    $("detailId").textContent =
        service.id || serviceId;

    $("detailCreated").textContent =
        formatDate(service.createdAt);

    $("detailStatus").textContent =
        translateStatus(service.status);

    $("settingName").value =
        service.name || "";

    if (service.address) {
        $("settingAddress").value = service.address;
    }

    const config = service.config || {};

    $("gameMode").value =
        config.gameMode || "survival";

    $("maxPlayers").value =
        config.maxPlayers || 20;

    $("pvp").checked =
        config.pvp !== false;

    setSoftware(
        config.software || "paper",
        false
    );

    renderVersions();

}


async function loadServiceStatus() {

    if (!serviceId) {
        return;
    }

    try {

        const data = await api(
            `${API}/service/${encodeURIComponent(serviceId)}/status`
        );

        const newStatus =
            data.status ||
            data.service?.status;

        if (newStatus) {

            if (service) {
                service.status = newStatus;
            }

            renderStatus(newStatus);

            if (service) {
                service.status = newStatus;
            }

        }

        if (data.service) {

            service = {
                ...service,
                ...data.service
            };

            renderService();

        }

    } catch (error) {

        console.warn(
            "Nie udało się odświeżyć statusu:",
            error.message
        );

    }

}


function renderStatus(status) {

    const element = $("serverStatus");
    const provisioning = $("provisioningBox");

    element.className = "status";

    const normalized =
        String(status || "")
            .toLowerCase();

    if (
        normalized === "ready" ||
        normalized === "running"
    ) {

        element.classList.add("ready");
        element.textContent = "Gotowy";

        provisioning.classList.add("hidden");

        $("startButton").disabled = false;
        $("stopButton").disabled = false;
        $("restartButton").disabled = false;

        return;

    }

    if (
        normalized === "stopped" ||
        normalized === "offline"
    ) {

        element.classList.add("stopped");
        element.textContent = "Zatrzymany";

        provisioning.classList.add("hidden");

        $("startButton").disabled = false;
        $("stopButton").disabled = true;
        $("restartButton").disabled = false;

        return;

    }

    if (
        normalized === "error" ||
        normalized === "failed"
    ) {

        element.classList.add("error");
        element.textContent = "Błąd";

        provisioning.classList.add("hidden");

        $("startButton").disabled = true;
        $("stopButton").disabled = true;
        $("restartButton").disabled = true;

        return;

    }

    element.classList.add("provisioning");
    element.textContent = "Przygotowywanie...";

    provisioning.classList.remove("hidden");

    $("startButton").disabled = true;
    $("stopButton").disabled = true;
    $("restartButton").disabled = true;

    updateProvisioningCountdown();

}


function updateProvisioningCountdown() {

    if (!service || !service.readyAt) {
        $("provisioningTime").textContent = "chwila";
        return;
    }

    const update = () => {

        const remaining =
            new Date(service.readyAt).getTime() -
            Date.now();

        if (remaining <= 0) {

            $("provisioningTime").textContent =
                "gotowe";

            return;

        }

        const seconds =
            Math.ceil(remaining / 1000);

        $("provisioningTime").textContent =
            `${seconds}s`;

    };

    update();

}


function setupTabs() {

    document.querySelectorAll(".tab").forEach(button => {

        button.addEventListener("click", () => {

            const tab = button.dataset.tab;

            document.querySelectorAll(".tab")
                .forEach(item =>
                    item.classList.remove("active")
                );

            document.querySelectorAll(".tab-content")
                .forEach(item =>
                    item.classList.remove("active")
                );

            button.classList.add("active");

            const content =
                document.getElementById(`tab-${tab}`);

            if (content) {
                content.classList.add("active");
            }

        });

    });

}


function setupConsole() {

    $("consoleForm").addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            const input = $("consoleInput");
            const command = input.value.trim();

            if (!command) {
                return;
            }

            input.value = "";

            addConsoleLine(
                `> ${command}`,
                "command"
            );

            try {

                const data = await api(
                    `${API}/service/${encodeURIComponent(serviceId)}/console`,
                    {
                        method: "POST",
                        body: JSON.stringify({
                            command
                        })
                    }
                );

                if (data.message) {

                    addConsoleLine(
                        data.message,
                        "system"
                    );

                } else {

                    addConsoleLine(
                        "Komenda została zapisana w panelu.",
                        "success"
                    );

                }

            } catch (error) {

                addConsoleLine(
                    `Błąd: ${error.message}`,
                    "error"
                );

            }

        }
    );


    $("clearConsole").addEventListener(
        "click",
        () => {

            $("consoleOutput").innerHTML = "";

            addConsoleLine(
                "[ZenityHost] Konsola wyczyszczona.",
                "system"
            );

        }
    );


    loadConsole();

}


async function loadConsole() {

    try {

        const data = await api(
            `${API}/service/${encodeURIComponent(serviceId)}/console`
        );

        const lines =
            Array.isArray(data.lines)
                ? data.lines
                : Array.isArray(data.console)
                    ? data.console
                    : [];

        if (!lines.length) {
            return;
        }

        $("consoleOutput").innerHTML = "";

        lines.forEach(line => {

            if (typeof line === "string") {

                addConsoleLine(
                    line,
                    "system"
                );

            } else {

                addConsoleLine(
                    line.message ||
                    line.command ||
                    JSON.stringify(line),
                    line.type || "system"
                );

            }

        });

    } catch (error) {

        console.warn(
            "Konsola:",
            error.message
        );

    }

}


function addConsoleLine(text, type = "system") {

    const output = $("consoleOutput");

    const line =
        document.createElement("div");

    line.className =
        `console-line ${type}`;

    line.textContent = text;

    output.appendChild(line);

    output.scrollTop =
        output.scrollHeight;

}


async function loadFiles() {

    const list = $("filesList");

    list.innerHTML =
        `<div class="file-loading">
            Ładowanie plików...
        </div>`;

    try {

        const data = await api(
            `${API}/service/${encodeURIComponent(serviceId)}/files`
        );

        const files =
            Array.isArray(data.files)
                ? data.files
                : [];

        if (!files.length) {

            list.innerHTML =
                `<div class="file-loading">
                    Brak plików do wyświetlenia.
                </div>`;

            return;

        }

        list.innerHTML =
            files
                .map(file => renderFile(file))
                .join("");

    } catch (error) {

        list.innerHTML =
            `<div class="file-loading">
                Nie udało się pobrać plików.
            </div>`;

    }

}


function renderFile(file) {

    const name =
        typeof file === "string"
            ? file
            : file.name || file.path || "plik";

    const type =
        typeof file === "string"
            ? "file"
            : file.type || "file";

    const icon =
        type === "directory" ||
        type === "folder"
            ? "▰"
            : "▱";

    return `
        <div class="file-row">

            <div class="file-icon">
                ${icon}
            </div>

            <div class="file-info">

                <div class="file-name">
                    ${escapeHtml(name)}
                </div>

                <div class="file-meta">
                    ${type === "directory" ? "Folder" : "Plik"}
                </div>

            </div>

        </div>
    `;

}


function setupSettings() {

    $("settingsForm").addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            await saveSettings();

        }
    );

}


async function saveSettings() {

    if (!serviceId) {
        return;
    }

    const config = {
        ...(service?.config || {}),
        gameMode: $("gameMode").value,
        maxPlayers: Number($("maxPlayers").value) || 20,
        pvp: $("pvp").checked
    };

    try {

        await api(
            `${API}/service/${encodeURIComponent(serviceId)}`,
            {
                method: "PATCH",
                body: JSON.stringify({
                    name: $("settingName").value.trim(),
                    config
                })
            }
        );

        if (service) {

            service.name =
                $("settingName").value.trim();

            service.config = config;

        }

        renderService();

        showToast(
            "Ustawienia zostały zapisane.",
            "success"
        );

    } catch (error) {

        showToast(
            error.message,
            "error"
        );

    }

}


function setupRuntime() {

    document.querySelectorAll(
        ".software-card"
    ).forEach(card => {

        card.addEventListener(
            "click",
            () => {

                setSoftware(
                    card.dataset.software,
                    true
                );

            }
        );

    });


    $("minecraftVersion").addEventListener(
        "change",
        updateSelectedVersion
    );


    $("saveRuntime").addEventListener(
        "click",
        saveRuntime
    );

}


function setSoftware(software, rerender = true) {

    document.querySelectorAll(
        ".software-card"
    ).forEach(card => {

        card.classList.toggle(
            "active",
            card.dataset.software === software
        );

    });

    if (rerender) {

        if (!service) {
            service = {
                config: {}
            };
        }

        service.config = {
            ...(service.config || {}),
            software
        };

        renderVersions();

    }

}


function updateSelectedVersion() {

    $("selectedVersion").textContent =
        $("minecraftVersion").value || "—";

}


async function saveRuntime() {

    const software =
        document.querySelector(
            ".software-card.active"
        )?.dataset.software || "paper";

    const version =
        $("minecraftVersion").value;

    if (!version) {

        showToast(
            "Wybierz wersję Minecraft.",
            "error"
        );

        return;

    }

    try {

        const config = {
            ...(service?.config || {}),
            software,
            version
        };

        await api(
            `${API}/service/${encodeURIComponent(serviceId)}`,
            {
                method: "PATCH",
                body: JSON.stringify({
                    config
                })
            }
        );

        if (service) {
            service.config = config;
        }

        showToast(
            `${software} ${version} zostało zapisane.`,
            "success"
        );

    } catch (error) {

        showToast(
            error.message,
            "error"
        );

    }

}


function setupButtons() {

    $("startButton").addEventListener(
        "click",
        () => {

            showToast(
                "Uruchamianie zostanie wykonane przez backend serwera.",
                "success"
            );

        }
    );


    $("stopButton").addEventListener(
        "click",
        () => {

            showToast(
                "Zatrzymywanie zostanie wykonane przez backend serwera.",
                "success"
            );

        }
    );


    $("restartButton").addEventListener(
        "click",
        () => {

            showToast(
                "Restart zostanie wykonany przez backend serwera.",
                "success"
            );

        }
    );


    $("refreshFiles").addEventListener(
        "click",
        loadFiles
    );

}


function setServerName(name) {

    $("serverName").textContent =
        name || "Serwer Minecraft";

    document.title =
        `ZenityHost — ${name || "Minecraft"}`;

}


function translateStatus(status) {

    const map = {
        ready: "Gotowy",
        running: "Uruchomiony",
        stopped: "Zatrzymany",
        provisioning: "Przygotowywanie",
        error: "Błąd",
        failed: "Błąd"
    };

    return map[String(status || "").toLowerCase()]
        || status
        || "Nieznany";

}


function formatDate(value) {

    if (!value) {
        return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
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


function showToast(message, type = "") {

    const container =
        $("toastContainer");

    const toast =
        document.createElement("div");

    toast.className =
        `toast ${type}`;

    toast.textContent =
        message;

    container.appendChild(toast);

    setTimeout(() => {

        toast.remove();

    }, 3500);

}


function escapeHtml(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}
