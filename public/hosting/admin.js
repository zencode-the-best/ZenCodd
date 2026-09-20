const servicesContainer =
    document.getElementById("services");

const codesContainer =
    document.getElementById("codes");

const refreshButton =
    document.getElementById("refreshServices");

const createButton =
    document.getElementById("create");

const walletSearchInput =
    document.getElementById("walletSearch");

const walletSearchButton =
    document.getElementById(
        "walletSearchButton"
    );

const walletResults =
    document.getElementById(
        "walletResults"
    );

const walletEditor =
    document.getElementById(
        "walletEditor"
    );

const walletSearchMessage =
    document.getElementById(
        "walletSearchMessage"
    );


let selectedWalletUser = null;


/* =========================================
   USŁUGI
========================================= */

async function loadServices() {

    servicesContainer.innerHTML =
        '<div class="card">Ładowanie usług...</div>';

    try {

        const response =
            await fetch(
                "/api/hosting/admin/services",
                {
                    credentials: "include"
                }
            );

        const data =
            await response.json();

        if (
            !response.ok ||
            !data.success
        ) {

            servicesContainer.innerHTML = `
                <div class="card">

                    <h3>
                        Brak dostępu
                    </h3>

                    <p>
                        Nie masz uprawnień do zarządzania
                        usługami ZenityHost.
                    </p>

                </div>
            `;

            return;

        }


        if (!data.services.length) {

            servicesContainer.innerHTML = `
                <div class="card">

                    <h3>
                        Brak usług
                    </h3>

                    <p>
                        Aktualnie nie ma żadnych
                        utworzonych usług.
                    </p>

                </div>
            `;

            return;

        }


        servicesContainer.innerHTML =
            data.services
                .map(service => `

                    <div class="card">

                        <h3>
                            🖥️
                            ${escapeHTML(
                                service.name ||
                                "Serwer"
                            )}
                        </h3>

                        <p>
                            👤 Właściciel:
                            ${escapeHTML(
                                service.ownerUsername ||
                                service.ownerId ||
                                "Nieznany"
                            )}
                        </p>

                        <p>
                            📦 Pakiet:
                            ${escapeHTML(
                                service.plan ||
                                "Nieznany"
                            )}
                        </p>

                        <p>
                            ⏱️ Termin:
                            ${escapeHTML(
                                service.expiresAt ||
                                "Brak"
                            )}
                        </p>

                        <span class="status">
                            ${escapeHTML(
                                service.status ||
                                "offline"
                            )}
                        </span>

                    </div>

                `)
                .join("");


    } catch (error) {

        console.error(error);

        servicesContainer.innerHTML = `
            <div class="card">

                <h3>
                    Błąd
                </h3>

                <p>
                    Nie udało się pobrać usług.
                </p>

            </div>
        `;

    }

}


/* =========================================
   KODY
========================================= */

async function loadCodes() {

    codesContainer.innerHTML =
        '<div class="code">Ładowanie kodów...</div>';

    try {

        const response =
            await fetch(
                "/api/hosting/admin/codes",
                {
                    credentials: "include"
                }
            );

        const data =
            await response.json();

        if (
            !response.ok ||
            !data.success
        ) {

            codesContainer.innerHTML = `
                <div class="code">
                    Brak dostępu.
                </div>
            `;

            return;

        }


        if (!data.codes.length) {

            codesContainer.innerHTML = `
                <div class="code">
                    Nie utworzono jeszcze żadnego kodu.
                </div>
            `;

            return;

        }


        codesContainer.innerHTML =
            data.codes
                .map(code => `

                    <div class="code">

                        <strong>
                            ${escapeHTML(
                                code.code
                            )}
                        </strong>

                        <p>
                            Rabat:
                            ${Number(
                                code.discount
                            )}%
                        </p>

                        <p>
                            Status:
                            <span class="${
                                code.active
                                    ? "active"
                                    : "inactive"
                            }">
                                ${
                                    code.active
                                        ? "AKTYWNY"
                                        : "NIEAKTYWNY"
                                }
                            </span>
                        </p>

                        <p>
                            ${
                                code.expiresAt
                                    ? "Wygasa: " +
                                      new Date(
                                          code.expiresAt
                                      ).toLocaleString(
                                          "pl-PL"
                                      )
                                    : "Bez terminu wygaśnięcia"
                            }
                        </p>

                        <button
                            type="button"
                            onclick="deleteCode('${escapeHTML(
                                code.id
                            )}')">

                            Usuń kod

                        </button>

                    </div>

                `)
                .join("");


    } catch (error) {

        console.error(error);

        codesContainer.innerHTML = `
            <div class="code">
                Błąd podczas pobierania kodów.
            </div>
        `;

    }

}


