const categories =
    document.querySelectorAll(".category");

const sections =
    document.querySelectorAll(".plans");

const buyButtons =
    document.querySelectorAll(".buy");

const modal =
    document.getElementById("modal");

const closeModal =
    document.getElementById("closeModal");

const modalPlan =
    document.getElementById("modalPlan");

const durationButtons =
    document.querySelectorAll(".duration");

const discountCode =
    document.getElementById("discountCode");

const applyCode =
    document.getElementById("applyCode");

const codeMessage =
    document.getElementById("codeMessage");

const selectedDays =
    document.getElementById("selectedDays");

const selectedPrice =
    document.getElementById("selectedPrice");

const price7 =
    document.getElementById("price7");

const price30 =
    document.getElementById("price30");

const price90 =
    document.getElementById("price90");

const adminMenu =
    document.getElementById("adminMenu");

let selectedPlan = "";
let selectedPeriod = 7;
let currentDiscount = 0;


/* =========================================
   CENY
========================================= */

const prices = {

    "Pakiet Dirt": {
        7: 2.99,
        30: 9.99,
        90: 24.99
    },

    "Pakiet Obsidian": {
        7: 6.99,
        30: 19.99,
        90: 49.99
    },

    "Pakiet Złoto": {
        7: 11.99,
        30: 34.99,
        90: 89.99
    },

    "Pakiet Szmaragd": {
        7: 18.99,
        30: 54.99,
        90: 139.99
    },

    "Pakiet Diament": {
        7: 29.99,
        30: 84.99,
        90: 219.99
    }

};


/* =========================================
   FORMATOWANIE CENY
========================================= */

function formatPrice(price) {

    return price
        .toFixed(2)
        .replace(".", ",") +
        " zł";

}


/* =========================================
   KATEGORIE
========================================= */

categories.forEach(button => {

    button.addEventListener(
        "click",
        () => {

            categories.forEach(item => {

                item.classList.remove(
                    "active"
                );

            });

            button.classList.add("active");

            const target =
                button.dataset.category;

            sections.forEach(section => {

                section.classList.remove(
                    "active"
                );

            });

            const selected =
                document.getElementById(
                    target
                );

            if (selected) {

                selected.classList.add(
                    "active"
                );

            }

        }
    );

});


/* =========================================
   OTWARCIE ZAMÓWIENIA
========================================= */

buyButtons.forEach(button => {

    button.addEventListener(
        "click",
        () => {

            selectedPlan =
                button.dataset.plan;

            selectedPeriod = 7;

            currentDiscount = 0;

            discountCode.value = "";

            codeMessage.textContent = "";

            modalPlan.textContent =
                selectedPlan;

            durationButtons.forEach(
                item =>
                    item.classList.remove(
                        "active"
                    )
            );

            durationButtons[0]
                .classList.add("active");

            updatePrices();

            modal.classList.add("show");

        }
    );

});


/* =========================================
   AKTUALIZACJA CEN
========================================= */

function updatePrices() {

    const plan =
        prices[selectedPlan];

    if (!plan) {
        return;
    }

    price7.textContent =
        formatPrice(plan[7]);

    price30.textContent =
        formatPrice(plan[30]);

    price90.textContent =
        formatPrice(plan[90]);

    let price =
        plan[selectedPeriod];

    if (currentDiscount > 0) {

        price =
            price -
            (
                price *
                currentDiscount /
                100
            );

    }

    selectedDays.textContent =
        `${selectedPeriod} dni`;

    selectedPrice.textContent =
        formatPrice(price);

}


/* =========================================
   OKRES
========================================= */

durationButtons.forEach(button => {

    button.addEventListener(
        "click",
        () => {

            durationButtons.forEach(
                item =>
                    item.classList.remove(
                        "active"
                    )
            );

            button.classList.add(
                "active"
            );

            selectedPeriod =
                Number(
                    button.dataset.days
                );

            updatePrices();

        }
    );

});


/* =========================================
   KOD RABATOWY
========================================= */

applyCode.addEventListener(
    "click",
    async () => {

        const code =
            discountCode.value
                .trim()
                .toUpperCase();

        if (!code) {

            currentDiscount = 0;

            codeMessage.textContent =
                "";

            updatePrices();

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

                currentDiscount = 0;

                codeMessage.textContent =
                    data.message ||
                    "Nieprawidłowy kod.";

                codeMessage.style.color =
                    "#e57373";

                updatePrices();

                return;

            }

            currentDiscount =
                Number(
                    data.discount
                );

            codeMessage.textContent =
                `Kod aktywny: -${currentDiscount}%`;

            codeMessage.style.color =
                "#65c98b";

            updatePrices();

        } catch (error) {

            console.error(error);

            codeMessage.textContent =
                "Nie udało się sprawdzić kodu.";

            codeMessage.style.color =
                "#e57373";

        }

    }
);


/* =========================================
   ZAMÓWIENIE
========================================= */

document
    .getElementById("order")
    .addEventListener(
        "click",
        () => {

            const plan =
                prices[selectedPlan];

            if (!plan) {
                return;
            }

            let price =
                plan[selectedPeriod];

            if (currentDiscount > 0) {

                price =
                    price -
                    (
                        price *
                        currentDiscount /
                        100
                    );

            }

            alert(
                "Zamówienie ZenityHost\n\n" +
                `Pakiet: ${selectedPlan}\n` +
                `Okres: ${selectedPeriod} dni\n` +
                `Rabat: ${currentDiscount}%\n` +
                `Cena: ${formatPrice(price)}\n\n` +
                "System płatności i automatycznego tworzenia usługi zostanie podłączony."
            );

        }
    );


/* =========================================
   MODAL
========================================= */

closeModal.addEventListener(
    "click",
    () => {

        modal.classList.remove("show");

    }
);


modal.addEventListener(
    "click",
    event => {

        if (
            event.target === modal
        ) {

            modal.classList.remove(
                "show"
            );

        }

    }
);


/* =========================================
   UŻYTKOWNIK
========================================= */

async function loadUser() {

    try {

        const response =
            await fetch("/api/user");

        const data =
            await response.json();

        if (!data.logged) {

            document.getElementById(
                "username"
            ).textContent =
                "Gość";

            adminMenu.style.display =
                "none";

            return;

        }

        document.getElementById(
            "username"
        ).textContent =
            data.username ||
            "Użytkownik";

        document.getElementById(
            "userAvatar"
        ).src =
            data.avatar ||
            "https://cdn.discordapp.com/embed/avatars/0.png";

        if (!data.owner) {

            adminMenu.style.display =
                "none";

        }

    } catch (error) {

        console.error(error);

        adminMenu.style.display =
            "none";

    }

}


/* =========================================
   MOJE USŁUGI
========================================= */

async function loadServices() {

    const container =
        document.getElementById(
            "servicesList"
        );

    try {

        const response =
            await fetch(
                "/api/hosting/services"
            );

        const data =
            await response.json();

        if (
            !data.success ||
            !data.services.length
        ) {

            container.innerHTML =
                "Nie masz jeszcze żadnych usług.";

            return;

        }

        container.innerHTML =
            data.services
                .map(
                    service => `
                        <div>
                            🖥️ ${service.name || "Serwer"}
                            — ${service.status || "offline"}
                        </div>
                    `
                )
                .join("");

    } catch {

        container.innerHTML =
            "Nie udało się pobrać usług.";

    }

}


loadUser();
loadServices();
