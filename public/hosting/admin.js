const API = "/api/hosting";
const WALLET_API = "/api/wallet";

document.addEventListener("DOMContentLoaded", () => {
    setupTabs();

    const hash = window.location.hash.replace("#", "");

    if (hash) {
        showTab(hash);
    } else {
        showTab("dashboard");
    }

    loadStats();
    loadServices();
    loadCodes();
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

function setupTabs() {
    document.querySelectorAll("[data-tab]").forEach(button => {
        button.addEventListener("click", () => {
            showTab(button.dataset.tab);
        });
    });
}

function showTab(name) {
    const allowed = [
        "dashboard",
        "users",
        "wallets",
        "services",
        "codes",
        "settings"
    ];

    if (!allowed.includes(name)) {
        name = "dashboard";
    }

    document.querySelectorAll(".admin-tab").forEach(tab => {
        tab.style.display =
            tab.id === name ? "block" : "none";
    });

    document.querySelectorAll("[data-tab]").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.tab === name
        );
    });

    window.history.replaceState(
        null,
        "",
        `#${name}`
    );
}

async function loadStats() {
    try {
        const data = await api(
            `${API}/admin/stats`
        );

        const stats =
            data.stats ||
            data;

        setText(
            "statUsers",
            stats.users ?? 0
        );

        setText(
            "statServices",
            stats.services ?? 0
        );

        setText(
            "statMinecraft",
            stats.minecraft ?? 0
        );

        setText(
            "statDiscord",
            stats.discord ?? 0
        );

        setText(
            "statWeb",
            stats.web ?? 0
        );

    } catch (error) {
        console.error(
            "Nie udało się pobrać statystyk:",
            error
        );
    }
}

async function searchWallet() {
    const userInput =
        document.getElementById("walletAddUserId") ||
        document.getElementById("walletUserId");

    const result =
        document.getElementById("walletResult");

    const userId =
        userInput?.value.trim();

    if (!userId) {
        if (result) {
            result.innerHTML =
                `<div class="error">
                    Podaj ID użytkownika Discord.
                </div>`;
        }
        return;
    }

    if (result) {
        result.innerHTML =
            `<div class="loading">
                Sprawdzanie portfela...
            </div>`;
    }

    try {
        const data = await api(
            `${API}/admin/wallet/${encodeURIComponent(userId)}`
        );

        const wallet =
            data.wallet ||
            data;

        const balance =
            Number(
                wallet.balance ??
                wallet.amount ??
                0
            );

        const transactions =
            Array.isArray(data.transactions)
                ? data.transactions
                : [];

        if (!result) {
            return;
        }

        result.innerHTML = `
            <div class="wallet-info">

                <div>
                    <span>ID użytkownika</span>
                    <strong>
                        ${escapeHtml(userId)}
                    </strong>
                </div>

                <div>
                    <span>Saldo</span>
                    <strong class="gold">
                        ${balance.toFixed(2)} zł
                    </strong>
                </div>

                <div>
                    <span>Transakcje</span>
                    <strong>
                        ${transactions.length}
                    </strong>
                </div>

            </div>
        `;

    } catch (error) {
        if (result) {
            result.innerHTML = `
                <div class="error">
                    ${escapeHtml(
                        error.message
                    )}
                </div>
            `;
        }
    }
}

