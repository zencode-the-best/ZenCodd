const API = "/api/hosting";

let prices = null;
let hostingOptions = null;

let currentType = null;
let currentService = null;

let discountCode = null;
let discountPercent = 0;

const $ = id => document.getElementById(id);


/* =========================
   START
========================= */

document.addEventListener("DOMContentLoaded", async () => {

    setupNavigation();
    setupServiceButtons();
    setupSelector();
    setupPurchase();
    setupDiscount();
    setupWalletRefresh();

    await loadWallet();
    await checkCEO();
    await loadPrices();
    await loadOptions();
    await loadServices();

});


/* =========================
   API
========================= */

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


/* =========================
   NAVIGATION
========================= */

function setupNavigation() {

    document
        .querySelectorAll("[data-scroll]")
        .forEach(link => {

            link.addEventListener("click", event => {

                const id =
                    link.dataset.scroll;

                const element =
                    $(id);

                if (!element) {
                    return;
                }

                event.preventDefault();

                element.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

            });

        });

}


/* =========================
   SERVICE BUTTONS
========================= */

function setupServiceButtons() {

    document
        .querySelectorAll(".go-button")
        .forEach(button => {

            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();
                    event.stopPropagation();

                    const type =
                        button.dataset.service;

                    if (type) {
                        openServiceSelector(type);
                    }

                }
            );

        });


    document
        .querySelectorAll(".service-card")
        .forEach(card => {

            card.addEventListener(
                "click",
                event => {

                    if (
                        event.target.closest(
                            ".go-button"
                        )
                    ) {
                        return;
                    }

                    const type =
                        card.dataset.service;

                    if (type) {
                        openServiceSelector(type);
                    }

                }
            );

        });

}


/* =========================
   SELECTOR
========================= */

function setupSelector() {

    const packageSelect =
        $("packageSelect");

    const durationSelect =
        $("durationSelect");

    if (packageSelect) {

        packageSelect.addEventListener(
            "change",
            () => {

                renderExtraOptions();
                updateSummary();

            }
        );

    }


    if (durationSelect) {

        durationSelect.addEventListener(
            "change",
            updateSummary
        );

    }


    const close =
        $("closeSelector");

    if (close) {

        close.addEventListener(
            "click",
            () => {

                const selector =
                    $("selector");

                if (selector) {
                    selector.classList.add("hidden");
                }

            }
        );

    }

}


/* =========================
   OPEN SERVICE
========================= */

function openServiceSelector(type) {

    const normalized =
        normalizeType(type);

    if (!normalized) {
        return;
    }

    currentType = normalized;

    const selector =
        $("selector");

    if (!selector) {
        return;
    }


    const info =
        getServiceInfo(normalized);


    const selectedType =
        $("selectedType");

    const selectedTitle =
        $("selectedTitle");


    if (selectedType) {
        selectedType.textContent =
            info.short;
    }


    if (selectedTitle) {
        selectedTitle.textContent =
            info.title;
    }


    const packageSelect =
        $("packageSelect");


    if (packageSelect) {
        packageSelect.innerHTML =
            `<option value="">Ładowanie...</option>`;
    }


    selector.classList.remove("hidden");


    loadPackagesForType();


    selector.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

}


/* =========================
   PACKAGES
========================= */

function loadPackagesForType() {

    const select =
        $("packageSelect");

    if (!select) {
        return;
    }


    if (!prices) {

        select.innerHTML =
            `<option value="">Brak danych</option>`;

        return;
    }


    const source =
        prices[currentType];


    let packages = [];


    if (
        source &&
        typeof source === "object" &&
        !Array.isArray(source)
    ) {

        packages =
            Object.keys(source);

    }


    if (Array.isArray(source)) {

        packages =
            source.map(item => {

                if (typeof item === "string") {
                    return item;
                }

                return item.id ||
                    item.name;

            });

    }


    if (!packages.length) {

        select.innerHTML =
            `<option value="">Brak pakietów</option>`;

        updateSummary();

        return;
    }


    select.innerHTML =
        packages
            .filter(Boolean)
            .map(packageName => {

                return `
                    <option value="${escapeHtml(packageName)}">
                        ${escapeHtml(packageName)}
                    </option>
                `;

            })
            .join("");


    renderExtraOptions();
    updateSummary();

}


