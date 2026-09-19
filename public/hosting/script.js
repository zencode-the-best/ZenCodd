const categories = document.querySelectorAll(".category");
const sections = document.querySelectorAll(".plans-section");

const modal = document.getElementById("orderModal");
const closeModal = document.getElementById("closeModal");

const modalPlan = document.getElementById("modalPlan");
const selectedDuration = document.getElementById("selectedDuration");
const selectedPrice = document.getElementById("selectedPrice");

const price7 = document.getElementById("price7");
const price30 = document.getElementById("price30");
const price90 = document.getElementById("price90");

const durationButtons =
    document.querySelectorAll(".duration");

const buyButtons =
    document.querySelectorAll(".buy-button");

const confirmOrder =
    document.getElementById("confirmOrder");

let selectedPlan = "";
let selectedDays = 7;


/* =========================================
   CENY
========================================= */

const prices = {

    "Pakiet Dirt": {
        7: "2,99 zł",
        30: "9,99 zł",
        90: "24,99 zł"
    },

    "Pakiet Obsidian": {
        7: "6,99 zł",
        30: "19,99 zł",
        90: "49,99 zł"
    },

    "Pakiet Złoto": {
        7: "11,99 zł",
        30: "34,99 zł",
        90: "89,99 zł"
    },

    "Pakiet Szmaragd": {
        7: "18,99 zł",
        30: "54,99 zł",
        90: "139,99 zł"
    },

    "Pakiet Diament": {
        7: "29,99 zł",
        30: "84,99 zł",
        90: "219,99 zł"
    }

};


/* =========================================
   KATEGORIE
========================================= */

categories.forEach(category => {

    category.addEventListener("click", () => {

        categories.forEach(item => {
            item.classList.remove("active");
        });

        category.classList.add("active");

        const target =
            category.dataset.category;

        sections.forEach(section => {

            section.classList.remove(
                "active-section"
            );

        });

        const selectedSection =
            document.getElementById(target);

        if (selectedSection) {

            selectedSection.classList.add(
                "active-section"
            );

        }

    });

});


/* =========================================
   OTWIERANIE MODALA
========================================= */

buyButtons.forEach(button => {

    button.addEventListener("click", () => {

        selectedPlan =
            button.dataset.plan;

        const basePlan =
            selectedPlan.split(" — ")[0];

        modalPlan.textContent =
            selectedPlan;

        const planPrices =
            prices[basePlan];

        if (!planPrices) {
            return;
        }

        price7.textContent =
            planPrices[7];

        price30.textContent =
            planPrices[30];

        price90.textContent =
            planPrices[90];

        selectedDays = 7;

        durationButtons.forEach(item => {
            item.classList.remove("active");
        });

        durationButtons[0].classList.add("active");

        selectedDuration.textContent =
            "7 dni";

        selectedPrice.textContent =
            planPrices[7];

        modal.classList.add("show");

    });

});


/* =========================================
   CZAS TRWANIA
========================================= */

durationButtons.forEach(button => {

    button.addEventListener("click", () => {

        const days =
            Number(button.dataset.days);

        const basePlan =
            selectedPlan.split(" — ")[0];

        const planPrices =
            prices[basePlan];

        if (!planPrices) {
            return;
        }

        durationButtons.forEach(item => {
            item.classList.remove("active");
        });

        button.classList.add("active");

        selectedDays = days;

        selectedDuration.textContent =
            `${days} dni`;

        selectedPrice.textContent =
            planPrices[days];

    });

});


/* =========================================
   ZAMKNIĘCIE
========================================= */

closeModal.addEventListener("click", () => {

    modal.classList.remove("show");

});


modal.addEventListener("click", event => {

    if (event.target === modal) {

        modal.classList.remove("show");

    }

});


/* =========================================
   ZAMÓWIENIE
========================================= */

confirmOrder.addEventListener("click", async () => {

    if (!selectedPlan) {
        return;
    }

    const basePlan =
        selectedPlan.split(" — ")[0];

    const planPrices =
        prices[basePlan];

    const price =
        planPrices[selectedDays];

    alert(
        `Wybrano ${selectedPlan}\n` +
        `Okres: ${selectedDays} dni\n` +
        `Cena: ${price}\n\n` +
        `System płatności i tworzenia usługi zostanie podłączony w kolejnym etapie.`
    );

});


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
            ).textContent = "Gość";

            return;

        }

        document.getElementById(
            "username"
        ).textContent =
            data.username || "Użytkownik";

        document.getElementById(
            "userAvatar"
        ).src =
            data.avatar ||
            "https://cdn.discordapp.com/embed/avatars/0.png";

    } catch (error) {

        console.error(
            "Nie udało się pobrać użytkownika:",
            error
        );

        document.getElementById(
            "username"
        ).textContent =
            "Użytkownik";

    }

}


loadUser();
