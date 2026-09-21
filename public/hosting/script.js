const API = "/api/hosting";

let prices = null;
let currentService = null;

const $ = (id) => document.getElementById(id);

document.addEventListener("DOMContentLoaded", async () => {
    setupNavigation();
    setupSelectors();
    setupPurchase();
    setupWalletRefresh();

    await loadWallet();
    await loadPrices();
    await loadOptions();
    await loadServices();
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

    let data = {};

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


function setupNavigation() {
    document.querySelectorAll("[data-service]").forEach(button => {
        button.addEventListener("click", () => {
            const service = button.dataset.service;

            if (service) {
                openServiceSelector(service);
            }
        });
    });
}


function setupSelectors() {
    const type = $("serviceType");
    const packageSelect = $("package");
    const daysSelect = $("days");

    if (type) {
        type.addEventListener("change", () => {
            updatePackages();
            updatePrice();
        });
    }

    if (packageSelect) {
        packageSelect.addEventListener("change", updatePrice);
    }

    if (daysSelect) {
        daysSelect.addEventListener("change", updatePrice);
    }

    document.querySelectorAll(".service-card").forEach(card => {
        card.addEventListener("click", () => {
            const typeName =
                card.dataset.service ||
                card.dataset.type;

            if (typeName) {
                openServiceSelector(typeName);
            }
        });
    });
}


function setupPurchase() {
    const form = $("purchaseForm");

    if (!form) {
        return;
    }

    form.addEventListener("submit", async event => {
        event.preventDefault();

        await purchase();
    });
}


function setupWalletRefresh() {
    setInterval(loadWallet, 5000);
}


async function loadWallet() {
    try {
        const data = await api("/api/wallet");

        const balance =
            Number(
                data.balance ??
                data.wallet?.balance ??
                0
            );

        document
            .querySelectorAll(
                "#walletBalance, .wallet-balance"
            )
            .forEach(element => {
                element.textContent =
                    `${balance.toFixed(2)} zł`;
            });

    } catch {
        document
            .querySelectorAll(
                "#walletBalance, .wallet-balance"
            )
            .forEach(element => {
                element.textContent = "—";
            });
    }
}


async function loadPrices() {
    try {
        prices = await api(`${API}/prices`);

        updatePackages();
        updatePrice();

    } catch (error) {
        console.error(
            "Nie udało się pobrać cen:",
            error.message
        );
    }
}


async function loadOptions() {
    try {
        const [minecraft, discord, web] =
            await Promise.all([
                api(`${API}/minecraft/options`),
                api(`${API}/discord/options`),
                api(`${API}/web/options`)
            ]);

        window.hostingOptions = {
            minecraft,
            discord,
            web
        };

    } catch (error) {
        console.error(
            "Opcje hostingu:",
            error.message
        );
    }
}


async function loadServices() {
    const list =
        $("servicesList") ||
        $("myServices");

    if (!list) {
        return;
    }

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
            list.innerHTML = `
                <div class="empty-services">
                    <strong>Nie masz jeszcze usług</strong>
                    <span>Wybierz hosting powyżej i utwórz pierwszą usługę.</span>
                </div>
            `;

            return;
        }

        list.innerHTML =
            services
                .map(renderService)
                .join("");

        list
            .querySelectorAll("[data-manage]")
            .forEach(button => {
                button.addEventListener(
                    "click",
                    () => {
                        openService(
                            button.dataset.manage,
                            button.dataset.type
                        );
                    }
                );
            });

    } catch (error) {
        list.innerHTML = `
            <div class="empty-services">
                <strong>Nie udało się pobrać usług</strong>
                <span>${escapeHtml(error.message)}</span>
            </div>
        `;
    }
}


