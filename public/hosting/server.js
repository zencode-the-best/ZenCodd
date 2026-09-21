const API = "/api/hosting";

const params = new URLSearchParams(
    window.location.search
);

const serviceId = params.get("id");

let service = null;
let timer = null;


document.addEventListener(
    "DOMContentLoaded",
    init
);


async function init() {

    if (!serviceId) {

        showError(
            "Brak identyfikatora usługi w adresie."
        );

        return;

    }

    await loadWallet();
    await loadService();

    timer = setInterval(
        refreshStatus,
        2000
    );

}


async function api(url, options = {}) {

    const response = await fetch(
        url,
        {
            credentials: "include",

            headers: {
                "Content-Type":
                    "application/json",

                ...(options.headers || {})
            },

            ...options
        }
    );

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


async function loadWallet() {

    try {

        const data =
            await fetch(
                "/api/wallet",
                {
                    credentials: "include"
                }
            );

        if (!data.ok) {
            return;
        }

        const wallet =
            await data.json();

        if (
            wallet &&
            typeof wallet.balance !== "undefined"
        ) {

            document
                .getElementById("walletBalance")
                .textContent =
                `${Number(wallet.balance).toFixed(2)} zł`;

        }

    } catch {
        // Portfel nie blokuje panelu usługi.
    }

}


async function loadService() {

    try {

        const data = await api(
            `${API}/service/${encodeURIComponent(serviceId)}`
        );

        service =
            data.service ||
            data;

        renderService();

    } catch (error) {

        console.error(error);

        showError(
            error.message ||
            "Nie udało się pobrać usługi."
        );

    }

}


async function refreshStatus() {

    if (!serviceId) {
        return;
    }

    try {

        const data = await api(
            `${API}/service/${encodeURIComponent(serviceId)}/status`
        );

        if (data.service) {

            service = {
                ...service,
                ...data.service
            };

        } else if (data.status) {

            service.status =
                data.status;

        }

        renderService();

    } catch (error) {

        console.warn(
            "Status usługi:",
            error.message
        );

    }

}


function renderService() {

    if (!service) {
        return;
    }

    document
        .getElementById("loading")
        .classList.add("hidden");

    document
        .getElementById("error")
        .classList.add("hidden");

    document
        .getElementById("service")
        .classList.remove("hidden");


    const type =
        String(
            service.type ||
            service.serviceType ||
            "unknown"
        ).toLowerCase();


    const typeInfo =
        getTypeInfo(type);


    document
        .getElementById("serviceIcon")
        .textContent =
        typeInfo.icon;


    document
        .getElementById("serviceType")
        .textContent =
        typeInfo.label;


    document
        .getElementById("serviceName")
        .textContent =
        service.name ||
        service.package ||
        typeInfo.label;


    document
        .getElementById("serviceId")
        .textContent =
        `ID: ${service.id || serviceId}`;


    document
        .getElementById("detailId")
        .textContent =
        service.id || serviceId;


    document
        .getElementById("detailType")
        .textContent =
        typeInfo.label;


    document
        .getElementById("package")
        .textContent =
        service.package || "—";


    document
        .getElementById("days")
        .textContent =
        service.days
            ? `${service.days} dni`
            : "—";


    document
        .getElementById("price")
        .textContent =
        typeof service.price === "number"
            ? `${service.price.toFixed(2)} zł`
            : "—";


    document
        .getElementById("expires")
        .textContent =
        formatDate(service.expiresAt);


    document
        .getElementById("detailExpires")
        .textContent =
        formatDate(service.expiresAt);


    document
        .getElementById("created")
        .textContent =
        formatDate(service.createdAt);


    renderStatus(
        service.status
    );


    const openButton =
        document.getElementById(
            "openService"
        );


    openButton.onclick =
        () => {

            window.location.href =
                getServiceUrl(
                    type,
                    service.id || serviceId
                );

        };

}


function renderStatus(status) {

    const element =
        document.getElementById(
            "serviceStatus"
        );

    const provisioning =
        document.getElementById(
            "provisioning"
        );

    const countdown =
        document.getElementById(
            "countdown"
        );


    const normalized =
        String(status || "")
            .toLowerCase();


    element.className =
        "status";


    if (
        normalized === "ready" ||
        normalized === "running"
    ) {

        element.classList.add(
            "ready"
        );

        element.textContent =
            normalized === "running"
                ? "Uruchomiony"
                : "Gotowy";

        provisioning
            .classList.add("hidden");

        return;

    }


    if (
        normalized === "stopped" ||
        normalized === "offline"
    ) {

        element.classList.add(
            "stopped"
        );

        element.textContent =
            "Zatrzymany";

        provisioning
            .classList.add("hidden");

        return;

    }


    if (
        normalized === "error" ||
        normalized === "failed"
    ) {

        element.classList.add(
            "error"
        );

        element.textContent =
            "Błąd";

        provisioning
            .classList.add("hidden");

        return;

    }


    element.classList.add(
        "provisioning"
    );

    element.textContent =
        "Przygotowywanie";


    provisioning
        .classList.remove("hidden");


    updateCountdown(
        countdown
    );

}


function updateCountdown(element) {

    if (!service || !service.readyAt) {

        element.textContent =
            "chwila";

        return;

    }


    const remaining =
        new Date(
            service.readyAt
        ).getTime() -
        Date.now();


    if (remaining <= 0) {

        element.textContent =
            "gotowe";

        return;

    }


    element.textContent =
        `${Math.ceil(
            remaining / 1000
        )}s`;

}


function getTypeInfo(type) {

    if (
        type === "minecraft" ||
        type === "mc"
    ) {

        return {
            label: "MINECRAFT",
            icon: "⛏"
        };

    }


    if (
        type === "discord" ||
        type === "discord-bot" ||
        type === "bot"
    ) {

        return {
            label: "DISCORD BOT",
            icon: "D"
        };

    }


    if (
        type === "web" ||
        type === "website" ||
        type === "hosting"
    ) {

        return {
            label: "WEB HOSTING",
            icon: "W"
        };

    }


    return {
        label: "USŁUGA",
        icon: "Z"
    };

}


function getServiceUrl(
    type,
    id
) {

    if (
        type === "minecraft" ||
        type === "mc"
    ) {

        return `/hosting/services/minecraft/?id=${encodeURIComponent(id)}`;

    }


    if (
        type === "discord" ||
        type === "discord-bot" ||
        type === "bot"
    ) {

        return `/hosting/services/discord/?id=${encodeURIComponent(id)}`;

    }


    if (
        type === "web" ||
        type === "website" ||
        type === "hosting"
    ) {

        return `/hosting/services/web/?id=${encodeURIComponent(id)}`;

    }


    return `/hosting/server.html?id=${encodeURIComponent(id)}`;

}


function showError(message) {

    document
        .getElementById("loading")
        .classList.add("hidden");


    document
        .getElementById("service")
        .classList.add("hidden");


    document
        .getElementById("error")
        .classList.remove("hidden");


    document
        .getElementById("errorMessage")
        .textContent =
        message ||
        "Nie udało się otworzyć usługi.";

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