/* =========================
   EXTRA OPTIONS
========================= */

function renderExtraOptions() {

    const container =
        $("extraOptions");

    if (!container) {
        return;
    }


    container.innerHTML = "";


    if (currentType === "minecraft") {

        const options =
            hostingOptions?.minecraft;


        const software =
            Array.isArray(options?.software)
                ? options.software
                : ["paper", "purpur", "vanilla"];


        const versions =
            Array.isArray(options?.versions)
                ? options.versions
                : [
                    "1.21.4",
                    "1.21.3",
                    "1.21.1",
                    "1.21",
                    "1.20.6",
                    "1.20.4",
                    "1.20.2",
                    "1.20.1"
                ];


        container.innerHTML = `

            <label>

                <span>
                    Oprogramowanie
                </span>

                <select id="software">

                    ${software.map(value => `
                        <option value="${escapeHtml(value)}">
                            ${escapeHtml(
                                String(value)
                                    .charAt(0)
                                    .toUpperCase() +
                                String(value).slice(1)
                            )}
                        </option>
                    `).join("")}

                </select>

            </label>


            <label>

                <span>
                    Wersja Minecraft
                </span>

                <select id="minecraftVersion">

                    ${versions.map(value => `
                        <option value="${escapeHtml(value)}">
                            ${escapeHtml(value)}
                        </option>
                    `).join("")}

                </select>

            </label>

        `;

        return;
    }


    if (currentType === "discord") {

        const versions =
            hostingOptions?.discord?.nodeVersions ||
            hostingOptions?.discord?.node ||
            ["22", "20", "18"];


        container.innerHTML = `

            <label>

                <span>
                    Node.js
                </span>

                <select id="nodeVersion">

                    ${versions.map(value => `
                        <option value="${escapeHtml(value)}">
                            Node.js ${escapeHtml(value)}
                        </option>
                    `).join("")}

                </select>

            </label>

        `;

        return;
    }


    if (currentType === "web") {

        const types =
            hostingOptions?.web?.types ||
            ["static", "php"];


        container.innerHTML = `

            <label>

                <span>
                    Typ hostingu
                </span>

                <select id="webType">

                    ${types.map(value => `
                        <option value="${escapeHtml(value)}">
                            ${String(value).toUpperCase()}
                        </option>
                    `).join("")}

                </select>

            </label>

        `;

    }

}


/* =========================
   SUMMARY
========================= */

function updateSummary() {

    const packageName =
        $("packageSelect")?.value ||
        "";


    const days =
        Number(
            $("durationSelect")?.value ||
            30
        );


    const info =
        getServiceInfo(currentType);


    const price =
        getPrice(
            currentType,
            packageName,
            days
        );


    const finalPrice =
        applyDiscount(price);


    if ($("summaryService")) {

        $("summaryService").textContent =
            info.name;

    }


    if ($("summaryPackage")) {

        $("summaryPackage").textContent =
            packageName || "—";

    }


    if ($("summaryDays")) {

        $("summaryDays").textContent =
            packageName
                ? `${days} dni`
                : "—";

    }


    if ($("summaryPrice")) {

        $("summaryPrice").textContent =
            finalPrice === null
                ? "0.00 zł"
                : `${finalPrice.toFixed(2)} zł`;

    }


    const button =
        $("purchaseButton");


    if (button) {

        button.textContent =
            finalPrice === null
                ? "Kup za 0.00 zł"
                : `Kup za ${finalPrice.toFixed(2)} zł`;

    }

}


/* =========================
   PRICES
========================= */

async function loadPrices() {

    try {

        prices =
            await api(
                `${API}/prices`
            );


        if (!prices) {
            prices = {};
        }


        if (currentType) {
            loadPackagesForType();
        }

    } catch (error) {

        console.error(
            "Ceny hostingu:",
            error
        );

    }

}


function getPrice(
    type,
    packageName,
    days
) {

    if (
        !prices ||
        !type ||
        !packageName
    ) {
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
            source.find(entry => {

                return (
                    entry.id === packageName ||
                    entry.name === packageName
                );

            });


        if (!item) {
            return null;
        }


        if (
            item.prices &&
            item.prices[days] !== undefined
        ) {

            return Number(
                item.prices[days]
            );

        }

    }


    return null;

}