async function addWalletFunds() {
    const userInput =
        document.getElementById(
            "walletAddUserId"
        );

    const amountInput =
        document.getElementById(
            "walletAddAmount"
        );

    const reasonInput =
        document.getElementById(
            "walletAddReason"
        );

    const userId =
        userInput?.value.trim();

    const amount =
        Number(
            amountInput?.value
        );

    const reason =
        reasonInput?.value.trim() ||
        "Dodanie środków przez CEO";

    if (!userId) {
        alert(
            "Podaj ID użytkownika Discord."
        );
        return;
    }

    if (
        !Number.isFinite(amount) ||
        amount <= 0
    ) {
        alert(
            "Podaj prawidłową kwotę."
        );
        return;
    }

    try {
        const data = await api(
            `${WALLET_API}/admin/add`,
            {
                method: "POST",
                body: JSON.stringify({
                    userId,
                    amount,
                    reason
                })
            }
        );

        alert(
            data.message ||
            `Dodano ${amount.toFixed(2)} zł do portfela.`
        );

        if (amountInput) {
            amountInput.value = "";
        }

        if (reasonInput) {
            reasonInput.value = "";
        }

        await searchWallet();

    } catch (error) {
        alert(
            `Nie udało się dodać środków: ${error.message}`
        );
    }
}

async function loadServices() {
    const container =
        document.getElementById(
            "servicesList"
        );

    if (!container) {
        return;
    }

    try {
        const data = await api(
            `${API}/admin/services`
        );

        const services =
            Array.isArray(data)
                ? data
                : Array.isArray(data.services)
                    ? data.services
                    : [];

        if (!services.length) {
            container.innerHTML =
                `<div class="empty">
                    Brak usług.
                </div>`;
            return;
        }

        container.innerHTML =
            services.map(service => {

                const type =
                    service.type ||
                    "unknown";

                const typeNames = {
                    minecraft: "Minecraft",
                    discord: "Discord Bot",
                    web: "Strona WWW"
                };

                return `
                    <div class="admin-service">

                        <div>
                            <strong>
                                ${escapeHtml(
                                    service.name ||
                                    service.serverName ||
                                    service.config?.serverName ||
                                    service.config?.botName ||
                                    service.config?.webName ||
                                    "Usługa"
                                )}
                            </strong>

                            <div class="muted">
                                ${escapeHtml(
                                    typeNames[type] ||
                                    type
                                )}
                                •
                                ${escapeHtml(
                                    service.package ||
                                    "Pakiet"
                                )}
                                •
                                ${escapeHtml(
                                    service.days ??
                                    "?"
                                )} dni
                            </div>
                        </div>

                        <div class="service-actions">

                            <span class="status">
                                ${escapeHtml(
                                    getStatus(
                                        service.status
                                    )
                                )}
                            </span>

                            <button
                                onclick="openService(
                                    '${escapeAttribute(service.id)}',
                                    '${escapeAttribute(type)}'
                                )"
                            >
                                Otwórz
                            </button>

                            <button
                                class="danger"
                                onclick="deleteService(
                                    '${escapeAttribute(service.id)}'
                                )"
                            >
                                Usuń
                            </button>

                        </div>

                    </div>
                `;
            }).join("");

    } catch (error) {
        container.innerHTML = `
            <div class="error">
                ${escapeHtml(
                    error.message
                )}
            </div>
        `;
    }
}

function openService(id, type) {
    if (!id) {
        return;
    }

    if (type === "minecraft") {
        window.location.href =
            `/hosting/services/minecraft/?id=${encodeURIComponent(id)}&type=minecraft`;
        return;
    }

    if (type === "discord") {
        window.location.href =
            `/hosting/services/discord/?id=${encodeURIComponent(id)}&type=discord`;
        return;
    }

    if (type === "web") {
        window.location.href =
            `/hosting/services/web/?id=${encodeURIComponent(id)}&type=web`;
        return;
    }

    alert(
        "Nieprawidłowy typ usługi."
    );
}

async function deleteService(id) {
    if (!id) {
        return;
    }

    if (
        !confirm(
            "Czy na pewno chcesz usunąć tę usługę?"
        )
    ) {
        return;
    }

    try {
        await api(
            `${API}/admin/services/${encodeURIComponent(id)}`,
            {
                method: "DELETE"
            }
        );

        await loadServices();

        await loadStats();

    } catch (error) {
        alert(
            `Nie udało się usunąć usługi: ${error.message}`
        );
    }
}

