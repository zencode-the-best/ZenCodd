const servicesContainer =
    document.getElementById("services");

const codesContainer =
    document.getElementById("codes");

const refreshButton =
    document.getElementById(
        "refreshServices"
    );

const createButton =
    document.getElementById("create");


/* =========================================
   SERWERY
========================================= */

async function loadServices() {

    servicesContainer.innerHTML =
        "Ładowanie...";

    try {

        const response =
            await fetch(
                "/api/hosting/admin/services"
            );

        const data =
            await response.json();

        if (!data.success) {

            servicesContainer.innerHTML =
                "Brak dostępu.";

            return;

        }

        if (!data.services.length) {

            servicesContainer.innerHTML = `
                <div class="card">
                    <h3>Brak serwerów</h3>
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
                .map(
                    service => `

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

                `
                )
                .join("");

    } catch (error) {

        console.error(error);

        servicesContainer.innerHTML =
            "Błąd podczas pobierania serwerów.";

    }

}


/* =========================================
   KODY
========================================= */

async function loadCodes() {

    codesContainer.innerHTML =
        "Ładowanie...";

    try {

        const response =
            await fetch(
                "/api/hosting/admin/codes"
            );

        const data =
            await response.json();

        if (!data.success) {

            codesContainer.innerHTML =
                "Brak dostępu.";

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
                .map(
                    code => `

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
                            onclick="deleteCode(
                                '${code.id}'
                            )">

                            Usuń kod

                        </button>

                    </div>

                `
                )
                .join("");

    } catch (error) {

        console.error(error);

        codesContainer.innerHTML =
            "Błąd podczas pobierania kodów.";

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
            !discount ||
            discount < 1 ||
            discount > 100
        ) {

            alert(
                "Rabat musi wynosić od 1 do 100%."
            );

            return;

        }

        try {

            const response =
                await fetch(
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

            const data =
                await response.json();

            if (!data.success) {

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

            loadCodes();

        } catch (error) {

            console.error(error);

            alert(
                "Wystąpił błąd."
            );

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
                `/api/hosting/admin/codes/${id}`,
                {
                    method: "DELETE"
                }
            );

        const data =
            await response.json();

        if (!data.success) {

            alert(
                "Nie udało się usunąć kodu."
            );

            return;

        }

        loadCodes();

    } catch (error) {

        console.error(error);

        alert(
            "Wystąpił błąd."
        );

    }

}


/* =========================================
   OCHRONA HTML
========================================= */

function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/* =========================================
   START
========================================= */

refreshButton.addEventListener(
    "click",
    loadServices
);

loadServices();
loadCodes();