/* =========================================
   UTWÓRZ KOD
========================================= */

createButton.addEventListener(
    "click",
    async () => {

        const code =
            document
                .getElementById("code")
                .value
                .trim()
                .toUpperCase();

        const discount =
            Number(
                document
                    .getElementById("discount")
                    .value
            );

        const days =
            Number(
                document
                    .getElementById("days")
                    .value || 0
            );


        if (!code) {

            alert("Podaj kod.");

            return;

        }


        if (
            !Number.isFinite(discount) ||
            discount < 1 ||
            discount > 100
        ) {

            alert(
                "Rabat musi wynosić od 1 do 100%."
            );

            return;

        }


        if (
            !Number.isFinite(days) ||
            days < 0
        ) {

            alert(
                "Ważność kodu jest nieprawidłowa."
            );

            return;

        }


        createButton.disabled = true;

        try {

            const response =
                await fetch(
                    "/api/hosting/admin/codes",
                    {
                        method: "POST",

                        credentials: "include",

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

            const data =
                await response.json();


            if (
                !response.ok ||
                !data.success
            ) {

                alert(
                    data.message ||
                    "Nie udało się utworzyć kodu."
                );

                return;

            }


            alert(
                "Kod został utworzony."
            );


            document
                .getElementById("code")
                .value = "";

            document
                .getElementById("discount")
                .value = "";

            document
                .getElementById("days")
                .value = "";


            await loadCodes();


        } catch (error) {

            console.error(error);

            alert(
                "Wystąpił błąd podczas tworzenia kodu."
            );

        } finally {

            createButton.disabled = false;

        }

    }
);


/* =========================================
   USUŃ KOD
========================================= */

async function deleteCode(id) {

    if (
        !confirm(
            "Czy na pewno chcesz usunąć ten kod?"
        )
    ) {

        return;

    }


    try {

        const response =
            await fetch(
                `/api/hosting/admin/codes/${encodeURIComponent(id)}`,
                {
                    method: "DELETE",

                    credentials:
                        "include"
                }
            );

        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            alert(
                data.message ||
                "Nie udało się usunąć kodu."
            );

            return;

        }


        await loadCodes();


    } catch (error) {

        console.error(error);

        alert(
            "Wystąpił błąd podczas usuwania kodu."
        );

    }

}


/* =========================================
   WYSZUKIWANIE PORTFELA
========================================= */

async function searchWalletUser() {

    const query =
        walletSearchInput
            .value
            .trim();


    if (!query) {

        walletSearchMessage.textContent =
            "Wpisz Discord ID, nick lub e-mail.";

        walletSearchMessage.className =
            "wallet-message wallet-error";

        walletResults.innerHTML = "";

        return;

    }


    walletSearchButton.disabled =
        true;

    walletSearchMessage.textContent =
        "Szukanie...";

    walletSearchMessage.className =
        "wallet-message";


    try {

        const response =
            await fetch(
                `/api/wallet/admin/search?q=${encodeURIComponent(
                    query
                )}`,
                {
                    credentials: "include"
                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            walletSearchMessage.textContent =
                data.message ||
                "Nie udało się wyszukać użytkownika.";

            walletSearchMessage.className =
                "wallet-message wallet-error";

            walletResults.innerHTML = "";

            return;

        }


        if (!data.users.length) {

            walletSearchMessage.textContent =
                "Nie znaleziono użytkownika w zapisanych portfelach.";

            walletSearchMessage.className =
                "wallet-message wallet-error";

            walletResults.innerHTML = "";

            return;

        }


        walletSearchMessage.textContent =
            `Znaleziono: ${data.users.length}`;

        walletSearchMessage.className =
            "wallet-message wallet-success";


        walletResults.innerHTML =
            data.users
                .map(
                    user => `

                        <button
                            type="button"
                            class="wallet-user"
                            data-user-id="${escapeHTML(
                                user.userId
                            )}">

                            <span class="wallet-user-icon">
                                👤
                            </span>

                            <span class="wallet-user-info">

                                <strong>
                                    ${escapeHTML(
                                        user.username ||
                                        "Nieznany"
                                    )}
                                </strong>

                                <small>
                                    ${escapeHTML(
                                        user.email ||
                                        user.userId
                                    )}
                                </small>

                            </span>

                            <span class="wallet-user-balance">
                                ${formatMoney(
                                    user.balance
                                )}
                            </span>

                        </button>

                    `
                )
                .join("");


        walletResults
            .querySelectorAll(".wallet-user")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        const user =
                            data.users.find(
                                item =>
                                    String(
                                        item.userId
                                    ) ===
                                    String(
                                        button.dataset.userId
                                    )
                            );

                        if (user) {

                            selectWalletUser(
                                user
                            );

                        }

                    }
                );

            });


    } catch (error) {

        console.error(error);

        walletSearchMessage.textContent =
            "Błąd podczas wyszukiwania.";

        walletSearchMessage.className =
            "wallet-message wallet-error";


    } finally {

        walletSearchButton.disabled =
            false;

    }

}