function renderService(service) {
    const type =
        normalizeType(
            service.type ||
            service.serviceType
        );

    const info =
        getServiceInfo(type);

    const status =
        translateStatus(service.status);

    const statusClass =
        getStatusClass(service.status);

    return `
        <article class="service-item">

            <div class="service-item-icon">
                ${info.icon}
            </div>

            <div class="service-item-info">

                <strong>
                    ${escapeHtml(
                        service.name ||
                        service.package ||
                        info.name
                    )}
                </strong>

                <span>
                    ${info.name}
                    •
                    ${escapeHtml(
                        service.package || "—"
                    )}
                </span>

            </div>

            <div class="service-item-status ${statusClass}">
                ${status}
            </div>

            <button
                class="manage-button"
                data-manage="${escapeHtml(
                    service.id || ""
                )}"
                data-type="${type}"
            >
                Zarządzaj →
            </button>

        </article>
    `;
}


function openService(id, type) {
    if (!id) {
        return;
    }

    const normalized =
        normalizeType(type);

    if (normalized === "minecraft") {
        window.location.href =
            `/hosting/services/minecraft/?id=${encodeURIComponent(id)}`;
        return;
    }

    if (normalized === "discord") {
        window.location.href =
            `/hosting/services/discord/?id=${encodeURIComponent(id)}`;
        return;
    }

    if (normalized === "web") {
        window.location.href =
            `/hosting/services/web/?id=${encodeURIComponent(id)}`;
        return;
    }

    window.location.href =
        `/hosting/server.html?id=${encodeURIComponent(id)}`;
}


function openServiceSelector(type) {
    const normalized =
        normalizeType(type);

    const select =
        $("serviceType");

    if (select) {
        select.value = normalized;
        updatePackages();
        updatePrice();
    }

    const selector =
        $("purchaseSection") ||
        $("orderSection") ||
        $("hostingSelector");

    if (selector) {
        selector.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }
}


function updatePackages() {
    const select = $("package");

    if (!select || !prices) {
        return;
    }

    const type =
        normalizeType(
            $("serviceType")?.value ||
            "minecraft"
        );

    const source =
        prices[type] ||
        prices[`${type}Packages`] ||
        [];

    let packages = [];

    if (Array.isArray(source)) {
        packages = source;
    } else if (source && typeof source === "object") {
        packages = Object.keys(source);
    }

    if (!packages.length) {
        select.innerHTML =
            `<option value="">Brak pakietów</option>`;
        return;
    }

    select.innerHTML =
        packages
            .map(item => {
                const value =
                    typeof item === "string"
                        ? item
                        : item.id || item.name;

                const label =
                    typeof item === "string"
                        ? item
                        : item.name || item.id;

                return `
                    <option value="${escapeHtml(value)}">
                        ${escapeHtml(label)}
                    </option>
                `;
            })
            .join("");

    updatePrice();
}


function updatePrice() {
    const type =
        normalizeType(
            $("serviceType")?.value ||
            "minecraft"
        );

    const packageName =
        $("package")?.value;

    const days =
        Number(
            $("days")?.value ||
            30
        );

    const price =
        getPrice(
            type,
            packageName,
            days
        );

    document
        .querySelectorAll(
            "#purchasePrice, .purchase-price"
        )
        .forEach(element => {
            element.textContent =
                price === null
                    ? "—"
                    : `${price.toFixed(2)} zł`;
        });
}


function getPrice(type, packageName, days) {
    if (!prices || !packageName) {
        return null;
    }

    const source =
        prices[type];

    if (!source) {
        return null;
    }

    if (
        source[packageName] &&
        typeof source[packageName] === "object"
    ) {
        const value =
            source[packageName][days];

        return value === undefined
            ? null
            : Number(value);
    }

    if (Array.isArray(source)) {
        const item =
            source.find(
                entry =>
                    entry.id === packageName ||
                    entry.name === packageName
            );

        if (!item) {
            return null;
        }

        if (
            item.prices &&
            item.prices[days] !== undefined
        ) {
            return Number(item.prices[days]);
        }
    }

    return null;
}