async function loadCodes() {
    const container =
        document.getElementById(
            "codesList"
        );

    if (!container) {
        return;
    }

    try {
        const data = await api(
            `${API}/admin/codes`
        );

        const codes =
            Array.isArray(data)
                ? data
                : Array.isArray(data.codes)
                    ? data.codes
                    : [];

        if (!codes.length) {
            container.innerHTML =
                `<div class="empty">
                    Brak kodów rabatowych.
                </div>`;
            return;
        }

        container.innerHTML =
            codes.map(code => `
                <div class="admin-code">

                    <div>
                        <strong>
                            ${escapeHtml(
                                code.code
                            )}
                        </strong>

                        <span class="muted">
                            -${Number(
                                code.percent || 0
                            )}%
                        </span>
                    </div>

                    <div class="service-actions">

                        <span class="status">
                            ${
                                code.active
                                    ? "Aktywny"
                                    : "Wyłączony"
                            }
                        </span>

                        <button
                            onclick="toggleCode(
                                '${escapeAttribute(code.id)}',
                                ${code.active ? "false" : "true"}
                            )"
                        >
                            ${
                                code.active
                                    ? "Wyłącz"
                                    : "Włącz"
                            }
                        </button>

                        <button
                            class="danger"
                            onclick="deleteCode(
                                '${escapeAttribute(code.id)}'
                            )"
                        >
                            Usuń
                        </button>

                    </div>

                </div>
            `).join("");

    } catch (error) {
        container.innerHTML = `
            <div class="error">
                ${escapeHtml(
                    error.message
                )}
            </div>
        `;
    }
}

async function createCode() {
    const codeInput =
        document.getElementById(
            "newCode"
        );

    const percentInput =
        document.getElementById(
            "newCodePercent"
        );

    const code =
        codeInput?.value.trim();

    const percent =
        Number(
            percentInput?.value
        );

    if (!code) {
        alert(
            "Podaj kod rabatowy."
        );
        return;
    }

    if (
        !Number.isFinite(percent) ||
        percent <= 0 ||
        percent > 100
    ) {
        alert(
            "Rabat musi wynosić od 1 do 100%."
        );
        return;
    }

    try {
        await api(
            `${API}/admin/codes`,
            {
                method: "POST",
                body: JSON.stringify({
                    code,
                    percent
                })
            }
        );

        if (codeInput) {
            codeInput.value = "";
        }

        if (percentInput) {
            percentInput.value = "";
        }

        await loadCodes();

    } catch (error) {
        alert(
            `Nie udało się utworzyć kodu: ${error.message}`
        );
    }
}

async function toggleCode(id, active) {
    try {
        await api(
            `${API}/admin/codes/${encodeURIComponent(id)}`,
            {
                method: "PATCH",
                body: JSON.stringify({
                    active: Boolean(active)
                })
            }
        );

        await loadCodes();

    } catch (error) {
        alert(
            `Nie udało się zmienić kodu: ${error.message}`
        );
    }
}

async function deleteCode(id) {
    if (!id) {
        return;
    }

    if (
        !confirm(
            "Czy na pewno usunąć ten kod?"
        )
    ) {
        return;
    }

    try {
        await api(
            `${API}/admin/codes/${encodeURIComponent(id)}`,
            {
                method: "DELETE"
            }
        );

        await loadCodes();

    } catch (error) {
        alert(
            `Nie udało się usunąć kodu: ${error.message}`
        );
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

    return (
        statuses[status] ||
        status ||
        "Nieznany"
    );
}

function setText(id, value) {
    const element =
        document.getElementById(id);

    if (element) {
        element.textContent =
            value;
    }
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

window.searchWallet =
    searchWallet;

window.addWalletFunds =
    addWalletFunds;

window.createCode =
    createCode;

window.toggleCode =
    toggleCode;

window.deleteCode =
    deleteCode;

window.deleteService =
    deleteService;

window.openService =
    openService;

window.showTab =
    showTab;
