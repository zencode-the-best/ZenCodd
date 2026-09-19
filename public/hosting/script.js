document.addEventListener("DOMContentLoaded", () => {

    const modal = document.getElementById("orderModal");
    const closeModal = document.getElementById("closeModal");
    const modalButton = document.getElementById("modalButton");

    const selectedService =
        document.getElementById("selectedService");

    const modalBalance =
        document.getElementById("modalBalance");

    const username =
        document.getElementById("username");

    const avatar =
        document.getElementById("avatar");

    const balance =
        document.getElementById("balance");

    const cardBalance =
        document.getElementById("cardBalance");


    let userData = {
        username: "Gość",
        avatar: null,
        balance: 0
    };


    function formatMoney(value) {

        return Number(value || 0)
            .toFixed(2)
            .replace(".", ",") + " zł";

    }


    function updateUI() {

        username.textContent =
            userData.username || "Gość";


        if (userData.avatar) {

            avatar.innerHTML =
                `<img src="${userData.avatar}" alt="Avatar">`;

        } else {

            avatar.textContent =
                (userData.username || "G")
                    .charAt(0)
                    .toUpperCase();

        }


        const formatted =
            formatMoney(userData.balance);


        balance.textContent =
            formatted;


        cardBalance.textContent =
            formatted;


        modalBalance.textContent =
            formatted;

    }


    async function loadUser() {

        try {

            const response =
                await fetch("/api/user", {
                    credentials: "include"
                });


            if (!response.ok) {

                updateUI();

                return;

            }


            const data =
                await response.json();


            if (data) {

                userData = {

                    username:
                        data.username ||
                        data.globalName ||
                        "Użytkownik",

                    avatar:
                        data.avatar ||
                        null,

                    balance:
                        Number(data.balance || 0)

                };

            }

        } catch (error) {

            console.log(
                "Nie udało się pobrać danych użytkownika."
            );

        }


        updateUI();

    }


    function openModal(service) {

        selectedService.textContent =
            service;

        modal.classList.add("show");

        document.body.style.overflow =
            "hidden";

    }


    function hideModal() {

        modal.classList.remove("show");

        document.body.style.overflow =
            "";

    }


    document
        .querySelectorAll(".order-button")
        .forEach(button => {

            button.addEventListener("click", () => {

                const service =
                    button.dataset.service;

                openModal(service);

            });

        });


    closeModal.addEventListener(
        "click",
        hideModal
    );


    modalButton.addEventListener(
        "click",
        hideModal
    );


    modal
        .querySelector(".modal-overlay")
        .addEventListener(
            "click",
            hideModal
        );


    document.addEventListener(
        "keydown",
        event => {

            if (event.key === "Escape") {

                hideModal();

            }

        }
    );


    loadUser();

});
