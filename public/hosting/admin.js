let selectedUserId = null;

async function api(url, options = {}) {
    const response =
        await fetch(url, options);

    const data =
        await response.json();

    if (!response.ok) {
        throw new Error(
            data.message ||
            "Wystąpił błąd."
        );
    }

    return data;
}

/* =========================================
   STATYSTYKI
========================================= */

async function loadStats() {
    try {
        const services =
            await api(
                "/api/hosting/admin/services"
            );

        const codes =
            await api(
                "/api/hosting/admin/codes"
            );

        const users =
            await api(
                "/api/wallet/admin/users"
            );

        document.getElementById(
            "statServices"
        ).textContent =
            services.services.length;

        document.getElementById(
            "statCodes"
        ).textContent =
            codes.codes.length;

        document.getElementById(
            "statUsers"
        ).textContent =
            users.users.length;
    } catch {
        document.getElementById(
            "statServices"
        ).textContent = "—";

        document.getElementById(
            "statCodes"
        ).textContent = "—";

        document.getElementById(
            "statUsers"
        ).textContent = "—";
    }
}

/* =========================================
   UŻYTKOWNICY
========================================= */

async function searchUsers() {
    const query =
        document
            .getElementById(
                "userSearch"
            )
            .value
            .trim();

    const list =
        document.getElementById(
            "usersList"
        );

    if (!query) {
        list.innerHTML = `
            <div class="empty">
                Wpisz Discord ID, nick lub e-mail.
            </div>
        `;

        return;
    }

    list.innerHTML = `
        <div class="empty">
            Szukanie...
        </div>
    `;

    try {
        const data =
            await api(
                `/api/wallet/admin/users?query=${encodeURIComponent(query)}`
            );

        if (
            !data.users ||
            data.users.length === 0
        ) {
            list.innerHTML = `
                <div class="empty">
                    Nie znaleziono użytkownika.
                </div>
            `;

            return;
        }

        list.innerHTML =
            data.users
                .map(user => `
                    <div class="user-row">

                        <div>
                            <strong>
                                ${escapeHTML(
                                    user.globalName ||
                                    user.username
                                )}
                            </strong>

                            <small>
                                ID:
                                ${escapeHTML(
                                    user.userId
                                )}
                                ${
                                    user.email
                                        ? ` • ${escapeHTML(user.email)}`
                                        : ""
                                }
                            </small>
                        </div>

                        <button
                            onclick="selectUser('${escapeAttr(user.userId)}')"
                        >
                            Wybierz
                        </button>

                    </div>
                `)
                .join("");
    } catch (error) {
        list.innerHTML = `
            <div class="empty">
                ${escapeHTML(
                    error.message
                )}
            </div>
        `;
    }
}

async function selectUser(userId) {
    selectedUserId = userId;

    const section =
        document.getElementById(
            "selectedUser"
        );

    section.classList.remove(
        "hidden"
    );

    document.getElementById(
        "selectedUserName"
    ).textContent =
        "Ładowanie...";

    try {
        const users =
            await api(
                `/api/wallet/admin/users?query=${encodeURIComponent(userId)}`
            );

        const user =
            users.users.find(
                item =>
                    String(item.userId) ===
                    String(userId)
            );

        const wallet =
            await api(
                `/api/wallet/admin/wallet/${encodeURIComponent(userId)}`
            );

        document.getElementById(
            "selectedUserName"
        ).textContent =
            user
                ? (
                    user.globalName ||
                    user.username
                )
                : userId;

        document.getElementById(
            "selectedUserDetails"
        ).textContent =
            user
                ? `${user.userId}${user.email ? ` • ${user.email}` : ""}`
                : userId;

        document.getElementById(
            "selectedBalance"
        ).textContent =
            money(
                wallet.wallet.balance
            );

        await loadTransactions(
            userId
        );
    } catch (error) {
        document.getElementById(
            "walletMessage"
        ).textContent =
            error.message;
    }
}

/* =========================================
   TRANSAKCJE
========================================= */