/* =========================
   DISCOUNT
========================= */

function setupDiscount() {

    const button =
        $("discountButton");


    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        checkDiscount
    );

}


async function checkDiscount() {

    const input =
        $("discountInput");


    const message =
        $("discountMessage");


    const code =
        String(
            input?.value || ""
        )
            .trim()
            .toUpperCase();


    if (!code) {

        discountCode = null;
        discountPercent = 0;

        if (message) {
            message.textContent =
                "Wpisz kod rabatowy.";
        }

        updateSummary();

        return;
    }


    try {

        const data =
            await api(
                `${API}/codes/check`,
                {
                    method: "POST",
                    body: JSON.stringify({
                        code
                    })
                }
            );


        if (
            data.valid === false ||
            data.success === false
        ) {

            throw new Error(
                data.error ||
                "Kod jest nieprawidłowy."
            );

        }


        discountCode =
            data.code ||
            code;


        discountPercent =
            Number(
                data.discountPercent ??
                data.percent ??
                data.discount ??
                0
            );


        if (message) {

            message.textContent =
                discountPercent > 0
                    ? `✓ Kod aktywny: -${discountPercent}%`
                    : "✓ Kod został zaakceptowany.";

            message.style.color =
                "#73d39b";

        }


        updateSummary();

    } catch (error) {

        discountCode = null;
        discountPercent = 0;


        if (message) {

            message.textContent =
                `✕ ${error.message}`;

            message.style.color =
                "#ff7777";

        }


        updateSummary();

    }

}


function applyDiscount(price) {

    if (
        price === null ||
        !Number.isFinite(price)
    ) {
        return null;
    }


    if (
        !discountPercent ||
        discountPercent <= 0
    ) {
        return price;
    }


    return Math.max(
        0,
        price -
        (
            price *
            discountPercent /
            100
        )
    );

}


/* =========================
   PURCHASE
========================= */

function setupPurchase() {

    const button =
        $("purchaseButton");


    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        purchase
    );

}


async function purchase() {

    const type =
        normalizeType(
            currentType
        );


    const packageName =
        $("packageSelect")?.value;


    const days =
        Number(
            $("durationSelect")?.value
        );


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


    if (
        ![7, 30, 90].includes(days)
    ) {

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
            "Przygotowywanie...";

    }


    const message =
        $("purchaseMessage");


    try {

        const payload = {

            type,

            package:
                packageName,

            days

        };


        if (discountCode) {

            payload.code =
                discountCode;

        }


        if (type === "minecraft") {

            payload.config = {

                software:
                    $("software")?.value ||
                    "paper",

                version:
                    $("minecraftVersion")?.value ||
                    "1.21.4"

            };

        }


        if (type === "discord") {

            payload.config = {

                nodeVersion:
                    $("nodeVersion")?.value ||
                    "22"

            };

        }


        if (type === "web") {

            payload.config = {

                type:
                    $("webType")?.value ||
                    "static"

            };

        }


        const data =
            await api(
                `${API}/purchase`,
                {
                    method: "POST",

                    body:
                        JSON.stringify(payload)
                }
            );


        currentService =
            data.service ||
            data;


        if (message) {

            message.textContent =
                "✓ Usługa została utworzona. Przygotowywanie potrwa kilka sekund.";

            message.style.color =
                "#73d39b";

        }


        showToast(
            "Usługa została utworzona.",
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

            }, 1500);

        }


    } catch (error) {

        if (message) {

            message.textContent =
                error.message ||
                "Nie udało się utworzyć usługi.";

            message.style.color =
                "#ff7777";

        }


        showToast(
            error.message ||
            "Nie udało się utworzyć usługi.",
            "error"
        );


    } finally {

        if (button) {

            button.disabled = false;

            updateSummary();

        }

    }

}


/* =========================
   SERVICES
========================= */

