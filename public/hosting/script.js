const API = "/api/hosting";
const WALLET_API = "/api/wallet";

document.addEventListener("DOMContentLoaded", () => {
    setupButtons();
    loadWallet();
    loadServices();
    checkCEO();

    setInterval(loadWallet, 15000);
    setInterval(loadServices, 15000);
});

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

function setupButtons() {
    document.querySelectorAll(".go-button").forEach(button => {
        button.addEventListener("click", () => {
            const type = button.dataset.service;

            if (!["minecraft", "discord", "web"].includes(type)) {
                return;
            }

            window.location.href =
                `/hosting/order.html?type=${encodeURIComponent(type)}`;
        });
    });
}

async function loadWallet() {
    try {
        const data = await api(WALLET_API);

        const balance = Number(
            data.balance ??
            data.wallet?.balance ??
            0
        );

        const text = `${balance.toFixed(2)} zł`;

        const wallet =
            document.getElementById("walletBalance");

        const sidebar =
            document.getElementById("sidebarWalletBalance");

        if (wallet) wallet.textContent = text;
        if (sidebar) sidebar.textContent = text;

    } catch (error) {
        console.error("Wallet:", error);

        const wallet =
            document.getElementById("walletBalance");

        const sidebar =
            document.getElementById("sidebarWalletBalance");

        if (wallet) wallet.textContent = "—";
        if (sidebar) sidebar.textContent = "—";
    }
}

async function loadServices() {
    const container =
        document.getElementById("myServicesList");

    if (!container) return;

    try {
        const data =
            await api(`${API}/services`);

        const services =
            Array.isArray(data)
                ? data
                : Array.isArray(data.services)
                    ? data.services
                    : [];

        if (!services.length) {
            container.innerHTML = `
                <div class="empty">
                    Nie masz jeszcze żadnych usług.
                </div>
            `;
            return;
        }

        container.innerHTML = services.map(service => {

            const type = service.type || "unknown";

            const names = {
                minecraft: "Minecraft",
                discord: "Discord Bot",
                web: "Web Hosting"
            };

            return `
                <div class="my-service">

                    <div>

                        <div class="my-service-name">
                            ${escapeHtml(
                                service.name ||
                                service.serverName ||
                                names[type] ||
                                "Usługa"
                            )}
                        </div>

                        <div class="my-service-meta">
                            ${escapeHtml(
                                names[type] || type
                            )}
                            •
                            ${escapeHtml(
                                service.package || "Pakiet"
                            )}
                            •
                            ${escapeHtml(
                                service.days || "?"
                            )} dni
                        </div>

                    </div>

                    <div
                        style="
                            display:flex;
                            align-items:center;
                            gap:12px;
                        "
                    >

                        <span class="status">
                            ${escapeHtml(
                                getStatus(service.status)
                            )}
                        </span>

                        <button
                            class="primary-button"
                            onclick="openService(
                                '${escapeAttribute(service.id)}',
                                '${escapeAttribute(type)}'
                            )"
                        >
                            Otwórz →
                        </button>

                    </div>

                </div>
            `;
        }).join("");

    } catch (error) {

        console.error("Services:", error);

        container.innerHTML = `
            <div class="empty">
                Nie udało się pobrać usług.
            </div>
        `;
    }
}

function openService(id, type) {
    if (!id) return;

    if (type === "minecraft") {
        window.location.href =
            `/hosting/services/minecraft/?id=${encodeURIComponent(id)}`;
        return;
    }

    if (type === "discord") {
        window.location.href =
            `/hosting/services/discord/?id=${encodeURIComponent(id)}`;
        return;
    }

    if (type === "web") {
        window.location.href =
            `/hosting/services/web/?id=${encodeURIComponent(id)}`;
        return;
    }

    window.location.href =
        `/hosting/server.html?id=${encodeURIComponent(id)}`;
}

async function checkCEO() {
    const navigation =
        document.getElementById("ceoNavigation");

    if (!navigation) return;

    try {
        await api(`${API}/admin/stats`);
        navigation.style.display = "block";
    } catch {
        navigation.style.display = "none";
    }
}

function getStatus(status) {
    const statuses = {
        provisioning: "Uruchamianie",
        ready: "Gotowa",
        running: "Działa",
        stopped: "Wyłączona",
        suspended: "Zawieszona",
        error: "Błąd"
    };

    return statuses[status] || status || "Nieznany";
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
    return String(value ?? "")
        .replaceAll("\\", "\\\\")
        .replaceAll("'", "\\'");
}