async function loadTransactions(userId) {
    const container =
        document.getElementById(
            "userTransactions"
        );

    try {
        const data =
            await api(
                `/api/wallet/admin/transactions?userId=${encodeURIComponent(userId)}`
            );

        if (
            !data.transactions ||
            data.transactions.length === 0
        ) {
            container.innerHTML = `
                <div class="empty">
                    Brak transakcji.
                </div>
            `;

            return;
        }

        container.innerHTML =
            data.transactions
                .slice(0, 20)
                .map(transaction => `
                    <div class="transaction-row">

                        <strong>
                            ${transaction.type === "admin_credit"
                                ? "Dodanie środków przez CEO"
                                : transaction.type === "hosting_purchase"
                                    ? "Zakup hostingu"
                                    : "Doładowanie"}
                        </strong>

                        <small>
                            ${transaction.amount > 0 ? "+" : ""}
                            ${money(transaction.amount)}
                            •
                            ${formatDate(
                                transaction.createdAt
                            )}
                        </small>

                    </div>
                `)
                .join("");
    } catch {
        container.innerHTML = `
            <div class="empty">
                Nie udało się pobrać transakcji.
            </div>
        `;
    }
}

/* =========================================
   DODAWANIE ŚRODKÓW
========================================= */

document
    .getElementById(
        "addMoney"
    )
    .addEventListener(
        "click",
        async () => {
            if (!selectedUserId) {
                return;
            }

            const amount =
                Number(
                    document.getElementById(
                        "addAmount"
                    ).value
                );

            const reason =
                document.getElementById(
                    "addReason"
                ).value.trim();

            const message =
                document.getElementById(
                    "walletMessage"
                );

            if (
                !Number.isFinite(amount) ||
                amount <= 0
            ) {
                message.textContent =
                    "Podaj prawidłową kwotę.";

                return;
            }

            message.textContent =
                "Dodawanie środków...";

            try {
                const data =
                    await api(
                        "/api/wallet/admin/add",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify({
                                    userId:
                                        selectedUserId,

                                    amount,

                                    reason:
                                        reason ||
                                        "Doładowanie przez CEO"
                                })
                        }
                    );

                message.textContent =
                    data.message;

                document.getElementById(
                    "addAmount"
                ).value = "";

                document.getElementById(
                    "addReason"
                ).value = "";

                document.getElementById(
                    "selectedBalance"
                ).textContent =
                    money(
                        data.wallet.balance
                    );

                await loadTransactions(
                    selectedUserId
                );

                await loadStats();
            } catch (error) {
                message.textContent =
                    error.message;
            }
        }
    );

/* =========================================
   USŁUGI
========================================= */

async function loadServices() {
    const container =
        document.getElementById(
            "servicesList"
        );

    try {
        const data =
            await api(
                "/api/hosting/admin/services"
            );

        if (
            !data.services ||
            data.services.length === 0
        ) {
            container.innerHTML = `
                <div class="empty">
                    Brak usług.
                </div>
            `;

            return;
        }

        container.innerHTML =
            data.services
                .map(service => `
                    <div class="service-row">

                        <div>

                            <strong>
                                ${escapeHTML(
                                    service.package
                                )}
                            </strong>

                            <small>
                                ${escapeHTML(
                                    service.type
                                )}
                                •
                                ${service.days} dni
                                •
                                ${money(
                                    service.price
                                )}
                            </small>

                            <br>

                            <small>
                                Użytkownik:
                                ${escapeHTML(
                                    service.ownerUsername
                                )}
                                •
                                ID:
                                ${escapeHTML(
                                    service.ownerId
                                )}
                            </small>

                        </div>

                        <div class="service-actions">

                            <button
                                class="danger"
                                onclick="deleteService('${escapeAttr(service.id)}')"
                            >
                                Usuń
                            </button>

                        </div>

                    </div>
                `)
                .join("");
    } catch (error) {
        container.innerHTML = `
            <div class="empty">
                ${escapeHTML(
                    error.message
                )}
            </div>
        `;
    }
}