async function loadServices() {

    const list =
        $("myServicesList");


    if (!list) {
        return;
    }


    try {

        const data =
            await api(
                `${API}/services`
            );


        const services =
            Array.isArray(data)
                ? data
                : Array.isArray(data.services)
                    ? data.services
                    : [];


        if (!services.length) {

            list.innerHTML = `

                <div class="empty-box">

                    <strong>
                        Nie masz jeszcze usług
                    </strong>

                    <span>
                        Wybierz hosting powyżej
                        i utwórz pierwszą usługę.
                    </span>

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

            <div class="empty-box">

                <strong>
                    Nie udało się pobrać usług
                </strong>

                <span>
                    ${escapeHtml(
                        error.message
                    )}
                </span>

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
        translateStatus(
            service.status
        );


    const statusClass =
        getStatusClass(
            service.status
        );


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
                        service.package ||
                        "—"
                    )}
                </span>

            </div>


            <div
                class="service-item-status ${statusClass}"
            >
                ${status}
            </div>


            <button
                type="button"
                class="manage-button"
                data-manage="${escapeHtml(
                    service.id || ""
                )}"
                data-type="${escapeHtml(
                    type
                )}"
            >
                Zarządzaj →
            </button>

        </article>

    `;

}


/* =========================
   OPEN EXISTING SERVICE
========================= */

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


/* =========================
   WALLET
========================= */

async function loadWallet() {

    try {

        const data =
            await api(
                "/api/wallet"
            );


        const balance =
            Number(
                data.balance ??
                data.wallet?.balance ??
                0
            );


        const formatted =
            `${balance.toFixed(2)} zł`;


        document
            .querySelectorAll(
                "#walletBalance, #sidebarWalletBalance, .wallet-balance"
            )
            .forEach(element => {

                element.textContent =
                    formatted;

            });


    } catch {

        document
            .querySelectorAll(
                "#walletBalance, #sidebarWalletBalance, .wallet-balance"
            )
            .forEach(element => {

                element.textContent =
                    "—";

            });

    }

}


/* =========================
   CEO CHECK
========================= */

async function checkCEO() {

    const navigation =
        $("ceoNavigation");

    const button =
        $("ceoButton");


    if (!navigation) {
        return;
    }


    try {

        /*
         * Ten endpoint jest zabezpieczony
         * przez requireCEO po stronie backendu.
         *
         * Zwykły użytkownik dostanie 401/403.
         * CEO dostanie odpowiedź.
         */

        await api(
            `${API}/admin/stats`
        );


        navigation.classList.remove(
            "hidden"
        );


        if (button) {

            button.classList.remove(
                "hidden"
            );

        }


    } catch {

        navigation.classList.add(
            "hidden"
        );


        if (button) {

            button.classList.add(
                "hidden"
            );

        }

    }

}


/* =========================
   AUTO REFRESH
========================= */

function setupWalletRefresh() {

    setInterval(
        loadWallet,
        5000
    );

}


/* =========================
   HELPERS
========================= */

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
            title: "Konfiguracja serwera Minecraft",
            short: "MINECRAFT",
            icon: "⛏"
        };

    }


    if (type === "discord") {

        return {
            name: "Discord Bot",
            title: "Konfiguracja hostingu Discord",
            short: "DISCORD",
            icon: "D"
        };

    }


    if (type === "web") {

        return {
            name: "Web Hosting",
            title: "Konfiguracja Web Hostingu",
            short: "WWW",
            icon: "W"
        };

    }


    return {
        name: "Usługa",
        title: "Konfiguracja",
        short: "USŁUGA",
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

        ready:
            "Gotowy",

        running:
            "Uruchomiony",

        stopped:
            "Zatrzymany",

        offline:
            "Offline",

        provisioning:
            "Przygotowywanie",

        error:
            "Błąd",

        failed:
            "Błąd"

    };


    return map[value] ||
        "Nieznany";

}


function showToast(
    message,
    type = ""
) {

    let toast =
        $("toast");


    if (!toast) {

        toast =
            document.createElement(
                "div"
            );


        toast.id =
            "toast";


        toast.className =
            "toast";


        document.body.appendChild(
            toast
        );

    }


    toast.textContent =
        message;


    toast.className =
        `toast ${type}`;


    clearTimeout(
        showToast.timer
    );


    showToast.timer =
        setTimeout(() => {

            toast.classList.add(
                "hidden"
            );

        }, 3500);

}


function escapeHtml(value) {

    return String(value)
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