async function purchase() {
    const type =
        normalizeType(
            $("serviceType")?.value
        );

    const packageName =
        $("package")?.value;

    const days =
        Number(
            $("days")?.value
        );

    const software =
        $("software")?.value ||
        "paper";

    const version =
        $("minecraftVersion")?.value ||
        "1.21.4";

    const nodeVersion =
        $("nodeVersion")?.value ||
        "22";

    const webType =
        $("webType")?.value ||
        "static";

    if (!type) {
        showToast(
            "Wybierz usługę.",
            "error"
        );
        return;
    }

    if (!packageName) {
        showToast(
            "Wybierz pakiet.",
            "error"
        );
        return;
    }

    if (![7, 30, 90].includes(days)) {
        showToast(
            "Wybierz okres 7, 30 lub 90 dni.",
            "error"
        );
        return;
    }

    const button =
        $("purchaseButton");

    if (button) {
        button.disabled = true;
        button.textContent =
            "Tworzenie usługi...";
    }

    try {
        const payload = {
            type,
            package: packageName,
            days
        };

        if (type === "minecraft") {
            payload.config = {
                software,
                version
            };
        }

        if (type === "discord") {
            payload.config = {
                nodeVersion
            };
        }

        if (type === "web") {
            payload.config = {
                type: webType
            };
        }

        const data =
            await api(
                `${API}/purchase`,
                {
                    method: "POST",
                    body: JSON.stringify(payload)
                }
            );

        currentService =
            data.service ||
            data;

        showToast(
            "Usługa została utworzona. Przygotowywanie potrwa kilka sekund.",
            "success"
        );

        await loadWallet();
        await loadServices();

        const id =
            currentService.id ||
            currentService.serviceId;

        if (id) {
            setTimeout(() => {
                openService(
                    id,
                    type
                );
            }, 1200);
        }

    } catch (error) {
        showToast(
            error.message ||
            "Nie udało się utworzyć usługi.",
            "error"
        );

    } finally {
        if (button) {
            button.disabled = false;
            button.textContent =
                "Kup hosting";
        }
    }
}


function normalizeType(type) {
    const value =
        String(type || "")
            .toLowerCase()
            .trim();

    if (
        value === "mc" ||
        value === "minecraft"
    ) {
        return "minecraft";
    }

    if (
        value === "bot" ||
        value === "discord-bot" ||
        value === "discord"
    ) {
        return "discord";
    }

    if (
        value === "website" ||
        value === "web" ||
        value === "hosting"
    ) {
        return "web";
    }

    return value;
}


function getServiceInfo(type) {
    if (type === "minecraft") {
        return {
            name: "Minecraft",
            icon: "⛏"
        };
    }

    if (type === "discord") {
        return {
            name: "Discord Bot",
            icon: "D"
        };
    }

    if (type === "web") {
        return {
            name: "Web Hosting",
            icon: "W"
        };
    }

    return {
        name: "Usługa",
        icon: "Z"
    };
}


function getStatusClass(status) {
    const value =
        String(status || "")
            .toLowerCase();

    if (
        value === "ready" ||
        value === "running"
    ) {
        return "ready";
    }

    if (
        value === "error" ||
        value === "failed"
    ) {
        return "error";
    }

    if (
        value === "stopped" ||
        value === "offline"
    ) {
        return "stopped";
    }

    return "provisioning";
}


function translateStatus(status) {
    const value =
        String(status || "")
            .toLowerCase();

    const map = {
        ready: "Gotowy",
        running: "Uruchomiony",
        stopped: "Zatrzymany",
        offline: "Offline",
        provisioning: "Przygotowywanie",
        error: "Błąd",
        failed: "Błąd"
    };

    return map[value] || "Nieznany";
}


function showToast(message, type = "") {
    let toast =
        $("toast");

    if (!toast) {
        toast =
            document.createElement("div");

        toast.id = "toast";
        toast.className = "toast";

        document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.className =
        `toast ${type}`;

    clearTimeout(
        showToast.timer
    );

    showToast.timer =
        setTimeout(() => {
            toast.classList.add("hidden");
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
