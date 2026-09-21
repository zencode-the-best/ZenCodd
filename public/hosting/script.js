const prices = {
    minecraft: {
        Dirt: {
            7: 2.99,
            30: 9.99,
            90: 24.99
        },
        Obsidian: {
            7: 6.99,
            30: 19.99,
            90: 49.99
        },
        Złoto: {
            7: 11.99,
            30: 34.99,
            90: 89.99
        },
        Szmaragd: {
            7: 18.99,
            30: 54.99,
            90: 139.99
        },
        Diament: {
            7: 29.99,
            30: 84.99,
            90: 219.99
        }
    },

    discord: {
        "Bot Start": {
            7: 1,
            30: 3,
            90: 8
        },
        "Bot Plus": {
            7: 2,
            30: 6,
            90: 15
        },
        "Bot PRO": {
            7: 4,
            30: 10,
            90: 25
        }
    },

    web: {
        "WWW Start": {
            7: 2,
            30: 5,
            90: 12
        },
        "WWW Plus": {
            7: 4,
            30: 10,
            90: 25
        },
        "WWW PRO": {
            7: 7,
            30: 18,
            90: 45
        }
    }
};

const serviceNames = {
    minecraft: "Serwer Minecraft",
    discord: "Hosting bota Discord",
    web: "Web Hosting"
};

let selectedService = null;
let discount = 0;

const selector =
    document.getElementById("selector");

const packageSelect =
    document.getElementById("packageSelect");

const durationSelect =
    document.getElementById("durationSelect");

const walletBalance =
    document.getElementById("walletBalance");

const purchaseMessage =
    document.getElementById("purchaseMessage");

const discountMessage =
    document.getElementById("discountMessage");

function money(value) {
    return Number(value || 0)
        .toFixed(2) + " zł";
}

async function loadWallet() {
    try {
        const response =
            await fetch(
                "/api/wallet"
            );

        if (!response.ok) {
            return;
        }

        const data =
            await response.json();

        walletBalance.textContent =
            money(data.balance);
    } catch {
        walletBalance.textContent =
            "—";
    }
}

async function loadUser() {
    try {
        const response =
            await fetch(
                "/api/user"
            );

        if (!response.ok) {
            return;
        }

        const user =
            await response.json();

        const id =
            user.id ||
            user.user?.id;

        if (
            id ===
            "1238570679465410571"
        ) {
            document
                .getElementById(
                    "ceoButton"
                )
                .classList.remove(
                    "hidden"
                );
        }
    } catch {}
}

function fillPackages() {
    packageSelect.innerHTML = "";

    Object.keys(
        prices[selectedService]
    ).forEach(packageName => {
        const option =
            document.createElement(
                "option"
            );

        option.value =
            packageName;

        option.textContent =
            packageName;

        packageSelect.appendChild(
            option
        );
    });
}

function calculatePrice() {
    if (!selectedService) {
        return 0;
    }

    const packageName =
        packageSelect.value;

    const days =
        Number(
            durationSelect.value
        );

    let price =
        Number(
            prices[
                selectedService
            ][packageName][days]
        );

    if (discount > 0) {
        price =
            price *
            (1 - discount / 100);
    }

    return Number(
        price.toFixed(2)
    );
}

function updateSummary() {
    const packageName =
        packageSelect.value;

    const days =
        Number(
            durationSelect.value
        );

    const price =
        calculatePrice();

    document.getElementById(
        "summaryService"
    ).textContent =
        serviceNames[
            selectedService
        ];

    document.getElementById(
        "summaryPackage"
    ).textContent =
        packageName;

    document.getElementById(
        "summaryDays"
    ).textContent =
        `${days} dni`;

    document.getElementById(
        "summaryPrice"
    ).textContent =
        money(price);

    document.getElementById(
        "purchaseButton"
    ).textContent =
        `Kup za ${money(price)}`;
}