async function deleteService(id) {
    const confirmed =
        confirm(
            "Czy na pewno chcesz usunąć tę usługę?"
        );

    if (!confirmed) {
        return;
    }

    try {
        await api(
            `/api/hosting/admin/services/${encodeURIComponent(id)}`,
            {
                method: "DELETE"
            }
        );

        await loadServices();
        await loadStats();
    } catch (error) {
        alert(error.message);
    }
}

document
    .getElementById(
        "refreshServices"
    )
    .addEventListener(
        "click",
        loadServices
    );

/* =========================================
   KODY
========================================= */

async function loadCodes() {
    const container =
        document.getElementById(
            "codesList"
        );

    try {
        const data =
            await api(
                "/api/hosting/admin/codes"
            );

        if (
            !data.codes ||
            data.codes.length === 0
        ) {
            container.innerHTML = `
                <div class="empty">
                    Brak kodów rabatowych.
                </div>
            `;

            return;
        }

        container.innerHTML =
            data.codes
                .map(code => `
                    <div class="code-row">

                        <div>

                            <strong>
                                ${escapeHTML(
                                    code.code
                                )}
                            </strong>

                            <small>
                                Rabat:
                                ${code.discount}%
                                ${
                                    code.expiresAt
                                        ? ` • wygasa ${formatDate(code.expiresAt)}`
                                        : " • bezterminowy"
                                }
                            </small>

                        </div>

                        <div>

                            <span class="${
                                code.active
                                    ? "code-active"
                                    : "code-inactive"
                            }">
                                ${
                                    code.active
                                        ? "AKTYWNY"
                                        : "WYŁĄCZONY"
                                }
                            </span>

                            <button
                                class="danger"
                                onclick="deleteCode('${escapeAttr(code.id)}')"
                            >
                                Usuń
                            </button>

                        </div>

                    </div>
                `)
                .join("");
    } catch (error) {
        container.innerHTML = `
            <div class="empty">
                ${escapeHTML(
                    error.message
                )}
            </div>
        `;
    }
}

document
    .getElementById(
        "createCode"
    )
    .addEventListener(
        "click",
        async () => {
            const code =
                document.getElementById(
                    "code"
                ).value.trim();

            const discount =
                Number(
                    document.getElementById(
                        "discount"
                    ).value
                );

            const days =
                Number(
                    document.getElementById(
                        "codeDays"
                    ).value || 0
                );

            try {
                await api(
                    "/api/hosting/admin/codes",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                code,
                                discount,
                                days
                            })
                    }
                );

                document.getElementById(
                    "code"
                ).value = "";

                document.getElementById(
                    "discount"
                ).value = "";

                document.getElementById(
                    "codeDays"
                ).value = "";

                await loadCodes();
                await loadStats();
            } catch (error) {
                alert(error.message);
            }
        }
    );

async function deleteCode(id) {
    const confirmed =
        confirm(
            "Czy na pewno usunąć ten kod?"
        );

    if (!confirmed) {
        return;
    }

    try {
        await api(
            `/api/hosting/admin/codes/${encodeURIComponent(id)}`,
            {
                method: "DELETE"
            }
        );

        await loadCodes();
        await loadStats();
    } catch (error) {
        alert(error.message);
    }
}

/* =========================================
   POMOCNICZE
========================================= */

function money(value) {
    const number =
        Number(value || 0);

    return (
        number.toFixed(2) +
        " zł"
    );
}

function formatDate(value) {
    if (!value) {
        return "—";
    }

    return new Date(value)
        .toLocaleString(
            "pl-PL"
        );
}

function escapeHTML(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
    return String(value ?? "")
        .replaceAll("\\", "\\\\")
        .replaceAll("'", "\\'");
}

/* =========================================
   START
========================================= */

document
    .getElementById(
        "searchUsers"
    )
    .addEventListener(
        "click",
        searchUsers
    );

document
    .getElementById(
        "userSearch"
    )
    .addEventListener(
        "keydown",
        event => {
            if (
                event.key ===
                "Enter"
            ) {
                searchUsers();
            }
        }
    );

loadStats();
loadServices();
loadCodes();
