let currentUser = null;

async function loadUser() {

    try {

        const res = await fetch("/api/user");
        const data = await res.json();

        currentUser = data;

        const loginBtn =
            document.querySelector(".login-btn");

        if (!data.logged) {

            loginBtn.innerHTML =
                "🔐 Zaloguj przez Discord";

            loginBtn.onclick = () => {
                location.href = "/auth/discord";
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
                vertical-align:middle;
                margin-right:8px;
            ">
            ${data.username}${badge}
        `;

        loginBtn.onclick = () => {
            location.href = "/logout";
        };

    } catch(err) {

        console.log(err);

    }

}

function setupCreators() {

    document
    .querySelectorAll(".creator")
    .forEach(card => {

        card.addEventListener("click", () => {

            const role =
                card.dataset.role;

            if (!role) {
                location.href = "/creator";
                return;
            }

            if (!currentUser?.logged) {

                alert(
                    "Najpierw zaloguj się przez Discord."
                );

                return;
            }

            if (
                role === "premium" &&
                !currentUser.premium
            ) {

                alert(
                    "Ta funkcja wymaga Premium."
                );

                return;
            }

            if (
                role === "subscriber" &&
                !currentUser.subscriber
            ) {

                alert(
                    "Ta funkcja wymaga Subskrypcji."
                );

                return;
            }

            alert(
                "Kreator już wkrótce 🚀"
            );

        });

    });

}

loadUser().then(
    setupCreators
);
