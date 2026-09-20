const modal =
    document.getElementById("serviceModal");

const closeModal =
    document.getElementById("closeModal");

const modalTitle =
    document.getElementById("modalTitle");

const modalDescription =
    document.getElementById("modalDescription");

const serviceOptions =
    document.getElementById("serviceOptions");

const walletBalance =
    document.getElementById("walletBalance");

const serviceButtons =
    document.querySelectorAll(
        ".service-button"
    );


const services = {

    minecraft: {

        title: "Serwery Minecraft",

        description:
            "Wybierz serwer Minecraft, aby przejść do wyboru pakietu.",

        options: [

            {
                icon: "⛏️",
                title: "Hosting Minecraft",
                description:
                    "Dirt, Obsidian, Złoto, Szmaragd i Diament.",
                url:
                    "/hosting/server.html"
            }

        ]

    },


    discord: {

        title: "Boty Discord",

        description:
            "Wybierz pakiet hostingu dla swojego bota Discord.",

        options: [

            {
                icon: "🤖",
                title: "Discord Bot Hosting",
                description:
                    "Hosting botów Discord 24/7.",
                url:
                    "/hosting/order.html?service=discord"
            }

        ]

    },


    web: {

        title: "Hosting WWW",

        description:
            "Wybierz pakiet dla swojej strony internetowej.",

        options: [

            {
                icon: "🌐",
                title: "Web Hosting",
                description:
                    "Hosting stron WWW i projektów.",
                url:
                    "/hosting/order.html?service=web"
            }

        ]

    }

};


/* =========================================
   PORTFEL
========================================= */

async function loadWallet() {

    if (!walletBalance) {
        return;
    }

    try {

        const response =
            await fetch(
                "/api/wallet",
                {
                    credentials: "include"
                }
            );

        if (!response.ok) {

            walletBalance.textContent =
                "Zaloguj się";

            return;

        }

        const data =
            await response.json();

        const balance =
            Number(data.balance || 0);

        walletBalance.textContent =
            balance
                .toFixed(2)
                .replace(".", ",") +
            " zł";

    } catch (error) {

        console.error(
            "Błąd portfela:",
            error
        );

        walletBalance.textContent =
            "—";

    }

}


/* =========================================
   OTWIERANIE MODALA
========================================= */

function openService(serviceId) {

    const service =
        services[serviceId];

    if (!service) {
        return;
    }

    modalTitle.textContent =
        service.title;

    modalDescription.textContent =
        service.description;


    serviceOptions.innerHTML =
        service.options
            .map(
                option => `

                    <button
                        class="option"
                        type="button"
                        data-url="${option.url}">

                        <span class="option-icon">
                            ${option.icon}
                        </span>

                        <span class="option-text">

                            <strong>
                                ${escapeHTML(
                                    option.title
                                )}
                            </strong>

                            <small>
                                ${escapeHTML(
                                    option.description
                                )}
                            </small>

                        </span>

                        <span class="option-arrow">
                            →
                        </span>

                    </button>

                `
            )
            .join("");


    serviceOptions
        .querySelectorAll(".option")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const url =
                        button.dataset.url;

                    if (url) {
                        window.location.href =
                            url;
                    }

                }
            );

        });


    modal.classList.add("show");

    document.body.style.overflow =
        "hidden";

}


/* =========================================
   ZAMYKANIE MODALA
========================================= */

function closeServiceModal() {

    modal.classList.remove("show");

    document.body.style.overflow =
        "";

}


serviceButtons.forEach(button => {

    button.addEventListener(
        "click",
        () => {

            const service =
                button.dataset.service;

            openService(service);

        }
    );

});


closeModal.addEventListener(
    "click",
    closeServiceModal
);


modal.addEventListener(
    "click",
    event => {

        if (
            event.target.classList
                .contains("modal-backdrop")
        ) {

            closeServiceModal();

        }

    }
);


document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape" &&
            modal.classList.contains("show")
        ) {

            closeServiceModal();

        }

    }
);


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

loadWallet();
