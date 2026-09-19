let currentUser = null;

function showPopup(title, message) {

    const popup = document.createElement("div");

    popup.innerHTML = `
        <div class="zc-overlay">
            <div class="zc-modal">
                <h2>${title}</h2>
                <p>${message}</p>
                <button id="closePopup">
                    Zamknij
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(popup);

    document
    .getElementById("closePopup")
    .onclick = () => popup.remove();

}

async function loadUser() {

    const res = await fetch("/api/user");
    const data = await res.json();

    currentUser = data;

    const loginBtn =
        document.querySelector(".login-btn");

    if (!data.logged) {

        loginBtn.innerHTML =
            "🔐 Zaloguj przez Discord";

        loginBtn.onclick = () => {
            location.href =
                "/auth/discord";
        };

        return;
    }

    let badge = "";

    if (data.premium)
        badge = " ⭐ PREMIUM";

    if (data.subscriber)
        badge = " 👑 SUB";

    loginBtn.innerHTML = `
        <img src="${data.avatar}"
        style="
        width:34px;
        height:34px;
        border-radius:50%;
        margin-right:8px;
        vertical-align:middle;
        ">
        ${data.username}${badge}
    `;

    loginBtn.onclick = () => {
        location.href = "/logout";
    };

}

function setupCreators() {

    document
    .querySelectorAll(".creator")
    .forEach(card => {

        card.addEventListener("click", () => {

            const role =
                card.dataset.role;

            if (!role) {

                location.href =
                    "/creator";

                return;
            }

            if (!currentUser?.logged) {

                showPopup(
                    "🔐 Logowanie wymagane",
                    "Najpierw zaloguj się przez Discord."
                );

                return;
            }

            if (
                role === "premium" &&
                !currentUser.premium
            ) {

                showPopup(
                    "⭐ Premium",
                    "Ta funkcja wymaga rangi Premium."
                );

                return;
            }

            if (
                role === "subscriber" &&
                !currentUser.subscriber
            ) {

                showPopup(
                    "👑 Subskrybent",
                    "Ta funkcja wymaga Subskrypcji."
                );

                return;
            }

            showPopup(
                "🚀 Już wkrótce",
                "Ten kreator jest jeszcze w budowie."
            );

        });

    });

}

loadUser().then(setupCreators);