function openSelector(service) {
    selectedService = service;
    discount = 0;

    document.getElementById(
        "discountInput"
    ).value = "";

    discountMessage.textContent =
        "";

    purchaseMessage.textContent =
        "";

    document.getElementById(
        "selectedType"
    ).textContent =
        service.toUpperCase();

    document.getElementById(
        "selectedTitle"
    ).textContent =
        serviceNames[service];

    fillPackages();

    updateSummary();

    selector.classList.remove(
        "hidden"
    );

    selector.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

document
    .querySelectorAll(
        ".go-button"
    )
    .forEach(button => {
        button.addEventListener(
            "click",
            () => {
                openSelector(
                    button.dataset.service
                );
            }
        );
    });

document
    .getElementById(
        "closeSelector"
    )
    .addEventListener(
        "click",
        () => {
            selector.classList.add(
                "hidden"
            );
        }
    );

packageSelect.addEventListener(
    "change",
    updateSummary
);

durationSelect.addEventListener(
    "change",
    updateSummary
);

document
    .getElementById(
        "discountButton"
    )
    .addEventListener(
        "click",
        async () => {
            const code =
                document
                    .getElementById(
                        "discountInput"
                    )
                    .value
                    .trim();

            if (!code) {
                discount = 0;

                discountMessage.textContent =
                    "Wpisz kod rabatowy.";

                updateSummary();

                return;
            }

            try {
                const response =
                    await fetch(
                        "/api/hosting/codes/check",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify({
                                    code
                                })
                        }
                    );

                const data =
                    await response.json();

                if (!data.success) {
                    discount = 0;

                    discountMessage.textContent =
                        data.message;

                    updateSummary();

                    return;
                }

                discount =
                    Number(
                        data.discount
                    ) || 0;

                discountMessage.textContent =
                    `✓ Rabat ${discount}% został aktywowany.`;

                updateSummary();
            } catch {
                discountMessage.textContent =
                    "Nie udało się sprawdzić kodu.";
            }
        }
    );

document
    .getElementById(
        "purchaseButton"
    )
    .addEventListener(
        "click",
        async () => {
            if (!selectedService) {
                return;
            }

            const packageName =
                packageSelect.value;

            const days =
                Number(
                    durationSelect.value
                );

            const discountCode =
                document
                    .getElementById(
                        "discountInput"
                    )
                    .value
                    .trim();

            const price =
                calculatePrice();

            purchaseMessage.textContent =
                "Tworzenie zamówienia...";

            try {
                const response =
                    await fetch(
                        "/api/hosting/purchase",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify({
                                    service:
                                        selectedService,

                                    packageName,

                                    days,

                                    discountCode
                                })
                        }
                    );

                const data =
                    await response.json();

                if (!data.success) {
                    purchaseMessage.textContent =
                        data.message;

                    return;
                }

                purchaseMessage.textContent =
                    `✓ Zamówienie ${data.service.id} zostało zapisane za ${money(price)}.`;

                walletBalance.textContent =
                    money(data.balance);

                await loadServices();
            } catch {
                purchaseMessage.textContent =
                    "Wystąpił błąd podczas zakupu.";
            }
        }
    );

async function loadServices() {
    const container =
        document.getElementById(
            "myServices"
        );

    try {
        const response =
            await fetch(
                "/api/hosting/services"
            );

        if (!response.ok) {
            container.innerHTML = `
                <div class="empty-box">
                    Zaloguj się, aby zobaczyć swoje usługi.
                </div>
            `;

            return;
        }

        const data =
            await response.json();

        if (
            !data.services ||
            data.services.length === 0
        ) {
            container.innerHTML = `
                <div class="empty-box">
                    Nie masz jeszcze żadnych usług.
                </div>
            `;

            return;
        }

        container.innerHTML =
            data.services
                .map(service => `
                    <div class="my-service">

                        <h3>
                            ${escapeHTML(
                                service.package
                            )}
                        </h3>

                        <p>
                            ${escapeHTML(
                                service.type
                            )}
                        </p>

                        <p>
                            ${service.days} dni
                        </p>

                        <p>
                            ${money(
                                service.price
                            )}
                        </p>

                        <span class="status">
                            ${statusText(
                                service.status
                            )}
                        </span>

                    </div>
                `)
                .join("");
    } catch {
        container.innerHTML = `
            <div class="empty-box">
                Nie udało się pobrać usług.
            </div>
        `;
    }
}

function statusText(status) {
    if (
        status ===
        "awaiting_provisioning"
    ) {
        return "Oczekuje na uruchomienie";
    }

    if (status === "active") {
        return "Aktywna";
    }

    return status || "Nieznany";
}

function escapeHTML(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

loadWallet();
loadUser();
loadServices();
