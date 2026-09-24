const API = "/api/hosting";

const params =
    new URLSearchParams(
        window.location.search
    );

const serviceId =
    params.get("id");

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
    } catch {}

    if (!response.ok) {
        throw new Error(
            data.error ||
            data.message ||
            `HTTP ${response.status}`
        );
    }

    return data;
}

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

function getStatus(status) {
    const statuses = {
        provisioning: "Uruchamianie",
        ready: "Gotowy",
        running: "Działa",
        stopped: "Wyłączony",
        suspended: "Zawieszony",
        error: "Błąd"
    };

    return (
        statuses[status] ||
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
        message;

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

function normalizeService(data) {
    return (
        data.service ||
        data.data ||
        data
    );
}

async function loadService() {
    hideError();

    if (!serviceId) {
        showError(
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

        /*
         * Usługa otwierana z tego panelu musi być
         * usługą Minecraft.
         */
        const serviceType =
            String(
                service.type ||
                service.serviceType ||
                ""
            ).toLowerCase();

        if (
            serviceType &&
            serviceType !== "minecraft"
        ) {
            showError(
                "Ta usługa nie jest usługą Minecraft."
            );
            return;
        }

        renderService(
            service
        );

    } catch (error) {
        console.error(
            "Minecraft service:",
            error
        );

        showError(
            error.message
        );
    }
}

function renderService(service) {
    const config =
        service.config &&
        typeof service.config === "object"
            ? service.config
            : {};

    const name =
        getElement(
            "serverName",
            "serviceName"
        );

    const status =
        getElement(
            "serverStatus",
            "serviceStatus"
        );

    const version =
        getElement(
            "serverVersion",
            "serviceVersion"
        );

    const software =
        getElement(
            "serverSoftware",
            "serviceSoftware"
        );

    const packageElement =
        getElement(
            "serverPackage",
            "servicePackage"
        );

    const daysElement =
        getElement(
            "serverDays",
            "serviceDays"
        );

    if (name) {
        name.textContent =
            service.name ||
            service.serverName ||
            config.serverName ||
            "Serwer Minecraft";
    }

    if (status) {
        status.textContent =
            getStatus(
                service.status
            );
    }

    if (version) {
        version.textContent =
            config.version ||
            service.version ||
            "—";
    }

    if (software) {
        software.textContent =
            config.software ||
            service.software ||
            "—";
    }

    if (packageElement) {
        packageElement.textContent =
            service.package ||
            "—";
    }

    if (daysElement) {
        daysElement.textContent =
            service.days != null
                ? `${service.days} dni`
                : "—";
    }

    document.title =
        `${
            service.name ||
            config.serverName ||
            "Minecraft"
        } — ZenityHost`;
}

async function loadStatus() {
    if (!serviceId) {
        return;
    }

    try {
        const data =
            await api(
                `${API}/service/${encodeURIComponent(serviceId)}/status`
            );

        const status =
            data.status ||
            data.service?.status;

        const element =
            getElement(
                "serverStatus",
                "serviceStatus"
            );

        if (element) {
            element.textContent =
                getStatus(status);
        }

    } catch (error) {
        console.error(
            "Minecraft status:",
            error
        );
    }
}

function normalizeConsole(data) {
    const value =
        data.lines ??
        data.console ??
        data.output ??
        [];

    if (Array.isArray(value)) {
        return value.join("\n");
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
                "console",
                "consoleOutput"
            );

        if (!output) {
            return;
        }

        output.textContent =
            normalizeConsole(data);

        output.scrollTop =
            output.scrollHeight;

    } catch (error) {
        console.error(
            "Minecraft console:",
            error
        );
    }
}

async function sendCommand() {
    if (!serviceId) {
        return;
    }

    const input =
        getElement(
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
            error.message
        );
    }
}

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
            getElement("files");

        if (!container) {
            return;
        }

        if (!files.length) {
            container.innerHTML =
                `<div class="empty">
                    Brak plików.
                </div>`;
            return;
        }

        container.innerHTML =
            files.map(file => {

                const name =
                    file.name ||
                    file.path ||
                    "plik";

                return `
                    <div class="file">
                        ${escapeHtml(name)}
                    </div>
                `;

            }).join("");

    } catch (error) {
        console.error(
            "Minecraft files:",
            error
        );
    }
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );
}

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadService();
        loadStatus();
        loadConsole();
        loadFiles();

        setInterval(
            loadStatus,
            10000
        );

        setInterval(
            loadConsole,
            5000
        );

        const sendButton =
            getElement(
                "sendCommand"
            );

        if (sendButton) {
            sendButton.addEventListener(
                "click",
                sendCommand
            );
        }

        const commandInput =
            getElement(
                "consoleCommand",
                "command"
            );

        if (commandInput) {
            commandInput.addEventListener(
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
);