/* =========================================
   WYBÓR UŻYTKOWNIKA
========================================= */

function selectWalletUser(user) {

    selectedWalletUser =
        user;


    document
        .querySelectorAll(
            ".wallet-user"
        )
        .forEach(
            item =>
                item.classList.toggle(
                    "selected",
                    String(
                        item.dataset.userId
                    ) ===
                    String(
                        user.userId
                    )
                )
        );


    walletEditor.innerHTML = `

        <div class="selected-user">

            <div class="selected-user-label">
                WYBRANY UŻYTKOWNIK
            </div>

            <h3>
                ${escapeHTML(
                    user.username ||
                    "Nieznany"
                )}
            </h3>

            <p>
                Discord ID:
                ${escapeHTML(
                    user.userId
                )}
            </p>

            <p>
                ${
                    user.email
                        ? escapeHTML(
                            user.email
                        )
                        : "Brak adresu e-mail"
                }
            </p>

        </div>


        <div class="current-balance">

            <span>
                AKTUALNE SALDO
            </span>

            <strong id="selectedBalance">
                ${formatMoney(
                    user.balance
                )}
            </strong>

        </div>


        <div class="add-money">

            <label>
                Kwota administracyjna
            </label>

            <div class="add-money-row">

                <input
                    id="walletAmount"
                    type="number"
                    min="0.01"
                    max="10000"
                    step="0.01"
                    placeholder="np. 20">

                <button
                    id="addWalletMoney"
                    type="button">

                    + Dodaj środki

                </button>

            </div>

        </div>


        <div
            id="walletActionMessage"
            class="wallet-message">

        </div>


        <div
            id="walletTransactions"
            class="transaction-list">

            <div class="transaction-title">
                OSTATNIE TRANSAKCJE
            </div>

            Ładowanie...

        </div>

    `;


    const addButton =
        document.getElementById(
            "addWalletMoney"
        );


    addButton.addEventListener(
        "click",
        addWalletMoney
    );


    loadWalletTransactions(
        user.userId
    );

}


/* =========================================
   DODANIE ŚRODKÓW
========================================= */

async function addWalletMoney() {

    if (!selectedWalletUser) {

        return;

    }


    const amountInput =
        document.getElementById(
            "walletAmount"
        );

    const message =
        document.getElementById(
            "walletActionMessage"
        );


    const amount =
        Number(
            amountInput.value
        );


    if (
        !Number.isFinite(amount) ||
        amount <= 0
    ) {

        message.textContent =
            "Podaj prawidłową kwotę.";

        message.className =
            "wallet-message wallet-error";

        return;

    }


    if (amount > 10000) {

        message.textContent =
            "Maksymalna kwota to 10000 zł.";

        message.className =
            "wallet-message wallet-error";

        return;

    }


    const confirmed =
        confirm(
            `Dodać ${formatMoney(
                amount
            )} do portfela użytkownika ${selectedWalletUser.username || "użytkownika"}?`
        );


    if (!confirmed) {

        return;

    }


    const addButton =
        document.getElementById(
            "addWalletMoney"
        );


    addButton.disabled =
        true;


    try {

        const response =
            await fetch(
                "/api/wallet/admin/add",
                {
                    method: "POST",

                    credentials:
                        "include",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({

                            userId:
                                selectedWalletUser.userId,

                            username:
                                selectedWalletUser.username,

                            email:
                                selectedWalletUser.email,

                            amount

                        })

                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            message.textContent =
                data.message ||
                "Nie udało się dodać środków.";

            message.className =
                "wallet-message wallet-error";

            return;

        }


        selectedWalletUser.balance =
            Number(
                data.wallet.balance
            );


        const balanceElement =
            document.getElementById(
                "selectedBalance"
            );


        if (balanceElement) {

            balanceElement.textContent =
                formatMoney(
                    data.wallet.balance
                );

        }


        amountInput.value =
            "";


        message.textContent =
            `Dodano ${formatMoney(
                amount
            )}. Nowe saldo: ${formatMoney(
                data.wallet.balance
            )}.`;

        message.className =
            "wallet-message wallet-success";


        await loadWalletTransactions(
            selectedWalletUser.userId
        );


        await searchWalletUser();


    } catch (error) {

        console.error(error);

        message.textContent =
            "Wystąpił błąd podczas dodawania środków.";

        message.className =
            "wallet-message wallet-error";

    } finally {

        addButton.disabled =
            false;

    }

}


/* =========================================
   TRANSAKCJE
========================================= */

async function loadWalletTransactions(
    userId
) {

    const container =
        document.getElementById(
            "walletTransactions"
        );


    if (!container) {

        return;

    }


    try {

        const response =
            await fetch(
                `/api/wallet/admin/transactions/${encodeURIComponent(
                    userId
                )}`,
                {
                    credentials:
                        "include"
                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            container.innerHTML = `
                <div class="transaction-title">
                    Nie udało się pobrać transakcji.
                </div>
            `;

            return;

        }


        const transactions =
            data.transactions
                .slice(0, 6);


        if (!transactions.length) {

            container.innerHTML = `
                <div class="transaction-title">
                    OSTATNIE TRANSAKCJE
                </div>

                <div class="transaction">
                    <span>
                        Brak transakcji
                    </span>
                </div>
            `;

            return;

        }


        container.innerHTML = `

            <div class="transaction-title">
                OSTATNIE TRANSAKCJE
            </div>

            ${
                transactions
                    .map(
                        transaction => `

                            <div class="transaction">

                                <span>
                                    ${formatTransactionType(
                                        transaction
                                    )}
                                    ·
                                    ${formatDate(
                                        transaction.createdAt
                                    )}
                                </span>

                                <strong>
                                    ${
                                        Number(
                                            transaction.amount
                                        ) >= 0
                                            ? "+"
                                            : ""
                                    }${formatMoney(
                                        transaction.amount
                                    )}
                                </strong>

                            </div>

                        `
                    )
                    .join("")
            }

        `;


    } catch (error) {

        console.error(error);

        container.innerHTML = `
            <div class="transaction-title">
                Błąd podczas pobierania transakcji.
            </div>
        `;

    }

}


/* =========================================
   FORMATOWANIE
========================================= */

function formatMoney(amount) {

    return Number(
        amount || 0
    )
        .toFixed(2)
        .replace(".", ",") +
        " zł";

}


function formatDate(date) {

    if (!date) {

        return "—";

    }


    return new Date(
        date
    ).toLocaleString(
        "pl-PL",
        {
            dateStyle: "short",
            timeStyle: "short"
        }
    );

}


function formatTransactionType(
    transaction
) {

    if (
        transaction.type ===
        "admin_credit"
    ) {

        return "CEO";

    }

    if (
        transaction.type ===
        "topup"
    ) {

        return "Doładowanie";

    }

    return transaction.type ||
        "Transakcja";

}


/* =========================================
   HTML
========================================= */

function escapeHTML(value) {

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


/* =========================================
   ENTER W WYSZUKIWANIU
========================================= */

walletSearchInput.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Enter"
        ) {

            searchWalletUser();

        }

    }
);


walletSearchButton.addEventListener(
    "click",
    searchWalletUser
);


/* =========================================
   START
========================================= */

refreshButton.addEventListener(
    "click",
    loadServices
);

loadServices();
loadCodes();
